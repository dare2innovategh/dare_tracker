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
  businessSectorEnum,
  mentors,
  mentorBusinessRelationships
} from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { formatZodError } from '../utils';


const router = express.Router();

// Extended schema for form validation with Mastercard fields
const businessFormSchema = insertBusinessProfileSchema.extend({
  youthIds: z.array(z.number()).min(1, { message: 'At least one youth member is recommended' }).optional(),
  enterpriseType: z.enum([
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company',
    'Cooperative',
    'Social Enterprise',
    'Other',
  ]).optional(),
  enterpriseSize: z.enum(['Micro', 'Small', 'Medium', 'Large']).optional(),
  implementingPartnerName: z.string().optional(),
  totalYouthInWorkReported: z.number().int().optional().default(0),
  youthRefugeeCount: z.number().int().optional().default(0),
  youthIdpCount: z.number().int().optional().default(0),
  youthHostCommunityCount: z.number().int().optional().default(0),
  youthPlwdCount: z.number().int().optional().default(0),
});

// Interface for owner details
interface EnterpriseOwnerDetails {
  enterpriseOwnerYouthIds: string;
  enterpriseOwnerName: string;
  enterpriseOwnerDob: Date | undefined;
  enterpriseOwnerSex: string | undefined;
}

// Database fix for NULL JSON fields - FIXED VERSION
const fixDatabaseNulls = async () => {
  try {
    console.log("Running database NULL and invalid JSON fix for JSON fields...");
    
    // Use separate UPDATE statements instead of a single UPDATE with multiple conditions
    await db.execute(sql`UPDATE business_profiles SET business_objectives = '[]'::jsonb WHERE business_objectives IS NULL`);
    await db.execute(sql`UPDATE business_profiles SET short_term_goals = '[]'::jsonb WHERE short_term_goals IS NULL`);
    await db.execute(sql`UPDATE business_profiles SET sub_partner_names = '[]'::jsonb WHERE sub_partner_names IS NULL`);
    await db.execute(sql`UPDATE business_profiles SET enterprise_owner_youth_ids = '[]'::jsonb WHERE enterprise_owner_youth_ids IS NULL`);
    
    // Fix invalid JSON in enterprise_owner_youth_ids
    await db.execute(sql`
      UPDATE business_profiles
      SET enterprise_owner_youth_ids = '[]'::jsonb
      WHERE enterprise_owner_youth_ids IS NOT NULL
      AND NOT (
        enterprise_owner_youth_ids::text ~ '^\[.*\]$'
        AND enterprise_owner_youth_ids::jsonb IS NOT NULL
      )
    `);
    
    console.log("Database NULL and invalid JSON fixes completed successfully");
  } catch (error) {
    console.error("Error fixing database NULLs and invalid JSON:", error);
  }
};
fixDatabaseNulls();

// Helper function to derive enterprise owner details
const deriveEnterpriseOwnerDetails = async (
  selectedYouthIds: number[], 
  youthProfiles: any[]
): Promise<EnterpriseOwnerDetails | null> => {
  if (!selectedYouthIds || selectedYouthIds.length === 0) return null;

  const primaryOwnerId = selectedYouthIds[0];
  const primaryOwner = youthProfiles.find(youth => youth.id === primaryOwnerId);

  if (!primaryOwner) return null;

  return {
    enterpriseOwnerYouthIds: JSON.stringify(selectedYouthIds),
    enterpriseOwnerName: selectedYouthIds.length > 1
      ? `${primaryOwner.fullName} + ${selectedYouthIds.length - 1} others`
      : primaryOwner.fullName,
    enterpriseOwnerDob: primaryOwner.dateOfBirth ? new Date(primaryOwner.dateOfBirth) : undefined,
    enterpriseOwnerSex: primaryOwner.gender,
  };
};

// Helper function to calculate youth impact metrics
const calculateYouthImpactMetrics = (
  youthIds: number[],
  youthProfiles: any[]
): {
  totalYouthInWorkReported: number;
  youthRefugeeCount: number;
  youthIdpCount: number;
  youthHostCommunityCount: number;
  youthPlwdCount: number;
} => {
  const totalYouthInWorkReported = youthIds.length;
  const youthRefugeeCount = youthIds.filter(id =>
    youthProfiles.find(y => y.id === id)?.refugeeStatus
  ).length;
  const youthIdpCount = youthIds.filter(id =>
    youthProfiles.find(y => y.id === id)?.idpStatus
  ).length;
  const youthHostCommunityCount = youthIds.filter(id =>
    youthProfiles.find(y => y.id === id)?.hostCommunityStatus === 'Yes'
  ).length;
  const youthPlwdCount = youthIds.filter(id =>
    youthProfiles.find(y => y.id === id)?.pwdStatus === 'Yes'
  ).length;

  return {
    totalYouthInWorkReported,
    youthRefugeeCount,
    youthIdpCount,
    youthHostCommunityCount,
    youthPlwdCount,
  };
};

// Helper function to select a mentor for auto-assignment
const selectMentorForAssignment = async (businessDistrict: string): Promise<number | null> => {
  try {
    console.log(`Selecting mentor for district: ${businessDistrict}`);
    
    // First, let's verify the district value is clean and normalized
    const normalizedDistrict = businessDistrict.trim();
    
    // Fetch mentors manually to ensure we can inspect the data
    const allMentors = await db
      .select({
        id: mentors.id,
        assignedDistrict: mentors.assignedDistrict,
        assignedDistricts: mentors.assignedDistricts,
        isActive: mentors.isActive
      })
      .from(mentors)
      .where(eq(mentors.isActive, true));
    
    console.log("All active mentors:", allMentors.map(m => ({ 
      id: m.id, 
      district: m.assignedDistrict,
      districts: m.assignedDistricts 
    })));
    
    // Filter mentors manually to ensure exact matching
    const districtMentors = allMentors.filter(mentor => {
      // Check legacy single district field
      if (mentor.assignedDistrict === normalizedDistrict) {
        console.log(`Mentor ${mentor.id} matches district ${normalizedDistrict} via single district`);
        return true;
      }
      
      // Check JSON array of districts if available
      if (mentor.assignedDistricts) {
        try {
          const districts = typeof mentor.assignedDistricts === 'string' 
            ? JSON.parse(mentor.assignedDistricts) 
            : mentor.assignedDistricts;
            
          if (Array.isArray(districts) && districts.some(d => d === normalizedDistrict)) {
            console.log(`Mentor ${mentor.id} matches district ${normalizedDistrict} via districts array`);
            return true;
          }
        } catch (e) {
          console.error(`Error parsing districts for mentor ${mentor.id}:`, e);
        }
      }
      
      return false;
    });
    
    console.log(`Found ${districtMentors.length} mentors for district ${normalizedDistrict}`);
    
    if (districtMentors.length === 0) {
      console.log(`No mentors available for district: ${normalizedDistrict}`);
      return null;
    }

    // Count the number of active business assignments for each mentor
    const mentorAssignments = await db
      .select({
        mentorId: mentorBusinessRelationships.mentorId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.isActive, true))
      .groupBy(mentorBusinessRelationships.mentorId);

    // Create a map of mentor ID to assignment count
    const assignmentCounts = new Map<number, number>();
    mentorAssignments.forEach(assignment => {
      assignmentCounts.set(assignment.mentorId, assignment.count);
    });

    // Find the mentor with the fewest assignments among the district-matched mentors
    let selectedMentorId: number | null = null;
    let minAssignments = Infinity;

    for (const mentor of districtMentors) {
      const assignmentCount = assignmentCounts.get(mentor.id) || 0;
      if (assignmentCount < minAssignments) {
        minAssignments = assignmentCount;
        selectedMentorId = mentor.id;
      }
    }

    console.log(`Selected mentor ID ${selectedMentorId} for district ${normalizedDistrict}`);
    return selectedMentorId;
  } catch (error) {
    console.error("Error selecting mentor for assignment:", error);
    return null;
  }
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
      registrationStatus,
      implementingPartner
    } = req.query;

    const queryParts = [
      `SELECT 
        id, 
        business_name as "businessName",  
        business_logo as "businessLogo",
        district,
        business_location as "businessLocation",
        business_contact as "businessContact",
        business_email as "businessEmail",
        business_description as "businessDescription",
        business_model as "businessModel",
        dare_model as "dareModel",
        service_category_id as "serviceCategoryId",
        service_subcategory_id as "serviceSubcategoryId",
        business_start_date as "businessStartDate",
        registration_status as "registrationStatus",
        registration_number as "registrationNumber",
        registration_date as "registrationDate",
        tax_identification_number as "taxIdentificationNumber",
        COALESCE(business_objectives, '[]'::jsonb) as "businessObjectives",
        COALESCE(short_term_goals, '[]'::jsonb) as "shortTermGoals",
        target_market as "targetMarket",
        enterprise_owner_youth_ids as "enterpriseOwnerYouthIds",
        enterprise_owner_name as "enterpriseOwnerName",
        enterprise_owner_dob as "enterpriseOwnerDob",
        enterprise_owner_sex as "enterpriseOwnerSex",
        implementing_partner_name as "implementingPartnerName",
        enterprise_type as "enterpriseType",
        enterprise_size as "enterpriseSize",
        COALESCE(sub_partner_names, '[]'::jsonb) as "subPartnerNames",
        sector,
        total_youth_in_work_reported as "totalYouthInWorkReported",
        youth_refugee_count as "youthRefugeeCount",
        youth_idp_count as "youthIdpCount",
        youth_host_community_count as "youthHostCommunityCount",
        youth_plwd_count as "youthPlwdCount",
        primary_phone_number as "primaryPhoneNumber",
        additional_phone_number_1 as "additionalPhoneNumber1",
        additional_phone_number_2 as "additionalPhoneNumber2",
        country,
        admin_level_1 as "adminLevel1",
        admin_level_2 as "adminLevel2",
        admin_level_3 as "adminLevel3",
        admin_level_4 as "adminLevel4",
        admin_level_5 as "adminLevel5",
        partner_start_date as "partnerStartDate",
        program_name as "programName",
        program_details as "programDetails",
        program_contact_person as "programContactPerson",
        program_contact_phone_number as "programContactPhoneNumber",
        new_data_submission as "newDataSubmission",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM business_profiles
      WHERE 1=1`
    ];
    
    const params: any[] = [];

    if (district) {
      params.push(district);
      queryParts.push(`AND district = $${params.length}`);
    }

    if (model && businessModelEnum.options.includes(model as any)) {
      params.push(model);
      queryParts.push(`AND business_model = $${params.length}`);
    }

    if (registrationStatus) {
      params.push(registrationStatus);
      queryParts.push(`AND registration_status = $${params.length}`);
    }

    if (enterpriseType) {
      params.push(enterpriseType);
      queryParts.push(`AND enterprise_type = $${params.length}`);
    }

    if (enterpriseSize) {
      params.push(enterpriseSize);
      queryParts.push(`AND enterprise_size = $${params.length}`);
    }

    if (sector) {
      params.push(sector);
      queryParts.push(`AND sector = $${params.length}`);
    }
    
    if (implementingPartner) {
      params.push(implementingPartner);
      queryParts.push(`AND implementing_partner_name = $${params.length}`);
    }

    if (minYouthCount) {
      params.push(parseInt(minYouthCount as string));
      queryParts.push(`AND total_youth_in_work_reported >= $${params.length}`);
    }

    if (hasRefugees === 'true') {
      queryParts.push(`AND youth_refugee_count > 0`);
    }

    if (hasIdps === 'true') {
      queryParts.push(`AND youth_idp_count > 0`);
    }

    const fullQuery = queryParts.join(' ');
    const result = await db.execute(sql.raw(fullQuery, params));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching business profiles:', error);
    res.status(500).json({ error: 'Failed to fetch business profiles', details: error.message });
  }
});

// Get business profile by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const businessId = parseInt(id);
    console.log(`Fetching business profile for ID: ${businessId}`);

    const profileResult = await db
      .select({
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
        taxIdentificationNumber: businessProfiles.taxIdentificationNumber,
        businessObjectives: sql`COALESCE(${businessProfiles.businessObjectives}, '[]'::jsonb)`,
        shortTermGoals: sql`COALESCE(${businessProfiles.shortTermGoals}, '[]'::jsonb)`,
        targetMarket: businessProfiles.targetMarket,
        enterpriseOwnerYouthIds: businessProfiles.enterpriseOwnerYouthIds,
        enterpriseOwnerName: businessProfiles.enterpriseOwnerName,
        enterpriseOwnerDob: businessProfiles.enterpriseOwnerDob,
        enterpriseOwnerSex: businessProfiles.enterpriseOwnerSex,
        implementingPartnerName: businessProfiles.implementingPartnerName,
        enterpriseType: businessProfiles.enterpriseType,
        enterpriseSize: businessProfiles.enterpriseSize,
        subPartnerNames: sql`COALESCE(${businessProfiles.subPartnerNames}, '[]'::jsonb)`,
        sector: businessProfiles.sector,
        totalYouthInWorkReported: businessProfiles.totalYouthInWorkReported,
        youthRefugeeCount: businessProfiles.youthRefugeeCount,
        youthIdpCount: businessProfiles.youthIdpCount,
        youthHostCommunityCount: businessProfiles.youthHostCommunityCount,
        youthPlwdCount: businessProfiles.youthPlwdCount,
        primaryPhoneNumber: businessProfiles.primaryPhoneNumber,
        additionalPhoneNumber1: businessProfiles.additionalPhoneNumber1,
        additionalPhoneNumber2: businessProfiles.additionalPhoneNumber2,
        country: businessProfiles.country,
        adminLevel1: businessProfiles.adminLevel1,
        adminLevel2: businessProfiles.adminLevel2,
        adminLevel3: businessProfiles.adminLevel3,
        adminLevel4: businessProfiles.adminLevel4,
        adminLevel5: businessProfiles.adminLevel5,
        partnerStartDate: businessProfiles.partnerStartDate,
        programName: businessProfiles.programName,
        programDetails: businessProfiles.programDetails,
        programContactPerson: businessProfiles.programContactPerson,
        programContactPhoneNumber: businessProfiles.programContactPhoneNumber,
        newDataSubmission: businessProfiles.newDataSubmission,
        createdAt: businessProfiles.createdAt,
        updatedAt: businessProfiles.updatedAt,
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));

    if (profileResult.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const profile = profileResult[0];
    res.json(profile);
  } catch (error) {
    console.error('Error fetching business profile by ID:', error);
    res.status(500).json({ error: 'Failed to fetch business profile', details: error.message });
  }
});

// Get youth members for a business profile
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const businessId = parseInt(id);
    console.log(`Fetching youth members for business ID: ${businessId}`);

    // Fetch business profile to get enterpriseOwnerYouthIds
    const businessResult = await db
      .select({
        enterpriseOwnerYouthIds: businessProfiles.enterpriseOwnerYouthIds,
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));

    if (businessResult.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    const business = businessResult[0];

    // Parse enterpriseOwnerYouthIds with enhanced handling
    let ownerIds: number[] = [];
    if (business.enterpriseOwnerYouthIds) {
      try {
        // Log the raw value for debugging
        console.log(`Parsing enterpriseOwnerYouthIds for business ${businessId}:`, business.enterpriseOwnerYouthIds);

        // Ensure it's a string before parsing
        const jsonString = typeof business.enterpriseOwnerYouthIds === 'string'
          ? business.enterpriseOwnerYouthIds
          : JSON.stringify(business.enterpriseOwnerYouthIds);

        // Validate JSON format
        if (!jsonString.match(/^\[.*\]$/)) {
          console.warn(`Invalid JSON format for enterpriseOwnerYouthIds in business ${businessId}:`, jsonString);
          throw new Error('Invalid JSON format');
        }

        const parsedIds = JSON.parse(jsonString);
        ownerIds = Array.isArray(parsedIds) ? parsedIds.map((id: any) => parseInt(id)) : [];
      } catch (e) {
        console.error(`Failed to parse enterprise_owner_youth_ids for business ${businessId}:`, business.enterpriseOwnerYouthIds, e);
        ownerIds = [];
      }
    }

    // Fetch youth members
    const youthResult = await db
      .select({
        businessId: businessYouthRelationships.businessId,
        youthId: businessYouthRelationships.youthId,
        role: businessYouthRelationships.role,
        joinDate: businessYouthRelationships.joinDate,
        isActive: businessYouthRelationships.isActive,
        id: youthProfiles.id,
        fullName: youthProfiles.fullName,
        firstName: youthProfiles.firstName,
        middleName: youthProfiles.middleName,
        lastName: youthProfiles.lastName,
        profilePicture: youthProfiles.profilePicture,
        district: youthProfiles.district,
        gender: youthProfiles.gender,
        dateOfBirth: youthProfiles.dateOfBirth,
        phoneNumber: youthProfiles.phoneNumber,
        email: youthProfiles.email,
        additionalPhoneNumber1: youthProfiles.additionalPhoneNumber1,
        additionalPhoneNumber2: youthProfiles.additionalPhoneNumber2,
        refugeeStatus: youthProfiles.refugeeStatus,
        idpStatus: youthProfiles.idpStatus,
        pwdStatus: youthProfiles.pwdStatus,
        hostCommunityStatus: youthProfiles.hostCommunityStatus,
      })
      .from(businessYouthRelationships)
      .innerJoin(youthProfiles, eq(businessYouthRelationships.youthId, youthProfiles.id))
      .where(and(
        eq(businessYouthRelationships.businessId, businessId),
        eq(businessYouthRelationships.isActive, true)
      ));

    // Format youth members
    const youthMembers = youthResult.map(rel => ({
      id: rel.youthId,
      fullName: rel.fullName || `${rel.firstName} ${rel.middleName ? rel.middleName + ' ' : ''}${rel.lastName}`,
      profilePicture: rel.profilePicture,
      district: rel.district,
      role: rel.role,
      joinDate: rel.joinDate,
      isPrimary: ownerIds.length > 0 && ownerIds[0] === rel.youthId,
      isPwd: rel.pwdStatus === 'Yes',
      isRefugee: rel.refugeeStatus,
      isIdp: rel.idpStatus,
      isHostCommunity: rel.hostCommunityStatus === 'Yes',
      gender: rel.gender,
      dateOfBirth: rel.dateOfBirth,
      phoneNumber: rel.phoneNumber,
      email: rel.email,
      additionalPhoneNumber1: rel.additionalPhoneNumber1,
      additionalPhoneNumber2: rel.additionalPhoneNumber2,
    }));

    res.json(youthMembers);
  } catch (error) {
    console.error('Error fetching youth members:', error);
    res.status(500).json({ error: 'Failed to fetch youth members', details: error.message });
  }
});
// Get mentor assignments for a business profile
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

// Create a new business profile with enhanced validation, Mastercard fields, and auto-assignment of mentors
// Create a new business profile with enhanced validation, Mastercard fields, and auto-assignment of mentors
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = businessFormSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }

    const { youthIds, mentorId, ...businessData } = result.data;

    // Fetch youth profiles for owner details and metrics
    let youthProfiles: any[] = [];
    if (youthIds && youthIds.length > 0) {
      const youthQuery = await db
        .select({
          id: youthProfiles.id,
          fullName: youthProfiles.fullName,
          firstName: youthProfiles.firstName,
          middleName: youthProfiles.middleName,
          lastName: youthProfiles.lastName,
          dateOfBirth: youthProfiles.dateOfBirth,
          gender: youthProfiles.gender,
          refugeeStatus: youthProfiles.refugeeStatus,
          idpStatus: youthProfiles.idpStatus,
          hostCommunityStatus: youthProfiles.hostCommunityStatus,
          pwdStatus: youthProfiles.pwdStatus,
        })
        .from(youthProfiles)
        .where(inArray(youthProfiles.id, youthIds));
      youthProfiles = youthQuery;
    }

    // Derive enterprise type
    const enterpriseTypeMapping = {
      Collaborative: 'Partnership',
      MakerSpace: 'Social Enterprise',
      'Madam Anchor': 'Sole Proprietorship',
    };
    const enterpriseType = businessData.enterpriseType ||
      (businessData.businessModel
        ? enterpriseTypeMapping[businessData.businessModel as keyof typeof enterpriseTypeMapping]
        : 'Other');

    // Derive owner details
    const ownerDetails = await deriveEnterpriseOwnerDetails(youthIds || [], youthProfiles);

    // Calculate youth impact metrics
    const youthMetrics = calculateYouthImpactMetrics(youthIds || [], youthProfiles);

    // Format dates properly - fix for formattedStartDate
    const businessStartDate = businessData.businessStartDate instanceof Date
      ? businessData.businessStartDate
      : businessData.businessStartDate
        ? new Date(businessData.businessStartDate)
        : new Date();

    const registrationDate = businessData.registrationDate instanceof Date
      ? businessData.registrationDate
      : businessData.registrationDate
        ? new Date(businessData.registrationDate)
        : null;

    const partnerStartDate = businessData.partnerStartDate instanceof Date
      ? businessData.partnerStartDate
      : businessData.partnerStartDate
        ? new Date(businessData.partnerStartDate)
        : null;

    const ownerDob = ownerDetails?.enterpriseOwnerDob || null;

    // Ensure JSON fields are arrays
    const businessObjectives = Array.isArray(businessData.businessObjectives)
      ? businessData.businessObjectives
      : [];

    const shortTermGoals = Array.isArray(businessData.shortTermGoals)
      ? businessData.shortTermGoals
      : [];

    const subPartnerNames = Array.isArray(businessData.subPartnerNames)
      ? businessData.subPartnerNames
      : [];

    // Use drizzle's query builder to insert the business profile
    const newBusinessResult = await db.insert(businessProfiles).values({
      businessName: businessData.businessName,
      businessLogo: businessData.businessLogo || null,
      district: businessData.district,
      businessLocation: businessData.businessLocation || null,
      businessContact: businessData.businessContact || null,
      businessEmail: businessData.businessEmail || null,
      businessDescription: businessData.businessDescription || null,
      businessModel: businessData.businessModel || null,
      dareModel: businessData.dareModel || null,
      serviceCategoryId: businessData.serviceCategoryId || null,
      serviceSubcategoryId: businessData.serviceSubcategoryId || null,
      businessStartDate: businessStartDate,
      registrationStatus: businessData.registrationStatus || 'Unregistered',
      registrationNumber: businessData.registrationNumber || null,
      registrationDate: registrationDate,
      taxIdentificationNumber: businessData.taxIdentificationNumber || null,
      businessObjectives: JSON.stringify(businessObjectives),
      shortTermGoals: JSON.stringify(shortTermGoals),
      targetMarket: businessData.targetMarket || null,
      enterpriseOwnerYouthIds: ownerDetails?.enterpriseOwnerYouthIds || '[]',
      enterpriseOwnerName: ownerDetails?.enterpriseOwnerName || null,
      enterpriseOwnerDob: ownerDob,
      enterpriseOwnerSex: ownerDetails?.enterpriseOwnerSex || null,
      implementingPartnerName: businessData.implementingPartnerName || null,
      enterpriseType: enterpriseType || null,
      enterpriseSize: businessData.enterpriseSize || null,
      subPartnerNames: JSON.stringify(subPartnerNames),
      sector: businessData.sector || null,
      totalYouthInWorkReported: youthMetrics.totalYouthInWorkReported || 0,
      youthRefugeeCount: youthMetrics.youthRefugeeCount || 0,
      youthIdpCount: youthMetrics.youthIdpCount || 0,
      youthHostCommunityCount: youthMetrics.youthHostCommunityCount || 0,
      youthPlwdCount: youthMetrics.youthPlwdCount || 0,
      primaryPhoneNumber: businessData.primaryPhoneNumber || null,
      additionalPhoneNumber1: businessData.additionalPhoneNumber1 || null,
      additionalPhoneNumber2: businessData.additionalPhoneNumber2 || null,
      country: businessData.country || 'Ghana',
      adminLevel1: businessData.adminLevel1 || businessData.district || null,
      adminLevel2: businessData.adminLevel2 || null,
      adminLevel3: businessData.adminLevel3 || null,
      adminLevel4: businessData.adminLevel4 || null,
      adminLevel5: businessData.adminLevel5 || null,
      partnerStartDate: partnerStartDate,
      programName: businessData.programName || null,
      programDetails: businessData.programDetails || null,
      programContactPerson: businessData.programContactPerson || null,
      programContactPhoneNumber: businessData.programContactPhoneNumber || null,
      deliverySetup: businessData.deliverySetup || false,
      deliveryType: businessData.deliveryType || null,
      expectedWeeklyRevenue: businessData.expectedWeeklyRevenue || 0,
      expectedMonthlyRevenue: businessData.expectedMonthlyRevenue || 0,
      anticipatedMonthlyExpenditure: businessData.anticipatedMonthlyExpenditure || 0,
      expectedMonthlyProfit: businessData.expectedMonthlyProfit || 0,
      paymentStructure: businessData.paymentStructure || null,
      socialMediaLinks: businessData.socialMediaLinks || null,
      newDataSubmission: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    if (!newBusinessResult || newBusinessResult.length === 0) {
      throw new Error('Failed to create business profile');
    }
    
    const newProfile = newBusinessResult[0];

    // Associate youth with business if youthIds provided
    if (youthIds && youthIds.length > 0) {
      for (let i = 0; i < youthIds.length; i++) {
        const youthId = youthIds[i];
        await db.insert(businessYouthRelationships).values({
          businessId: newProfile.id,
          youthId: youthId,
          role: i === 0 ? 'Owner' : 'Member',
          joinDate: new Date(),
          isActive: true
        });
      }
    }

    // Manually handle mentor assignment based on district
let selectedMentorId = mentorId;
if (!selectedMentorId) {
  console.log(`Attempting to select a mentor for business in district: ${businessData.district}`);
  selectedMentorId = await selectMentorForAssignment(businessData.district);
}

if (selectedMentorId) {
  await db.insert(mentorBusinessRelationships).values({
    mentorId: selectedMentorId,
    businessId: newProfile.id,
    assignedDate: new Date(),
    isActive: true,
    mentorshipFocus: 'Business Growth'
  });
  console.log(`Assigned mentor ID ${selectedMentorId} to business ID ${newProfile.id} in district ${businessData.district}`);
} else {
  // If no mentor for this district, log this and continue without mentor assignment
  console.log(`No mentor assigned to business ID ${newProfile.id}: No available mentors for district ${businessData.district}`);
}
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error creating business profile:', error);
    res.status(500).json({ error: 'Failed to create business profile', details: error.message });
  }
});

// Associate youth with business
router.post('/youth-relationships', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { businessId, youthIds } = req.body;

    if (!businessId || !Array.isArray(youthIds) || youthIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Business ID and at least one youth ID are required' });
    }

    // First check if the business exists
    const businessExists = await db
      .select({ id: businessProfiles.id })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));

    if (businessExists.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    // Fetch youth profiles
    const youthResults = await db
      .select({
        id: youthProfiles.id,
        fullName: youthProfiles.fullName,
        firstName: youthProfiles.firstName,
        middleName: youthProfiles.middleName,
        lastName: youthProfiles.lastName,
        gender: youthProfiles.gender,
        dateOfBirth: youthProfiles.dateOfBirth,
        phoneNumber: youthProfiles.phoneNumber,
        email: youthProfiles.email,
        additionalPhoneNumber1: youthProfiles.additionalPhoneNumber1,
        additionalPhoneNumber2: youthProfiles.additionalPhoneNumber2,
        refugeeStatus: youthProfiles.refugeeStatus,
        idpStatus: youthProfiles.idpStatus,
        hostCommunityStatus: youthProfiles.hostCommunityStatus,
        pwdStatus: youthProfiles.pwdStatus
      })
      .from(youthProfiles)
      .where(inArray(youthProfiles.id, youthIds));

    if (youthResults.length !== youthIds.length) {
      return res.status(400).json({ error: 'One or more youth profiles not found' });
    }

    // Calculate youth impact metrics
    const youthMetrics = calculateYouthImpactMetrics(youthIds, youthResults);

    // Derive owner details
    const ownerDetails = await deriveEnterpriseOwnerDetails(youthIds, youthResults);

    // Delete existing relationships for these youth
    await db
      .delete(businessYouthRelationships)
      .where(
        and(
          eq(businessYouthRelationships.businessId, businessId),
          inArray(businessYouthRelationships.youthId, youthIds)
        )
      );

    // Insert new relationships
    for (let i = 0; i < youthIds.length; i++) {
      await db.insert(businessYouthRelationships).values({
        businessId: businessId,
        youthId: youthIds[i],
        role: i === 0 ? 'Owner' : 'Member',
        joinDate: new Date(),
        isActive: true
      });
    }

    // Get primary owner and sub-partners details
    const primaryOwner = youthResults.find(y => y.id === youthIds[0]);
    if (!primaryOwner) {
      return res.status(400).json({ error: 'Primary youth owner not found' });
    }

    const ownerName = ownerDetails?.enterpriseOwnerName || primaryOwner.fullName || 
      `${primaryOwner.firstName} ${primaryOwner.middleName ? primaryOwner.middleName + ' ' : ''}${primaryOwner.lastName}`;

    const subPartners = youthResults.filter(y => y.id !== youthIds[0]);
    const subPartnerNames = subPartners.map(partner => 
      partner.fullName || `${partner.firstName} ${partner.middleName ? partner.middleName + ' ' : ''}${partner.lastName}`
    );

    // Update business profile with youth details
    await db
      .update(businessProfiles)
      .set({
        enterpriseOwnerYouthIds: ownerDetails?.enterpriseOwnerYouthIds || JSON.stringify(youthIds),
        enterpriseOwnerName: ownerName,
        enterpriseOwnerDob: primaryOwner.dateOfBirth,
        enterpriseOwnerSex: primaryOwner.gender,
        primaryPhoneNumber: primaryOwner.phoneNumber || null,
        additionalPhoneNumber1: primaryOwner.additionalPhoneNumber1 || null,
        additionalPhoneNumber2: primaryOwner.additionalPhoneNumber2 || null,
        businessEmail: primaryOwner.email || null,
        subPartnerNames: JSON.stringify(subPartnerNames),
        enterpriseType: youthIds.length > 1 ? 'Partnership' : 'Sole Proprietorship',
        enterpriseSize: youthIds.length <= 5 ? 'Micro' : youthIds.length <= 20 ? 'Small' : 'Medium',
        totalYouthInWorkReported: youthMetrics.totalYouthInWorkReported,
        youthRefugeeCount: youthMetrics.youthRefugeeCount,
        youthIdpCount: youthMetrics.youthIdpCount,
        youthHostCommunityCount: youthMetrics.youthHostCommunityCount,
        youthPlwdCount: youthMetrics.youthPlwdCount,
        updatedAt: new Date()
      })
      .where(eq(businessProfiles.id, businessId));

    res.status(200).json({
      success: true,
      message: `${youthIds.length} youth members associated with business`
    });
  } catch (error) {
    console.error('Error associating youth with business:', error);
    res.status(500).json({ error: 'Failed to associate youth with business', details: error.message });
  }
});
// Update a business profile
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = parseInt(req.params.id, 10);

    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    // For debugging
    console.log("Received PATCH request for business ID:", businessId);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Extract data
    const { youthIds, ...updateData } = req.body;

    // Log the received financial data for debugging
    console.log("Received financial data:", {
      expectedWeeklyRevenue: req.body.expectedWeeklyRevenue,
      expectedMonthlyRevenue: req.body.expectedMonthlyRevenue,
      anticipatedMonthlyExpenditure: req.body.anticipatedMonthlyExpenditure,
      expectedMonthlyProfit: req.body.expectedMonthlyProfit,
      paymentStructure: req.body.paymentStructure
    });

    // Prepare data for update
    const cleanedData: any = { ...updateData };

    // Process JSON array fields with improved handling
    if (updateData.businessObjectives !== undefined) {
      console.log("Processing businessObjectives:", updateData.businessObjectives);
      if (Array.isArray(updateData.businessObjectives)) {
        cleanedData.businessObjectives = JSON.stringify(updateData.businessObjectives);
      } else if (typeof updateData.businessObjectives === 'string') {
        try {
          // Check if it's already a JSON string
          JSON.parse(updateData.businessObjectives);
          cleanedData.businessObjectives = updateData.businessObjectives;
        } catch (e) {
          // Not a JSON string, convert to JSON array
          cleanedData.businessObjectives = JSON.stringify(
            updateData.businessObjectives
              .split('\n')
              .filter((line: string) => line.trim().length > 0)
          );
        }
      } else {
        cleanedData.businessObjectives = '[]';
      }
    }

    if (updateData.shortTermGoals !== undefined) {
      console.log("Processing shortTermGoals:", updateData.shortTermGoals);
      if (Array.isArray(updateData.shortTermGoals)) {
        cleanedData.shortTermGoals = JSON.stringify(updateData.shortTermGoals);
      } else if (typeof updateData.shortTermGoals === 'string') {
        try {
          // Check if it's already a JSON string
          JSON.parse(updateData.shortTermGoals);
          cleanedData.shortTermGoals = updateData.shortTermGoals;
        } catch (e) {
          // Not a JSON string, convert to JSON array
          cleanedData.shortTermGoals = JSON.stringify(
            updateData.shortTermGoals
              .split('\n')
              .filter((line: string) => line.trim().length > 0)
          );
        }
      } else {
        cleanedData.shortTermGoals = '[]';
      }
    }

    if (updateData.subPartnerNames !== undefined) {
      console.log("Processing subPartnerNames:", updateData.subPartnerNames);
      if (Array.isArray(updateData.subPartnerNames)) {
        cleanedData.subPartnerNames = JSON.stringify(updateData.subPartnerNames);
      } else if (typeof updateData.subPartnerNames === 'string') {
        try {
          // Check if it's already a JSON string
          JSON.parse(updateData.subPartnerNames);
          cleanedData.subPartnerNames = updateData.subPartnerNames;
        } catch (e) {
          // Not a JSON string, convert to JSON array
          cleanedData.subPartnerNames = JSON.stringify(
            updateData.subPartnerNames
              .split('\n')
              .filter((line: string) => line.trim().length > 0)
          );
        }
      } else {
        cleanedData.subPartnerNames = '[]';
      }
    }

    // Ensure financial fields are properly converted to numbers
    const financialFields = {
      expectedWeeklyRevenue: typeof req.body.expectedWeeklyRevenue === 'string' 
        ? parseFloat(req.body.expectedWeeklyRevenue) || 0 
        : req.body.expectedWeeklyRevenue || 0,
        
      expectedMonthlyRevenue: typeof req.body.expectedMonthlyRevenue === 'string' 
        ? parseFloat(req.body.expectedMonthlyRevenue) || 0 
        : req.body.expectedMonthlyRevenue || 0,
        
      anticipatedMonthlyExpenditure: typeof req.body.anticipatedMonthlyExpenditure === 'string' 
        ? parseFloat(req.body.anticipatedMonthlyExpenditure) || 0 
        : req.body.anticipatedMonthlyExpenditure || 0,
        
      expectedMonthlyProfit: typeof req.body.expectedMonthlyProfit === 'string' 
        ? parseFloat(req.body.expectedMonthlyProfit) || 0 
        : req.body.expectedMonthlyProfit || 0
    };

    // Update financial fields in cleaned data
    cleanedData.expectedWeeklyRevenue = financialFields.expectedWeeklyRevenue;
    cleanedData.expectedMonthlyRevenue = financialFields.expectedMonthlyRevenue;
    cleanedData.anticipatedMonthlyExpenditure = financialFields.anticipatedMonthlyExpenditure;
    cleanedData.expectedMonthlyProfit = financialFields.expectedMonthlyProfit;
    cleanedData.paymentStructure = req.body.paymentStructure || null;

    // Set the updated timestamp
    cleanedData.updatedAt = new Date();

    console.log("Processed financial data for update:", {
      expectedWeeklyRevenue: cleanedData.expectedWeeklyRevenue,
      expectedMonthlyRevenue: cleanedData.expectedMonthlyRevenue,
      anticipatedMonthlyExpenditure: cleanedData.anticipatedMonthlyExpenditure,
      expectedMonthlyProfit: cleanedData.expectedMonthlyProfit,
      paymentStructure: cleanedData.paymentStructure
    });

    console.log("Processed JSON fields:", {
      businessObjectives: cleanedData.businessObjectives,
      shortTermGoals: cleanedData.shortTermGoals,
      subPartnerNames: cleanedData.subPartnerNames
    });

    // Update business profile
    const updateResult = await db
      .update(businessProfiles)
      .set(cleanedData)
      .where(eq(businessProfiles.id, businessId))
      .returning();

    if (updateResult.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    // If youth IDs are provided, handle youth relationships
    if (youthIds && Array.isArray(youthIds) && youthIds.length > 0) {
      console.log("Updating youth relationships for business:", businessId);
      console.log("Youth IDs:", youthIds);

      try {
        // Update youth-business relationships
        const existingRelationships = await db
          .select()
          .from(businessYouthRelationships)
          .where(eq(businessYouthRelationships.businessId, businessId));

        console.log("Existing relationships:", existingRelationships.length);

        // Deactivate all existing relationships
        await db
          .update(businessYouthRelationships)
          .set({ isActive: false })
          .where(eq(businessYouthRelationships.businessId, businessId));

        // Add or reactivate relationships for selected youth
        for (let i = 0; i < youthIds.length; i++) {
          const youthId = youthIds[i];
          const existing = existingRelationships.find(
            rel => rel.youthId === youthId
          );

          if (existing) {
            // Update existing relationship
            await db
              .update(businessYouthRelationships)
              .set({
                role: i === 0 ? 'Owner' : 'Member',
                isActive: true
              })
              .where(
                and(
                  eq(businessYouthRelationships.businessId, businessId),
                  eq(businessYouthRelationships.youthId, youthId)
                )
              );
          } else {
            // Create new relationship
            await db.insert(businessYouthRelationships).values({
              businessId,
              youthId,
              role: i === 0 ? 'Owner' : 'Member',
              joinDate: new Date(),
              isActive: true
            });
          }
        }

        // Update enterprise owner details in business profile
        const youthData = await db
          .select()
          .from(youthProfiles)
          .where(inArray(youthProfiles.id, youthIds));

        if (youthData.length > 0) {
          const ownerDetails = await deriveEnterpriseOwnerDetails(youthIds, youthData);
          const youthMetrics = calculateYouthImpactMetrics(youthIds, youthData);

          if (ownerDetails) {
            await db
              .update(businessProfiles)
              .set({
                enterpriseOwnerYouthIds: ownerDetails.enterpriseOwnerYouthIds,
                enterpriseOwnerName: ownerDetails.enterpriseOwnerName,
                enterpriseOwnerDob: ownerDetails.enterpriseOwnerDob,
                enterpriseOwnerSex: ownerDetails.enterpriseOwnerSex,
                totalYouthInWorkReported: youthMetrics.totalYouthInWorkReported,
                youthRefugeeCount: youthMetrics.youthRefugeeCount,
                youthIdpCount: youthMetrics.youthIdpCount,
                youthHostCommunityCount: youthMetrics.youthHostCommunityCount,
                youthPlwdCount: youthMetrics.youthPlwdCount
              })
              .where(eq(businessProfiles.id, businessId));
          }
        }
      } catch (youthError) {
        console.error("Error updating youth relationships:", youthError);
        // Continue with the response even if youth updates fail
      }
    }

    // Fetch the updated business record directly after update to verify
    const updatedBusinessRecord = await db
      .select({
        // Include all financial fields to verify update
        expectedWeeklyRevenue: businessProfiles.expectedWeeklyRevenue,
        expectedMonthlyRevenue: businessProfiles.expectedMonthlyRevenue,
        anticipatedMonthlyExpenditure: businessProfiles.anticipatedMonthlyExpenditure,
        expectedMonthlyProfit: businessProfiles.expectedMonthlyProfit,
        paymentStructure: businessProfiles.paymentStructure
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, businessId));
    
    console.log("Financial data in updated record:", updatedBusinessRecord[0]);

    res.status(200).json(updateResult[0]);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ error: 'Failed to update business profile', details: error.message });
  }
});

// Delete (deactivate) a business profile
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const checkQuery = `SELECT id FROM business_profiles WHERE id = $1`;
    const result = await db.execute(sql.raw(checkQuery, [parseInt(id)]));

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    res.json({ success: true, message: 'Business profile deactivated' });
  } catch (error) {
    console.error('Error deleting business profile:', error);
    res.status(500).json({ error: 'Failed to delete business profile' });
  }
});

// Metadata routes
router.get('/metadata', (req: Request, res: Response) => {
  res.json({
    enterpriseTypes: enterpriseTypeEnum.options,
    enterpriseSizes: enterpriseSizeEnum.options,
    sectors: businessSectorEnum.options,
    businessModels: businessModelEnum.options,
    districts: ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"]
  });
});

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