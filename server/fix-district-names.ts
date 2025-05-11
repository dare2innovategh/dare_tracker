import { db } from './db';
import { businessProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to fix district names in business profiles
 * Removes the ", Ghana" suffix from district values
 */
async function fixDistrictNames() {
  try {
    console.log('Starting to fix district names in business profiles...');
    
    // Get all business profiles
    const profiles = await db.select().from(businessProfiles);
    
    // Fix district names
    for (const profile of profiles) {
      if (profile.district && profile.district.endsWith(', Ghana')) {
        const newDistrict = profile.district.replace(', Ghana', '');
        console.log(`Updating district for ${profile.businessName}: ${profile.district} -> ${newDistrict}`);
        
        await db.update(businessProfiles)
          .set({ district: newDistrict })
          .where(eq(businessProfiles.id, profile.id));
      }
    }
    
    console.log('District names fixed successfully!');
  } catch (error) {
    console.error('Error fixing district names:', error);
    throw error;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDistrictNames().then(() => {
    console.log('District names fixing completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('District names fixing failed:', error);
    process.exit(1);
  });
}

export { fixDistrictNames };