import { Router } from "express";
import { db } from "../db";
import { youthSkills, skills } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Schema for adding/updating youth skills
const youthSkillSchema = z.object({
  youthId: z.number(),
  skillId: z.number(),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate"),
  isPrimary: z.boolean().default(false),
  yearsOfExperience: z.number().min(0).default(0),
  notes: z.string().optional()
});

// Schema for batch operations with more lenient validation
// This will accept the format sent from the frontend
const batchYouthSkillsSchema = z.array(z.object({
  id: z.number(), // skill id 
  youthId: z.number().optional(), // will be set from URL param
  skillId: z.number().optional(), // Optional as we'll use id
  name: z.string().optional(), // For display, not stored
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate"),
  isPrimary: z.boolean().default(false),
  yearsOfExperience: z.number().min(0).default(0),
  notes: z.string().optional()
}));

// Get all skills for a youth profile with full skill details
router.get("/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    // Join youth_skills and skills to get complete information
    const results = await db
      .select({
        youthId: youthSkills.youthId,
        skillId: skills.id,
        name: skills.name,
        description: skills.description,
        categoryId: skills.categoryId,
        subcategoryId: skills.subcategoryId,
        proficiency: youthSkills.proficiency,
        isPrimary: youthSkills.isPrimary,
        yearsOfExperience: youthSkills.yearsOfExperience,
        notes: youthSkills.notes
      })
      .from(youthSkills)
      .innerJoin(skills, eq(youthSkills.skillId, skills.id))
      .where(eq(youthSkills.youthId, youthId));

    res.json(results);
  } catch (error) {
    console.error("Error fetching youth skills:", error);
    res.status(500).json({ message: "Failed to fetch youth skills" });
  }
});

// Add a skill to a youth profile
router.post("/", async (req, res) => {
  try {
    const parsedBody = youthSkillSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid youth skill data", 
        errors: parsedBody.error.format() 
      });
    }

    const data = parsedBody.data;

    // Check if skill exists
    const skillExists = await db
      .select()
      .from(skills)
      .where(eq(skills.id, data.skillId))
      .limit(1);

    if (skillExists.length === 0) {
      return res.status(404).json({ message: "Skill not found" });
    }

    // If setting as primary, update other skills to not be primary
    if (data.isPrimary) {
      await db
        .update(youthSkills)
        .set({ isPrimary: false })
        .where(eq(youthSkills.youthId, data.youthId));
    }

    // Check if this youth already has this skill
    const existingSkill = await db
      .select()
      .from(youthSkills)
      .where(
        and(
          eq(youthSkills.youthId, data.youthId),
          eq(youthSkills.skillId, data.skillId)
        )
      )
      .limit(1);

    if (existingSkill.length > 0) {
      // Update existing skill relationship
      await db
        .update(youthSkills)
        .set({
          proficiency: data.proficiency,
          isPrimary: data.isPrimary,
          yearsOfExperience: data.yearsOfExperience,
          notes: data.notes
        })
        .where(
          and(
            eq(youthSkills.youthId, data.youthId),
            eq(youthSkills.skillId, data.skillId)
          )
        );
    } else {
      // Create new skill relationship
      await db.insert(youthSkills).values(data);
    }

    // Get the updated skill with full details
    const [result] = await db
      .select({
        youthId: youthSkills.youthId,
        skillId: skills.id,
        name: skills.name,
        description: skills.description,
        categoryId: skills.categoryId,
        subcategoryId: skills.subcategoryId,
        proficiency: youthSkills.proficiency,
        isPrimary: youthSkills.isPrimary,
        yearsOfExperience: youthSkills.yearsOfExperience,
        notes: youthSkills.notes
      })
      .from(youthSkills)
      .innerJoin(skills, eq(youthSkills.skillId, skills.id))
      .where(
        and(
          eq(youthSkills.youthId, data.youthId),
          eq(youthSkills.skillId, data.skillId)
        )
      );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding youth skill:", error);
    res.status(500).json({ message: "Failed to add youth skill" });
  }
});

// Update a youth skill
router.put("/:youthId/:skillId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(youthId) || isNaN(skillId)) {
      return res.status(400).json({ message: "Invalid youth ID or skill ID" });
    }

    // Only allow updating certain fields, not the keys
    const updateSchema = z.object({
      proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
      isPrimary: z.boolean().optional(),
      yearsOfExperience: z.number().min(0).optional(),
      notes: z.string().optional()
    });

    const parsedBody = updateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid youth skill data", 
        errors: parsedBody.error.format() 
      });
    }

    const data = parsedBody.data;

    // If setting as primary, update other skills to not be primary
    if (data.isPrimary) {
      await db
        .update(youthSkills)
        .set({ isPrimary: false })
        .where(eq(youthSkills.youthId, youthId));
    }

    // Update the youth skill
    await db
      .update(youthSkills)
      .set(data)
      .where(
        and(
          eq(youthSkills.youthId, youthId),
          eq(youthSkills.skillId, skillId)
        )
      );

    // Get the updated skill with full details
    const [result] = await db
      .select({
        youthId: youthSkills.youthId,
        skillId: skills.id,
        name: skills.name,
        description: skills.description,
        categoryId: skills.categoryId,
        subcategoryId: skills.subcategoryId,
        proficiency: youthSkills.proficiency,
        isPrimary: youthSkills.isPrimary,
        yearsOfExperience: youthSkills.yearsOfExperience,
        notes: youthSkills.notes
      })
      .from(youthSkills)
      .innerJoin(skills, eq(youthSkills.skillId, skills.id))
      .where(
        and(
          eq(youthSkills.youthId, youthId),
          eq(youthSkills.skillId, skillId)
        )
      );

    if (!result) {
      return res.status(404).json({ message: "Youth skill not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error updating youth skill:", error);
    res.status(500).json({ message: "Failed to update youth skill" });
  }
});

// Remove a skill from a youth profile
router.delete("/:youthId/:skillId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(youthId) || isNaN(skillId)) {
      return res.status(400).json({ message: "Invalid youth ID or skill ID" });
    }

    await db
      .delete(youthSkills)
      .where(
        and(
          eq(youthSkills.youthId, youthId),
          eq(youthSkills.skillId, skillId)
        )
      );

    res.json({ message: "Youth skill removed successfully" });
  } catch (error) {
    console.error("Error removing youth skill:", error);
    res.status(500).json({ message: "Failed to remove youth skill" });
  }
});

// Batch update youth skills
router.post("/:youthId/batch", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const parsedBody = batchYouthSkillsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid youth skills data", 
        errors: parsedBody.error.format() 
      });
    }

    // Process skills data from frontend format to database format
    const skillsDataForDb = parsedBody.data.map(skill => ({
      youthId: youthId,
      skillId: skill.id, // Use the id field as skillId
      proficiency: skill.proficiency || "Intermediate",
      isPrimary: skill.isPrimary || false,
      yearsOfExperience: skill.yearsOfExperience || 0,
      notes: skill.notes || null
    }));

    // Ensure only one skill is primary
    const primarySkills = skillsDataForDb.filter(skill => skill.isPrimary);
    if (primarySkills.length > 1) {
      // Keep only the first primary skill
      for (let i = 1; i < primarySkills.length; i++) {
        skillsDataForDb[skillsDataForDb.indexOf(primarySkills[i])].isPrimary = false;
      }
    }

    console.log("Processing batch skills update:", { 
      youthId, 
      skillCount: skillsDataForDb.length,
      skillsData: skillsDataForDb 
    });

    // Delete all existing skills for this youth
    await db
      .delete(youthSkills)
      .where(eq(youthSkills.youthId, youthId));

    // Insert new skills if any
    if (skillsDataForDb.length > 0) {
      await db.insert(youthSkills).values(skillsDataForDb);
    }

    // Get all updated skills with full details
    const results = await db
      .select({
        youthId: youthSkills.youthId,
        skillId: skills.id,
        name: skills.name,
        description: skills.description,
        categoryId: skills.categoryId,
        subcategoryId: skills.subcategoryId,
        proficiency: youthSkills.proficiency,
        isPrimary: youthSkills.isPrimary,
        yearsOfExperience: youthSkills.yearsOfExperience,
        notes: youthSkills.notes
      })
      .from(youthSkills)
      .innerJoin(skills, eq(youthSkills.skillId, skills.id))
      .where(eq(youthSkills.youthId, youthId));

    res.json(results);
  } catch (error) {
    console.error("Error batch updating youth skills:", error);
    res.status(500).json({ message: "Failed to update youth skills" });
  }
});

export default router;