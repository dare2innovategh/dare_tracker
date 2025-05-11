import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import * as crypto from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { autoAssignAdminPermissions } from "./auto-permission-loader";
import { fixAdminPermissions } from "./fix-admin-permissions-again";
import { users, roles, permissions, rolePermissions } from "@shared/schema";
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up static file serving for reports
const reportsPath = path.join(__dirname, 'reports');
app.use('/api/reports', express.static(reportsPath));



// Check if we're running in production mode
const isProduction = app.get("env") === "production";

// Utility functions for user creation and password hashing
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Run database migration on server startup
// In production, migrations should be run manually before deployment
if (!isProduction) {
  console.log("Running in development mode - executing migrations");
  // Make sure to await the migration completion instead of letting it run in parallel
  (async () => {
    try {
      await runComprehensiveMigration();
      console.log("Database migration completed successfully");
      
      // After migration completes, automatically assign permissions to admin
      try {
        const result = await autoAssignAdminPermissions();
        console.log("Auto permission assignment completed:", result);
        
        // Run the additional admin permission fix
        console.log("Starting Admin role permissions fix...");
        await fixAdminPermissions();
        console.log("Admin role permissions fix completed");
      } catch (err) {
        console.error("Auto permission assignment error:", err);
      }
    } catch (err) {
      console.error("Migration error:", err);
    }
  })();
} else {
  console.log("Running in production mode - skipping automatic migrations");
}

// Comprehensive migration function that creates all necessary tables and seeds initial data
async function runComprehensiveMigration() {
  console.log("Starting comprehensive database migration...");
  
  try {
    // Create migration_flags table first if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS migration_flags (
        id SERIAL PRIMARY KEY,
        flag_name TEXT NOT NULL UNIQUE,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP
      );
    `);

    // Create tables in proper order considering foreign key dependencies
    await createCoreTables();
    await createUserAuthTables();
    await createYouthProfileTables();
    await createBusinessTables();
    await createMentorshipTables();
    await createTrainingAndSkillsTables();
    await createMakerspaceTables();
    await createReportingTables();
    
    // Fix column names directly during migration
    console.log("Fixing column names during migration...");
    
    // Fix feasibility_assessments table - ensure operating_costs exists
    console.log("Checking and fixing feasibility_assessments table columns...");
    
    // First check if the table exists
    const feasibilityTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'feasibility_assessments'
      ) AS "exists"
    `);
    
    if (feasibilityTableExists.rows[0].exists) {
      // Check if operational_costs exists but operating_costs doesn't (needs rename)
      const feasibilityColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'feasibility_assessments'
      `);
      
      const feasibilityColumnNames = feasibilityColumns.rows.map(row => row.column_name);
      const hasOperationalCosts = feasibilityColumnNames.includes('operational_costs');
      const hasOperatingCosts = feasibilityColumnNames.includes('operating_costs');
      
      if (hasOperationalCosts && !hasOperatingCosts) {
        console.log("Renaming operational_costs to operating_costs in feasibility_assessments table...");
        await db.execute(sql`
          ALTER TABLE feasibility_assessments 
          RENAME COLUMN operational_costs TO operating_costs
        `);
      } else if (!hasOperatingCosts) {
        console.log("Adding operating_costs column to feasibility_assessments table...");
        await db.execute(sql`
          ALTER TABLE feasibility_assessments 
          ADD COLUMN operating_costs TEXT
        `);
      } else {
        console.log("operating_costs column already exists in feasibility_assessments table");
      }
    } else {
      console.log("feasibility_assessments table doesn't exist yet, will be created with correct columns");
    }
    
    // Fix business_tracking table - ensure tracking_month exists
    console.log("Checking and fixing business_tracking table columns...");
    
    // First check if the table exists
    const businessTrackingTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'business_tracking'
      ) AS "exists"
    `);
    
    if (businessTrackingTableExists.rows[0].exists) {
      // Check if month exists but tracking_month doesn't (needs rename)
      const businessTrackingColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'business_tracking'
      `);
      
      const businessTrackingColumnNames = businessTrackingColumns.rows.map(row => row.column_name);
      const hasMonth = businessTrackingColumnNames.includes('month');
      const hasTrackingMonth = businessTrackingColumnNames.includes('tracking_month');
      
      if (hasMonth && !hasTrackingMonth) {
        console.log("Renaming month to tracking_month in business_tracking table...");
        await db.execute(sql`
          ALTER TABLE business_tracking 
          RENAME COLUMN month TO tracking_month
        `);
      } else if (!hasTrackingMonth) {
        console.log("Adding tracking_month column to business_tracking table...");
        await db.execute(sql`
          ALTER TABLE business_tracking 
          ADD COLUMN tracking_month DATE
        `);
      } else {
        console.log("tracking_month column already exists in business_tracking table");
      }
      
      // Similarly handle year/tracking_year
      const hasYear = businessTrackingColumnNames.includes('year');
      const hasTrackingYear = businessTrackingColumnNames.includes('tracking_year');
      
      if (hasYear && !hasTrackingYear) {
        console.log("Renaming year to tracking_year in business_tracking table...");
        await db.execute(sql`
          ALTER TABLE business_tracking 
          RENAME COLUMN year TO tracking_year
        `);
      } else if (!hasTrackingYear) {
        console.log("Adding tracking_year column to business_tracking table...");
        await db.execute(sql`
          ALTER TABLE business_tracking 
          ADD COLUMN tracking_year INTEGER
        `);
      } else {
        console.log("tracking_year column already exists in business_tracking table");
      }
    } else {
      console.log("business_tracking table doesn't exist yet, will be created with correct columns");
    }
    
    // Fix makerspace_resources table - ensure resource_name exists
    console.log("Checking and fixing makerspace_resources table columns...");
    
    // First check if the table exists
    const makerspaceResourcesTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'makerspace_resources'
      ) AS "exists"
    `);
    
    if (makerspaceResourcesTableExists.rows[0].exists) {
      // Check if name exists but resource_name doesn't (needs rename)
      const makerspaceResourcesColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'makerspace_resources'
      `);
      
      const makerspaceResourcesColumnNames = makerspaceResourcesColumns.rows.map(row => row.column_name);
      const hasName = makerspaceResourcesColumnNames.includes('name');
      const hasResourceName = makerspaceResourcesColumnNames.includes('resource_name');
      
      if (hasName && !hasResourceName) {
        console.log("Renaming name to resource_name in makerspace_resources table...");
        await db.execute(sql`
          ALTER TABLE makerspace_resources 
          RENAME COLUMN name TO resource_name
        `);
      } else if (!hasResourceName) {
        console.log("Adding resource_name column to makerspace_resources table...");
        await db.execute(sql`
          ALTER TABLE makerspace_resources 
          ADD COLUMN resource_name TEXT DEFAULT 'Unnamed Resource'
        `);
      } else {
        console.log("resource_name column already exists in makerspace_resources table");
      }
    } else {
      console.log("makerspace_resources table doesn't exist yet, will be created with correct columns");
    }
    
    // Fix reports table - ensure title and parameters exist
    console.log("Checking and fixing reports table columns...");
    
    // First check if the table exists
    const reportsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reports'
      ) AS "exists"
    `);
    
    if (reportsTableExists.rows[0].exists) {
      // Check column existence for reports table
      const reportsColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reports'
      `);
      
      const reportsColumnNames = reportsColumns.rows.map(row => row.column_name);
      
      // Handle report_name/title conversion
      const hasReportName = reportsColumnNames.includes('report_name');
      const hasTitle = reportsColumnNames.includes('title');
      
      if (hasReportName && !hasTitle) {
        console.log("Renaming report_name to title in reports table...");
        await db.execute(sql`
          ALTER TABLE reports 
          RENAME COLUMN report_name TO title
        `);
      } else if (!hasTitle) {
        console.log("Adding title column to reports table...");
        await db.execute(sql`
          ALTER TABLE reports 
          ADD COLUMN title TEXT DEFAULT 'Untitled Report'
        `);
      } else {
        console.log("title column already exists in reports table");
      }
      
      // Add parameters column if it doesn't exist
      if (!reportsColumnNames.includes('parameters')) {
        console.log("Adding parameters column to reports table...");
        await db.execute(sql`
          ALTER TABLE reports 
          ADD COLUMN parameters JSONB DEFAULT '{}'
        `);
      }
      
      // Add is_template column if it doesn't exist
      if (!reportsColumnNames.includes('is_template')) {
        console.log("Adding is_template column to reports table...");
        await db.execute(sql`
          ALTER TABLE reports 
          ADD COLUMN is_template BOOLEAN DEFAULT FALSE
        `);
      }
      
      // Add last_run_at column if it doesn't exist
      if (!reportsColumnNames.includes('last_run_at')) {
        console.log("Adding last_run_at column to reports table...");
        await db.execute(sql`
          ALTER TABLE reports 
          ADD COLUMN last_run_at TIMESTAMP
        `);
      }
    } else {
      console.log("reports table doesn't exist yet, will be created with correct columns");
    }
    
    // Fix report_runs table - ensure parameters and filters exist
    console.log("Checking and fixing report_runs table columns...");
    
    // First check if the table exists
    const reportRunsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'report_runs'
      ) AS "exists"
    `);
    
    if (reportRunsTableExists.rows[0].exists) {
      // Check column existence for report_runs table
      const reportRunsColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'report_runs'
      `);
      
      const reportRunsColumnNames = reportRunsColumns.rows.map(row => row.column_name);
      
      // Add parameters column if it doesn't exist
      if (!reportRunsColumnNames.includes('parameters')) {
        console.log("Adding parameters column to report_runs table...");
        await db.execute(sql`
          ALTER TABLE report_runs 
          ADD COLUMN parameters JSONB DEFAULT '{}'
        `);
      }
      
      // Add filters column if it doesn't exist
      if (!reportRunsColumnNames.includes('filters')) {
        console.log("Adding filters column to report_runs table...");
        await db.execute(sql`
          ALTER TABLE report_runs 
          ADD COLUMN filters JSONB DEFAULT '{}'
        `);
      }
    } else {
      console.log("report_runs table doesn't exist yet, will be created with correct columns");
    }
    
    console.log("Column name fixes completed");
    
    // We'll add the missing columns to users table if they don't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
    `);
    
    // Ensure admin user exists
    await ensureAdminUser();
    
    // Ensure admin role exists with proper permissions
    await ensureAdminRole();
    
    // Seed service categories
    await seedServiceCategories();
    
    
    console.log("Database tables created and seeded successfully");
    return true;
  } catch (error) {
    console.error("Error during database migration:", error);
    throw error;
  }
}

// Create core tables
async function createCoreTables() {
  console.log("Creating core tables...");
  
  // Session store table for persistent sessions
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
  
  // Users table (required by most other tables)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'mentee',
      district TEXT,
      profile_picture TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  console.log("Core tables created successfully");
}

// Create user authentication and authorization tables
async function createUserAuthTables() {
  console.log("Creating authentication tables...");
  
  // Create roles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100),
      description TEXT,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      is_editable BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Create permissions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      CONSTRAINT unique_permission UNIQUE (resource, action)
    );
  `);
  
  // Create role permissions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      role TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Create role users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS role_users (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      CONSTRAINT unique_role_user UNIQUE (role_id, user_id)
    );
  `);
  
  // Create custom roles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS custom_roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    );
  `);
  
  console.log("Authentication tables created successfully");
}

// Create youth profile related tables
async function createYouthProfileTables() {
  console.log("Creating youth profile tables...");
  
  // Youth profiles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS youth_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      participant_code TEXT UNIQUE,
      full_name TEXT NOT NULL,
      profile_picture TEXT,
      district TEXT NOT NULL,
      town TEXT,
      phone_number TEXT,
      email TEXT,
      gender TEXT,
      marital_status TEXT,
      children_count INTEGER DEFAULT 0,
      year_of_birth INTEGER,
      age INTEGER,
      age_group TEXT,
      social_media_links JSONB DEFAULT '{}',
      core_skills TEXT,
      skill_level TEXT,
      industry_expertise TEXT,
      languages_spoken JSONB DEFAULT '[]',
      communication_style TEXT,
      years_of_experience INTEGER,
      work_history JSONB DEFAULT '[]',
      business_interest TEXT,
      employment_status TEXT,
      specific_job TEXT,
      pwd_status TEXT,
      dare_model TEXT,
      is_madam BOOLEAN DEFAULT FALSE,
      is_apprentice BOOLEAN DEFAULT FALSE,
      madam_name TEXT,
      madam_phone TEXT,
      apprentice_names JSONB DEFAULT '[]',
      apprentice_phone TEXT,
      guarantor TEXT,
      guarantor_phone TEXT,
      digital_skills TEXT,
      digital_skills_2 TEXT,
      financial_aspirations TEXT,
      dependents TEXT,
      national_id TEXT,
      training_status TEXT,
      program_status TEXT,
      
      -- Transition Framework specific fields
      transition_status TEXT DEFAULT 'Not Started',
      onboarded_to_tracker BOOLEAN DEFAULT FALSE,
      local_mentor_name TEXT,
      local_mentor_contact TEXT,
      
      -- Emergency contact information
      emergency_contact JSONB DEFAULT '{"name":"","relation":"","phone":"","email":"","address":""}',
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Education records for youth
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
      youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
      highest_qualification TEXT,
      specialization TEXT,
      highest_level_completed TEXT,
      institution TEXT,
      graduation_year INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_education_youth_id ON education(youth_id);
  `);
  
  console.log("Youth profile tables created successfully");
}

// Create business related tables
async function createBusinessTables() {
  console.log("Creating business related tables...");
  
  // Service Categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Service Subcategories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_subcategories (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Business profiles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id SERIAL PRIMARY KEY,
      business_name TEXT NOT NULL,
      business_logo TEXT,
      district TEXT NOT NULL,
      business_location TEXT,
      business_contact TEXT,
      business_description TEXT,
      business_model TEXT,
      dare_model TEXT,
      service_category_id INTEGER REFERENCES service_categories(id),
      service_subcategory_id INTEGER REFERENCES service_subcategories(id),
      business_start_date DATE,
      registration_status TEXT,
      registration_number TEXT,
      registration_date DATE,
      business_objectives JSONB DEFAULT '[]',
      short_term_goals JSONB DEFAULT '[]',
      target_market TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_business_profiles_district ON business_profiles(district);
  `);
  
  // Business-youth relationships table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_youth_relationships (
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'Member',
      join_date DATE NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      PRIMARY KEY (business_id, youth_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_business_youth_relationships_business_id 
    ON business_youth_relationships(business_id);
    
    CREATE INDEX IF NOT EXISTS idx_business_youth_relationships_youth_id 
    ON business_youth_relationships(youth_id);
  `);
  
  // Business tracking table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_tracking (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      tracking_date DATE NOT NULL,
      tracking_month DATE NOT NULL,
      tracking_year INTEGER NOT NULL,
      tracking_period TEXT,
      projected_sales INTEGER,
      actual_sales INTEGER,
      projected_revenue INTEGER,
      actual_revenue INTEGER,
      internal_revenue INTEGER,
      external_revenue INTEGER,
      actual_expenditure INTEGER,
      actual_profit INTEGER,
      projected_employees INTEGER,
      actual_employees INTEGER,
      new_employees INTEGER,
      permanent_employees INTEGER,
      temporary_employees INTEGER,
      male_employees INTEGER,
      female_employees INTEGER,
      contract_workers INTEGER,
      client_count INTEGER,
      prominent_market TEXT,
      new_resources JSONB DEFAULT '[]',
      all_equipment JSONB DEFAULT '[]',
      key_decisions JSONB DEFAULT '[]',
      lessons_gained JSONB DEFAULT '[]',
      business_insights TEXT,
      challenges JSONB DEFAULT '[]',
      next_steps_planned JSONB DEFAULT '[]',
      performance_rating INTEGER,
      reviewer_id INTEGER REFERENCES users(id),
      review_date DATE,
      review_notes TEXT,
      approval_status TEXT,
      approved_by_id INTEGER REFERENCES users(id),
      approval_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_business_tracking_business_id ON business_tracking(business_id);
  `);
  
  // Equipment inventory
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS equipment_inventory (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      equipment_name TEXT NOT NULL,
      equipment_type TEXT,
      manufacturer TEXT,
      model TEXT,
      purchase_date DATE,
      purchase_price INTEGER,
      current_value INTEGER,
      condition TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Business activity log
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_activity_log (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      performed_by INTEGER REFERENCES users(id),
      activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Feasibility assessment table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feasibility_assessments (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      assessor_id INTEGER REFERENCES users(id),
      
      -- Market criteria
      market_target_customers TEXT,
      market_customer_needs TEXT,
      market_unique_value TEXT,
      market_competition INTEGER,
      market_demand INTEGER,
      market_pricing INTEGER,
      market_strategy INTEGER,
      market_comments TEXT,
      
      -- Operations criteria
      operations_production TEXT,
      operations_equipment TEXT,
      operations_facilities TEXT,
      operations_supply_chain INTEGER,
      operations_quality_control INTEGER,
      operations_efficiency INTEGER,
      operations_scalability INTEGER,
      operations_comments TEXT,
      
      -- Financial criteria
      financial_startup_costs TEXT,
      financial_revenue_projections TEXT,
      financial_profitability TEXT,
      financial_breakeven INTEGER,
      financial_cash_flow INTEGER,
      financial_funding INTEGER,
      financial_risks INTEGER,
      financial_comments TEXT,
      operating_costs TEXT,
      
      -- Management criteria
      management_team TEXT,
      management_experience TEXT,
      management_skills TEXT,
      management_capability INTEGER,
      management_planning INTEGER,
      management_adaptability INTEGER,
      management_commitment INTEGER,
      management_comments TEXT,
      
      -- Overall assessment
      overall_score INTEGER,
      overall_result TEXT,
      recommendations TEXT,
      follow_up_date DATE,
      follow_up_actions JSONB DEFAULT '[]',
      
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_feasibility_assessments_business_id 
    ON feasibility_assessments(business_id);
  `);
  
  console.log("Business tables created successfully");
}

// Create mentorship related tables
async function createMentorshipTables() {
  console.log("Creating mentorship tables...");
  
  // Mentors table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mentors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      assigned_district TEXT,
      assigned_districts JSONB NOT NULL DEFAULT '[]',
      specialization TEXT,
      bio TEXT,
      profile_picture TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors(user_id);
  `);
  
  // Mentor-business relationships table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mentor_business_relationships (
      mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      mentorship_focus TEXT,
      meeting_frequency TEXT DEFAULT 'Monthly',
      last_meeting_date DATE,
      next_meeting_date DATE,
      mentorship_goals JSONB DEFAULT '[]',
      mentorship_progress TEXT,
      progress_rating INTEGER,
      PRIMARY KEY (mentor_id, business_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_mentor_business_relationships_mentor_id 
    ON mentor_business_relationships(mentor_id);
    
    CREATE INDEX IF NOT EXISTS idx_mentor_business_relationships_business_id 
    ON mentor_business_relationships(business_id);
  `);
  
  // Mentorship meetings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mentorship_meetings (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      meeting_date DATE NOT NULL,
      meeting_type TEXT NOT NULL,
      location TEXT,
      duration INTEGER,
      agenda TEXT,
      summary TEXT,
      outcomes JSONB DEFAULT '[]',
      next_steps JSONB DEFAULT '[]',
      attendees JSONB DEFAULT '[]',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Mentorship messages table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mentorship_messages (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      sender TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      category TEXT,
      is_read BOOLEAN DEFAULT FALSE
    );
    
    CREATE INDEX IF NOT EXISTS idx_mentorship_messages_mentor_id 
    ON mentorship_messages(mentor_id);
    
    CREATE INDEX IF NOT EXISTS idx_mentorship_messages_business_id 
    ON mentorship_messages(business_id);
  `);
  
  // Business advice
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_advice (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      advice_content TEXT NOT NULL,
      category TEXT NOT NULL,
      follow_up_notes TEXT,
      implementation_status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    );
  `);
  
  console.log("Mentorship tables created successfully");
}

// Create training and skills tables
async function createTrainingAndSkillsTables() {
  console.log("Creating training and skills tables...");
  
  // Skills table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      category_id INTEGER REFERENCES service_categories(id),
      subcategory_id INTEGER REFERENCES service_subcategories(id),
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Youth skills junction table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS youth_skills (
      youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency TEXT DEFAULT 'Intermediate',
      is_primary BOOLEAN DEFAULT FALSE,
      years_of_experience INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      PRIMARY KEY (youth_id, skill_id)
    );
  `);
  
  // Training Programs table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS training_programs (
      id SERIAL PRIMARY KEY,
      program_name TEXT NOT NULL,
      description TEXT,
      program_type TEXT,
      duration TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Youth training table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS youth_training (
      id SERIAL PRIMARY KEY,
      youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
      program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
      start_date DATE,
      completion_date DATE,
      status TEXT DEFAULT 'In Progress',
      certification_received BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_youth_training_youth_id ON youth_training(youth_id);
    CREATE INDEX IF NOT EXISTS idx_youth_training_program_id ON youth_training(program_id);
  `);
  
  // Certifications table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS certifications (
      id SERIAL PRIMARY KEY,
      youth_id INTEGER NOT NULL REFERENCES youth_profiles(id) ON DELETE CASCADE,
      certification_name TEXT NOT NULL,
      issuing_organization TEXT,
      issue_date DATE,
      expiry_date DATE,
      credential_id TEXT,
      certification_url TEXT,
      skills JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_certifications_youth_id ON certifications(youth_id);
  `);
  
  console.log("Training and skills tables created successfully");
}

// Create makerspace tables
async function createMakerspaceTables() {
  console.log("Creating makerspace tables...");
  
  // Makerspaces table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS makerspaces (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      district TEXT NOT NULL,
      manager_id INTEGER REFERENCES users(id),
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      description TEXT,
      facilities JSONB DEFAULT '[]',
      operational_status TEXT DEFAULT 'Active',
      opening_hours TEXT,
      capacity INTEGER,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Makerspace resources table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS makerspace_resources (
      id SERIAL PRIMARY KEY,
      makerspace_id INTEGER NOT NULL REFERENCES makerspaces(id) ON DELETE CASCADE,
      resource_name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      available_quantity INTEGER,
      unit_cost DECIMAL(10, 2),
      total_cost DECIMAL(10, 2),
      acquisition_date DATE,
      condition TEXT,
      status TEXT DEFAULT 'Available',
      description TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );
  `);
  
  // Business-makerspace assignment table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS business_makerspace_assignments (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      makerspace_id INTEGER NOT NULL REFERENCES makerspaces(id) ON DELETE CASCADE,
      assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      assigned_by INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'Active',
      access_level TEXT DEFAULT 'Standard',
      resources_needed JSONB DEFAULT '[]',
      schedule JSONB DEFAULT '{}',
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      CONSTRAINT unique_business_makerspace UNIQUE (business_id, makerspace_id)
    );
  `);
  
  console.log("Makerspace tables created successfully");
}

// Create reporting tables
async function createReportingTables() {
  console.log("Creating reporting tables...");
  
  // Reports table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      report_type TEXT NOT NULL,
      report_period TEXT,
      start_date DATE,
      end_date DATE,
      parameters JSONB DEFAULT '{}',
      is_template BOOLEAN DEFAULT FALSE,
      generated_by INTEGER REFERENCES users(id),
      download_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      last_run_at TIMESTAMP
    );
  `);
  
  // Report runs table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS report_runs (
      id SERIAL PRIMARY KEY,
      report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
      format TEXT,
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      status TEXT DEFAULT 'pending',
      error TEXT,
      result_url TEXT,
      parameters JSONB DEFAULT '{}',
      filters JSONB DEFAULT '{}',
      generated_by INTEGER REFERENCES users(id),
      row_count INTEGER,
      include_charts BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  console.log("Reporting tables created successfully");
}

// Ensure the admin user exists
async function ensureAdminUser() {
  console.log("Ensuring admin user exists...");
  
  // Check if admin already exists
  const adminUser = await db.select().from(users)
    .where(eq(users.username, 'dareadmin'));
  
  if (adminUser.length > 0) {
    console.log("Admin user already exists");
    return adminUser[0];
  }
  
  // Create admin user with secure password
  const hashedPassword = await hashPassword("Dareadmin2025");
  
  const [newAdmin] = await db.insert(users).values({
    username: "dareadmin",
    password: hashedPassword,
    full_name: "DARE System Administrator",
    role: "admin",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }).returning();
  
  console.log("Admin user created successfully");
  console.log("Username: dareadmin");
  console.log("Password: Dareadmin2025");
  
  return newAdmin;
}

// Ensure the admin role exists with system flag
async function ensureAdminRole() {
  console.log("Ensuring admin role exists...");
  
  let roleId: number;
  
  try {
    // Check if admin role already exists using raw SQL
    const adminRoleResult = await db.execute(
      sql`SELECT id FROM roles WHERE name = 'admin'`
    );
    
    if (adminRoleResult.rows.length > 0) {
      console.log("Admin role already exists");
      roleId = parseInt(adminRoleResult.rows[0].id, 10);
      console.log(`Found existing admin role with ID: ${roleId}`);
    } else {
      // Create admin role using raw SQL
      const newRoleResult = await db.execute(
        sql`INSERT INTO roles 
            (name, display_name, description, is_system, is_editable, is_active, created_at, updated_at) 
            VALUES 
            ('admin', 'Administrator', 'System administrator with full access', 
             true, false, true, NOW(), NOW())
            RETURNING id`
      );
      
      roleId = parseInt(newRoleResult.rows[0].id, 10);
      console.log("Admin role created successfully with ID:", roleId);
    }
    
    // Verify roleId is valid
    if (!roleId || isNaN(roleId)) {
      throw new Error(`Invalid roleId: ${roleId}`);
    }
  
    // Create basic permissions if they don't exist
    // The auto-permission-loader will handle the rest
    const basicResources = [
      "users", "roles", "permissions", "youth_profiles", "businesses", 
      "mentors", "dashboard", "reports", "system_settings"
    ];
    const basicActions = ["view", "create", "edit", "delete", "manage"];
    
    for (const resource of basicResources) {
      for (const action of basicActions) {
        try {
          // Check if permission exists using raw SQL
          const existingPermResult = await db.execute(
            sql`SELECT id FROM permissions WHERE resource = ${resource} AND action = ${action}`
          );
          
          if (existingPermResult.rows.length === 0) {
            // Create permission using raw SQL and return the ID
            const newPermResult = await db.execute(
              sql`INSERT INTO permissions (resource, action, description, created_at, updated_at)
                  VALUES (${resource}, ${action}, ${'Permission to ' + action + ' ' + resource}, NOW(), NOW())
                  RETURNING id`
            );
            
            const permId = parseInt(newPermResult.rows[0].id, 10);
            
            // Assign to admin role using raw SQL
            await db.execute(
              sql`INSERT INTO role_permissions (role_id, role, resource, action, created_at, updated_at)
                  VALUES (${roleId}, 'admin', ${resource}, ${action}, NOW(), NOW())`
            );
            
            console.log(`Created and assigned permission: ${action} ${resource}`);
          }
        } catch (error) {
          console.error(`Error creating permission ${action} ${resource}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error ensuring admin role:", error);
    throw error;
  }
  
  console.log("Basic permissions ensured for admin role");
  return roleId;
}

// Seed service categories
async function seedServiceCategories() {
  console.log("Seeding service categories...");
  
  const categories = await db.select().from(schema.serviceCategories);
  
  if (categories.length === 0) {
    const initialCategories = [
      { name: "Building & Construction", description: "Construction, carpentry, masonry, plumbing, and related services" },
      { name: "Food & Beverage", description: "Food preparation, catering, processing, and service businesses" },
      { name: "Fashion & Apparel", description: "Clothing design, production, tailoring, and fashion retail" },
      { name: "Beauty & Wellness", description: "Beauty services, cosmetics production, spas, and wellness services" },
      { name: "Media & Creative Arts", description: "Media production, photography, arts, design, and creative services" }
    ];
    
    for (const category of initialCategories) {
      await db.insert(schema.serviceCategories).values({
        name: category.name,
        description: category.description,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    console.log("Service categories seeded successfully");
  } else {
    console.log("Service categories already exist, skipping seeding");
  }
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - ensure it returns JSON for all errors
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // More detailed error logging
    console.error("Express error handler:", {
      status,
      message,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
    
    // Check if headers have already been sent, if not, send JSON response
    if (!res.headersSent) {
      // Ensure content-type is application/json and not text/html
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json({ 
        message,
        path: req.path,
        status
      });
    } else {
      console.warn("Headers already sent, could not send error response");
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();