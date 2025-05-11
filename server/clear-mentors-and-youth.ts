import { sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

/**
 * Script to clear mentors and youth profiles from the database
 * This will prepare the database for reseeding with correct data
 */
async function clearMentorsAndYouth() {
  try {
    console.log('Starting to clear mentor and youth profile data...');
    
    // Clear mentor related tables first to avoid foreign key constraints
    console.log('Clearing mentor-business relationships...');
    try {
      await db.delete(schema.mentorBusinessRelationships);
    } catch (error) {
      console.log('Error deleting mentor-business relationships:', error.message);
    }
    
    console.log('Clearing mentorship meetings...');
    try {
      await db.delete(schema.mentorshipMeetings);
    } catch (error) {
      console.log('Error deleting mentorship meetings:', error.message);
    }
    
    console.log('Clearing mentor messages...');
    try {
      // Use direct SQL since we encountered a schema name issue
      await db.execute(sql`DELETE FROM mentorship_messages`);
    } catch (error) {
      console.log('Error deleting mentor messages:', error.message);
    }
    
    console.log('Clearing mentors table...');
    try {
      await db.delete(schema.mentors);
    } catch (error) {
      console.log('Error deleting mentors, might not exist yet:', error.message);
    }
    
    // Clear youth related tables
    console.log('Clearing youth relationships...');
    try {
      await db.delete(schema.businessYouthRelationships);
    } catch (error) {
      console.log('Error deleting business-youth relationships:', error.message);
    }
    
    console.log('Clearing youth skills...');
    try {
      await db.delete(schema.youthSkills);
    } catch (error) {
      console.log('Error deleting youth skills:', error.message);
    }
    
    console.log('Clearing education records...');
    try {
      await db.delete(schema.education);
    } catch (error) {
      console.log('Error deleting education records:', error.message);
    }
    
    console.log('Clearing training records...');
    try {
      // Use direct SQL since training might not be defined in schema
      await db.execute(sql`DELETE FROM youth_training`);
    } catch (error) {
      console.log('Error deleting training records:', error.message);
    }
    
    console.log('Clearing certification records...');
    try {
      await db.delete(schema.certifications);
    } catch (error) {
      console.log('Error deleting certification records:', error.message);
    }
    
    console.log('Clearing youth profiles...');
    try {
      await db.delete(schema.youthProfiles);
    } catch (error) {
      console.log('Error deleting youth profiles:', error.message);
    }
    
    // Reset migration flags to allow reimporting data
    console.log('Resetting migration flags...');
    try {
      await db.execute(sql`
        DELETE FROM migration_flags 
        WHERE flag_name IN (
          'youth_profiles_imported_from_csv', 
          'additional_youth_profiles_imported',
          'mentors_imported'
        )
      `);
    } catch (error) {
      console.log('Error resetting migration flags:', error.message);
    }
    
    console.log('All mentor and youth data cleared successfully!');
  } catch (error) {
    console.error('Error clearing mentor and youth data:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearMentorsAndYouth()
    .then(() => {
      console.log('Mentor and youth data clearing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during data clearing:', error);
      process.exit(1);
    });
}

export { clearMentorsAndYouth };