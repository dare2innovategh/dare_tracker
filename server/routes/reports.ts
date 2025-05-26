// server/routes/reports.ts - COMPLETE SOLUTION
import { Router } from 'express';
import { db } from '../db';
import { youthProfiles, businessProfiles } from '@shared/schema';
import { 
  eq, desc, asc, and, or, inArray, like, gte, lte, sql
} from 'drizzle-orm';
import { auth } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';

const router = Router();

// Create reports directory
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * COMPLETE YOUTH PROFILE FIELDS MAPPING - FULLY CORRECTED VERSION
 * All fields from your youth profiles schema with correct column names
 */
const COMPLETE_YOUTH_FIELDS = [
  // Basic Information
  { header: 'ID', key: 'id', width: 8 },
  { header: 'User ID', key: 'userId', width: 10 },
  { header: 'Participant Code', key: 'participantCode', width: 15 },
  { header: 'Full Name', key: 'fullName', width: 25 },
  { header: 'Preferred Name', key: 'preferredName', width: 20 },
  { header: 'Profile Picture', key: 'profilePicture', width: 30 },

  // Personal Details
  { header: 'First Name', key: 'firstName', width: 15 },
  { header: 'Middle Name', key: 'middleName', width: 15 },
  { header: 'Last Name', key: 'lastName', width: 15 },
  { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
  { header: 'Year of Birth', key: 'yearOfBirth', width: 12 },
  { header: 'Age', key: 'age', width: 8 },
  { header: 'Age Group', key: 'ageGroup', width: 12 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Marital Status', key: 'maritalStatus', width: 15 },
  { header: 'Children Count', key: 'childrenCount', width: 12 },
  { header: 'Dependents', key: 'dependents', width: 15 },
  { header: 'National ID', key: 'nationalId', width: 15 },
  { header: 'PWD Status', key: 'pwdStatus', width: 12 },

  // Location & Contact
  { header: 'District', key: 'district', width: 15 },
  { header: 'Town', key: 'town', width: 15 },
  { header: 'Home Address', key: 'homeAddress', width: 30 },
  { header: 'Country', key: 'country', width: 12 },
  { header: 'Admin Level 1', key: 'adminLevel1', width: 15 },
  { header: 'Admin Level 2', key: 'adminLevel2', width: 15 },
  { header: 'Admin Level 3', key: 'adminLevel3', width: 15 },
  { header: 'Admin Level 4', key: 'adminLevel4', width: 15 },
  { header: 'Admin Level 5', key: 'adminLevel5', width: 15 },
  { header: 'Phone Number', key: 'phoneNumber', width: 15 },
  { header: 'Additional Phone 1', key: 'additionalPhoneNumber1', width: 15 },
  { header: 'Additional Phone 2', key: 'additionalPhoneNumber2', width: 15 },
  { header: 'Email', key: 'email', width: 25 },

  // Emergency Contact (broken down) - These will be handled specially
  { header: 'Emergency Contact Name', key: 'emergencyContact.name', width: 25 },
  { header: 'Emergency Contact Phone', key: 'emergencyContact.phone', width: 18 },
  { header: 'Emergency Contact Relationship', key: 'emergencyContact.relationship', width: 20 },
  { header: 'Emergency Contact Address', key: 'emergencyContact.address', width: 30 },
  { header: 'Emergency Contact Email', key: 'emergencyContact.email', width: 25 },

  // Education & Skills
  { header: 'Highest Education Level', key: 'highestEducationLevel', width: 20 },
  { header: 'Active Student Status', key: 'activeStudentStatus', width: 18 },
  { header: 'Core Skills', key: 'coreSkills', width: 30 },
  { header: 'Skill Level', key: 'skillLevel', width: 15 },
  { header: 'Industry Expertise', key: 'industryExpertise', width: 20 },
  { header: 'Languages Spoken', key: 'languagesSpoken', width: 20 },
  { header: 'Communication Style', key: 'communicationStyle', width: 18 },
  { header: 'Digital Skills', key: 'digitalSkills', width: 20 },
  { header: 'Digital Skills 2', key: 'digitalSkills2', width: 20 },

  // Portfolio & Work Experience
  { header: 'Years of Experience', key: 'yearsOfExperience', width: 15 },
  { header: 'Work History', key: 'workHistory', width: 30 },

  // Program Participation
  { header: 'Business Interest', key: 'businessInterest', width: 20 },
  { header: 'Employment Status', key: 'employmentStatus', width: 15 },
  { header: 'Employment Type', key: 'employmentType', width: 15 },
  { header: 'Specific Job', key: 'specificJob', width: 20 },
  { header: 'Training Status', key: 'trainingStatus', width: 15 },
  { header: 'Program Status', key: 'programStatus', width: 15 },
  { header: 'Transition Status', key: 'transitionStatus', width: 15 },
  { header: 'Onboarded to Tracker', key: 'onboardedToTracker', width: 18 },

  // DARE Model
  { header: 'DARE Model', key: 'dareModel', width: 15 },

  // Skills Trainer / Madam Information
  { header: 'Skills Trainer Name', key: 'madamName', width: 25 },
  { header: 'Skills Trainer Phone', key: 'madamPhone', width: 18 },

  // Local Hub Guide / Mentor Information
  { header: 'Local Hub Guide Name', key: 'localMentorName', width: 25 },
  { header: 'Local Hub Guide Contact', key: 'localMentorContact', width: 20 },
  { header: 'Guarantor Name', key: 'guarantor', width: 20 },
  { header: 'Guarantor Phone', key: 'guarantorPhone', width: 18 },

  // Partner & Support Information
  { header: 'Implementing Partner Name', key: 'implementingPartnerName', width: 30 },
  { header: 'Refugee Status', key: 'refugeeStatus', width: 12 },
  { header: 'IDP Status', key: 'idpStatus', width: 12 },
  { header: 'Community Hosts Refugees', key: 'communityHostsRefugees', width: 22 },

  // Program Details
  { header: 'Partner Start Date', key: 'partnerStartDate', width: 18 },
  { header: 'Program Name', key: 'programName', width: 25 },
  { header: 'Program Details', key: 'programDetails', width: 30 },
  { header: 'Program Contact Person', key: 'programContactPerson', width: 25 },
  { header: 'Program Contact Phone', key: 'programContactPhoneNumber', width: 20 },
  { header: 'Cohort', key: 'cohort', width: 15 },

  // Additional Information
  { header: 'New Data Submission', key: 'newDataSubmission', width: 18 },
  { header: 'Is Deleted', key: 'isDeleted', width: 12 },
  { header: 'Host Community Status', key: 'hostCommunityStatus', width: 20 },
  { header: 'Financial Aspirations', key: 'financialAspirations', width: 25 },

  // Timestamps
  { header: 'Created At', key: 'createdAt', width: 18 },
  { header: 'Updated At', key: 'updatedAt', width: 18 },
];


/**
 * MASTERCARD FOUNDATION TEMPLATE MAPPING
 * Based on your requirements for Mastercard Foundation reporting
 */
const MASTERCARD_TEMPLATE_MAPPING = {
  'Participant ID': 'participantCode',
  'First Name': 'firstName',
  'Middle Name': 'middleName', 
  'Last Name': 'lastName',
  'Full Name': 'fullName',
  'Gender': 'gender',
  'Date of Birth': 'dateOfBirth',
  'Age': 'age',
  'Phone Number': 'phoneNumber',
  'Email Address': 'email',
  'District': 'district',
  'Town/City': 'town',
  'Home Address': 'homeAddress',
  'Country': 'country',
  'DARE Model': 'dareModel',
  'Training Status': 'trainingStatus',
  'Employment Status': 'employmentStatus',
  'Core Skills': 'coreSkills',
  'Industry/Sector': 'industryExpertise',
  'Education Level': 'highestEducationLevel',
  'Student Status': 'activeStudentStatus',
  'Refugee Status': 'refugeeStatus',
  'IDP Status': 'idpStatus',
  'Disability Status': 'pwdStatus',
  'Program Name': 'programName',
  'Implementing Partner': 'implementingPartnerName',
  'Program Start Date': 'partnerStartDate',
  'Registration Date': 'createdAt'
};

/**
 * PARTICIPANT SUBMISSION TEMPLATE MAPPING
 */
const PARTICIPANT_TEMPLATE_MAPPING = {
  'Implementing Partner Name': 'implementingPartnerName',
  'First Name': 'firstName', 
  'Middle name or Grandfathers name': 'middleName',
  'Surname or Fathers name': 'lastName',
  'Preferred Name': 'preferredName',
  'Sex': 'gender',
  'Date of Birth (MM/DD/YYYY)': 'dateOfBirth',
  'Refugee Status': 'refugeeStatus', 
  'Internally Displaced Person (IDP) status': 'idpStatus',
  'Is Participant\'s community hosting Refugees or displaced persons': 'communityHostsRefugees',
  'Disability Status': 'pwdStatus',
  'Home Address': 'homeAddress',
  'Unique identifier': 'participantCode',
  'Primary Phone Number': 'phoneNumber',
  'Additional Phone Number 1': 'additionalPhoneNumber1',
  'Additional Phone Number 2': 'additionalPhoneNumber2',
  'Email': 'email',
  'Country': 'country',
  'Administrative Level1': 'adminLevel1',
  'Administrative Level2': 'adminLevel2', 
  'Administrative Level3': 'adminLevel3',
  'Administrative Level4': 'adminLevel4',
  'Administrative Level5': 'adminLevel5',
  'Highest Education Level': 'highestEducationLevel',
  'Active Student Status': 'activeStudentStatus',
  'Employment Status': 'employmentStatus',
  'Employment Type': 'employmentType',
  'Sector': 'industryExpertise',
  'Start Date with Implementing Partner (MM/DD/YYYY)': 'partnerStartDate',
  'Program Name': 'programName',
  'Program Details': 'programDetails', 
  'Program Contact Person': 'programContactPerson',
  'Program Contact Phone Number': 'programContactPhoneNumber',
  'New Data Submission': 'newDataSubmission'
};

// ============================================================================
// CORE DATA ENDPOINTS
// ============================================================================

/**
 * @route GET /api/reports/youth/data
 * @desc Get youth profiles data with filters and pagination
 * @access Private
 */
router.get('/youth/data', auth, async (req, res) => {
  try {
    const {
      district = [],
      gender = [],
      dareModel = [],
      trainingStatus = [],
      minAge,
      maxAge,
      keyword,
      page = 1,
      limit = 20
    } = req.query;

    console.log('Youth data request params:', req.query);

    // Build the main query
    let query = db.select().from(youthProfiles);
    let countQuery = db.select({ count: sql`count(*)` }).from(youthProfiles);

    // Build filter conditions
    const conditions = [];

    if (district && Array.isArray(district) && district.length > 0) {
      conditions.push(inArray(youthProfiles.district, district));
    }

    if (gender && Array.isArray(gender) && gender.length > 0) {
      conditions.push(inArray(youthProfiles.gender, gender));
    }

    if (dareModel && Array.isArray(dareModel) && dareModel.length > 0) {
      conditions.push(inArray(youthProfiles.dareModel, dareModel));
    }

    if (trainingStatus && Array.isArray(trainingStatus) && trainingStatus.length > 0) {
      conditions.push(inArray(youthProfiles.trainingStatus, trainingStatus));
    }

    if (minAge && maxAge) {
      conditions.push(and(
        gte(youthProfiles.age, parseInt(minAge)),
        lte(youthProfiles.age, parseInt(maxAge))
      ));
    } else if (minAge) {
      conditions.push(gte(youthProfiles.age, parseInt(minAge)));
    } else if (maxAge) {
      conditions.push(lte(youthProfiles.age, parseInt(maxAge)));
    }

    if (keyword) {
      const searchConditions = or(
        like(youthProfiles.fullName, `%${keyword}%`),
        like(youthProfiles.firstName, `%${keyword}%`),
        like(youthProfiles.lastName, `%${keyword}%`),
        like(youthProfiles.participantCode, `%${keyword}%`),
        like(youthProfiles.coreSkills, `%${keyword}%`),
        like(youthProfiles.industryExpertise, `%${keyword}%`)
      );
      conditions.push(searchConditions);
    }

    if (conditions.length > 0) {
      const combinedConditions = and(...conditions);
      query = query.where(combinedConditions);
      countQuery = countQuery.where(combinedConditions);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);
    query = query.orderBy(asc(youthProfiles.fullName));

    const [results, countResult] = await Promise.all([
      query.execute(),
      countQuery.execute()
    ]);

    const total = countResult[0]?.count || 0;

    console.log(`Found ${results.length} youth profiles (${total} total)`);

    return res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching youth data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch youth data',
      details: error.message
    });
  }
});

/**
 * @route GET /api/reports/youth/stats
 * @desc Get youth profile statistics
 * @access Private
 */
router.get('/youth/stats', auth, async (req, res) => {
  try {
    const [totalResult] = await db.select({ count: sql`count(*)` }).from(youthProfiles);
    const total = totalResult.count;

    const districtStats = await db
      .select({
        district: youthProfiles.district,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.district);

    const genderStats = await db
      .select({
        gender: youthProfiles.gender,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.gender);

    const dareStats = await db
      .select({
        dareModel: youthProfiles.dareModel,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.dareModel);

    const byDistrict = {};
    districtStats.forEach(stat => {
      if (stat.district) {
        byDistrict[stat.district] = parseInt(stat.count);
      }
    });

    const byGender = {};
    genderStats.forEach(stat => {
      if (stat.gender) {
        byGender[stat.gender] = parseInt(stat.count);
      }
    });

    const byDareModel = {};
    dareStats.forEach(stat => {
      if (stat.dareModel) {
        byDareModel[stat.dareModel] = parseInt(stat.count);
      }
    });

    return res.json({
      success: true,
      stats: {
        total: parseInt(total),
        byDistrict,
        byGender,
        byDareModel
      }
    });

  } catch (error) {
    console.error('Error fetching youth stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch youth statistics'
    });
  }
});

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

/**
 * @route POST /api/reports/youth/export
 * @desc Export youth data with ALL FIELDS
 * @access Private
 */
router.post('/youth/export', auth, async (req, res) => {
  try {
    const { 
      district = [],
      gender = [],
      dareModel = [],
      trainingStatus = [],
      minAge,
      maxAge,
      keyword,
      format = 'excel'
    } = req.body;

    console.log('Export request:', { district, gender, dareModel, trainingStatus, minAge, maxAge, keyword, format });

    // Build query with same filters as data endpoint
    let query = db.select().from(youthProfiles);
    const conditions = [];

    if (district && Array.isArray(district) && district.length > 0) {
      conditions.push(inArray(youthProfiles.district, district));
    }

    if (gender && Array.isArray(gender) && gender.length > 0) {
      conditions.push(inArray(youthProfiles.gender, gender));
    }

    if (dareModel && Array.isArray(dareModel) && dareModel.length > 0) {
      conditions.push(inArray(youthProfiles.dareModel, dareModel));
    }

    if (trainingStatus && Array.isArray(trainingStatus) && trainingStatus.length > 0) {
      conditions.push(inArray(youthProfiles.trainingStatus, trainingStatus));
    }

    if (minAge && maxAge) {
      conditions.push(and(
        gte(youthProfiles.age, parseInt(minAge)),
        lte(youthProfiles.age, parseInt(maxAge))
      ));
    } else if (minAge) {
      conditions.push(gte(youthProfiles.age, parseInt(minAge)));
    } else if (maxAge) {
      conditions.push(lte(youthProfiles.age, parseInt(maxAge)));
    }

    if (keyword) {
      conditions.push(or(
        like(youthProfiles.fullName, `%${keyword}%`),
        like(youthProfiles.firstName, `%${keyword}%`),
        like(youthProfiles.lastName, `%${keyword}%`),
        like(youthProfiles.participantCode, `%${keyword}%`),
        like(youthProfiles.coreSkills, `%${keyword}%`),
        like(youthProfiles.industryExpertise, `%${keyword}%`)
      ));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(asc(youthProfiles.fullName));
    const results = await query.execute();

    console.log(`Exporting ${results.length} youth profiles with ALL FIELDS`);

    // Generate export file
    const timestamp = Date.now();
    let filename, filepath, contentType, attachmentName;

    if (format === 'excel') {
      filename = `youth_complete_export_${timestamp}.xlsx`;
      filepath = path.join(reportsDir, filename);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      attachmentName = 'youth-profiles-complete.xlsx';
      
      await generateCompleteExcelReport(results, filepath);
    } else if (format === 'csv') {
      filename = `youth_complete_export_${timestamp}.csv`;
      filepath = path.join(reportsDir, filename);
      contentType = 'text/csv';
      attachmentName = 'youth-profiles-complete.csv';
      
      generateCompleteCSVReport(results, filepath);
    }

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    });

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generating export file'
        });
      }
    });

  } catch (error) {
    console.error('Error exporting youth data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export youth data',
      details: error.message
    });
  }
});

/**
 * @route POST /api/reports/youth/mastercard-template
 * @desc Export youth data in Mastercard Foundation template format
 * @access Private
 */
router.post('/youth/mastercard-template', auth, async (req, res) => {
  const { 
    district = [],
    gender = [],
    dareModel = [],
    trainingStatus = [],
    minAge,
    maxAge,
    keyword,
    format = 'excel'
  } = req.body;

  try {
    console.log('Exporting youth data in Mastercard Foundation template format');

    // Build query with filters
    let query = db.select().from(youthProfiles);
    const conditions = [];

    if (district && Array.isArray(district) && district.length > 0) {
      conditions.push(inArray(youthProfiles.district, district));
    }

    if (gender && Array.isArray(gender) && gender.length > 0) {
      conditions.push(inArray(youthProfiles.gender, gender));
    }

    if (dareModel && Array.isArray(dareModel) && dareModel.length > 0) {
      conditions.push(inArray(youthProfiles.dareModel, dareModel));
    }

    if (trainingStatus && Array.isArray(trainingStatus) && trainingStatus.length > 0) {
      conditions.push(inArray(youthProfiles.trainingStatus, trainingStatus));
    }

    if (minAge && maxAge) {
      conditions.push(and(
        gte(youthProfiles.age, parseInt(minAge)),
        lte(youthProfiles.age, parseInt(maxAge))
      ));
    } else if (minAge) {
      conditions.push(gte(youthProfiles.age, parseInt(minAge)));
    } else if (maxAge) {
      conditions.push(lte(youthProfiles.age, parseInt(maxAge)));
    }

    if (keyword) {
      conditions.push(or(
        like(youthProfiles.fullName, `%${keyword}%`),
        like(youthProfiles.firstName, `%${keyword}%`),
        like(youthProfiles.lastName, `%${keyword}%`),
        like(youthProfiles.participantCode, `%${keyword}%`)
      ));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(asc(youthProfiles.fullName));
    const results = await query.execute();

    console.log(`Found ${results.length} youth profiles for Mastercard template export`);

    // Generate export file
    const timestamp = Date.now();
    let filename, filepath, contentType, attachmentName;

    if (format === 'excel') {
      filename = `mastercard_template_${timestamp}.xlsx`;
      filepath = path.join(reportsDir, filename);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      attachmentName = 'mastercard-foundation-template.xlsx';
      await generateMastercardTemplateExcel(results, filepath);
    } else if (format === 'csv') {
      filename = `mastercard_template_${timestamp}.csv`;
      filepath = path.join(reportsDir, filename);
      contentType = 'text/csv';
      attachmentName = 'mastercard-foundation-template.csv';
      generateMastercardTemplateCSV(results, filepath);
    }

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    });

  } catch (error) {
    console.error('Error exporting Mastercard template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export Mastercard template',
      details: error.message
    });
  }
});

/**
 * @route POST /api/reports/youth/participant-template
 * @desc Export youth data in Participant Submission Template format
 * @access Private
 */
router.post('/youth/participant-template', auth, async (req, res) => {
  const { 
    district = [],
    gender = [],
    dareModel = [],
    trainingStatus = [],
    minAge,
    maxAge,
    keyword,
    format = 'excel'
  } = req.body;

  try {
    console.log('Exporting youth data in Participant Template format');

    // Build query with filters (same as above)
    let query = db.select().from(youthProfiles);
    const conditions = [];

    if (district && Array.isArray(district) && district.length > 0) {
      conditions.push(inArray(youthProfiles.district, district));
    }

    if (gender && Array.isArray(gender) && gender.length > 0) {
      conditions.push(inArray(youthProfiles.gender, gender));
    }

    if (dareModel && Array.isArray(dareModel) && dareModel.length > 0) {
      conditions.push(inArray(youthProfiles.dareModel, dareModel));
    }

    if (trainingStatus && Array.isArray(trainingStatus) && trainingStatus.length > 0) {
      conditions.push(inArray(youthProfiles.trainingStatus, trainingStatus));
    }

    if (minAge && maxAge) {
      conditions.push(and(
        gte(youthProfiles.age, parseInt(minAge)),
        lte(youthProfiles.age, parseInt(maxAge))
      ));
    } else if (minAge) {
      conditions.push(gte(youthProfiles.age, parseInt(minAge)));
    } else if (maxAge) {
      conditions.push(lte(youthProfiles.age, parseInt(maxAge)));
    }

    if (keyword) {
      conditions.push(or(
        like(youthProfiles.fullName, `%${keyword}%`),
        like(youthProfiles.firstName, `%${keyword}%`),
        like(youthProfiles.lastName, `%${keyword}%`),
        like(youthProfiles.participantCode, `%${keyword}%`)
      ));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(asc(youthProfiles.fullName));
    const results = await query.execute();

    console.log(`Found ${results.length} youth profiles for template export`);

    // Generate export file
    const timestamp = Date.now();
    let filename, filepath, contentType, attachmentName;

    if (format === 'excel') {
      filename = `participant_template_${timestamp}.xlsx`;
      filepath = path.join(reportsDir, filename);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      attachmentName = 'participant-submission-template.xlsx';
      await generateParticipantTemplateExcel(results, filepath);
    } else if (format === 'csv') {
      filename = `participant_template_${timestamp}.csv`;
      filepath = path.join(reportsDir, filename);
      contentType = 'text/csv';
      attachmentName = 'participant-submission-template.csv';
      generateParticipantTemplateCSV(results, filepath);
    }

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    });

  } catch (error) {
    console.error('Error exporting participant template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export participant template',
      details: error.message
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// EXACT REPLACEMENT FOR YOUR generateCompleteExcelReport function

// COMPLETELY REWRITTEN Excel generation function that actually works

/**
 * Generate COMPLETE Excel report - WORKING VERSION
 */
async function generateCompleteExcelReport(data, outputPath) {
  console.log('🔍 Generating complete Excel report...');
  console.log('📊 Total records to process:', data.length);
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Youth Profiles Complete');

  // Filter out fields that don't exist in the data
  const validFields = COMPLETE_YOUTH_FIELDS.filter(field => {
    if (data.length === 0) return true;
    
    if (field.key.includes('.')) {
      const [parentKey] = field.key.split('.');
      return data[0].hasOwnProperty(parentKey);
    }
    
    return data[0].hasOwnProperty(field.key);
  });

  console.log(`✅ Using ${validFields.length} valid fields`);

  // Create headers array
  const headers = validFields.map(field => field.header);
  
  // Add title row
  worksheet.addRow(['Youth Profiles Complete Report - All Fields']);
  worksheet.mergeCells(1, 1, 1, headers.length);
  worksheet.getCell(1, 1).font = { size: 16, bold: true };
  worksheet.getCell(1, 1).alignment = { horizontal: 'center' };

  // Add date row
  worksheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
  worksheet.mergeCells(2, 1, 2, headers.length);
  worksheet.getCell(2, 1).font = { size: 10, italic: true };
  worksheet.getCell(2, 1).alignment = { horizontal: 'center' };

  // Add empty row
  worksheet.addRow([]);

  // Add headers
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  
  // Style header row
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7B03B' }
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Set column widths
  validFields.forEach((field, index) => {
    worksheet.getColumn(index + 1).width = field.width || 15;
  });

  // Add data rows
  if (data.length > 0) {
    data.forEach((youth, index) => {
      const rowData = [];
      
      validFields.forEach(field => {
        let value = '';
        
        // Handle nested fields
        if (field.key.includes('.')) {
          const [parentKey, childKey] = field.key.split('.');
          const parentValue = youth[parentKey];
          
          if (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) {
            value = formatFieldValueForExcel(parentValue[childKey]);
          }
        } else {
          value = formatFieldValueForExcel(youth[field.key]);
        }
        
        rowData.push(value);
      });
      
      worksheet.addRow(rowData);
      
      // Debug first few records
      if (index < 2) {
        console.log(`📝 Row ${index + 1} sample:`, {
          name: youth.fullName,
          emergencyContactName: youth.emergencyContact?.name,
          skillsTrainer: youth.madamName,
          localMentor: youth.localMentorName
        });
      }
    });

    // Add summary row
    const summaryRow = worksheet.addRow([
      `Total Records: ${data.length}`,
      '',
      `Fields: ${validFields.length}`,
      '',
      `Generated: ${new Date().toLocaleString()}`
    ]);
    summaryRow.font = { bold: true };
  } else {
    worksheet.addRow(['No data found matching your filters']);
  }

  console.log('✅ Writing Excel file...');
  await workbook.xlsx.writeFile(outputPath);
  console.log('✅ Excel report generated successfully');
}

/**
 * Format field values specifically for Excel
 */
function formatFieldValueForExcel(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // Handle date strings
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return value.split('T')[0];
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '';
  }

  // Handle objects
  if (typeof value === 'object') {
    return Object.keys(value).length > 0 ? JSON.stringify(value) : '';
  }

  // Handle everything else
  return value.toString();
}

/**
 * Generate CSV report - SIMPLIFIED VERSION
 */
function generateCompleteCSVReport(data, outputPath) {
  console.log('🔍 Generating complete CSV report...');
  
  // Filter out fields that don't exist in the data
  const validFields = COMPLETE_YOUTH_FIELDS.filter(field => {
    if (data.length === 0) return true;
    
    if (field.key.includes('.')) {
      const [parentKey] = field.key.split('.');
      return data[0].hasOwnProperty(parentKey);
    }
    
    return data[0].hasOwnProperty(field.key);
  });

  console.log(`✅ Using ${validFields.length} valid fields for CSV`);

  // Create CSV data
  const csvRows = [];
  
  // Add headers
  csvRows.push(validFields.map(field => field.header));

  // Add data rows
  data.forEach((youth, index) => {
    const row = [];
    
    validFields.forEach(field => {
      let value = '';
      
      // Handle nested fields
      if (field.key.includes('.')) {
        const [parentKey, childKey] = field.key.split('.');
        const parentValue = youth[parentKey];
        
        if (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) {
          value = formatFieldValueForCSV(parentValue[childKey]);
        }
      } else {
        value = formatFieldValueForCSV(youth[field.key]);
      }
      
      row.push(value);
    });
    
    csvRows.push(row);
    
    // Debug first few records
    if (index < 2) {
      console.log(`📝 CSV Row ${index + 1}:`, {
        name: youth.fullName,
        emergencyContactName: youth.emergencyContact?.name,
        skillsTrainer: youth.madamName,
        localHubGuide: youth.localMentorName
      });
    }
  });

  // Convert to CSV string
  const csvContent = stringify(csvRows, { header: false });
  fs.writeFileSync(outputPath, csvContent);
  console.log('✅ CSV report generated successfully');
}

/**
 * Format field values specifically for CSV
 */
function formatFieldValueForCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // Handle date strings
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return value.split('T')[0];
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '';
  }

  // Handle objects - escape quotes for CSV
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return jsonStr.replace(/"/g, '""'); // Escape quotes for CSV
  }

  // Handle strings - escape quotes for CSV
  if (typeof value === 'string') {
    return value.replace(/"/g, '""');
  }

  // Handle everything else
  return value.toString();
}


/**
 * Generate Mastercard Foundation Template Excel
 */
async function generateMastercardTemplateExcel(data, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Mastercard_Foundation_Template');

  // Add title and metadata
  worksheet.mergeCells('A1:Z1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Mastercard Foundation Youth Report Template';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:Z2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
  dateCell.font = { size: 10, italic: true };
  dateCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:Z3');
  const countCell = worksheet.getCell('A3');
  countCell.value = `Total Participants: ${data.length}`;
  countCell.font = { size: 12, bold: true };
  countCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Empty row

  // Get template headers in correct order
  const templateHeaders = Object.keys(MASTERCARD_TEMPLATE_MAPPING);
  
  // Set up columns
  const columns = templateHeaders.map(header => ({
    header: header,
    key: header,
    width: getTemplateColumnWidth(header)
  }));

  worksheet.columns = columns;

  // Process data to match template format
  const templateData = data.map(youth => {
    const row = {};
    templateHeaders.forEach(templateHeader => {
      const ourField = MASTERCARD_TEMPLATE_MAPPING[templateHeader];
      let value = youth[ourField];

      // Format specific fields for Mastercard template
      value = formatFieldForMastercardTemplate(templateHeader, value);
      row[templateHeader] = value;
    });
    return row;
  });

  // Add data rows
  if (templateData.length > 0) {
    worksheet.addRows(templateData);

    // Style header row (row 5 after title rows)
    const headerRow = worksheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Mastercard blue
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White text
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add summary section
    const summaryStartRow = worksheet.lastRow.number + 2;
    worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY STATISTICS';
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };
    
    // Gender breakdown
    const genderStats = {};
    data.forEach(youth => {
      const gender = youth.gender || 'Unknown';
      genderStats[gender] = (genderStats[gender] || 0) + 1;
    });
    
    let currentRow = summaryStartRow + 1;
    worksheet.getCell(`A${currentRow}`).value = 'Gender Breakdown:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
    
    Object.entries(genderStats).forEach(([gender, count]) => {
      worksheet.getCell(`A${currentRow}`).value = `${gender}: ${count}`;
      currentRow++;
    });

    // Training status breakdown
    const trainingStats = {};
    data.forEach(youth => {
      const status = youth.trainingStatus || 'Unknown';
      trainingStats[status] = (trainingStats[status] || 0) + 1;
    });
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'Training Status Breakdown:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
    
    Object.entries(trainingStats).forEach(([status, count]) => {
      worksheet.getCell(`A${currentRow}`).value = `${status}: ${count}`;
      currentRow++;
    });

  } else {
    worksheet.addRow(['No data found matching your filters']);
  }

  return workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate Mastercard Foundation Template CSV
 */
function generateMastercardTemplateCSV(data, outputPath) {
  const templateHeaders = Object.keys(MASTERCARD_TEMPLATE_MAPPING);
  
  const templateData = data.map(youth => {
    const row = {};
    templateHeaders.forEach(templateHeader => {
      const ourField = MASTERCARD_TEMPLATE_MAPPING[templateHeader];
      let value = youth[ourField];
      value = formatFieldForMastercardTemplate(templateHeader, value);
      row[templateHeader] = value;
    });
    return row;
  });

  const csvContent = stringify(templateData, { header: true });
  fs.writeFileSync(outputPath, csvContent);
}

/**
 * Generate Participant Template Excel
 */
async function generateParticipantTemplateExcel(data, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Participant_Submission_Template');

  // Get template headers in correct order
  const templateHeaders = Object.keys(PARTICIPANT_TEMPLATE_MAPPING);
  
  // Set up columns
  const columns = templateHeaders.map(header => ({
    header: header,
    key: header,
    width: getTemplateColumnWidth(header)
  }));

  worksheet.columns = columns;

  // Process data to match template format
  const templateData = data.map(youth => {
    const row = {};
    templateHeaders.forEach(templateHeader => {
      const ourField = PARTICIPANT_TEMPLATE_MAPPING[templateHeader];
      let value = youth[ourField];

      // Format specific fields
      value = formatFieldForTemplate(templateHeader, value);
      row[templateHeader] = value;
    });
    return row;
  });

  // Add data rows
  if (templateData.length > 0) {
    worksheet.addRows(templateData);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7B03B' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  return workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate Participant Template CSV
 */
function generateParticipantTemplateCSV(data, outputPath) {
  const templateHeaders = Object.keys(PARTICIPANT_TEMPLATE_MAPPING);
  
  const templateData = data.map(youth => {
    const row = {};
    templateHeaders.forEach(templateHeader => {
      const ourField = PARTICIPANT_TEMPLATE_MAPPING[templateHeader]; 
      let value = youth[ourField];
      value = formatFieldForTemplate(templateHeader, value);
      row[templateHeader] = value;
    });
    return row;
  });

  const csvContent = stringify(templateData, { header: true });
  fs.writeFileSync(outputPath, csvContent);
}

/**
 * Format field values for general use
 */
function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle objects/arrays
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  } else if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value.toString();
}

/**
 * Format field values specifically for Mastercard Foundation template
 */
function formatFieldForMastercardTemplate(templateHeader, value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Specific formatting for Mastercard template
  switch (templateHeader) {
    case 'Date of Birth':
    case 'Program Start Date':
    case 'Registration Date':
      if (value instanceof Date) {
        const month = (value.getMonth() + 1).toString().padStart(2, '0');
        const day = value.getDate().toString().padStart(2, '0');
        const year = value.getFullYear();
        return `${month}/${day}/${year}`;
      }
      return value;

    case 'Gender':
      // Standardize gender values for Mastercard reporting
      if (typeof value === 'string') {
        const gender = value.toLowerCase();
        if (gender.includes('male') && !gender.includes('female')) return 'Male';
        if (gender.includes('female')) return 'Female';
        if (gender.includes('other') || gender.includes('non-binary')) return 'Other';
      }
      return value;

    case 'Refugee Status':
    case 'IDP Status':
    case 'Disability Status':
    case 'Student Status':
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'string') {
        const val = value.toLowerCase();
        if (val === 'true' || val === 'yes' || val === '1') return 'Yes';
        if (val === 'false' || val === 'no' || val === '0') return 'No';
      }
      return value || 'No';

    case 'Age':
      if (typeof value === 'number') {
        return value.toString();
      }
      return value;

    default:
      return formatFieldValue(value);
  }
}

/**
 * Format field values according to template requirements
 */
function formatFieldForTemplate(templateHeader, value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Date formatting for MM/DD/YYYY fields
  if (templateHeader.includes('Date of Birth') || templateHeader.includes('Start Date')) {
    if (value instanceof Date) {
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const day = value.getDate().toString().padStart(2, '0');
      const year = value.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return value;
  }

  // Boolean fields formatting
  if (templateHeader.includes('Status') || templateHeader.includes('Active Student') || templateHeader.includes('New Data')) {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
  }

  // Handle objects/arrays
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  } else if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value.toString();
}

/**
 * Get appropriate column width for template fields
 */
function getTemplateColumnWidth(header) {
  const widthMap = {
    'Participant ID': 15,
    'Implementing Partner Name': 25,
    'First Name': 15,
    'Middle Name': 15,
    'Middle name or Grandfathers name': 20,
    'Last Name': 15,
    'Surname or Fathers name': 15,
    'Full Name': 25,
    'Preferred Name': 15,
    'Sex': 10,
    'Gender': 10,
    'Date of Birth': 15,
    'Date of Birth (MM/DD/YYYY)': 15,
    'Age': 8,
    'Phone Number': 15,
    'Primary Phone Number': 15,
    'Additional Phone 1': 15,
    'Additional Phone Number 1': 15,
    'Additional Phone Number 2': 15,
    'Email': 25,
    'Email Address': 25,
    'Home Address': 30,
    'Country': 12,
    'District': 15,
    'Town/City': 15,
    'Administrative Level1': 18,
    'Administrative Level2': 18,
    'Administrative Level3': 18,
    'Administrative Level4': 18,
    'Administrative Level5': 18,
    'DARE Model': 15,
    'Training Status': 15,
    'Employment Status': 15,
    'Employment Type': 15,
    'Core Skills': 30,
    'Industry/Sector': 20,
    'Sector': 20,
    'Education Level': 20,
    'Highest Education Level': 20,
    'Student Status': 15,
    'Active Student Status': 15,
    'Refugee Status': 12,
    'IDP Status': 12,
    'Internally Displaced Person (IDP) status': 25,
    'Disability Status': 12,
    'Is Participant\'s community hosting Refugees or displaced persons': 35,
    'Program Name': 25,
    'Program Details': 30,
    'Implementing Partner': 25,
    'Program Start Date': 15,
    'Start Date with Implementing Partner (MM/DD/YYYY)': 30,
    'Registration Date': 15,
    'Program Contact Person': 20,
    'Program Contact Phone Number': 18,
    'Program Contact Phone': 18,
    'New Data Submission': 15,
    'Unique identifier': 15,
    'Enterprise Name': 25,
    'Enterprise Unique Identifier': 20,
    'Enterprise Owner': 20,
    'Enterprise Type': 15,
    'Enterprise Size': 12
  };
  
  return widthMap[header] || 15;
}

export default router;