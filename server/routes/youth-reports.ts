// server/routes/youth-reports.ts - Missing API endpoints for youth reports
import { Router } from 'express';
import { db } from '../db';
import { youthProfiles } from '@shared/schema';
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
  sql,
  count
} from 'drizzle-orm';
import { auth } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';

const router = Router();

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

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

    // District filter
    if (district && Array.isArray(district) && district.length > 0) {
      const districtCondition = inArray(youthProfiles.district, district);
      conditions.push(districtCondition);
    }

    // Gender filter  
    if (gender && Array.isArray(gender) && gender.length > 0) {
      const genderCondition = inArray(youthProfiles.gender, gender);
      conditions.push(genderCondition);
    }

    // DARE Model filter
    if (dareModel && Array.isArray(dareModel) && dareModel.length > 0) {
      const dareCondition = inArray(youthProfiles.dareModel, dareModel);
      conditions.push(dareCondition);
    }

    // Training Status filter
    if (trainingStatus && Array.isArray(trainingStatus) && trainingStatus.length > 0) {
      const trainingCondition = inArray(youthProfiles.trainingStatus, trainingStatus);
      conditions.push(trainingCondition);
    }

    // Age range filter
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

    // Keyword search
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

    // Apply all conditions
    if (conditions.length > 0) {
      const combinedConditions = and(...conditions);
      query = query.where(combinedConditions);
      countQuery = countQuery.where(combinedConditions);
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    // Add sorting
    query = query.orderBy(asc(youthProfiles.fullName));

    // Execute queries
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
    // Get basic counts
    const [totalResult] = await db.select({ count: sql`count(*)` }).from(youthProfiles);
    const total = totalResult.count;

    // Get counts by district
    const districtStats = await db
      .select({
        district: youthProfiles.district,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.district);

    // Get counts by gender
    const genderStats = await db
      .select({
        gender: youthProfiles.gender,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.gender);

    // Get counts by DARE model
    const dareStats = await db
      .select({
        dareModel: youthProfiles.dareModel,
        count: sql`count(*)`
      })
      .from(youthProfiles)
      .groupBy(youthProfiles.dareModel);

    // Format the stats
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

/**
 * @route POST /api/reports/youth/export
 * @desc Export youth profiles data
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

    // Build the same query as the data endpoint but without pagination
    let query = db.select().from(youthProfiles);

    // Apply the same filters
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

    // Sort by name
    query = query.orderBy(asc(youthProfiles.fullName));

    // Execute query
    const results = await query.execute();

    console.log(`Exporting ${results.length} youth profiles`);

    // Generate export file
    const timestamp = Date.now();
    let filename, filepath, contentType, attachmentName;

    if (format === 'excel') {
      filename = `youth_export_${timestamp}.xlsx`;
      filepath = path.join(reportsDir, filename);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      attachmentName = 'youth-profiles.xlsx';
      
      await generateBasicExcelReport(results, filepath);
    } else if (format === 'csv') {
      filename = `youth_export_${timestamp}.csv`;
      filepath = path.join(reportsDir, filename);
      contentType = 'text/csv';
      attachmentName = 'youth-profiles.csv';
      
      generateBasicCSVReport(results, filepath);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported format. Use "excel" or "csv"'
      });
    }

    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    // Clean up file after sending
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
 * Generate basic Excel report
 */
async function generateBasicExcelReport(data, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Youth Profiles');

  // Add title and metadata
  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Youth Profiles Report';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:L2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
  dateCell.font = { size: 10, italic: true };
  dateCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Empty row

  // Define columns to export
  const columns = [
    { header: 'Full Name', key: 'fullName', width: 25 },
    { header: 'Participant Code', key: 'participantCode', width: 15 },
    { header: 'District', key: 'district', width: 15 },
    { header: 'Town', key: 'town', width: 15 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Phone Number', key: 'phoneNumber', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'DARE Model', key: 'dareModel', width: 15 },
    { header: 'Training Status', key: 'trainingStatus', width: 15 },
    { header: 'Employment Status', key: 'employmentStatus', width: 15 },
    { header: 'Core Skills', key: 'coreSkills', width: 30 }
  ];

  worksheet.columns = columns;

  // Add data rows
  if (data.length > 0) {
    const processedData = data.map(youth => ({
      ...youth,
      age: youth.age || '',
      phoneNumber: youth.phoneNumber || '',
      email: youth.email || '',
      town: youth.town || '',
      dareModel: youth.dareModel || '',
      trainingStatus: youth.trainingStatus || '',
      employmentStatus: youth.employmentStatus || '',
      coreSkills: youth.coreSkills || ''
    }));

    worksheet.addRows(processedData);

    // Style header row
    const headerRow = worksheet.getRow(4);
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

    // Add summary row
    const summaryRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', `Total: ${data.length}`, '']);
    summaryRow.font = { bold: true };
  } else {
    worksheet.addRow(['No data found matching your filters']);
  }

  return workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate basic CSV report
 */
function generateBasicCSVReport(data, outputPath) {
  const columns = [
    'fullName', 'participantCode', 'district', 'town', 'gender', 
    'age', 'phoneNumber', 'email', 'dareModel', 'trainingStatus', 
    'employmentStatus', 'coreSkills'
  ];

  const headerMap = {
    'fullName': 'Full Name',
    'participantCode': 'Participant Code',
    'district': 'District',
    'town': 'Town',
    'gender': 'Gender',
    'age': 'Age',
    'phoneNumber': 'Phone Number',
    'email': 'Email',
    'dareModel': 'DARE Model',
    'trainingStatus': 'Training Status',
    'employmentStatus': 'Employment Status',
    'coreSkills': 'Core Skills'
  };

  const csvData = data.map(youth => {
    const row = {};
    columns.forEach(col => {
      row[headerMap[col]] = youth[col] || '';
    });
    return row;
  });

  const csvContent = stringify(csvData, { header: true });
  fs.writeFileSync(outputPath, csvContent);
}

export default router;