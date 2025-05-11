/**
 * Script to add transition-related fields to youth_profiles
 * This migration will add new fields according to the DARE Transition Program Framework
 */

import { db } from "./db.js";
import { sql } from "drizzle-orm";

export async function addTransitionFieldsMigration() {
  try {
    // Check if the transition_status column already exists to avoid duplicate migrations
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'transition_status'
    `);

    if (checkColumn.length === 0) {
      console.log("Adding transition_status column to youth_profiles table");
      
      // Add transition_status column
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN transition_status TEXT DEFAULT 'Not Started'
      `);
      
      console.log("transition_status column added successfully");
    } else {
      console.log("transition_status column already exists in youth_profiles table, skipping");
    }

    // Check if the onboarded_to_tracker column already exists
    const checkOnboardedColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'onboarded_to_tracker'
    `);

    if (checkOnboardedColumn.length === 0) {
      console.log("Adding onboarded_to_tracker column to youth_profiles table");
      
      // Add onboarded_to_tracker column
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN onboarded_to_tracker BOOLEAN DEFAULT false
      `);
      
      console.log("onboarded_to_tracker column added successfully");
    } else {
      console.log("onboarded_to_tracker column already exists in youth_profiles table, skipping");
    }

    // Check if the local_mentor_name column already exists
    const checkLocalMentorColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'local_mentor_name'
    `);

    if (checkLocalMentorColumn.length === 0) {
      console.log("Adding local_mentor_name column to youth_profiles table");
      
      // Add local_mentor_name column
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN local_mentor_name TEXT
      `);
      
      console.log("local_mentor_name column added successfully");
    } else {
      console.log("local_mentor_name column already exists in youth_profiles table, skipping");
    }

    // Check if the local_mentor_contact column already exists
    const checkLocalMentorContactColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_profiles' AND column_name = 'local_mentor_contact'
    `);

    if (checkLocalMentorContactColumn.length === 0) {
      console.log("Adding local_mentor_contact column to youth_profiles table");
      
      // Add local_mentor_contact column
      await db.execute(sql`
        ALTER TABLE youth_profiles 
        ADD COLUMN local_mentor_contact TEXT
      `);
      
      console.log("local_mentor_contact column added successfully");
    } else {
      console.log("local_mentor_contact column already exists in youth_profiles table, skipping");
    }

    console.log("Transition fields migration completed successfully!");
  } catch (error) {
    console.error("Error during transition fields migration:", error);
    throw error;
  }
}

// Only run migration if file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  addTransitionFieldsMigration()
    .then(() => {
      console.log("Transition fields migration completed successfully!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Transition fields migration failed:", err);
      process.exit(1);
    });
}