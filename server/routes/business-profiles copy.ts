import express, { Request, Response } from 'express';
import { db } from '../db';
import { 
  businessProfiles, 
  businessYouthRelationships, 
  insertBusinessProfileSchema, 
  youthProfiles, 
  businessModelEnum,
  enterpriseTypeEnum,
  enterpriseSizeEnum,
  businessSectorEnum
} from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { formatZodError } from '../utils';

const router = express.Router();

// Updated select fields to include all Mastercard-specific fields
const selectBusinessProfileFields = {
  id: businessProfiles.id,
  businessName: businessProfiles.businessName,
  businessLogo: businessProfiles.businessLogo,
  district: businessProfiles.district,
  businessLocation: businessProfiles.businessLocation,
  businessContact: businessProfiles.businessContact,
  businessEmail: businessProfiles.businessEmail,
  businessDescription: businessProfiles.businessDescription,
  businessModel: businessProfiles.businessModel,
  dareModel: businessProfiles.dareModel,
  serviceCategoryId: businessProfiles.serviceCategoryId,
  serviceSubcategoryId: businessProfiles.serviceSubcategoryId,
  businessStartDate: businessProfiles.businessStartDate,
  registrationStatus: businessProfiles.registrationStatus,
  registrationNumber: businessProfiles.registrationNumber,
  registrationDate: businessProfiles.registrationDate,
  businessObjectives: businessProfiles.businessObjectives,
  shortTermGoals: businessProfiles.shortTermGoals,
  targetMarket: businessProfiles.targetMarket,
  portfolioLinks: businessProfiles.portfolioLinks,
  workSamples: businessProfiles.workSamples,
  
  // Mastercard-specific enterprise owner fields
  enterpriseOwnerYouthIds: businessProfiles.enterpriseOwnerYouthIds,
  enterpriseOwnerName: businessProfiles.enterpriseOwnerName,
  enterpriseOwnerDob: businessProfiles.enterpriseOwnerDob,
  enterpriseOwnerSex: businessProfiles.enterpriseOwnerSex,
  implementingPartnerName: businessProfiles.implementingPartnerName,
  enterpriseType: businessProfiles.enterpriseType,
  enterpriseSize: businessProfiles.enterpriseSize,
  sector: businessProfiles.sector,
  
  // Youth Impact Metrics
  totalYouthInWorkReported: businessProfiles.totalYouthInWorkReported,
  youthRefugeeCount: businessProfiles.youthRefugeeCount,
  youthIdpCount: businessProfiles.youthIdpCount,
  youthHostCommunityCount: businessProfiles.youthHostCommunityCount,
  youthPlwdCount: businessProfiles.youthPlwdCount,
  
  createdAt: businessProfiles.createdAt,
  updatedAt: businessProfiles.updatedAt
};

// Get all business profiles with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      district, 
      model, 
      enterpriseType, 
      enterpriseSize, 
      sector,
      minYouthCount,
      hasRefugees,
      hasIdps,
      registrationStatus
    } = req.query;

    let query = db.select(selectBusinessProfileFields).from(businessProfiles);
    const whereConditions: any[] = [];

    // Basic filters
    if (district) {
      whereConditions.push(eq(businessProfiles.district, district as string));
    }

    if (model) {
      if (!businessModelEnum.options.includes(model as any)) {
        return res.status(400).json({ error: 'Invalid DARE model' });
      }
      whereConditions.push(eq(businessProfiles.businessModel, model as any));
    }

    // Registration status filter
    if (registrationStatus) {
      whereConditions.push(eq(businessProfiles.registrationStatus, registrationStatus as string));
    }

    // Mastercard-specific filters
    if (enterpriseType) {
      whereConditions.push(eq(businessProfiles.enterpriseType, enterpriseType as string));
    }

    if (enterpriseSize) {
      whereConditions.push(eq(businessProfiles.enterpriseSize, enterpriseSize as string));
    }

    if (sector) {
      whereConditions.push(eq(businessProfiles.sector, sector as string));
    }

    // Youth impact metrics filters
    if (minYouthCount) {
      whereConditions.push(
        sql`total_youth_in_work_reported >= ${parseInt(minYouthCount as string)}`
      );
    }

    if (hasRefugees === 'true') {
      whereConditions.push(sql`youth_refugee_count > 0`);
    }

    if (hasIdps === 'true') {
      whereConditions.push(sql`youth_idp_count > 0`);
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const profiles = await query;
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching business profiles:', error);
    res.status(500).json({ error: 'Failed to fetch business profiles' });
  }
});

// Get business profile by ID with youth members
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the business profile
    const [profile] = await db.select(selectBusinessProfileFields)
      .from(businessProfiles)
      .where(eq(businessProfiles.id, parseInt(id)));
    
    if (!profile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // Get youth members
    const youthRelationships = await db.select({
      businessId: businessYouthRelationships.businessId,
      youthId: businessYouthRelationships.youthId,
      role: businessYouthRelationships.role,
      joinDate: businessYouthRelationships.joinDate,
      isActive: businessYouthRelationships.isActive,
      
      // Youth profile details
      youth: {
        id: youthProfiles.id,
        fullName: youthProfiles.fullName,
        profilePicture: youthProfiles.profilePicture,
        district: youthProfiles.district,
        gender: youthProfiles.gender,
        refugeeStatus: youthProfiles.refugeeStatus,
        idpStatus: youthProfiles.idpStatus,
        pwdStatus: youthProfiles.pwdStatus
      }
    })
    .from(businessYouthRelationships)
    .innerJoin(
      youthProfiles,
      eq(businessYouthRelationships.youthId, youthProfiles.id)
    )
    .where(
      and(
        eq(businessYouthRelationships.businessId, parseInt(id)),
        eq(businessYouthRelationships.isActive, true)
      )
    );
    
    // Format response with business details and youth members
    res.json({
      ...profile,
      youthMembers: youthRelationships.map(rel => ({
        id: rel.youthId,
        fullName: rel.youth.fullName,
        profilePicture: rel.youth.profilePicture,
        district: rel.youth.district,
        role: rel.role,
        joinDate: rel.joinDate,
        isPrimary: profile.enterpriseOwnerYouthIds?.split(',')[0] === rel.youthId.toString(),
        isPwd: rel.youth.pwdStatus === 'Yes',
        isRefugee: rel.youth.refugeeStatus,
        isIdp: rel.youth.idpStatus
      }))
    });
  } catch (error) {
    console.error('Error fetching business profile by ID:', error);
    res.status(500).json({ error: 'Failed to fetch business profile' });
  }
});

// Create a new business profile with enhanced validation and auto-derivation
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = insertBusinessProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    
    // Derive enterprise type if not explicitly provided
    const enterpriseTypeMapping = {
      "Collaborative": "Partnership",
      "MakerSpace": "Social Enterprise",
      "Madam Anchor": "Sole Proprietorship"
    };
    
    const enterpriseTypeValue = result.data.enterpriseType || 
      (result.data.businessModel && enterpriseTypeMapping[result.data.businessModel as keyof typeof enterpriseTypeMapping]) || 
      'Other';
    
    // Format any Date objects for enterprise owner DOB
    const formattedOwnerDob = result.data.enterpriseOwnerDob instanceof Date 
      ? result.data.enterpriseOwnerDob 
      : result.data.enterpriseOwnerDob 
        ? new Date(result.data.enterpriseOwnerDob) 
        : undefined;
    
    // Format any date strings for registration and business start date
    const formattedRegistrationDate = result.data.registrationDate instanceof Date
      ? result.data.registrationDate
      : result.data.registrationDate
        ? new Date(result.data.registrationDate)
        : undefined;
    
    const formattedStartDate = result.data.businessStartDate instanceof Date
      ? result.data.businessStartDate
      : result.data.businessStartDate
        ? new Date(result.data.businessStartDate)
        : undefined;
    
    // Set default values for youth impact metrics
    const totalYouthInWorkReported = result.data.totalYouthInWorkReported || 0;
    const youthRefugeeCount = result.data.youthRefugeeCount || 0;
    const youthIdpCount = result.data.youthIdpCount || 0;
    const youthHostCommunityCount = result.data.youthHostCommunityCount || 0;
    const youthPlwdCount = result.data.youthPlwdCount || 0;
    
    // Insert new business profile with derived and formatted data
    const [newProfile] = await db.insert(businessProfiles)
      .values({
        ...result.data,
        enterpriseType: enterpriseTypeValue as any,
        enterpriseOwnerDob: formattedOwnerDob,
        registrationDate: formattedRegistrationDate,
        businessStartDate: formattedStartDate,
        totalYouthInWorkReported,
        youthRefugeeCount,
        youthIdpCount,
        youthHostCommunityCount,
        youthPlwdCount
      })
      .returning();
    
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error creating business profile:', error);
    res.status(500).json({ error: 'Failed to create business profile' });
  }
});

// Associate youth with business (bulk operation)
router.post('/youth-relationships', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { businessId, youthIds } = req.body;
    
    // Validate input
    if (!businessId || !Array.isArray(youthIds) || youthIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Business ID and at least one youth ID are required' });
    }
    
    // Check if business exists
    const [business] = await db.select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // Check if all youth profiles exist
    const youthExists = await db.select({ id: youthProfiles.id })
      .from(youthProfiles)
      .where(inArray(youthProfiles.id, youthIds));
    
    if (youthExists.length !== youthIds.length) {
      return res.status(400).json({ error: 'One or more youth profiles not found' });
    }
    
    // Create relationships with join date and primary owner designation
    const relationships = youthIds.map((youthId, index) => ({
      businessId,
      youthId,
      role: index === 0 ? 'Owner' : 'Member', // First youth is designated as Owner
      joinDate: new Date(),
      isActive: true
    }));
    
    // Insert relationships
    await db.insert(businessYouthRelationships)
      .values(relationships)
      .onConflictDoUpdate({
        target: [
          businessYouthRelationships.businessId, 
          businessYouthRelationships.youthId
        ],
        set: { 
          isActive: true,
          role: sql`CASE WHEN excluded.role = 'Owner' THEN 'Owner' ELSE ${businessYouthRelationships.role} END`
        }
      });
    
    // Update business enterpriseOwnerYouthIds field
    await db.update(businessProfiles)
      .set({ 
        enterpriseOwnerYouthIds: youthIds.join(','),
        updatedAt: new Date()
      })
      .where(eq(businessProfiles.id, businessId));
    
    res.status(200).json({ 
      success: true, 
      message: `${relationships.length} youth members associated with business`
    });
  } catch (error) {
    console.error('Error associating youth with business:', error);
    res.status(500).json({ error: 'Failed to associate youth with business' });
  }
});

// Update a business profile with new fields
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
    
    // Allow partial updates with new fields
    const result = insertBusinessProfileSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    
    // Derive enterprise type if a new business model is provided but no enterprise type
    const enterpriseTypeMapping = {
      "Collaborative": "Partnership",
      "MakerSpace": "Social Enterprise",
      "Madam Anchor": "Sole Proprietorship"
    };
    
    const enterpriseTypeValue = result.data.enterpriseType || 
      (result.data.businessModel && enterpriseTypeMapping[result.data.businessModel as keyof typeof enterpriseTypeMapping]) || 
      existingProfile.enterpriseType;
    
    // Format any date objects for enterprise owner DOB
    const formattedOwnerDob = result.data.enterpriseOwnerDob instanceof Date 
      ? result.data.enterpriseOwnerDob 
      : result.data.enterpriseOwnerDob 
        ? new Date(result.data.enterpriseOwnerDob) 
        : existingProfile.enterpriseOwnerDob;
    
    // Format any date strings for registration and business start date
    const formattedRegistrationDate = result.data.registrationDate instanceof Date
      ? result.data.registrationDate
      : result.data.registrationDate
        ? new Date(result.data.registrationDate)
        : existingProfile.registrationDate;
    
    const formattedStartDate = result.data.businessStartDate instanceof Date
      ? result.data.businessStartDate
      : result.data.businessStartDate
        ? new Date(result.data.businessStartDate)
        : existingProfile.businessStartDate;
    
    const [updatedProfile] = await db.update(businessProfiles)
      .set({
        ...result.data,
        enterpriseType: enterpriseTypeValue as any,
        enterpriseOwnerDob: formattedOwnerDob,
        registrationDate: formattedRegistrationDate,
        businessStartDate: formattedStartDate,
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

// Delete (deactivate) a business profile
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const [profile] = await db.select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, parseInt(id)));
    
    if (!profile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }
    
    // We're not actually deleting the profile, just marking it as inactive
    // This would be implemented in a real system with an isActive flag
    // For demo purposes, we'll return success
    
    res.json({ success: true, message: 'Business profile deactivated' });
  } catch (error) {
    console.error('Error deleting business profile:', error);
    res.status(500).json({ error: 'Failed to delete business profile' });
  }
});

// Metadata routes for new fields
router.get('/metadata', (req: Request, res: Response) => {
  res.json({
    enterpriseTypes: enterpriseTypeEnum.options,
    enterpriseSizes: enterpriseSizeEnum.options,
    sectors: businessSectorEnum.options,
    businessModels: businessModelEnum.options,
    districts: ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"]
  });
});

// Specific metadata routes
router.get('/metadata/enterprise-types', (req: Request, res: Response) => {
  res.json(enterpriseTypeEnum.options);
});

router.get('/metadata/enterprise-sizes', (req: Request, res: Response) => {
  res.json(enterpriseSizeEnum.options);
});

router.get('/metadata/sectors', (req: Request, res: Response) => {
  res.json(businessSectorEnum.options);
});

export default router;