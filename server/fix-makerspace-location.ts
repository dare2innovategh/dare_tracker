// Create a file named fix-makerspace-location.ts
import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixMakerspaceLocation() {
  console.log("Checking makerspace table for NOT NULL constraint on location...");
  
  try {
    // Modify the location column to allow NULL values if needed
    await db.execute(sql`
      ALTER TABLE makerspaces 
      ALTER COLUMN location DROP NOT NULL
    `);
    
    console.log("Modified makerspace location column to allow NULL values");
  } catch (error) {
    console.error("Error modifying makerspace location column:", error);
  }
}

// Run directly if executed as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMakerspaceLocation()
    .then(() => {
      console.log("Makerspace location fix completed");
      process.exit(0);
    })
    .catch(err => {
      console.error("Error:", err);
      process.exit(1);
    });
}

export { fixMakerspaceLocation };