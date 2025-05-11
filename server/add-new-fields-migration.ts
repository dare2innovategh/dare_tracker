/**
 * Script to add emergency_contact field to youth_profiles and short_term_goals to business_profiles
 * This migration will add the new fields with default values
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

async function addNewFieldsMigration() {
  console.log("Starting migration to add new fields to tables...");
  
  try {
    // Check if emergency_contact column exists in youth_profiles table
    const youthColumnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'emergency_contact'
    `);
    
    // Add emergency_contact column to youth_profiles if it doesn't exist
    if (youthColumnsResult.rows.length === 0) {
      console.log("Adding emergency_contact column to youth_profiles table...");
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN emergency_contact JSONB DEFAULT '{"name":"", "relation":"", "phone":"", "email":"", "address":""}';
      `);
      console.log("Successfully added emergency_contact column to youth_profiles table");
    } else {
      console.log("emergency_contact column already exists in youth_profiles table, skipping");
    }
    
    // Check if short_term_goals column exists in business_profiles table
    const businessColumnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_profiles' AND column_name = 'short_term_goals'
    `);
    
    // Add short_term_goals column to business_profiles if it doesn't exist
    if (businessColumnsResult.rows.length === 0) {
      console.log("Adding short_term_goals column to business_profiles table...");
      await db.execute(sql`
        ALTER TABLE business_profiles 
        ADD COLUMN short_term_goals JSONB DEFAULT '[]';
      `);
      console.log("Successfully added short_term_goals column to business_profiles table");
    } else {
      console.log("short_term_goals column already exists in business_profiles table, skipping");
    }
    
    console.log("Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Allow running this migration directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addNewFieldsMigration()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration script failed:", err);
      process.exit(1);
    });
}

export default addNewFieldsMigration;