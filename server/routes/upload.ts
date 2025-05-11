import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Create uploads directory structure if it doesn't exist
const uploadBaseDir = path.join(process.cwd(), 'public/uploads');
const profilesDir = path.join(uploadBaseDir, 'profiles');
const businessDir = path.join(uploadBaseDir, 'business'); // Add business directory

// Create directories recursively
[uploadBaseDir, profilesDir, businessDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure storage to disk with unique filenames
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Determine the destination directory based on the route
    const uploadType = req.path.includes('business-logo') ? 'business' : 'profiles';
    const destinationDir = uploadType === 'business' ? businessDir : profilesDir;
    
    console.log(`Setting destination directory to: ${destinationDir}`);
    cb(null, destinationDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename with original extension
    const originalExt = path.extname(file.originalname) || '.jpg';
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${originalExt}`;
    console.log(`Generated filename: ${uniqueFilename} for ${file.originalname}`);
    cb(null, uniqueFilename);
  }
});

// Set up multer with disk storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.log(`Rejected file: ${file.originalname} - not an image`);
      return cb(new Error('Only image files are allowed'), false);
    }
    console.log(`Accepted file: ${file.originalname}`);
    cb(null, true);
  }
});

// Handle profile picture uploads
router.post('/profile-picture', (req: Request, res: Response) => {
  console.log('Profile picture upload request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  // Use multer middleware with error handling
  upload.single('file')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false, 
        message: err.message
      });
    }
    
    console.log('File processed by multer');
    console.log('req.file:', req.file);
    
    if (!req.file) {
      console.error('No file received in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // File uploaded successfully
    const fileUrl = `/uploads/profiles/${req.file.filename}`;
    console.log(`File saved with name: ${req.file.filename}`);
    console.log(`Generated URL: ${fileUrl}`);
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

// Handle business logo uploads
router.post('/business-logo', (req: Request, res: Response) => {
  console.log('Business logo upload request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  // Use multer middleware with error handling
  upload.single('file')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false, 
        message: err.message
      });
    }
    
    console.log('File processed by multer');
    console.log('req.file:', req.file);
    
    if (!req.file) {
      console.error('No file received in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // File uploaded successfully
    const fileUrl = `/uploads/business/${req.file.filename}`;
    console.log(`File saved with name: ${req.file.filename}`);
    console.log(`Generated URL: ${fileUrl}`);
    
    return res.status(200).json({
      success: true,
      message: 'Business logo uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

export default router;