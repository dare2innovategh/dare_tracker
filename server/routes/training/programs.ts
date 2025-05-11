import { Router } from "express";
import { z } from "zod";
import { db } from "../../db";
import { trainingPrograms } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router = Router();

// Create schema for training program
const trainingProgramSchema = z.object({
  name: z.string().min(3, { message: "Program name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string(),
  totalModules: z.number().min(1, { message: "Program must have at least 1 module" })
});

// Get all training programs
router.get("/", auth, requirePermission("training", "view"), async (req, res) => {
  try {
    // Select only fields that exist in the table to avoid errors
    const programsList = await db
      .select({
        id: trainingPrograms.id,
        name: trainingPrograms.name,
        description: trainingPrograms.description,
        totalModules: trainingPrograms.totalModules,
        createdAt: trainingPrograms.createdAt,
        updatedAt: trainingPrograms.updatedAt
      })
      .from(trainingPrograms)
      .orderBy(desc(trainingPrograms.createdAt));
    
    res.status(200).json(programsList);
  } catch (error) {
    console.error("Error fetching training programs:", error);
    res.status(500).json({ message: "Failed to fetch training programs" });
  }
});

// Get a single training program by ID
router.get("/:id", auth, requirePermission("training", "view"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }

    const [program] = await db
      .select({
        id: trainingPrograms.id,
        name: trainingPrograms.name,
        description: trainingPrograms.description,
        totalModules: trainingPrograms.totalModules,
        createdAt: trainingPrograms.createdAt,
        updatedAt: trainingPrograms.updatedAt
      })
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, id));
    
    if (!program) {
      return res.status(404).json({ message: "Training program not found" });
    }
    
    res.status(200).json(program);
  } catch (error) {
    console.error("Error fetching training program:", error);
    res.status(500).json({ message: "Failed to fetch training program" });
  }
});

// Create a new training program
router.post("/", auth, requirePermission("training", "create"), async (req, res) => {
  try {
    const validatedData = trainingProgramSchema.parse(req.body);
    
    const [createdProgram] = await db.insert(trainingPrograms)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        totalModules: validatedData.totalModules,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(createdProgram);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating training program:", error);
    res.status(500).json({ message: "Failed to create training program" });
  }
});

// Update a training program
router.patch("/:id", auth, requirePermission("training", "edit"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    
    console.log("Received update data:", req.body);

    // Validate the incoming data first
    const validatedData = trainingProgramSchema.parse(req.body);
    
    // Always use a fresh Date object for timestamps
    const currentDate = new Date();
    
    // Log the validated data after parsing
    console.log("Validated data:", validatedData);
    console.log("Using timestamp:", currentDate);
    
    const [updatedProgram] = await db.update(trainingPrograms)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        totalModules: validatedData.totalModules,
        updatedAt: currentDate
      })
      .where(eq(trainingPrograms.id, id))
      .returning();
    
    if (!updatedProgram) {
      return res.status(404).json({ message: "Training program not found" });
    }
    
    res.status(200).json(updatedProgram);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error updating training program:", error);
    res.status(500).json({ message: "Failed to update training program" });
  }
});

// Delete a training program
router.delete("/:id", auth, requirePermission("training", "delete"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }

    const [deletedProgram] = await db.delete(trainingPrograms)
      .where(eq(trainingPrograms.id, id))
      .returning();
    
    if (!deletedProgram) {
      return res.status(404).json({ message: "Training program not found" });
    }
    
    res.status(200).json({ message: "Training program deleted successfully" });
  } catch (error) {
    console.error("Error deleting training program:", error);
    res.status(500).json({ message: "Failed to delete training program" });
  }
});

export default router;