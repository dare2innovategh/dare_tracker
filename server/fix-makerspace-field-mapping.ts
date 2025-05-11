// Create a file named fix-makerspace-field-mapping.ts
import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixMakerspaceFieldMapping() {
  console.log("Fixing makerspace form-to-database field mapping...");
  
  try {
    // Check if there's a mismatch between address and location fields
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'makerspaces' AND column_name IN ('address', 'location')
    `);
    
    const columns = columnCheck.rows.map(row => row.column_name);
    console.log("Found columns:", columns);
    
    // If there's only a location column but no address column, we need to add it
    if (columns.includes('location') && !columns.includes('address')) {
      // Add address column
      await db.execute(sql`
        ALTER TABLE makerspaces 
        ADD COLUMN IF NOT EXISTS address TEXT
      `);
      console.log("Added address column");
      
      // Create a trigger to sync address to location
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION sync_address_to_location()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.location = COALESCE(NEW.address, NEW.location);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      await db.execute(sql`
        DROP TRIGGER IF EXISTS sync_address_location ON makerspaces;
        
        CREATE TRIGGER sync_address_location
        BEFORE INSERT OR UPDATE ON makerspaces
        FOR EACH ROW
        EXECUTE FUNCTION sync_address_to_location();
      `);
      
      console.log("Created trigger to sync address to location field");
    }
    
    console.log("Makerspace field mapping fix completed successfully!");
  } catch (error) {
    console.error("Error fixing makerspace field mapping:", error);
  }
}

// Run directly if executed as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMakerspaceFieldMapping()
    .then(() => {
      console.log("Makerspace field mapping fix completed");
      process.exit(0);
    })
    .catch(err => {
      console.error("Error:", err);
      process.exit(1);
    });
}

export { fixMakerspaceFieldMapping };