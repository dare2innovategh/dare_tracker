import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to add missing columns to tables in local environment
 * This script fixes the "column does not exist" errors by adding
 * the missing columns directly with SQL
 */
async function fixLocalMissingColumns() {
  try {
    console.log("Starting to add missing columns to local database...");
    
    // Fix for "column emergency_contact does not exist"
    console.log("Adding emergency_contact to youth_profiles...");
    await db.execute(sql`
      ALTER TABLE youth_profiles 
      ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
    `);
    
    // Fix for "column email does not exist"
    console.log("Adding email to youth_profiles...");
    await db.execute(sql`
      ALTER TABLE youth_profiles 
      ADD COLUMN IF NOT EXISTS email TEXT;
    `);
    
    // Add other commonly missing columns based on schema updates
    console.log("Adding other potentially missing columns...");
    await db.execute(sql`
      ALTER TABLE youth_profiles 
      ADD COLUMN IF NOT EXISTS transition_status TEXT,
      ADD COLUMN IF NOT EXISTS onboarded_to_tracker BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS local_mentor_name TEXT,
      ADD COLUMN IF NOT EXISTS local_mentor_contact TEXT;
    `);
    
    // Add short_term_goals to business_profiles
    console.log("Adding short_term_goals to business_profiles...");
    await db.execute(sql`
      ALTER TABLE business_profiles 
      ADD COLUMN IF NOT EXISTS short_term_goals JSONB DEFAULT '[]';
    `);
    
    console.log("Successfully added all missing columns");
  } catch (error) {
    console.error("Error adding missing columns:", error);
    throw error;
  }
}

// Run the function
fixLocalMissingColumns().then(() => {
  console.log("Local database schema fix completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during local schema fix:", err);
  process.exit(1);
});