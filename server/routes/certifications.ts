import { Router } from "express";
import { db } from "../db";
import { certifications, insertCertificationSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get certifications for a specific youth
router.get("/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const certificationRecords = await db
      .select()
      .from(certifications)
      .where(eq(certifications.youthId, youthId));

    res.json(certificationRecords);
  } catch (error) {
    console.error("Error fetching certification records:", error);
    res.status(500).json({ message: "Failed to fetch certification records" });
  }
});

// Get a specific certification by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [certificationRecord] = await db
      .select()
      .from(certifications)
      .where(eq(certifications.id, id));

    if (!certificationRecord) {
      return res.status(404).json({ message: "Certification not found" });
    }

    res.json(certificationRecord);
  } catch (error) {
    console.error("Error fetching certification:", error);
    res.status(500).json({ message: "Failed to fetch certification" });
  }
});

// Create a new certification
router.post("/", async (req, res) => {
  try {
    const parsedBody = insertCertificationSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid certification data", 
        errors: parsedBody.error.format() 
      });
    }

    const [certificationRecord] = await db
      .insert(certifications)
      .values(parsedBody.data)
      .returning();

    res.status(201).json(certificationRecord);
  } catch (error) {
    console.error("Error creating certification:", error);
    res.status(500).json({ message: "Failed to create certification" });
  }
});

// Update a certification
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const parsedBody = insertCertificationSchema.partial().safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid certification data", 
        errors: parsedBody.error.format() 
      });
    }

    const [updatedRecord] = await db
      .update(certifications)
      .set(parsedBody.data)
      .where(eq(certifications.id, id))
      .returning();

    if (!updatedRecord) {
      return res.status(404).json({ message: "Certification not found" });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating certification:", error);
    res.status(500).json({ message: "Failed to update certification" });
  }
});

// Delete a certification
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [deletedRecord] = await db
      .delete(certifications)
      .where(eq(certifications.id, id))
      .returning();

    if (!deletedRecord) {
      return res.status(404).json({ message: "Certification not found" });
    }

    res.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res.status(500).json({ message: "Failed to delete certification" });
  }
});

// Batch update certifications for a youth profile
router.post("/:youthId/batch", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }

    const recordsSchema = z.array(insertCertificationSchema);
    const parsedBody = recordsSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid certification data", 
        errors: parsedBody.error.format() 
      });
    }

    // Delete existing records for this youth
    await db
      .delete(certifications)
      .where(eq(certifications.youthId, youthId));

    // Insert new records if any
    if (parsedBody.data.length > 0) {
      const records = parsedBody.data.map(record => ({
        ...record,
        youthId
      }));

      const newRecords = await db
        .insert(certifications)
        .values(records)
        .returning();

      return res.status(200).json(newRecords);
    }

    res.status(200).json([]);
  } catch (error) {
    console.error("Error batch updating certifications:", error);
    res.status(500).json({ message: "Failed to update certifications" });
  }
});

export default router;