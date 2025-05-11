import { db } from "./db";

/**
 * Script to update the education table schema to match the new UI requirements
 * This will recreate the education table with the new fields
 */
async function updateEducationSchema() {
  try {
    console.log("Starting education table schema update...");
    
    // Create a backup of the existing education data
    console.log("Creating backup of existing education data...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS education_backup AS 
      SELECT * FROM education;
    `);
    
    // Drop the existing education table
    console.log("Dropping existing education table...");
    await db.execute(`
      DROP TABLE IF EXISTS education CASCADE;
    `);
    
    // Create the new education table with the updated schema
    console.log("Creating new education table with updated schema...");
    await db.execute(`
      CREATE TABLE education (
        id SERIAL PRIMARY KEY,
        youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
        institution TEXT,
        degree_or_certificate TEXT,
        field_of_study TEXT,
        start_date DATE,
        end_date DATE,
        is_currently_attending BOOLEAN DEFAULT false,
        description TEXT,
        certificate_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log("Education table schema updated successfully!");
    
    // Optionally, you could try to migrate some data from the backup
    // to the new table, but this would require mapping old fields to new ones
    
    console.log("Note: Existing education data is preserved in education_backup table.");
    console.log("You may need to manually migrate the data if needed.");
    
  } catch (error) {
    console.error("Error updating education table schema:", error);
  }
}

updateEducationSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });