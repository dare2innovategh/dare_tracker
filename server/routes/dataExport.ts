// server/routes/dataExport.ts
import { Router } from 'express';
import { db } from '../db';
import { 
  youthProfiles, 
  education,
  youthSkills,
  skills,
  certifications,
  youthTraining,
  trainingPrograms,
  businessYouthRelationships,
  businessProfiles,
  portfolioProjects,
  socialMediaLinks
} from '@shared/schema';
import { 
  eq, 
  desc, 
  asc, 
  and, 
  or, 
  inArray, 
  like, 
  gte, 
  lte,
  isNull,
  isNotNull
} from 'drizzle-orm';
import { auth } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';

// Initialize router
const router = Router();

// Create exports directory if it doesn't exist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportsDir = path.join(__dirname, '../data/exports');
if (!existsSync(exportsDir)) {
  mkdirSync(exportsDir, { recursive: true });
}

/**
 * @route POST /api/export/youth
 * @desc Generate data export for youth profiles
 * @access Private (requires auth)
 */
router.post('/youth', auth, async (req, res) => {
  const { 
    filters = {},
    format = 'json',
    includeEducation = true,
    includeSkills = true,
    includeCertifications = true,
    includeTraining = true,
    includeBusinesses = true,
    includePortfolio = true,
    filename = 'youth-export',
    sortBy = 'fullName',
    sortDirection = 'asc'
  } = req.body;
  
  try {
    // Create export tracking record
    const exportId = Date.now().toString();
    const exportFilename = `${filename.replace(/[^a-z0-9]/gi, '-')}-${exportId}.${format}`;
    const filePath = path.join(exportsDir, exportFilename);
    
    // Start generating export asynchronously
    generateYouthExport({
      filters,
      format,
      includeEducation,
      includeSkills,
      includeCertifications,
      includeTraining,
      includeBusinesses,
      includePortfolio,
      filePath,
      exportId,
      sortBy,
      sortDirection,
      userId: req.user.id
    }).catch(err => console.error('Export generation error:', err));
    
    // Return immediate response with export ID
    return res.status(202).json({
      success: true,
      message: 'Export generation started',
      exportId,
      status: 'processing'
    });
  } catch (error) {
    console.error('Error initiating export:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate export generation'
    });
  }
});

/**
 * @route GET /api/export/status/:id
 * @desc Check status of an export
 * @access Private (requires auth)
 */
router.get('/status/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    // In a real implementation, you would check a database table
    // For this example, we'll just check if the file exists
    const possibleExtensions = ['json', 'xlsx', 'csv'];
    let filePath = null;
    let format = null;
    
    for (const ext of possibleExtensions) {
      const testPath = path.join(exportsDir, `youth-export-${id}.${ext}`);
      if (existsSync(testPath)) {
        filePath = testPath;
        format = ext;
        break;
      }
    }
    
    if (filePath) {
      const stats = await fs.stat(filePath);
      return res.json({
        success: true,
        status: 'completed',
        exportId: id,
        format,
        size: stats.size,
        createdAt: stats.birthtime
      });
    } else {
      // Check if there's an error file
      const errorPath = path.join(exportsDir, `youth-export-${id}.error`);
      if (existsSync(errorPath)) {
        const errorContent = await fs.readFile(errorPath, 'utf8');
        return res.json({
          success: false,
          status: 'failed',
          exportId: id,
          error: errorContent
        });
      }
      
      // Assume it's still processing
      return res.json({
        success: true,
        status: 'processing',
        exportId: id
      });
    }
  } catch (error) {
    console.error('Error checking export status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check export status'
    });
  }
});

/**
 * @route GET /api/export/download/:id
 * @desc Download a completed export
 * @access Private (requires auth)
 */
router.get('/download/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find the file with the matching ID
    const possibleExtensions = ['json', 'xlsx', 'csv'];
    let filePath = null;
    let format = null;
    
    for (const ext of possibleExtensions) {
      const testPath = path.join(exportsDir, `youth-export-${id}.${ext}`);
      if (existsSync(testPath)) {
        filePath = testPath;
        format = ext;
        break;
      }
    }
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found'
      });
    }
    
    // Set appropriate headers
    const contentTypes = {
      'json': 'application/json',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv'
    };
    
    res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="youth-export-${id}.${format}"`);
    
    // Stream the file
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading export:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to download export'
    });
  }
});

/**
 * Function to generate youth export in the specified format
 */
async function generateYouthExport(options) {
  const {
    filters,
    format,
    includeEducation,
    includeSkills,
    includeCertifications,
    includeTraining,
    includeBusinesses,
    includePortfolio,
    filePath,
    exportId,
    sortBy,
    sortDirection,
    userId
  } = options;
  
  try {
    // Build query for youth profiles
    let query = db.select({
      // Basic information
      id: youthProfiles.id,
      userId: youthProfiles.userId,
      participantCode: youthProfiles.participantCode,
      profilePicture: youthProfiles.profilePicture,
      
      // Personal information
      fullName: youthProfiles.fullName,
      firstName: youthProfiles.firstName,
      middleName: youthProfiles.middleName,
      lastName: youthProfiles.lastName,
      preferredName: youthProfiles.preferredName,
      dateOfBirth: youthProfiles.dateOfBirth,
      yearOfBirth: youthProfiles.yearOfBirth,
      age: youthProfiles.age,
      ageGroup: youthProfiles.ageGroup,
      gender: youthProfiles.gender,
      maritalStatus: youthProfiles.maritalStatus,
      childrenCount: youthProfiles.childrenCount,
      
      // Location information
      district: youthProfiles.district,
      town: youthProfiles.town,
      homeAddress: youthProfiles.homeAddress,
      country: youthProfiles.country,
      adminLevel1: youthProfiles.adminLevel1,
      adminLevel2: youthProfiles.adminLevel2,
      adminLevel3: youthProfiles.adminLevel3,
      adminLevel4: youthProfiles.adminLevel4,
      adminLevel5: youthProfiles.adminLevel5,
      
      // Contact information
      phoneNumber: youthProfiles.phoneNumber,
      additionalPhoneNumber1: youthProfiles.additionalPhoneNumber1,
      additionalPhoneNumber2: youthProfiles.additionalPhoneNumber2,
      email: youthProfiles.email,
      socialMediaLinks: youthProfiles.socialMediaLinks,
      
      // Emergency contact
      emergencyContact: youthProfiles.emergencyContact,
      
      // Skills and expertise
      coreSkills: youthProfiles.coreSkills,
      skillLevel: youthProfiles.skillLevel,
      industryExpertise: youthProfiles.industryExpertise,
      languagesSpoken: youthProfiles.languagesSpoken,
      communicationStyle: youthProfiles.communicationStyle,
      digitalSkills: youthProfiles.digitalSkills,
      digitalSkills2: youthProfiles.digitalSkills2,
      
      // Work and business
      businessInterest: youthProfiles.businessInterest,
      employmentStatus: youthProfiles.employmentStatus,
      specificJob: youthProfiles.specificJob,
      yearsOfExperience: youthProfiles.yearsOfExperience,
      workHistory: youthProfiles.workHistory,
      
      // Portfolio
      portfolioLinks: youthProfiles.portfolioLinks,
      workSamples: youthProfiles.workSamples,
      caseStudies: youthProfiles.caseStudies,
      
      // DARE program specific
      dareModel: youthProfiles.dareModel,
      isMadam: youthProfiles.isMadam,
      isApprentice: youthProfiles.isApprentice,
      madamName: youthProfiles.madamName,
      madamPhone: youthProfiles.madamPhone,
      apprenticeNames: youthProfiles.apprenticeNames,
      apprenticePhone: youthProfiles.apprenticePhone,
      guarantor: youthProfiles.guarantor,
      guarantorPhone: youthProfiles.guarantorPhone,
      
      // Education
      highestEducationLevel: youthProfiles.highestEducationLevel,
      activeStudentStatus: youthProfiles.activeStudentStatus,
      
      // Program status
      trainingStatus: youthProfiles.trainingStatus,
      programStatus: youthProfiles.programStatus,
      
      // Transition Framework 
      transitionStatus: youthProfiles.transitionStatus,
      onboardedToTracker: youthProfiles.onboardedToTracker,
      localMentorName: youthProfiles.localMentorName,
      localMentorContact: youthProfiles.localMentorContact,
      
      // Financial
      financialAspirations: youthProfiles.financialAspirations,
      dependents: youthProfiles.dependents,
      
      // Identification
      nationalId: youthProfiles.nationalId,
      
      // Partner Program Details
      implementingPartnerName: youthProfiles.implementingPartnerName,
      refugeeStatus: youthProfiles.refugeeStatus,
      idpStatus: youthProfiles.idpStatus,
      communityHostsRefugees: youthProfiles.communityHostsRefugees,
      partnerStartDate: youthProfiles.partnerStartDate,
      programName: youthProfiles.programName,
      programDetails: youthProfiles.programDetails,
      programContactPerson: youthProfiles.programContactPerson,
      programContactPhoneNumber: youthProfiles.programContactPhoneNumber,
      
      // Metadata
      pwdStatus: youthProfiles.pwdStatus,
      newDataSubmission: youthProfiles.newDataSubmission,
      createdAt: youthProfiles.createdAt,
      updatedAt: youthProfiles.updatedAt
    })
    .from(youthProfiles);
    
    // Apply filters
    if (filters.district?.length) {
      query = query.where(inArray(youthProfiles.district, filters.district));
    }
    
    if (filters.gender?.length) {
      query = query.where(inArray(youthProfiles.gender, filters.gender));
    }
    
    if (filters.dareModel?.length) {
      query = query.where(inArray(youthProfiles.dareModel, filters.dareModel));
    }
    
    if (filters.trainingStatus?.length) {
      query = query.where(inArray(youthProfiles.trainingStatus, filters.trainingStatus));
    }
    
    if (filters.employmentStatus?.length) {
      query = query.where(inArray(youthProfiles.employmentStatus, filters.employmentStatus));
    }
    
    // Age range filter
    if (filters.minAge && filters.maxAge) {
      query = query.where(
        and(
          gte(youthProfiles.age, filters.minAge),
          lte(youthProfiles.age, filters.maxAge)
        )
      );
    } else if (filters.minAge) {
      query = query.where(gte(youthProfiles.age, filters.minAge));
    } else if (filters.maxAge) {
      query = query.where(lte(youthProfiles.age, filters.maxAge));
    }
    
    // Keyword search (across multiple fields)
    if (filters.keyword) {
      const keyword = `%${filters.keyword}%`;
      query = query.where(
        or(
          like(youthProfiles.fullName, keyword),
          like(youthProfiles.firstName, keyword),
          like(youthProfiles.lastName, keyword),
          like(youthProfiles.industryExpertise, keyword),
          like(youthProfiles.coreSkills, keyword),
          like(youthProfiles.town, keyword)
        )
      );
    }
    
    // Additional date range filters
    if (filters.createdAfter) {
      query = query.where(gte(youthProfiles.createdAt, new Date(filters.createdAfter)));
    }
    
    if (filters.createdBefore) {
      query = query.where(lte(youthProfiles.createdAt, new Date(filters.createdBefore)));
    }
    
    // Apply sorting
    const sortableFields = {
      'fullName': youthProfiles.fullName,
      'firstName': youthProfiles.firstName,
      'lastName': youthProfiles.lastName,
      'district': youthProfiles.district,
      'age': youthProfiles.age,
      'dateOfBirth': youthProfiles.dateOfBirth,
      'createdAt': youthProfiles.createdAt,
      'updatedAt': youthProfiles.updatedAt
    };
    
    const sortField = sortableFields[sortBy] || youthProfiles.fullName;
    if (sortDirection === 'desc') {
      query = query.orderBy(desc(sortField));
    } else {
      query = query.orderBy(asc(sortField));
    }
    
    // Execute query
    const youthResults = await query.execute();
    
    // Fetch additional data if requested
    const youthIds = youthResults.map(youth => youth.id);
    
    // Initialize arrays to store additional data
    let educationData = [];
    let skillsData = [];
    let certificationsData = [];
    let trainingData = [];
    let businessData = [];
    let portfolioData = [];
    let socialMediaData = [];
    
    // Fetch education data if needed and if there are any youth results
    if (includeEducation && youthIds.length > 0) {
      educationData = await db
        .select()
        .from(education)
        .where(inArray(education.youthId, youthIds))
        .execute();
    }
    
    // Fetch skills data if needed
    if (includeSkills && youthIds.length > 0) {
      skillsData = await db
        .select({
          youthId: youthSkills.youthId,
          skillId: youthSkills.skillId,
          skillName: skills.name,
          proficiency: youthSkills.proficiency,
          yearsOfExperience: youthSkills.yearsOfExperience,
          isPrimary: youthSkills.isPrimary,
          notes: youthSkills.notes,
          createdAt: youthSkills.createdAt
        })
        .from(youthSkills)
        .innerJoin(skills, eq(youthSkills.skillId, skills.id))
        .where(inArray(youthSkills.youthId, youthIds))
        .execute();
    }
    
    // Fetch certifications if needed
    if (includeCertifications && youthIds.length > 0) {
      certificationsData = await db
        .select()
        .from(certifications)
        .where(inArray(certifications.youthId, youthIds))
        .execute();
    }
    
    // Fetch training data if needed
    if (includeTraining && youthIds.length > 0) {
      trainingData = await db
        .select({
          id: youthTraining.id,
          youthId: youthTraining.youthId,
          programId: youthTraining.programId,
          programName: trainingPrograms.name,
          programDescription: trainingPrograms.description,
          startDate: youthTraining.startDate,
          completionDate: youthTraining.completionDate,
          status: youthTraining.status,
          certificationReceived: youthTraining.certificationReceived,
          notes: youthTraining.notes,
          createdAt: youthTraining.createdAt
        })
        .from(youthTraining)
        .innerJoin(trainingPrograms, eq(youthTraining.programId, trainingPrograms.id))
        .where(inArray(youthTraining.youthId, youthIds))
        .execute();
    }
    
    // Fetch business relationships if needed
    if (includeBusinesses && youthIds.length > 0) {
      businessData = await db
        .select({
          youthId: businessYouthRelationships.youthId,
          businessId: businessYouthRelationships.businessId,
          businessName: businessProfiles.businessName,
          businessDescription: businessProfiles.businessDescription,
          role: businessYouthRelationships.role,
          joinDate: businessYouthRelationships.joinDate,
          isActive: businessYouthRelationships.isActive
        })
        .from(businessYouthRelationships)
        .innerJoin(businessProfiles, eq(businessYouthRelationships.businessId, businessProfiles.id))
        .where(inArray(businessYouthRelationships.youthId, youthIds))
        .execute();
    }
    
    // Fetch portfolio projects if needed
    if (includePortfolio && youthIds.length > 0) {
      portfolioData = await db
        .select()
        .from(portfolioProjects)
        .where(inArray(portfolioProjects.youthId, youthIds))
        .execute();
        
      socialMediaData = await db
        .select()
        .from(socialMediaLinks)
        .where(inArray(socialMediaLinks.youthId, youthIds))
        .execute();
    }
    
    // Group additional data by youth ID
    const educationByYouth = {};
    const skillsByYouth = {};
    const certificationsByYouth = {};
    const trainingByYouth = {};
    const businessesByYouth = {};
    const portfolioByYouth = {};
    const socialMediaByYouth = {};
    
    // Process education data
    educationData.forEach(item => {
      if (!educationByYouth[item.youthId]) {
        educationByYouth[item.youthId] = [];
      }
      educationByYouth[item.youthId].push(item);
    });
    
    // Process skills data
    skillsData.forEach(item => {
      if (!skillsByYouth[item.youthId]) {
        skillsByYouth[item.youthId] = [];
      }
      skillsByYouth[item.youthId].push(item);
    });
    
    // Process certifications data
    certificationsData.forEach(item => {
      if (!certificationsByYouth[item.youthId]) {
        certificationsByYouth[item.youthId] = [];
      }
      certificationsByYouth[item.youthId].push(item);
    });
    
    // Process training data
    trainingData.forEach(item => {
      if (!trainingByYouth[item.youthId]) {
        trainingByYouth[item.youthId] = [];
      }
      trainingByYouth[item.youthId].push(item);
    });
    
    // Process business data
    businessData.forEach(item => {
      if (!businessesByYouth[item.youthId]) {
        businessesByYouth[item.youthId] = [];
      }
      businessesByYouth[item.youthId].push(item);
    });
    
    // Process portfolio data
    portfolioData.forEach(item => {
      if (!portfolioByYouth[item.youthId]) {
        portfolioByYouth[item.youthId] = [];
      }
      portfolioByYouth[item.youthId].push(item);
    });
    
    // Process social media data
    socialMediaData.forEach(item => {
      if (!socialMediaByYouth[item.youthId]) {
        socialMediaByYouth[item.youthId] = [];
      }
      socialMediaByYouth[item.youthId].push(item);
    });
    
    // Add additional data to youth profiles
    const enrichedResults = youthResults.map(youth => {
      // Add the additional data if it exists
      return {
        ...youth,
        education: includeEducation ? (educationByYouth[youth.id] || []) : undefined,
        skills: includeSkills ? (skillsByYouth[youth.id] || []) : undefined,
        certifications: includeCertifications ? (certificationsByYouth[youth.id] || []) : undefined,
        training: includeTraining ? (trainingByYouth[youth.id] || []) : undefined,
        businesses: includeBusinesses ? (businessesByYouth[youth.id] || []) : undefined,
        portfolioProjects: includePortfolio ? (portfolioByYouth[youth.id] || []) : undefined,
        socialMediaLinks: includePortfolio ? (socialMediaByYouth[youth.id] || []) : undefined
      };
    });
    
    // Generate the appropriate file format
    switch (format) {
      case 'json':
        await generateJSONExport(enrichedResults, filePath);
        break;
      case 'xlsx':
        await generateExcelExport(enrichedResults, filePath);
        break;
      case 'csv':
        await generateCSVExport(enrichedResults, filePath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    return { success: true, count: enrichedResults.length };
  } catch (error) {
    console.error('Error generating export:', error);
    
    // Write error message to a file
    const errorPath = path.join(exportsDir, `youth-export-${exportId}.error`);
    await fs.writeFile(errorPath, error.message || 'Unknown error', 'utf8');
    
    throw error;
  }
}

/**
 * Generate a JSON file from the data
 */
async function generateJSONExport(data, outputPath) {
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(outputPath, jsonData, 'utf8');
}

/**
 * Generate an Excel file from the data
 */
async function generateExcelExport(data, outputPath) {
  const workbook = new ExcelJS.Workbook();
  
  // Create the main youth profiles worksheet
  const youthSheet = workbook.addWorksheet('Youth Profiles');
  
  // Extract youth profile fields excluding related data
  // This creates a flat structure for the main sheet
  const flattenedProfiles = data.map(youth => {
    const { education, skills, certifications, training, businesses, portfolioProjects, socialMediaLinks, ...profile } = youth;
    
    // Convert JSON fields to strings
    const flattenedProfile = { ...profile };
    for (const key in flattenedProfile) {
      if (flattenedProfile[key] !== null && typeof flattenedProfile[key] === 'object') {
        flattenedProfile[key] = JSON.stringify(flattenedProfile[key]);
      }
    }
    
    return flattenedProfile;
  });
  
  // Get all keys from the flattened profiles
  const profileKeys = new Set();
  flattenedProfiles.forEach(profile => {
    Object.keys(profile).forEach(key => profileKeys.add(key));
  });
  
  // Convert to an array and sort for consistent output
  const profileColumns = Array.from(profileKeys).sort();
  
  // Add columns to the worksheet with readable headers
  const headers = profileColumns.map(key => {
    // Convert camelCase to Title Case with spaces
    return {
      header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      key,
      width: 20 // Default width
    };
  });
  
  youthSheet.columns = headers;
  
  // Add data rows to the main sheet
  youthSheet.addRows(flattenedProfiles);
  
  // Style header row
  const headerRow = youthSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light grey
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Create additional worksheets for related data
  const hasEducation = data.some(y => y.education && y.education.length > 0);
  const hasSkills = data.some(y => y.skills && y.skills.length > 0);
  const hasCertifications = data.some(y => y.certifications && y.certifications.length > 0);
  const hasTraining = data.some(y => y.training && y.training.length > 0);
  const hasBusinesses = data.some(y => y.businesses && y.businesses.length > 0);
  const hasPortfolio = data.some(y => y.portfolioProjects && y.portfolioProjects.length > 0);
  const hasSocialMedia = data.some(y => y.socialMediaLinks && y.socialMediaLinks.length > 0);
  
  // Add education worksheet if needed
  if (hasEducation) {
    const educationSheet = workbook.addWorksheet('Education');
    
    // Collect all education records
    const allEducation = [];
    data.forEach(youth => {
      if (youth.education && youth.education.length > 0) {
        youth.education.forEach(edu => {
          allEducation.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...edu
          });
        });
      }
    });
    
    // Get education columns
    const eduKeys = new Set();
    allEducation.forEach(edu => {
      Object.keys(edu).forEach(key => eduKeys.add(key));
    });
    
    // Add columns to education worksheet
    const eduColumns = Array.from(eduKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    educationSheet.columns = eduColumns;
    educationSheet.addRows(allEducation);
    
    // Style header row
    const headerRow = educationSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add skills worksheet if needed
  if (hasSkills) {
    const skillsSheet = workbook.addWorksheet('Skills');
    
    // Collect all skills records
    const allSkills = [];
    data.forEach(youth => {
      if (youth.skills && youth.skills.length > 0) {
        youth.skills.forEach(skill => {
          allSkills.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...skill
          });
        });
      }
    });
    
    // Get skills columns
    const skillKeys = new Set();
    allSkills.forEach(skill => {
      Object.keys(skill).forEach(key => skillKeys.add(key));
    });
    
    // Add columns to skills worksheet
    const skillColumns = Array.from(skillKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    skillsSheet.columns = skillColumns;
    skillsSheet.addRows(allSkills);
    
    // Style header row
    const headerRow = skillsSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        // Completing the server/routes/dataExport.ts file

        right: { style: 'thin' }
      };
    });
  }
  
  // Add certifications worksheet if needed
  if (hasCertifications) {
    const certSheet = workbook.addWorksheet('Certifications');
    
    // Collect all certification records
    const allCertifications = [];
    data.forEach(youth => {
      if (youth.certifications && youth.certifications.length > 0) {
        youth.certifications.forEach(cert => {
          allCertifications.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...cert
          });
        });
      }
    });
    
    // Get certification columns
    const certKeys = new Set();
    allCertifications.forEach(cert => {
      Object.keys(cert).forEach(key => certKeys.add(key));
    });
    
    // Add columns to certifications worksheet
    const certColumns = Array.from(certKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    certSheet.columns = certColumns;
    certSheet.addRows(allCertifications);
    
    // Style header row
    const headerRow = certSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add training worksheet if needed
  if (hasTraining) {
    const trainingSheet = workbook.addWorksheet('Training');
    
    // Collect all training records
    const allTraining = [];
    data.forEach(youth => {
      if (youth.training && youth.training.length > 0) {
        youth.training.forEach(training => {
          allTraining.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...training
          });
        });
      }
    });
    
    // Get training columns
    const trainingKeys = new Set();
    allTraining.forEach(training => {
      Object.keys(training).forEach(key => trainingKeys.add(key));
    });
    
    // Add columns to training worksheet
    const trainingColumns = Array.from(trainingKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    trainingSheet.columns = trainingColumns;
    trainingSheet.addRows(allTraining);
    
    // Style header row
    const headerRow = trainingSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add businesses worksheet if needed
  if (hasBusinesses) {
    const businessSheet = workbook.addWorksheet('Businesses');
    
    // Collect all business records
    const allBusinesses = [];
    data.forEach(youth => {
      if (youth.businesses && youth.businesses.length > 0) {
        youth.businesses.forEach(business => {
          allBusinesses.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...business
          });
        });
      }
    });
    
    // Get business columns
    const businessKeys = new Set();
    allBusinesses.forEach(business => {
      Object.keys(business).forEach(key => businessKeys.add(key));
    });
    
    // Add columns to business worksheet
    const businessColumns = Array.from(businessKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    businessSheet.columns = businessColumns;
    businessSheet.addRows(allBusinesses);
    
    // Style header row
    const headerRow = businessSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add portfolio projects worksheet if needed
  if (hasPortfolio) {
    const portfolioSheet = workbook.addWorksheet('Portfolio Projects');
    
    // Collect all portfolio records
    const allPortfolios = [];
    data.forEach(youth => {
      if (youth.portfolioProjects && youth.portfolioProjects.length > 0) {
        youth.portfolioProjects.forEach(project => {
          allPortfolios.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...project
          });
        });
      }
    });
    
    // Get portfolio columns
    const portfolioKeys = new Set();
    allPortfolios.forEach(project => {
      Object.keys(project).forEach(key => portfolioKeys.add(key));
    });
    
    // Add columns to portfolio worksheet
    const portfolioColumns = Array.from(portfolioKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    portfolioSheet.columns = portfolioColumns;
    portfolioSheet.addRows(allPortfolios);
    
    // Style header row
    const headerRow = portfolioSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add social media links worksheet if needed
  if (hasSocialMedia) {
    const socialMediaSheet = workbook.addWorksheet('Social Media');
    
    // Collect all social media records
    const allSocialMedia = [];
    data.forEach(youth => {
      if (youth.socialMediaLinks && youth.socialMediaLinks.length > 0) {
        youth.socialMediaLinks.forEach(link => {
          allSocialMedia.push({
            youthId: youth.id,
            youthName: youth.fullName,
            ...link
          });
        });
      }
    });
    
    // Get social media columns
    const socialMediaKeys = new Set();
    allSocialMedia.forEach(link => {
      Object.keys(link).forEach(key => socialMediaKeys.add(key));
    });
    
    // Add columns to social media worksheet
    const socialMediaColumns = Array.from(socialMediaKeys).sort().map(key => {
      return {
        header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        key,
        width: 20
      };
    });
    
    socialMediaSheet.columns = socialMediaColumns;
    socialMediaSheet.addRows(allSocialMedia);
    
    // Style header row
    const headerRow = socialMediaSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Add metadata worksheet
  const metadataSheet = workbook.addWorksheet('Export Info');
  metadataSheet.columns = [
    { header: 'Property', key: 'property', width: 30 },
    { header: 'Value', key: 'value', width: 50 }
  ];
  
  // Add metadata rows
  metadataSheet.addRows([
    { property: 'Export Date', value: new Date().toISOString() },
    { property: 'Total Youth Profiles', value: data.length },
    { property: 'Includes Education', value: String(hasEducation) },
    { property: 'Includes Skills', value: String(hasSkills) },
    { property: 'Includes Certifications', value: String(hasCertifications) },
    { property: 'Includes Training', value: String(hasTraining) },
    { property: 'Includes Businesses', value: String(hasBusinesses) },
    { property: 'Includes Portfolio', value: String(hasPortfolio) }
  ]);
  
  // Style header row
  const metadataHeaderRow = metadataSheet.getRow(1);
  metadataHeaderRow.font = { bold: true };
  metadataHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Save the workbook
  await workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate a CSV file from the data
 */
async function generateCSVExport(data, outputPath) {
  // For CSV, we need to flatten the hierarchical structure
  // We'll create a flattened version of each youth profile
  const flattenedData = data.map(youth => {
    // Start with main youth profile data
    const flattenedYouth = { ...youth };
    
    // Convert JSON fields to strings
    for (const key in flattenedYouth) {
      if (
        flattenedYouth[key] !== null && 
        typeof flattenedYouth[key] === 'object' && 
        !Array.isArray(flattenedYouth[key])
      ) {
        flattenedYouth[key] = JSON.stringify(flattenedYouth[key]);
      }
    }
    
    // Handle related collections by creating summary fields
    if (youth.education && youth.education.length > 0) {
      flattenedYouth.educationCount = youth.education.length;
      flattenedYouth.educationSummary = youth.education
        .map(e => `${e.qualificationName || ''} - ${e.institution || ''}`)
        .join('; ');
    } else {
      flattenedYouth.educationCount = 0;
      flattenedYouth.educationSummary = '';
    }
    
    if (youth.skills && youth.skills.length > 0) {
      flattenedYouth.skillsCount = youth.skills.length;
      flattenedYouth.skillsSummary = youth.skills
        .map(s => `${s.skillName || ''} (${s.proficiency || ''})`)
        .join('; ');
    } else {
      flattenedYouth.skillsCount = 0;
      flattenedYouth.skillsSummary = '';
    }
    
    if (youth.certifications && youth.certifications.length > 0) {
      flattenedYouth.certificationsCount = youth.certifications.length;
      flattenedYouth.certificationsSummary = youth.certifications
        .map(c => `${c.certificationName || ''} - ${c.issuingOrganization || ''}`)
        .join('; ');
    } else {
      flattenedYouth.certificationsCount = 0;
      flattenedYouth.certificationsSummary = '';
    }
    
    if (youth.training && youth.training.length > 0) {
      flattenedYouth.trainingCount = youth.training.length;
      flattenedYouth.trainingSummary = youth.training
        .map(t => `${t.programName || ''} (${t.status || ''})`)
        .join('; ');
    } else {
      flattenedYouth.trainingCount = 0;
      flattenedYouth.trainingSummary = '';
    }
    
    if (youth.businesses && youth.businesses.length > 0) {
      flattenedYouth.businessesCount = youth.businesses.length;
      flattenedYouth.businessesSummary = youth.businesses
        .map(b => `${b.businessName || ''} (${b.role || ''})`)
        .join('; ');
    } else {
      flattenedYouth.businessesCount = 0;
      flattenedYouth.businessesSummary = '';
    }
    
    if (youth.portfolioProjects && youth.portfolioProjects.length > 0) {
      flattenedYouth.portfolioCount = youth.portfolioProjects.length;
      flattenedYouth.portfolioSummary = youth.portfolioProjects
        .map(p => p.title || '')
        .join('; ');
    } else {
      flattenedYouth.portfolioCount = 0;
      flattenedYouth.portfolioSummary = '';
    }
    
    // Remove the original nested arrays
    delete flattenedYouth.education;
    delete flattenedYouth.skills;
    delete flattenedYouth.certifications;
    delete flattenedYouth.training;
    delete flattenedYouth.businesses;
    delete flattenedYouth.portfolioProjects;
    delete flattenedYouth.socialMediaLinks;
    
    return flattenedYouth;
  });
  
  // Generate CSV with headers
  const csvContent = stringify(flattenedData, { 
    header: true,
    columns: Object.keys(flattenedData[0] || {}).sort()
  });
  
  // Write to file
  await fs.writeFile(outputPath, csvContent, 'utf8');
}

export default router;