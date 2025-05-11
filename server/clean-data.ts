import { db } from './db';
import { users, customRoles, rolePermissions, roleUsers, permissions, businessProfiles, mentors } from '@shared/schema';
import { eq, ne, sql } from 'drizzle-orm';

/**
 * Script to clean up data:
 * 1. Delete role_users associations except for admin
 * 2. Delete all users except admin
 * 3. Delete all custom roles except admin
 * 4. Clean role permissions
 */
export async function cleanData() {
  console.log("Starting data cleanup...");

  try {
    // Step 1: Get admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'dareadmin'));

    if (!adminUser) {
      console.error("Admin user not found. Stopping cleanup.");
      return;
    }
    
    console.log("Admin user found with ID:", adminUser.id);

    // Step 2: Delete all role-user associations (join table)
    console.log("Deleting all role-user associations...");
    await db.execute(sql`DELETE FROM role_users`);
    console.log("Role-user associations deleted");

    // Step 3: Delete all users except admin
    console.log("Deleting non-admin users...");
    await db.execute(sql`DELETE FROM users WHERE username != 'dareadmin'`);
    console.log("Non-admin users deleted");

    // Step 4: Delete all custom roles
    console.log("Deleting all custom roles...");
    await db.execute(sql`DELETE FROM custom_roles`);
    console.log("All custom roles deleted");

    // Step 5: Create the admin role
    console.log("Creating admin role...");
    const [adminRole] = await db.insert(customRoles)
      .values({
        name: 'admin',
        description: 'Administrator with full system access',
        isSystem: true,
        isEditable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Created admin role with ID:", adminRole.id);

    // Step 6: Delete all role permissions
    console.log("Deleting all role permissions...");
    await db.execute(sql`DELETE FROM role_permissions`);
    console.log("Role permissions deleted");

    // Step 7: Update admin user to have admin role
    console.log("Updating admin user role...");
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, adminUser.id));
    console.log("Admin user role updated");

    // Step 8: Delete business_profiles and mentors
    console.log("Deleting business profiles and mentors...");
    await db.delete(businessProfiles);
    await db.delete(mentors);
    console.log("Business profiles and mentors deleted");

    console.log("Data cleanup completed successfully!");
  } catch (error) {
    console.error("Error during data cleanup:", error);
    throw error;
  }
}

// For ESM modules, we always run the script directly
cleanData()
  .then(() => {
    console.log("Cleanup script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Cleanup script failed:", err);
    process.exit(1);
  });