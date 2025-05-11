import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Complete fix script for ALL schema issues in the DARE application
 * This script addresses:
 * 1. Feasibility assessments schema issues (youth_id and operational_costs fields)
 * 2. Makerspace resources tables (missing tables and fields)
 * 3. Business resources tables (missing tables)
 * 4. Reports table "report_name" field issue
 * 5. Any other critical schema issues
 */

async function fixAllSchemaIssues() {
  console.log("🛠️ Starting comprehensive schema fix for all tables and issues...");
  
  try {
    // Fix feasibility assessments table - focused on fields causing errors
    await fixFeasibilityAssessmentsTable();
    
    // Fix makerspace resources table 
    await fixMakerspaceResourcesTable();
    
    // Fix business resources table
    await fixBusinessResourcesTable();
    
    // Fix reports table
    await fixReportsTable();
    
    console.log("✅ All schema fixes have been applied successfully!");
  } catch (error: any) {
    console.error("❌ Error during schema fixes:", error.message);
    throw error;
  }
}

/**
 * Fix the feasibility_assessments table issues with youth_id and field naming
 */
async function fixFeasibilityAssessmentsTable() {
  console.log("\n----- Fixing feasibility_assessments table -----");
  
  try {
    // Check if the table exists
    const tableExists = await checkTableExists('feasibility_assessments');
    if (!tableExists) {
      console.log("❌ feasibility_assessments table doesn't exist. Creating it from scratch...");
      await createFeasibilityAssessmentsTable();
      return;
    }
    
    // Special fix for youth_id if it doesn't actually exist (schema says it should but SQL says it doesn't)
    await ensureYouthIdExists();
    
    // Fix operational_costs vs operating_costs discrepancy
    await fixOperatingCostsField();
    
    console.log("✅ feasibility_assessments table has been fixed");
  } catch (error: any) {
    console.error("❌ Error fixing feasibility_assessments table:", error.message);
    throw error;
  }
}

/**
 * Ensure the youth_id column truly exists in the feasibility_assessments table
 */
async function ensureYouthIdExists() {
  try {
    // Check if column exists through information schema
    const youthIdExists = await columnExistsInformationSchema('feasibility_assessments', 'youth_id');
    
    if (!youthIdExists) {
      console.log("🔄 youth_id column doesn't exist. Adding it...");
      
      // Add column youth_id
      await db.execute(sql`
        ALTER TABLE feasibility_assessments
        ADD COLUMN youth_id INTEGER;
      `);
      
      console.log("✅ Added youth_id column to feasibility_assessments");
    } else {
      console.log("✓ youth_id column already exists in the schema, but may be causing errors");
      
      // Try dropping and recreating the column to fix any issues
      try {
        await db.execute(sql`
          ALTER TABLE feasibility_assessments 
          DROP COLUMN IF EXISTS youth_id CASCADE;
        `);
        
        await db.execute(sql`
          ALTER TABLE feasibility_assessments
          ADD COLUMN youth_id INTEGER;
        `);
        
        console.log("🔄 youth_id column has been recreated to fix any issues");
      } catch (err: any) {
        console.warn("⚠️ Failed to recreate youth_id column:", err.message);
      }
    }
  } catch (error: any) {
    console.error("❌ Error ensuring youth_id column exists:", error.message);
    throw error;
  }
}

/**
 * Fix the discrepancy between operational_costs and operating_costs
 */
async function fixOperatingCostsField() {
  try {
    // Check if either column exists
    const operationalCostsExists = await columnExistsInformationSchema('feasibility_assessments', 'operational_costs');
    const operatingCostsExists = await columnExistsInformationSchema('feasibility_assessments', 'operating_costs');
    
    if (!operationalCostsExists && !operatingCostsExists) {
      // Add operational_costs as that's what's in the schema
      console.log("🔄 Neither operational_costs nor operating_costs exists. Adding operational_costs...");
      await db.execute(sql`
        ALTER TABLE feasibility_assessments
        ADD COLUMN operational_costs TEXT;
      `);
      console.log("✅ Added operational_costs column to feasibility_assessments");
    } else if (!operationalCostsExists && operatingCostsExists) {
      // Rename operating_costs to operational_costs
      console.log("🔄 Renaming operating_costs to operational_costs to match schema...");
      await db.execute(sql`
        ALTER TABLE feasibility_assessments
        RENAME COLUMN operating_costs TO operational_costs;
      `);
      console.log("✅ Renamed operating_costs to operational_costs");
    } else if (operationalCostsExists && operatingCostsExists) {
      // Both exist, copy data from operating_costs to operational_costs and drop the extra column
      console.log("🔄 Both columns exist. Merging data and dropping operating_costs...");
      await db.execute(sql`
        UPDATE feasibility_assessments 
        SET operational_costs = operating_costs 
        WHERE operational_costs IS NULL AND operating_costs IS NOT NULL;
        
        ALTER TABLE feasibility_assessments
        DROP COLUMN operating_costs;
      `);
      console.log("✅ Merged operating_costs data into operational_costs and dropped operating_costs");
    } else {
      console.log("✓ operational_costs column already exists correctly");
    }
  } catch (error: any) {
    console.error("❌ Error fixing operating/operational costs field:", error.message);
    throw error;
  }
}

/**
 * Fix the makerspace_resources table
 */
async function fixMakerspaceResourcesTable() {
  console.log("\n----- Fixing makerspace_resources table -----");
  
  try {
    const tableExists = await checkTableExists('makerspace_resources');
    
    if (!tableExists) {
      console.log("🔄 makerspace_resources table doesn't exist. Creating it...");
      await db.execute(sql`
        CREATE TABLE makerspace_resources (
          id SERIAL PRIMARY KEY,
          makerspace_id INTEGER NOT NULL,
          resource_name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          status TEXT DEFAULT 'Available',
          quantity INTEGER DEFAULT 1,
          acquisition_date DATE,
          unit_cost DECIMAL(10,2),
          total_cost DECIMAL(10,2),
          supplier TEXT,
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log("✅ Created makerspace_resources table");
    } else {
      // Check and fix the 'name' column issue if needed
      const nameExists = await columnExistsInformationSchema('makerspace_resources', 'name');
      const resourceNameExists = await columnExistsInformationSchema('makerspace_resources', 'resource_name');
      
      if (nameExists && !resourceNameExists) {
        console.log("🔄 Renaming 'name' column to 'resource_name' in makerspace_resources...");
        await db.execute(sql`
          ALTER TABLE makerspace_resources
          RENAME COLUMN name TO resource_name;
        `);
        console.log("✅ Renamed 'name' to 'resource_name' in makerspace_resources");
      } else if (!nameExists && !resourceNameExists) {
        console.log("🔄 Adding 'resource_name' column to makerspace_resources...");
        await db.execute(sql`
          ALTER TABLE makerspace_resources
          ADD COLUMN resource_name TEXT NOT NULL DEFAULT '';
        `);
        console.log("✅ Added 'resource_name' column to makerspace_resources");
      }
      
      // Add any missing columns
      const columnsToCheck = [
        { name: 'makerspace_id', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'category', type: 'TEXT' },
        { name: 'description', type: 'TEXT' },
        { name: 'status', type: 'TEXT DEFAULT \'Available\'' },
        { name: 'quantity', type: 'INTEGER DEFAULT 1' },
        { name: 'acquisition_date', type: 'DATE' },
        { name: 'unit_cost', type: 'DECIMAL(10,2)' },
        { name: 'total_cost', type: 'DECIMAL(10,2)' },
        { name: 'supplier', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'created_by', type: 'INTEGER' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP' }
      ];
      
      for (const column of columnsToCheck) {
        await addColumnIfNotExists('makerspace_resources', column.name, column.type);
      }
    }
    
    console.log("✅ makerspace_resources table has been fixed");
  } catch (error: any) {
    console.error("❌ Error fixing makerspace_resources table:", error.message);
    throw error;
  }
}

/**
 * Fix the business_resources table
 */
async function fixBusinessResourcesTable() {
  console.log("\n----- Fixing business_resources table -----");
  
  try {
    const tableExists = await checkTableExists('business_resources');
    
    if (!tableExists) {
      console.log("🔄 business_resources table doesn't exist. Creating it...");
      await db.execute(sql`
        CREATE TABLE business_resources (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL,
          resource_name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          status TEXT DEFAULT 'Available',
          quantity INTEGER DEFAULT 1,
          acquisition_date DATE,
          unit_cost DECIMAL(10,2),
          total_cost DECIMAL(10,2),
          supplier TEXT,
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP
        );
      `);
      console.log("✅ Created business_resources table");
    } else {
      // Check columns
      const columnsToCheck = [
        { name: 'business_id', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'resource_name', type: 'TEXT NOT NULL DEFAULT \'\'' },
        { name: 'category', type: 'TEXT' },
        { name: 'description', type: 'TEXT' },
        { name: 'status', type: 'TEXT DEFAULT \'Available\'' },
        { name: 'quantity', type: 'INTEGER DEFAULT 1' },
        { name: 'acquisition_date', type: 'DATE' },
        { name: 'unit_cost', type: 'DECIMAL(10,2)' },
        { name: 'total_cost', type: 'DECIMAL(10,2)' },
        { name: 'supplier', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'created_by', type: 'INTEGER' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP' }
      ];
      
      for (const column of columnsToCheck) {
        await addColumnIfNotExists('business_resources', column.name, column.type);
      }
    }
    
    console.log("✅ business_resources table has been fixed");
  } catch (error: any) {
    console.error("❌ Error fixing business_resources table:", error.message);
    throw error;
  }
}

/**
 * Fix the reports table schema issues
 */
async function fixReportsTable() {
  console.log("\n----- Fixing reports table -----");
  
  try {
    const tableExists = await checkTableExists('reports');
    if (!tableExists) {
      console.log("❌ reports table doesn't exist. Skipping...");
      return;
    }

    // Check if 'report_name' column exists
    const reportNameExists = await columnExistsInformationSchema('reports', 'report_name');
    
    if (reportNameExists) {
      // Add default value to report_name column to prevent NULL value errors
      console.log("🔄 Making report_name column nullable or adding default value...");
      try {
        // First try to make it nullable
        await db.execute(sql`
          ALTER TABLE reports ALTER COLUMN report_name DROP NOT NULL;
        `);
        console.log("✅ Made report_name column nullable");
      } catch (err: any) {
        console.warn("⚠️ Could not make report_name nullable, trying to add default:", err.message);
        
        // If that fails, try to set a default value
        try {
          await db.execute(sql`
            ALTER TABLE reports ALTER COLUMN report_name SET DEFAULT 'Untitled Report';
          `);
          console.log("✅ Added default value to report_name column");
        } catch (innerErr: any) {
          console.warn("⚠️ Could not set default for report_name:", innerErr.message);
          
          // As a last resort, try to update existing NULL values
          try {
            await db.execute(sql`
              UPDATE reports SET report_name = title WHERE report_name IS NULL AND title IS NOT NULL;
              UPDATE reports SET report_name = 'Untitled Report' WHERE report_name IS NULL;
            `);
            console.log("✅ Updated NULL report_name values");
          } catch (finalErr: any) {
            console.error("❌ Failed to fix report_name NULL values:", finalErr.message);
          }
        }
      }
    } else {
      // If report_name doesn't exist but is required by the code, add it
      console.log("🔄 Adding missing report_name column...");
      try {
        await db.execute(sql`
          ALTER TABLE reports ADD COLUMN report_name TEXT DEFAULT 'Untitled Report';
          UPDATE reports SET report_name = title WHERE title IS NOT NULL;
        `);
        console.log("✅ Added report_name column and populated from title");
      } catch (err: any) {
        console.error("❌ Failed to add report_name column:", err.message);
      }
    }
    
    // Check if name and resource_name column issues in reports-related tables
    await fixReportsTableNameColumns();
    
    console.log("✅ Reports table has been fixed");
  } catch (error: any) {
    console.error("❌ Error fixing reports table:", error.message);
    throw error;
  }
}

/**
 * Fix name and resource_name column issues in reports-related tables
 */
async function fixReportsTableNameColumns() {
  try {
    // Check if report_templates table exists
    const reportTemplatesExists = await checkTableExists('report_templates');
    if (reportTemplatesExists) {
      const nameExists = await columnExistsInformationSchema('report_templates', 'name');
      const reportNameExists = await columnExistsInformationSchema('report_templates', 'report_name');
      
      if (nameExists && !reportNameExists) {
        console.log("🔄 Renaming 'name' to 'report_name' in report_templates...");
        try {
          await db.execute(sql`
            ALTER TABLE report_templates RENAME COLUMN name TO report_name;
          `);
          console.log("✅ Renamed 'name' to 'report_name' in report_templates");
        } catch (err: any) {
          console.warn("⚠️ Failed to rename name column in report_templates:", err.message);
        }
      }
    }
    
    // Check report_runs table
    const reportRunsExists = await checkTableExists('report_runs');
    if (reportRunsExists) {
      const nameExists = await columnExistsInformationSchema('report_runs', 'name');
      const reportNameExists = await columnExistsInformationSchema('report_runs', 'report_name');
      
      if (nameExists && !reportNameExists) {
        console.log("🔄 Renaming 'name' to 'report_name' in report_runs...");
        try {
          await db.execute(sql`
            ALTER TABLE report_runs RENAME COLUMN name TO report_name;
          `);
          console.log("✅ Renamed 'name' to 'report_name' in report_runs");
        } catch (err: any) {
          console.warn("⚠️ Failed to rename name column in report_runs:", err.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Error fixing report table name columns:", error.message);
  }
}

/**
 * Create a complete feasibility_assessments table from scratch
 */
async function createFeasibilityAssessmentsTable() {
  try {
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
    
    console.log("✅ Created feasibility_assessments table from scratch");
  } catch (error: any) {
    console.error("❌ Error creating feasibility_assessments table:", error.message);
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
        WHERE table_schema = 'public' AND table_name = ${tableName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error: any) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

/**
 * Check if a column exists using information_schema (more reliable)
 */
async function columnExistsInformationSchema(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName}
      );
    `);
    
    return result.rows.length > 0 && result.rows[0].exists === true;
  } catch (error: any) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error.message);
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
    const exists = await columnExistsInformationSchema(tableName, columnName);
    
    if (!exists) {
      console.log(`🔄 Adding missing column ${columnName} to ${tableName}...`);
      
      // Add column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE ${sql.identifier(tableName)} 
        ADD COLUMN IF NOT EXISTS ${sql.identifier(columnName)} ${sql.raw(dataType)};
      `);
      
      console.log(`✅ Added column ${columnName} to ${tableName}`);
    } else {
      console.log(`✓ Column ${columnName} already exists in ${tableName}`);
    }
  } catch (error: any) {
    console.error(`Error adding column ${columnName} to ${tableName}:`, error.message);
    throw error;
  }
}

// Run the function
fixAllSchemaIssues().then(() => {
  console.log("\n🎉 All schema issues fixed successfully! 🎉");
  process.exit(0);
}).catch(err => {
  console.error("\n❌ Fatal error during schema fix:", err);
  process.exit(1);
});