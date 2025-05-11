import { db } from "./db";
import { permissions, permissionResourceEnum, permissionActionEnum, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * This script identifies and creates missing permissions by comparing
 * all possible resource-action combinations with existing permissions.
 * It then assigns all newly created permissions to the admin role.
 */
async function generateMissingPermissions() {
  try {
    console.log("Starting generation of missing permissions...");
    
    // Get admin role
    const adminRoleResult = await db.execute(
      `SELECT * FROM roles WHERE name = 'admin' LIMIT 1`
    );
    
    const adminRole = adminRoleResult.rows && adminRoleResult.rows[0] as any;
    
    if (!adminRole) {
      throw new Error("Admin role not found");
    }
    
    console.log(`Found admin role with ID: ${adminRole.id}`);
    
    // Get all existing permissions
    const existingPermissions = await db.select().from(permissions);
    console.log(`Found ${existingPermissions.length} existing permissions in database`);
    
    // Create a set of existing permission keys for quick lookup
    const existingPermissionSet = new Set(
      existingPermissions.map(p => `${p.resource}:${p.action}`)
    );
    
    // Calculate all possible permissions
    const allPossibleResources = permissionResourceEnum.options;
    const allPossibleActions = permissionActionEnum.options;
    
    console.log(`Resources defined in schema: ${allPossibleResources.length}`);
    console.log(`Actions defined in schema: ${allPossibleActions.length}`);
    
    const totalPossible = allPossibleResources.length * allPossibleActions.length;
    console.log(`Total possible permission combinations: ${totalPossible}`);
    
    // Find missing permissions
    const missingPermissions = [];
    
    for (const resource of allPossibleResources) {
      for (const action of allPossibleActions) {
        const permKey = `${resource}:${action}`;
        
        if (!existingPermissionSet.has(permKey)) {
          missingPermissions.push({
            resource,
            action,
            description: `${action} ${resource}`.replace(/_/g, ' ')
          });
        }
      }
    }
    
    console.log(`Found ${missingPermissions.length} missing permissions`);
    
    if (missingPermissions.length === 0) {
      console.log("No missing permissions to create.");
      return {
        adminRoleId: adminRole.id,
        existingPermissions: existingPermissions.length,
        missingPermissions: 0,
        totalPossible
      };
    }
    
    // Create missing permissions
    console.log("Creating missing permissions...");
    
    for (const perm of missingPermissions) {
      try {
        // Insert the permission
        const [newPerm] = await db.insert(permissions)
          .values(perm)
          .returning();
          
        console.log(`Created permission: ${perm.resource}:${perm.action}`);
        
        // Assign to admin role
        await db.insert(rolePermissions)
          .values({
            roleId: adminRole.id,
            role: 'admin',
            resource: perm.resource,
            action: perm.action
          })
          .execute();
        
        console.log(`Assigned permission ${perm.resource}:${perm.action} to admin role`);
      } catch (error) {
        console.error(`Failed to create permission ${perm.resource}:${perm.action}:`, error);
      }
    }
    
    // Verify permissions after creation
    const finalPermissions = await db.select().from(permissions);
    const adminPermissions = await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));
    
    console.log(`After update: ${finalPermissions.length} total permissions in database`);
    console.log(`Admin now has ${adminPermissions.length} assigned permissions`);
    
    return {
      adminRoleId: adminRole.id,
      existingPermissions: existingPermissions.length,
      missingPermissions: missingPermissions.length,
      totalPossible,
      created: finalPermissions.length - existingPermissions.length,
      adminHas: adminPermissions.length
    };
  } catch (error) {
    console.error("Error generating missing permissions:", error);
    throw error;
  }
}

// Run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMissingPermissions()
    .then((result) => {
      console.log("Missing permissions generation completed:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Failed to generate missing permissions:", error);
      process.exit(1);
    });
}

export default generateMissingPermissions;