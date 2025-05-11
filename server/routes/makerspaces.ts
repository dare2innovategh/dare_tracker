import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { insertMakerspaceSchema } from '@shared/schema';

const router = Router();

// Get all makerspaces
router.get('/', async (req, res) => {
  try {
    // Use raw SQL to avoid schema mismatches
    const result = await db.execute(sql`SELECT * FROM makerspaces ORDER BY name`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching makerspaces:', error);
    res.status(500).json({ error: 'Failed to fetch makerspaces' });
  }
});

// Get makerspace by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid makerspace ID' });
    }

    const result = await db.execute(
      sql`SELECT * FROM makerspaces WHERE id = ${id}`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Makerspace not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching makerspace:', error);
    res.status(500).json({ error: 'Failed to fetch makerspace' });
  }
});

// Get makerspaces by district
router.get('/district/:district', async (req, res) => {
  try {
    const district = req.params.district;
    const result = await db.execute(
      sql`SELECT * FROM makerspaces WHERE district = ${district} ORDER BY name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching district makerspaces:', error);
    res.status(500).json({ error: 'Failed to fetch district makerspaces' });
  }
});

// Create a new makerspace
router.post('/', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Prepare the data
    const data = {
      ...req.body,
      // If openDate exists and is a valid string, convert it to a Date object
      openDate: req.body.openDate ? new Date(req.body.openDate) : null,
      // Handle empty email strings
      contactEmail: req.body.contactEmail === "" ? null : req.body.contactEmail
    };

    // Validate the data
    const validatedData = insertMakerspaceSchema.parse(data);
    
    // Format the date for SQL
    const openDateStr = validatedData.openDate ? validatedData.openDate.toISOString() : null;

    // Use raw SQL to insert the data with columns that match the actual database
    const result = await db.execute(
      sql`INSERT INTO makerspaces (
        name, 
        location, 
        district, 
        manager_id, 
        contact_person, 
        contact_phone, 
        contact_email, 
        description, 
        facilities, 
        operational_status, 
        opening_hours, 
        capacity, 
        image_url, 
        created_at, 
        updated_at, 
        address, 
        coordinates, 
        operating_hours, 
        open_date, 
        resource_count, 
        member_count, 
        status
      ) VALUES (
        ${validatedData.name}, 
        ${validatedData.location || null}, 
        ${validatedData.district}, 
        ${validatedData.managerId || null}, 
        ${validatedData.contactPerson || null}, 
        ${validatedData.contactPhone || null}, 
        ${validatedData.contactEmail || null}, 
        ${validatedData.description || null}, 
        ${validatedData.facilities || null}, 
        ${validatedData.operationalStatus || null}, 
        ${validatedData.openingHours || null}, 
        ${validatedData.capacity || null}, 
        ${validatedData.imageUrl || null}, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP, 
        ${validatedData.address || null}, 
        ${validatedData.coordinates || null}, 
        ${validatedData.operatingHours || null},
        ${openDateStr},
        0,
        0,
        'Active'
      ) RETURNING *`
    );
    
    const newMakerspace = result.rows[0];
    res.status(201).json(newMakerspace);
  } catch (error) {
    console.error('Error creating makerspace:', error);
    res.status(500).json({ error: 'Failed to create makerspace' });
  }
});

// Update a makerspace
router.patch('/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid makerspace ID' });
    }

    // Check if makerspace exists
    const checkResult = await db.execute(
      sql`SELECT id FROM makerspaces WHERE id = ${id}`
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Makerspace not found' });
    }

    // Prepare the data
    const data = {
      ...req.body,
      openDate: req.body.openDate ? new Date(req.body.openDate) : null,
      contactEmail: req.body.contactEmail === "" ? null : req.body.contactEmail
    };

    // Validate the data
    const validatedData = insertMakerspaceSchema.parse(data);
    
    // Format the date for SQL
    const openDateStr = validatedData.openDate ? validatedData.openDate.toISOString() : null;

    // Build update SQL using the correct column names
    const updateResult = await db.execute(
      sql`UPDATE makerspaces SET
        name = ${validatedData.name},
        location = ${validatedData.location || null},
        district = ${validatedData.district},
        manager_id = ${validatedData.managerId || null},
        contact_person = ${validatedData.contactPerson || null},
        contact_phone = ${validatedData.contactPhone || null},
        contact_email = ${validatedData.contactEmail || null},
        description = ${validatedData.description || null},
        facilities = ${validatedData.facilities || null},
        operational_status = ${validatedData.operationalStatus || null},
        opening_hours = ${validatedData.openingHours || null},
        capacity = ${validatedData.capacity || null},
        image_url = ${validatedData.imageUrl || null},
        address = ${validatedData.address || null},
        coordinates = ${validatedData.coordinates || null},
        operating_hours = ${validatedData.operatingHours || null},
        open_date = ${openDateStr},
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *`
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating makerspace:', error);
    res.status(500).json({ error: 'Failed to update makerspace' });
  }
});

// Delete a makerspace
router.delete('/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized, only admins can delete makerspaces' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid makerspace ID' });
    }

    await db.execute(sql`DELETE FROM makerspaces WHERE id = ${id}`);
    
    res.status(200).json({ message: 'Makerspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting makerspace:', error);
    res.status(500).json({ error: 'Failed to delete makerspace' });
  }
});

export default router;