import express from 'express';
import { importYouthProfiles } from '../import-excel-youth-profiles';

const router = express.Router();

/**
 * @route POST /api/youth-profiles-import
 * @desc Import youth profiles from Excel file
 * @access Private (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized, only admins can import youth profiles' });
    }

    // Determine if we should clear existing profiles before import
    const shouldClearExisting = req.body.clearExisting === true;
    
    // Call the import function
    const result = await importYouthProfiles({ clearExisting: shouldClearExisting });
    
    res.status(200).json({ 
      message: 'Youth profiles import completed',
      imported: result.importedCount,
      skipped: result.skippedCount
    });
  } catch (error) {
    console.error('Error during youth profiles import:', error);
    res.status(500).json({ 
      error: 'Failed to import youth profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;