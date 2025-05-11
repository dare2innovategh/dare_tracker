/**
 * Script to add transition-related fields to youth_profiles
 * This migration will add new fields according to the DARE Transition Program Framework
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export async function addTransitionFieldsMigration() {
  try {
    console.log("Starting migration to add transition-related fields to youth_profiles table...");
    
    // Check if transition_status column exists in youth_profiles
    const transitionStatusExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'youth_profiles' AND column_name = 'transition_status'
      );
    `);
    
    if (!transitionStatusExists.rows[0].exists) {
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN transition_status TEXT 
        DEFAULT 'Not Started'
        CHECK (transition_status IN ('Not Started', 'In Progress', 'Operational'));
      `);
      console.log("transition_status column added to youth_profiles table");
    } else {
      console.log("transition_status column already exists in youth_profiles table, skipping");
    }
    
    // Check if onboarded_to_tracker column exists in youth_profiles
    const onboardedToTrackerExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'youth_profiles' AND column_name = 'onboarded_to_tracker'
      );
    `);
    
    if (!onboardedToTrackerExists.rows[0].exists) {
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN onboarded_to_tracker BOOLEAN 
        DEFAULT false;
      `);
      console.log("onboarded_to_tracker column added to youth_profiles table");
    } else {
      console.log("onboarded_to_tracker column already exists in youth_profiles table, skipping");
    }
    
    // Check if local_mentor_name column exists in youth_profiles
    const localMentorNameExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'youth_profiles' AND column_name = 'local_mentor_name'
      );
    `);
    
    if (!localMentorNameExists.rows[0].exists) {
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN local_mentor_name TEXT;
      `);
      console.log("local_mentor_name column added to youth_profiles table");
    } else {
      console.log("local_mentor_name column already exists in youth_profiles table, skipping");
    }
    
    // Check if local_mentor_contact column exists in youth_profiles
    const localMentorContactExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'youth_profiles' AND column_name = 'local_mentor_contact'
      );
    `);
    
    if (!localMentorContactExists.rows[0].exists) {
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN local_mentor_contact TEXT;
      `);
      console.log("local_mentor_contact column added to youth_profiles table");
    } else {
      console.log("local_mentor_contact column already exists in youth_profiles table, skipping");
    }
    
    console.log("Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Error in addTransitionFieldsMigration:", error);
    return false;
  }
}