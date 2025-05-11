import { Router } from "express";
import { db } from "../db";
import { youthTraining, insertYouthTrainingSchema, trainingPrograms } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get all training records for a specific youth
router.get("/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const trainingRecords = await db.query.youthTraining.findMany({
      where: eq(youthTraining.youthId, youthId),
      with: {
        program: true
      }
    });

    res.json(trainingRecords);
  } catch (error) {
    console.error("Error fetching youth training records:", error);
    res.status(500).json({ message: "Failed to fetch training records" });
  }
});

// Get specific training record by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [trainingRecord] = await db
      .select()
      .from(youthTraining)
      .where(eq(youthTraining.id, id));

    if (!trainingRecord) {
      return res.status(404).json({ message: "Training record not found" });
    }

    res.json(trainingRecord);
  } catch (error) {
    console.error("Error fetching training record:", error);
    res.status(500).json({ message: "Failed to fetch training record" });
  }
});

// Create a new training record
router.post("/", async (req, res) => {
  try {
    const parsedBody = insertYouthTrainingSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid training record data", 
        errors: parsedBody.error.format() 
      });
    }

    // Check if this training program is already assigned to this youth
    const existingRecord = await db
      .select()
      .from(youthTraining)
      .where(
        and(
          eq(youthTraining.youthId, parsedBody.data.youthId),
          eq(youthTraining.programId, parsedBody.data.programId)
        )
      );

    if (existingRecord.length > 0) {
      return res.status(400).json({ 
        message: "This training program is already assigned to this youth" 
      });
    }

    const [trainingRecord] = await db
      .insert(youthTraining)
      .values(parsedBody.data)
      .returning();

    res.status(201).json(trainingRecord);
  } catch (error) {
    console.error("Error creating training record:", error);
    res.status(500).json({ message: "Failed to create training record" });
  }
});

// Update a training record
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const parsedBody = insertYouthTrainingSchema.partial().safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid training record data", 
        errors: parsedBody.error.format() 
      });
    }

    const [updatedRecord] = await db
      .update(youthTraining)
      .set(parsedBody.data)
      .where(eq(youthTraining.id, id))
      .returning();

    if (!updatedRecord) {
      return res.status(404).json({ message: "Training record not found" });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating training record:", error);
    res.status(500).json({ message: "Failed to update training record" });
  }
});

// Delete a training record
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [deletedRecord] = await db
      .delete(youthTraining)
      .where(eq(youthTraining.id, id))
      .returning();

    if (!deletedRecord) {
      return res.status(404).json({ message: "Training record not found" });
    }

    res.json({ message: "Training record deleted successfully" });
  } catch (error) {
    console.error("Error deleting training record:", error);
    res.status(500).json({ message: "Failed to delete training record" });
  }
});

// Batch update training records for a youth profile
router.post("/youth/:youthId/batch", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const { trainingRecords } = req.body;
    if (!Array.isArray(trainingRecords)) {
      return res.status(400).json({ message: "trainingRecords must be an array" });
    }

    // Delete existing records for this youth
    await db
      .delete(youthTraining)
      .where(eq(youthTraining.youthId, youthId));

    // Insert new records if any
    if (trainingRecords.length > 0) {
      const records = trainingRecords.map(record => ({
        ...record,
        youthId
      }));

      const newRecords = await db
        .insert(youthTraining)
        .values(records)
        .returning();

      return res.status(200).json(newRecords);
    }

    res.status(200).json([]);
  } catch (error) {
    console.error("Error batch updating training records:", error);
    res.status(500).json({ message: "Failed to update training records" });
  }
});

export default router;