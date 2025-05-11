import { db } from './db';
import { permissions, roles, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * This script updates the admin role to have all permissions
 */
async function updateAdminPermissions() {
  try {
    console.log("Starting to update admin permissions...");
    
    // 1. Get the admin role
    const [adminRole] = await db.select().from(roles).where(eq(roles.name, 'admin'));
    if (!adminRole) {
      throw new Error("Admin role not found");
    }
    
    console.log(`Found admin role with ID: ${adminRole.id}`);
    
    // 2. Get all permissions
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions in the database:`);
    
    // Print all resources and actions
    const resources = new Set(allPermissions.map(p => p.resource));
    console.log('Resources:', Array.from(resources));
    
    // Count actions for each resource
    const actionsByResource: Record<string, string[]> = {};
    for (const perm of allPermissions) {
      if (!actionsByResource[perm.resource]) {
        actionsByResource[perm.resource] = [];
      }
      actionsByResource[perm.resource].push(perm.action);
    }
    
    // Print counts
    Object.entries(actionsByResource).forEach(([resource, actions]) => {
      console.log(`Resource '${resource}' has ${actions.length} actions: ${actions.join(', ')}`);
    });
    
    // 3. Delete any existing admin permissions
    const deletedPerms = await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id))
      .returning();
    
    console.log(`Deleted ${deletedPerms.length} existing admin permissions`);
    
    // 4. Add all permissions to admin
    console.log("Adding all permissions to admin role...");
    
    for (const perm of allPermissions) {
      await db.insert(rolePermissions)
        .values({
          roleId: adminRole.id,
          role: 'admin',
          resource: perm.resource,
          action: perm.action,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute();
    }
    
    console.log(`Added ${allPermissions.length} permissions to admin role`);
    
    // 5. Verify admin permissions
    const adminPerms = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));
    
    console.log(`Admin now has ${adminPerms.length} permissions`);
    
    if (adminPerms.length === allPermissions.length) {
      console.log("SUCCESS: Admin role has all permissions");
    } else {
      console.log("WARNING: Admin role doesn't have all permissions");
      
      // Find missing permissions
      const adminPermSet = new Set(adminPerms.map(p => `${p.resource}:${p.action}`));
      const missingPerms = allPermissions.filter(p => 
        !adminPermSet.has(`${p.resource}:${p.action}`)
      );
      
      console.log(`Missing permissions: ${missingPerms.map(p => `${p.resource}:${p.action}`).join(', ')}`);
    }
    
    console.log("Admin permissions update completed");
  } catch (error) {
    console.error("Error updating admin permissions:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAdminPermissions()
    .then(() => {
      console.log("Admin permissions update completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Admin permissions update failed:", error);
      process.exit(1);
    });
}