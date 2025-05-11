import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    const subcategories = await db.select()
    .from(schema.serviceSubcategories)
    .leftJoin(
      schema.serviceCategories, 
      eq(schema.serviceSubcategories.categoryId, schema.serviceCategories.id)
    )
    .orderBy(schema.serviceCategories.name, schema.serviceSubcategories.name);
    
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching service subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch service subcategories' });
  }
});

// Get subcategories for a specific category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    
    const subcategories = await db.select()
      .from(schema.serviceSubcategories)
      .where(eq(schema.serviceSubcategories.categoryId, categoryId))
      .orderBy(schema.serviceSubcategories.name);
    
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories for category:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Get subcategory by ID
router.get('/:id', async (req, res) => {
  try {
    const subcategoryId = parseInt(req.params.id);
    
    const [subcategory] = await db.select()
    .from(schema.serviceSubcategories)
    .leftJoin(
      schema.serviceCategories, 
      eq(schema.serviceSubcategories.categoryId, schema.serviceCategories.id)
    )
    .where(eq(schema.serviceSubcategories.id, subcategoryId));
    
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
});

// Create a new subcategory
router.post('/', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create subcategories' });
    }
    
    const validationResult = schema.insertServiceSubcategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    // Validate that the category exists
    const categoryId = validationResult.data.categoryId;
    const [category] = await db.select()
      .from(schema.serviceCategories)
      .where(eq(schema.serviceCategories.id, categoryId));
      
    if (!category) {
      return res.status(400).json({ error: 'Parent category does not exist' });
    }
    
    const [subcategory] = await db.insert(schema.serviceSubcategories).values({
      ...validationResult.data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    res.status(201).json(subcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

// Update a subcategory
router.put('/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update subcategories' });
    }
    
    const subcategoryId = parseInt(req.params.id);
    const validationResult = schema.insertServiceSubcategorySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    // Validate that the category exists
    const categoryId = validationResult.data.categoryId;
    const [category] = await db.select()
      .from(schema.serviceCategories)
      .where(eq(schema.serviceCategories.id, categoryId));
      
    if (!category) {
      return res.status(400).json({ error: 'Parent category does not exist' });
    }
    
    const [updatedSubcategory] = await db.update(schema.serviceSubcategories)
      .set({
        ...validationResult.data,
        updatedAt: new Date()
      })
      .where(eq(schema.serviceSubcategories.id, subcategoryId))
      .returning();
    
    if (!updatedSubcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(updatedSubcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

// Delete a subcategory
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete subcategories' });
    }
    
    const subcategoryId = parseInt(req.params.id);
    
    // Check if subcategory is in use by businesses
    const businesses = await db.select({ id: schema.businessProfiles.id })
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.serviceSubcategoryId, subcategoryId))
      .limit(1);
    
    if (businesses.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory that is in use by businesses'
      });
    }
    
    const [deletedSubcategory] = await db.delete(schema.serviceSubcategories)
      .where(eq(schema.serviceSubcategories.id, subcategoryId))
      .returning();
    
    if (!deletedSubcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

export default router;