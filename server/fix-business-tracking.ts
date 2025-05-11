import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script to fix the business_tracking table by adding any missing columns
 * This will ensure the table has all the columns defined in our schema
 */
async function fixBusinessTrackingTable() {
  console.log("Fixing business_tracking table...");

  try {
    // Check if the business_tracking table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'business_tracking'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("business_tracking table does not exist. Creating...");
      
      // Create the table with all required columns
      await db.execute(sql`
        CREATE TABLE business_tracking (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES business_profiles(id),
          recorded_by INTEGER NOT NULL REFERENCES users(id),
          mentor_id INTEGER REFERENCES mentors(id),
          tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
          tracking_month DATE NOT NULL DEFAULT CURRENT_DATE,
          tracking_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
          projected_revenue INTEGER,
          actual_employees INTEGER,
          new_employees INTEGER,
          actual_revenue INTEGER,
          internal_revenue INTEGER,
          external_revenue INTEGER,
          actual_expenditure INTEGER,
          actual_profit INTEGER,
          prominent_market TEXT,
          new_resources JSONB DEFAULT '[]',
          all_equipment JSONB DEFAULT '[]',
          key_decisions JSONB DEFAULT '[]',
          lessons_gained JSONB DEFAULT '[]',
          business_insights TEXT,
          challenges JSONB DEFAULT '[]',
          next_steps_planned JSONB DEFAULT '[]'
        )
      `);
      
      console.log("business_tracking table created successfully");
      return;
    }
    
    console.log("business_tracking table exists, checking for missing columns...");
    
    // Check if the recorded_by column exists
    const recordedByExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_tracking' 
        AND column_name = 'recorded_by'
      )
    `);
    
    if (!recordedByExists.rows[0].exists) {
      console.log("Adding recorded_by column...");
      await db.execute(sql`
        ALTER TABLE business_tracking 
        ADD COLUMN recorded_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id)
      `);
      console.log("recorded_by column added");
    }
    
    // Check if other required columns exist and add them if missing
    const columnsToCheck = [
      { name: 'mentor_id', sql: 'INTEGER REFERENCES mentors(id)' },
      { name: 'tracking_date', sql: 'DATE NOT NULL DEFAULT CURRENT_DATE' },
      { name: 'tracking_month', sql: 'DATE NOT NULL DEFAULT CURRENT_DATE' },
      { name: 'tracking_year', sql: 'INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)' },
      { name: 'projected_revenue', sql: 'INTEGER' },
      { name: 'actual_employees', sql: 'INTEGER' },
      { name: 'new_employees', sql: 'INTEGER' },
      { name: 'actual_revenue', sql: 'INTEGER' },
      { name: 'internal_revenue', sql: 'INTEGER' },
      { name: 'external_revenue', sql: 'INTEGER' },
      { name: 'actual_expenditure', sql: 'INTEGER' },
      { name: 'actual_profit', sql: 'INTEGER' },
      { name: 'prominent_market', sql: 'TEXT' },
      { name: 'new_resources', sql: 'JSONB DEFAULT \'[]\'' },
      { name: 'all_equipment', sql: 'JSONB DEFAULT \'[]\'' },
      { name: 'key_decisions', sql: 'JSONB DEFAULT \'[]\'' },
      { name: 'lessons_gained', sql: 'JSONB DEFAULT \'[]\'' },
      { name: 'business_insights', sql: 'TEXT' },
      { name: 'challenges', sql: 'JSONB DEFAULT \'[]\'' },
      { name: 'next_steps_planned', sql: 'JSONB DEFAULT \'[]\'' }
    ];
    
    for (const column of columnsToCheck) {
      const columnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'business_tracking' 
          AND column_name = ${column.name}
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log(`Adding ${column.name} column...`);
        await db.execute(sql`
          ALTER TABLE business_tracking 
          ADD COLUMN ${sql.raw(column.name)} ${sql.raw(column.sql)}
        `);
        console.log(`${column.name} column added`);
      }
    }
    
    console.log("business_tracking table is now up to date");
    
  } catch (error) {
    console.error("Error fixing business_tracking table:", error);
    throw error;
  }
}

// Execute the function immediately
fixBusinessTrackingTable()
  .then(() => {
    console.log("Business tracking table fix completed");
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

export default fixBusinessTrackingTable;