import { Router } from "express";
import { db } from "../../db";
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

    // Use explicit selection to match database schema exactly
    const trainingRecords = await db
      .select({
        id: youthTraining.id,
        youthId: youthTraining.youthId,
        programId: youthTraining.programId,
        startDate: youthTraining.startDate,
        completionDate: youthTraining.completionDate,
        status: youthTraining.status,
        certificationReceived: youthTraining.certificationReceived,
        notes: youthTraining.notes,
        createdAt: youthTraining.createdAt,
        updatedAt: youthTraining.updatedAt,
        // Include program fields
        program: {
          id: trainingPrograms.id,
          name: trainingPrograms.name,
          description: trainingPrograms.description,
          category: trainingPrograms.category,
          totalModules: trainingPrograms.totalModules
        }
      })
      .from(youthTraining)
      .leftJoin(trainingPrograms, eq(youthTraining.programId, trainingPrograms.id))
      .where(eq(youthTraining.youthId, youthId));

    // Format the response to match the expected structure with nested program
    const formattedRecords = trainingRecords.map(record => {
      const { program, ...trainingData } = record;
      return {
        ...trainingData,
        program
      };
    });

    res.json(formattedRecords);
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

    // Use explicit selection to match database schema exactly
    const trainingRecord = await db
      .select({
        id: youthTraining.id,
        youthId: youthTraining.youthId,
        programId: youthTraining.programId,
        startDate: youthTraining.startDate,
        completionDate: youthTraining.completionDate,
        status: youthTraining.status,
        certificationReceived: youthTraining.certificationReceived,
        notes: youthTraining.notes,
        createdAt: youthTraining.createdAt,
        updatedAt: youthTraining.updatedAt,
        // Include program fields
        program: {
          id: trainingPrograms.id,
          name: trainingPrograms.name,
          description: trainingPrograms.description,
          category: trainingPrograms.category,
          totalModules: trainingPrograms.totalModules
        }
      })
      .from(youthTraining)
      .leftJoin(trainingPrograms, eq(youthTraining.programId, trainingPrograms.id))
      .where(eq(youthTraining.id, id))
      .limit(1);

    if (trainingRecord.length === 0) {
      return res.status(404).json({ message: "Training record not found" });
    }

    // Format the response
    const { program, ...trainingData } = trainingRecord[0];
    const formattedRecord = {
      ...trainingData,
      program
    };

    res.json(formattedRecord);
  } catch (error) {
    console.error("Error fetching training record:", error);
    res.status(500).json({ message: "Failed to fetch training record" });
  }
});

// Add a new training record for a youth
router.post("/", async (req, res) => {
  try {
    // Validate the request body
    const parsedData = insertYouthTrainingSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ 
        message: "Invalid training data", 
        errors: parsedData.error.errors 
      });
    }

    // Check if the youth and program exist and are valid
    const youthId = parsedData.data.youthId;
    const programId = parsedData.data.programId;

    // Insert the new training record
    const newTraining = await db
      .insert(youthTraining)
      .values({
        ...parsedData.data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (newTraining.length === 0) {
      return res.status(500).json({ message: "Failed to create training record" });
    }

    // Fetch the related program data for the response
    const [program] = await db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, programId))
      .limit(1);

    // Return the created record with the program
    const createdRecord = {
      ...newTraining[0],
      program
    };

    res.status(201).json(createdRecord);
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

    // Check if the record exists
    const existingRecord = await db
      .select()
      .from(youthTraining)
      .where(eq(youthTraining.id, id))
      .limit(1);

    if (existingRecord.length === 0) {
      return res.status(404).json({ message: "Training record not found" });
    }

    // Validate the update data
    const parsedData = insertYouthTrainingSchema.partial().safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ 
        message: "Invalid training data", 
        errors: parsedData.error.errors 
      });
    }

    // Update the record
    const updatedTraining = await db
      .update(youthTraining)
      .set({
        ...parsedData.data,
        updatedAt: new Date()
      })
      .where(eq(youthTraining.id, id))
      .returning();

    if (updatedTraining.length === 0) {
      return res.status(500).json({ message: "Failed to update training record" });
    }

    // Fetch the program data for the response
    const programId = updatedTraining[0].programId;
    const [program] = await db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, programId))
      .limit(1);

    // Return the updated record with program
    const updatedRecord = {
      ...updatedTraining[0],
      program
    };

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

    // Check if the record exists
    const existingRecord = await db
      .select()
      .from(youthTraining)
      .where(eq(youthTraining.id, id))
      .limit(1);

    if (existingRecord.length === 0) {
      return res.status(404).json({ message: "Training record not found" });
    }

    // Delete the record
    await db
      .delete(youthTraining)
      .where(eq(youthTraining.id, id));

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
        youthId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const newRecords = await db
        .insert(youthTraining)
        .values(records)
        .returning();

      // Fetch the associated programs
      const programIds = [...new Set(newRecords.map(record => record.programId))];
      const programs = await db
        .select()
        .from(trainingPrograms)
        .where(programIds.length > 0 ? 
          eq(trainingPrograms.id, programIds[0]) : 
          undefined);

      // Create a map of program IDs to programs
      const programMap = programs.reduce((map, program) => {
        map[program.id] = program;
        return map;
      }, {});

      // Format the response
      const formattedRecords = newRecords.map(record => ({
        ...record,
        program: programMap[record.programId] || null
      }));

      return res.status(200).json(formattedRecords);
    }

    res.status(200).json([]);
  } catch (error) {
    console.error("Error batch updating training records:", error);
    res.status(500).json({ message: "Failed to update training records" });
  }
});

export default router;