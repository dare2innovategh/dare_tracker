import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importYouthProfilesFromTSV } from '../import-youth-tsv';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'youth-profiles-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only TSV and TXT files
    const filetypes = /tsv|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only TSV or TXT files are allowed'));
  }
});

/**
 * @route POST /api/youth-profiles-tsv-import
 * @desc Import youth profiles from TSV file
 * @access Private (Admin only)
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      // Clean up uploaded file if it exists
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'Unauthorized, only admins can import youth profiles' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine if we should clear existing profiles before import
    const shouldClearExisting = req.body.clearExisting === 'true';
    
    // Call the import function
    const result = await importYouthProfilesFromTSV({ 
      filePath: req.file.path,
      clearExisting: shouldClearExisting
    });
    
    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({ 
      message: 'Youth profiles import from TSV completed',
      imported: result.importedCount,
      skipped: result.skippedCount
    });
  } catch (error) {
    console.error('Error during youth profiles TSV import:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to import youth profiles from TSV',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/youth-profiles-tsv-import/data
 * @desc Import youth profiles from TSV data in request body
 * @access Private (Admin only)
 */
router.post('/data', async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized, only admins can import youth profiles' });
    }

    // Check if TSV data is provided
    if (!req.body.data) {
      return res.status(400).json({ error: 'No TSV data provided' });
    }

    // Create a temporary file for the TSV data
    const tempFilePath = path.join(__dirname, '../../uploads', `youth-profiles-${Date.now()}.tsv`);
    fs.writeFileSync(tempFilePath, req.body.data);

    // Determine if we should clear existing profiles before import
    const shouldClearExisting = req.body.clearExisting === true;
    
    // Call the import function
    const result = await importYouthProfilesFromTSV({ 
      filePath: tempFilePath,
      clearExisting: shouldClearExisting
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    res.status(200).json({ 
      message: 'Youth profiles import from TSV data completed',
      imported: result.importedCount,
      skipped: result.skippedCount
    });
  } catch (error) {
    console.error('Error during youth profiles TSV data import:', error);
    res.status(500).json({ 
      error: 'Failed to import youth profiles from TSV data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;