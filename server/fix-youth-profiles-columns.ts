import { db, pool } from "./db";

/**
 * This script fixes the youth_profiles table by adding missing columns
 */
async function fixYouthProfilesColumns() {
  console.log("Starting to fix youth_profiles table columns...");
  
  try {
    // First check which columns exist
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles'
    `);
    
    const columnNames = columns.map(col => col.column_name);
    console.log("Existing columns:", columnNames);
    
    // Add missing columns one by one
    if (!columnNames.includes('email')) {
      console.log("Adding email column...");
      await pool.query(`
        ALTER TABLE youth_profiles
        ADD COLUMN email TEXT
      `);
      console.log("Added email column");
    }
    
    console.log("Youth profiles table columns have been fixed successfully!");
  } catch (error) {
    console.error("Error fixing youth_profiles table columns:", error);
    throw error;
  } finally {
    console.log("Finished youth_profiles table column fix operation");
  }
}

// Run the function
fixYouthProfilesColumns()
  .then(() => {
    console.log("Youth profiles table columns fixed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fix youth profiles table columns:", error);
    process.exit(1);
  });