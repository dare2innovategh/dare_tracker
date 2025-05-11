import { db } from './db';
import { permissions, rolePermissions, customRoles } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Script to fix permissions system:
 * 1. Ensure all permissions are properly created
 * 2. Assign all permissions to admin role
 */
async function fixPermissions() {
  console.log("Starting permission system fix...");
  
  try {
    // Step 1: Get or create admin role
    let adminRole = await getAdminRole();
    
    // Step 2: Get all permissions
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions`);
    
    if (allPermissions.length === 0) {
      console.log("No permissions found. Creating default permissions...");
      await createDefaultPermissions();
      console.log("Default permissions created.");
      // Get permissions again after creating them
      const createdPermissions = await db.select().from(permissions);
      console.log(`Now have ${createdPermissions.length} permissions`);
      
      // Step 3: Ensure admin has all permissions
      console.log("Assigning all permissions to admin role...");
      for (const permission of createdPermissions) {
        await db.execute(
          sql`INSERT INTO role_permissions 
              (role_id, resource, action, created_at, updated_at) 
              VALUES 
              (${adminRole.id}, ${permission.resource}, ${permission.action}, NOW(), NOW())
              ON CONFLICT DO NOTHING`
        );
        console.log(`Assigned permission: ${permission.resource}:${permission.action} to admin`);
      }
    } else {
      // Step 3: Ensure admin has all permissions
      console.log("Assigning all existing permissions to admin role...");
      for (const permission of allPermissions) {
        await db.execute(
          sql`INSERT INTO role_permissions 
              (role_id, resource, action, created_at, updated_at) 
              VALUES 
              (${adminRole.id}, ${permission.resource}, ${permission.action}, NOW(), NOW())
              ON CONFLICT DO NOTHING`
        );
        console.log(`Assigned permission: ${permission.resource}:${permission.action} to admin`);
      }
    }
    
    const assignedPermissions = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    console.log(`Admin role now has ${assignedPermissions.length} permissions`);
  } catch (error) {
    console.error("Error fixing permissions:", error);
    throw error;
  }
}

async function getAdminRole() {
  // Get admin role
  let adminRole = await db.select()
    .from(customRoles)
    .where(eq(customRoles.name, 'admin'))
    .then(rows => rows[0]);
  
  if (!adminRole) {
    // Create admin role if not exists
    adminRole = await db.insert(customRoles)
      .values({
        name: 'admin',
        description: 'Administrator with full system access',
        isSystem: true,
        isEditable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
      .then(rows => rows[0]);
    
    console.log(`Created admin role with ID: ${adminRole.id}`);
  } else {
    console.log(`Found admin role with ID: ${adminRole.id}`);
  }
  
  return adminRole;
}

async function createDefaultPermissions() {
  const resources = [
    'users', 'roles', 'permissions', 'youth_profiles', 'youth_education', 
    'youth_certifications', 'youth_skills', 'businesses', 'business_tracking', 
    'mentors', 'mentor_messages', 'reports', 'dashboard', 'system_settings'
  ];
  
  const actions = ['view', 'create', 'edit', 'delete'];
  
  // Create all combinations of resources and actions
  for (const resource of resources) {
    for (const action of actions) {
      await db.insert(permissions)
        .values({
          resource: resource,
          action: action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace('_', ' ')}`,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoNothing();
    }
  }
}

// Run the script
fixPermissions()
  .then(() => {
    console.log("Permission system fix completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Permission system fix failed:", err);
    process.exit(1);
  });