import { Router } from "express";
import { db } from "../../db";
import { storage } from "../../storage";
import { eq } from "drizzle-orm";
import { certifications } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Set up multer for file handling
const uploadsDir = path.join(process.cwd(), "uploads", "certificates");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    // Generate unique filename with original extension
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

// Set up file filter for images and PDFs
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and PDFs only
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, GIF) and PDF files are allowed"));
  }
};

// Set up multer with size limits
const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

const router = Router();

// Get all certifications for a youth profile
router.get("/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }
    
    // Check if the youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }
    
    // Get all certifications for this youth
    // Use explicit column selection to avoid issues with missing columns
    try {
      // Explicitly omit trainingProgram field since it doesn't exist in the database
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
      
      return res.status(200).json(youthCertifications);
    } catch (error) {
      console.error("Error fetching youth certifications:", error);
      // Fall back to a minimal query if even the explicit selection fails
      try {
        const basicCertifications = await db.select({
          id: certifications.id,
          youthId: certifications.youthId,
          certificationName: certifications.certificationName,
          issuingOrganization: certifications.issuingOrganization,
          issueDate: certifications.issueDate,
          expiryDate: certifications.expiryDate
        })
        .from(certifications)
        .where(eq(certifications.youthId, youthId));
        
        return res.status(200).json(basicCertifications);
      } catch (fallbackError) {
        console.error("Even fallback query failed:", fallbackError);
        return res.status(500).json({ message: "Failed to fetch certifications due to database schema issues" });
      }
    }
  } catch (error) {
    console.error("Error fetching youth certifications:", error);
    return res.status(500).json({ message: "Failed to fetch certifications" });
  }
});

// Add a certification with optional file upload
router.post("/:youthId", upload.single("certificateFile"), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }
    
    // Check if the youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }
    
    // Admin or users with 'create' permission on 'youth_certifications' can add certifications
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canAddCertifications = permissions.some(p => 
        p.resource === 'youth_certifications' && (p.action === 'edit' || p.action === 'create')
      );
      
      if (!canAddCertifications) {
        return res.status(403).json({ 
          message: 'You do not have permission to add certifications to youth profiles' 
        });
      }
    }
    
    // Extract certification details from the request body
    const {
      certificationName,
      issuingOrganization,
      issueDate,
      expiryDate,
      description,
      trainingProgram
    } = req.body;
    
    // Validate required fields
    if (!certificationName) {
      return res.status(400).json({ message: "Certification name is required" });
    }
    
    // Get file path if a file was uploaded
    let credentialUrl = null;
    if (req.file) {
      // Create URL path for the uploaded file
      credentialUrl = `/uploads/certificates/${req.file.filename}`;
    }
    
    // Convert dates to proper Date objects if they are provided as strings
    let parsedIssueDate = issueDate ? new Date(issueDate) : null;
    let parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;
    
    // Create the certification record
    try {
      // First attempt with all fields including trainingProgram
      // Handle training program ID conversion if needed
      let programValue = trainingProgram;
      if (programValue && programValue !== "none") {
        try {
          // If the trainingProgram is numeric but stored as string, ensure it's stored consistently
          const programId = parseInt(programValue);
          if (!isNaN(programId)) {
            programValue = programId.toString();
          }
        } catch (e) {
          console.log("Training program conversion error:", e);
          // Keep original value if conversion fails
        }
      }

      // Use a simple object without type casting to avoid compatibility issues
      const certData = {
        youthId,
        certificationName,
        issuingOrganization: issuingOrganization || null,
        // Format dates as strings in YYYY-MM-DD format for PostgreSQL
        issueDate: parsedIssueDate ? 
          `${parsedIssueDate.getFullYear()}-${String(parsedIssueDate.getMonth() + 1).padStart(2, '0')}-${String(parsedIssueDate.getDate()).padStart(2, '0')}` : 
          null,
        expiryDate: parsedExpiryDate ? 
          `${parsedExpiryDate.getFullYear()}-${String(parsedExpiryDate.getMonth() + 1).padStart(2, '0')}-${String(parsedExpiryDate.getDate()).padStart(2, '0')}` : 
          null,
        credentialUrl: credentialUrl,
        credentialId: req.body.credentialId || null,
        skills: req.body.skills || [],
        // Remove trainingProgram if it's causing issues
        // trainingProgram: req.body.trainingProgram || null,
        // Format the updatedAt timestamp as a string 
        updatedAt: new Date().toISOString()
      };
      
      const newCertification = await db.insert(certifications)
        .values([certData]) // Use array for values as required by the type system
        .returning();
        
      return res.status(201).json({ 
        message: "Certification successfully added to youth profile",
        data: newCertification[0],
        fileUploaded: !!credentialUrl
      });
    } catch (insertError) {
      // If the first attempt fails, try again without the training_program field
      console.error("Error creating certification with trainingProgram:", insertError);
      console.log("Attempting to create certification without trainingProgram field");
      
      try {
        // Simplify the fallback even further - use string dates directly
        const fallbackCertData = {
          youthId,
          certificationName,
          issuingOrganization: issuingOrganization || null,
          // Format dates as strings in YYYY-MM-DD format
          issueDate: parsedIssueDate ? 
            `${parsedIssueDate.getFullYear()}-${String(parsedIssueDate.getMonth() + 1).padStart(2, '0')}-${String(parsedIssueDate.getDate()).padStart(2, '0')}` : 
            null,
          expiryDate: parsedExpiryDate ? 
            `${parsedExpiryDate.getFullYear()}-${String(parsedExpiryDate.getMonth() + 1).padStart(2, '0')}-${String(parsedExpiryDate.getDate()).padStart(2, '0')}` : 
            null,
          credentialUrl: credentialUrl,
          credentialId: req.body.credentialId || null,
          skills: req.body.skills || [],
          // Use a string for updatedAt, omitting toISOString() to avoid the error
          updatedAt: new Date().toLocaleDateString('en-CA') // Format as YYYY-MM-DD
        };
        
        const newCertification = await db.insert(certifications)
          .values([fallbackCertData]) // Use array for values as required by the type system
          .returning();
        
        return res.status(201).json({ 
          message: "Certification successfully added to youth profile",
          data: newCertification[0],
          fileUploaded: !!credentialUrl
        });
      } catch (fallbackError) {
        console.error("Both attempts to create certification failed:", fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error("Error adding certification:", error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to add certification to youth profile" 
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
    
    // Get the existing certification to check existence and file path
    const existingCertification = await db.select()
      .from(certifications)
      .where(eq(certifications.id, certificationId))
      .limit(1);
    
    if (existingCertification.length === 0) {
      return res.status(404).json({ message: "Certification not found" });
    }
    
    // Admin or users with 'delete' permission on 'youth_certifications' can delete certifications
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canDeleteCertifications = permissions.some(p => 
        p.resource === 'youth_certifications' && p.action === 'delete'
      );
      
      if (!canDeleteCertifications) {
        return res.status(403).json({ 
          message: 'You do not have permission to delete certifications' 
        });
      }
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
    
    // Get the existing certification to check existence and file path
    const existingCertification = await db.select()
      .from(certifications)
      .where(eq(certifications.id, certificationId))
      .limit(1);
    
    if (existingCertification.length === 0) {
      return res.status(404).json({ message: "Certification not found" });
    }
    
    // Admin or users with 'edit' permission on 'youth_certifications' can update certifications
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canEditCertifications = permissions.some(p => 
        p.resource === 'youth_certifications' && p.action === 'edit'
      );
      
      if (!canEditCertifications) {
        return res.status(403).json({ 
          message: 'You do not have permission to update certifications' 
        });
      }
    }
    
    // Extract certification details from the request body
    const {
      certificationName,
      issuingOrganization,
      issueDate,
      expiryDate,
      description,
      trainingProgram,
      removeFile
    } = req.body;
    
    // Prepare update data
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (certificationName !== undefined) updateData.certificationName = certificationName;
    if (issuingOrganization !== undefined) updateData.issuingOrganization = issuingOrganization;
    if (issueDate !== undefined) {
      // Convert dates to ISO format strings for database compatibility
      const parsedDate = issueDate ? new Date(issueDate) : null;
      updateData.issueDate = parsedDate ? parsedDate.toISOString().split('T')[0] : null;
    }
    if (expiryDate !== undefined) {
      // Convert dates to ISO format strings for database compatibility
      const parsedDate = expiryDate ? new Date(expiryDate) : null;
      updateData.expiryDate = parsedDate ? parsedDate.toISOString().split('T')[0] : null;
    }
    if (description !== undefined) updateData.description = description;
    
    // Training program field removed as it doesn't exist in the database schema
    // if (trainingProgram !== undefined) {
    //   // Code removed as the trainingProgram field doesn't exist in the database
    // }
    
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
    } catch (updateError) {
      console.error("Error updating certification with training program:", updateError);
      
      try {
        // Check for any schema-related issues
        console.log("Attempting update with cleaned data");
        // Remove any fields that might not exist in the schema
        if (updateData.trainingProgram !== undefined) {
          delete updateData.trainingProgram;
        }
          
        const fallbackUpdate = await db.update(certifications)
          .set(updateData)
          .where(eq(certifications.id, certificationId))
          .returning();
          
        if (fallbackUpdate.length === 0) {
          return res.status(404).json({ message: "Certification not found after update" });
        }
          
        return res.status(200).json({ 
          message: "Certification successfully updated",
          data: fallbackUpdate[0],
          fileUpdated: !!req.file || removeFile === 'true'
        });
      } catch (fallbackError) {
        console.error("Both update attempts failed:", fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error("Error updating certification:", error);
    return res.status(500).json({ 
      message: "Failed to update certification" 
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
    
    try {
      // Use explicit column selection to avoid issues with missing columns
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
    } catch (fetchError) {
      console.error("Error fetching certification with full fields:", fetchError);
      
      // Fall back to minimal query if explicit selection fails
      const basicCertification = await db.select({
        id: certifications.id,
        youthId: certifications.youthId,
        certificationName: certifications.certificationName,
        issuingOrganization: certifications.issuingOrganization,
        issueDate: certifications.issueDate,
        expiryDate: certifications.expiryDate,
        credentialUrl: certifications.credentialUrl
      })
      .from(certifications)
      .where(eq(certifications.id, certificationId))
      .limit(1);
      
      if (basicCertification.length === 0) {
        return res.status(404).json({ message: "Certification not found" });
      }
      
      return res.status(200).json(basicCertification[0]);
    }
  } catch (error) {
    console.error("Error fetching certification:", error);
    return res.status(500).json({ message: "Failed to fetch certification" });
  }
});

export default router;