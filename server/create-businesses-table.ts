import { db, pool } from "./db";

/**
 * This script creates the businesses table if it doesn't exist
 */
async function createBusinessesTable() {
  console.log("Starting to create businesses table...");
  
  try {
    // Check if the table exists
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'businesses'
    `);
    
    if (tables.length === 0) {
      console.log("Creating businesses table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          owner_name TEXT,
          business_type TEXT,
          district TEXT,
          town TEXT,
          location_description TEXT,
          phone_number TEXT,
          email TEXT,
          registration_status TEXT,
          years_in_operation INTEGER,
          employee_count INTEGER,
          business_description TEXT,
          challenges TEXT,
          support_needed TEXT,
          goals TEXT,
          short_term_goals TEXT,
          service_category_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          youth_id INTEGER
        )
      `);
      console.log("businesses table created successfully");
    } else {
      console.log("businesses table already exists, skipping");
    }
    
    console.log("businesses table operation completed successfully!");
  } catch (error) {
    console.error("Error creating businesses table:", error);
    throw error;
  } finally {
    console.log("Finished businesses table operation");
  }
}

// Run the function
createBusinessesTable()
  .then(() => {
    console.log("Businesses table creation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create businesses table:", error);
    process.exit(1);
  });