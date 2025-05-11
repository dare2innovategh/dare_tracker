import { db } from "./db";
import { rolePermissions } from "@shared/schema";
import { and, eq } from "drizzle-orm";

/**
 * This script ensures that mentors don't have certain permissions
 * that they shouldn't have, specifically the ability to create youth profiles.
 */
async function fixMentorPermissions() {
  try {
    console.log("Starting mentor permissions fix...");
    
    // First, find the mentor role ID
    const mentorRoleResult = await db.execute(
      `SELECT * FROM roles WHERE name = 'mentor' OR display_name = 'Mentor' LIMIT 1`
    );
    
    if (!mentorRoleResult.rows || mentorRoleResult.rows.length === 0) {
      console.log("Mentor role not found, checking custom roles...");
      
      // Check custom roles table
      const customMentorRoleResult = await db.execute(
        `SELECT * FROM roles WHERE id = 34 LIMIT 1`
      );
      
      if (!customMentorRoleResult.rows || customMentorRoleResult.rows.length === 0) {
        throw new Error("Mentor role not found in any roles table");
      }
      
      const mentorRole = customMentorRoleResult.rows[0] as any;
      console.log(`Found mentor role with ID: ${mentorRole.id}`);
      
      // Restricted permissions that mentors should not have
      const restrictedPermissions = [
        { resource: "youth_profiles", action: "create" },
        { resource: "youth_profiles", action: "edit" },
        { resource: "youth_profiles", action: "delete" },
        { resource: "youth_profiles", action: "manage" }
      ];
      
      // Check and remove each restricted permission
      for (const perm of restrictedPermissions) {
        console.log(`Checking if mentor has ${perm.resource}:${perm.action} permission...`);
        
        // Check if permission exists
        const existingPermResult = await db.select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, mentorRole.id),
              eq(rolePermissions.resource, perm.resource),
              eq(rolePermissions.action, perm.action)
            )
          );
        
        if (existingPermResult.length > 0) {
          console.log(`Found restricted permission ${perm.resource}:${perm.action}, removing it...`);
          
          // Delete the permission
          await db.delete(rolePermissions)
            .where(
              and(
                eq(rolePermissions.roleId, mentorRole.id),
                eq(rolePermissions.resource, perm.resource),
                eq(rolePermissions.action, perm.action)
              )
            );
          
          console.log(`Removed ${perm.resource}:${perm.action} permission from mentor role`);
        } else {
          console.log(`Mentor does not have ${perm.resource}:${perm.action} permission. Good!`);
        }
      }
      
      // Get remaining permissions
      const remainingPerms = await db.select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, mentorRole.id));
      
      console.log(`Mentor role now has ${remainingPerms.length} permissions`);
      
      return {
        mentorRoleId: mentorRole.id,
        removedPermissions: restrictedPermissions.length,
        remainingPermissions: remainingPerms.length
      };
    }
    
    const mentorRole = mentorRoleResult.rows[0] as any;
    console.log(`Found mentor role with ID: ${mentorRole.id}`);
    
    // Rest of the function remains the same...
    // Restricted permissions that mentors should not have
    const restrictedPermissions = [
      { resource: "youth_profiles", action: "create" },
      { resource: "youth_profiles", action: "edit" },
      { resource: "youth_profiles", action: "delete" },
      { resource: "youth_profiles", action: "manage" }
    ];
    
    // Check and remove each restricted permission
    for (const perm of restrictedPermissions) {
      console.log(`Checking if mentor has ${perm.resource}:${perm.action} permission...`);
      
      // Check if permission exists
      const existingPermResult = await db.select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, mentorRole.id),
            eq(rolePermissions.resource, perm.resource),
            eq(rolePermissions.action, perm.action)
          )
        );
      
      if (existingPermResult.length > 0) {
        console.log(`Found restricted permission ${perm.resource}:${perm.action}, removing it...`);
        
        // Delete the permission
        await db.delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, mentorRole.id),
              eq(rolePermissions.resource, perm.resource),
              eq(rolePermissions.action, perm.action)
            )
          );
        
        console.log(`Removed ${perm.resource}:${perm.action} permission from mentor role`);
      } else {
        console.log(`Mentor does not have ${perm.resource}:${perm.action} permission. Good!`);
      }
    }
    
    // Get remaining permissions
    const remainingPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, mentorRole.id));
    
    console.log(`Mentor role now has ${remainingPerms.length} permissions`);
    
    return {
      mentorRoleId: mentorRole.id,
      removedPermissions: restrictedPermissions.length,
      remainingPermissions: remainingPerms.length
    };
    
  } catch (error) {
    console.error("Error fixing mentor permissions:", error);
    throw error;
  }
}

// Run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMentorPermissions()
    .then((result) => {
      console.log("Mentor permissions fix completed successfully:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Failed to fix mentor permissions:", error);
      process.exit(1);
    });
}

export default fixMentorPermissions;