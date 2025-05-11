import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the location field in makerspaces table
 * This addresses the error "null value in column location of relation makerspaces violates not-null constraint"
 */
async function fixMakerspacesLocation() {
  try {
    console.log("Starting to fix makerspaces location field issue...");
    
    // Check if the makerspaces table exists
    const tableExists = await checkTableExists('makerspaces');
    if (!tableExists) {
      console.log("Makerspaces table doesn't exist. Creating it...");
      await db.execute(sql`
        CREATE TABLE makerspaces (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          address TEXT,
          district TEXT NOT NULL DEFAULT '',
          contact_phone TEXT,
          contact_email TEXT,
          operating_hours TEXT,
          open_date DATE,
          coordinates TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          status TEXT DEFAULT 'Active',
          resource_count INTEGER DEFAULT 0,
          member_count INTEGER DEFAULT 0,
          facilities TEXT
        );
      `);
      console.log("Created makerspaces table without location column");
      return;
    }
    
    // Check if location column exists
    const locationExists = await columnExists('makerspaces', 'location');
    
    if (locationExists) {
      console.log("Location column exists. Removing NOT NULL constraint...");
      
      try {
        // First try to remove the NOT NULL constraint
        await db.execute(sql`
          ALTER TABLE makerspaces ALTER COLUMN location DROP NOT NULL;
        `);
        console.log("Removed NOT NULL constraint from location column");
      } catch (error) {
        console.error("Error removing NOT NULL constraint:", error);
        
        // If that fails, try to set a default value for all NULL locations
        console.log("Trying to set default value for NULL locations...");
        await db.execute(sql`
          UPDATE makerspaces SET location = '' WHERE location IS NULL;
        `);
        console.log("Set default value for NULL locations");
      }
    } else {
      console.log("Location column doesn't exist in makerspaces table. No action needed.");
    }
    
    console.log("Fix completed for makerspaces location field issue");
  } catch (error) {
    console.error("Error fixing makerspaces location field:", error);
    throw error;
  }
}

/**
 * Check if a table exists in the database
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = ${tableName} AND column_name = ${columnName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}

// Run the function
fixMakerspacesLocation().then(() => {
  console.log("Makerspaces location field fix completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during makerspaces location field fix:", err);
  process.exit(1);
});