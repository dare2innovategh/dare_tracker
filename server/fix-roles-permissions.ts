import { db } from './db';
import { roles, customRoles, rolePermissions, permissions } from "@shared/schema";
import { eq, and, not, sql } from "drizzle-orm";

/**
 * Script to fix all the issues with roles and permissions:
 * 1. Update the rolePermissions table to reference the roles table instead of customRoles
 * 2. Synchronize the data between the two tables
 * 3. Clean up any inconsistencies
 */
export async function fixRolesPermissions() {
  try {
    console.log("Starting roles and permissions fix...");
    
    // STEP 1: Check if roles exist in the system roles table
    console.log("Checking and migrating roles...");
    
    // Get all custom roles
    const customRolesList = await db.select().from(customRoles).execute();
    console.log(`Found ${customRolesList.length} custom roles`);
    
    // Get all system roles
    const systemRolesList = await db.select().from(roles).execute();
    console.log(`Found ${systemRolesList.length} system roles`);
    
    // For each custom role, ensure it exists in the system roles table
    for (const customRole of customRolesList) {
      // Check if the role already exists in the system roles table
      const existingSystemRole = systemRolesList.find(r => r.name === customRole.name);
      
      if (!existingSystemRole) {
        // Create the role in the system roles table
        const [newSystemRole] = await db.insert(roles)
          .values({
            name: customRole.name,
            description: customRole.description,
            isSystem: false,
            isEditable: true,
            createdAt: customRole.createdAt,
            updatedAt: customRole.updatedAt
          })
          .returning()
          .execute();
        
        console.log(`Created system role '${newSystemRole.name}' with ID: ${newSystemRole.id}`);
      } else {
        console.log(`System role '${customRole.name}' already exists with ID: ${existingSystemRole.id}`);
      }
    }
    
    // STEP 2: Fix the role permissions
    console.log("Fixing role permissions...");
    
    // Get updated list of system roles (including newly created ones)
    const updatedSystemRoles = await db.select().from(roles).execute();
    
    // For each system role, find permissions in rolePermissions by role name (in 'role' text field)
    for (const systemRole of updatedSystemRoles) {
      const rolePerms = await db.select()
        .from(rolePermissions)
        .where(eq(rolePermissions.role, systemRole.name))
        .execute();
      
      console.log(`Found ${rolePerms.length} permissions for role '${systemRole.name}' by name`);
      
      // Also look for permissions by roleId that might reference custom roles
      const customRoleWithSameName = customRolesList.find(r => r.name === systemRole.name);
      
      if (customRoleWithSameName) {
        const customRolePerms = await db.select()
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, customRoleWithSameName.id))
          .execute();
        
        console.log(`Found ${customRolePerms.length} permissions for role '${systemRole.name}' by customRole ID`);
        
        // For each permission referencing the custom role ID, update it to use the system role ID
        for (const perm of customRolePerms) {
          // Check if this permission already exists with the system role ID
          const existingPerm = await db.select()
            .from(rolePermissions)
            .where(and(
              eq(rolePermissions.roleId, systemRole.id),
              eq(rolePermissions.resource, perm.resource),
              eq(rolePermissions.action, perm.action)
            ))
            .execute();
          
          if (existingPerm.length === 0) {
            // Update to use the system role ID
            await db.update(rolePermissions)
              .set({ 
                roleId: systemRole.id,
                role: systemRole.name
              })
              .where(eq(rolePermissions.id, perm.id))
              .execute();
            
            console.log(`Updated permission ID ${perm.id} to use system role ID ${systemRole.id}`);
          } else {
            // Delete the duplicate permission
            await db.delete(rolePermissions)
              .where(eq(rolePermissions.id, perm.id))
              .execute();
            
            console.log(`Deleted duplicate permission ID ${perm.id} (already exists with system role ID)`);
          }
        }
      }
    }
    
    // STEP 3: Clean up any null resource/action values in rolePermissions
    console.log("Cleaning up null values in rolePermissions...");
    
    // Find and remove any role permissions with null resource or action
    const nullPermissions = await db.select()
      .from(rolePermissions)
      .where(sql`resource IS NULL OR action IS NULL`)
      .execute();
    
    if (nullPermissions.length > 0) {
      console.log(`Found ${nullPermissions.length} permissions with null resource or action, removing them...`);
      
      await db.delete(rolePermissions)
        .where(sql`resource IS NULL OR action IS NULL`)
        .execute();
    } else {
      console.log("No permissions with null values found");
    }
    
    // Step 4: Make sure all permissions in the database have appropriate roleId
    const allPermissions = await db.select().from(rolePermissions).execute();
    
    for (const perm of allPermissions) {
      // If roleId is missing but role (name) is present, try to fix it
      if (!perm.roleId && perm.role) {
        const systemRole = updatedSystemRoles.find(r => r.name === perm.role);
        
        if (systemRole) {
          await db.update(rolePermissions)
            .set({ roleId: systemRole.id })
            .where(eq(rolePermissions.id, perm.id))
            .execute();
          
          console.log(`Fixed missing roleId for permission ID ${perm.id}, assigned to role '${perm.role}'`);
        } else {
          // Can't fix it, remove it
          await db.delete(rolePermissions)
            .where(eq(rolePermissions.id, perm.id))
            .execute();
          
          console.log(`Removed permission ID ${perm.id} with unknown role '${perm.role}'`);
        }
      }
    }
    
    console.log("Roles and permissions fix completed successfully!");
  } catch (error) {
    console.error("Error fixing roles and permissions:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRolesPermissions()
    .then(() => {
      console.log("Roles and permissions fix script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Roles and permissions fix script failed:", error);
      process.exit(1);
    });
}