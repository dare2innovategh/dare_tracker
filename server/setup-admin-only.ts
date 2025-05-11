import { db } from './db';
import { roles, rolePermissions, permissions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to create only the admin role with all permissions
 */
async function setupAdminOnly() {
  try {
    console.log("Starting admin-only setup...");
    
    // 1. Create the admin role
    console.log("1. Creating admin role...");
    const [adminRole] = await db.insert(roles)
      .values({
        name: "admin",
        description: "Administrator with full access",
        isSystem: true,
        isEditable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Admin role created with ID: ${adminRole.id}`);
    
    // 2. Get all permissions
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions in the database`);
    
    // 3. Assign all permissions to admin
    console.log("3. Assigning all permissions to admin role...");
    
    let assignedCount = 0;
    for (const perm of allPermissions) {
      await db.insert(rolePermissions)
        .values({
          roleId: adminRole.id,
          role: adminRole.name,
          resource: perm.resource,
          action: perm.action,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute();
      assignedCount++;
    }
    
    console.log(`Assigned ${assignedCount} permissions to admin role`);
    
    // 4. Verify admin permissions
    const adminPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));
    
    console.log(`Admin role now has ${adminPerms.length} permissions`);
    
    if (adminPerms.length === allPermissions.length) {
      console.log("SUCCESS: Admin role has all permissions");
    } else {
      console.log("WARNING: Admin role doesn't have all permissions");
    }
    
    console.log("Admin-only setup completed successfully");
    return {
      adminRoleId: adminRole.id,
      permissionsCount: allPermissions.length,
      assignedCount: adminPerms.length
    };
  } catch (error) {
    console.error("Error in admin-only setup:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdminOnly()
    .then((result) => {
      console.log("Admin-only setup completed successfully");
      console.log("Summary:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Admin-only setup failed:", error);
      process.exit(1);
    });
}