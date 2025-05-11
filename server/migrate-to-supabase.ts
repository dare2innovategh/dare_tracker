import { storage } from './storage';
import { supabaseStorage } from './supabase-storage';
import { supabase } from './db';
import { db } from './db';
import { createSupabaseTables } from './supabase-migration';
import { 
  User, 
  YouthProfile, 
  Mentor, 
  BusinessProfile, 
  BusinessTracking 
} from '@shared/schema';

/**
 * Migrates all data from Replit PostgreSQL to Supabase
 * This script will move all entities while maintaining relationships
 */
export async function migrateToSupabase() {
  if (!supabase) {
    console.error("Supabase client not available. Cannot migrate.");
    return;
  }

  console.log("Starting migration to Supabase...");
  
  try {
    // 1. Migrate users first (needed for other entities)
    console.log("Migrating users...");
    const users = await storage.getAllUsers();
    let migratedUserCount = 0;
    
    for (const user of users) {
      // Check if user already exists in Supabase to avoid duplicates
      const existingUser = await supabaseStorage.getUserByUsername(user.username);
      if (!existingUser) {
        await supabaseStorage.createUser({
          ...user,
          id: undefined // Let Supabase generate a new ID
        });
        migratedUserCount++;
      }
    }
    console.log(`Migrated ${migratedUserCount} users`);
    
    // 2. Migrate youth profiles
    console.log("Migrating youth profiles...");
    const profiles = await storage.getAllYouthProfiles();
    let migratedProfileCount = 0;
    
    for (const profile of profiles) {
      // Check if profile already exists
      const existingProfiles = await supabaseStorage.getAllYouthProfiles();
      const exists = existingProfiles.some(p => 
        p.fullName === profile.fullName && 
        p.district === profile.district
      );
      
      if (!exists) {
        // Create a sanitized copy without ID
        const profileToMigrate = {
          ...profile,
          id: undefined, // Let Supabase generate a new ID
        };
        
        await supabaseStorage.createYouthProfile(profileToMigrate);
        migratedProfileCount++;
      }
    }
    console.log(`Migrated ${migratedProfileCount} youth profiles`);
    
    // 3. Migrate mentors
    console.log("Migrating mentors...");
    const mentors = await storage.getAllMentors();
    let migratedMentorCount = 0;
    
    for (const mentor of mentors) {
      // Check if mentor already exists
      const existingMentors = await supabaseStorage.getAllMentors ? 
        await supabaseStorage.getAllMentors() : [];
        
      const exists = existingMentors.some(m => 
        m.fullName === mentor.fullName && 
        m.district === mentor.district
      );
      
      if (!exists && supabaseStorage.createMentor) {
        // Create a sanitized copy without ID
        const mentorToMigrate = {
          ...mentor,
          id: undefined, // Let Supabase generate a new ID
        };
        
        await supabaseStorage.createMentor(mentorToMigrate);
        migratedMentorCount++;
      }
    }
    console.log(`Migrated ${migratedMentorCount} mentors`);
    
    // 4. Migrate business profiles
    console.log("Migrating business profiles...");
    const businesses = await storage.getAllBusinessProfiles();
    let migratedBusinessCount = 0;
    
    for (const business of businesses) {
      // Check if business already exists
      const existingBusinesses = await supabaseStorage.getAllBusinessProfiles ?
        await supabaseStorage.getAllBusinessProfiles() : [];
        
      const exists = existingBusinesses.some(b => 
        b.businessName === business.businessName && 
        b.youthProfileId === business.youthProfileId
      );
      
      if (!exists && supabaseStorage.createBusinessProfile) {
        // Create a sanitized copy without ID
        const businessToMigrate = {
          ...business,
          id: undefined, // Let Supabase generate a new ID
        };
        
        await supabaseStorage.createBusinessProfile(businessToMigrate);
        migratedBusinessCount++;
      }
    }
    console.log(`Migrated ${migratedBusinessCount} business profiles`);
    
    // 5. Migrate business tracking data
    console.log("Migrating business tracking data...");
    const allBusinesses = await supabaseStorage.getAllBusinessProfiles ? 
      await supabaseStorage.getAllBusinessProfiles() : [];
      
    let migratedTrackingCount = 0;
    
    if (allBusinesses.length > 0 && supabaseStorage.createBusinessTracking) {
      for (const business of allBusinesses) {
        // Get tracking data for this business
        const trackings = await storage.getBusinessTrackingsByBusinessId(business.id);
        
        for (const tracking of trackings) {
          // Create a sanitized copy without ID
          const trackingToMigrate = {
            ...tracking,
            id: undefined, // Let Supabase generate a new ID
          };
          
          await supabaseStorage.createBusinessTracking(trackingToMigrate);
          migratedTrackingCount++;
        }
      }
    }
    console.log(`Migrated ${migratedTrackingCount} business tracking records`);
    
    // Add more entity migrations as needed
    
    console.log("Migration to Supabase completed successfully!");
    return true;
  } catch (error) {
    console.error("Error during migration to Supabase:", error);
    return false;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToSupabase()
    .then(success => {
      if (success) {
        console.log("Migration completed successfully");
        process.exit(0);
      } else {
        console.error("Migration failed");
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}