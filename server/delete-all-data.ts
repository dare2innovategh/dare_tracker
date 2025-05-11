/**
 * Script to delete all data from tables
 * This script first queries the database to get actual table names
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function deleteAllData() {
  console.log("Starting to delete all data from tables...");
  
  try {
    // Get all table names from the public schema
    const tablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`Found ${tablesResult.rowCount} tables in the database`);
    
    // Skip the following tables
    const skipTables = ['_prisma_migrations', 'users', 'schema_migrations', 'drizzle_migrations'];
    
    // Process each table
    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      
      // Skip certain tables
      if (skipTables.includes(tableName)) {
        console.log(`Skipping table: ${tableName}`);
        continue;
      }
      
      console.log(`Deleting all data from table: ${tableName}`);
      try {
        // Try regular delete
        const result = await db.execute(sql`DELETE FROM ${sql.identifier(tableName)};`);
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
      } catch (error) {
        console.error(`Error deleting from table ${tableName}:`, error);
      }
    }
    
    console.log("All data deleted successfully!");
    return { success: true, message: "All data deleted successfully" };
  } catch (error) {
    console.error("Error during data deletion:", error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

// Execute the script
deleteAllData()
  .then((result) => {
    console.log("Delete all data operation completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during data deletion:", error);
    process.exit(1);
  });

export { deleteAllData };