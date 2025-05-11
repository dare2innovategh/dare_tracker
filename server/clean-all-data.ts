import { db } from './db';
import { 
  businessTracking, mentorBusinessRelationships, businessYouthRelationships,
  businessProfiles, mentorshipMessages, businessAdvice, mentorshipMeetings,
  education, training, certifications, mentors, youthProfiles, youthSkills,
  users
} from '@shared/schema';
import { eq, ne } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to clear all data from the database tables using DELETE instead of TRUNCATE
 * This will prepare the database for clean testing
 */
async function cleanAllData() {
  console.log('Starting database cleanup process using DELETE...');
  
  try {
    console.log('Clearing youth skills...');
    await db.delete(youthSkills);
    
    console.log('Clearing business tracking data...');
    await db.delete(businessTracking);
    
    console.log('Clearing mentor-business relationships...');
    await db.delete(mentorBusinessRelationships);
    
    console.log('Clearing business-youth relationships...');
    await db.delete(businessYouthRelationships);
    
    console.log('Clearing mentorship messages...');
    await db.delete(mentorshipMessages);
    
    console.log('Clearing business advice...');
    await db.delete(businessAdvice);
    
    console.log('Clearing mentorship meetings...');
    await db.delete(mentorshipMeetings);
    
    console.log('Clearing education records...');
    await db.delete(education);
    
    console.log('Clearing training records...');
    await db.delete(training);
    
    console.log('Clearing certifications...');
    await db.delete(certifications);
    
    console.log('Clearing mentors...');
    await db.delete(mentors);
    
    console.log('Clearing youth profiles...');
    await db.delete(youthProfiles);
    
    console.log('Clearing business profiles...');
    await db.delete(businessProfiles);
    
    // Clear all users except admin user
    console.log('Clearing users (keeping admin)...');
    await db.delete(users).where(ne(users.username, 'admin'));
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  }
}

// Run the cleanup process
cleanAllData()
  .then(() => {
    console.log('Database cleanup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  });