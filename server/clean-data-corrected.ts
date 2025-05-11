import { db } from './db';
import { 
  youthProfiles, youthSkills, 
  education, certifications, youthTraining,
  users, mentors, mentorBusinessRelationships
} from '@shared/schema';
import { ne } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to clear all youth-related data and user accounts (except admin)
 */
async function cleanData() {
  console.log('Starting database cleanup process...');
  
  try {
    // Delete all mentor-business relationships first
    console.log('Clearing mentor-business relationships...');
    await db.delete(mentorBusinessRelationships);

    // Delete all youth skills
    console.log('Clearing youth skills...');
    await db.delete(youthSkills);
    
    // Delete all youth training
    console.log('Clearing youth training...');
    await db.delete(youthTraining);
    
    // Delete all education records
    console.log('Clearing education records...');
    await db.delete(education);
    
    // Delete all certifications
    console.log('Clearing certifications...');
    await db.delete(certifications);
    
    // Delete all youth profiles
    console.log('Clearing youth profiles...');
    await db.delete(youthProfiles);
    
    // Delete all mentors
    console.log('Clearing mentors...');
    await db.delete(mentors);
    
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
cleanData()
  .then(() => {
    console.log('All youth data and user accounts (except admin) have been deleted!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  });