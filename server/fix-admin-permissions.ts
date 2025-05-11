import { db } from './db';
import { roles, permissions, rolePermissions, permissionResourceEnum, permissionActionEnum } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Script to ensure the Admin role exists and automatically has all permissions
 */
async function fixAdminPermissions() {
  try {
    console.log("Starting to fix admin permissions...");
    
    // 1. Ensure Admin role exists in system roles table (try both "Admin" and "admin" for case-insensitivity)
    let adminRole = await db.select().from(roles).where(sql`LOWER(name) = 'admin'`).execute();
    
    if (adminRole.length === 0) {
      // Create new role if it doesn't exist in the table
      console.log("Admin role doesn't exist. Creating it...");
      [adminRole[0]] = await db.insert(roles).values({
        name: "admin", // Use lowercase to match schema constants
        displayName: "Administrator", 
        description: "System administrator with full access to all features",
        isSystem: true,
        isEditable: true
      }).returning();
      console.log("Admin role created with ID:", adminRole[0].id);
    } else {
      console.log("Found admin role with ID:", adminRole[0].id);
      
      // Update admin role to make it editable
      await db.update(roles)
        .set({
          isEditable: true
        })
        .where(eq(roles.id, adminRole[0].id))
        .execute();
      console.log("Updated admin role to be editable");
    }
    
    // 2. Get all permissions from the permissions table
    const allPermissions = await db.select().from(permissions).execute();
    console.log(`Found ${allPermissions.length} permissions in database`);
    
    // 3. Get existing admin role permissions
    const existingAdminPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole[0].id))
      .execute();
    
    console.log(`Admin has ${existingAdminPerms.length} assigned permissions`);
    
    // 4. Always force reassign all permissions to ensure admin has every permission
    console.log("Force reassigning all admin permissions...");
    
    // Delete all current admin permissions
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole[0].id))
      .execute();
    console.log("Deleted all admin permissions");
    
    // Now add all permissions to admin role
    console.log("Adding all permissions to admin role...");
    
    // Create a list of all permissions for admin
    const adminPermissions = allPermissions.map(perm => ({
      roleId: adminRole[0].id,
      role: "admin",
      resource: perm.resource,
      action: perm.action,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert all permissions for admin
    await db.insert(rolePermissions).values(adminPermissions).execute();
    
    // Verify the permissions were added correctly
    const newAdminPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole[0].id))
      .execute();
    
    console.log(`Assigned ${newAdminPerms.length} permissions to admin`);
    console.log(`Admin now has ${newAdminPerms.length} permissions of ${allPermissions.length} total`);
    
    if (newAdminPerms.length === allPermissions.length) {
      console.log("SUCCESS: All permissions properly assigned to admin");
    } else {
      console.log("WARNING: Admin permissions count doesn't match expected count");
    }
    
    console.log("Admin role permissions fix completed successfully!");
  } catch (error) {
    console.error("Error fixing Admin permissions:", error);
  }
}

// Execute the script if it's the main module
// Run immediately
{
  // Only exit if this file is being run directly, not when imported
  const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
  
  fixAdminPermissions()
    .then(() => {
      console.log("Script completed successfully");
      if (isDirectRun) {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error("Script failed:", error);
      if (isDirectRun) {
        process.exit(1);
      }
    });
}

// Export for use in other scripts
export { fixAdminPermissions };