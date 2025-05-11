import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the business_makerspace_assignments table schema
 * This addresses the error "column 'assigned_date' of relation 'business_makerspace_assignments' does not exist"
 */
async function fixBusinessAssignments() {
  try {
    console.log("Starting to fix business_makerspace_assignments table schema...");
    
    // Check if table exists
    const tableExists = await checkTableExists('business_makerspace_assignments');
    
    if (!tableExists) {
      console.log("business_makerspace_assignments table doesn't exist, creating it...");
      await createBusinessAssignmentsTable();
      console.log("Created business_makerspace_assignments table");
      return;
    }
    
    // Check for missing columns
    console.log("Checking for missing columns in business_makerspace_assignments table...");
    
    const columnsToCheck = [
      { name: 'business_id', type: 'INTEGER NOT NULL' },
      { name: 'makerspace_id', type: 'INTEGER NOT NULL' },
      { name: 'assigned_date', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'assigned_by', type: 'INTEGER' },
      { name: 'notes', type: 'TEXT' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP' },
      // Additional columns that might have been added later
      { name: 'start_date', type: 'DATE' },
      { name: 'end_date', type: 'DATE' },
      { name: 'status', type: 'TEXT DEFAULT \'active\'' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('business_makerspace_assignments', column.name, column.type);
    }
    
    console.log("Fixed business_makerspace_assignments table schema successfully");
  } catch (error) {
    console.error("Error fixing business_makerspace_assignments table schema:", error);
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
 * Create the business_makerspace_assignments table
 */
async function createBusinessAssignmentsTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE business_makerspace_assignments (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        makerspace_id INTEGER NOT NULL,
        assigned_date TIMESTAMP DEFAULT NOW(),
        assigned_by INTEGER,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);
    
    // Add unique constraint on business_id
    await db.execute(sql`
      ALTER TABLE business_makerspace_assignments 
      ADD CONSTRAINT unique_business_assignment UNIQUE (business_id);
    `);
    
    // Add foreign key constraints if possible
    try {
      await db.execute(sql`
        ALTER TABLE business_makerspace_assignments
        ADD CONSTRAINT fk_business_id FOREIGN KEY (business_id) 
        REFERENCES business_profiles(id) ON DELETE CASCADE;
      `);
      
      await db.execute(sql`
        ALTER TABLE business_makerspace_assignments
        ADD CONSTRAINT fk_makerspace_id FOREIGN KEY (makerspace_id) 
        REFERENCES makerspaces(id) ON DELETE CASCADE;
      `);
    } catch (error) {
      console.warn("Warning: Could not add foreign key constraints. This is not critical:", error.message);
    }
  } catch (error) {
    console.error("Error creating business_makerspace_assignments table:", error);
    throw error;
  }
}

// Run the function
fixBusinessAssignments().then(() => {
  console.log("Business assignments table fix completed successfully");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error during business assignments table fix:", err);
  process.exit(1);
});