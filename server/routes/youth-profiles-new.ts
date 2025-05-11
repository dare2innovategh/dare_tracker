import express from 'express';
import { z } from 'zod';
import { insertYouthProfileSchema, districtEnum } from '@shared/schema';
import { storage } from '../storage';
import { profilePictureUpload, getProfilePictureUrl, deleteProfilePicture } from '../utils/file-upload';

// Helper function to process profile data and handle empty strings
function processProfileData(data: any): any {
  const processed = { ...data };
  
  // Process string fields to handle empty strings properly
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'string') {
      // Preserve empty strings (convert whitespace-only to empty string)
      processed[key] = processed[key].trim() === "" ? "" : processed[key].trim();
    }
  });
  
  return processed;
}

const router = express.Router();

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
router.post('/', profilePictureUpload.single('profilePicture'), async (req, res, next) => {
  try {
    // Parse the form data or JSON request body
    let profileData: any = req.body;
    
    // Process data to properly handle empty strings
    profileData = processProfileData(profileData);
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10);
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10);
    }
    
    // Handle file upload if present
    if (req.file) {
      // Generate the public URL for the uploaded file
      const pictureUrl = getProfilePictureUrl(req.file.filename);
      profileData.profilePicture = pictureUrl;
    }
    
    // Extract required fields
    const { fullName = "", district = "Bekwai" } = profileData;
    
    // Ensure required fields are present
    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }
    
    // Set default district if none is provided
    if (!district) {
      console.log("No district provided, defaulting to Bekwai");
      profileData.district = "Bekwai";
    } else {
      // Fix district name if it contains ", Ghana"
      if (typeof district === 'string' && district.includes(", Ghana")) {
        console.log("Removing Ghana suffix from district");
        profileData.district = district.replace(", Ghana", "");
      } else {
        profileData.district = district;
      }
    }
    
    // Validate district using the enum
    try {
      const validatedDistrict = districtEnum.parse(profileData.district);
      profileData.district = validatedDistrict;
      console.log("District validated and transformed:", profileData.district);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
      });
    }
    
    console.log("Profile data before validation:", profileData);
    
    // Validate with zod but catch any errors for better feedback
    try {
      // Less strict validation to allow optional fields
      const validatedData = insertYouthProfileSchema.parse(profileData);
      
      console.log("Creating youth profile with regular storage");
      const profile = await storage.createYouthProfile(validatedData);
      
      if (!profile) {
        return res.status(500).json({ 
          message: "Failed to create profile" 
        });
      }
      
      return res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      throw error; // Re-throw other errors to be caught by outer catch
    }
  } catch (error) {
    console.error("Unexpected error in POST youth profile:", error);
    next(error);
  }
});

// Update a youth profile
router.patch('/:id', profilePictureUpload.single('profilePicture'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Check if profile exists
    console.log(`Checking if profile ID ${id} exists`);
    const existingProfile = await storage.getYouthProfile(id);
    
    if (!existingProfile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Parse the form data or JSON request body
    let profileData: any = req.body;
    
    // Process data to properly handle empty strings
    profileData = processProfileData(profileData);
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10);
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10);
    }
    
    // Handle file upload if present
    if (req.file) {
      // Delete old profile picture if exists
      if (existingProfile.profilePicture) {
        deleteProfilePicture(existingProfile.profilePicture);
      }
      
      // Generate the public URL for the uploaded file
      const pictureUrl = getProfilePictureUrl(req.file.filename);
      profileData.profilePicture = pictureUrl;
    }
    
    // If district is provided, validate it
    if (profileData.district) {
      // Fix district name if it contains ", Ghana"
      if (typeof profileData.district === "string" && profileData.district.includes(", Ghana")) {
        console.log("Removing Ghana suffix from district in update");
        profileData.district = profileData.district.replace(", Ghana", "");
      }
      
      // Validate using the district enum
      try {
        const validatedDistrict = districtEnum.parse(profileData.district);
        profileData.district = validatedDistrict;
        console.log("District validated and transformed in update:", profileData.district);
      } catch (error) {
        console.error("Invalid district value in update:", profileData.district, error);
        return res.status(400).json({
          message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
        });
      }
    }
    
    // Validate the update data
    try {
      // Use partial validation for updates
      const validatedData = insertYouthProfileSchema.partial().parse(profileData);
      
      console.log(`Updating youth profile ID ${id} with regular storage`);
      const updatedProfile = await storage.updateYouthProfile(id, validatedData);
      
      if (!updatedProfile) {
        return res.status(500).json({ 
          message: "Failed to update profile" 
        });
      }
      
      return res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      throw error; // Re-throw other errors to be caught by outer catch
    }
  } catch (error) {
    console.error("Unexpected error in PATCH youth profile:", error);
    next(error);
  }
});

// Add PUT route that duplicates the PATCH functionality
router.put('/:id', profilePictureUpload.single('profilePicture'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Check if profile exists
    console.log(`Checking if profile ID ${id} exists`);
    const existingProfile = await storage.getYouthProfile(id);
    
    if (!existingProfile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Parse the form data or JSON request body
    let profileData: any = req.body;
    
    // Process data to properly handle empty strings
    profileData = processProfileData(profileData);
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10);
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10);
    }
    
    // Handle file upload if present
    if (req.file) {
      // Delete old profile picture if exists
      if (existingProfile.profilePicture) {
        deleteProfilePicture(existingProfile.profilePicture);
      }
      
      // Generate the public URL for the uploaded file
      const pictureUrl = getProfilePictureUrl(req.file.filename);
      profileData.profilePicture = pictureUrl;
    }
    
    // If district is provided, validate it
    if (profileData.district) {
      // Fix district name if it contains ", Ghana"
      if (typeof profileData.district === "string" && profileData.district.includes(", Ghana")) {
        console.log("Removing Ghana suffix from district in update");
        profileData.district = profileData.district.replace(", Ghana", "");
      }
      
      // Validate using the district enum
      try {
        const validatedDistrict = districtEnum.parse(profileData.district);
        profileData.district = validatedDistrict;
        console.log("District validated and transformed in update:", profileData.district);
      } catch (error) {
        console.error("Invalid district value in update:", profileData.district, error);
        return res.status(400).json({
          message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
        });
      }
    }
    
    // Validate the update data
    try {
      // Use partial validation for updates
      const validatedData = insertYouthProfileSchema.partial().parse(profileData);
      
      console.log(`Updating youth profile ID ${id} with regular storage`);
      const updatedProfile = await storage.updateYouthProfile(id, validatedData);
      
      if (!updatedProfile) {
        return res.status(500).json({ 
          message: "Failed to update profile" 
        });
      }
      
      return res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      throw error; // Re-throw other errors to be caught by outer catch
    }
  } catch (error) {
    console.error("Unexpected error in PUT youth profile:", error);
    next(error);
  }
});

// Delete a youth profile
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Try to get the profile first to check if it exists
    const profile = await storage.getYouthProfile(id);
    if (!profile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Delete the profile
    await storage.deleteYouthProfile(id);
    
    // Delete the profile picture if exists
    if (profile.profilePicture) {
      await deleteProfilePicture(profile.profilePicture);
    }
    
    return res.status(200).json({ message: 'Youth profile deleted successfully' });
  } catch (error) {
    console.error("Unexpected error in DELETE youth profile:", error);
    next(error);
  }
});

export default router;