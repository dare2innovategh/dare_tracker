import express from 'express';
import { db } from '../db';
import { youthProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Endpoint to diagnose and log field values
router.get('/field-values/:profileId', async (req, res, next) => {
  try {
    const profileId = parseInt(req.params.profileId, 10);
    if (isNaN(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }
    
    // Get the profile directly from the database
    const profile = await db.query.youthProfiles.findFirst({
      where: eq(youthProfiles.id, profileId)
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Create a diagnostic report
    const diagnosticReport = {
      message: 'Field value diagnostic report',
      profileId,
      fieldValues: {
        guarantor: {
          value: profile.guarantor,
          type: profile.guarantor === null ? 'null' : 
                profile.guarantor === '' ? 'empty string' : 
                profile.guarantor === undefined ? 'undefined' : 'string',
          length: profile.guarantor ? profile.guarantor.length : 0
        },
        guarantorPhone: {
          value: profile.guarantorPhone,
          type: profile.guarantorPhone === null ? 'null' : 
                profile.guarantorPhone === '' ? 'empty string' : 
                profile.guarantorPhone === undefined ? 'undefined' : 'string',
          length: profile.guarantorPhone ? profile.guarantorPhone.length : 0
        },
        // Add additional fields here as needed
      },
      // Include raw database values
      raw: {
        guarantor: profile.guarantor,
        guarantorPhone: profile.guarantorPhone
      }
    };
    
    // Log to console
    console.log('DIAGNOSTIC REPORT:', JSON.stringify(diagnosticReport, null, 2));
    
    // Return report to client
    res.json(diagnosticReport);
  } catch (error) {
    next(error);
  }
});

// Helper endpoint to update a specific field for testing
router.post('/update-field/:profileId', async (req, res, next) => {
  try {
    const profileId = parseInt(req.params.profileId, 10);
    if (isNaN(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }
    
    const { field, value } = req.body;
    
    if (!field) {
      return res.status(400).json({ message: 'Field name is required' });
    }
    
    // Log before update
    console.log(`DIAGNOSTIC: Updating field "${field}" for profile ${profileId} to:`, value);
    console.log(`DIAGNOSTIC: Value type: ${value === null ? 'null' : value === '' ? 'empty string' : typeof value}`);
    
    // Create update object
    const updateData: any = {};
    updateData[field] = value;
    
    // Update the profile
    const [updatedProfile] = await db
      .update(youthProfiles)
      .set(updateData)
      .where(eq(youthProfiles.id, profileId))
      .returning();
    
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found or update failed' });
    }
    
    // Log after update
    console.log(`DIAGNOSTIC: Field "${field}" updated successfully for profile ${profileId}`);
    console.log(`DIAGNOSTIC: New value:`, updatedProfile[field as keyof typeof updatedProfile]);
    
    res.json({
      message: `Field "${field}" updated successfully`,
      profileId,
      field,
      newValue: updatedProfile[field as keyof typeof updatedProfile]
    });
  } catch (error) {
    console.error('Error in diagnostic update:', error);
    next(error);
  }
});

export default router;