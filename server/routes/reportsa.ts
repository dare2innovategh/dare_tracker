import { Router } from 'express';
import { db } from '../db';
import { reports, reportRuns, users, insertReportSchema, insertReportRunSchema, reportTypeEnum, reportFormatEnum } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateReport, updateReportRunStatus } from '../utils/report-generator';

const router = Router();

// Get all report templates
router.get('/templates', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const templates = await db.select()
      .from(reports)
      .where(eq(reports.isTemplate, true))
      .orderBy(desc(reports.createdAt));

    res.json(templates);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ message: 'Failed to fetch report templates', error: error.message });
  }
});

// Get all reports
router.get('/', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const allReports = await db.select()
      .from(reports)
      .orderBy(desc(reports.createdAt));

    res.json(allReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
});

// Get a specific report by ID
router.get('/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const report = await db.select()
      .from(reports)
      .where(eq(reports.id, parseInt(id)))
      .limit(1);

    if (report.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report[0]);
  } catch (error) {
    console.error(`Error fetching report with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
});

// Create a new report
router.post('/', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const validatedData = insertReportSchema.parse(req.body);
    const newReport = await db.insert(reports)
      .values({
        ...validatedData,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(newReport[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(400).json({ message: 'Failed to create report', error: error.message });
  }
});

// Update a report
router.put('/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const validatedData = insertReportSchema.parse(req.body);
    
    const updatedReport = await db.update(reports)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(reports.id, parseInt(id)))
      .returning();

    if (updatedReport.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(updatedReport[0]);
  } catch (error) {
    console.error(`Error updating report with ID ${req.params.id}:`, error);
    res.status(400).json({ message: 'Failed to update report', error: error.message });
  }
});

// Delete a report
router.delete('/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const deleted = await db.delete(reports)
      .where(eq(reports.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully', report: deleted[0] });
  } catch (error) {
    console.error(`Error deleting report with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete report', error: error.message });
  }
});

// Create and run a report
router.post('/run', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { reportId, format, parameters } = req.body;
    
    // Validate input
    if (!reportId) {
      return res.status(400).json({ message: 'Report ID is required' });
    }
    
    // Validate format
    if (!reportFormatEnum.options.includes(format)) {
      return res.status(400).json({ 
        message: `Invalid format. Must be one of: ${reportFormatEnum.options.join(', ')}` 
      });
    }
    
    // Get the report
    const reportData = await db.select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
      
    if (reportData.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const report = reportData[0];
    
    // Create a report run record
    const [reportRun] = await db.insert(reportRuns)
      .values({
        reportId,
        runBy: req.user.id,
        parameters: parameters || {},
        status: 'pending',
        format,
        startedAt: new Date()
      })
      .returning();
      
    // Run the report asynchronously
    generateReport(report, format, parameters, reportRun.id, req.user.id)
      .then(async (outputUrl) => {
        // Update the report run record with the output URL
        await db.update(reportRuns)
          .set({ 
            outputUrl,
            status: 'completed',
            completedAt: new Date()
          })
          .where(eq(reportRuns.id, reportRun.id));
          
        // Update the last run timestamp on the report
        await db.update(reports)
          .set({ 
            lastRunAt: new Date(),
            lastRunBy: req.user.id
          })
          .where(eq(reports.id, reportId));
      })
      .catch(async (error) => {
        console.error('Error generating report:', error);
        await updateReportRunStatus(reportRun.id, 'failed', undefined, error.message);
      });
      
    // Return the report run ID immediately
    res.status(202).json({
      message: 'Report generation started',
      runId: reportRun.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error running report:', error);
    res.status(500).json({ message: 'Failed to run report', error: error.message });
  }
});

// Get report run status
router.get('/run/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const reportRun = await db.select()
      .from(reportRuns)
      .where(eq(reportRuns.id, parseInt(id)))
      .limit(1);

    if (reportRun.length === 0) {
      return res.status(404).json({ message: 'Report run not found' });
    }

    res.json(reportRun[0]);
  } catch (error) {
    console.error(`Error fetching report run with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch report run', error: error.message });
  }
});

// Get all report runs for a report
router.get('/:id/runs', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const runs = await db.select({
      id: reportRuns.id,
      reportId: reportRuns.reportId,
      runBy: reportRuns.runBy,
      parameters: reportRuns.parameters,
      status: reportRuns.status,
      format: reportRuns.format,
      outputUrl: reportRuns.outputUrl,
      startedAt: reportRuns.startedAt,
      completedAt: reportRuns.completedAt,
      resultCount: reportRuns.resultCount,
      error: reportRuns.error,
      username: users.username,
      userFullName: users.fullName
    })
    .from(reportRuns)
    .leftJoin(users, eq(reportRuns.runBy, users.id))
    .where(eq(reportRuns.reportId, parseInt(id)))
    .orderBy(desc(reportRuns.startedAt));

    res.json(runs);
  } catch (error) {
    console.error(`Error fetching report runs for report with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch report runs', error: error.message });
  }
});

// Get available report types
router.get('/types/available', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(reportTypeEnum.options);
  } catch (error) {
    console.error('Error fetching report types:', error);
    res.status(500).json({ message: 'Failed to fetch report types', error: error.message });
  }
});

// Get available report formats
router.get('/formats/available', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(reportFormatEnum.options);
  } catch (error) {
    console.error('Error fetching report formats:', error);
    res.status(500).json({ message: 'Failed to fetch report formats', error: error.message });
  }
});

// Create template reports for each module
router.post('/seed-templates', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can create report templates' });
    }

    const templateReports = [
      // Youth reports
      {
        title: 'Youth Profile Basic Report',
        description: 'Basic report of all youth profiles with essential information',
        reportType: 'youth_basic',
        isTemplate: true,
        columns: ['id', 'fullName', 'participantCode', 'district', 'gender', 'phoneNumber', 'age', 'ageGroup', 'trainingStatus'],
        createdBy: req.user.id,
      },
      {
        title: 'Youth Profile Detailed Report',
        description: 'Comprehensive report of youth profiles with all available information',
        reportType: 'youth_detailed',
        isTemplate: true,
        createdBy: req.user.id,
      },
      
      // Business reports
      {
        title: 'Business Basic Report',
        description: 'Basic report of all businesses with essential information',
        reportType: 'business_basic',
        isTemplate: true,
        columns: ['id', 'businessName', 'district', 'businessContact', 'businessModel', 'registrationStatus'],
        createdBy: req.user.id,
      },
      {
        title: 'Business Detailed Report',
        description: 'Comprehensive report of businesses with all available information',
        reportType: 'business_detailed',
        isTemplate: true,
        createdBy: req.user.id,
      },
      
      // Mentor reports
      {
        title: 'Mentor Basic Report',
        description: 'Basic report of all mentors with essential information',
        reportType: 'mentor_basic',
        isTemplate: true,
        columns: ['id', 'name', 'phone', 'email', 'assignedDistrict', 'specialization'],
        createdBy: req.user.id,
      },
      {
        title: 'Mentor Detailed Report',
        description: 'Comprehensive report of mentors with all available information',
        reportType: 'mentor_detailed',
        isTemplate: true,
        createdBy: req.user.id,
      },
      
      // Makerspace reports
      {
        title: 'Makerspace Basic Report',
        description: 'Basic report of all makerspaces with essential information',
        reportType: 'makerspace_basic',
        isTemplate: true,
        columns: ['id', 'name', 'district', 'address', 'contactPerson', 'contactPhone', 'memberCount'],
        createdBy: req.user.id,
      },
      {
        title: 'Makerspace Detailed Report',
        description: 'Comprehensive report of makerspaces with all available information',
        reportType: 'makerspace_detailed',
        isTemplate: true,
        createdBy: req.user.id,
      },
      
      // Training reports
      {
        title: 'Training Programs Report',
        description: 'Report of all training programs',
        reportType: 'training_basic',
        isTemplate: true,
        createdBy: req.user.id,
      },
    ];
    
    // Check if templates already exist
    const existingTemplates = await db.select({ count: reportRuns.id })
      .from(reports)
      .where(eq(reports.isTemplate, true));
      
    if (existingTemplates.length > 0 && existingTemplates[0].count > 0) {
      return res.status(400).json({ 
        message: 'Template reports already exist',
        count: existingTemplates[0].count
      });
    }
    
    // Insert the templates
    const inserted = await db.insert(reports)
      .values(templateReports.map(template => ({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      })))
      .returning();
      
    res.status(201).json({
      message: 'Template reports created successfully',
      templates: inserted
    });
  } catch (error) {
    console.error('Error creating template reports:', error);
    res.status(500).json({ message: 'Failed to create template reports', error: error.message });
  }
});

export default router;