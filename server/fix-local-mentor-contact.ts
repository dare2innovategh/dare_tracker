import { db, pool } from "./db";

/**
 * This script adds the local_mentor_contact column to the youth_profiles table
 * to fix dashboard errors
 */
async function fixLocalMentorContact() {
  console.log("Starting to add local_mentor_contact column to youth_profiles table...");
  
  try {
    // First check if the column exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'local_mentor_contact'
    `);
    
    if (columns.length === 0) {
      console.log("Adding local_mentor_contact column to youth_profiles table...");
      await pool.query(`
        ALTER TABLE youth_profiles
        ADD COLUMN local_mentor_contact TEXT
      `);
      console.log("Added local_mentor_contact column");
    } else {
      console.log("local_mentor_contact column already exists, skipping");
    }
    
    console.log("Youth profiles table has been updated successfully!");
  } catch (error) {
    console.error("Error updating youth_profiles table:", error);
    throw error;
  } finally {
    console.log("Finished youth_profiles table update operation");
  }
}

// Run the function
fixLocalMentorContact()
  .then(() => {
    console.log("Youth profiles local_mentor_contact column addition completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to add local_mentor_contact column to youth_profiles:", error);
    process.exit(1);
  });