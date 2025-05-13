import { Router } from "express";
import { storage } from "../../storage";

const router = Router();

// Enhanced JSON debugging middleware with special handling for "None"
function debugJsonFields(req, res, next) {
  try {
    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = req.body;
      
      console.log("==== DEBUGGING JSON FIELDS ====");
      console.log("Request path:", req.path);
      console.log("Request method:", req.method);
      
      // First, check for any fields that contain the literal string "None"
      Object.keys(body).forEach(key => {
        if (body[key] === 'None') {
          console.log(`Found literal "None" value in field ${key}, converting to null`);
          body[key] = null;
        }
      });
      
      // Check for specific JSON fields
      const jsonFields = ['emergencyContact', 'languagesSpoken', 'workHistory', 'socialMediaLinks'];
      
      jsonFields.forEach(field => {
        if (field in body) {
          console.log(`Field: ${field}`);
          console.log(`Type: ${typeof body[field]}`);
          
          // Additional check for "None" values specifically in this field
          if (body[field] === 'None') {
            console.log(`Field ${field} contains literal "None" string - replacing with appropriate default`);
            if (field === 'emergencyContact') {
              body[field] = {
                name: '',
                relation: '',
                phone: '',
                email: '',
                address: ''
              };
            } else {
              body[field] = [];
            }
            return; // Skip further processing for this field
          }
          
          // Safely stringify the value for logging
          try {
            console.log(`Value: ${JSON.stringify(body[field])}`);
          } catch (e) {
            console.log(`Value: [Error stringifying: ${e.message}]`);
          }
          
          // If it's a string, try to parse it
          if (typeof body[field] === 'string') {
            try {
              const parsed = JSON.parse(body[field]);
              console.log(`Parsed to: ${typeof parsed} - ${Array.isArray(parsed) ? 'array' : 'object'}`);
            } catch (e) {
              console.log(`Parse error: ${e.message}`);
              
              // Try to identify problematic characters
              const problemChar = e.message.match(/position (\d+)/);
              if (problemChar && problemChar[1]) {
                const pos = parseInt(problemChar[1]);
                console.log(`Problem character at position ${pos}: "${body[field].charAt(pos)}"`);
                console.log(`Context: "${body[field].substring(Math.max(0, pos - 10), pos + 10)}"`);
              }
              
              // Special check for "None" anywhere in the string
              if (body[field].includes('None')) {
                console.log(`Field ${field} contains "None" within its value - this may cause JSON parsing issues`);
                
                // Replace any occurrence of "None" with empty string
                const fixedValue = body[field].replace(/None/g, '""');
                try {
                  JSON.parse(fixedValue);
                  console.log(`Fixed by replacing "None" with empty string`);
                  body[field] = fixedValue;
                  return; // Skip further processing for this field
                } catch (e) {
                  console.log(`Could not fix by replacing "None"`);
                }
              }
              
              // Try to fix common JSON problems automatically
              try {
                // Replace single quotes with double quotes
                const fixedJson = body[field].replace(/'/g, '"');
                const parsed = JSON.parse(fixedJson);
                console.log(`Fixed by replacing single quotes - parsed to: ${typeof parsed}`);
                
                // Update the request body with the fixed JSON
                body[field] = fixedJson;
              } catch (fixError) {
                console.log(`Could not auto-fix: ${fixError.message}`);
                
                // Set default JSON as fallback
                if (field === 'emergencyContact') {
                  body[field] = {
                    name: '',
                    relation: '',
                    phone: '',
                    email: '',
                    address: ''
                  };
                  console.log(`Applied default emergencyContact object`);
                } else {
                  body[field] = [];
                  console.log(`Applied default array for ${field}`);
                }
              }
            }
          }
          
          // If it's an object, ensure it can be stringified
          if (typeof body[field] === 'object' && body[field] !== null) {
            try {
              JSON.stringify(body[field]);
              console.log(`Object can be stringified properly`);
            } catch (e) {
              console.log(`Object cannot be stringified: ${e.message}`);
              
              // Set default JSON as fallback
              if (field === 'emergencyContact') {
                body[field] = {
                  name: '',
                  relation: '',
                  phone: '',
                  email: '',
                  address: ''
                };
              } else {
                body[field] = [];
              }
              console.log(`Applied default object for ${field}`);
            }
          }
          
          console.log("-----------------");
        }
      });
    }
  } catch (error) {
    console.error("Error in debugJsonFields middleware:", error);
  }
  
  // Continue to the next middleware
  next();
}

// Apply JSON debugging middleware
router.use(debugJsonFields);

// Get all youth profiles
router.get('/', async (_req, res, next) => {
  try {
    console.log("Fetching all youth profiles");
    // Get basic youth profiles
    const profiles = await storage.getAllYouthProfiles();
    
    // Get youth-business relationships to add business counts
    const allRelationships = await storage.getAllYouthBusinessRelationships();
    
    // Enhance profiles with business count
    const enhancedProfiles = profiles.map(profile => {
      // Add businessesCount property to each profile
      return {
        ...profile,
        businessesCount: allRelationships[profile.id]?.length || 0
      };
    });
    
    return res.json(enhancedProfiles);
  } catch (error) {
    console.error("Unexpected error in GET youth profiles:", error);
    next(error);
  }
});

// Get a specific youth profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    console.log(`Fetching youth profile ID ${id}`);
    const profile = await storage.getYouthProfile(id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    return res.json(profile);
  } catch (error) {
    console.error("Unexpected error in GET youth profile by ID:", error);
    next(error);
  }
});

// Create a new youth profile
router.post('/', async (req, res, next) => {
  try {
    // Log the incoming request for debugging
    console.log("==== YOUTH PROFILE CREATION REQUEST RECEIVED ====");
    console.log("Request headers:", req.headers['content-type']);
    console.log("Request body keys:", Object.keys(req.body));
    
    // Check if user is authenticated and has permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Admin or users with 'create' permission on 'youth_profiles' can add profiles
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions (using the stored permissions for the user's role)
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canCreateProfiles = permissions.some(p => 
        p.resource === 'youth_profiles' && p.action === 'create'
      );
      
      if (!canCreateProfiles) {
        return res.status(403).json({ 
          message: 'You do not have permission to create youth profiles' 
        });
      }
    }
    
    console.log("Creating new youth profile");
    const profileData = req.body;
    
    // Replace all "None" values with null to avoid JSON parsing errors
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === 'None') {
        console.log(`Found 'None' string value in field ${key}, replacing with null`);
        profileData[key] = null;
      }
    });
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'district'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Ensure fullName is created if not provided
    if (!profileData.fullName && profileData.firstName && profileData.lastName) {
      profileData.fullName = `${profileData.firstName.trim()} ${profileData.middleName ? profileData.middleName.trim() + ' ' : ''}${profileData.lastName.trim()}`;
      console.log("Generated fullName:", profileData.fullName);
    }
    
    // Add audit fields
    profileData.createdAt = new Date();
    profileData.updatedAt = new Date();
    
    // Additional preprocessing for critical fields
    try {
      // Handle JSON fields manually here before passing to storage
      const jsonFields = ['emergencyContact', 'languagesSpoken', 'workHistory', 'socialMediaLinks'];
      
      jsonFields.forEach(field => {
        if (field in profileData) {
          // Special handling for 'None' values
          if (profileData[field] === 'None' || profileData[field] === null) {
            console.log(`Field ${field} has null or "None" value, setting default`);
            if (field === 'emergencyContact') {
              profileData[field] = {
                name: '',
                relation: '',
                phone: '',
                email: '',
                address: ''
              };
            } else {
              profileData[field] = [];
            }
          }
          // If it's already a valid JSON string, leave it alone
          else if (typeof profileData[field] === 'string') {
            try {
              JSON.parse(profileData[field]);
              console.log(`Field ${field} is already a valid JSON string`);
            } catch (e) {
              console.warn(`Invalid JSON string in ${field}, applying default`);
              
              // For invalid JSON strings, set default values
              if (field === 'emergencyContact') {
                profileData[field] = {
                  name: '',
                  relation: '',
                  phone: '',
                  email: '',
                  address: ''
                };
              } else {
                // If it looks like a comma-separated list, convert to array
                if (profileData[field].includes(',')) {
                  const items = profileData[field].split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
                  profileData[field] = items;
                } else if (profileData[field].trim() !== '') {
                  // Single value, make it a single-item array
                  profileData[field] = [profileData[field].trim()];
                } else {
                  // Empty value, use empty array
                  profileData[field] = [];
                }
              }
            }
          } 
          // If it's an object or array, leave it as is
          else if (typeof profileData[field] === 'object' && profileData[field] !== null) {
            console.log(`Field ${field} is already an object or array`);
          }
        }
      });
    } catch (e) {
      console.error("Error preprocessing profile data:", e);
      // Continue processing - the storage layer will handle it
    }
    
    // Create the youth profile
    try {
      const newProfile = await storage.createYouthProfile(profileData);
      return res.status(201).json(newProfile);
    } catch (error) {
      console.error("Database error creating youth profile:", error);
      
      // Provide a helpful error message
      if (error.message && error.message.includes('invalid input syntax for type json')) {
        // Check for "None" token error specifically
        if (error.detail && error.detail.includes('Token "None" is invalid')) {
          return res.status(400).json({
            message: 'Invalid JSON data in profile. Field contains "None" which is not valid JSON.',
            detail: 'Please remove "None" values or replace them with null values.',
            errorType: 'none_token_error'
          });
        } else {
          return res.status(400).json({
            message: 'Invalid JSON data in profile. Please check emergency contact and languages fields.',
            detail: error.message,
            errorType: 'json_syntax_error'
          });
        }
      }
      
      // Re-throw for the global error handler
      throw error;
    }
  } catch (error) {
    console.error("Error creating youth profile:", error);
    next(error);
  }
});

// Update a youth profile
router.patch('/:id', async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    console.log("Updating youth profile ID:", id);
    console.log("Received update data keys:", Object.keys(req.body));
    
    // Check if profile exists
    const existingProfile = await storage.getYouthProfile(id);
    if (!existingProfile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Admin or users with 'edit' permission on 'youth_profiles' can update profiles
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canUpdateProfiles = permissions.some(p => 
        p.resource === 'youth_profiles' && p.action === 'edit'
      );
      
      if (!canUpdateProfiles) {
        return res.status(403).json({ 
          message: 'You do not have permission to update youth profiles' 
        });
      }
    }
    
    // Process incoming data
    const updateData = {...req.body};
    
    // Replace all "None" values with null to avoid JSON parsing errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === 'None') {
        console.log(`Found 'None' string value in field ${key}, replacing with null`);
        updateData[key] = null;
      }
    });
    
    // Ensure fullName is updated if first/last name changed
    if ((updateData.firstName || updateData.lastName) && 
        (updateData.firstName !== existingProfile.firstName || 
         updateData.lastName !== existingProfile.lastName || 
         updateData.middleName !== existingProfile.middleName)) {
      
      // Get current values or updated values
      const firstName = updateData.firstName || existingProfile.firstName;
      const lastName = updateData.lastName || existingProfile.lastName;
      const middleName = updateData.middleName || existingProfile.middleName;
      
      updateData.fullName = `${firstName.trim()} ${middleName ? middleName.trim() + ' ' : ''}${lastName.trim()}`;
      console.log("Updated fullName:", updateData.fullName);
    }
    
    // Additional preprocessing for critical fields
    try {
      // Handle JSON fields manually here before passing to storage
      const jsonFields = ['emergencyContact', 'languagesSpoken', 'workHistory', 'socialMediaLinks'];
      
      jsonFields.forEach(field => {
        if (field in updateData) {
          // Special handling for 'None' values
          if (updateData[field] === 'None' || updateData[field] === null) {
            console.log(`Field ${field} has null or "None" value, setting default`);
            if (field === 'emergencyContact') {
              updateData[field] = {
                name: '',
                relation: '',
                phone: '',
                email: '',
                address: ''
              };
            } else {
              updateData[field] = [];
            }
          }
          // If it's already a valid JSON string, leave it alone
          else if (typeof updateData[field] === 'string') {
            try {
              JSON.parse(updateData[field]);
              console.log(`Field ${field} is already a valid JSON string`);
            } catch (e) {
              console.warn(`Invalid JSON string in ${field}, applying default`);
              
              // For invalid JSON strings, set default values
              if (field === 'emergencyContact') {
                updateData[field] = {
                  name: '',
                  relation: '',
                  phone: '',
                  email: '',
                  address: ''
                };
              } else {
                // If it looks like a comma-separated list, convert to array
                if (updateData[field].includes(',')) {
                  const items = updateData[field].split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
                  updateData[field] = items;
                } else if (updateData[field].trim() !== '') {
                  // Single value, make it a single-item array
                  updateData[field] = [updateData[field].trim()];
                } else {
                  // Empty value, use empty array
                  updateData[field] = [];
                }
              }
            }
          } 
          // If it's an object or array, leave it as is
          else if (typeof updateData[field] === 'object' && updateData[field] !== null) {
            console.log(`Field ${field} is already an object or array`);
          }
        }
      });
    } catch (e) {
      console.error("Error preprocessing update data:", e);
      // Continue processing - the storage layer will handle it
    }
    
    // Add audit field
    updateData.updatedAt = new Date();
    
    // Update the youth profile
    try {
      const updatedProfile = await storage.updateYouthProfile(id, updateData);
      console.log("Profile updated successfully:", updatedProfile.id);
      return res.json(updatedProfile);
    } catch (error) {
      console.error("Database error updating youth profile:", error);
      
      // Provide a helpful error message
      if (error.message && error.message.includes('invalid input syntax for type json')) {
        // Check for "None" token error specifically
        if (error.detail && error.detail.includes('Token "None" is invalid')) {
          return res.status(400).json({
            message: 'Invalid JSON data in profile update. Field contains "None" which is not valid JSON.',
            detail: 'Please remove "None" values or replace them with null values.',
            errorType: 'none_token_error'
          });
        } else {
          return res.status(400).json({
            message: 'Invalid JSON data in profile update. Please check emergency contact and languages fields.',
            detail: error.message,
            errorType: 'json_syntax_error'
          });
        }
      }
      
      // Re-throw for the global error handler
      throw error;
    }
  } catch (error) {
    console.error("Error updating youth profile:", error);
    next(error);
  }
});


// Delete a youth profile
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Only admin can delete profiles for safety
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canDeleteProfiles = permissions.some(p => 
        p.resource === 'youth_profiles' && p.action === 'delete'
      );
      
      if (!canDeleteProfiles) {
        return res.status(403).json({ 
          message: 'You do not have permission to delete youth profiles' 
        });
      }
    }
    
    // Check if profile exists
    const existingProfile = await storage.getYouthProfile(id);
    if (!existingProfile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Delete the youth profile
    await storage.deleteYouthProfile(id);
    
    return res.status(200).json({ 
      message: 'Youth profile deleted successfully' 
    });
  } catch (error) {
    console.error("Error deleting youth profile:", error);
    next(error);
  }
});

export default router;