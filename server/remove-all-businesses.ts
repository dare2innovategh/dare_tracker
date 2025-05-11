import { db } from './db';
import { 
  businessProfiles, 
  businessYouthRelationships,
  businessTracking,
  equipmentInventory,
  businessActivityLog,
  mentorBusinessRelationships,
  mentorshipMeetings,
  mentorshipMessages
} from '@shared/schema';

/**
 * Script to remove all businesses and related data from the database
 * This will maintain referential integrity by removing data in the correct order
 */
async function removeAllBusinesses() {
  try {
    console.log('Starting to remove all businesses and related data...');
    
    // 1. First remove mentorship messages
    console.log('Removing mentorship messages...');
    await db.delete(mentorshipMessages);
    
    // 2. Remove mentorship meetings
    console.log('Removing mentorship meetings...');
    await db.delete(mentorshipMeetings);
    
    // 3. Remove mentor-business relationships
    console.log('Removing mentor-business relationships...');
    await db.delete(mentorBusinessRelationships);
    
    // 4. Remove business activity logs
    console.log('Removing business activity logs...');
    await db.delete(businessActivityLog);
    
    // 5. Remove equipment inventory
    console.log('Removing equipment inventory...');
    await db.delete(equipmentInventory);
    
    // 6. Remove business tracking data
    console.log('Removing business tracking data...');
    await db.delete(businessTracking);
    
    // 7. Remove business-youth relationships
    console.log('Removing business-youth relationships...');
    await db.delete(businessYouthRelationships);
    
    // 8. Finally, remove the business profiles
    console.log('Removing business profiles...');
    await db.delete(businessProfiles);
    
    console.log('All businesses and related data removed successfully!');
  } catch (error) {
    console.error('Error removing businesses:', error);
    throw error;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  removeAllBusinesses().then(() => {
    console.log('Businesses removal completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('Businesses removal failed:', error);
    process.exit(1);
  });
}

export { removeAllBusinesses };