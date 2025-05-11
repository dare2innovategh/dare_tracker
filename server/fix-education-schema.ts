import { db } from "./db";

/**
 * Script to add the otherQualifications column to the education table
 * This will update the database schema to match our new education model
 */
async function fixEducationSchema() {
  try {
    console.log("Starting education table schema update...");
    
    // Check if the column already exists
    try {
      await db.execute(`
        SELECT other_qualifications FROM education LIMIT 1;
      `);
      console.log("otherQualifications column already exists. No changes needed.");
      return;
    } catch (error) {
      console.log("otherQualifications column doesn't exist. Adding it now...");
      
      // Add the otherQualifications column
      await db.execute(`
        ALTER TABLE education 
        ADD COLUMN other_qualifications JSONB DEFAULT '[]'::jsonb;
      `);
      
      // Add the updatedAt column if it doesn't exist
      try {
        await db.execute(`
          SELECT updated_at FROM education LIMIT 1;
        `);
        console.log("updatedAt column already exists.");
      } catch (error) {
        console.log("Adding updatedAt column...");
        await db.execute(`
          ALTER TABLE education 
          ADD COLUMN updated_at TIMESTAMPTZ;
        `);
      }
      
      console.log("Education table schema updated successfully!");
    }
  } catch (error) {
    console.error("Error updating education table schema:", error);
  }
}

fixEducationSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });