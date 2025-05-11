/**
 * Script to create the permissions and roles tables
 * This will ensure proper functioning of role-based access control
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function createPermissionsTables() {
  console.log("Creating permissions and roles tables...");
  
  try {
    // Check if permissions table exists
    const permissionsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'permissions'
      );
    `);

    const permissionsExists = permissionsCheck.rows[0].exists;
    
    if (!permissionsExists) {
      console.log("Creating permissions table");
      
      await db.execute(sql`
        CREATE TABLE permissions (
          id SERIAL PRIMARY KEY,
          resource TEXT NOT NULL,
          action TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(resource, action)
        );
      `);
      
      console.log("Created permissions table successfully");
      
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
      
      for (const permission of basicPermissions) {
        await db.execute(sql`
          INSERT INTO permissions (resource, action, description) 
          VALUES (${permission.resource}, ${permission.action}, ${permission.description});
        `);
      }
      
      console.log(`Seeded ${basicPermissions.length} basic permissions`);
    } else {
      console.log("permissions table already exists");
    }
    
    // Check if roles table exists
    const rolesCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'roles'
      );
    `);

    const rolesExists = rolesCheck.rows[0].exists;
    
    if (!rolesExists) {
      console.log("Creating roles table");
      
      await db.execute(sql`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          is_system_role BOOLEAN DEFAULT FALSE,
          is_editable BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("Created roles table successfully");
      
      // Create admin role
      const adminRole = await db.execute(sql`
        INSERT INTO roles (name, description, is_system_role, is_editable)
        VALUES ('admin', 'Administrator with full system access', TRUE, FALSE)
        RETURNING id;
      `);
      
      const adminRoleId = adminRole.rows[0].id;
      console.log(`Created admin role with ID: ${adminRoleId}`);
    } else {
      console.log("roles table already exists");
      
      // Ensure admin role exists
      const adminRoleCheck = await db.execute(sql`
        SELECT id FROM roles WHERE name = 'admin' LIMIT 1;
      `);
      
      if (adminRoleCheck.rowCount === 0) {
        console.log("Creating admin role");
        
        const adminRole = await db.execute(sql`
          INSERT INTO roles (name, description, is_system_role, is_editable)
          VALUES ('admin', 'Administrator with full system access', TRUE, FALSE)
          RETURNING id;
        `);
        
        const adminRoleId = adminRole.rows[0].id;
        console.log(`Created admin role with ID: ${adminRoleId}`);
      } else {
        const adminRoleId = adminRoleCheck.rows[0].id;
        console.log(`Admin role already exists with ID: ${adminRoleId}`);
      }
    }
    
    // Check if role_permissions table exists
    const rolePermissionsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'role_permissions'
      );
    `);

    const rolePermissionsExists = rolePermissionsCheck.rows[0].exists;
    
    if (!rolePermissionsExists) {
      console.log("Creating role_permissions table");
      
      await db.execute(sql`
        CREATE TABLE role_permissions (
          id SERIAL PRIMARY KEY,
          role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
          permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(role_id, permission_id)
        );
      `);
      
      console.log("Created role_permissions table successfully");
    } else {
      console.log("role_permissions table already exists");
    }
    
    // Check if role_users table exists
    const roleUsersCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'role_users'
      );
    `);

    const roleUsersExists = roleUsersCheck.rows[0].exists;
    
    if (!roleUsersExists) {
      console.log("Creating role_users table");
      
      await db.execute(sql`
        CREATE TABLE role_users (
          id SERIAL PRIMARY KEY,
          role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(role_id, user_id)
        );
      `);
      
      console.log("Created role_users table successfully");
    } else {
      console.log("role_users table already exists");
    }
    
    // Assign all permissions to admin role
    console.log("Assigning all permissions to admin role");
    
    // Get admin role ID
    const adminRoleResult = await db.execute(sql`
      SELECT id FROM roles WHERE name = 'admin' LIMIT 1;
    `);
    
    if (adminRoleResult.rowCount > 0) {
      const adminRoleId = adminRoleResult.rows[0].id;
      
      // Get all permissions
      const permissionsResult = await db.execute(sql`
        SELECT id FROM permissions;
      `);
      
      // Clear existing admin permissions
      await db.execute(sql`
        DELETE FROM role_permissions WHERE role_id = ${adminRoleId};
      `);
      
      // Assign all permissions to admin
      for (const permission of permissionsResult.rows) {
        await db.execute(sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${adminRoleId}, ${permission.id})
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `);
      }
      
      console.log(`Assigned ${permissionsResult.rowCount} permissions to admin role`);
      
      // Assign admin user to admin role
      const adminUserCheck = await db.execute(sql`
        SELECT id FROM users WHERE username = 'dareadmin' LIMIT 1;
      `);
      
      if (adminUserCheck.rowCount > 0) {
        const adminUserId = adminUserCheck.rows[0].id;
        
        await db.execute(sql`
          INSERT INTO role_users (role_id, user_id)
          VALUES (${adminRoleId}, ${adminUserId})
          ON CONFLICT (role_id, user_id) DO NOTHING;
        `);
        
        console.log(`Assigned admin user (ID: ${adminUserId}) to admin role`);
      } else {
        console.log("Admin user not found");
      }
    } else {
      console.log("Admin role not found");
    }
    
    return {
      success: true,
      message: "Permissions and roles tables setup completed successfully"
    };
  } catch (error) {
    console.error("Error setting up permissions and roles tables:", error);
    return {
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the script
createPermissionsTables()
  .then((result) => {
    console.log("Permissions tables setup completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during permissions tables setup:", error);
    process.exit(1);
  });

export { createPermissionsTables };