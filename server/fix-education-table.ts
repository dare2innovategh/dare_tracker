import { db } from "./db";

/**
 * Script to create the education table with the correct schema
 * This will ensure the table structure matches our schema definition in schema.ts
 */
async function fixEducationTable() {
  try {
    console.log("Starting education table check and fix...");
    
    // Check if the education table exists
    const tableExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'education'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log("Education table exists. Checking structure...");
      
      // Check if qualificationType column exists
      const qualificationTypeExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'education' AND column_name = 'qualification_type'
        );
      `);
      
      if (!qualificationTypeExists.rows[0].exists) {
        console.log("Education table structure doesn't match schema. Recreating table...");
        
        // Create backup of existing data if any
        await db.execute(`
          CREATE TABLE IF NOT EXISTS education_backup AS 
          SELECT * FROM education;
        `);
        console.log("Backed up existing education data to education_backup.");
        
        // Drop and recreate the education table
        await db.execute(`
          DROP TABLE IF EXISTS education CASCADE;
        `);
        
        // Create the new education table based on our schema definition
        await db.execute(`
          CREATE TABLE education (
            id SERIAL PRIMARY KEY,
            youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
            qualification_type TEXT NOT NULL,
            qualification_name TEXT NOT NULL,
            specialization TEXT,
            level_completed TEXT,
            institution TEXT,
            graduation_year INTEGER,
            is_highest_qualification BOOLEAN DEFAULT false,
            certificate_url TEXT,
            qualification_status TEXT DEFAULT 'Completed',
            additional_details TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP
          );
        `);
        
        console.log("Education table recreated successfully with correct schema.");
      } else {
        console.log("Education table has the correct structure. No changes needed.");
      }
    } else {
      console.log("Education table doesn't exist. Creating it now...");
      
      // Create the education table
      await db.execute(`
        CREATE TABLE education (
          id SERIAL PRIMARY KEY,
          youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
          qualification_type TEXT NOT NULL,
          qualification_name TEXT NOT NULL,
          specialization TEXT,
          level_completed TEXT,
          institution TEXT,
          graduation_year INTEGER,
          is_highest_qualification BOOLEAN DEFAULT false,
          certificate_url TEXT,
          qualification_status TEXT DEFAULT 'Completed',
          additional_details TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      
      console.log("Education table created successfully.");
    }
  } catch (error) {
    console.error("Error fixing education table:", error);
  }
}

// Execute the function
fixEducationTable()
  .then(() => {
    console.log("Education table fix completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running education table fix:", error);
    process.exit(1);
  });