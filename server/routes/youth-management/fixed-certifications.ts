import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../db";
import { certifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../../storage";
import { v4 as uuidv4 } from "uuid";

// Set up multer storage for certificate uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create the uploads/certificates directory if it doesn't exist
    const dir = "./uploads/certificates";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter for accepted file types
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only PDF and image files
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"));
  }
};

// Initialize multer upload object
const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

const router = Router();

// Get all certifications for a youth profile
router.get("/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }
    
    // Only select columns that exist in the database
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

// Add a new certification to a youth profile
router.post("/:youthId", upload.single("certificateFile"), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth ID" });
    }
    
    // Extract certification details from the request body
    const { certificationName, issuingOrganization, issueDate, expiryDate } = req.body;
    
    if (!certificationName) {
      return res.status(400).json({ message: "Certification name is required" });
    }
    
    // Handle uploaded file
    let credentialUrl = null;
    if (req.file) {
      credentialUrl = `/uploads/certificates/${req.file.filename}`;
    }
    
    try {
      // Create a simplified object that avoids date issues but only includes fields that exist in the database
      const certData: any = {
        youthId, 
        certificationName,
        issuingOrganization: issuingOrganization || null,
        credentialUrl: credentialUrl,
        credentialId: req.body.credentialId || null,
        skills: req.body.skills || []
      };
      
      // Handle dates carefully - don't use Date objects directly
      if (issueDate) {
        certData.issueDate = issueDate; // Store as string, let PostgreSQL handle conversion
      }
      
      if (expiryDate) {
        certData.expiryDate = expiryDate; // Store as string, let PostgreSQL handle conversion
      }
      
      // NOTE: We're explicitly NOT adding trainingProgram as it doesn't exist in the database schema
      
      const newCertification = await db.insert(certifications)
        .values(certData)
        .returning();
      
      return res.status(201).json({ 
        message: "Certification successfully added to youth profile",
        data: newCertification[0],
        fileUploaded: !!credentialUrl
      });
    } catch (error) {
      console.error("Error adding certification:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to add certification" 
      });
    }
  } catch (error) {
    console.error("Error in certification route:", error);
    return res.status(500).json({ 
      message: "Failed to process certification request" 
    });
  }
});

// Delete a certification
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Get the existing certification to check existence and file path - be explicit about columns
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
    
    // Delete the certificate file if it exists
    const credentialUrl = existingCertification[0].credentialUrl;
    if (credentialUrl) {
      try {
        const filePath = path.join(process.cwd(), credentialUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error("Error deleting certificate file:", fileError);
        // Continue with deletion of database record even if file deletion fails
      }
    }
    
    // Delete the certification record
    await db.delete(certifications)
      .where(eq(certifications.id, certificationId));
    
    return res.status(200).json({ 
      message: "Certification successfully deleted",
      id: certificationId
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return res.status(500).json({ 
      message: "Failed to delete certification" 
    });
  }
});

// Update a certification
router.patch("/:id", upload.single("certificateFile"), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Get the existing certification to check existence and file path - be explicit about columns
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
      description,
      removeFile
    } = req.body;
    
    // Prepare update data - avoid using Date objects or updatedAt
    const updateData: any = {};
    
    if (certificationName !== undefined) updateData.certificationName = certificationName;
    if (issuingOrganization !== undefined) updateData.issuingOrganization = issuingOrganization;
    if (issueDate !== undefined) updateData.issueDate = issueDate;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (description !== undefined) updateData.description = description;
    
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
    
    // Update credentialId and skills if provided
    if (req.body.credentialId !== undefined) {
      updateData.credentialId = req.body.credentialId;
    }
    
    if (req.body.skills !== undefined) {
      updateData.skills = req.body.skills;
    }
    
    // Update the certification record
    try {
      const updatedCertification = await db.update(certifications)
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
  } catch (error) {
    console.error("Error in update certification route:", error);
    return res.status(500).json({ 
      message: "Failed to process update request" 
    });
  }
});

// Get a specific certification by ID
router.get("/details/:id", async (req, res) => {
  try {
    const certificationId = parseInt(req.params.id);
    if (isNaN(certificationId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }
    
    // Only select columns that exist in the database
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
    
    return res.status(200).json(certification[0]);
  } catch (error) {
    console.error("Error fetching certification details:", error);
    return res.status(500).json({ message: "Failed to fetch certification details" });
  }
});

export default router;