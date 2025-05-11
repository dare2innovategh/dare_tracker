// server/routes/reports.ts
import { Router } from 'express';
import { db } from '../db';
import { 
  youthProfiles, 
  youthReportTemplates, 
  youthReportExecutions,
  education,
  youthSkills,
  skills
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
  lte
} from 'drizzle-orm';
import { auth } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';


const router = Router();

// Get the directory name for the current module (for file paths)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * @route POST /api/reports/youth/generate
 * @desc Generate a downloadable youth profile report with all fields
 * @access Private (requires auth)
 */
router.post('/youth/generate', auth, async (req, res) => {
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
      // Build query for youth profiles with all fields
      let query = db.select()
        .from(youthProfiles);
      
      // Apply filters
      if (district && district.length > 0) {
        query = query.where(inArray(youthProfiles.district, district));
      }
      
      if (gender && gender.length > 0) {
        query = query.where(inArray(youthProfiles.gender, gender));
      }
      
      if (dareModel && dareModel.length > 0) {
        query = query.where(inArray(youthProfiles.dareModel, dareModel));
      }
      
      if (trainingStatus && trainingStatus.length > 0) {
        query = query.where(inArray(youthProfiles.trainingStatus, trainingStatus));
      }
      
      // Age range filter
      if (minAge && maxAge) {
        query = query.where(
          and(
            gte(youthProfiles.age, parseInt(minAge)),
            lte(youthProfiles.age, parseInt(maxAge))
          )
        );
      } else if (minAge) {
        query = query.where(gte(youthProfiles.age, parseInt(minAge)));
      } else if (maxAge) {
        query = query.where(lte(youthProfiles.age, parseInt(maxAge)));
      }
      
      // Keyword search
      if (keyword) {
        query = query.where(
          or(
            like(youthProfiles.fullName, `%${keyword}%`),
            like(youthProfiles.firstName, `%${keyword}%`),
            like(youthProfiles.lastName, `%${keyword}%`),
            like(youthProfiles.coreSkills, `%${keyword}%`),
            like(youthProfiles.industryExpertise, `%${keyword}%`)
          )
        );
      }
      
      // Default sort by name
      query = query.orderBy(asc(youthProfiles.fullName));
      
      // Execute the query
      const results = await query.execute();
      
      console.log(`Found ${results.length} youth profiles matching criteria`);
      
      // Create temporary file path for export
      const timestamp = Date.now();
      const tempFilename = `temp_youth_export_${timestamp}`;
      const tempPath = path.join(reportsDir, tempFilename);
      
      if (format === 'excel') {
        // Generate Excel file
        const excelPath = `${tempPath}.xlsx`;
        await generateExcel(results, excelPath, 'Youth Profile Report');
        
        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="youth-report.xlsx"');
        
        // Stream file to response
        const fileStream = fs.createReadStream(excelPath);
        fileStream.pipe(res);
        
        // Delete file after sending
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(excelPath);
          } catch (err) {
            console.error('Error deleting temporary Excel file:', err);
          }
        });
      } 
      else if (format === 'csv') {
        // Generate CSV file
        const csvPath = `${tempPath}.csv`;
        generateCSV(results, csvPath);
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="youth-report.csv"');
        
        // Stream file to response
        const fileStream = fs.createReadStream(csvPath);
        fileStream.pipe(res);
        
        // Delete file after sending
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(csvPath);
          } catch (err) {
            console.error('Error deleting temporary CSV file:', err);
          }
        });
      }
      else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="youth-report.json"');
        
        // Send the JSON data directly
        return res.json(results);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate report' 
      });
    }
  });
// Get specific template by ID
router.get('/youth/templates/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [template] = await db
      .select()
      .from(youthReportTemplates)
      .where(eq(youthReportTemplates.id, parseInt(id)))
      .execute();
      
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    
    return res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching report template:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch report template' 
    });
  }
});

// Create a new report template
router.post('/youth/templates', auth, async (req, res) => {
  const { 
    name, 
    description, 
    reportType,
    filters,
    columns,
    sortBy,
    sortDirection,
    groupBy,
    chartOptions,
    displayOptions,
    isDefault
  } = req.body;
  
  try {
    const [template] = await db
      .insert(youthReportTemplates)
      .values({
        name,
        description,
        reportType,
        filters: filters || {},
        columns: columns || [],
        sortBy,
        sortDirection: sortDirection || 'asc',
        groupBy,
        chartOptions: chartOptions || {},
        displayOptions: displayOptions || {},
        isDefault: isDefault || false,
        createdBy: req.user.id, // From auth middleware
        updatedAt: new Date()
      })
      .returning()
      .execute();
      
    return res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Error creating report template:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create report template' 
    });
  }
});

// Get all report executions
router.get('/youth/executions', auth, async (req, res) => {
  try {
    const executions = await db
      .select()
      .from(youthReportExecutions)
      .orderBy(desc(youthReportExecutions.createdAt))
      .limit(100) // Limit to prevent large result sets
      .execute();
      
    return res.json({ success: true, executions });
  } catch (error) {
    console.error('Error fetching report executions:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch report executions' 
    });
  }
});

// Get specific execution by ID
router.get('/youth/executions/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [execution] = await db
      .select()
      .from(youthReportExecutions)
      .where(eq(youthReportExecutions.id, parseInt(id)))
      .execute();
      
    if (!execution) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report execution not found' 
      });
    }
    
    return res.json({ success: true, execution });
  } catch (error) {
    console.error('Error fetching report execution:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch report execution' 
    });
  }
});

// Create and execute a new report
router.post('/youth/execute', auth, async (req, res) => {
  const { 
    name, 
    reportType, 
    templateId, 
    filters, 
    sortBy,
    sortDirection,
    exportFormat 
  } = req.body;
  
  try {
    // Create a new report execution record
    const [execution] = await db
      .insert(youthReportExecutions)
      .values({
        name,
        templateId: templateId || null,
        filters: filters || {},
        parameters: {
          reportType,
          sortBy,
          sortDirection
        },
        exportFormat: exportFormat || 'pdf',
        status: 'pending',
        executedBy: req.user.id,
        startedAt: new Date()
      })
      .returning()
      .execute();
    
    // Process report asynchronously
    // In a real-world application, you might use a queue system like Bull or Celery
    // For simplicity, we'll just do it directly here
    processYouthReport(execution.id)
      .catch(err => console.error('Error processing report:', err));
    
    return res.status(201).json({ 
      success: true, 
      execution,
      message: 'Report generation started'
    });
  } catch (error) {
    console.error('Error creating report execution:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create report execution' 
    });
  }
});

// Helper function to process the report
async function processYouthReport(executionId) {
  try {
    // Update status to processing
    await db
      .update(youthReportExecutions)
      .set({ status: 'processing' })
      .where(eq(youthReportExecutions.id, executionId))
      .execute();
    
    // Get the execution details
    const [execution] = await db
      .select()
      .from(youthReportExecutions)
      .where(eq(youthReportExecutions.id, executionId))
      .execute();
    
    if (!execution) {
      throw new Error('Report execution not found');
    }
    
    // Build base query for youth profiles
    let query = db
      .select({
        id: youthProfiles.id,
        fullName: youthProfiles.fullName,
        participantCode: youthProfiles.participantCode,
        district: youthProfiles.district,
        town: youthProfiles.town,
        gender: youthProfiles.gender,
        phoneNumber: youthProfiles.phoneNumber,
        email: youthProfiles.email,
        dateOfBirth: youthProfiles.dateOfBirth,
        age: youthProfiles.age,
        dareModel: youthProfiles.dareModel,
        trainingStatus: youthProfiles.trainingStatus,
        industryExpertise: youthProfiles.industryExpertise,
        employmentStatus: youthProfiles.employmentStatus,
        createdAt: youthProfiles.createdAt
      })
      .from(youthProfiles);
    
    // Apply filters from execution record
    const filters = execution.filters || {};
    
    // District filter
    if (filters.district && filters.district.length > 0) {
      query = query.where(inArray(youthProfiles.district, filters.district));
    }
    
    // Gender filter
    if (filters.gender && filters.gender.length > 0) {
      query = query.where(inArray(youthProfiles.gender, filters.gender));
    }
    
    // DARE Model filter
    if (filters.dareModel && filters.dareModel.length > 0) {
      query = query.where(inArray(youthProfiles.dareModel, filters.dareModel));
    }
    
    // Training Status filter
    if (filters.trainingStatus && filters.trainingStatus.length > 0) {
      query = query.where(inArray(youthProfiles.trainingStatus, filters.trainingStatus));
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
    
    // Keyword search
    if (filters.keyword) {
      query = query.where(
        or(
          like(youthProfiles.fullName, `%${filters.keyword}%`),
          like(youthProfiles.coreSkills, `%${filters.keyword}%`),
          like(youthProfiles.industryExpertise, `%${filters.keyword}%`)
        )
      );
    }
    
    // Apply sorting
    const params = execution.parameters || {};
    if (params.sortBy) {
      const direction = params.sortDirection === 'desc' ? 'desc' : 'asc';
      
      // Handle different sort columns
      switch (params.sortBy) {
        case 'fullName':
          query = direction === 'desc' 
            ? query.orderBy(desc(youthProfiles.fullName))
            : query.orderBy(asc(youthProfiles.fullName));
          break;
        case 'age':
          query = direction === 'desc'
            ? query.orderBy(desc(youthProfiles.age))
            : query.orderBy(asc(youthProfiles.age));
          break;
        case 'district':
          query = direction === 'desc'
            ? query.orderBy(desc(youthProfiles.district))
            : query.orderBy(asc(youthProfiles.district));
          break;
        case 'createdAt':
          query = direction === 'desc'
            ? query.orderBy(desc(youthProfiles.createdAt))
            : query.orderBy(asc(youthProfiles.createdAt));
          break;
        default:
          query = query.orderBy(asc(youthProfiles.fullName));
      }
    } else {
      // Default sort by name
      query = query.orderBy(asc(youthProfiles.fullName));
    }
    
    // Execute the query
    const results = await query.execute();
    
    // For detailed reports, fetch additional data if needed
    const reportType = params.reportType || 'youth_basic';
    
    if (reportType === 'youth_detailed' || reportType === 'youth_education') {
      // Fetch education records for each youth
      const youthIds = results.map(r => r.id);
      
      const educationRecords = await db
        .select()
        .from(education)
        .where(inArray(education.youthId, youthIds))
        .execute();
        
      // Group education records by youth ID
      const educationByYouth = {};
      for (const record of educationRecords) {
        if (!educationByYouth[record.youthId]) {
          educationByYouth[record.youthId] = [];
        }
        educationByYouth[record.youthId].push(record);
      }
      
      // Add education records to results
      for (const youth of results) {
        youth.education = educationByYouth[youth.id] || [];
      }
    }
    
    if (reportType === 'youth_detailed' || reportType === 'youth_skills') {
      // Fetch skills for each youth
      const youthIds = results.map(r => r.id);
      
      const skillRecords = await db
        .select({
          youthId: youthSkills.youthId,
          skillId: youthSkills.skillId,
          skillName: skills.name,
          proficiency: youthSkills.proficiency,
          yearsOfExperience: youthSkills.yearsOfExperience
        })
        .from(youthSkills)
        .innerJoin(skills, eq(youthSkills.skillId, skills.id))
        .where(inArray(youthSkills.youthId, youthIds))
        .execute();
        
      // Group skill records by youth ID
      const skillsByYouth = {};
      for (const record of skillRecords) {
        if (!skillsByYouth[record.youthId]) {
          skillsByYouth[record.youthId] = [];
        }
        skillsByYouth[record.youthId].push({
          name: record.skillName,
          proficiency: record.proficiency,
          yearsOfExperience: record.yearsOfExperience
        });
      }
      
      // Add skill records to results
      for (const youth of results) {
        youth.skills = skillsByYouth[youth.id] || [];
      }
    }
    
    // Generate the report based on the export format
    // In a real implementation, you'd use libraries like PDFKit, ExcelJS, etc.
    // Generate the report based on the export format
    let outputPath = '';
    let outputUrl = '';
    
    switch (execution.exportFormat) {
        case 'pdf':
          // Generate PDF using PDFKit
          outputPath = path.join(reportsDir, `${executionId}.pdf`);
          outputUrl = `/api/reports/youth/${executionId}.pdf`;
          
          await generatePDF(results, outputPath, execution.name || `Report ${executionId}`);
          break;
          
        case 'excel':
          // Generate Excel file using ExcelJS
          outputPath = path.join(reportsDir, `${executionId}.xlsx`);
          outputUrl = `/api/reports/youth/${executionId}.xlsx`;
          
          await generateExcel(results, outputPath, execution.name || `Report ${executionId}`);
          break;
          
        case 'csv':
          // Generate CSV file
          outputPath = path.join(reportsDir, `${executionId}.csv`);
          outputUrl = `/api/reports/youth/${executionId}.csv`;
          
          await generateCSV(results, outputPath);
          break;
          
        case 'json':
          // For JSON, store the data in a proper JSON file
          outputPath = path.join(reportsDir, `${executionId}.json`);
          outputUrl = `/api/reports/youth/download/${executionId}`;
          
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
          break;
    }
     
    // Update the report execution record
    await db
      .update(youthReportExecutions)
      .set({
        status: 'completed',
        resultCount: results.length,
        outputUrl,
        completedAt: new Date()
      })
      .where(eq(youthReportExecutions.id, executionId))
      .execute();
    
    return { success: true, count: results.length };
  } catch (error) {
    console.error('Error processing report:', error);
    
    // Update execution with error
    await db
      .update(youthReportExecutions)
      .set({
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      })
      .where(eq(youthReportExecutions.id, executionId))
      .execute();
    
    throw error;
  }
}

// Helper functions for file generation
async function generatePDF(data, outputPath, title) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ autoFirstPage: false });
        const stream = fs.createWriteStream(outputPath);
        
        // Handle stream events
        stream.on('finish', resolve);
        stream.on('error', reject);
        
        // Pipe the PDF to the file
        doc.pipe(stream);
        
        // Add a new page with more space
        doc.addPage({ margin: 50 });
        
        // Add title and date
        doc.fontSize(22).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Add data table with actual content
        if (data.length > 0) {
          doc.fontSize(16).text('Youth Profiles', { underline: true });
          doc.moveDown();
          
          // Table headers with more columns
          const tableHeaders = ['Name', 'District', 'Age', 'Gender', 'DARE Model', 'Training Status'];
          let yPos = doc.y;
          let xPos = 50;
          const colWidth = 85;
          
          // Make header row stand out
          doc.font('Helvetica-Bold');
          tableHeaders.forEach(header => {
            doc.text(header, xPos, yPos, { width: colWidth, align: 'left' });
            xPos += colWidth;
          });
          
          doc.font('Helvetica');
          doc.moveDown();
          
          // Table rows with full data
          data.forEach((youth, index) => {
            // Add page break if needed
            if (doc.y > 700) {
              doc.addPage();
              yPos = doc.y;
            } else {
              yPos = doc.y;
            }
            
            xPos = 50;
            
            // Add alternating row background for readability
            if (index % 2 === 0) {
              doc.rect(50, yPos - 5, colWidth * 6, 20).fill('#f4f4f4', 'even-odd');
              doc.fillColor('black');
            }
            
            // Output all data fields
            [
              youth.fullName || 'N/A',
              youth.district || 'N/A',
              youth.age?.toString() || 'N/A',
              youth.gender || 'N/A',
              youth.dareModel || 'N/A',
              youth.trainingStatus || 'N/A'
            ].forEach(cellData => {
              doc.text(cellData, xPos, yPos, { width: colWidth - 5 });
              xPos += colWidth;
            });
            
            doc.moveDown();
          });
          
          // Add summary at the end
          doc.moveDown(2);
          doc.font('Helvetica-Bold');
          doc.text(`Total Records: ${data.length}`, { align: 'right' });
        } else {
          doc.text('No data available for this report.', { italic: true });
        }
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
/**
 * Generate Excel file with all youth profile fields
 */
async function generateExcel(data, outputPath, title) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Youth Data');
  
  // Add title
  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title || 'Youth Profile Report';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Add generation date
  worksheet.mergeCells('A2:I2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
  dateCell.font = { size: 10, italic: true };
  dateCell.alignment = { horizontal: 'center' };
  
  // Add empty row for spacing
  worksheet.addRow([]);
  
  // Process data for Excel - handle nested objects and nulls
  const processedData = data.map(youth => {
    const processed = {};
    
    // Process each field
    Object.keys(youth).forEach(key => {
      if (youth[key] === null || youth[key] === undefined) {
        processed[key] = '';
      } else if (typeof youth[key] === 'object' && !Array.isArray(youth[key])) {
        // Convert objects to JSON strings
        processed[key] = JSON.stringify(youth[key]);
      } else if (Array.isArray(youth[key])) {
        // Convert arrays to comma-separated strings
        processed[key] = youth[key].map(item => {
          if (typeof item === 'object') return JSON.stringify(item);
          return item;
        }).join(', ');
      } else if (youth[key] instanceof Date) {
        // Format dates
        processed[key] = youth[key].toISOString().split('T')[0];
      } else {
        // Keep other values as is
        processed[key] = youth[key];
      }
    });
    
    return processed;
  });
  
  if (processedData.length > 0) {
    // Get all keys from the processed data
    const allKeys = Object.keys(processedData[0]);
    
    // Define columns with proper headers
    const columns = allKeys.map(key => {
      // Convert camelCase to Title Case
      const header = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      return {
        header,
        key,
        width: 20
      };
    });
    
    worksheet.columns = columns;
    
    // Add data rows
    worksheet.addRows(processedData);
    
    // Style header row
    const headerRow = worksheet.getRow(4); // Account for title, date, and spacing
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
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(30, Math.max(12, maxLength + 2));
    });
  } else {
    // Add a message if no data
    worksheet.addRow(['No youth data found matching your filters']);
  }
  
  // Write to file
  return workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate CSV file with all youth profile fields
 */
  
  function generateCSV(data, outputPath) {
    // Define columns to include
    const columns = [
      'fullName', 'participantCode', 'district', 'town', 'gender', 
      'age', 'dareModel', 'trainingStatus', 'employmentStatus'
    ];
    
    // Generate header row with readable names
    const headerMap = {
      'fullName': 'Full Name',
      'participantCode': 'Participant Code',
      'district': 'District',
      'town': 'Town',
      'gender': 'Gender',
      'age': 'Age',
      'dareModel': 'DARE Model',
      'trainingStatus': 'Training Status',
      'employmentStatus': 'Employment Status'
    };
    
    // Prepare data for CSV generation
    const csvData = data.map(youth => {
      const row = {};
      columns.forEach(col => {
        row[headerMap[col]] = youth[col] !== undefined ? youth[col] : '';
      });
      return row;
    });
    
    // Generate CSV string
    const csvContent = stringify(csvData, { header: true });
    
    // Write to file
    fs.writeFileSync(outputPath, csvContent);
  }

router.get('/youth/:id.:format', auth, async (req, res) => {
    const { id, format } = req.params;
  console.log(`Received request for report ID: ${id}, format: ${format}`);
  
  try {
    // Validate the execution exists and is completed
    const [execution] = await db
      .select()
      .from(youthReportExecutions)
      .where(eq(youthReportExecutions.id, parseInt(id)))
      .execute();
      
    console.log('Execution record:', execution);
    
    if (!execution) {
      console.log('Report not found');
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
      
      if (execution.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Report is not ready for download'
        });
      }
      
      // Validate format matches what was generated
      const expectedFormat = execution.exportFormat === 'excel' ? 'xlsx' : execution.exportFormat;
      if (format !== expectedFormat) {
        return res.status(400).json({
          success: false,
          error: `This report was generated in ${execution.exportFormat} format, not ${format}`
        });
      }
      
      // Set the file path
      const filePath = path.join(reportsDir, `${id}.${format}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Report file not found. It may have been deleted or not generated properly.'
        });
      }
      
      // Set appropriate content type
      const contentTypes = {
        'pdf': 'application/pdf',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        'json': 'application/json'
      };
      
      // Set headers
      res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${format}"`);
      
      // Send the file as a stream for better handling of large files
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Handle errors in the stream
      fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error streaming the file'
          });
        }
      });
    } catch (error) {
      console.error('Error serving report file:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to serve report file' 
      });
    }
  });

// Download the report data in JSON format
router.get('/youth/download/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [execution] = await db
      .select()
      .from(youthReportExecutions)
      .where(eq(youthReportExecutions.id, parseInt(id)))
      .execute();
      
    if (!execution) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    if (execution.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Report is not ready for download'
      });
    }
    
    // For demonstration, we'll re-run the query
    // In a real app, you might store the results or generate files on demand
    // This would be handled by processYouthReport and data stored somewhere
    
    // Re-fetch the data using the same filters
    // ... (you'd implement this similar to processYouthReport)
    
    // Return appropriate response based on format
    switch (execution.exportFormat) {
      case 'json':
        // Return JSON data directly
        // For demo purposes, we'll return a placeholder
        return res.json({
          success: true,
          reportName: execution.name,
          generatedAt: execution.completedAt,
          resultCount: execution.resultCount,
          data: [] // This would be the actual data
        });
      default:
        // For other formats, we'd redirect to the file
        // Here we'll just return a placeholder message
        return res.json({
          success: true,
          message: 'Download link would be provided here',
          reportUrl: execution.outputUrl
        });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to download report' 
    });
  }
});


export default router;