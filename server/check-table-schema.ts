/**
 * Script to check the schema of tables
 * This will report the column structure of the specified tables
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkTableSchema() {
  console.log("Checking table schemas...");
  
  const tablesToCheck = [
    'youth_profiles',
    'youth_training',
    'youth_certifications',
    'certifications',
    'training_programs'
  ];
  
  try {
    for (const tableName of tablesToCheck) {
      console.log(`\nChecking schema for table: ${tableName}`);
      
      try {
        // Check if table exists
        const tableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = ${tableName}
          );
        `);
        
        if (!tableExists.rows[0].exists) {
          console.log(`Table ${tableName} does not exist`);
          continue;
        }
        
        // Get column information
        const columnInfo = await db.execute(sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `);
        
        console.log(`Found ${columnInfo.rowCount} columns in ${tableName}:`);
        
        // Display column details
        for (const col of columnInfo.rows) {
          console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        }
        
        // Check for foreign keys
        const foreignKeys = await db.execute(sql`
          SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = ${tableName};
        `);
        
        if (foreignKeys.rowCount > 0) {
          console.log(`\nForeign keys in ${tableName}:`);
          for (const fk of foreignKeys.rows) {
            console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          }
        } else {
          console.log(`\nNo foreign keys found in ${tableName}`);
        }
        
      } catch (error) {
        console.error(`Error checking schema for ${tableName}:`, error);
      }
    }
    
    return { success: true, message: "Schema check completed" };
  } catch (error) {
    console.error("Error checking table schemas:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Execute the script
checkTableSchema()
  .then((result) => {
    console.log("\nSchema check completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during schema check:", error);
    process.exit(1);
  });