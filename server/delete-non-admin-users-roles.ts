/**
 * Script to delete all non-admin users and roles
 * This script will preserve the admin user and admin role while removing all others
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function deleteNonAdminUsersRoles() {
  console.log("Starting to delete all non-admin users and roles...");
  
  try {
    // First, find the admin user and role
    const adminUserResult = await db.execute(sql`
      SELECT id FROM users WHERE username = 'dareadmin' LIMIT 1;
    `);
    
    if (adminUserResult.rowCount === 0) {
      return {
        success: false,
        message: "Admin user not found! Aborting to prevent data loss."
      };
    }
    
    const adminUserId = adminUserResult.rows[0].id;
    console.log(`Found admin user with ID: ${adminUserId}`);
    
    const adminRoleResult = await db.execute(sql`
      SELECT id FROM roles WHERE name = 'admin' LIMIT 1;
    `);
    
    if (adminRoleResult.rowCount === 0) {
      return {
        success: false, 
        message: "Admin role not found! Aborting to prevent data loss."
      };
    }
    
    const adminRoleId = adminRoleResult.rows[0].id;
    console.log(`Found admin role with ID: ${adminRoleId}`);
    
    // First, clean up role_users associations
    const roleUsersResult = await db.execute(sql`
      DELETE FROM role_users 
      WHERE user_id != ${adminUserId} OR role_id != ${adminRoleId};
    `);
    
    console.log(`Deleted ${roleUsersResult.rowCount} role-user associations`);
    
    // Now, clean up mentors table which has foreign keys to users
    const mentorsResult = await db.execute(sql`
      DELETE FROM mentors 
      WHERE user_id != ${adminUserId};
    `);
    
    console.log(`Deleted ${mentorsResult.rowCount} mentor profiles`);
    
    // Clean up users except admin
    const usersResult = await db.execute(sql`
      DELETE FROM users 
      WHERE id != ${adminUserId};
    `);
    
    console.log(`Deleted ${usersResult.rowCount} non-admin users`);
    
    // Clean up role permissions for non-admin roles
    const rolePermissionsResult = await db.execute(sql`
      DELETE FROM role_permissions 
      WHERE role_id != ${adminRoleId};
    `);
    
    console.log(`Deleted ${rolePermissionsResult.rowCount} role permissions`);
    
    // Finally, clean up roles except admin
    const rolesResult = await db.execute(sql`
      DELETE FROM roles 
      WHERE id != ${adminRoleId};
    `);
    
    console.log(`Deleted ${rolesResult.rowCount} non-admin roles`);
    
    // Also clean up custom_roles table
    const customRolesResult = await db.execute(sql`
      DELETE FROM custom_roles 
      WHERE name != 'admin';
    `);
    
    console.log(`Deleted ${customRolesResult.rowCount} custom roles`);
    
    return {
      success: true,
      message: "Successfully deleted all non-admin users and roles",
      details: {
        roleUsersDeleted: roleUsersResult.rowCount,
        mentorsDeleted: mentorsResult.rowCount,
        usersDeleted: usersResult.rowCount,
        rolePermissionsDeleted: rolePermissionsResult.rowCount,
        rolesDeleted: rolesResult.rowCount,
        customRolesDeleted: customRolesResult.rowCount
      }
    };
  } catch (error) {
    console.error("Error deleting non-admin users and roles:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the script
deleteNonAdminUsersRoles()
  .then((result) => {
    console.log("Deletion completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deletion:", error);
    process.exit(1);
  });

export { deleteNonAdminUsersRoles };