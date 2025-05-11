/**
 * This script fixes the business_tracking table by adding missing columns:
 * - is_verified (boolean)
 * - verified_by (integer, references users)
 * - verification_date (timestamp)
 * - recorded_by (integer, references users)
 * - mentor_id (integer, references mentors)
 */

import { pool } from "./db";

async function fixBusinessTrackingColumns() {
  console.log("Starting to fix business_tracking table columns...");
  
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query("BEGIN");
    
    // Check if the is_verified column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'is_verified'
    `);
    
    // Add is_verified column if it doesn't exist
    if (checkColumn.rows.length === 0) {
      console.log("Adding is_verified column to business_tracking table...");
      await client.query(`
        ALTER TABLE business_tracking 
        ADD COLUMN is_verified BOOLEAN DEFAULT false
      `);
    }
    
    // Check if the verified_by column exists
    const checkVerifiedBy = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'verified_by'
    `);
    
    // Add verified_by column if it doesn't exist
    if (checkVerifiedBy.rows.length === 0) {
      console.log("Adding verified_by column to business_tracking table...");
      await client.query(`
        ALTER TABLE business_tracking 
        ADD COLUMN verified_by INTEGER REFERENCES users(id)
      `);
    }
    
    // Check if the verification_date column exists
    const checkVerificationDate = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'verification_date'
    `);
    
    // Add verification_date column if it doesn't exist
    if (checkVerificationDate.rows.length === 0) {
      console.log("Adding verification_date column to business_tracking table...");
      await client.query(`
        ALTER TABLE business_tracking 
        ADD COLUMN verification_date TIMESTAMP
      `);
    }
    
    // Check if the recorded_by column exists
    const checkRecordedBy = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'recorded_by'
    `);
    
    // Add recorded_by column if it doesn't exist
    if (checkRecordedBy.rows.length === 0) {
      console.log("Adding recorded_by column to business_tracking table...");
      await client.query(`
        ALTER TABLE business_tracking 
        ADD COLUMN recorded_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id)
      `);
    }
    
    // Check if the mentor_id column exists
    const checkMentorId = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking' AND column_name = 'mentor_id'
    `);
    
    // Add mentor_id column if it doesn't exist
    if (checkMentorId.rows.length === 0) {
      console.log("Adding mentor_id column to business_tracking table...");
      await client.query(`
        ALTER TABLE business_tracking 
        ADD COLUMN mentor_id INTEGER REFERENCES mentors(id)
      `);
    }
    
    // Commit transaction
    await client.query("COMMIT");
    console.log("Successfully fixed business_tracking table columns.");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error fixing business_tracking table columns:", error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the script
fixBusinessTrackingColumns()
  .then(() => {
    console.log("Business tracking table columns fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running business tracking table columns fix:", error);
    process.exit(1);
  });