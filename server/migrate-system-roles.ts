import { db } from './db';
import { roles, customRoles, rolePermissions } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Script to migrate system roles (except Admin) to custom_roles
 * Admin role will be kept as it should be protected and automatically receive all permissions
 */
export async function migrateSystemRoles() {
  try {
    console.log("Starting system roles migration...");
    
    // 1. Get all roles from the roles table except admin
    const systemRoles = await db.select()
      .from(roles)
      .where(sql`LOWER(name) != 'admin'`)
      .execute();
    
    console.log(`Found ${systemRoles.length} system roles to migrate`);
    
    if (systemRoles.length === 0) {
      console.log("No system roles to migrate.");
      return;
    }
    
    // 2. For each role, check if it already exists in custom_roles
    for (const role of systemRoles) {
      const existingCustomRole = await db.select()
        .from(customRoles)
        .where(eq(customRoles.name, role.name))
        .execute();
      
      if (existingCustomRole.length > 0) {
        console.log(`Custom role '${role.name}' already exists, skipping.`);
        continue;
      }
      
      // 3. Insert the role into custom_roles
      const [newCustomRole] = await db.insert(customRoles)
        .values({
          name: role.name,
          description: role.description || `${role.name} role`,
          isSystem: false, // Make it editable
          isEditable: true,
          createdAt: role.createdAt || new Date(),
          updatedAt: role.updatedAt || new Date()
        })
        .returning()
        .execute();
      
      console.log(`Migrated '${role.name}' to custom_roles with ID: ${newCustomRole.id}`);
      
      // 4. Find any role permissions for this role and migrate them
      const rolePerms = await db.select()
        .from(rolePermissions)
        .where(eq(rolePermissions.role, role.name))
        .execute();
      
      if (rolePerms.length > 0) {
        console.log(`Found ${rolePerms.length} permissions for role '${role.name}'`);
        
        // Update permissions to use the new custom role ID
        for (const perm of rolePerms) {
          await db.update(rolePermissions)
            .set({ 
              roleId: newCustomRole.id,
              // Keep other fields the same
              role: perm.role,
              resource: perm.resource,
              action: perm.action
            })
            .where(eq(rolePermissions.id, perm.id))
            .execute();
        }
        
        console.log(`Updated ${rolePerms.length} permissions for role '${role.name}'`);
      } else {
        console.log(`No permissions found for role '${role.name}'`);
      }
    }
    
    console.log("System roles migration completed successfully!");
  } catch (error) {
    console.error("Error migrating system roles:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSystemRoles()
    .then(() => {
      console.log("System roles migration script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("System roles migration script failed:", error);
      process.exit(1);
    });
}