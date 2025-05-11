import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all service categories with their subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await db.select().from(schema.serviceCategories).orderBy(schema.serviceCategories.name);
    
    // Get all subcategories
    const subcategories = await db.select().from(schema.serviceSubcategories);
    
    // Group subcategories by category
    const categoriesWithSubcategories = categories.map(category => {
      const categorySubcategories = subcategories.filter(s => s.categoryId === category.id);
      return {
        ...category,
        subcategories: categorySubcategories
      };
    });
    
    res.json(categoriesWithSubcategories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// Get a specific service category by ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const [category] = await db.select().from(schema.serviceCategories).where(eq(schema.serviceCategories.id, categoryId));
    
    if (!category) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    // Get subcategories for this category
    const subcategories = await db.select().from(schema.serviceSubcategories)
      .where(eq(schema.serviceSubcategories.categoryId, categoryId));
    
    res.json({
      ...category,
      subcategories
    });
  } catch (error) {
    console.error('Error fetching service category:', error);
    res.status(500).json({ error: 'Failed to fetch service category' });
  }
});

// Create a new service category
router.post('/', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create service categories' });
    }
    
    const validationResult = schema.insertServiceCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    const [category] = await db.insert(schema.serviceCategories).values({
      ...validationResult.data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating service category:', error);
    res.status(500).json({ error: 'Failed to create service category' });
  }
});

// Update a service category
router.put('/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update service categories' });
    }
    
    const categoryId = parseInt(req.params.id);
    const validationResult = schema.insertServiceCategorySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    const [updatedCategory] = await db.update(schema.serviceCategories)
      .set({
        ...validationResult.data,
        updatedAt: new Date()
      })
      .where(eq(schema.serviceCategories.id, categoryId))
      .returning();
    
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating service category:', error);
    res.status(500).json({ error: 'Failed to update service category' });
  }
});

// Delete a service category
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete service categories' });
    }
    
    const categoryId = parseInt(req.params.id);
    
    // Check if category is in use by businesses
    const businesses = await db.select({ id: schema.businessProfiles.id })
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.serviceCategoryId, categoryId))
      .limit(1);
    
    if (businesses.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is in use by businesses'
      });
    }
    
    // First delete all subcategories
    await db.delete(schema.serviceSubcategories)
      .where(eq(schema.serviceSubcategories.categoryId, categoryId));
    
    // Then delete the category
    const [deletedCategory] = await db.delete(schema.serviceCategories)
      .where(eq(schema.serviceCategories.id, categoryId))
      .returning();
    
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    res.json({ message: 'Service category deleted successfully' });
  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({ error: 'Failed to delete service category' });
  }
});

export default router;