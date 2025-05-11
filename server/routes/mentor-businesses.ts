import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = express.Router();

// Schema for mentor-business relationship
const mentorBusinessRelationshipSchema = z.object({
  mentorId: z.number(),
  businessId: z.number(),
  isActive: z.boolean().optional().default(true),
  mentorshipFocus: z.enum(['Business Growth', 'Operations Improvement', 'Market Expansion', 'Financial Management', 'Team Development']).nullable().optional(),
  mentorshipGoals: z.string().nullable().optional(),
  meetingFrequency: z.enum(['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'As Needed']).nullable().optional(),
  nextMeetingDate: z.string().nullable().optional(),
  lastMeetingDate: z.string().nullable().optional(),
  mentorshipProgress: z.string().nullable().optional(),
  progressRating: z.number().min(1).max(5).nullable().optional(),
});

// Get all mentor-business relationships
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching all mentor-business relationships');
    const relationships = await storage.getAllMentorBusinessRelationships();
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching mentor-business relationships:', error);
    next(error);
  }
});

// Get all mentor-business relationships with detailed mentor and business info
router.get('/detailed', async (_req, res, next) => {
  try {
    console.log('Fetching detailed mentor-business relationships');
    const relationships = await storage.getDetailedMentorBusinessRelationships();
    return res.json(relationships);
  } catch (error) {
    console.error('Error fetching detailed mentor-business relationships:', error);
    next(error);
  }
});

// Get businesses for a specific mentor
router.get('/mentor/:mentorId', async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.mentorId, 10);
    if (isNaN(mentorId)) {
      return res.status(400).json({ message: 'Invalid mentor ID format' });
    }
    
    const businesses = await storage.getBusinessesForMentor(mentorId);
    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

// Get mentors for a specific business
router.get('/business/:businessId', async (req, res, next) => {
  try {
    const businessId = parseInt(req.params.businessId, 10);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: 'Invalid business ID format' });
    }
    
    const mentors = await storage.getMentorsForBusiness(businessId);
    res.json(mentors);
  } catch (error) {
    next(error);
  }
});

// Get a specific mentor-business relationship by ID
router.get('/id/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    console.log(`Fetching mentor-business relationship with ID ${id}`);
    const relationship = await storage.getMentorBusinessRelationshipById(id);
    
    if (!relationship) {
      return res.status(404).json({ message: 'Mentor-business relationship not found' });
    }
    
    return res.json(relationship);
  } catch (error) {
    console.error(`Error fetching mentor-business relationship with ID ${req.params.id}:`, error);
    next(error);
  }
});

// Get a specific mentor-business relationship
router.get('/:mentorId/:businessId', async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.mentorId, 10);
    const businessId = parseInt(req.params.businessId, 10);
    
    if (isNaN(mentorId) || isNaN(businessId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const relationship = await storage.getMentorBusinessRelationship(mentorId, businessId);
    if (!relationship) {
      return res.status(404).json({ message: 'Relationship not found' });
    }
    
    res.json(relationship);
  } catch (error) {
    next(error);
  }
});

// Create a new mentor-business relationship
router.post('/', async (req, res, next) => {
  try {
    const data = mentorBusinessRelationshipSchema.parse(req.body);
    
    // Check if the mentor exists
    const mentor = await storage.getMentor(data.mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    // Check if the business exists
    const business = await storage.getBusinessProfile(data.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    // Check if the relationship already exists
    const existingRelationship = await storage.getMentorBusinessRelationship(data.mentorId, data.businessId);
    if (existingRelationship) {
      return res.status(409).json({ message: 'This mentor is already assigned to this business' });
    }
    
    // Validate that the mentor and business are in the same district
    // Check if the mentor has multiple districts assigned (new schema) or using the old single district field
    let mentorDistricts: string[] = [];
    
    // If we have assignedDistricts array, use that
    if (mentor.assignedDistricts && Array.isArray(mentor.assignedDistricts) && mentor.assignedDistricts.length > 0) {
      // Normalize district names from the array
      mentorDistricts = mentor.assignedDistricts.map(district => 
        typeof district === 'string' ? district.replace(/, Ghana$/, '') : ''
      );
    } 
    // Fall back to the original assignedDistrict field if available
    else if (mentor.assignedDistrict) {
      mentorDistricts = [mentor.assignedDistrict.replace(/, Ghana$/, '')];
    }
    
    // Normalize business district
    const businessDistrict = business.district.replace(/, Ghana$/, '');
    
    // Check if the business district is in the mentor's list of districts
    if (!mentorDistricts.includes(businessDistrict)) {
      return res.status(400).json({ 
        message: 'District mismatch. Mentors can only be assigned to businesses in their district(s).',
        details: {
          mentorDistricts: mentorDistricts.length > 0 ? mentorDistricts : ['None assigned'],
          businessDistrict: business.district
        }
      });
    }
    
    // Set the assigned date to current date
    const now = new Date();
    
    // Create the relationship
    const relationship = await storage.addMentorToBusiness({
      mentorId: data.mentorId,
      businessId: data.businessId,
      assignedDate: now.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      isActive: data.isActive ?? true,
      mentorshipFocus: data.mentorshipFocus,
      mentorshipGoals: data.mentorshipGoals,
      meetingFrequency: data.meetingFrequency,
      nextMeetingDate: data.nextMeetingDate,
      lastMeetingDate: data.lastMeetingDate,
      mentorshipProgress: data.mentorshipProgress,
      progressRating: data.progressRating
    });
    
    res.status(201).json(relationship);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    next(error);
  }
});

// Update a mentor-business relationship
router.put('/:mentorId/:businessId', async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.mentorId, 10);
    const businessId = parseInt(req.params.businessId, 10);
    
    if (isNaN(mentorId) || isNaN(businessId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Check if the relationship exists
    const existingRelationship = await storage.getMentorBusinessRelationship(mentorId, businessId);
    if (!existingRelationship) {
      return res.status(404).json({ message: 'Relationship not found' });
    }
    
    // Update only the fields provided
    const updateData = mentorBusinessRelationshipSchema.partial().parse(req.body);
    
    const updatedRelationship = await storage.updateMentorBusinessRelationship(
      mentorId,
      businessId,
      updateData
    );
    
    res.json(updatedRelationship);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    next(error);
  }
});

// Delete a mentor-business relationship by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    console.log(`Deleting mentor-business relationship with ID ${id}`);
    
    // Delete the relationship
    const deleted = await storage.deleteMentorBusinessRelationship(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Mentor-business relationship not found' });
    }
    
    return res.json({ message: 'Mentor-business relationship deleted successfully' });
  } catch (error) {
    console.error(`Error deleting mentor-business relationship with ID ${req.params.id}:`, error);
    next(error);
  }
});

// Replace or add this DELETE route handler
router.delete('/:mentorId/:businessId', async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.mentorId, 10);
    const businessId = parseInt(req.params.businessId, 10);
    
    if (isNaN(mentorId) || isNaN(businessId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format' 
      });
    }
    
    console.log(`API: Attempting to delete mentor-business relationship for mentor ${mentorId} and business ${businessId}`);
    
    // Use the direct SQL function
    try {
      await removeMentorBusinessDirect(mentorId, businessId);
      
      console.log(`API: Successfully deleted relationship between mentor ${mentorId} and business ${businessId}`);
      return res.status(200).json({ 
        success: true,
        message: 'Mentor-business relationship deleted successfully',
        mentorId,
        businessId
      });
    } catch (error) {
      console.error(`API: Error removing mentor-business relationship:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`API: Final error in delete endpoint:`, error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to delete mentor-business relationship',
        error: error.message
      });
    }
    
    next(error);
  }
});

// Add this route for direct SQL deletion via POST
router.post('/delete', async (req, res, next) => {
  try {
    const { mentorId, businessId } = req.body;
    
    if (!mentorId || !businessId) {
      return res.status(400).json({ 
        success: false,
        message: 'mentorId and businessId are required' 
      });
    }
    
    const mentorIdNum = parseInt(mentorId, 10);
    const businessIdNum = parseInt(businessId, 10);
    
    if (isNaN(mentorIdNum) || isNaN(businessIdNum)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format' 
      });
    }
    
    console.log(`API: Attempting to delete mentor-business relationship via POST for mentor ${mentorIdNum} and business ${businessIdNum}`);
    
    // Use the direct SQL function
    try {
      await removeMentorBusinessDirect(mentorIdNum, businessIdNum);
      
      console.log(`API: Successfully deleted relationship between mentor ${mentorIdNum} and business ${businessIdNum}`);
      return res.status(200).json({ 
        success: true,
        message: 'Mentor-business relationship deleted successfully',
        mentorId: mentorIdNum,
        businessId: businessIdNum
      });
    } catch (error) {
      console.error(`API: Error removing mentor-business relationship via POST:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`API: Final error in POST delete endpoint:`, error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to delete mentor-business relationship',
        error: error.message
      });
    }
    
    next(error);
  }
});

// Direct SQL query route for deletion (fallback)
router.post('/delete-direct', async (req, res, next) => {
  try {
    const { mentorId, businessId } = req.body;
    
    // Convert to numbers
    const mentorIdNum = parseInt(mentorId, 10);
    const businessIdNum = parseInt(businessId, 10);
    
    if (isNaN(mentorIdNum) || isNaN(businessIdNum)) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }
    
    console.log(`Attempting to delete mentor-business relationship via direct SQL for mentor ${mentorIdNum} and business ${businessIdNum}`);
    
    try {
      // Direct SQL approach when storage methods fail
      const result = await db.raw(`
        DELETE FROM mentor_business_assignments 
        WHERE mentor_id = ? AND business_id = ?
      `, [mentorIdNum, businessIdNum]);
      
      console.log('SQL delete result:', result);
      
      return res.status(200).json({ 
        success: true,
        message: 'Mentor-business relationship deleted successfully via direct SQL',
        mentorId: mentorIdNum,
        businessId: businessIdNum,
        affectedRows: result.rowCount || 0
      });
    } catch (sqlError) {
      console.error('SQL error in direct delete:', sqlError);
      throw sqlError;
    }
  } catch (error) {
    console.error(`Error in direct SQL delete route:`, error);
    next(error);
  }
});


export default router;