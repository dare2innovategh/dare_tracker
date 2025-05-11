import { db } from './db';
import { roles, rolePermissions, permissions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to verify the dynamic permissions setup
 */
async function finishPermissionsSetup() {
  try {
    console.log("Starting permissions verification...");
    
    // Verify everything
    const finalRoles = await db.select().from(roles);
    const finalPermissions = await db.select().from(permissions);
    const finalRolePermissions = await db.select().from(rolePermissions);
    
    console.log(`=== Final Counts ===`);
    console.log(`Roles: ${finalRoles.length}`);
    console.log(`Permissions: ${finalPermissions.length}`);
    console.log(`Role-Permissions Assignments: ${finalRolePermissions.length}`);
    
    console.log("\nRoles:");
    finalRoles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id})`);
    });
    
    console.log("\nPermissions by Resource:");
    const resourceGroups = finalPermissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm.action);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(resourceGroups).forEach(([resource, actions]) => {
      console.log(`- ${resource}: ${actions.join(', ')}`);
    });
    
    console.log("\nRole-Permission Assignments by Role:");
    const rolePermissionGroups = finalRolePermissions.reduce((acc, rp) => {
      if (!acc[rp.role]) {
        acc[rp.role] = [];
      }
      acc[rp.role].push(`${rp.resource}:${rp.action}`);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(rolePermissionGroups).forEach(([role, perms]) => {
      console.log(`- ${role}: ${perms.length} permissions`);
    });
    
    console.log("\nDynamic permissions system verification complete!");
    return {
      roles: finalRoles.length,
      permissions: finalPermissions.length,
      rolePermissions: finalRolePermissions.length
    };
  } catch (error) {
    console.error("Error verifying permissions:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  finishPermissionsSetup()
    .then((result) => {
      console.log("Permissions verification completed successfully");
      console.log("Summary:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Permissions verification failed:", error);
      process.exit(1);
    });
}