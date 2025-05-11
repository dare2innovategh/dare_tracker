/**
 * Script to clear all user and mentor tables except the admin account
 * This will allow us to restart the user and mentor management from scratch
 */
import { db } from "./db";
import { eq, not, or } from "drizzle-orm";
import { users, mentors, mentorBusinessRelationships } from "@shared/schema";

async function cleanUsersAndMentors() {
  try {
    console.log("Starting cleanup of user and mentor data...");
    
    // First, find admin user IDs to preserve
    const adminUsers = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    
    const adminUserIds = adminUsers.map(user => user.id);
    
    if (adminUserIds.length === 0) {
      console.error("No admin users found. Aborting to prevent deleting all users.");
      return;
    }
    
    console.log(`Found ${adminUserIds.length} admin users to preserve:`, adminUserIds);
    
    // Clean up relations first (due to foreign key constraints)
    console.log("Removing mentor-business relationships...");
    await db.delete(mentorBusinessRelationships);
    
    // Delete all mentors
    console.log("Removing all mentor profiles...");
    await db.delete(mentors);
    
    // Delete all users except admins
    console.log("Removing all non-admin users...");
    
    // Handle the case when there are no admin IDs to preserve
    if (adminUserIds.length === 0) {
      console.warn("No admin IDs found to preserve, skipping user deletion");
      return;
    }
    
    const deleteResult = await db.delete(users)
      .where(
        not(
          or(...adminUserIds.map(id => eq(users.id, id)))
        )
      );
    
    console.log("Cleanup completed successfully!");
    console.log("You can now recreate users and mentors from scratch.");
    
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Execute the function directly
cleanUsersAndMentors()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });

export { cleanUsersAndMentors };