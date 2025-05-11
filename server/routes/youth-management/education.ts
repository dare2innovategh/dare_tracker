import { Router } from "express";
import { storage } from "../../storage";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { education } from "@shared/schema";

const router = Router();

// Get all education records for a youth profile
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
    
    // Get all education records for this youth
    const educationRecords = await db.select()
      .from(education)
      .where(eq(education.youthId, youthId));
    
    return res.status(200).json(educationRecords);
  } catch (error) {
    console.error("Error fetching youth education records:", error);
    return res.status(500).json({ message: "Failed to fetch education records" });
  }
});

// Add an education record to a youth profile
router.post("/:youthId", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }
    
    const {
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      description,
      isCurrentlyStudying
    } = req.body;
    
    // Validate required fields
    if (!institution || !degree) {
      return res.status(400).json({ 
        message: "Institution and degree are required fields" 
      });
    }
    
    // Admin or users with 'edit' permission on 'youth_education' can add education
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canManageEducation = permissions.some(p => 
        p.resource === 'youth_education' && (p.action === 'edit' || p.action === 'create')
      );
      
      if (!canManageEducation) {
        return res.status(403).json({ 
          message: 'You do not have permission to add education records to youth profiles' 
        });
      }
    }
    
    // Check if the youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }
    
    // Convert dates to proper Date objects if they are strings
    let parsedStartDate = startDate ? new Date(startDate) : null;
    let parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Create the education record
    const newEducation = await db.insert(education)
      .values({
        youthId,
        institution,
        degree,
        fieldOfStudy: fieldOfStudy || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        description: description || null,
        isCurrentlyStudying: isCurrentlyStudying || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return res.status(201).json({ 
      message: "Education record successfully added to youth profile",
      data: newEducation[0]
    });
  } catch (error) {
    console.error("Error adding education record:", error);
    return res.status(500).json({ 
      message: "Failed to add education record to youth profile" 
    });
  }
});

// Update an education record
router.patch("/:id", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const educationId = parseInt(req.params.id);
    if (isNaN(educationId)) {
      return res.status(400).json({ message: "Invalid education record ID" });
    }
    
    // Get the existing record to check ownership and existence
    const existingRecord = await db.select()
      .from(education)
      .where(eq(education.id, educationId))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ message: "Education record not found" });
    }
    
    const youthId = existingRecord[0].youthId;
    
    // Admin or users with 'edit' permission on 'youth_education' can update records
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canEditEducation = permissions.some(p => 
        p.resource === 'youth_education' && p.action === 'edit'
      );
      
      if (!canEditEducation) {
        return res.status(403).json({ 
          message: 'You do not have permission to update education records' 
        });
      }
    }
    
    const {
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      description,
      isCurrentlyStudying
    } = req.body;
    
    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    
    if (institution !== undefined) updateData.institution = institution;
    if (degree !== undefined) updateData.degree = degree;
    if (fieldOfStudy !== undefined) updateData.fieldOfStudy = fieldOfStudy;
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    if (description !== undefined) updateData.description = description;
    if (isCurrentlyStudying !== undefined) {
      updateData.isCurrentlyStudying = Boolean(isCurrentlyStudying);
    }
    
    // Update the education record
    const updatedEducation = await db.update(education)
      .set(updateData)
      .where(eq(education.id, educationId))
      .returning();
    
    if (updatedEducation.length === 0) {
      return res.status(404).json({ message: "Education record not found after update" });
    }
    
    return res.status(200).json({ 
      message: "Education record successfully updated",
      data: updatedEducation[0]
    });
  } catch (error) {
    console.error("Error updating education record:", error);
    return res.status(500).json({ 
      message: "Failed to update education record" 
    });
  }
});

// Delete an education record
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const educationId = parseInt(req.params.id);
    if (isNaN(educationId)) {
      return res.status(400).json({ message: "Invalid education record ID" });
    }
    
    // Get the existing record to check ownership and existence
    const existingRecord = await db.select()
      .from(education)
      .where(eq(education.id, educationId))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ message: "Education record not found" });
    }
    
    // Admin or users with 'delete' permission on 'youth_education' can delete records
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canDeleteEducation = permissions.some(p => 
        p.resource === 'youth_education' && p.action === 'delete'
      );
      
      if (!canDeleteEducation) {
        return res.status(403).json({ 
          message: 'You do not have permission to delete education records' 
        });
      }
    }
    
    // Delete the education record
    await db.delete(education)
      .where(eq(education.id, educationId));
    
    return res.status(200).json({ 
      message: "Education record successfully deleted",
      id: educationId
    });
  } catch (error) {
    console.error("Error deleting education record:", error);
    return res.status(500).json({ 
      message: "Failed to delete education record" 
    });
  }
});

export default router;