import { sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Removed business tracking import as part of cleanup
import { seedSkills } from './seed-skills';
import * as crypto from 'crypto';
// Import the youth and mentor data for import (only when needed)
// import { importYouthProfilesFromCsv } from './import-youth-profiles-from-csv';
// import { importMentors } from './import-mentors';
import { importAdditionalYouthProfiles } from './import-additional-youth-profiles';
import { fixAdminPermissions } from './fix-admin-permissions';
import { migrateSystemRoles } from './migrate-system-roles';
import { addTrainingProgramFields } from './migrations/add-training-program-fields';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigration() {
  console.log("Starting database migration...");
  
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

    // Create all tables if they don't exist
    await db.execute(sql`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'mentee',
        district TEXT,
        profile_picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Service Categories
      CREATE TABLE IF NOT EXISTS service_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Service Subcategories
      CREATE TABLE IF NOT EXISTS service_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES service_categories(id),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
      
      -- Skills table
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category_id INTEGER REFERENCES service_categories(id),
        subcategory_id INTEGER REFERENCES service_subcategories(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
      
      -- Youth-Skills relationship table
      CREATE TABLE IF NOT EXISTS youth_skills (
        youth_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        proficiency TEXT DEFAULT 'Intermediate',
        is_primary BOOLEAN DEFAULT FALSE,
        years_of_experience INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        PRIMARY KEY (youth_id, skill_id)
      );

      -- Youth profiles table
      CREATE TABLE IF NOT EXISTS youth_profiles (
        id SERIAL PRIMARY KEY,
        participant_code TEXT UNIQUE,
        full_name TEXT NOT NULL,
        profile_picture TEXT,
        district TEXT NOT NULL,
        town TEXT,
        phone_number TEXT,
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Education records for youth
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
        school_name TEXT NOT NULL,
        degree_obtained TEXT,
        field_of_study TEXT,
        start_date DATE,
        end_date DATE,
        is_ongoing BOOLEAN DEFAULT FALSE,
        description TEXT,
        certificate_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Training records for youth
      CREATE TABLE IF NOT EXISTS training (
        id SERIAL PRIMARY KEY,
        youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
        training_type TEXT NOT NULL,
        program_name TEXT NOT NULL,
        institution_name TEXT,
        skills_acquired JSONB DEFAULT '[]',
        start_date DATE NOT NULL,
        end_date DATE,
        is_ongoing BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'In Progress',
        certificate_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Certifications for youth
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
        certification_name TEXT NOT NULL,
        issuing_organization TEXT NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        credential_id TEXT,
        credential_url TEXT,
        skills JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Business profiles table
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
        service_category_id INTEGER,
        service_subcategory_id INTEGER,
        business_start_date DATE,
        registration_status TEXT,
        registration_number TEXT,
        registration_date DATE,
        business_objectives JSONB DEFAULT '[]',
        target_market TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Make sure business_profiles has the necessary columns before adding foreign keys
      DO $$
      BEGIN
        -- Add service_category_id column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'business_profiles' AND column_name = 'service_category_id'
        ) THEN
          ALTER TABLE business_profiles ADD COLUMN service_category_id INTEGER;
        END IF;
        
        -- Add service_subcategory_id column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'business_profiles' AND column_name = 'service_subcategory_id'
        ) THEN
          ALTER TABLE business_profiles ADD COLUMN service_subcategory_id INTEGER;
        END IF;
        
        -- Now add the foreign key constraints if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_business_service_category' AND table_name = 'business_profiles'
        ) THEN
          ALTER TABLE business_profiles 
          ADD CONSTRAINT fk_business_service_category 
          FOREIGN KEY (service_category_id) REFERENCES service_categories(id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_business_service_subcategory' AND table_name = 'business_profiles'
        ) THEN
          ALTER TABLE business_profiles 
          ADD CONSTRAINT fk_business_service_subcategory 
          FOREIGN KEY (service_subcategory_id) REFERENCES service_subcategories(id);
        END IF;
      END $$;

      -- Business-youth relationships table
      CREATE TABLE IF NOT EXISTS business_youth_relationships (
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
        youth_id INTEGER NOT NULL REFERENCES youth_profiles(id),
        role TEXT NOT NULL DEFAULT 'Member',
        join_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        PRIMARY KEY (business_id, youth_id)
      );

      -- Business tracking table removed as part of new tracking system implementation

      -- Equipment inventory
      CREATE TABLE IF NOT EXISTS equipment_inventory (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
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

      -- Business activity log
      CREATE TABLE IF NOT EXISTS business_activity_log (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        performed_by INTEGER REFERENCES users(id),
        activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Mentors table
      CREATE TABLE IF NOT EXISTS mentors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
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

      -- Mentor-business relationships table
      CREATE TABLE IF NOT EXISTS mentor_business_relationships (
        mentor_id INTEGER NOT NULL REFERENCES mentors(id),
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
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

      -- Mentorship meetings
      CREATE TABLE IF NOT EXISTS mentorship_meetings (
        id SERIAL PRIMARY KEY,
        mentor_id INTEGER NOT NULL REFERENCES mentors(id),
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
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

      -- Mentorship messages table
      CREATE TABLE IF NOT EXISTS mentorship_messages (
        id SERIAL PRIMARY KEY,
        mentor_id INTEGER NOT NULL REFERENCES mentors(id),
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
        message TEXT NOT NULL,
        sender TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        category TEXT,
        is_read BOOLEAN DEFAULT FALSE
      );

      -- Business advice
      CREATE TABLE IF NOT EXISTS business_advice (
        id SERIAL PRIMARY KEY,
        mentor_id INTEGER NOT NULL REFERENCES mentors(id),
        business_id INTEGER NOT NULL REFERENCES business_profiles(id),
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

      -- Reports
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        report_name TEXT NOT NULL,
        report_type TEXT NOT NULL,
        report_period TEXT,
        start_date DATE,
        end_date DATE,
        parameters JSONB DEFAULT '{}',
        generated_by INTEGER REFERENCES users(id),
        download_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      -- Session store table for persistent sessions
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      
      -- Migration flags table to track which migrations have run
      CREATE TABLE IF NOT EXISTS "migration_flags" (
        "flag_name" varchar NOT NULL PRIMARY KEY,
        "completed" boolean NOT NULL DEFAULT TRUE,
        "completed_at" timestamp NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Database tables created successfully.");
    
    // Check if mentor district normalization has already been run
    const mentorNormalizationFlag = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'mentor_district_normalization'`)
      .limit(1);
      
    if (mentorNormalizationFlag.length === 0) {
      // Fix mentor assignedDistrict data for proper normalization
      await db.execute(sql`
        -- Remove ", Ghana" suffix from assigned_district
        UPDATE mentors 
        SET assigned_district = REPLACE(assigned_district, ', Ghana', '')
        WHERE assigned_district LIKE '%, Ghana';
        
        -- Convert single district to array for assignedDistricts
        UPDATE mentors 
        SET assigned_districts = json_build_array(assigned_district)::jsonb 
        WHERE assigned_districts = '[]'::jsonb AND assigned_district IS NOT NULL;
      `);
      
      // Mark this migration as complete
      await db.execute(sql`
        INSERT INTO migration_flags (flag_name, completed, completed_at)
        VALUES ('mentor_district_normalization', TRUE, NOW())
      `);
      
      console.log("Mentor district data normalized.");
    } else {
      console.log("Mentor district data normalization already completed. Skipping.");
    }

    // Populate initial service categories if none exist
    const serviceCategories = await db.select().from(schema.serviceCategories);
    if (serviceCategories.length === 0) {
      console.log("Adding initial service categories...");
      
      const initialCategories = [
        { name: "Building & Construction", description: "Construction and building services" },
        { name: "Food & Beverage", description: "Food processing and beverage production" },
        { name: "Fashion & Apparel", description: "Clothing, textiles, and fashion accessories" },
        { name: "Beauty & Wellness", description: "Beauty, cosmetics, and wellness services" },
        { name: "Media & Creative Arts", description: "Media production, design, and creative services" }
      ];
      
      for (const category of initialCategories) {
        await db.insert(schema.serviceCategories).values({
          name: category.name,
          description: category.description,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Added service category: ${category.name}`);
      }
      
      // Populate subcategories
      const subcategories: Record<string, string[]> = {
        "Building & Construction": [
          "Masonry and Bricklaying",
          "Carpentry",
          "Electrical Services",
          "Plumbing",
          "General Construction"
        ],
        "Food & Beverage": [
          "Food Processing",
          "Bakery",
          "Beverage Production",
          "Catering Services",
          "Restaurant/Food Service"
        ],
        "Fashion & Apparel": [
          "Clothing Production",
          "Fashion Design",
          "Textile Manufacturing",
          "Accessories",
          "Footwear"
        ],
        "Beauty & Wellness": [
          "Hair Styling",
          "Cosmetics",
          "Spa Services",
          "Nail Care",
          "Skincare"
        ],
        "Media & Creative Arts": [
          "Photography",
          "Graphic Design",
          "Video Production",
          "Digital Content Creation",
          "Music Production"
        ]
      };
      
      // Fetch the newly created categories to get their IDs
      const dbCategories = await db.select().from(schema.serviceCategories);
      
      for (const category of dbCategories) {
        const categorySubcategories = subcategories[category.name as keyof typeof subcategories];
        if (categorySubcategories) {
          for (const subcategoryName of categorySubcategories) {
            await db.insert(schema.serviceSubcategories).values({
              categoryId: category.id,
              name: subcategoryName,
              description: `${subcategoryName} services under ${category.name}`,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`Added subcategory: ${subcategoryName} under ${category.name}`);
          }
        }
      }
    }
    
    // Check if business service category update has been run
    const businessCategoryFlag = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'business_service_category_update'`)
      .limit(1);
      
    if (businessCategoryFlag.length === 0) {
      // Fix business profiles with missing service category
      try {
        // Use raw SQL query with db object instead of pool
        const columnsCheck = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'business_profiles' AND column_name = 'service_category'
        `);
        
        if (columnsCheck.length > 0) {
          // Only run this update if the service_category column exists
          await db.execute(sql`
            -- Update business_profiles to use a valid service_category_id from the new table
            UPDATE business_profiles bp
            SET service_category_id = sc.id
            FROM service_categories sc
            WHERE bp.service_category = sc.name AND bp.service_category_id IS NULL AND bp.service_category IS NOT NULL;
          `);
        } else {
          console.log("Skipping service_category update - column doesn't exist");
        }
      } catch (error) {
        console.error("Error in service category migration:", error);
        // Continue with migration despite this error
      }
      
      // Mark this migration as complete
      await db.execute(sql`
        INSERT INTO migration_flags (flag_name, completed, completed_at)
        VALUES ('business_service_category_update', TRUE, NOW())
      `);
      
      console.log("Business profiles service categories updated.");
    } else {
      console.log("Business service category update already completed. Skipping.");
    }
    
    // Seed skills based on service categories and subcategories
    try {
      await seedSkills();
      console.log("Skills data seeded successfully.");
    } catch (error) {
      console.error("Error seeding skills data:", error);
    }
    
    // Skip business tracking data seeding
    console.log("Skipping business tracking data seeding as requested.");
    
    // Check if we're in production mode
    const isProduction = process.env.NODE_ENV === "production";
    
    // Check if mentor-business relationships have already been created
    const mentorRelationshipsFlag = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'mentor_business_relationships'`)
      .limit(1);
      
    // Only add sample relationships if we're not in production and haven't done it before
    if (!isProduction && mentorRelationshipsFlag.length === 0) {
      const relationships = await db.select().from(schema.mentorBusinessRelationships);
      
      if (relationships.length === 0) {
        console.log("Adding sample mentor-business relationships...");
        
        // Get all mentors
        const allMentors = await db.select().from(schema.mentors);
        
        // Get all businesses
        const allBusinesses = await db.select().from(schema.businessProfiles);
        
        // Match businesses to mentors by district
        for (const business of allBusinesses) {
          // Find mentors from the same district (without ", Ghana")
          const businessDistrict = business.district.replace(', Ghana', '');
          
          const matchingMentors = allMentors.filter(mentor => {
            const mentorDistrict = mentor.assignedDistrict?.replace(', Ghana', '') || '';
            return mentorDistrict === businessDistrict;
          });
          
          if (matchingMentors.length > 0) {
            // Add relationship for the first matching mentor
            await db.insert(schema.mentorBusinessRelationships).values({
              mentorId: matchingMentors[0].id,
              businessId: business.id,
              assignedDate: new Date().toISOString().split('T')[0],
              isActive: true
            });
            
            console.log(`Assigned mentor ${matchingMentors[0].name} to business ${business.businessName}`);
          }
        }
        
        // Mark this operation as complete
        await db.execute(sql`
          INSERT INTO migration_flags (flag_name, completed, completed_at)
          VALUES ('mentor_business_relationships', TRUE, NOW())
        `);
      }
    } else if (mentorRelationshipsFlag.length > 0) {
      console.log("Mentor-business relationships already established. Skipping.");
    } else if (isProduction) {
      console.log("Running in production mode - skipping sample mentor-business relationship creation.");
    }
    
    // Skip seeding real participant data - we want a clean system
    // await seedRealParticipantData();
    
    // Run the migration to add new fields - emergency_contact and short_term_goals
    try {
      // Import the migration module dynamically
      const addNewFieldsMigrationModule = await import("./add-new-fields-migration.ts");
      const addNewFieldsMigration = addNewFieldsMigrationModule.default;
      
      // Run the migration
      await addNewFieldsMigration();
      console.log("New field migration completed successfully!");
    } catch (migrationError) {
      console.error("Error during new field migration:", migrationError);
      // Continue with the overall migration even if this step fails
    }
    
    // Run the migration to add transition fields to youth_profiles
    try {
      console.log("Starting migration to add transition fields to youth_profiles...");
      const { addTransitionFieldsMigration } = await import("./add-transition-fields-migration.js");
      
      // Run the migration
      await addTransitionFieldsMigration();
      console.log("Transition fields migration completed successfully!");
    } catch (migrationError) {
      console.error("Error during transition fields migration:", migrationError);
      // Continue with the overall migration even if this step fails
    }
    
    // Check if youth profiles have been imported already from CSV
    const youthProfilesImported = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'youth_profiles_imported_from_csv'`);
    
    if (youthProfilesImported.length === 0) {
      console.log("Importing youth profiles from CSV file for the first time...");
      try {
        // Import youth profiles from the CSV file
        await importYouthProfilesFromCsv();
        console.log("Youth profiles imported successfully from CSV file!");
      } catch (error) {
        console.error("Error importing youth profiles from CSV file:", error);
      }
    } else {
      console.log("Youth profiles were already imported from CSV. Skipping import.");
    }

    // Check if admin permissions have been fixed
    const adminPermissionsFixed = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'admin_permissions_fixed'`);
    
    if (adminPermissionsFixed.length === 0) {
      console.log("Fixing admin permissions for the first time...");
      try {
        // Run the admin permissions fix
        await fixAdminPermissions();
        
        // Mark admin permissions as fixed
        await db.execute(sql`
          INSERT INTO migration_flags (flag_name, completed, completed_at)
          VALUES ('admin_permissions_fixed', true, NOW())
        `);
        console.log("Admin permissions fixed successfully and flag set!");
      } catch (error) {
        console.error("Error fixing admin permissions:", error);
      }
    } else {
      console.log("Admin permissions were already fixed. Skipping.");
    }
    
    // Check if system roles have been migrated to custom_roles
    const systemRolesMigratedFlag = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'system_roles_migrated'`)
      .limit(1);
      
    if (systemRolesMigratedFlag.length === 0) {
      console.log("Migrating system roles to custom_roles...");
      try {
        // Run the system roles migration
        await migrateSystemRoles();
        
        // Mark system roles migration as complete
        await db.execute(sql`
          INSERT INTO migration_flags (flag_name, completed, completed_at)
          VALUES ('system_roles_migrated', TRUE, NOW())
        `);
        console.log("System roles migrated to custom_roles successfully!");
      } catch (error) {
        console.error("Error migrating system roles:", error);
      }
    } else {
      console.log("System roles were already migrated. Skipping.");
    }
    
    // Check if mentors have been imported already
    const mentorsImported = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'mentors_imported'`);
    
    if (mentorsImported.length === 0) {
      console.log("Importing mentors for the first time...");
      try {
        // Import mentors
        await importMentors();
        
        // Mark mentors as imported
        await db.execute(sql`
          INSERT INTO migration_flags (flag_name, completed, completed_at)
          VALUES ('mentors_imported', true, NOW())
        `);
        console.log("Mentors imported successfully and flag set!");
      } catch (error) {
        console.error("Error importing mentors:", error);
      }
    } else {
      console.log("Mentors were already imported. Skipping import.");
    }
    
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error during database migration:", error);
    throw error;
  }
}

// Function to seed real participant data from the DARE program
async function seedRealParticipantData() {
  try {
    // Check if we already have real participant data
    const existingYouthCount = await db.select({ count: sql`count(*)::int` }).from(schema.youthProfiles);
    
    if (existingYouthCount[0].count > 10) {
      console.log(`Found ${existingYouthCount[0].count} existing youth profiles. Skipping seeding.`);
      console.log('If you want to re-seed, run clear-data.ts first to clear existing data.');
      return;
    }
    
    console.log('Seeding real participant data...');
    
    // Bekwai participants
    const bekwaiParticipants = [
      {
        id: 'D0015000277',
        name: 'Abigail Owusu',
        phone: '+233595699953',
        gender: 'Female',
        maritalStatus: 'Single',
        childrenCount: 0,
        yearOfBirth: 2003,
        age: 22,
        ageGroup: '20-24',
        district: 'Bekwai',
        town: 'Low Cost',
        coreSkills: 'Decoration',
        businessInterest: 'Not Specified',
        employmentStatus: 'Unemployed',
        pwdStatus: 'Not Disabled',
        dareModel: 'Collaborative',
      },
      {
        id: 'D0019000595',
        name: 'Adwoa Dansowaa',
        phone: '+233542695035',
        gender: 'Female',
        maritalStatus: 'Single',
        childrenCount: 2,
        yearOfBirth: 1995,
        age: 30,
        ageGroup: '30-34',
        district: 'Bekwai',
        town: 'Denyase',
        coreSkills: 'Social Media',
        businessInterest: 'Not Specified',
        employmentStatus: 'Unemployed',
        pwdStatus: 'Not Disabled',
        dareModel: 'Collaborative',
      },
      {
        id: 'D0011000042',
        name: 'Akosua Adomah',
        phone: '+233548531164',
        gender: 'Female',
        maritalStatus: 'Single',
        childrenCount: 3,
        yearOfBirth: 1992,
        age: 33,
        ageGroup: '30-34',
        district: 'Bekwai',
        town: 'Ankaase',
        coreSkills: 'Baking',
        businessInterest: 'Not Specified',
        employmentStatus: 'Unemployed',
        pwdStatus: 'Not Disabled',
        dareModel: 'Collaborative',
      },
      // Add a few more participants for demonstration
      {
        id: 'D0014000014',
        name: 'Alidu Zulfa',
        phone: '+233599728154',
        gender: 'Female',
        maritalStatus: 'Married',
        childrenCount: 0,
        yearOfBirth: 2002,
        age: 23,
        ageGroup: '20-24',
        district: 'Bekwai',
        town: 'Amoafo',
        coreSkills: 'Baking, Juicing',
        businessInterest: 'Not Specified',
        employmentStatus: 'Unemployed',
        pwdStatus: 'Not Disabled',
        dareModel: 'Collaborative',
      },
      {
        id: 'D0018000317',
        name: 'Charity Adjei',
        phone: '+233539585634',
        gender: 'Female',
        maritalStatus: 'Single',
        childrenCount: 3,
        yearOfBirth: 1994,
        age: 31,
        ageGroup: '30-34',
        district: 'Bekwai',
        town: 'Brosanse',
        coreSkills: 'Dressmaking',
        businessInterest: 'Not Specified',
        employmentStatus: 'Unemployed',
        pwdStatus: 'Not Disabled',
        dareModel: 'MakerSpace',
      }
    ];
    
    // Create user accounts and youth profiles for each participant
    for (const participant of bekwaiParticipants) {
      // Generate username from name and district
      const username = `${participant.name.toLowerCase().replace(/\s+/g, '_')}_${participant.district.toLowerCase()}`;
      
      try {
        // Check if user already exists
        const existingUser = await db.select().from(schema.users).where(sql`username = ${username}`).limit(1);
        
        let userId;
        
        if (existingUser.length > 0) {
          // User already exists, use that ID
          userId = existingUser[0].id;
          console.log(`User ${username} already exists, using existing account`);
        } else {
          // Create new user account with hashed password
          const salt = crypto.randomBytes(16).toString('hex');
          const hash = crypto.scryptSync('password123', salt, 64).toString('hex');
          const password = `${hash}.${salt}`;
          
          const [newUser] = await db.insert(schema.users).values({
            username,
            password,
            fullName: participant.name,
            role: 'mentee',
            district: participant.district,
          }).returning();
          
          userId = newUser.id;
          console.log(`Created new user account for ${participant.name}`);
        }
        
        // Check if profile already exists
        const existingProfile = await db.select()
          .from(schema.youthProfiles)
          .where(sql`user_id = ${userId}`)
          .limit(1);
        
        if (existingProfile.length > 0) {
          console.log(`Profile for ${participant.name} already exists, skipping`);
        } else {
          // Create youth profile with raw SQL to avoid schema mismatches
          await db.execute(sql`
            INSERT INTO youth_profiles (
              participant_code, full_name, district, town, 
              phone_number, gender, marital_status, children_count, 
              year_of_birth, age, age_group, core_skills, 
              business_interest, employment_status, pwd_status, 
              dare_model, training_status, program_status
            ) VALUES (
              ${userId}, ${participant.id}, ${participant.name}, ${participant.district}, ${participant.town},
              ${participant.phone}, ${participant.gender}, ${participant.maritalStatus}, ${participant.childrenCount},
              ${participant.yearOfBirth}, ${participant.age}, ${participant.ageGroup}, ${participant.coreSkills},
              ${participant.businessInterest}, ${participant.employmentStatus}, ${participant.pwdStatus},
              ${participant.dareModel}, 'Completed', 'Outreach'
            )
          `);
          
          console.log(`Created youth profile for ${participant.name}`);
        }
      } catch (error) {
        console.error(`Error creating profile for ${participant.name}:`, error);
      }
    }
    
    console.log(`Successfully seeded ${bekwaiParticipants.length} real participants!`);
  } catch (error) {
    console.error('Error seeding real participant data:', error);
  }
}

// Only run migration if file is executed directly (not imported)
// Only exit the process if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err: Error) => {
      console.error(err);
      process.exit(1);
    });
}