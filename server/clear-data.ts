import { db } from './db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to clear all data from the database tables
 * This will prepare the database for seeding with real participant data
 */
async function clearAllData() {
  console.log('Starting database cleanup process...');
  
  try {
    // Disable foreign key checks to allow clearing tables with dependencies
    await db.execute(sql`SET session_replication_role = 'replica';`);
    
    // Business tracking table removed as part of new tracking system implementation
    
    console.log('Clearing mentor-business relationships...');
    await db.execute(sql`TRUNCATE TABLE mentor_business_relationships CASCADE;`);
    
    console.log('Clearing business-youth relationships...');
    await db.execute(sql`TRUNCATE TABLE business_youth_relationships CASCADE;`);
    
    console.log('Clearing business profiles...');
    await db.execute(sql`TRUNCATE TABLE business_profiles CASCADE;`);
    
    console.log('Clearing mentorship messages...');
    await db.execute(sql`TRUNCATE TABLE mentorship_messages CASCADE;`);
    
    console.log('Clearing business advice...');
    await db.execute(sql`TRUNCATE TABLE business_advice CASCADE;`);
    
    console.log('Clearing mentorship meetings...');
    await db.execute(sql`TRUNCATE TABLE mentorship_meetings CASCADE;`);
    
    console.log('Clearing education records...');
    await db.execute(sql`TRUNCATE TABLE education CASCADE;`);
    
    console.log('Clearing training records...');
    await db.execute(sql`TRUNCATE TABLE training CASCADE;`);
    
    console.log('Clearing certifications...');
    await db.execute(sql`TRUNCATE TABLE certifications CASCADE;`);
    
    console.log('Clearing mentors...');
    await db.execute(sql`TRUNCATE TABLE mentors CASCADE;`);
    
    console.log('Clearing youth profiles...');
    await db.execute(sql`TRUNCATE TABLE youth_profiles CASCADE;`);
    
    // Keep service categories and subcategories
    
    // Clear all users except admin user
    console.log('Clearing users (keeping admin)...');
    await db.execute(sql`DELETE FROM users WHERE username != 'admin';`);
    
    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin';`);
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    // Re-enable foreign key checks even if there was an error
    await db.execute(sql`SET session_replication_role = 'origin';`);
    throw error;
  }
}

// Run the cleanup process
clearAllData().catch(console.error);