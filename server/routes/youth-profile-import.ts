import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { db } from '../db';
import { youthProfiles, users } from '@shared/schema';
import ExcelJS from 'exceljs';
import { sql, count } from 'drizzle-orm';

const router = Router();

// Add CORS preflight handler for all routes in this router
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.status(204).end();
});

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only CSV and Excel files
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Generate CSV template for youth profiles
router.get('/template', async (req, res) => {
  try {
    // Enable CORS for this route
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Create a CSV template with headers and sample data
    const headers = [
      'participantCode',
      'fullName',
      'phoneNumber',
      'gender',
      'age',
      'yearOfBirth',
      'district',
      'town',
      'businessInterest',
      'employmentStatus',
      'pwdStatus',
      'maritalStatus',
      'childrenCount',
      'guarantorName',
      'guarantorPhone',
      'nationalId'
    ];
    
    // Sample data for the template
    const sampleData = [
      'D00000001',
      'John Doe',
      '233123456789',
      'Male',
      '25',
      '2000',
      'Bekwai',
      'Bekwai Central',
      'Retail',
      'Self-employed',
      'No',
      'Single',
      '0',
      'Jane Doe',
      '233987654321',
      'GHA-123456789'
    ];
    
    // Generate the CSV content
    let csvContent = headers.join(',') + '\n';
    csvContent += sampleData.join(',') + '\n';
    
    // Set appropriate headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=youth-profiles-template.csv');
    
    // Send the CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating youth profile template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate youth profile template',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Process and import youth profiles from uploaded file
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    // Enable CORS for this route
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Only admins can import profiles
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins can import profiles'
      });
    }
    
    const fileData = req.file.buffer;
    const fileType = req.file.mimetype;
    
    // Parse the file based on its type
    let profilesData: any[] = [];
    
    if (fileType === 'text/csv') {
      // Parse CSV file
      const results: any[] = [];
      const stream = Readable.from(fileData);
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (data: any) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error: any) => reject(error));
      });
      
      profilesData = results;
    } else {
      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileData);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }
      
      // Extract headers from the first row
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value).trim());
      });
      
      // Extract data from remaining rows
      const results: any[] = [];
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // Skip header row
        
        const rowData: Record<string, any> = {};
        row.eachCell((cell, colIndex) => {
          if (colIndex <= headers.length) {
            rowData[headers[colIndex - 1]] = cell.value;
          }
        });
        
        results.push(rowData);
      });
      
      profilesData = results;
    }
    
    // Validate required fields
    const validProfiles = profilesData.filter(profile => {
      return profile.fullName && 
             profile.district && 
             ['Bekwai', 'Gushegu', 'Lower Manya Krobo', 'Yilo Krobo'].includes(profile.district);
    });
    
    // Insert profiles into the database
    const createdProfiles = [];
    for (const profile of validProfiles) {
      try {
        // Generate a username from the participant code or full name
        const username = profile.participantCode || 
          `user_${profile.fullName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`;
        
        // Create a user record first (required for foreign key constraint)
        const [newUser] = await db.insert(users).values({
          username: username,
          password: '$2b$10$NDD.pujANXP4GaPpOcwGWuQ3BZLjFx4zYv8A7RxgH1X19k21M3Ln6', // Default password: 'password123'
          role: 'mentee' as const,
          fullName: profile.fullName,
          district: profile.district as any, // Cast to satisfy type system
          createdAt: new Date(),
          updatedAt: new Date(),
          email: null
        }).returning();
        
        // Map the data to match schema with the new user ID
        const youthProfile = {
          fullName: profile.fullName,
          participantCode: profile.participantCode || null,
          phoneNumber: profile.phoneNumber || profile.phone || null,
          gender: profile.gender || null,
          age: profile.age ? Number(profile.age) : null,
          yearOfBirth: profile.yearOfBirth ? Number(profile.yearOfBirth) : null,
          district: profile.district,
          town: profile.town || null,
          businessInterest: profile.businessInterest || null,
          employmentStatus: profile.employmentStatus || null,
          pwdStatus: profile.pwdStatus || null,
          maritalStatus: profile.maritalStatus || null,
          childrenCount: profile.childrenCount ? Number(profile.childrenCount) : null,
          guarantorName: profile.guarantorName || profile.guarantor || null,
          guarantorPhone: profile.guarantorPhone || null,
          nationalId: profile.nationalId || null,
          userId: newUser.id, // Use the newly created user's ID
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: req.user.id
        };
        
        // Insert the youth profile with the linked user ID
        const [result] = await db.insert(youthProfiles).values([youthProfile]).returning();
        createdProfiles.push(result);
      } catch (error) {
        console.error(`Error processing profile for ${profile.fullName}:`, error);
        // Continue with next profile even if one fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${createdProfiles.length} youth profiles`,
      total: profilesData.length,
      imported: createdProfiles.length,
      skipped: profilesData.length - createdProfiles.length
    });
  } catch (error) {
    console.error('Error importing youth profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import youth profiles',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Truncate the youth profiles table
router.post('/truncate', async (req, res) => {
  try {
    // Enable CORS for this route
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Only admins can truncate the table
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins can clear youth profile data'
      });
    }
    
    // Delete all records from the youth profiles table
    await db.delete(youthProfiles);
    
    // Get count of deleted profiles (will be 0 after deletion)
    const profileCount = 0;
    
    return res.status(200).json({
      success: true,
      message: `Successfully cleared ${profileCount} youth profiles`,
      count: profileCount
    });
  } catch (error) {
    console.error('Error truncating youth profiles table:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear youth profile data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;