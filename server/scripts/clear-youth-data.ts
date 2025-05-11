import { db } from "../db";
import {
  youthProfiles,
  education,
  youthSkills,
  certifications,
  youthTraining
} from "@shared/schema";

/**
 * Script to clear all youth profile data from the database
 * This allows starting fresh with manual profile creation for testing
 */
async function clearYouthData() {
  console.log("Starting to clear all youth profile data...");

  try {
    // Start with tables that have foreign key constraints
    console.log("Clearing youth skills records...");
    await db.delete(youthSkills);
    
    console.log("Clearing youth education records...");
    await db.delete(education);
    
    console.log("Clearing youth certifications...");
    await db.delete(certifications);
    
    console.log("Clearing youth training records...");
    await db.delete(youthTraining);
    
    // Finally clear the main profiles table
    console.log("Clearing youth profiles...");
    await db.delete(youthProfiles);
    
    console.log("All youth data has been cleared successfully!");
    
  } catch (error) {
    console.error("Error clearing youth data:", error);
    throw error;
  }
}

// When using ES modules, we don't have require.main
// Instead, we export the function to be called from other files
// The script can be run directly using ts-node or similar tools
// but we'll primarily call it from the admin API route

export { clearYouthData };