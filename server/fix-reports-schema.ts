import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the reports table schema in local environment
 * This addresses the error "Failed to load reports: 500"
 */
async function fixReportsSchema() {
  try {
    console.log("Starting to check/fix reports table schema...");
    
    // First, check if the reports table exists
    const tableExists = await checkTableExists('reports');
    if (!tableExists) {
      console.log("Reports table doesn't exist, creating it...");
      await createReportsTable();
      return;
    }
    
    // Check required columns and add them if missing
    console.log("Checking for missing columns in reports table...");
    
    // Check title column
    await addColumnIfNotExists('reports', 'title', 'TEXT');
    
    // Check other required columns
    await addColumnIfNotExists('reports', 'report_type', 'TEXT');
    await addColumnIfNotExists('reports', 'is_template', 'BOOLEAN', 'DEFAULT FALSE');
    await addColumnIfNotExists('reports', 'filters', 'JSONB', 'DEFAULT \'{}\'');
    await addColumnIfNotExists('reports', 'columns', 'JSONB', 'DEFAULT \'[]\'');
    await addColumnIfNotExists('reports', 'created_at', 'TIMESTAMP', 'DEFAULT NOW()');
    
    // Check if the report_runs table exists
    const runsTableExists = await checkTableExists('report_runs');
    if (!runsTableExists) {
      console.log("Report runs table doesn't exist, creating it...");
      await createReportRunsTable();
    }
    
    console.log("Reports schema check completed");
  } catch (error) {
    console.error("Error fixing reports schema:", error);
    throw error;
  }
}

/**
 * Check if a table exists in the database
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Add a column to a table if it doesn't exist
 */
async function addColumnIfNotExists(
  tableName: string, 
  columnName: string, 
  dataType: string,
  defaultValue: string = ''
): Promise<void> {
  try {
    // Check if column exists
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = ${tableName} AND column_name = ${columnName}
      );
    `);
    
    if (columnExists.rows.length > 0 && !columnExists.rows[0].exists) {
      console.log(`Adding missing column ${columnName} to ${tableName}...`);
      
      // Add column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE ${sql.identifier(tableName)} 
        ADD COLUMN IF NOT EXISTS ${sql.identifier(columnName)} ${sql.raw(dataType)} ${sql.raw(defaultValue)};
      `);
      
      console.log(`Added column ${columnName} to ${tableName}`);
    } else {
      console.log(`Column ${columnName} already exists in ${tableName}`);
    }
  } catch (error) {
    console.error(`Error adding column ${columnName} to ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create the reports table if it doesn't exist
 */
async function createReportsTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        report_type TEXT NOT NULL,
        is_template BOOLEAN DEFAULT FALSE,
        filters JSONB DEFAULT '{}',
        columns JSONB DEFAULT '[]',
        sort_by TEXT,
        sort_direction TEXT DEFAULT 'asc',
        group_by TEXT,
        chart_options JSONB DEFAULT '{}',
        report_period TEXT,
        start_date DATE,
        end_date DATE,
        created_by INTEGER,
        last_run_by INTEGER,
        last_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);
    console.log("Created reports table");
  } catch (error) {
    console.error("Error creating reports table:", error);
    throw error;
  }
}

/**
 * Create the report_runs table if it doesn't exist
 */
async function createReportRunsTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS report_runs (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id),
        status TEXT NOT NULL DEFAULT 'pending',
        format TEXT NOT NULL,
        file_path TEXT,
        error_message TEXT,
        run_by INTEGER,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        report_data JSONB DEFAULT '[]'
      );
    `);
    console.log("Created report_runs table");
  } catch (error) {
    console.error("Error creating report_runs table:", error);
    throw error;
  }
}

// Run the function
fixReportsSchema().then(() => {
  console.log("Reports schema fix completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during reports schema fix:", err);
  process.exit(1);
});