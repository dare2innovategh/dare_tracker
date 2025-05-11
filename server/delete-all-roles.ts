import { db } from './db';
import { roles, rolePermissions, permissions, customRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to completely remove all roles from the system without recreating anything
 */
async function deleteAllRoles() {
  try {
    console.log("Starting to delete all roles...");
    
    // 1. Delete all role permissions
    console.log("1. Deleting all role permissions...");
    await db.delete(rolePermissions).execute();
    console.log("All role permissions deleted");
    
    // 2. Delete all custom roles
    console.log("2. Deleting all custom roles...");
    await db.delete(customRoles).execute();
    console.log("All custom roles deleted");
    
    // 3. Delete all system roles
    console.log("3. Deleting all system roles...");
    await db.delete(roles).execute();
    console.log("All system roles deleted");
    
    console.log("All roles and permissions have been completely removed from the system");
  } catch (error) {
    console.error("Error deleting roles:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteAllRoles()
    .then(() => {
      console.log("All roles deletion completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Roles deletion failed:", error);
      process.exit(1);
    });
}