import { db } from './db';
import { eq, sql } from 'drizzle-orm';
import { roles, permissions, rolePermissions } from "@shared/schema";

/**
 * Fix the admin role permissions by force-assigning all permissions
 */
export async function fixAdminPermissions() {
  console.log("Starting to fix admin permissions...");
  
  try {
    // 1. Find admin role
    const adminRoles = await db.select().from(roles).where(eq(roles.name, 'admin'));
    
    if (adminRoles.length === 0) {
      console.error("Admin role not found, cannot fix permissions");
      return false;
    }
    
    const adminRole = adminRoles[0];
    console.log(`Found admin role with ID: ${adminRole.id}`);
    
    // 2. Get all permissions
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions in database`);
    
    // 3. Count existing admin permissions
    const existingPermissions = await db.execute(
      sql`SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ${adminRole.id}`
    );
    
    const permissionCount = parseInt(existingPermissions.rows[0].count, 10);
    
    console.log(`Admin has ${permissionCount} assigned permissions`);
    
    // 4. Force reassign all permissions to admin
    console.log("Force reassigning all admin permissions...");
    
    // Delete all existing admin permissions
    try {
      await db.execute(sql`DELETE FROM role_permissions WHERE role_id = ${adminRole.id}`);
      console.log("Successfully deleted admin permissions using raw SQL");
    } catch (error) {
      console.error("Error deleting admin permissions:", error);
      return false;
    }
    
    console.log("Deleted all admin permissions");
    
    // Add all permissions to admin role
    console.log("Adding all permissions to admin role...");
    
    try {
      for (const perm of allPermissions) {
        await db.execute(
          sql`INSERT INTO role_permissions (role_id, role, resource, action, created_at, updated_at) 
              VALUES (${adminRole.id}, 'admin', ${perm.resource}, ${perm.action}, NOW(), NOW())`
        );
      }
    } catch (error) {
      console.error("Error inserting permission for admin:", error);
      return false;
    }
    
    console.log(`Assigned ${allPermissions.length} permissions to admin`);
    console.log("Admin now has all permissions");
    console.log("SUCCESS: All permissions properly assigned to admin");
    
    console.log("Admin role permissions fix completed successfully!");
    return true;
  } catch (error) {
    console.error("Error fixing admin permissions:", error);
    return false;
  }
}