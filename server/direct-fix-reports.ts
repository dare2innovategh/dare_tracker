import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to directly fix the reports table schema issues
 * This uses raw SQL to ensure columns exist regardless of schema definitions
 */
async function directFixReports() {
  try {
    console.log("Starting direct fix for reports table...");
    
    // Check if table exists, if not create it
    const tableExists = await checkTableExists('reports');
    if (!tableExists) {
      console.log("Reports table doesn't exist, creating it with all required columns...");
      await db.execute(sql`
        CREATE TABLE reports (
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
      
      console.log("Created reports table with all required columns");
      
      // Seed default templates
      await seedDefaultTemplates();
      return;
    }
    
    // Ensure all necessary columns exist
    console.log("Reports table exists, ensuring all required columns are present...");
    
    const columnsToCheck = [
      { name: 'title', type: 'TEXT NOT NULL DEFAULT \'Report\'' },
      { name: 'description', type: 'TEXT' },
      { name: 'report_type', type: 'TEXT NOT NULL DEFAULT \'custom\'' },
      { name: 'is_template', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'filters', type: 'JSONB DEFAULT \'{}\''},
      { name: 'columns', type: 'JSONB DEFAULT \'[]\''},
      { name: 'sort_by', type: 'TEXT' },
      { name: 'sort_direction', type: 'TEXT DEFAULT \'asc\'' },
      { name: 'group_by', type: 'TEXT' },
      { name: 'chart_options', type: 'JSONB DEFAULT \'{}\''},
      { name: 'report_period', type: 'TEXT' },
      { name: 'start_date', type: 'DATE' },
      { name: 'end_date', type: 'DATE' },
      { name: 'created_by', type: 'INTEGER' },
      { name: 'last_run_by', type: 'INTEGER' },
      { name: 'last_run_at', type: 'TIMESTAMP' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updatedAt', type: 'TIMESTAMP' } // Note this mixed case column name
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('reports', column.name, column.type);
    }
    
    // Check if there are any templates
    const templatesExist = await checkTemplatesExist();
    if (!templatesExist) {
      console.log("No report templates found, seeding defaults...");
      await seedDefaultTemplates();
    }
    
    console.log("Direct fix for reports table completed successfully");
  } catch (error) {
    console.error("Error fixing reports table:", error);
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
  dataType: string
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
        ADD COLUMN IF NOT EXISTS ${sql.identifier(columnName)} ${sql.raw(dataType)};
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
 * Check if any report templates exist
 */
async function checkTemplatesExist(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) FROM reports WHERE is_template = TRUE;
    `);
    
    return result.rows.length > 0 && parseInt(result.rows[0].count, 10) > 0;
  } catch (error) {
    console.error("Error checking if report templates exist:", error);
    return false;
  }
}

/**
 * Seed default report templates
 */
async function seedDefaultTemplates(): Promise<void> {
  try {
    const templates = [
      {
        title: 'Youth Profile Report',
        description: 'Basic information about youth profiles',
        report_type: 'youth',
        is_template: true,
        columns: JSON.stringify(['name', 'gender', 'age', 'district', 'phone']),
        sort_by: 'name',
        sort_direction: 'asc',
        created_at: new Date()
      },
      {
        title: 'Business Report',
        description: 'Basic information about businesses',
        report_type: 'business',
        is_template: true,
        columns: JSON.stringify(['name', 'type', 'district', 'status']),
        sort_by: 'name',
        sort_direction: 'asc',
        created_at: new Date()
      }
    ];
    
    for (const template of templates) {
      await db.execute(sql`
        INSERT INTO reports (
          title, description, report_type, is_template, 
          columns, sort_by, sort_direction, created_at
        ) 
        VALUES (
          ${template.title}, ${template.description}, ${template.report_type}, ${template.is_template},
          ${template.columns}::jsonb, ${template.sort_by}, ${template.sort_direction}, ${template.created_at}
        );
      `);
    }
    
    console.log(`Added ${templates.length} default report templates`);
  } catch (error) {
    console.error("Error seeding default templates:", error);
    throw error;
  }
}

// Run the function
directFixReports().then(() => {
  console.log("Reports table fix completed successfully");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during reports table fix:", err);
  process.exit(1);
});