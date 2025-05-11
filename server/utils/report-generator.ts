import { db } from '../db';
import { Report, ReportRun, ReportType } from '@shared/schema';
import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { reports, reportRuns, users, youthProfiles, businessProfiles, mentors, makerspaces, trainingPrograms } from '@shared/schema';

// Make sure the uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const reportsDir = path.join(uploadsDir, 'reports');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

/**
 * Generate a unique filename for a report
 */
const generateFilename = (reportType: string, format: string, userId: number): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `${reportType}_${timestamp}_user${userId}.${format}`;
};

/**
 * Update the status of a report run
 */
export const updateReportRunStatus = async (runId: number, status: string, resultCount?: number, error?: string) => {
  const updates: any = { status };
  
  if (resultCount !== undefined) {
    updates.resultCount = resultCount;
  }
  
  if (error) {
    updates.error = error;
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.completedAt = new Date();
  }
  
  await db.update(reportRuns)
    .set(updates)
    .where(eq(reportRuns.id, runId));
};

/**
 * Get youth profile data for a report
 */
const getYouthData = async (filters: any = {}) => {
  // Start with a base query
  let query = db.select().from(youthProfiles);
  
  // Apply filters if any
  if (filters.district) {
    query = query.where(eq(youthProfiles.district, filters.district));
  }
  
  if (filters.gender) {
    query = query.where(eq(youthProfiles.gender, filters.gender));
  }
  
  // Can add more filters based on requirements
  
  return await query;
};

/**
 * Get business profile data for a report
 */
const getBusinessData = async (filters: any = {}, detailed: boolean = false) => {
  // Start with a base query
  let query = db.select().from(businessProfiles);
  
  // Apply filters if any
  if (filters.district) {
    query = query.where(eq(businessProfiles.district, filters.district));
  }
  
  // Can add more filters based on requirements
  
  // For detailed reports, you might want to join with other tables
  if (detailed) {
    // This is a placeholder for more complex queries with joins
    // query = query.leftJoin(...)
  }
  
  return await query;
};

/**
 * Get mentor data for a report
 */
const getMentorData = async (filters: any = {}) => {
  // Start with a base query
  let query = db.select().from(mentors);
  
  // Apply filters if any
  if (filters.assignedDistrict) {
    query = query.where(eq(mentors.assignedDistrict, filters.assignedDistrict));
  }
  
  return await query;
};

/**
 * Get makerspace data for a report
 */
const getMakerspaceData = async (filters: any = {}) => {
  // Start with a base query
  let query = db.select().from(makerspaces);
  
  // Apply filters if any
  if (filters.district) {
    query = query.where(eq(makerspaces.district, filters.district));
  }
  
  return await query;
};

/**
 * Get training program data for a report
 */
const getTrainingData = async (filters: any = {}) => {
  // Start with a base query
  let query = db.select().from(trainingPrograms);
  
  return await query;
};

/**
 * Get report data based on report type
 */
export const getReportData = async (report: Report, filters: any = {}): Promise<any[]> => {
  let data: any[] = [];
  
  // Merge report filters with run-specific filters
  const mergedFilters = { ...report.filters, ...filters };
  
  switch (report.reportType) {
    case 'youth_basic':
    case 'youth_detailed':
      data = await getYouthData(mergedFilters);
      break;
      
    case 'business_basic':
      data = await getBusinessData(mergedFilters, false);
      break;
      
    case 'business_detailed':
      data = await getBusinessData(mergedFilters, true);
      break;
      
    case 'mentor_basic':
    case 'mentor_detailed':
      data = await getMentorData(mergedFilters);
      break;
      
    case 'makerspace_basic':
    case 'makerspace_detailed':
      data = await getMakerspaceData(mergedFilters);
      break;
      
    case 'training_basic':
    case 'training_detailed':
      data = await getTrainingData(mergedFilters);
      break;
      
    // Additional case statements for other report types
    
    default:
      throw new Error(`Unsupported report type: ${report.reportType}`);
  }
  
  return data;
};

/**
 * Generate an Excel report
 */
export const generateExcelReport = async (
  report: Report, 
  data: any[], 
  runId: number,
  userId: number
): Promise<string> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');
    
    // Add title and metadata
    worksheet.addRow(['Report Title', report.title]);
    worksheet.addRow(['Generated On', new Date().toISOString()]);
    worksheet.addRow(['Report Type', report.reportType]);
    worksheet.addRow(['Total Records', data.length.toString()]);
    worksheet.addRow([]);  // Empty row as separator
    
    // Define columns based on the data
    if (data.length > 0) {
      // Use report.columns if available, otherwise use all fields from the first record
      const columns = (report.columns && report.columns.length > 0) 
        ? report.columns 
        : Object.keys(data[0]);
        
      // Add header row
      worksheet.addRow(columns.map(col => col.replace(/_/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      ));
      
      // Add data rows
      data.forEach(item => {
        const rowData = columns.map(col => {
          const value = item[col];
          // Handle different data types appropriately
          if (value instanceof Date) {
            return value.toISOString().split('T')[0];
          } else if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value;
        });
        worksheet.addRow(rowData);
      });
      
      // Style the header row
      const headerRow = worksheet.getRow(6);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7B03B' }  // Gold color for header
      };
    } else {
      worksheet.addRow(['No data available for this report']);
    }
    
    // Set column widths
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Generate filename and save
    const filename = generateFilename(report.reportType, 'xlsx', userId);
    const filePath = path.join(reportsDir, filename);
    
    await workbook.xlsx.writeFile(filePath);
    
    // Update the report run record
    await updateReportRunStatus(runId, 'completed', data.length);
    
    return `/uploads/reports/${filename}`;
  } catch (error) {
    console.error('Excel report generation error:', error);
    await updateReportRunStatus(runId, 'failed', undefined, error.message);
    throw error;
  }
};

/**
 * Generate a CSV report
 */
export const generateCsvReport = async (
  report: Report, 
  data: any[], 
  runId: number,
  userId: number
): Promise<string> => {
  try {
    // Define columns based on the data
    const columns = (report.columns && report.columns.length > 0) 
      ? report.columns.map(col => ({
          id: col,
          title: col.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }))
      : (data.length > 0 ? Object.keys(data[0]).map(key => ({
          id: key,
          title: key.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        })) : []);
    
    // Process data to handle complex objects
    const processedData = data.map(item => {
      const result = { ...item };
      Object.keys(result).forEach(key => {
        if (result[key] instanceof Date) {
          result[key] = result[key].toISOString().split('T')[0];
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = JSON.stringify(result[key]);
        }
      });
      return result;
    });
    
    // Generate filename and path
    const filename = generateFilename(report.reportType, 'csv', userId);
    const filePath = path.join(reportsDir, filename);
    
    // Create a CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: columns
    });
    
    // Write data
    await csvWriter.writeRecords(processedData);
    
    // Update the report run record
    await updateReportRunStatus(runId, 'completed', data.length);
    
    return `/uploads/reports/${filename}`;
  } catch (error) {
    console.error('CSV report generation error:', error);
    await updateReportRunStatus(runId, 'failed', undefined, error.message);
    throw error;
  }
};

/**
 * Generate a PDF report (placeholder)
 * In a real implementation, you would use a library like PDFKit or html-pdf
 */
export const generatePdfReport = async (
  report: Report, 
  data: any[], 
  runId: number,
  userId: number
): Promise<string> => {
  try {
    // This is a placeholder - in a real implementation you would use a PDF generation library
    
    // Generate filename and path
    const filename = generateFilename(report.reportType, 'pdf', userId);
    const filePath = path.join(reportsDir, filename);
    
    // Create a simple PDF (this is just a placeholder)
    const pdfContent = `
      Report Title: ${report.title}
      Generated On: ${new Date().toISOString()}
      Report Type: ${report.reportType}
      Total Records: ${data.length}
      
      Data: ${JSON.stringify(data, null, 2)}
    `;
    
    fs.writeFileSync(filePath, pdfContent);
    
    // Update the report run record
    await updateReportRunStatus(runId, 'completed', data.length);
    
    return `/uploads/reports/${filename}`;
  } catch (error) {
    console.error('PDF report generation error:', error);
    await updateReportRunStatus(runId, 'failed', undefined, error.message);
    throw error;
  }
};

/**
 * Generate a report based on format
 */
export const generateReport = async (
  report: Report, 
  format: string, 
  filters: any,
  runId: number,
  userId: number
): Promise<string> => {
  try {
    // Get the report data
    const data = await getReportData(report, filters);
    
    // Generate the report in the requested format
    switch (format) {
      case 'excel':
        return await generateExcelReport(report, data, runId, userId);
        
      case 'csv':
        return await generateCsvReport(report, data, runId, userId);
        
      case 'pdf':
        return await generatePdfReport(report, data, runId, userId);
        
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    await updateReportRunStatus(runId, 'failed', undefined, error.message);
    throw error;
  }
};