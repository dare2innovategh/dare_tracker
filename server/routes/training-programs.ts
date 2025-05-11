import { Router } from "express";
import { db } from "../db";
import { trainingPrograms, insertTrainingProgramSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all training programs
router.get("/", async (req, res) => {
  try {
    const programs = await db.select().from(trainingPrograms);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching training programs:", error);
    res.status(500).json({ message: "Failed to fetch training programs" });
  }
});

// Get training program by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [program] = await db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, id));

    if (!program) {
      return res.status(404).json({ message: "Training program not found" });
    }

    res.json(program);
  } catch (error) {
    console.error("Error fetching training program:", error);
    res.status(500).json({ message: "Failed to fetch training program" });
  }
});

// Create a new training program
router.post("/", async (req, res) => {
  try {
    const parsedBody = insertTrainingProgramSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid training program data", 
        errors: parsedBody.error.format() 
      });
    }

    const [program] = await db
      .insert(trainingPrograms)
      .values(parsedBody.data)
      .returning();

    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating training program:", error);
    res.status(500).json({ message: "Failed to create training program" });
  }
});

// Update a training program
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const parsedBody = insertTrainingProgramSchema.partial().safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid training program data", 
        errors: parsedBody.error.format() 
      });
    }

    const [updatedProgram] = await db
      .update(trainingPrograms)
      .set(parsedBody.data)
      .where(eq(trainingPrograms.id, id))
      .returning();

    if (!updatedProgram) {
      return res.status(404).json({ message: "Training program not found" });
    }

    res.json(updatedProgram);
  } catch (error) {
    console.error("Error updating training program:", error);
    res.status(500).json({ message: "Failed to update training program" });
  }
});

// Delete a training program
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [deletedProgram] = await db
      .delete(trainingPrograms)
      .where(eq(trainingPrograms.id, id))
      .returning();

    if (!deletedProgram) {
      return res.status(404).json({ message: "Training program not found" });
    }

    res.json({ message: "Training program deleted successfully" });
  } catch (error) {
    console.error("Error deleting training program:", error);
    res.status(500).json({ message: "Failed to delete training program" });
  }
});

export default router;