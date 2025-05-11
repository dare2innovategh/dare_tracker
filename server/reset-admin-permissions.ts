import { db } from './db';
import { roles, permissions, rolePermissions, permissionResourceEnum, permissionActionEnum } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Script to completely reset admin permissions by:
 * 1. Making the admin role editable
 * 2. Deleting all existing admin role permissions
 * 3. Reassigning ALL permissions to admin
 */
async function resetAdminPermissions() {
  try {
    console.log("Starting admin permission reset...");
    
    // 1. Find admin role
    let adminRole = await db.select().from(roles).where(sql`LOWER(name) = 'admin'`).execute();
    
    if (adminRole.length === 0) {
      throw new Error("Admin role not found. Cannot continue.");
    }
    
    console.log("Found admin role with ID:", adminRole[0].id);
    
    // 2. Make admin role editable
    await db.update(roles)
      .set({
        isEditable: true,
        isSystem: true // Keep as system role
      })
      .where(eq(roles.id, adminRole[0].id))
      .execute();
    
    console.log("Updated admin role to be editable");
    
    // 3. Get all permissions from the permissions table
    const allPermissions = await db.select().from(permissions).execute();
    console.log(`Found ${allPermissions.length} permissions in database`);
    
    // 4. Delete all existing admin role permissions
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole[0].id))
      .execute();
    
    console.log("Deleted existing admin permissions");
    
    // 5. Create permission entries for admin role
    const adminPermissions = allPermissions.map(perm => ({
      roleId: adminRole[0].id,
      role: "admin",
      resource: perm.resource,
      action: perm.action,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // 6. Insert all permissions for admin
    for (const perm of adminPermissions) {
      await db.insert(rolePermissions)
        .values(perm)
        .execute();
    }
    
    // 7. Verify permissions were added
    const finalPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole[0].id))
      .execute();
    
    console.log(`Admin now has ${finalPerms.length} permissions of ${allPermissions.length} total`);
    
    if (finalPerms.length === allPermissions.length) {
      console.log("SUCCESS: All permissions properly assigned to admin");
    } else {
      console.log("WARNING: Not all permissions were assigned");
    }
    
    console.log("Admin permissions reset completed");
  } catch (error) {
    console.error("Error resetting admin permissions:", error);
    throw error;
  }
}

// Execute immediately if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  resetAdminPermissions()
    .then(() => {
      console.log("Admin permissions reset script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Admin permissions reset script failed:", error);
      process.exit(1);
    });
}

export { resetAdminPermissions };