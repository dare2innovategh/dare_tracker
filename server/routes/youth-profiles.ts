import express from 'express';
import { z } from 'zod';
import { insertYouthProfileSchema, districtEnum } from '@shared/schema';
import { storage } from '../storage';
import { profilePictureUpload, getProfilePictureUrl, deleteProfilePicture } from '../utils/file-upload';

// Helper function to process profile data and properly handle empty strings
function processProfileData(data: any): any {
  const processed = { ...data };
  console.log("Processing profile data:", data);
  console.log("Raw fullName value:", data.fullName, "Type:", typeof data.fullName);
  
  // Check if fullName is present in the initial data
  if (data.fullName === undefined) {
    console.warn("CRITICAL: fullName is undefined in the submitted data");
  }
  
  // Process all string fields to properly handle empty strings
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'string') {
      // Special handling for fullName - preserve it if not empty
      if (key === 'fullName') {
        const trimmed = processed[key].trim();
        if (trimmed !== '') {
          processed[key] = trimmed;
          console.log(`fullName after processing: "${processed[key]}" (preserved)`);
        } else {
          console.warn(`fullName was empty or only whitespace: "${processed[key]}"`);
        }
      } else {
        // Preserve empty strings (convert whitespace-only to empty string)
        processed[key] = processed[key].trim() === "" ? "" : processed[key].trim();
      }
    }
  });
  
  // Log which fields are empty strings for debugging
  const emptyFields = Object.entries(processed)
    .filter(([_, value]) => value === "")
    .map(([key]) => key);
    
  if (emptyFields.length > 0) {
    console.log(`Empty string fields detected: ${emptyFields.join(", ")}`);
  }
  
  // Debug the fullName value specifically
  console.log(`Final fullName value: "${processed.fullName}", type: ${typeof processed.fullName}, length: ${processed.fullName ? processed.fullName.length : 0}`);
  
  return processed;
}

// Helper function to calculate age-related fields from date of birth
function calculateAgeFields(dateOfBirth: Date | string): { age: number, yearOfBirth: number, ageGroup: string } {
  // Convert string to date if needed
  const dob = typeof dateOfBirth === 'string' 
    ? new Date(dateOfBirth) 
    : dateOfBirth;

  // Extract year of birth
  const yearOfBirth = dob.getFullYear();
  
  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - yearOfBirth;
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  // Determine age group
  let ageGroup = "";
  if (age < 18) {
    ageGroup = "Under 18";
  } else if (age >= 18 && age <= 24) {
    ageGroup = "18-24";
  } else if (age >= 25 && age <= 35) {
    ageGroup = "25-35";
  } else if (age >= 36 && age <= 45) {
    ageGroup = "36-45";
  } else {
    ageGroup = "Over 45";
  }
  
  return { age, yearOfBirth, ageGroup };
}

const router = express.Router();

// Get all youth profiles
router.get('/', async (_req, res, next) => {
  try {
    console.log('Fetching all youth profiles');
    const profiles = await storage.getAllYouthProfiles();
    return res.json(profiles);
  } catch (error) {
    console.error('Error fetching all youth profiles:', error);
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
    
    console.log(`Fetching youth profile with ID ${id}`);
    const profile = await storage.getYouthProfile(id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    return res.json(profile);
  } catch (error) {
    console.error(`Error fetching youth profile with ID ${req.params.id}:`, error);
    next(error);
  }
});

// Create a new youth profile
router.post('/', profilePictureUpload.single('profilePicture'), async (req, res, next) => {
  try {
    // Get profile data from request
    let profileData = req.body;
    
    console.log('Creating youth profile with data:', profileData);
    console.log('Form data fullName key exists:', Object.keys(profileData).includes('fullName'));
    console.log('Form data keys:', Object.keys(profileData));
    console.log('Raw fullName value before processing:', profileData.fullName);
    
    // Process the data to handle empty strings
    profileData = processProfileData(profileData);
    
    // After processing, check again
    console.log('fullName after processing:', profileData.fullName);
    
    // Handle file upload if present
    if (req.file) {
      profileData.profilePicture = await getProfilePictureUrl(req.file.filename);
      console.log(`Profile picture uploaded: ${profileData.profilePicture}`);
    }
    
    // Make sure required fields are present
    // Special handling for fullName - we need to be extra careful here
    console.log("Checking fullName requirement:", profileData.fullName);
    
    // Convert undefined/null to empty string for consistent handling
    const fullName = profileData.fullName || '';
    
    if (fullName.trim() === '') {
      console.log('Missing required field: fullName');
      console.log(`fullName value: "${fullName}", type: ${typeof fullName}, converted from: ${profileData.fullName}`);
      return res.status(400).json({ message: 'fullName is required' });
    } else {
      console.log(`fullName validation passed: "${fullName}"`);
    }
    
    if (!profileData.district) {
      console.log('Missing required field: district');
      return res.status(400).json({ message: 'District is required' });
    }
    
    // Validate district with the enum
    try {
      console.log(`Validating district: ${profileData.district}`);
      const validatedDistrict = districtEnum.parse(profileData.district);
      profileData.district = validatedDistrict;
      console.log(`District validated: ${profileData.district}`);
    } catch (error) {
      console.error(`Invalid district: ${profileData.district}`, error);
      return res.status(400).json({
        message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
      });
    }
    
    // Handle date fields specifically
    if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        profileData.dateOfBirth = date;
        
        // Calculate age-related fields from date of birth
        const { age, yearOfBirth, ageGroup } = calculateAgeFields(date);
        profileData.age = age;
        profileData.yearOfBirth = yearOfBirth;
        profileData.ageGroup = ageGroup;
        
        console.log(`Calculated from DOB: Year of Birth=${yearOfBirth}, Age=${age}, Age Group=${ageGroup}`);
      } else {
        console.log('Invalid dateOfBirth, removing from data');
        delete profileData.dateOfBirth;
      }
    }
    
    if (profileData.partnerStartDate && typeof profileData.partnerStartDate === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.partnerStartDate);
      if (!isNaN(date.getTime())) {
        profileData.partnerStartDate = date;
      } else {
        console.log('Invalid partnerStartDate, removing from data');
        delete profileData.partnerStartDate;
      }
    }
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10) || null;
    }
    
    if (typeof profileData.childrenCount === 'string') {
      profileData.childrenCount = parseInt(profileData.childrenCount, 10) || null;
    }
    
    if (typeof profileData.yearOfBirth === 'string') {
      profileData.yearOfBirth = parseInt(profileData.yearOfBirth, 10) || null;
    }
    
    if (typeof profileData.age === 'string') {
      profileData.age = parseInt(profileData.age, 10) || null;
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10) || null;
    }
    
    // Handle boolean fields
    ['isMadam', 'isApprentice', 'activeStudentStatus', 'onboardedToTracker', 
     'refugeeStatus', 'idpStatus', 'communityHostsRefugees'].forEach(field => {
      if (field in profileData) {
        // Convert string 'true'/'false' to boolean
        if (typeof profileData[field] === 'string') {
          profileData[field] = profileData[field] === 'true';
        }
      }
    });
    
    // Handle JSON fields that come in as strings
    if (typeof profileData.emergencyContact === 'string') {
      try {
        console.log('Parsing emergencyContact JSON:', profileData.emergencyContact);
        profileData.emergencyContact = JSON.parse(profileData.emergencyContact);
        console.log('Parsed emergencyContact:', profileData.emergencyContact);
      } catch (e) {
        console.error('Error parsing emergencyContact JSON:', e);
        // If it can't be parsed, set it to a default empty object
        profileData.emergencyContact = {
          name: '',
          relation: '',
          phone: '',
          email: '',
          address: ''
        };
      }
    }
    
    // Check if there are individual emergency contact fields but no structured emergencyContact object
    if (
      !profileData.emergencyContact && 
      (profileData.emergencyContactName || 
       profileData.emergencyContactRelation || 
       profileData.emergencyContactPhone || 
       profileData.emergencyContactEmail || 
       profileData.emergencyContactAddress)
    ) {
      console.log('Creating emergencyContact object from individual fields');
      // Create emergencyContact object from individual fields
      profileData.emergencyContact = {
        name: profileData.emergencyContactName || '',
        relation: profileData.emergencyContactRelation || '',
        phone: profileData.emergencyContactPhone || '',
        email: profileData.emergencyContactEmail || '',
        address: profileData.emergencyContactAddress || ''
      };
      
      // Delete individual fields to avoid duplication
      delete profileData.emergencyContactName;
      delete profileData.emergencyContactRelation;
      delete profileData.emergencyContactPhone;
      delete profileData.emergencyContactEmail;
      delete profileData.emergencyContactAddress;
      
      console.log('Created emergencyContact object:', JSON.stringify(profileData.emergencyContact, null, 2));
    }
    
    if (typeof profileData.apprenticeNames === 'string') {
      try {
        console.log('Parsing apprenticeNames JSON:', profileData.apprenticeNames);
        profileData.apprenticeNames = JSON.parse(profileData.apprenticeNames);
        console.log('Parsed apprenticeNames:', profileData.apprenticeNames);
      } catch (e) {
        console.error('Error parsing apprenticeNames JSON:', e);
        // If it can't be parsed, set it to a default empty array
        profileData.apprenticeNames = [];
      }
    }
    
    // Other possible JSON fields
    if (typeof profileData.languagesSpoken === 'string') {
      try {
        profileData.languagesSpoken = JSON.parse(profileData.languagesSpoken);
      } catch (e) {
        profileData.languagesSpoken = [];
      }
    }
    
    if (typeof profileData.workHistory === 'string') {
      try {
        profileData.workHistory = JSON.parse(profileData.workHistory);
      } catch (e) {
        profileData.workHistory = [];
      }
    }
    
    if (typeof profileData.socialMediaLinks === 'string') {
      try {
        profileData.socialMediaLinks = JSON.parse(profileData.socialMediaLinks);
      } catch (e) {
        profileData.socialMediaLinks = {};
      }
    }
    
    if (typeof profileData.portfolioLinks === 'string') {
      try {
        profileData.portfolioLinks = JSON.parse(profileData.portfolioLinks);
      } catch (e) {
        profileData.portfolioLinks = {};
      }
    }
    
    // Log the processed data before validation (but sanitize any sensitive data)
    console.log('Data after processing JSON fields:', {
      ...profileData,
      password: profileData.password ? '[REDACTED]' : undefined
    });
    
    // Validate with zod schema
    try {
      console.log('Validating profile data with zod schema');
      const validatedData = insertYouthProfileSchema.parse(profileData);
      
      // Create the profile
      console.log('Creating youth profile in database');
      const profile = await storage.createYouthProfile(validatedData);
      
      console.log(`Youth profile created with ID: ${profile.id}`);
      return res.status(200).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      console.error('Error creating profile:', error);
      return res.status(500).json({ 
        message: `Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  } catch (error) {
    console.error('Error creating youth profile:', error);
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
    
    console.log(`Updating youth profile with ID ${id}`);
    
    // Check if profile exists
    const existingProfile = await storage.getYouthProfile(id);
    if (!existingProfile) {
      console.log(`Youth profile with ID ${id} not found`);
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Get update data from request
    let profileData = req.body;
    console.log(`Update data:`, profileData);
    
    // Process the data to handle empty strings
    profileData = processProfileData(profileData);
    
    // Handle file upload if present
    if (req.file) {
      // Delete old profile picture if exists
      if (existingProfile.profilePicture) {
        await deleteProfilePicture(existingProfile.profilePicture);
        console.log(`Deleted old profile picture: ${existingProfile.profilePicture}`);
      }
      
      // Set new profile picture
      profileData.profilePicture = await getProfilePictureUrl(req.file.filename);
      console.log(`New profile picture uploaded: ${profileData.profilePicture}`);
    }
    
    // Ensure required fields are present or preserved from existing data
    if (!profileData.fullName || profileData.fullName.trim() === '') {
      // Use the existing fullName if not provided
      profileData.fullName = existingProfile.fullName;
      console.log(`Using existing fullName: ${profileData.fullName}`);
    }
    
    if (!profileData.district) {
      // Use the existing district if not provided
      profileData.district = existingProfile.district;
      console.log(`Using existing district: ${profileData.district}`);
    }
    
    // If district is provided, validate it
    if (profileData.district) {
      try {
        console.log(`Validating district update: ${profileData.district}`);
        const validatedDistrict = districtEnum.parse(profileData.district);
        profileData.district = validatedDistrict;
        console.log(`District validated: ${profileData.district}`);
      } catch (error) {
        console.error(`Invalid district update: ${profileData.district}`, error);
        return res.status(400).json({
          message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
        });
      }
    }
    
    // Handle date fields specifically
    if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        profileData.dateOfBirth = date;
        
        // Calculate age-related fields from date of birth
        const { age, yearOfBirth, ageGroup } = calculateAgeFields(date);
        profileData.age = age;
        profileData.yearOfBirth = yearOfBirth;
        profileData.ageGroup = ageGroup;
        
        console.log(`Calculated from DOB: Year of Birth=${yearOfBirth}, Age=${age}, Age Group=${ageGroup}`);
      } else {
        delete profileData.dateOfBirth; // Invalid date, remove it
        console.log('Removed invalid dateOfBirth from update data');
      }
    }
    
    if (profileData.partnerStartDate && typeof profileData.partnerStartDate === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.partnerStartDate);
      if (!isNaN(date.getTime())) {
        profileData.partnerStartDate = date;
      } else {
        delete profileData.partnerStartDate; // Invalid date, remove it
        console.log('Removed invalid partnerStartDate from update data');
      }
    }
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10) || null;
    }
    
    if (typeof profileData.childrenCount === 'string') {
      profileData.childrenCount = parseInt(profileData.childrenCount, 10) || null;
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10) || null;
    }
    
    // Handle boolean fields
    ['isMadam', 'isApprentice', 'activeStudentStatus', 'onboardedToTracker', 
     'refugeeStatus', 'idpStatus', 'communityHostsRefugees'].forEach(field => {
      if (field in profileData) {
        // Convert string 'true'/'false' to boolean
        if (typeof profileData[field] === 'string') {
          profileData[field] = profileData[field] === 'true';
        }
      }
    });
    
    // Handle JSON fields that come in as strings
    if (typeof profileData.emergencyContact === 'string') {
      try {
        console.log('Parsing emergencyContact JSON for update:', profileData.emergencyContact);
        profileData.emergencyContact = JSON.parse(profileData.emergencyContact);
        console.log('Parsed emergencyContact for update:', profileData.emergencyContact);
      } catch (e) {
        console.error('Error parsing emergencyContact JSON for update:', e);
        // If it can't be parsed, set it to a default empty object
        profileData.emergencyContact = {
          name: '',
          relation: '',
          phone: '',
          email: '',
          address: ''
        };
      }
    }
    
    // Check if there are individual emergency contact fields but no structured emergencyContact object
    if (
      !profileData.emergencyContact && 
      (profileData.emergencyContactName || 
       profileData.emergencyContactRelation || 
       profileData.emergencyContactPhone || 
       profileData.emergencyContactEmail || 
       profileData.emergencyContactAddress)
    ) {
      console.log('Creating emergencyContact object from individual fields');
      // Create emergencyContact object from individual fields
      profileData.emergencyContact = {
        name: profileData.emergencyContactName || '',
        relation: profileData.emergencyContactRelation || '',
        phone: profileData.emergencyContactPhone || '',
        email: profileData.emergencyContactEmail || '',
        address: profileData.emergencyContactAddress || ''
      };
      
      // Delete individual fields to avoid duplication
      delete profileData.emergencyContactName;
      delete profileData.emergencyContactRelation;
      delete profileData.emergencyContactPhone;
      delete profileData.emergencyContactEmail;
      delete profileData.emergencyContactAddress;
      
      console.log('Created emergencyContact object:', JSON.stringify(profileData.emergencyContact, null, 2));
    }
    
    if (typeof profileData.apprenticeNames === 'string') {
      try {
        console.log('Parsing apprenticeNames JSON for update:', profileData.apprenticeNames);
        profileData.apprenticeNames = JSON.parse(profileData.apprenticeNames);
        console.log('Parsed apprenticeNames for update:', profileData.apprenticeNames);
      } catch (e) {
        console.error('Error parsing apprenticeNames JSON for update:', e);
        // If it can't be parsed, set it to a default empty array
        profileData.apprenticeNames = [];
      }
    }
    
    // Other possible JSON fields
    if (typeof profileData.languagesSpoken === 'string') {
      try {
        profileData.languagesSpoken = JSON.parse(profileData.languagesSpoken);
      } catch (e) {
        profileData.languagesSpoken = [];
      }
    }
    
    if (typeof profileData.workHistory === 'string') {
      try {
        profileData.workHistory = JSON.parse(profileData.workHistory);
      } catch (e) {
        profileData.workHistory = [];
      }
    }
    
    if (typeof profileData.socialMediaLinks === 'string') {
      try {
        profileData.socialMediaLinks = JSON.parse(profileData.socialMediaLinks);
      } catch (e) {
        profileData.socialMediaLinks = {};
      }
    }
    
    if (typeof profileData.portfolioLinks === 'string') {
      try {
        profileData.portfolioLinks = JSON.parse(profileData.portfolioLinks);
      } catch (e) {
        profileData.portfolioLinks = {};
      }
    }
    
    // Log the processed update data
    console.log('Processed update data:', JSON.stringify(profileData, null, 2));
    
    // Validate with zod schema (partial for updates)
    try {
      console.log('Validating update data with zod schema');
      const validatedData = insertYouthProfileSchema.partial().parse(profileData);
      
      // Update the profile
      console.log(`Updating youth profile with ID ${id} in database`);
      const updatedProfile = await storage.updateYouthProfile(id, validatedData);
      
      if (!updatedProfile) {
        console.error(`Failed to update youth profile with ID ${id}`);
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      
      console.log(`Youth profile with ID ${id} updated successfully`);
      return res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error updating youth profile with ID ${req.params.id}:`, error);
    next(error);
  }
});

// PUT route for updating a youth profile (handle form data with file upload)
router.put('/:id', profilePictureUpload.single('profilePicture'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    console.log(`PUT: Updating youth profile with ID ${id}`);
    
    // Check if profile exists
    const existingProfile = await storage.getYouthProfile(id);
    if (!existingProfile) {
      console.log(`Youth profile with ID ${id} not found`);
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    // Get update data from request
    let profileData = req.body;
    console.log(`PUT Update data:`, profileData);
    
    // Process the data to handle empty strings
    profileData = processProfileData(profileData);
    
    // Handle file upload if present
    if (req.file) {
      // Delete old profile picture if exists
      if (existingProfile.profilePicture) {
        await deleteProfilePicture(existingProfile.profilePicture);
        console.log(`Deleted old profile picture: ${existingProfile.profilePicture}`);
      }
      
      // Set new profile picture
      profileData.profilePicture = await getProfilePictureUrl(req.file.filename);
      console.log(`New profile picture uploaded: ${profileData.profilePicture}`);
    }
    
    // Ensure required fields are present or preserved from existing data
    if (!profileData.fullName || profileData.fullName.trim() === '') {
      // Use the existing fullName if not provided
      profileData.fullName = existingProfile.fullName;
      console.log(`Using existing fullName: ${profileData.fullName}`);
    }
    
    if (!profileData.district) {
      // Use the existing district if not provided
      profileData.district = existingProfile.district;
      console.log(`Using existing district: ${profileData.district}`);
    }
    
    // If district is provided, validate it
    if (profileData.district) {
      try {
        console.log(`Validating district update: ${profileData.district}`);
        const validatedDistrict = districtEnum.parse(profileData.district);
        profileData.district = validatedDistrict;
        console.log(`District validated: ${profileData.district}`);
      } catch (error) {
        console.error(`Invalid district update: ${profileData.district}`, error);
        return res.status(400).json({
          message: "Invalid district. Must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo"
        });
      }
    }
    
    // Handle date fields specifically
    if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        profileData.dateOfBirth = date;
        
        // Calculate age-related fields from date of birth
        const { age, yearOfBirth, ageGroup } = calculateAgeFields(date);
        profileData.age = age;
        profileData.yearOfBirth = yearOfBirth;
        profileData.ageGroup = ageGroup;
        
        console.log(`Calculated from DOB: Year of Birth=${yearOfBirth}, Age=${age}, Age Group=${ageGroup}`);
      } else {
        delete profileData.dateOfBirth; // Invalid date, remove it
        console.log('Removed invalid dateOfBirth from update data');
      }
    }
    
    if (profileData.partnerStartDate && typeof profileData.partnerStartDate === 'string') {
      // Ensure it's a valid date object
      const date = new Date(profileData.partnerStartDate);
      if (!isNaN(date.getTime())) {
        profileData.partnerStartDate = date;
      } else {
        delete profileData.partnerStartDate; // Invalid date, remove it
        console.log('Removed invalid partnerStartDate from update data');
      }
    }
    
    // Convert string values to appropriate types
    if (typeof profileData.userId === 'string') {
      profileData.userId = parseInt(profileData.userId, 10) || null;
    }
    
    if (typeof profileData.childrenCount === 'string') {
      profileData.childrenCount = parseInt(profileData.childrenCount, 10) || null;
    }
    
    if (typeof profileData.yearOfBirth === 'string') {
      profileData.yearOfBirth = parseInt(profileData.yearOfBirth, 10) || null;
    }
    
    if (typeof profileData.age === 'string') {
      profileData.age = parseInt(profileData.age, 10) || null;
    }
    
    if (typeof profileData.yearsOfExperience === 'string') {
      profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10) || null;
    }
    
    // Handle boolean fields
    ['isMadam', 'isApprentice', 'activeStudentStatus', 'onboardedToTracker', 
     'refugeeStatus', 'idpStatus', 'communityHostsRefugees'].forEach(field => {
      if (field in profileData) {
        // Convert string 'true'/'false' to boolean
        if (typeof profileData[field] === 'string') {
          profileData[field] = profileData[field] === 'true';
        }
      }
    });
    
    // Handle JSON fields that come in as strings
    if (typeof profileData.emergencyContact === 'string') {
      try {
        console.log('Parsing emergencyContact JSON for PUT update:', profileData.emergencyContact);
        profileData.emergencyContact = JSON.parse(profileData.emergencyContact);
        console.log('Parsed emergencyContact for PUT update:', profileData.emergencyContact);
      } catch (e) {
        console.error('Error parsing emergencyContact JSON for PUT update:', e);
        // If it can't be parsed, set it to a default empty object
        profileData.emergencyContact = {
          name: '',
          relation: '',
          phone: '',
          email: '',
          address: ''
        };
      }
    }
    
    // Check if there are individual emergency contact fields but no structured emergencyContact object
    if (
      !profileData.emergencyContact && 
      (profileData.emergencyContactName || 
       profileData.emergencyContactRelation || 
       profileData.emergencyContactPhone || 
       profileData.emergencyContactEmail || 
       profileData.emergencyContactAddress)
    ) {
      console.log('Creating emergencyContact object from individual fields');
      // Create emergencyContact object from individual fields
      profileData.emergencyContact = {
        name: profileData.emergencyContactName || '',
        relation: profileData.emergencyContactRelation || '',
        phone: profileData.emergencyContactPhone || '',
        email: profileData.emergencyContactEmail || '',
        address: profileData.emergencyContactAddress || ''
      };
      
      // Delete individual fields to avoid duplication
      delete profileData.emergencyContactName;
      delete profileData.emergencyContactRelation;
      delete profileData.emergencyContactPhone;
      delete profileData.emergencyContactEmail;
      delete profileData.emergencyContactAddress;
      
      console.log('Created emergencyContact object:', JSON.stringify(profileData.emergencyContact, null, 2));
    }
    
    if (typeof profileData.apprenticeNames === 'string') {
      try {
        console.log('Parsing apprenticeNames JSON for PUT update:', profileData.apprenticeNames);
        profileData.apprenticeNames = JSON.parse(profileData.apprenticeNames);
        console.log('Parsed apprenticeNames for PUT update:', profileData.apprenticeNames);
      } catch (e) {
        console.error('Error parsing apprenticeNames JSON for PUT update:', e);
        // If it can't be parsed, set it to a default empty array
        profileData.apprenticeNames = [];
      }
    }
    
    // Other possible JSON fields
    if (typeof profileData.languagesSpoken === 'string') {
      try {
        profileData.languagesSpoken = JSON.parse(profileData.languagesSpoken);
      } catch (e) {
        profileData.languagesSpoken = [];
      }
    }
    
    if (typeof profileData.workHistory === 'string') {
      try {
        profileData.workHistory = JSON.parse(profileData.workHistory);
      } catch (e) {
        profileData.workHistory = [];
      }
    }
    
    if (typeof profileData.socialMediaLinks === 'string') {
      try {
        profileData.socialMediaLinks = JSON.parse(profileData.socialMediaLinks);
      } catch (e) {
        profileData.socialMediaLinks = {};
      }
    }
    
    if (typeof profileData.portfolioLinks === 'string') {
      try {
        profileData.portfolioLinks = JSON.parse(profileData.portfolioLinks);
      } catch (e) {
        profileData.portfolioLinks = {};
      }
    }
    
    // Log the processed update data
    console.log('Processed PUT update data:', JSON.stringify(profileData, null, 2));
    
    // Validate with zod schema (partial for updates)
    try {
      console.log('Validating PUT update data with zod schema');
      const validatedData = insertYouthProfileSchema.partial().parse(profileData);
      
      // Update the profile
      console.log(`Updating youth profile with ID ${id} in database via PUT`);
      const updatedProfile = await storage.updateYouthProfile(id, validatedData);
      
      if (!updatedProfile) {
        console.error(`Failed to update youth profile with ID ${id} via PUT`);
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      
      console.log(`Youth profile with ID ${id} updated successfully via PUT`);
      return res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error in PUT:', error.errors);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error updating youth profile with ID ${req.params.id} via PUT:`, error);
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
    
    console.log(`Deleting youth profile with ID ${id}`);
    
    // Check if profile exists and get it for the profile picture
    const profile = await storage.getYouthProfile(id);
    if (!profile) {
      console.log(`Youth profile with ID ${id} not found`);
      return res.status(404).json({ message: 'Youth profile not found' });
    }
    
    try {
      // First, delete all related certifications
      await storage.deleteCertificationsByYouthId(id);
      console.log(`Deleted certifications for youth profile with ID ${id}`);
      
      // Then delete the profile
      await storage.deleteYouthProfile(id);
      
      // Delete profile picture if exists
      if (profile.profilePicture) {
        await deleteProfilePicture(profile.profilePicture);
        console.log(`Deleted profile picture: ${profile.profilePicture}`);
      }
      
      console.log(`Youth profile with ID ${id} deleted successfully`);
      return res.json({ message: 'Youth profile deleted successfully' });
    } catch (error) {
      console.error(`Error in deletion process: `, error);
      // Provide a more helpful error message
      if (error.code === '23503') { // Foreign key violation
        return res.status(409).json({ 
          message: 'Cannot delete this profile because it has related records. Please delete those records first or contact an administrator.',
          detail: error.detail
        });
      }
      throw error; // Let the default error handler deal with other types of errors
    }
  } catch (error) {
    console.error(`Error deleting youth profile with ID ${req.params.id}:`, error);
    next(error);
  }
});

export default router;