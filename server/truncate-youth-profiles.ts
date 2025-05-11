import { db } from './db';
import { sql } from 'drizzle-orm';
import { youthProfiles, users } from '@shared/schema';

/**
 * Script to truncate the youth_profiles table
 * This will prepare the database for clean import of the 53+ profiles
 */
async function truncateYouthProfiles() {
  try {
    console.log('Starting to truncate youth_profiles table...');
    
    // First count the existing profiles
    const countResult = await db.select({ count: sql`count(*)` }).from(youthProfiles);
    const profileCount = Number(countResult[0].count);
    
    console.log(`Found ${profileCount} youth profiles to remove`);
    
    // Delete all youth profiles - using DELETE instead of TRUNCATE to maintain referential integrity
    await db.delete(youthProfiles);
    
    console.log(`Successfully deleted all youth profiles!`);
    
    // Now delete all mentee users (excluding admins, mentors, etc)
    // Only delete users with role 'mentee' to ensure we don't remove important system users
    const userDeleteResult = await db.delete(users)
      .where(sql`role = 'mentee'`)
      .returning({ id: users.id });
    
    console.log(`Successfully deleted ${userDeleteResult.length} mentee user accounts`);
    
    console.log('Youth profiles and associated users have been removed successfully');
  } catch (error) {
    console.error('Error truncating youth profiles:', error);
    throw error;
  }
}

// Run the truncate function
truncateYouthProfiles().then(() => {
  console.log('Truncate operation completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Truncate operation failed:', error);
  process.exit(1);
});