/**
 * This script fixes column names in the database
 * It handles:
 * 1. Rename operational_costs to operating_costs in feasibility_assessments table
 * 2. Rename month to tracking_month in business_tracking table
 * 3. Add parameters column to report_runs table if it doesn't exist
 * 
 * Usage:
 * Run with tsx: npx tsx server/fix-column-names.ts
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

async function fixColumnNames() {
  console.log("Starting column name fixes...");
  
  try {
    // Fix feasibility_assessments table
    console.log("Checking and fixing feasibility_assessments table...");
    const feasibilityColumnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'feasibility_assessments'
    `);
    
    const feasibilityColumns = feasibilityColumnsResult.rows.map(row => row.column_name);
    
    if (feasibilityColumns.includes('operational_costs') && !feasibilityColumns.includes('operating_costs')) {
      console.log("Renaming operational_costs to operating_costs in feasibility_assessments...");
      await db.execute(sql`
        ALTER TABLE feasibility_assessments 
        RENAME COLUMN operational_costs TO operating_costs
      `);
      console.log("Successfully renamed operational_costs to operating_costs");
    } else if (!feasibilityColumns.includes('operating_costs')) {
      console.log("Adding operating_costs column to feasibility_assessments...");
      await db.execute(sql`
        ALTER TABLE feasibility_assessments 
        ADD COLUMN operating_costs TEXT
      `);
      console.log("Successfully added operating_costs column");
    } else {
      console.log("operating_costs column already exists in feasibility_assessments");
    }
    
    // Fix business_tracking table
    console.log("Checking and fixing business_tracking table...");
    const businessTrackingColumnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_tracking'
    `);
    
    const businessTrackingColumns = businessTrackingColumnsResult.rows.map(row => row.column_name);
    
    if (businessTrackingColumns.includes('month') && !businessTrackingColumns.includes('tracking_month')) {
      console.log("Renaming month to tracking_month in business_tracking...");
      await db.execute(sql`
        ALTER TABLE business_tracking 
        RENAME COLUMN month TO tracking_month
      `);
      console.log("Successfully renamed month to tracking_month");
    } else if (!businessTrackingColumns.includes('tracking_month')) {
      console.log("Adding tracking_month column to business_tracking...");
      await db.execute(sql`
        ALTER TABLE business_tracking 
        ADD COLUMN tracking_month DATE
      `);
      console.log("Successfully added tracking_month column");
    } else {
      console.log("tracking_month column already exists in business_tracking");
    }
    
    // Fix report_runs table
    console.log("Checking and fixing report_runs table...");
    
    // First check if the table exists
    const tableExistsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'report_runs'
      ) AS "exists"
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      const reportRunsColumnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'report_runs'
      `);
      
      const reportRunsColumns = reportRunsColumnsResult.rows.map(row => row.column_name);
      
      if (!reportRunsColumns.includes('parameters')) {
        console.log("Adding parameters column to report_runs...");
        await db.execute(sql`
          ALTER TABLE report_runs 
          ADD COLUMN parameters JSONB DEFAULT '{}'
        `);
        console.log("Successfully added parameters column to report_runs");
      } else {
        console.log("parameters column already exists in report_runs");
      }
    } else {
      console.log("Table report_runs does not exist, will be created during migration");
    }
    
    console.log("Column name fixes completed successfully!");
    return {
      success: true,
      message: "Column name fixes completed successfully"
    };
  } catch (error) {
    console.error("Error fixing column names:", error);
    return {
      success: false,
      message: String(error)
    };
  }
}

// Run the function if this script is executed directly (ESM compatible)
// In ESM modules, we can't use require.main === module
// Instead, we check if the file URL is being executed directly
const isMainModule = import.meta.url.endsWith('/fix-column-names.ts');
if (isMainModule) {
  fixColumnNames()
    .then((result) => {
      console.log("Column name fix result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Column name fix error:", error);
      process.exit(1);
    });
}

export { fixColumnNames };