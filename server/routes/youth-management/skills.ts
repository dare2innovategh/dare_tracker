import { Router } from "express";
import { storage } from "../../storage";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { skills, youthSkills } from "@shared/schema";

const router = Router();

// Get all skills associated with a youth profile
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
    
    // Get all skills for this youth
    const associatedSkills = await storage.getYouthSkills(youthId);
    
    return res.status(200).json(associatedSkills);
  } catch (error) {
    console.error("Error fetching youth skills:", error);
    return res.status(500).json({ message: "Failed to fetch skills" });
  }
});

// Associate a skill with a youth profile
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
    
    const { skillId, proficiencyLevel } = req.body;
    
    if (!skillId || isNaN(parseInt(skillId))) {
      return res.status(400).json({ message: "Valid skill ID is required" });
    }
    
    const skillIdNumber = parseInt(skillId);
    
    // Validate proficiency level if provided
    if (proficiencyLevel && !['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(proficiencyLevel)) {
      return res.status(400).json({ 
        message: "Proficiency level must be one of: Beginner, Intermediate, Advanced, Expert" 
      });
    }
    
    // Admin or users with 'edit' permission on 'youth_skills' can associate skills
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canManageSkills = permissions.some(p => 
        p.resource === 'youth_skills' && (p.action === 'edit' || p.action === 'create')
      );
      
      if (!canManageSkills) {
        return res.status(403).json({ 
          message: 'You do not have permission to associate skills with youth profiles' 
        });
      }
    }
    
    // Check if the youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }
    
    // Check if the skill exists
    const skill = await db.select().from(skills).where(eq(skills.id, skillIdNumber)).limit(1);
    if (skill.length === 0) {
      return res.status(404).json({ message: "Skill not found" });
    }
    
    // Check if association already exists
    const existingAssociation = await db.select()
      .from(youthSkills)
      .where(and(
        eq(youthSkills.youthId, youthId),
        eq(youthSkills.skillId, skillIdNumber)
      ))
      .limit(1);
    
    if (existingAssociation.length > 0) {
      // Update the existing association
      const updatedAssociation = await db.update(youthSkills)
        .set({ proficiencyLevel: proficiencyLevel || 'Beginner', updatedAt: new Date() })
        .where(and(
          eq(youthSkills.youthId, youthId),
          eq(youthSkills.skillId, skillIdNumber)
        ))
        .returning();
      
      return res.status(200).json({ 
        message: "Skill proficiency updated for youth profile",
        data: updatedAssociation[0]
      });
    }
    
    // Create a new association
    const newAssociation = await db.insert(youthSkills)
      .values({
        youthId,
        skillId: skillIdNumber,
        proficiencyLevel: proficiencyLevel || 'Beginner',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return res.status(201).json({ 
      message: "Skill successfully associated with youth profile",
      data: newAssociation[0]
    });
  } catch (error) {
    console.error("Error associating skill with youth:", error);
    return res.status(500).json({ 
      message: "Failed to associate skill with youth profile" 
    });
  }
});

// Remove skill association
router.delete("/:youthId/:skillId", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(youthId) || isNaN(skillId)) {
      return res.status(400).json({ 
        message: "Invalid IDs. Both youth ID and skill ID must be numbers." 
      });
    }
    
    // Admin or users with 'delete' permission on 'youth_skills' can remove associations
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canRemoveSkills = permissions.some(p => 
        p.resource === 'youth_skills' && p.action === 'delete'
      );
      
      if (!canRemoveSkills) {
        return res.status(403).json({ 
          message: 'You do not have permission to remove skill associations' 
        });
      }
    }
    
    // Check if the association exists
    const existingAssociation = await db.select()
      .from(youthSkills)
      .where(and(
        eq(youthSkills.youthId, youthId),
        eq(youthSkills.skillId, skillId)
      ))
      .limit(1);
    
    if (existingAssociation.length === 0) {
      return res.status(404).json({ 
        message: "Association between this youth and skill does not exist" 
      });
    }
    
    // Delete the association
    await db.delete(youthSkills)
      .where(and(
        eq(youthSkills.youthId, youthId),
        eq(youthSkills.skillId, skillId)
      ));
    
    return res.status(200).json({ 
      message: "Skill successfully disassociated from youth profile",
      youthId,
      skillId
    });
  } catch (error) {
    console.error("Error removing skill association:", error);
    return res.status(500).json({ 
      message: "Failed to disassociate skill from youth profile" 
    });
  }
});

export default router;