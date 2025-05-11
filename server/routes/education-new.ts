import { Router } from "express";
import { db } from "../db";
import { education, insertEducationSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get education records for a specific youth
router.get("/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const educationRecords = await db
      .select()
      .from(education)
      .where(eq(education.youthId, youthId));

    res.json(educationRecords);
  } catch (error) {
    console.error("Error fetching education records:", error);
    res.status(500).json({ message: "Failed to fetch education records" });
  }
});

// Get a specific education record by ID
router.get("/record/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [educationRecord] = await db
      .select()
      .from(education)
      .where(eq(education.id, id));

    if (!educationRecord) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.json(educationRecord);
  } catch (error) {
    console.error("Error fetching education record:", error);
    res.status(500).json({ message: "Failed to fetch education record" });
  }
});

// Create a new education record
router.post("/", async (req, res) => {
  try {
    console.log("Creating education record with data:", req.body);
    
    // Check required fields
    if (!req.body.youthId) {
      return res.status(400).json({ message: "Youth ID is required" });
    }
    
    if (!req.body.qualificationType) {
      return res.status(400).json({ message: "Qualification type is required" });
    }
    
    if (!req.body.qualificationName) {
      return res.status(400).json({ message: "Qualification name is required" });
    }

    // Validate with schema
    const parsedBody = insertEducationSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid education data", 
        errors: parsedBody.error.format() 
      });
    }

    const [educationRecord] = await db
      .insert(education)
      .values(parsedBody.data)
      .returning();

    res.status(201).json(educationRecord);
  } catch (error) {
    console.error("Error creating education record:", error);
    res.status(500).json({ message: "Failed to create education record" });
  }
});

// Update an education record
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    console.log("Updating education record with ID:", id, "Data:", req.body);
    
    // Validate with partial schema
    const parsedBody = insertEducationSchema.partial().safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid education data", 
        errors: parsedBody.error.format() 
      });
    }

    // Include updatedAt timestamp
    const dataToUpdate = {
      ...parsedBody.data,
      updatedAt: new Date()
    };

    const [updatedRecord] = await db
      .update(education)
      .set(dataToUpdate)
      .where(eq(education.id, id))
      .returning();

    if (!updatedRecord) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating education record:", error);
    res.status(500).json({ message: "Failed to update education record" });
  }
});

// Delete an education record
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [deletedRecord] = await db
      .delete(education)
      .where(eq(education.id, id))
      .returning();

    if (!deletedRecord) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.json({ message: "Education record deleted successfully" });
  } catch (error) {
    console.error("Error deleting education record:", error);
    res.status(500).json({ message: "Failed to delete education record" });
  }
});

// Batch update education records for a youth profile
router.post("/:youthId/batch", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    console.log("Batch updating education records for youth:", youthId);
    
    // Delete existing records for this youth
    await db
      .delete(education)
      .where(eq(education.youthId, youthId));

    // If we have education data, insert it
    if (req.body && (Array.isArray(req.body) ? req.body.length > 0 : Object.keys(req.body).length > 0)) {
      const recordsArray = Array.isArray(req.body) ? req.body : [req.body];
      
      // Validate with schema
      const recordsSchema = z.array(insertEducationSchema);
      const parsedBody = recordsSchema.safeParse(recordsArray);
      
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid education data", 
          errors: parsedBody.error.format() 
        });
      }
      
      // Add youthId and updatedAt to all records
      const records = parsedBody.data.map(record => ({
        ...record,
        youthId,
        updatedAt: new Date()
      }));
      
      const newRecords = await db
        .insert(education)
        .values(records)
        .returning();

      return res.status(200).json(newRecords);
    }

    res.status(200).json([]);
  } catch (error) {
    console.error("Error batch updating education records:", error);
    res.status(500).json({ message: "Failed to update education records" });
  }
});

export default router;