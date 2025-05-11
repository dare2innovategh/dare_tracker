/**
 * Script to seed basic permissions and assign them to the admin role
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function seedPermissions() {
  console.log("Seeding permissions...");
  
  try {
    // Delete existing permissions
    await db.execute(sql`DELETE FROM permissions;`);
    console.log("Deleted existing permissions");
    
    // Seed basic permissions
    const basicPermissions = [
      { resource: 'dashboard', action: 'view', description: 'View dashboard' },
      { resource: 'users', action: 'view', description: 'View users' },
      { resource: 'users', action: 'create', description: 'Create users' },
      { resource: 'users', action: 'edit', description: 'Edit users' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'users', action: 'manage', description: 'Manage user roles' },
      { resource: 'youth', action: 'view', description: 'View youth profiles' },
      { resource: 'youth', action: 'create', description: 'Create youth profiles' },
      { resource: 'youth', action: 'edit', description: 'Edit youth profiles' },
      { resource: 'youth', action: 'delete', description: 'Delete youth profiles' },
      { resource: 'businesses', action: 'view', description: 'View businesses' },
      { resource: 'businesses', action: 'create', description: 'Create businesses' },
      { resource: 'businesses', action: 'edit', description: 'Edit businesses' },
      { resource: 'businesses', action: 'delete', description: 'Delete businesses' },
      { resource: 'businesses', action: 'track', description: 'Track business metrics' },
      { resource: 'mentors', action: 'view', description: 'View mentors' },
      { resource: 'mentors', action: 'create', description: 'Create mentors' },
      { resource: 'mentors', action: 'edit', description: 'Edit mentors' },
      { resource: 'mentors', action: 'delete', description: 'Delete mentors' },
      { resource: 'mentors', action: 'assign', description: 'Assign mentors to businesses' },
      { resource: 'settings', action: 'view', description: 'View system settings' },
      { resource: 'settings', action: 'edit', description: 'Edit system settings' },
      { resource: 'reports', action: 'view', description: 'View reports' },
      { resource: 'reports', action: 'create', description: 'Create reports' },
      { resource: 'training', action: 'view', description: 'View training programs' },
      { resource: 'training', action: 'create', description: 'Create training programs' },
      { resource: 'training', action: 'edit', description: 'Edit training programs' },
      { resource: 'training', action: 'delete', description: 'Delete training programs' },
      { resource: 'makerspaces', action: 'view', description: 'View makerspaces' },
      { resource: 'makerspaces', action: 'create', description: 'Create makerspaces' },
      { resource: 'makerspaces', action: 'edit', description: 'Edit makerspaces' },
      { resource: 'makerspaces', action: 'delete', description: 'Delete makerspaces' },
      { resource: 'makerspaces', action: 'assign', description: 'Assign businesses to makerspaces' },
      { resource: 'assessment', action: 'view', description: 'View feasibility assessments' },
      { resource: 'assessment', action: 'create', description: 'Create feasibility assessments' },
      { resource: 'assessment', action: 'edit', description: 'Edit feasibility assessments' },
      { resource: 'skills', action: 'view', description: 'View skills list' },
      { resource: 'skills', action: 'manage', description: 'Manage skills categories' },
    ];
    
    // Insert permissions
    for (const permission of basicPermissions) {
      await db.execute(sql`
        INSERT INTO permissions (resource, action, description) 
        VALUES (${permission.resource}, ${permission.action}, ${permission.description});
      `);
    }
    
    console.log(`Seeded ${basicPermissions.length} basic permissions`);
    
    // Get admin role ID
    const adminRoleResult = await db.execute(sql`
      SELECT id FROM roles WHERE name = 'admin' LIMIT 1;
    `);
    
    if (adminRoleResult.rowCount === 0) {
      console.log("Admin role not found. Creating it...");
      
      const result = await db.execute(sql`
        INSERT INTO roles (name, description, is_system_role, is_editable)
        VALUES ('admin', 'Administrator with full system access', TRUE, FALSE)
        RETURNING id;
      `);
      
      const adminRoleId = result.rows[0].id;
      console.log(`Created admin role with ID: ${adminRoleId}`);
    } else {
      const adminRoleId = adminRoleResult.rows[0].id;
      console.log(`Found admin role with ID: ${adminRoleId}`);
    }
    
    // Assign all permissions to admin role
    const permissionsResult = await db.execute(sql`SELECT id FROM permissions;`);
    const adminId = adminRoleResult.rows[0].id;
    
    // Delete existing role permissions
    await db.execute(sql`DELETE FROM role_permissions WHERE role_id = ${adminId};`);
    console.log(`Deleted existing permissions for admin role`);
    
    // Insert each permission
    for (const permission of permissionsResult.rows) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${adminId}, ${permission.id});
      `);
    }
    
    console.log(`Assigned ${permissionsResult.rowCount} permissions to admin role`);
    
    // Get admin user and assign role
    const adminUserResult = await db.execute(sql`
      SELECT id FROM users WHERE username = 'dareadmin' LIMIT 1;
    `);
    
    if (adminUserResult.rowCount > 0) {
      const adminUserId = adminUserResult.rows[0].id;
      
      // Check if already assigned
      const roleUserCheck = await db.execute(sql`
        SELECT id FROM role_users 
        WHERE role_id = ${adminId} AND user_id = ${adminUserId}
        LIMIT 1;
      `);
      
      if (roleUserCheck.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO role_users (role_id, user_id)
          VALUES (${adminId}, ${adminUserId});
        `);
        
        console.log(`Assigned admin user (ID: ${adminUserId}) to admin role`);
      } else {
        console.log(`Admin user (ID: ${adminUserId}) already assigned to admin role`);
      }
    } else {
      console.log("Admin user not found");
    }
    
    return {
      success: true,
      message: "Permissions seeded and assigned to admin role successfully"
    };
  } catch (error) {
    console.error("Error seeding permissions:", error);
    return {
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the script
seedPermissions()
  .then((result) => {
    console.log("Permissions seeding completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during permissions seeding:", error);
    process.exit(1);
  });

export { seedPermissions };