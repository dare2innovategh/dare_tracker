import { db, pool } from "./db";

/**
 * This script creates the mentors table if it doesn't exist
 */
async function createMentorsTable() {
  console.log("Starting to create mentors table...");
  
  try {
    // Check if the table exists
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'mentors'
    `);
    
    if (tables.length === 0) {
      console.log("Creating mentors table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mentors (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id),
          email TEXT,
          phone TEXT,
          profile_picture TEXT,
          specialization TEXT,
          bio TEXT,
          assigned_district TEXT,
          assigned_districts JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("mentors table created successfully");
    } else {
      console.log("mentors table already exists, skipping");
    }
    
    console.log("mentors table operation completed successfully!");
  } catch (error) {
    console.error("Error creating mentors table:", error);
    throw error;
  } finally {
    console.log("Finished mentors table operation");
  }
}

// Run the function
createMentorsTable()
  .then(() => {
    console.log("Mentors table creation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create mentors table:", error);
    process.exit(1);
  });