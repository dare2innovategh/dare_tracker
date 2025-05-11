import { db, pool } from "./db";

/**
 * This script fixes the service_category column in the businesses table
 */
async function fixServiceCategory() {
  console.log("Starting to fix service_category column in businesses table...");
  
  try {
    // First check if the service_category column exists
    const { rows: columnsCategory } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' AND column_name = 'service_category'
    `);
    
    // Now check if service_category_id column exists
    const { rows: columnsCategoryId } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' AND column_name = 'service_category_id'
    `);
    
    if (columnsCategory.length === 0 && columnsCategoryId.length > 0) {
      // service_category doesn't exist but service_category_id does, so add service_category
      console.log("Adding service_category column to businesses table...");
      await pool.query(`
        ALTER TABLE businesses
        ADD COLUMN service_category TEXT
      `);
      console.log("Added service_category column");
      
      // Copy values from service_category_id to service_category
      console.log("Copying values from service_category_id to service_category...");
      await pool.query(`
        UPDATE businesses 
        SET service_category = service_category_id::text
        WHERE service_category_id IS NOT NULL
      `);
      console.log("Values copied successfully");
    } else if (columnsCategory.length > 0) {
      console.log("service_category column already exists, skipping");
    } else if (columnsCategoryId.length === 0) {
      // Neither column exists, add both
      console.log("Adding both service_category and service_category_id columns...");
      await pool.query(`
        ALTER TABLE businesses
        ADD COLUMN service_category TEXT,
        ADD COLUMN service_category_id INTEGER
      `);
      console.log("Added both columns");
    }
    
    console.log("Businesses table has been updated successfully!");
  } catch (error) {
    console.error("Error updating businesses table:", error);
    throw error;
  } finally {
    console.log("Finished businesses table update operation");
  }
}

// Run the function
fixServiceCategory()
  .then(() => {
    console.log("Service category column fix completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fix service category column:", error);
    process.exit(1);
  });