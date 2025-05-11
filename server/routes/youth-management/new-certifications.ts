import { Router } from "express";
import { db } from "../../db";
import { certifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "certificates");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `certificate-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF and PDF files are allowed.") as any);
    }
  }
});

const router = Router();

// Get all certifications for a youth profile
router.get("/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }
    
    // Use explicit selection to match database schema exactly
    const youthCertifications = await db.select({
      id: certifications.id,
      youthId: certifications.youthId,
      certificationName: certifications.certificationName,
      issuingOrganization: certifications.issuingOrganization,
      issueDate: certifications.issueDate,
      expiryDate: certifications.expiryDate,
      credentialId: certifications.credentialId,
      credentialUrl: certifications.credentialUrl,
      skills: certifications.skills,
      createdAt: certifications.createdAt,
      updatedAt: certifications.updatedAt
    })
    .from(certifications)
    .where(eq(certifications.youthId, youthId));
    
    res.json(youthCertifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    res.status(500).json({ message: "Failed to fetch certifications" });
  }
});

// Get a specific certification by ID
router.get("/details/:id", async (req, res) => {
  try {
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Use explicit selection to match database schema exactly
    const certification = await db.select({
      id: certifications.id,
      youthId: certifications.youthId,
      certificationName: certifications.certificationName,
      issuingOrganization: certifications.issuingOrganization,
      issueDate: certifications.issueDate,
      expiryDate: certifications.expiryDate,
      credentialId: certifications.credentialId,
      credentialUrl: certifications.credentialUrl,
      skills: certifications.skills,
      createdAt: certifications.createdAt,
      updatedAt: certifications.updatedAt
    })
    .from(certifications)
    .where(eq(certifications.id, certificationId))
    .limit(1);
    
    if (certification.length === 0) {
      return res.status(404).json({ message: "Certification not found" });
    }
    
    res.status(200).json(certification[0]);
  } catch (error) {
    console.error("Error fetching certification details:", error);
    res.status(500).json({ message: "Failed to fetch certification details" });
  }
});

// Add a new certification
router.post("/", upload.single("certificate"), async (req, res) => {
  try {
    const {
      youthId,
      certificationName,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialId,
      skills
    } = req.body;
    
    // Validate required fields
    if (!youthId || !certificationName) {
      return res.status(400).json({ 
        message: "Youth ID and certification name are required" 
      });
    }
    
    // Ensure youthId is a valid number
    const parsedYouthId = parseInt(youthId);
    if (isNaN(parsedYouthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }
    
    // Prepare certification data
    const certificationData: any = {
      youthId: parsedYouthId,
      certificationName,
      issuingOrganization: issuingOrganization || null,
      credentialId: credentialId || null,
      skills: skills ? JSON.parse(skills) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Handle dates - ensure they're proper date objects or null
    if (issueDate) {
      // Handle date as string (e.g., "2023-01-01")
      certificationData.issueDate = new Date(issueDate);
    } else {
      certificationData.issueDate = null;
    }
    
    if (expiryDate) {
      // Handle date as string (e.g., "2023-01-01")
      certificationData.expiryDate = new Date(expiryDate);
    } else {
      certificationData.expiryDate = null;
    }
    
    // Handle file upload if provided
    if (req.file) {
      certificationData.credentialUrl = `/uploads/certificates/${req.file.filename}`;
    } else {
      certificationData.credentialUrl = null;
    }
    
    // Insert certification into database
    const [newCertification] = await db
      .insert(certifications)
      .values(certificationData)
      .returning();
    
    res.status(201).json({
      message: "Certification added successfully",
      data: newCertification
    });
  } catch (error) {
    console.error("Error adding certification:", error);
    return res.status(500).json({ 
      message: "Failed to add certification"
    });
  }
});

// Update a certification
router.patch("/:id", upload.single("certificate"), async (req, res) => {
  try {
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Get the existing certification to check existence and file path
    const existingCertification = await db.select({
      id: certifications.id,
      youthId: certifications.youthId, 
      certificationName: certifications.certificationName,
      issuingOrganization: certifications.issuingOrganization,
      credentialUrl: certifications.credentialUrl,
      credentialId: certifications.credentialId,
      skills: certifications.skills
    })
    .from(certifications)
    .where(eq(certifications.id, certificationId))
    .limit(1);
    
    if (existingCertification.length === 0) {
      return res.status(404).json({ message: "Certification not found" });
    }
    
    // Extract certification details from the request body
    const {
      certificationName,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialId,
      skills,
      removeFile
    } = req.body;
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (certificationName !== undefined) updateData.certificationName = certificationName;
    if (issuingOrganization !== undefined) updateData.issuingOrganization = issuingOrganization;
    if (credentialId !== undefined) updateData.credentialId = credentialId;
    if (skills !== undefined) updateData.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    
    // Handle dates - ensure they're proper date objects or null
    if (issueDate !== undefined) {
      if (issueDate) {
        updateData.issueDate = new Date(issueDate);
      } else {
        updateData.issueDate = null;
      }
    }
    
    if (expiryDate !== undefined) {
      if (expiryDate) {
        updateData.expiryDate = new Date(expiryDate);
      } else {
        updateData.expiryDate = null;
      }
    }
    
    // Handle file operations
    const oldCredentialUrl = existingCertification[0].credentialUrl;
    
    // If removeFile is true or a new file is uploaded, delete the old file
    if ((removeFile === 'true' || req.file) && oldCredentialUrl) {
      try {
        const filePath = path.join(process.cwd(), oldCredentialUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error("Error deleting old certificate file:", fileError);
        // Continue with update even if file deletion fails
      }
    }
    
    // If removeFile is true, set credentialUrl to null
    if (removeFile === 'true') {
      updateData.credentialUrl = null;
    }
    
    // If a new file is uploaded, update credentialUrl
    if (req.file) {
      updateData.credentialUrl = `/uploads/certificates/${req.file.filename}`;
    }
    
    // Update the certification record
    const updatedCertification = await db
      .update(certifications)
      .set(updateData)
      .where(eq(certifications.id, certificationId))
      .returning();
    
    if (updatedCertification.length === 0) {
      return res.status(404).json({ message: "Certification not found after update" });
    }
    
    return res.status(200).json({ 
      message: "Certification successfully updated",
      data: updatedCertification[0],
      fileUpdated: !!req.file || removeFile === 'true'
    });
  } catch (error) {
    console.error("Error updating certification:", error);
    return res.status(500).json({ 
      message: "Failed to update certification" 
    });
  }
});

// Delete a certification
router.delete("/:id", async (req, res) => {
  try {
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Get the certification to check existence and file path
    const existingCertification = await db
      .select({
        id: certifications.id,
        credentialUrl: certifications.credentialUrl
      })
      .from(certifications)
      .where(eq(certifications.id, certificationId))
      .limit(1);
    
    if (existingCertification.length === 0) {
      return res.status(404).json({ message: "Certification not found" });
    }
    
    // Delete the file if it exists
    const credentialUrl = existingCertification[0].credentialUrl;
    if (credentialUrl) {
      try {
        const filePath = path.join(process.cwd(), credentialUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error("Error deleting certificate file:", fileError);
        // Continue with deletion even if file deletion fails
      }
    }
    
    // Delete the certification record
    await db
      .delete(certifications)
      .where(eq(certifications.id, certificationId));
    
    return res.status(200).json({ 
      message: "Certification successfully deleted" 
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return res.status(500).json({ 
      message: "Failed to delete certification" 
    });
  }
});

// Batch update certifications for a youth profile
router.post("/youth/:youthId/batch", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }
    
    const { certifications: certificationList } = req.body;
    if (!Array.isArray(certificationList)) {
      return res.status(400).json({ message: "certifications must be an array" });
    }
    
    // Delete existing certifications for this youth
    await db
      .delete(certifications)
      .where(eq(certifications.youthId, youthId));
    
    // Insert new certifications if any
    if (certificationList.length > 0) {
      const records = certificationList.map(cert => ({
        ...cert,
        youthId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const newCertifications = await db
        .insert(certifications)
        .values(records)
        .returning();
      
      return res.status(200).json(newCertifications);
    }
    
    res.status(200).json([]);
  } catch (error) {
    console.error("Error batch updating certifications:", error);
    res.status(500).json({ message: "Failed to update certifications" });
  }
});

export default router;