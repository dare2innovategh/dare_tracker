import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Script to fix database schema issues
 * This will add missing columns to the database tables
 */
async function fixDatabaseSchema() {
  try {
    console.log('Starting to fix database schema...');
    
    // Check if participant_code column exists in youth_profiles table
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'participant_code';
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      console.log('Adding participant_code column to youth_profiles table...');
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN participant_code TEXT UNIQUE;
      `);
      console.log('participant_code column added successfully.');
    } else {
      console.log('participant_code column already exists.');
    }
    
    // Add any other missing columns here
    // For example, checking and adding other columns from the schema
    const missingColumns = [
      // Youth profile columns
      { table: 'youth_profiles', column: 'core_skills', type: 'TEXT' },
      { table: 'youth_profiles', column: 'phone_number', type: 'TEXT' },
      { table: 'youth_profiles', column: 'email', type: 'TEXT' },
      { table: 'youth_profiles', column: 'gender', type: 'TEXT' },
      { table: 'youth_profiles', column: 'marital_status', type: 'TEXT' },
      { table: 'youth_profiles', column: 'children_count', type: 'INTEGER', default: '0' },
      { table: 'youth_profiles', column: 'year_of_birth', type: 'INTEGER' },
      { table: 'youth_profiles', column: 'age', type: 'INTEGER' },
      { table: 'youth_profiles', column: 'age_group', type: 'TEXT' },
      { table: 'youth_profiles', column: 'business_interest', type: 'TEXT' },
      { table: 'youth_profiles', column: 'employment_status', type: 'TEXT' },
      { table: 'youth_profiles', column: 'specific_job', type: 'TEXT' },
      { table: 'youth_profiles', column: 'pwd_status', type: 'TEXT' },
      { table: 'youth_profiles', column: 'is_madam', type: 'BOOLEAN', default: 'false' },
      { table: 'youth_profiles', column: 'is_apprentice', type: 'BOOLEAN', default: 'false' },
      { table: 'youth_profiles', column: 'madam_name', type: 'TEXT' },
      { table: 'youth_profiles', column: 'madam_phone', type: 'TEXT' },
      { table: 'youth_profiles', column: 'apprentice_names', type: 'JSONB', default: "'[]'" },
      { table: 'youth_profiles', column: 'apprentice_phone', type: 'TEXT' },
      { table: 'youth_profiles', column: 'guarantor', type: 'TEXT' },
      { table: 'youth_profiles', column: 'guarantor_phone', type: 'TEXT' },
      { table: 'youth_profiles', column: 'digital_skills', type: 'TEXT' },
      { table: 'youth_profiles', column: 'digital_skills_2', type: 'TEXT' },
      { table: 'youth_profiles', column: 'financial_aspirations', type: 'TEXT' },
      { table: 'youth_profiles', column: 'dependents', type: 'TEXT' },
      { table: 'youth_profiles', column: 'national_id', type: 'TEXT' },
      { table: 'youth_profiles', column: 'training_status', type: 'TEXT' },
      { table: 'youth_profiles', column: 'program_status', type: 'TEXT' },
      
      // Business profile columns
      { table: 'business_profiles', column: 'service_category_id', type: 'INTEGER' },
      { table: 'business_profiles', column: 'service_subcategory_id', type: 'INTEGER' },
      { table: 'business_profiles', column: 'business_start_date', type: 'DATE' },
      { table: 'business_profiles', column: 'registration_status', type: 'TEXT' },
      { table: 'business_profiles', column: 'registration_number', type: 'TEXT' },
      { table: 'business_profiles', column: 'registration_date', type: 'DATE' },
      { table: 'business_profiles', column: 'business_objectives', type: 'JSONB', default: "'[]'" },
      { table: 'business_profiles', column: 'target_market', type: 'TEXT' },
      { table: 'business_profiles', column: 'work_samples', type: 'JSONB', default: "'[]'" },
      
      // Business tracking columns removed as part of new tracking system implementation
    ];
    
    for (const col of missingColumns) {
      // Check if column exists
      const checkColQuery = sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${col.table} AND column_name = ${col.column};
      `;
      
      const colExists = await db.execute(checkColQuery);
      
      if (colExists.rows.length === 0) {
        console.log(`Adding ${col.column} column to ${col.table} table...`);
        
        // Create the ALTER TABLE query with default value if specified
        let query;
        if (col.default) {
          query = `ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type} DEFAULT ${col.default}`;
        } else {
          query = `ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}`;
        }
        await db.execute(sql.raw(query));
        console.log(`${col.column} column added successfully.`);
      }
    }
    
    console.log('Database schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing database schema:', error);
    throw error;
  }
}

// Run the script
fixDatabaseSchema().catch(console.error);