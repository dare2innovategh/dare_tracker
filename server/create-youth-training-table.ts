/**
 * Creates the youth_training table to track training programs associated with youth profiles
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function createYouthTrainingTable() {
  console.log("Creating youth_training table...");
  
  try {
    // Check if the table already exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'youth_training'
      );
    `);

    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      console.log("youth_training table already exists");
      
      // Check for columns
      const columnCheckResult = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'youth_training';
      `);
      
      const columns = columnCheckResult.rows.map(row => row.column_name);
      console.log("Existing columns:", columns);
      
      // Add missing columns if needed
      const requiredColumns = [
        'id', 'profile_id', 'program_id', 'status', 'start_date', 
        'completion_date', 'notes', 'certificate_url', 'created_at', 'updated_at'
      ];
      
      for (const column of requiredColumns) {
        if (!columns.includes(column)) {
          console.log(`Adding missing column: ${column}`);
          
          // Add each column based on its type
          try {
            if (column === 'id') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN id SERIAL PRIMARY KEY;
              `);
            } else if (column === 'profile_id' || column === 'program_id') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN ${sql.identifier(column)} INTEGER;
              `);
            } else if (column === 'status') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN status TEXT;
              `);
            } else if (column === 'start_date' || column === 'completion_date') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN ${sql.identifier(column)} DATE;
              `);
            } else if (column === 'notes' || column === 'certificate_url') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN ${sql.identifier(column)} TEXT;
              `);
            } else if (column === 'created_at' || column === 'updated_at') {
              await db.execute(sql`
                ALTER TABLE youth_training 
                ADD COLUMN ${sql.identifier(column)} TIMESTAMP DEFAULT NOW();
              `);
            }
            
            console.log(`Added column ${column} successfully`);
          } catch (error) {
            console.error(`Error adding column ${column}:`, error);
          }
        }
      }
      
      // Add foreign key constraints if they don't exist
      try {
        // Check if profile_id FK exists
        const fkProfileCheck = await db.execute(sql`
          SELECT COUNT(*) FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'youth_training'
          AND constraint_name = 'youth_training_profile_id_fkey';
        `);
        
        if (fkProfileCheck.rows[0].count === '0') {
          console.log("Adding foreign key constraint for profile_id");
          
          await db.execute(sql`
            ALTER TABLE youth_training
            ADD CONSTRAINT youth_training_profile_id_fkey
            FOREIGN KEY (profile_id) 
            REFERENCES youth_profiles(id) ON DELETE CASCADE;
          `);
          
          console.log("Added profile_id foreign key successfully");
        }
        
        // Check if program_id FK exists
        const fkProgramCheck = await db.execute(sql`
          SELECT COUNT(*) FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = 'youth_training'
          AND constraint_name = 'youth_training_program_id_fkey';
        `);
        
        if (fkProgramCheck.rows[0].count === '0') {
          console.log("Adding foreign key constraint for program_id");
          
          await db.execute(sql`
            ALTER TABLE youth_training
            ADD CONSTRAINT youth_training_program_id_fkey
            FOREIGN KEY (program_id) 
            REFERENCES training_programs(id) ON DELETE SET NULL;
          `);
          
          console.log("Added program_id foreign key successfully");
        }
      } catch (error) {
        console.error("Error adding foreign key constraints:", error);
      }
      
    } else {
      console.log("Creating new youth_training table");
      
      // Create the table
      await db.execute(sql`
        CREATE TABLE youth_training (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER REFERENCES youth_profiles(id) ON DELETE CASCADE,
          program_id INTEGER REFERENCES training_programs(id) ON DELETE SET NULL,
          status TEXT,
          start_date DATE,
          completion_date DATE,
          notes TEXT,
          certificate_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log("Created youth_training table successfully");
    }

    // Check if training_programs table exists
    const trainingProgramsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'training_programs'
      );
    `);

    const programsTableExists = trainingProgramsCheck.rows[0].exists;
    
    if (!programsTableExists) {
      console.log("Creating training_programs table");
      
      await db.execute(sql`
        CREATE TABLE training_programs (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          duration TEXT,
          provider TEXT,
          skills TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Add DARE Core Training program
      await db.execute(sql`
        INSERT INTO training_programs (name, description, provider, duration)
        VALUES (
          'DARE Core Skills Training', 
          'Foundational skills training for all DARE participants', 
          'DARE Program',
          '2 weeks'
        );
      `);
      
      console.log("Created training_programs table and added DARE Core Training");
    }
    
    return {
      success: true,
      message: "Youth training table setup completed successfully"
    };
  } catch (error) {
    console.error("Error creating youth_training table:", error);
    return {
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the script
createYouthTrainingTable()
  .then((result) => {
    console.log("Youth training table setup completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during youth training table setup:", error);
    process.exit(1);
  });

export { createYouthTrainingTable };