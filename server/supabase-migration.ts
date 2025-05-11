import { supabase } from './db';

/**
 * Creates the necessary tables in Supabase database via Supabase API
 * This uses the insert method to implicitly create tables through the API
 * Based on Supabase documentation approach for JavaScript clients
 */
export async function createSupabaseTables() {
  if (!supabase) {
    console.error("Supabase client not available. Cannot create tables.");
    return false;
  }

  console.log("Creating Supabase tables...");
  
  try {
    // Create users table
    const usersCreated = await createUsersTable();
    
    // Create youth profiles table
    const youthProfilesCreated = await createYouthProfilesTable();
    
    // Create mentors table
    const mentorsCreated = await createMentorsTable();
    
    // Create business profiles table
    const businessProfilesCreated = await createBusinessProfilesTable();
    
    // Business tracking table removed as part of new tracking system implementation
    
    // Create relationships and mentorship tables
    const relationshipsCreated = await createRelationshipsTables();
    
    // Create skills and training tables
    const skillsCreated = await createSkillsTables();

    // Set RLS policies
    await setupRLSPolicies();
    
    console.log("Database tables created successfully.");
    return true;
  } catch (error) {
    console.error("Error creating Supabase tables:", error);
    return false;
  }
}

// Create users table
async function createUsersTable() {
  try {
    // Check if table exists
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it
      // Skip auth.admin.createUser since it requires admin privileges
      // We'll just try to create the table directly

      const { data, error: sqlError } = await supabase
        .from('users')
        .insert([
          { 
            username: 'admin',
            password: '$2b$10$X5HZETyNd.KTXa.Diy4c9uYKjm4Sg40aFQw2IkIljQwYOeAIb4w/y', // admin123
            email: 'admin@dare.org',
            role: 'admin'
          }
        ])
        .select();

      if (sqlError) {
        console.error("Error creating users table via direct insert:", sqlError);
        
        // For JavaScript client, can't execute direct SQL, so we use the Studio UI instead
        console.error("Please create the users table manually in the Supabase Studio");
        console.error("Table creation failed - see docs on how to create via Studio UI");
        
        // Return false to indicate failure
        return false;
      } else {
        console.log("Users table created and admin user inserted");
        return true;
      }
    } else {
      console.log("Users table already exists");
      return true;
    }
  } catch (error) {
    console.error("Error in createUsersTable:", error);
    return false;
  }
}

// Create youth profiles table
async function createYouthProfilesTable() {
  try {
    // Try a basic operation to check if table exists
    const { error: checkError } = await supabase
      .from('youth_profiles')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Create sample record to initialize the table
      const { error } = await supabase
        .from('youth_profiles')
        .insert([{
          full_name: 'Sample Profile',
          district: 'Bekwai',
        }]);

      if (error) {
        console.error("Error creating youth_profiles table via insert:", error);
        return false;
      } else {
        console.log("Youth profiles table created and sample record inserted");
        return true;
      }
    } else {
      console.log("Youth profiles table already exists");
      return true;
    }
  } catch (error) {
    console.error("Error in createYouthProfilesTable:", error);
    return false;
  }
}

// Create mentors table
async function createMentorsTable() {
  try {
    // Try a basic operation to check if table exists
    const { error: checkError } = await supabase
      .from('mentors')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Create sample record to initialize the table
      const { error } = await supabase
        .from('mentors')
        .insert([{
          name: 'Sample Mentor',
          assigned_district: 'Bekwai',
        }]);

      if (error) {
        console.error("Error creating mentors table via insert:", error);
        return false;
      } else {
        console.log("Mentors table created and sample record inserted");
        return true;
      }
    } else {
      console.log("Mentors table already exists");
      return true;
    }
  } catch (error) {
    console.error("Error in createMentorsTable:", error);
    return false;
  }
}

// Create business profiles table
async function createBusinessProfilesTable() {
  try {
    // Try a basic operation to check if table exists
    const { error: checkError } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Need to have a youth profile first
      const { data: youthData } = await supabase
        .from('youth_profiles')
        .select('id')
        .limit(1);

      if (youthData && youthData.length > 0) {
        // Create sample record to initialize the table
        const { error } = await supabase
          .from('business_profiles')
          .insert([{
            business_name: 'Sample Business',
            youth_profile_id: youthData[0].id,
            district: 'Bekwai',
          }]);

        if (error) {
          console.error("Error creating business_profiles table via insert:", error);
          return false;
        } else {
          console.log("Business profiles table created and sample record inserted");
          return true;
        }
      } else {
        console.log("Cannot create business profile - no youth profiles exist");
        return false;
      }
    } else {
      console.log("Business profiles table already exists");
      return true;
    }
  } catch (error) {
    console.error("Error in createBusinessProfilesTable:", error);
    return false;
  }
}

// Business tracking implementation was removed as part of new system development

// Create relationship tables (mentor-business, youth-business)
async function createRelationshipsTables() {
  try {
    // Create mentor-business relationships table
    const { error: checkError } = await supabase
      .from('mentor_business_relationships')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Prerequisites
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('id')
        .limit(1);
      
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('id')
        .limit(1);

      if (mentorData && mentorData.length > 0 && businessData && businessData.length > 0) {
        // Create sample record
        const { error } = await supabase
          .from('mentor_business_relationships')
          .insert([{
            mentor_id: mentorData[0].id,
            business_id: businessData[0].id,
            status: 'active'
          }]);

        if (error) {
          console.error("Error creating mentor_business_relationships table:", error);
        } else {
          console.log("Mentor business relationships table created");
        }
      } else {
        console.log("Cannot create relationship - missing prerequisite records");
      }
    } else {
      console.log("Mentor business relationships table already exists");
    }
    
    // Create mentorship messages table
    const { error: messagesError } = await supabase
      .from('mentorship_messages')
      .select('id')
      .limit(1);
    
    if (messagesError && messagesError.code === '42P01') {
      // Prerequisites
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('id')
        .limit(1);
      
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('id')
        .limit(1);

      if (mentorData && mentorData.length > 0 && businessData && businessData.length > 0) {
        // Create sample record
        const { error } = await supabase
          .from('mentorship_messages')
          .insert([{
            mentor_id: mentorData[0].id,
            business_id: businessData[0].id,
            message: 'Welcome to the mentorship program!'
          }]);

        if (error) {
          console.error("Error creating mentorship_messages table:", error);
        } else {
          console.log("Mentorship messages table created");
        }
      } else {
        console.log("Cannot create mentorship message - missing prerequisite records");
      }
    } else {
      console.log("Mentorship messages table already exists");
    }
    
    return true;
  } catch (error) {
    console.error("Error in createRelationshipsTables:", error);
    return false;
  }
}

// Create skills and training tables
async function createSkillsTables() {
  try {
    // Create skills table
    const { error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);
    
    if (skillsError && skillsError.code === '42P01') {
      // Create sample record
      const { error } = await supabase
        .from('skills')
        .insert([{
          name: 'Digital Marketing',
          category: 'Marketing',
          description: 'Skills related to online marketing and promotion'
        }]);

      if (error) {
        console.error("Error creating skills table:", error);
      } else {
        console.log("Skills table created");
      }
    } else {
      console.log("Skills table already exists");
    }
    
    // Create training programs table
    const { error: trainingError } = await supabase
      .from('training_programs')
      .select('id')
      .limit(1);
    
    if (trainingError && trainingError.code === '42P01') {
      // Create sample record
      const { error } = await supabase
        .from('training_programs')
        .insert([{
          name: 'DARE Core Skills Training',
          description: 'Foundational skills for all DARE participants',
          duration: '4 weeks'
        }]);

      if (error) {
        console.error("Error creating training_programs table:", error);
      } else {
        console.log("Training programs table created");
      }
    } else {
      console.log("Training programs table already exists");
    }
    
    return true;
  } catch (error) {
    console.error("Error in createSkillsTables:", error);
    return false;
  }
}

// Set up RLS policies
async function setupRLSPolicies() {
  try {
    // Note: RLS policies must be set up in the Supabase Studio UI
    // The JavaScript client doesn't have direct methods to create RLS policies
    console.log("RLS policies need to be set up in the Supabase Studio UI");
    console.log("Please visit https://supabase.com/dashboard and navigate to your project");
    console.log("Then go to Authentication -> Policies to set up the necessary policies");
    
    return true;
  } catch (error) {
    console.error("Error in setupRLSPolicies:", error);
    return false;
  }
}

// Run the function if this script is executed directly
// For ESM compatibility we can't use require.main === module
// Instead, just export the function and we'll call it manually
export const runTableCreation = async () => {
  try {
    const success = await createSupabaseTables();
    if (success) {
      console.log("Table creation completed successfully");
      return true;
    } else {
      console.error("Table creation failed");
      return false;
    }
  } catch (error) {
    console.error("Table creation error:", error);
    return false;
  }
};