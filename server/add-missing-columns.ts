// add-missing-columns.ts
import { db } from "./db";
import { sql } from "drizzle-orm";

async function addMissingColumns() {
  try {
    console.log("Adding missing columns to youth_profiles...");
    
    // Add emergency_contact
    await db.execute(sql`
      ALTER TABLE youth_profiles 
      ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
    `);
    
    // Add email if needed
    await db.execute(sql`
      ALTER TABLE youth_profiles 
      ADD COLUMN IF NOT EXISTS email TEXT;
    `);
    
    // Add other missing columns as needed
    
    console.log("Successfully added missing columns");
  } catch (error) {
    console.error("Error adding missing columns:", error);
  }
}

addMissingColumns().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});