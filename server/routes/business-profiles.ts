import express, { Request, Response } from 'express';
import { db } from '../db';
import { businessProfiles, businessYouthRelationships, insertBusinessProfileSchema, youthProfiles, dareModelEnum } from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { formatZodError } from '../utils';

const router = express.Router();

// Get all business profiles
router.get('/', async (req: Request, res: Response) => {
  try {
    // Explicitly select only the fields that exist in the database
    const profiles = await db.select({
      id: businessProfiles.id,
      businessName: businessProfiles.businessName,
      businessLogo: businessProfiles.businessLogo,
      district: businessProfiles.district,
      businessLocation: businessProfiles.businessLocation,
      businessContact: businessProfiles.businessContact,
      businessDescription: businessProfiles.businessDescription,
      businessModel: businessProfiles.businessModel,
      dareModel: businessProfiles.dareModel,
      serviceCategoryId: businessProfiles.serviceCategoryId,
      serviceSubcategoryId: businessProfiles.serviceSubcategoryId,
      businessStartDate: businessProfiles.businessStartDate,
      portfolioLinks: businessProfiles.portfolioLinks,
      workSamples: businessProfiles.workSamples,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt
    }).from(businessProfiles);
    
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching business profiles:', error);
    res.status(500).json({ error: 'Failed to fetch business profiles' });
  }
});

// Get business profiles by district
router.get('/district/:district', async (req: Request, res: Response) => {
  try {
    const { district } = req.params;
    // Explicitly select only the fields that exist in the database
    const profiles = await db.select({
      id: businessProfiles.id,
      businessName: businessProfiles.businessName,
      businessLogo: businessProfiles.businessLogo,
      district: businessProfiles.district,
      businessLocation: businessProfiles.businessLocation,
      businessContact: businessProfiles.businessContact,
      businessDescription: businessProfiles.businessDescription,
      businessModel: businessProfiles.businessModel,
      dareModel: businessProfiles.dareModel,
      serviceCategoryId: businessProfiles.serviceCategoryId,
      serviceSubcategoryId: businessProfiles.serviceSubcategoryId,
      businessStartDate: businessProfiles.businessStartDate,
      portfolioLinks: businessProfiles.portfolioLinks,
      workSamples: businessProfiles.workSamples,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt
    }).from(businessProfiles)
      .where(eq(businessProfiles.district, district as any));
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching business profiles by district:', error);
    res.status(500).json({ error: 'Failed to fetch business profiles' });
  }
});

// Get business profiles by DARE model
router.get('/model/:model', async (req: Request, res: Response) => {
  try {
    const { model } = req.params;
    
    // Validate model is one of the allowed values in the enum
    if (!dareModelEnum.options.includes(model as any)) {
      return res.status(400).json({ error: 'Invalid DARE model' });
    }
    
    // Explicitly select only the fields that exist in the database
    const profiles = await db.select({
      id: businessProfiles.id,
      businessName: businessProfiles.businessName,
      businessLogo: businessProfiles.businessLogo,
      district: businessProfiles.district,
      businessLocation: businessProfiles.businessLocation,
      businessContact: businessProfiles.businessContact,
      businessDescription: businessProfiles.businessDescription,
      businessModel: businessProfiles.businessModel,
      dareModel: businessProfiles.dareModel,
      serviceCategoryId: businessProfiles.serviceCategoryId,
      serviceSubcategoryId: businessProfiles.serviceSubcategoryId,
      businessStartDate: businessProfiles.businessStartDate,
      portfolioLinks: businessProfiles.portfolioLinks,
      workSamples: businessProfiles.workSamples,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt
    }).from(businessProfiles)
      .where(eq(businessProfiles.dareModel, model as any));
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching business profiles by model:', error);
    res.status(500).json({ error: 'Failed to fetch business profiles by model' });
  }
});

// Get a specific business profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Special case for "new" - used in the frontend for new business form
    if (id === 'new') {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // Validate id is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    // Explicitly select only the fields that exist in the database
    const [profile] = await db.select({
      id: businessProfiles.id,
      businessName: businessProfiles.businessName,
      businessLogo: businessProfiles.businessLogo,
      district: businessProfiles.district,
      businessLocation: businessProfiles.businessLocation,
      businessContact: businessProfiles.businessContact,
      businessDescription: businessProfiles.businessDescription,
      businessModel: businessProfiles.businessModel,
      dareModel: businessProfiles.dareModel,
      serviceCategoryId: businessProfiles.serviceCategoryId,
      serviceSubcategoryId: businessProfiles.serviceSubcategoryId,
      businessStartDate: businessProfiles.businessStartDate,
      portfolioLinks: businessProfiles.portfolioLinks,
      workSamples: businessProfiles.workSamples,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt
    }).from(businessProfiles)
      .where(eq(businessProfiles.id, parseInt(id)));
    
    if (!profile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ error: 'Failed to fetch business profile' });
  }
});

// Create a new business profile
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = insertBusinessProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    
    const [newProfile] = await db.insert(businessProfiles)
      .values(result.data)
      .returning();
    
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error creating business profile:', error);
    res.status(500).json({ error: 'Failed to create business profile' });
  }
});

// Update a business profile
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const [existingProfile] = await db.select().from(businessProfiles)
      .where(eq(businessProfiles.id, parseInt(id)));
    
    if (!existingProfile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // Allow partial updates
    const result = insertBusinessProfileSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    
    const [updatedProfile] = await db.update(businessProfiles)
      .set({
        ...result.data,
        updatedAt: new Date()
      })
      .where(eq(businessProfiles.id, parseInt(id)))
      .returning();
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ error: 'Failed to update business profile' });
  }
});

// Get members of a business
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate id is a number
    if (isNaN(parseInt(id)) || id === 'new') {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    const businessId = parseInt(id);
    
    // First check if the business exists - explicitly select only id
    const [business] = await db.select({
      id: businessProfiles.id
    }).from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Fetch the relationships
    const relationships = await db
      .select()
      .from(businessYouthRelationships)
      .where(eq(businessYouthRelationships.businessId, businessId));
    
    // If no relationships exist, return empty array
    if (relationships.length === 0) {
      return res.json([]);
    }
    
    // Extract the youth IDs
    const youthIds = relationships.map(rel => rel.youthId);
    
    // Fetch the youth profiles
    const members = await db
      .select()
      .from(youthProfiles)
      .where(inArray(youthProfiles.id, youthIds));
    
    // Combine the youth profiles with relationship data
    const enrichedMembers = members.map(member => {
      const relationship = relationships.find(rel => rel.youthId === member.id);
      return {
        ...member,
        role: relationship?.role || 'Member',
        joinDate: relationship?.joinDate || null,
        isActive: relationship?.isActive || true,
      };
    });
    
    res.json(enrichedMembers);
  } catch (error) {
    console.error('Error fetching business members:', error);
    res.status(500).json({ error: 'Failed to fetch business members' });
  }
});

// Add multiple youth to a business (Bulk endpoint)
router.post('/youth-relationships', async (req: Request, res: Response) => {
  try {
    const { businessId, youthIds } = req.body;
    
    // Validate input
    if (!businessId || !Array.isArray(youthIds) || youthIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request data. businessId and youthIds array are required.' });
    }
    
    // Verify the business exists
    const [business] = await db.select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Get existing relationships to avoid duplicates
    const existingRelationships = await db.select()
      .from(businessYouthRelationships)
      .where(eq(businessYouthRelationships.businessId, businessId));
    
    const existingYouthIds = existingRelationships.map(rel => rel.youthId);
    
    // Filter out youth IDs that already have relationships
    const newYouthIds = youthIds.filter(id => !existingYouthIds.includes(id));
    
    if (newYouthIds.length === 0) {
      return res.status(200).json({ message: 'No new relationships to create' });
    }
    
    // Create new relationships
    const relationships = newYouthIds.map(youthId => ({
      businessId,
      youthId,
      role: 'Member',
      joinDate: new Date().toISOString(), // Convert to ISO string for DB compatibility
      isActive: true
    }));
    
    // Insert all relationships
    const createdRelationships = await db.insert(businessYouthRelationships)
      .values(relationships)
      .returning();
    
    res.status(201).json(createdRelationships);
  } catch (error) {
    console.error('Error adding youth to business (bulk):', error);
    res.status(500).json({ error: 'Failed to add youth to business' });
  }
});

// Get mentor assignments for a business profile
router.get('/:id/mentor-assignments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = parseInt(id);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    
    // First check if the business exists
    const [business] = await db.select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // Get the mentor-business relationships for this business
    // Using raw SQL since we need to join with mentors table
    const mentorAssignments = await db.execute(sql`
      SELECT mbr.*, 
        m.id as "mentor.id", 
        m.name as "mentor.name",
        m.email as "mentor.email",
        m.phone as "mentor.phone",
        m.profile_picture as "mentor.profilePicture",
        m.specialization as "mentor.specialization"
      FROM mentor_business_relationships mbr
      JOIN mentors m ON mbr.mentor_id = m.id
      WHERE mbr.business_id = ${businessId}
    `);
    
    // Format the response data
    const formattedAssignments = mentorAssignments.rows.map((row: any) => {
      // Extract mentor data
      const mentor = {
        id: row["mentor.id"],
        name: row["mentor.name"],
        email: row["mentor.email"],
        phone: row["mentor.phone"],
        profilePicture: row["mentor.profilePicture"],
        specialization: row["mentor.specialization"]
      };
      
      // Return the formatted assignment with embedded mentor
      return {
        mentorId: row.mentor_id,
        businessId: row.business_id,
        assignedDate: row.assigned_date,
        isActive: row.is_active,
        mentorshipFocus: row.mentorship_focus,
        meetingFrequency: row.meeting_frequency,
        lastMeetingDate: row.last_meeting_date,
        nextMeetingDate: row.next_meeting_date,
        mentorshipGoals: row.mentorship_goals,
        mentorshipProgress: row.mentorship_progress,
        progressRating: row.progress_rating,
        mentor: mentor
      };
    });
    
    res.json(formattedAssignments);
  } catch (error) {
    console.error('Error fetching mentor assignments:', error);
    res.status(500).json({ error: 'Failed to fetch mentor assignments' });
  }
});

// Delete a business profile
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    // First check if the business exists
    const [business] = await db.select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, id));
    
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    // Delete all youth relationships for this business
    await db.delete(businessYouthRelationships)
      .where(eq(businessYouthRelationships.businessId, id));
    
    // Business tracking table was removed as part of new tracking system implementation
    
    // Check if mentor_business_relationships table exists and delete related records
    try {
      // Just check if we can query the table first
      await db.execute(sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mentor_business_relationships'
      )`);
      
      // If we get here, the table exists, so we'll delete records
      // (using snake_case column names as that's what's in the database)
      await db.execute(sql`DELETE FROM mentor_business_relationships WHERE business_id = ${id}`);
    } catch (err) {
      // Table doesn't exist or some other error, just log and continue
      console.log('No mentor_business_relationships table found or error deleting records:', err);
    }
    
    // Finally, delete the business profile
    const [deletedBusiness] = await db.delete(businessProfiles)
      .where(eq(businessProfiles.id, id))
      .returning();
    
    if (!deletedBusiness) {
      return res.status(500).json({ error: 'Failed to delete business profile' });
    }
    
    res.status(200).json({ message: 'Business profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting business profile:', error);
    res.status(500).json({ error: 'Failed to delete business profile' });
  }
});

export default router;
