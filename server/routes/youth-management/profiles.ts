import { Router } from "express";
import { storage } from "../../storage";


const router = Router();

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
    
    // Validate required fields
    const requiredFields = ['fullName', 'district'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Add audit fields
    profileData.createdAt = new Date();
    profileData.updatedAt = new Date();
    
    // Create the youth profile
    const newProfile = await storage.createYouthProfile(profileData);
    
    return res.status(201).json(newProfile);
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
    console.log("Received update data:", req.body);
    
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
    
    // Handle dates properly - convert string dates to proper Date objects
    if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    
    if (updateData.partnerStartDate && typeof updateData.partnerStartDate === 'string') {
      updateData.partnerStartDate = new Date(updateData.partnerStartDate);
    }
    
    // Handle JSON fields properly
    // Make sure all JSON fields are properly formatted strings, not literal "None" or undefined
    const jsonFields = ['emergencyContact', 'apprenticeNames', 'languagesSpoken'];
    
    jsonFields.forEach(field => {
      // If the field exists but is not already a JSON string
      if (field in updateData) {
        if (updateData[field] === 'None' || updateData[field] === null || updateData[field] === '') {
          // Replace "None" with empty JSON structure based on field type
          if (field === 'emergencyContact') {
            updateData[field] = JSON.stringify({
              name: '',
              relation: '',
              phone: '',
              email: '',
              address: ''
            });
          } else {
            // For array fields (apprenticeNames, languagesSpoken)
            updateData[field] = JSON.stringify([]);
          }
        } else if (typeof updateData[field] === 'object') {
          // If it's already an object, stringify it
          updateData[field] = JSON.stringify(updateData[field]);
        }
        // If it's already a valid JSON string, leave it as is
      }
    });
    
    // Process workHistory and other text fields that might contain "None"
    const textFields = ['workHistory', 'businessInterest', 'programDetails'];
    textFields.forEach(field => {
      if (updateData[field] === 'None') {
        updateData[field] = '';
      }
    });
    
    // Empty strings for optional fields should be converted to null
    Object.keys(updateData).forEach(key => {
      // Don't convert JSON string fields to null
      if (updateData[key] === '' && !jsonFields.includes(key)) {
        updateData[key] = null;
      }
    });
    
    // Add audit field
    updateData.updatedAt = new Date();
    
    console.log("Processed update data:", updateData);
    
    // Update the youth profile
    const updatedProfile = await storage.updateYouthProfile(id, updateData);
    
    console.log("Profile updated successfully:", updatedProfile);
    return res.json(updatedProfile);
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