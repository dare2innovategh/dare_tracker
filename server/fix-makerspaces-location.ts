import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the makerspaces table schema for the location column issue
 * This addresses the error "null value in column location of relation makerspaces violates not-null constraint"
 */
async function fixMakerspacesLocation() {
  try {
    console.log("Starting to fix makerspaces location column issue...");
    
    // Check the structure of the makerspaces table
    console.log("Checking current makerspaces table structure...");
    const tableStructure = await db.execute(sql`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'makerspaces'
      ORDER BY ordinal_position;
    `);
    
    console.log("Makerspaces table columns:");
    tableStructure.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    // Check if location column exists and is NOT NULL
    const locationColumn = tableStructure.rows.find(col => col.column_name === 'location');
    
    if (locationColumn) {
      console.log("Location column exists. Modifying to allow NULL values...");
      
      // Alter the location column to allow NULL values
      await db.execute(sql`
        ALTER TABLE makerspaces ALTER COLUMN location DROP NOT NULL;
      `);
      console.log("Location column modified to allow NULL values");
    } else {
      console.log("Location column doesn't exist. Adding it with NULL allowed...");
      
      // Add the location column with NULL allowed
      await db.execute(sql`
        ALTER TABLE makerspaces ADD COLUMN location TEXT;
      `);
      console.log("Location column added with NULL allowed");
    }
    
    // Update the INSERT query in our application
    console.log("To fix the application code, update the INSERT query in server/routes/makerspaces.ts to include the location column.");
    console.log("Changed line should be:");
    console.log("  (name, address, district, description, coordinates, contact_phone, contact_email, operating_hours, open_date, created_at, updated_at, location)");
    console.log("VALUES:");
    console.log("  (..., ${validatedData.address || null})");
    
    console.log("Fix for makerspaces location column completed");
  } catch (error) {
    console.error("Error fixing makerspaces location column:", error);
    throw error;
  }
}

// Run the function
fixMakerspacesLocation().then(() => {
  console.log("Makerspaces location column fix completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during makerspaces location fix:", err);
  process.exit(1);
});