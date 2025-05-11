import { db, pool } from "./db";

/**
 * This script creates the business_tracking table if it doesn't exist
 * to fix dashboard errors
 */
async function createBusinessTrackingTable() {
  console.log("Starting to create business_tracking table...");
  
  try {
    // Check if the table exists
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'business_tracking'
    `);
    
    if (tables.length === 0) {
      console.log("Creating business_tracking table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS business_tracking (
          id SERIAL PRIMARY KEY,
          business_id INTEGER REFERENCES businesses(id),
          month TEXT,
          year INTEGER,
          revenue DECIMAL,
          expenses DECIMAL,
          profit DECIMAL,
          customer_count INTEGER,
          employee_count INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          notes TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_by INTEGER REFERENCES users(id),
          verification_date TIMESTAMP,
          recorded_by INTEGER REFERENCES users(id),
          mentor_id INTEGER REFERENCES mentors(id)
        )
      `);
      console.log("business_tracking table created successfully");
    } else {
      console.log("business_tracking table already exists, skipping");
    }
    
    console.log("business_tracking table operation completed successfully!");
  } catch (error) {
    console.error("Error creating business_tracking table:", error);
    throw error;
  } finally {
    console.log("Finished business_tracking table operation");
  }
}

// Run the function
createBusinessTrackingTable()
  .then(() => {
    console.log("business_tracking table creation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create business_tracking table:", error);
    process.exit(1);
  });