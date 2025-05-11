import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../../db';
import makerspaceAssignments from './makerspace-assignments';
import { 
  businessMakerspaceAssignments, 
  makerspaces,
  businessProfiles
} from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Register base makerspaces route first
router.get('/makerspaces', async (req: Request, res: Response) => {
  try {
    console.log('GET /api/business-management/makerspaces requested');
    res.setHeader('Content-Type', 'application/json');
    
    const allMakerspaces = await db.select().from(makerspaces);
    console.log(`Found ${allMakerspaces.length} makerspaces`);
    
    return res.status(200).json(allMakerspaces);
  } catch (error) {
    console.error('Error fetching makerspaces:', error);
    return res.status(500).json({ message: 'Failed to fetch makerspaces' });
  }
});

// Add route for fetching business profiles (for dropdown list)
router.get('/businesses', async (req: Request, res: Response) => {
  try {
    console.log('GET /api/business-management/businesses requested');
    res.setHeader('Content-Type', 'application/json');
    
    const allBusinesses = await db.select().from(businessProfiles);
    console.log(`Found ${allBusinesses.length} businesses`);
    
    return res.status(200).json(allBusinesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return res.status(500).json({ message: 'Failed to fetch businesses' });
  }
});

// Register all other business management routes
router.use(makerspaceAssignments);

export default router;