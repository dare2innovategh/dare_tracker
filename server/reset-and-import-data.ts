import { clearMentorsAndYouth } from './clear-mentors-and-youth';
import { importYouthProfilesWithoutUsers } from './import-youth-without-users';
import { importNewMentors } from './import-new-mentors';

/**
 * Reset and import data script
 * 1. Clear existing mentors and youth profiles
 * 2. Import youth profiles without user accounts
 * 3. Import new mentors with user accounts
 */
async function resetAndImportData() {
  try {
    console.log('Starting complete data reset and import process...');
    
    // Step 1: Clear existing data
    console.log('\n=== STEP 1: CLEARING EXISTING DATA ===');
    await clearMentorsAndYouth();
    
    // Step 2: Import youth profiles
    console.log('\n=== STEP 2: IMPORTING YOUTH PROFILES ===');
    await importYouthProfilesWithoutUsers();
    
    // Step 3: Import mentors
    console.log('\n=== STEP 3: IMPORTING MENTORS ===');
    await importNewMentors();
    
    console.log('\n=== DATA RESET AND IMPORT COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Error during data reset and import:', error);
    throw error;
  }
}

// Run the complete process if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetAndImportData()
    .then(() => {
      console.log('Data reset and import completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Data reset and import failed:', error);
      process.exit(1);
    });
}