import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Comprehensive script to fix all known schema issues in the database
 * This script will fix issues with:
 * 1. Youth profiles table
 * 2. Makerspaces table
 * 3. Business assignments table
 * 4. Reports table
 * 5. Feasibility assessments table
 * 6. Missing system settings
 */
async function masterSchemaFix() {
  console.log("Starting comprehensive schema fix for all tables...");
  
  try {
    // Fix youth profiles table
    await fixYouthProfilesTable();
    
    // Fix makerspaces table
    await fixMakerspacesTable();
    
    // Fix business assignments table
    await fixBusinessAssignmentsTable();
    
    // Fix reports table
    await fixReportsTable();
    
    // Fix feasibility assessments table
    await fixFeasibilityAssessmentsTable();
    
    // Fix system settings
    await fixSystemSettings();
    
    console.log("✅ Master schema fix completed successfully!");
  } catch (error) {
    console.error("❌ Error during master schema fix:", error);
    throw error;
  }
}

/**
 * Fix the youth_profiles table
 */
async function fixYouthProfilesTable() {
  console.log("\n----- Fixing youth_profiles table -----");
  
  try {
    const tableExists = await checkTableExists('youth_profiles');
    if (!tableExists) {
      console.log("youth_profiles table doesn't exist. Skipping.");
      return;
    }
    
    const columnsToCheck = [
      { name: 'emergency_contact', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'transition_status', type: 'TEXT' },
      { name: 'onboarded_to_tracker', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'local_mentor_name', type: 'TEXT' },
      { name: 'local_mentor_contact', type: 'TEXT' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('youth_profiles', column.name, column.type);
    }
    
    console.log("✅ youth_profiles table fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing youth_profiles table:", error);
    throw error;
  }
}

/**
 * Fix the makerspaces table
 */
async function fixMakerspacesTable() {
  console.log("\n----- Fixing makerspaces table -----");
  
  try {
    const tableExists = await checkTableExists('makerspaces');
    
    if (!tableExists) {
      console.log("makerspaces table doesn't exist, creating it...");
      await db.execute(sql`
        CREATE TABLE makerspaces (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          address TEXT DEFAULT '',
          district TEXT NOT NULL DEFAULT '',
          contact_phone TEXT,
          contact_email TEXT,
          operating_hours TEXT,
          open_date DATE,
          coordinates TEXT,
          status TEXT DEFAULT 'Active',
          resource_count INTEGER DEFAULT 0,
          member_count INTEGER DEFAULT 0,
          facilities TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Created makerspaces table");
      return;
    }
    
    // Check for the problematic 'location' column
    const locationExists = await columnExists('makerspaces', 'location');
    if (locationExists) {
      console.log("Found 'location' column. Attempting to make it nullable...");
      try {
        await db.execute(sql`
          ALTER TABLE makerspaces ALTER COLUMN location DROP NOT NULL;
        `);
        console.log("Made 'location' column nullable");
      } catch (error) {
        console.warn("Warning: Couldn't make location column nullable:", error.message);
        console.log("Attempting to set default value for location...");
        try {
          await db.execute(sql`
            UPDATE makerspaces SET location = '' WHERE location IS NULL;
          `);
          console.log("Set default value for NULL locations");
        } catch (innerError) {
          console.warn("Warning: Couldn't set default value for location:", innerError.message);
        }
      }
    }
    
    // Add missing columns
    const columnsToCheck = [
      { name: 'name', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'description', type: 'TEXT' },
      { name: 'address', type: 'TEXT DEFAULT \'\'' },
      { name: 'coordinates', type: 'TEXT' },
      { name: 'district', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'contact_phone', type: 'TEXT' },
      { name: 'contact_email', type: 'TEXT' },
      { name: 'operating_hours', type: 'TEXT' },
      { name: 'open_date', type: 'DATE' },
      { name: 'status', type: 'TEXT DEFAULT \'Active\'' },
      { name: 'resource_count', type: 'INTEGER DEFAULT 0' },
      { name: 'member_count', type: 'INTEGER DEFAULT 0' },
      { name: 'facilities', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('makerspaces', column.name, column.type);
    }
    
    console.log("✅ makerspaces table fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing makerspaces table:", error);
    throw error;
  }
}

/**
 * Fix the business_makerspace_assignments table
 */
async function fixBusinessAssignmentsTable() {
  console.log("\n----- Fixing business_makerspace_assignments table -----");
  
  try {
    const tableExists = await checkTableExists('business_makerspace_assignments');
    
    if (!tableExists) {
      console.log("business_makerspace_assignments table doesn't exist, creating it...");
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
      try {
        await db.execute(sql`
          ALTER TABLE business_makerspace_assignments 
          ADD CONSTRAINT unique_business_assignment UNIQUE (business_id);
        `);
      } catch (constraintError) {
        console.warn("Warning: Couldn't add unique constraint:", constraintError.message);
      }
      
      console.log("✅ Created business_makerspace_assignments table");
      return;
    }
    
    // Add missing columns
    const columnsToCheck = [
      { name: 'business_id', type: 'INTEGER NOT NULL' },
      { name: 'makerspace_id', type: 'INTEGER NOT NULL' },
      { name: 'assigned_date', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'assigned_by', type: 'INTEGER' },
      { name: 'notes', type: 'TEXT' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'start_date', type: 'DATE' },
      { name: 'end_date', type: 'DATE' },
      { name: 'status', type: 'TEXT DEFAULT \'active\'' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('business_makerspace_assignments', column.name, column.type);
    }
    
    console.log("✅ business_makerspace_assignments table fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing business_makerspace_assignments table:", error);
    throw error;
  }
}

/**
 * Fix the reports table
 */
async function fixReportsTable() {
  console.log("\n----- Fixing reports table -----");
  
  try {
    const tableExists = await checkTableExists('reports');
    
    if (!tableExists) {
      console.log("reports table doesn't exist, creating it...");
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
      console.log("✅ Created reports table");
      
      // Create report_runs table if needed
      const runsTableExists = await checkTableExists('report_runs');
      if (!runsTableExists) {
        console.log("Creating report_runs table...");
        await db.execute(sql`
          CREATE TABLE report_runs (
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
        console.log("✅ Created report_runs table");
      }
      
      // Skip seeding reports
      console.log("Skipping report templates seeding as requested");
      
      return;
    }
    
    // Add missing columns
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
      { name: 'updated_at', type: 'TIMESTAMP' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('reports', column.name, column.type);
    }
    
    // Skip seeding default reports as requested
    console.log("Skipping report templates seeding as requested");
    
    console.log("✅ reports table fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing reports table:", error);
    throw error;
  }
}

/**
 * Fix feasibility assessments table
 */
async function fixFeasibilityAssessmentsTable() {
  console.log("\n----- Fixing feasibility_assessments table -----");
  
  try {
    const tableExists = await checkTableExists('feasibility_assessments');
    
    if (!tableExists) {
      console.log("feasibility_assessments table doesn't exist, creating it...");
      await db.execute(sql`
        CREATE TABLE feasibility_assessments (
          id SERIAL PRIMARY KEY,
          business_id INTEGER,
          youth_id INTEGER,
          business_name TEXT NOT NULL,
          district TEXT NOT NULL,
          assessment_date DATE DEFAULT NOW(),
          status TEXT DEFAULT 'Draft',
          
          -- Market Assessment
          market_demand TEXT,
          competition_level TEXT,
          customer_accessibility TEXT,
          pricing_power TEXT,
          marketing_effectiveness TEXT,
          market_comments TEXT,
          
          -- Financial Assessment
          startup_costs TEXT,
          operational_costs TEXT,
          profit_margins TEXT,
          cash_flow TEXT,
          financial_sustainability TEXT,
          financial_comments TEXT,
          
          -- Operations Assessment
          production_capability TEXT,
          supply_chain TEXT,
          quality_control TEXT,
          scalability TEXT,
          technology_needs TEXT,
          operations_comments TEXT,
          
          -- Management Assessment
          leadership_skills TEXT,
          business_knowledge TEXT,
          adaptability TEXT,
          resilience TEXT,
          support_network TEXT,
          management_comments TEXT,
          
          -- Overall Assessment
          overall_score TEXT,
          recommendations TEXT,
          next_steps TEXT,
          
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by INTEGER,
          updated_by INTEGER
        );
      `);
      console.log("✅ Created feasibility_assessments table");
      return;
    }
    
    // If table exists, check columns
    const columnsToCheck = [
      { name: 'business_id', type: 'INTEGER' },
      { name: 'youth_id', type: 'INTEGER' },
      { name: 'business_name', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'district', type: 'TEXT NOT NULL DEFAULT \'\'' },
      { name: 'assessment_date', type: 'DATE DEFAULT NOW()' },
      { name: 'status', type: 'TEXT DEFAULT \'Draft\'' },
      
      // Market Assessment
      { name: 'market_demand', type: 'TEXT' },
      { name: 'competition_level', type: 'TEXT' },
      { name: 'customer_accessibility', type: 'TEXT' },
      { name: 'pricing_power', type: 'TEXT' },
      { name: 'marketing_effectiveness', type: 'TEXT' },
      { name: 'market_comments', type: 'TEXT' },
      
      // Financial Assessment
      { name: 'startup_costs', type: 'TEXT' },
      { name: 'operational_costs', type: 'TEXT' },
      { name: 'profit_margins', type: 'TEXT' },
      { name: 'cash_flow', type: 'TEXT' },
      { name: 'financial_sustainability', type: 'TEXT' },
      { name: 'financial_comments', type: 'TEXT' },
      
      // Operations Assessment
      { name: 'production_capability', type: 'TEXT' },
      { name: 'supply_chain', type: 'TEXT' },
      { name: 'quality_control', type: 'TEXT' },
      { name: 'scalability', type: 'TEXT' },
      { name: 'technology_needs', type: 'TEXT' },
      { name: 'operations_comments', type: 'TEXT' },
      
      // Management Assessment
      { name: 'leadership_skills', type: 'TEXT' },
      { name: 'business_knowledge', type: 'TEXT' },
      { name: 'adaptability', type: 'TEXT' },
      { name: 'resilience', type: 'TEXT' },
      { name: 'support_network', type: 'TEXT' },
      { name: 'management_comments', type: 'TEXT' },
      
      // Overall Assessment
      { name: 'overall_score', type: 'TEXT' },
      { name: 'recommendations', type: 'TEXT' },
      { name: 'next_steps', type: 'TEXT' },
      
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'created_by', type: 'INTEGER' },
      { name: 'updated_by', type: 'INTEGER' }
    ];
    
    for (const column of columnsToCheck) {
      await addColumnIfNotExists('feasibility_assessments', column.name, column.type);
    }
    
    console.log("✅ feasibility_assessments table fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing feasibility_assessments table:", error);
    throw error;
  }
}

/**
 * Fix system settings 
 */
async function fixSystemSettings() {
  console.log("\n----- Fixing system_settings table -----");
  
  try {
    // Check if the system_settings table exists
    const tableExists = await checkTableExists('system_settings');
    if (!tableExists) {
      console.log("system_settings table doesn't exist, creating it...");
      await db.execute(sql`
        CREATE TABLE system_settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log("Created system_settings table");
    }
    
    // Set the youth profiles import flag
    console.log("Setting youth profiles import flag...");
    await db.execute(sql`
      INSERT INTO system_settings (key, value)
      VALUES ('youth_profiles_imported_from_csv', 'true')
      ON CONFLICT (key) 
      DO UPDATE SET value = 'true', updated_at = NOW();
    `);
    
    console.log("✅ system_settings fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing system_settings:", error);
    throw error;
  }
}

/**
 * Seed default report templates
 */
async function seedDefaultReportTemplates() {
  try {
    console.log("Seeding default report templates...");
    
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
  }
}

/**
 * Check if report templates exist
 */
async function checkIfTemplatesExist(): Promise<boolean> {
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
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = ${tableName} AND column_name = ${columnName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
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
    const exists = await columnExists(tableName, columnName);
    
    if (!exists) {
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

// Run the function
masterSchemaFix().then(() => {
  console.log("\n🎉 All database schema issues fixed successfully! 🎉");
  process.exit(0);
}).catch(err => {
  console.error("\n❌ Fatal error during schema fix:", err);
  process.exit(1);
});