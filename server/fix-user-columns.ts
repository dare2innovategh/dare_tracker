import { db, pool } from "./db";

/**
 * This script fixes the users table by adding missing columns
 */
async function fixUserColumns() {
  console.log("Starting to fix users table columns...");
  
  try {
    // First check which columns exist
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columnNames = columns.map(col => col.column_name);
    console.log("Existing columns:", columnNames);
    
    // Add missing columns one by one
    if (!columnNames.includes('is_active')) {
      console.log("Adding is_active column...");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("Added is_active column");
    }
    
    if (!columnNames.includes('last_login')) {
      console.log("Adding last_login column...");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log("Added last_login column");
    }
    
    if (!columnNames.includes('updated_at')) {
      console.log("Adding updated_at column...");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN updated_at TIMESTAMP
      `);
      console.log("Added updated_at column");
    }
    
    console.log("Users table columns have been fixed successfully!");
  } catch (error) {
    console.error("Error fixing users table columns:", error);
    throw error;
  } finally {
    console.log("Finished users table column fix operation");
  }
}

// Run the function
fixUserColumns()
  .then(() => {
    console.log("User table columns fixed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fix user table columns:", error);
    process.exit(1);
  });