import { db, pool } from "./db";

/**
 * This script adds the onboarded_to_tracker column to the youth_profiles table
 * to fix dashboard errors
 */
async function fixOnboardedToTracker() {
  console.log("Starting to add onboarded_to_tracker column to youth_profiles table...");
  
  try {
    // First check if the column exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'onboarded_to_tracker'
    `);
    
    if (columns.length === 0) {
      console.log("Adding onboarded_to_tracker column to youth_profiles table...");
      await pool.query(`
        ALTER TABLE youth_profiles
        ADD COLUMN onboarded_to_tracker BOOLEAN DEFAULT FALSE
      `);
      console.log("Added onboarded_to_tracker column");
    } else {
      console.log("onboarded_to_tracker column already exists, skipping");
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
fixOnboardedToTracker()
  .then(() => {
    console.log("Youth profiles onboarded_to_tracker column addition completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to add onboarded_to_tracker column to youth_profiles:", error);
    process.exit(1);
  });