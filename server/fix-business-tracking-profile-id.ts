import { db, pool } from "./db";

/**
 * This script adds the profile_id column to the business_tracking table
 * to fix dashboard errors
 */
async function fixBusinessTrackingProfileId() {
  console.log("Starting to add profile_id column to business_tracking table...");
  
  try {
    // First check if the column exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'profile_id'
    `);
    
    if (columns.length === 0) {
      console.log("Adding profile_id column to business_tracking table...");
      await pool.query(`
        ALTER TABLE business_tracking
        ADD COLUMN profile_id INTEGER
      `);
      console.log("Added profile_id column");
    } else {
      console.log("profile_id column already exists, skipping");
    }
    
    console.log("business_tracking table has been updated successfully!");
  } catch (error) {
    console.error("Error updating business_tracking table:", error);
    throw error;
  } finally {
    console.log("Finished business_tracking table update operation");
  }
}

// Run the function
fixBusinessTrackingProfileId()
  .then(() => {
    console.log("business_tracking profile_id column addition completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to add profile_id column to business_tracking:", error);
    process.exit(1);
  });