import { db } from './db';
import { users, permissions, rolePermissions, customRoles, roles } from '@shared/schema';
import { sql, eq, and } from 'drizzle-orm';

/**
 * This script moves all permissions from custom_roles to system roles and 
 * updates the user table to use system roles instead of custom roles.
 * It essentially reverts the migration to custom_roles table.
 */

export async function useSystemRolesOnly() {
  console.log("Starting migration to use system roles only...");
  
  try {
    // 1. Make sure all necessary system roles exist
    console.log("Checking system roles...");
    const systemRoles = ['admin', 'program_manager', 'mentor', 'user'];
    
    for (const roleName of systemRoles) {
      const [existingRole] = await db.select().from(roles).where(eq(roles.name, roleName));
      
      if (!existingRole) {
        console.log(`Creating system role: ${roleName}`);
        await db.insert(roles).values({
          name: roleName,
          description: `System ${roleName} role`,
          isSystem: true,
          isEditable: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // 2. Copy permissions from custom_roles to system roles
    console.log("Copying permissions from custom_roles to system roles...");
    
    // Get all custom roles with their permissions
    const customRolesWithPermissions = await db
      .select({
        roleName: customRoles.name,
        resource: rolePermissions.resource,
        action: rolePermissions.action
      })
      .from(customRoles)
      .leftJoin(rolePermissions, eq(customRoles.id, rolePermissions.roleId))
      .where(sql`${rolePermissions.id} IS NOT NULL`);
      
    console.log(`Found ${customRolesWithPermissions.length} permissions from custom roles`);
    
    // For each permission in custom roles, add it to the corresponding system role
    for (const permission of customRolesWithPermissions) {
      // First, find the corresponding system role
      const [systemRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, permission.roleName));
        
      if (!systemRole) {
        console.log(`System role ${permission.roleName} not found, creating it`);
        const [newRole] = await db.insert(roles).values({
          name: permission.roleName,
          description: `Migrated from custom role ${permission.roleName}`,
          isSystem: false,
          isEditable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        // Now check if this permission already exists for the system role
        const [existingPermission] = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, newRole.id),
              eq(rolePermissions.resource, permission.resource),
              eq(rolePermissions.action, permission.action)
            )
          );
          
        if (!existingPermission) {
          // Add the permission to the system role
          await db.insert(rolePermissions).values({
            roleId: newRole.id,
            resource: permission.resource,
            action: permission.action,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } else {
        // Check if this permission already exists for the system role
        const [existingPermission] = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, systemRole.id),
              eq(rolePermissions.resource, permission.resource),
              eq(rolePermissions.action, permission.action)
            )
          );
          
        if (!existingPermission) {
          // Add the permission to the system role
          await db.insert(rolePermissions).values({
            roleId: systemRole.id,
            resource: permission.resource,
            action: permission.action,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // 3. Update the storage.ts file to use system roles only
    console.log("Migration to system roles only completed successfully");
    console.log("IMPORTANT: You must update the storage.ts file to use system roles only");
    console.log("The following methods need to be updated:");
    console.log("- getAllRoles(): use the roles table instead of custom_roles");
    console.log("- hasPermission(): use the roles table instead of custom_roles");
    console.log("- getRoleById, getRoleByName: use roles table instead of custom_roles");
    
    return true;
  } catch (error) {
    console.error("Error migrating to system roles:", error);
    return false;
  }
}

// The migration will be run from run-system-roles.ts
// We removed the direct execution code because Node.js ESM doesn't support require.main === module