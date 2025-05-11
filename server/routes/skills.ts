import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq, sql, desc, and, ilike } from 'drizzle-orm';

const router = Router();

// Get all skills with their category and subcategory information
router.get('/', async (req, res) => {
  try {
    const { search, categoryId, active } = req.query;
    
    let query = db.select({
      skill: schema.skills,
      category: schema.serviceCategories,
      subcategory: schema.serviceSubcategories
    })
    .from(schema.skills)
    .leftJoin(schema.serviceCategories, eq(schema.skills.categoryId, schema.serviceCategories.id))
    .leftJoin(schema.serviceSubcategories, eq(schema.skills.subcategoryId, schema.serviceSubcategories.id))
    .orderBy(schema.skills.name);
    
    // Build conditions array
    const conditions = [];
    
    // Apply filters if provided
    if (search) {
      conditions.push(ilike(schema.skills.name, `%${search}%`));
    }
    
    if (categoryId) {
      conditions.push(eq(schema.skills.categoryId, Number(categoryId)));
    }
    
    if (active !== undefined) {
      const isActive = active === 'true';
      conditions.push(eq(schema.skills.isActive, isActive));
    }
    
    // Apply all conditions if any
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    const results = await query;
    
    // Transform results to a more friendly format
    const skills = results.map(result => ({
      ...result.skill,
      category: result.category,
      subcategory: result.subcategory
    }));
    
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Get a specific skill by ID with its category and subcategory
router.get('/:id', async (req, res) => {
  try {
    const skillId = parseInt(req.params.id);
    
    const result = await db.select({
      skill: schema.skills,
      category: schema.serviceCategories,
      subcategory: schema.serviceSubcategories
    })
    .from(schema.skills)
    .leftJoin(schema.serviceCategories, eq(schema.skills.categoryId, schema.serviceCategories.id))
    .leftJoin(schema.serviceSubcategories, eq(schema.skills.subcategoryId, schema.serviceSubcategories.id))
    .where(eq(schema.skills.id, skillId))
    .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const skill = {
      ...result[0].skill,
      category: result[0].category,
      subcategory: result[0].subcategory
    };
    
    res.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

// Create a new skill
router.post('/', async (req, res) => {
  try {
    const skillData = schema.insertSkillSchema.parse(req.body);
    
    const [skill] = await db.insert(schema.skills)
      .values({
        ...skillData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(skill);
  } catch (error: any) {
    console.error('Error creating skill:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid skill data', details: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// Update a skill
router.put('/:id', async (req, res) => {
  try {
    const skillId = parseInt(req.params.id);
    const skillData = schema.insertSkillSchema.parse(req.body);
    
    const [updatedSkill] = await db.update(schema.skills)
      .set({
        ...skillData,
        updatedAt: new Date()
      })
      .where(eq(schema.skills.id, skillId))
      .returning();
    
    if (!updatedSkill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json(updatedSkill);
  } catch (error: any) {
    console.error('Error updating skill:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid skill data', details: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// Delete a skill (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const skillId = parseInt(req.params.id);
    
    // First check if this skill is being used by any youth
    const youthSkillCount = await db.select({ count: sql<number>`count(*)` })
      .from(schema.youthSkills)
      .where(eq(schema.youthSkills.skillId, skillId));
    
    if (youthSkillCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete skill that is being used by youth profiles',
        count: youthSkillCount[0].count
      });
    }
    
    // Soft delete by setting isActive to false
    const [updatedSkill] = await db.update(schema.skills)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.skills.id, skillId))
      .returning();
    
    if (!updatedSkill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill deleted successfully', skill: updatedSkill });
  } catch (error: any) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;