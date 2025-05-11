import { createClient } from '@supabase/supabase-js';
import { RequestHandler } from 'express';

// You need to provide these as environment secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if the required environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY");
}

// Create a Supabase client (will be null if environment variables are missing)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Middleware to check if Supabase client is initialized
export const requireSupabase: RequestHandler = (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ 
      error: "Supabase connection not available. Please check environment variables." 
    });
  }
  next();
};

// Function to test the Supabase connection
export async function testSupabaseConnection() {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return false;
  }

  try {
    // Test query using Supabase client
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    
    console.log("Supabase connection test successful");
    return true;
  } catch (err) {
    console.error("Error testing Supabase connection:", err);
    return false;
  }
}

// Check if all tables exist in Supabase, if not, return which are missing
export async function checkSupabaseTables() {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };

  try {
    // Get schema information from Supabase
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      return { success: false, error: error.message };
    }

    // List of required tables
    const requiredTables = [
      'users', 
      'youth_profiles', 
      'mentors',
      'business_profiles',
      'business_tracking',
      'business_youth_relationships',
      'mentor_business_relationships',
      'mentorship_meetings',
      'mentorship_messages',
      'service_categories',
      'service_subcategories',
      'skills',
      'training',
      'training_programs',
      'youth_skills',
      'youth_training',
      'education',
      'certifications',
      'business_activity_log',
      'business_advice',
      'equipment_inventory',
      'reports'
    ];

    // Extract table names from data
    const existingTables = data?.map(table => table.tablename) || [];
    
    // Find missing tables
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    return {
      success: missingTables.length === 0,
      existingTables,
      missingTables,
      allRequired: requiredTables
    };
  } catch (err) {
    console.error("Error checking Supabase tables:", err);
    return { success: false, error: String(err) };
  }
}