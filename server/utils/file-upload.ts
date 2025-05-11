import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const profilePicturesDir = path.join(uploadDir, 'profile-pictures');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

// Define the storage configuration for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, profilePicturesDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter to only allow image files
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if the file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Configure multer for profile picture uploads
export const profilePictureUpload = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Helper function to get the URL for a profile picture
export function getProfilePictureUrl(filename: string): string {
  if (!filename) return '';
  return `/uploads/profile-pictures/${filename}`;
}

// Helper function to delete a profile picture
export function deleteProfilePicture(filename: string): boolean {
  if (!filename) return false;
  
  const filePath = path.join(profilePicturesDir, path.basename(filename));
  
  try {
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
}