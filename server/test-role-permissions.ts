import { db } from './db';
import { storage } from './storage';
import { roles, rolePermissions, permissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Script to test that role permissions system is working correctly:
 * 1. Create a test role
 * 2. Add permissions to it
 * 3. Check that permissions are correctly assigned
 * 4. Delete the test role and its permissions
 */
async function testRolePermissions() {
  try {
    console.log("Starting role permissions test...");
    
    // Step 1: Create a test role
    const testRoleName = "test_role_" + Date.now();
    console.log(`Creating test role: ${testRoleName}`);
    
    const [testRole] = await db.insert(roles)
      .values({
        name: testRoleName,
        description: "Test role for permission system",
        isSystem: false,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Created test role with ID: ${testRole.id}`);
    
    // Step 2: Add permissions to the test role
    const permissionData = [
      { resource: "users", action: "view" },
      { resource: "youth_profiles", action: "view" },
      { resource: "youth_profiles", action: "edit" }
    ];
    
    for (const perm of permissionData) {
      console.log(`Adding permission: ${perm.resource}:${perm.action} to role ${testRoleName}`);
      
      const createdPermission = await storage.createRolePermission({
        role: testRoleName,
        resource: perm.resource as any,
        action: perm.action as any
      });
      
      console.log(`Added permission with ID: ${createdPermission.id}`);
    }
    
    // Step 3: Check permissions of the test role
    console.log(`Getting permissions for role ${testRoleName}`);
    const rolePerms = await storage.getRolePermissionsByRole(testRoleName);
    
    console.log(`Found ${rolePerms.length} permissions for role ${testRoleName}:`);
    rolePerms.forEach(perm => {
      console.log(`- ${perm.resource}:${perm.action} (ID: ${perm.id})`);
    });
    
    // Check each expected permission
    let allPermissionsCorrect = true;
    for (const perm of permissionData) {
      const hasPermission = await storage.hasPermission(testRoleName, perm.resource, perm.action);
      console.log(`Role ${testRoleName} has permission ${perm.resource}:${perm.action}: ${hasPermission}`);
      
      if (!hasPermission) {
        allPermissionsCorrect = false;
        console.error(`ERROR: Role ${testRoleName} should have permission ${perm.resource}:${perm.action}`);
      }
    }
    
    // Check a permission the role should NOT have
    const shouldNotHavePermission = await storage.hasPermission(testRoleName, "roles", "delete");
    console.log(`Role ${testRoleName} has permission roles:delete: ${shouldNotHavePermission}`);
    
    if (shouldNotHavePermission) {
      allPermissionsCorrect = false;
      console.error(`ERROR: Role ${testRoleName} should NOT have permission roles:delete`);
    }
    
    // Step 4: Delete the test role and its permissions
    console.log(`Cleaning up - deleting role ${testRoleName} and its permissions`);
    await storage.deleteAllRolePermissions(testRoleName);
    
    const [deletedRole] = await db.delete(roles)
      .where(eq(roles.id, testRole.id))
      .returning();
    
    console.log(`Deleted role: ${deletedRole.name}`);
    
    // Verification of deletion
    const roleAfterDeletion = await storage.getRoleByName(testRoleName);
    console.log(`Role ${testRoleName} exists after deletion: ${!!roleAfterDeletion}`);
    
    const permsAfterDeletion = await storage.getRolePermissionsByRole(testRoleName);
    console.log(`Permissions count after deletion: ${permsAfterDeletion.length}`);
    
    // Final result
    if (allPermissionsCorrect && !roleAfterDeletion && permsAfterDeletion.length === 0) {
      console.log("TEST PASSED: Role permissions system is working correctly!");
      return true;
    } else {
      console.error("TEST FAILED: Role permissions system has issues.");
      return false;
    }
  } catch (error) {
    console.error("Error testing role permissions:", error);
    return false;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  testRolePermissions()
    .then(success => {
      console.log(`Test ${success ? 'succeeded' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}