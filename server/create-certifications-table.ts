/**
 * Creates the certifications table for youth certifications
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function createCertificationsTable() {
  console.log("Creating certifications tables...");
  
  try {
    // Check if certifications table exists
    const certificationsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'certifications'
      );
    `);

    const certificationsExists = certificationsCheck.rows[0].exists;
    
    if (!certificationsExists) {
      console.log("Creating certifications table");
      
      await db.execute(sql`
        CREATE TABLE certifications (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER REFERENCES youth_profiles(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          issuer TEXT,
          issue_date DATE,
          expiry_date DATE,
          credential_id TEXT,
          certificate_url TEXT,
          skills TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("Created certifications table successfully");
    } else {
      console.log("certifications table already exists");
      
      // Check if columns exist and add them if needed
      const columnCheckResult = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'certifications';
      `);
      
      const columns = columnCheckResult.rows.map(row => row.column_name);
      console.log("Existing columns:", columns);
      
      // Add missing columns if needed
      const requiredColumns = [
        'id', 'profile_id', 'name', 'issuer', 'issue_date', 
        'expiry_date', 'credential_id', 'certificate_url', 'skills', 'created_at', 'updated_at'
      ];
      
      for (const column of requiredColumns) {
        if (!columns.includes(column)) {
          console.log(`Adding missing column: ${column}`);
          
          // Add each column based on its type
          try {
            if (column === 'id') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN id SERIAL PRIMARY KEY;
              `);
            } else if (column === 'profile_id') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN profile_id INTEGER;
              `);
            } else if (column === 'name' || column === 'issuer' || column === 'credential_id' || column === 'certificate_url') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN ${sql.identifier(column)} TEXT;
              `);
            } else if (column === 'issue_date' || column === 'expiry_date') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN ${sql.identifier(column)} DATE;
              `);
            } else if (column === 'skills') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN skills TEXT[];
              `);
            } else if (column === 'created_at' || column === 'updated_at') {
              await db.execute(sql`
                ALTER TABLE certifications 
                ADD COLUMN ${sql.identifier(column)} TIMESTAMP DEFAULT NOW();
              `);
            }
            
            console.log(`Added column ${column} successfully`);
          } catch (error) {
            console.error(`Error adding column ${column}:`, error);
          }
        }
      }
      
      // Add foreign key constraint if it doesn't exist
      try {
        const fkCheck = await db.execute(sql`
          SELECT COUNT(*) FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'certifications'
          AND constraint_name = 'certifications_profile_id_fkey';
        `);
        
        if (fkCheck.rows[0].count === '0') {
          console.log("Adding foreign key constraint for profile_id");
          
          await db.execute(sql`
            ALTER TABLE certifications
            ADD CONSTRAINT certifications_profile_id_fkey
            FOREIGN KEY (profile_id) 
            REFERENCES youth_profiles(id) ON DELETE CASCADE;
          `);
          
          console.log("Added profile_id foreign key successfully");
        }
      } catch (error) {
        console.error("Error adding foreign key constraint:", error);
      }
    }
    
    // Check if youth_certifications table exists
    const youthCertificationsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'youth_certifications'
      );
    `);

    const youthCertificationsExists = youthCertificationsCheck.rows[0].exists;
    
    if (!youthCertificationsExists) {
      console.log("Creating youth_certifications table");
      
      await db.execute(sql`
        CREATE TABLE youth_certifications (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER REFERENCES youth_profiles(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          issuer TEXT,
          issue_date DATE,
          expiry_date DATE,
          credential_id TEXT,
          certificate_url TEXT,
          skills TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("Created youth_certifications table successfully");
    } else {
      console.log("youth_certifications table already exists");
      
      // Similar checks for youth_certifications table can be added here if needed
    }
    
    return {
      success: true,
      message: "Certifications tables setup completed successfully"
    };
  } catch (error) {
    console.error("Error setting up certifications tables:", error);
    return {
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the script
createCertificationsTable()
  .then((result) => {
    console.log("Certifications tables setup completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during certifications tables setup:", error);
    process.exit(1);
  });

export { createCertificationsTable };