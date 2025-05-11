/**
 * Script to clear all youth profile data from the database
 * This will prepare the database for testing the profile creation process
 */
import { db } from "./db";
import { youthProfiles, youthSkills, education, certifications, youthTraining, businessYouthRelationships } from "@shared/schema";

async function clearYouthProfiles() {
  try {
    console.log("Clearing all youth profile data...");
    
    // Delete data from related tables first to maintain referential integrity
    console.log("Deleting youth skills data...");
    await db.delete(youthSkills);
    
    console.log("Deleting youth education records...");
    await db.delete(education);
    
    console.log("Deleting youth certification records...");
    await db.delete(certifications);
    
    console.log("Deleting youth training records...");
    await db.delete(youthTraining);
    
    console.log("Deleting business-youth relationships...");
    await db.delete(businessYouthRelationships);
    
    // Finally delete the youth profiles
    console.log("Deleting youth profiles...");
    await db.delete(youthProfiles);
    
    console.log("✅ All youth profile data cleared successfully!");
  } catch (error) {
    console.error("Error clearing youth profile data:", error);
  }
}

// Run the function
clearYouthProfiles().then(() => {
  console.log("Youth profile data clearing completed.");
  process.exit(0);
}).catch((err) => {
  console.error("Failed to clear youth profile data:", err);
  process.exit(1);
});