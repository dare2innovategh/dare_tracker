import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the makerspaces table schema
 * This addresses the error "column address does not exist"
 */
async function fixMakerspacesTable() {
  try {
    console.log("Starting to fix makerspaces table schema...");
    
    // Check if table exists
    const tableExists = await checkTableExists('makerspaces');
    
    if (!tableExists) {
      console.log("Makerspaces table doesn't exist, creating it...");
      await createMakerspacesTable();
      console.log("Created makerspaces table");
      return;
    }
    
    // Add missing columns if they don't exist
    console.log("Checking for missing columns in makerspaces table...");
    
    const columnsToCheck = [
      { name: 'name', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'description', type: 'TEXT' },
      { name: 'address', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'coordinates', type: 'TEXT' },
      { name: 'district', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'contact_phone', type: 'TEXT' },
      { name: 'contact_email', type: 'TEXT' },
      { name: 'contact_person', type: 'TEXT' },
      { name: 'operating_hours', type: 'TEXT' },
      { name: 'open_date', type: 'DATE' },
      { name: 'resource_count', type: 'INTEGER DEFAULT 0' },
      { name: 'member_count', type: 'INTEGER DEFAULT 0' },
      { name: 'facilities', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('makerspaces', column.name, column.type);
    }
    
    console.log("Fixed makerspaces table schema successfully");
  } catch (error) {
    console.error("Error fixing makerspaces table schema:", error);
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
 * Create the makerspaces table
 */
async function createMakerspacesTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE makerspaces (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL DEFAULT '',
        coordinates TEXT,
        district TEXT NOT NULL DEFAULT '',
        contact_phone TEXT,
        contact_email TEXT,
        contact_person TEXT,
        operating_hours TEXT,
        open_date DATE,
        resource_count INTEGER DEFAULT 0,
        member_count INTEGER DEFAULT 0,
        facilities TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error("Error creating makerspaces table:", error);
    throw error;
  }
}

// Create the business makerspace assignments table if needed
async function createBusinessMakerspaceAssignmentsTable(): Promise<void> {
  try {
    const tableExists = await checkTableExists('business_makerspace_assignments');
    
    if (!tableExists) {
      console.log("Creating business_makerspace_assignments table...");
      await db.execute(sql`
        CREATE TABLE business_makerspace_assignments (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL,
          makerspace_id INTEGER NOT NULL,
          start_date DATE,
          end_date DATE,
          status TEXT DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT unique_business_assignment UNIQUE (business_id),
          FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (makerspace_id) REFERENCES makerspaces(id) ON DELETE CASCADE
        );
      `);
      console.log("Created business_makerspace_assignments table");
    }
  } catch (error) {
    console.error("Error creating business_makerspace_assignments table:", error);
    // Don't throw, just log the error and continue
    console.log("Continuing despite error with business assignments table");
  }
}

// Create the makerspace resources table if needed
async function createMakerspaceResourcesTable(): Promise<void> {
  try {
    const tableExists = await checkTableExists('makerspace_resources');
    
    if (!tableExists) {
      console.log("Creating makerspace_resources table...");
      await db.execute(sql`
        CREATE TABLE makerspace_resources (
          id SERIAL PRIMARY KEY,
          makerspace_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          quantity INTEGER DEFAULT 1,
          unit_cost DECIMAL(10, 2),
          total_cost DECIMAL(10, 2),
          date_acquired DATE,
          status TEXT DEFAULT 'available',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (makerspace_id) REFERENCES makerspaces(id) ON DELETE CASCADE
        );
      `);
      console.log("Created makerspace_resources table");
    }
  } catch (error) {
    console.error("Error creating makerspace_resources table:", error);
    // Don't throw, just log the error and continue
    console.log("Continuing despite error with makerspace resources table");
  }
}

// Run the function
async function runFix() {
  try {
    await fixMakerspacesTable();
    
    // Also check for related tables
    await createBusinessMakerspaceAssignmentsTable();
    await createMakerspaceResourcesTable();
    
    console.log("Makerspaces schema fix completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error during makerspaces schema fix:", err);
    process.exit(1);
  }
}

runFix();