import { db, pool } from "./db";

/**
 * This script adds the short_term_goals column to the businesses table
 */
async function addShortTermGoals() {
  console.log("Starting to add short_term_goals column to businesses table...");
  
  try {
    // First check if the column exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' AND column_name = 'short_term_goals'
    `);
    
    if (columns.length === 0) {
      console.log("Adding short_term_goals column to businesses table...");
      await pool.query(`
        ALTER TABLE businesses
        ADD COLUMN short_term_goals TEXT
      `);
      console.log("Added short_term_goals column");
    } else {
      console.log("short_term_goals column already exists, skipping");
    }
    
    // Also check if column exists in business_profiles
    const { rows: bpColumns } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'business_profiles'
    `);
    
    if (bpColumns.length > 0) {
      // Check if short_term_goals column exists in business_profiles
      const { rows: bpGoalsColumns } = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'business_profiles' AND column_name = 'short_term_goals'
      `);
      
      if (bpGoalsColumns.length === 0) {
        console.log("Adding short_term_goals column to business_profiles table...");
        await pool.query(`
          ALTER TABLE business_profiles
          ADD COLUMN short_term_goals TEXT
        `);
        console.log("Added short_term_goals column to business_profiles");
      } else {
        console.log("short_term_goals column already exists in business_profiles, skipping");
      }
    }
    
    console.log("Businesses table has been updated successfully!");
  } catch (error) {
    console.error("Error updating businesses table:", error);
    throw error;
  } finally {
    console.log("Finished businesses table update operation");
  }
}

// Run the function
addShortTermGoals()
  .then(() => {
    console.log("Short term goals column addition completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to add short_term_goals column:", error);
    process.exit(1);
  });