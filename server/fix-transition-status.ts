import { db, pool } from "./db";

/**
 * This script adds the transition_status column to the youth_profiles table
 * to fix dashboard errors
 */
async function fixTransitionStatus() {
  console.log("Starting to fix youth_profiles table by adding transition_status column...");
  
  try {
    // First check if the column exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'transition_status'
    `);
    
    if (columns.length === 0) {
      console.log("Adding transition_status column to youth_profiles table...");
      await pool.query(`
        ALTER TABLE youth_profiles
        ADD COLUMN transition_status TEXT
      `);
      console.log("Added transition_status column");
    } else {
      console.log("transition_status column already exists, skipping");
    }
    
    console.log("youth_profiles table has been fixed successfully!");
  } catch (error) {
    console.error("Error fixing youth_profiles table:", error);
    throw error;
  } finally {
    console.log("Finished youth_profiles table fix operation");
  }
}

// Run the function
fixTransitionStatus()
  .then(() => {
    console.log("youth_profiles transition_status column fix completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fix youth_profiles transition_status column:", error);
    process.exit(1);
  });