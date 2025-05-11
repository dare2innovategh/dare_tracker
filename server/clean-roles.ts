import { db } from './db';
import { roles, rolePermissions } from "@shared/schema";
import { eq, not, and, sql } from "drizzle-orm";

/**
 * Script to clean up unnecessary roles while keeping essential ones.
 * Core roles to keep:
 * - admin
 * - Core leadership roles (Program Lead, Communication Lead, etc.)
 */
async function cleanRoles() {
  try {
    console.log("Starting to clean roles...");
    
    // Define essential role names to keep
    const essentialRoles = [
      'admin',
      'Program Lead',
      'Communication Lead',
      'RMEL Lead',
      'IHS Lead',
      'MKTS Lead',
      'User',
      'mentor',
      'user'
    ].map(name => name.toLowerCase());
    
    // Get current roles
    const allRoles = await db.select().from(roles);
    console.log(`Total roles found: ${allRoles.length}`);
    
    // Identify roles to keep and delete
    const rolesToKeep = allRoles.filter(role => 
      essentialRoles.includes(role.name.toLowerCase()) || role.isSystem === true
    );
    
    const rolesToDelete = allRoles.filter(role => 
      !essentialRoles.includes(role.name.toLowerCase()) && role.isSystem !== true
    );
    
    console.log(`Roles to keep (${rolesToKeep.length}): ${rolesToKeep.map(r => r.name).join(', ')}`);
    console.log(`Roles to delete (${rolesToDelete.length}): ${rolesToDelete.map(r => r.name).join(', ')}`);
    
    // First delete permissions for roles to be deleted
    for (const role of rolesToDelete) {
      // Delete all permissions for this role
      console.log(`Deleting permissions for role: ${role.name}`);
      const deletedPermissionsResult = await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id))
        .returning();
      
      console.log(`Deleted ${deletedPermissionsResult.length} permissions for role: ${role.name}`);
    }
    
    // Delete the roles themselves
    if (rolesToDelete.length > 0) {
      console.log(`Deleting ${rolesToDelete.length} roles individually...`);
      
      // Delete each role individually
      for (const role of rolesToDelete) {
        console.log(`Deleting role: ${role.name} (ID: ${role.id})`);
        const [deletedRole] = await db.delete(roles)
          .where(eq(roles.id, role.id))
          .returning();
        
        if (deletedRole) {
          console.log(`Successfully deleted role: ${deletedRole.name}`);
        } else {
          console.log(`Failed to delete role: ${role.name}`);
        }
      }
    } else {
      console.log("No roles to delete");
    }
    
    // Verify remaining roles
    const remainingRoles = await db.select().from(roles);
    console.log(`Remaining roles (${remainingRoles.length}): ${remainingRoles.map(r => r.name).join(', ')}`);
    
    console.log("Role cleanup completed successfully");
  } catch (error) {
    console.error("Error cleaning roles:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanRoles()
    .then(() => {
      console.log("Roles cleanup completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Roles cleanup failed:", error);
      process.exit(1);
    });
}