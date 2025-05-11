import { db } from './db';
import { sql } from 'drizzle-orm';
import { youthProfiles, users } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// Load environment variables
dotenv.config();

const scryptAsync = promisify(scrypt);

/**
 * Hash a password
 * @param password - The password to hash
 * @returns The hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Check if youth profiles have already been imported from CSV
 * @returns boolean indicating if profiles have been imported
 */
async function checkIfYouthProfilesImportedFromCsv(): Promise<boolean> {
  try {
    // Create migration_flags table if it doesn't exist yet
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS migration_flags (
        id SERIAL PRIMARY KEY,
        flag_name TEXT NOT NULL UNIQUE,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP
      );
    `);
    
    // Check if youth profiles have been imported
    const youthProfilesImported = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'youth_profiles_imported_from_csv'`);
    
    return youthProfilesImported.length > 0;
  } catch (error) {
    console.error('Error checking if youth profiles have been imported from CSV:', error);
    return false;
  }
}

/**
 * Mark youth profiles as imported from CSV in the migration_flags table
 */
async function markYouthProfilesAsImportedFromCsv(): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('youth_profiles_imported_from_csv', true, NOW())
      ON CONFLICT (flag_name) DO UPDATE SET completed = true, completed_at = NOW()
    `);
    console.log('Youth profiles marked as imported from CSV in migration_flags table');
  } catch (error) {
    console.error('Error marking youth profiles as imported from CSV:', error);
    throw error;
  }
}

/**
 * Truncate all existing youth profiles and related users
 */
async function truncateYouthProfiles(): Promise<void> {
  try {
    console.log('Starting to truncate youth_profiles table...');
    
    // First count the existing profiles
    const countResult = await db.select({ count: sql`count(*)` }).from(youthProfiles);
    const profileCount = Number(countResult[0].count);
    
    console.log(`Found ${profileCount} youth profiles to remove`);
    
    // Remove the 'youth_profiles_imported_from_txt' flag if it exists
    await db.execute(sql`
      DELETE FROM migration_flags WHERE flag_name IN ('youth_profiles_imported_from_txt', 'youth_profiles_imported')
    `);
    console.log('Removed existing import flags');
    
    // Delete all youth profiles first
    await db.delete(youthProfiles);
    console.log('Successfully deleted all youth profiles!');
    
    // Now find and delete all mentee users (excluding admins, mentors, etc)
    // Only delete users with role 'mentee' to ensure we don't remove important system users
    const userDeleteResult = await db.delete(users)
      .where(sql`role = 'mentee'`)
      .returning({ id: users.id });
    
    console.log(`Successfully deleted ${userDeleteResult.length} mentee user accounts`);
  } catch (error) {
    console.error('Error truncating youth profiles:', error);
    throw error;
  }
}

/**
 * Parse the CSV file with youth profiles
 * @param filePath Path to the CSV file
 * @returns Parsed youth profile data
 */
async function parseYouthProfilesFromCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found at ${filePath}`));
      return;
    }
    
    // Create a readable stream from the file contents
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Handle BOM if present
    const content = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;
    
    // Create stream and process CSV
    console.log('CSV content first 200 chars:', content.substring(0, 200));
    
    // Create a simpler CSV parser
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, '')); // Remove BOM if present
    
    console.log('CSV headers:', headers);
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',');
      const row: Record<string, string> = {};
      
      // Ensure we don't go out of bounds with the headers
      for (let j = 0; j < Math.min(headers.length, values.length); j++) {
        row[headers[j]] = values[j]?.trim() || '';
      }
      
      results.push(row);
    }
    
    // Log some diagnostics
    if (results.length > 0) {
      console.log('First row sample:', JSON.stringify(results[0]));
    }
    
    console.log(`Parsed ${results.length} youth profiles from CSV file`);
    resolve(results);
  });
}

/**
 * Import youth profiles into the database
 * @param profilesData Youth profile data from CSV
 */
async function importYouthProfiles(profilesData: any[]): Promise<{ successCount: number, errorCount: number }> {
  try {
    console.log(`Starting import of ${profilesData.length} youth profiles from CSV...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const profile of profilesData) {
      try {
        // Skip rows where "Contacted" is "No" or empty
        if (profile['Contacted'] === 'No' || profile['Contacted'] === 'Unreachable' || !profile['Contacted']) {
          console.log(`Skipping profile for ${profile['Name']} as contact status is ${profile['Contacted']}`);
          continue;
        }
        
        // Skip if name is missing
        if (!profile['Name']) {
          console.log('Skipping profile with missing name');
          errorCount++;
          continue;
        }
        
        // Create username based on name and district
        const fullName = profile['Name'];
        const district = profile['District'] || 'Bekwai';
        const username = `${fullName.toLowerCase().replace(/\s+/g, '_')}_${district.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Create a user account
        const hashedPassword = await hashPassword('password123');
        const [user] = await db.insert(users).values({
          username,
          password: hashedPassword,
          fullName,
          email: null, // No email provided in the data
          role: 'mentee',
          district: district as any
        }).returning();
        
        // Parse numeric fields
        const childrenCount = profile['Children'] ? parseInt(profile['Children']) : 0;
        const yob = profile['YOB'] ? parseInt(profile['YOB']) : null;
        const age = profile['Age'] ? parseInt(profile['Age']) : null;
        
        // Parse boolean fields
        const isMadam = profile['Is_Madam'] === '1' || profile['Is_Madam'] === 'true' || profile['Is_Madam'] === '1';
        const isApprentice = profile['Is_Apprentice'] === '1' || profile['Is_Apprentice'] === 'true' || profile['Is_Apprentice'] === '1';
        
        // Handle DARE model conversion
        let dareModel = profile['DARE_Model'] || 'Collaborative';
        if (profile['Collaborative Model'] === 'yes') {
          dareModel = 'Collaborative';
        } else if (profile['Maker Space'] === 'yes') {
          dareModel = 'Maker Space';
        } else if (profile['Job Anchor (Madam)'] === 'yes') {
          dareModel = 'Job Anchor';
        }
        
        // Create the youth profile
        await db.insert(youthProfiles).values({
          userId: user.id,
          participantCode: profile['participant_code'] || null,
          fullName,
          district: district as any,
          town: profile['Town'] || '',
          phoneNumber: profile['Phone'] || profile['Phone_Number'] || '',
          email: null, // No email provided in the data
          gender: profile['Gender'] || '',
          maritalStatus: profile['Marital_Status'] || '',
          childrenCount,
          yearOfBirth: yob,
          age,
          ageGroup: profile['Age_Group'] || '',
          coreSkills: profile['Core_Skills'] || '',
          skillLevel: '', // Not directly provided
          businessInterest: profile['Business_Interest'] || 'Not Specified',
          employmentStatus: profile['Employment_Status'] || '',
          specificJob: profile['Specific_Job'] || '',
          pwdStatus: profile['PWD_Status'] || 'Not Disabled',
          dareModel: dareModel as any,
          isMadam,
          isApprentice,
          madamName: profile['Madam_Name'] || '',
          madamPhone: profile['Madam_Phone'] || '',
          apprenticeNames: profile['Apprentice_Name(s)'] || '',
          apprenticePhone: profile['Apprentice_Phone'] || '',
          guarantor: profile['Guarantor'] || '',
          guarantorPhone: profile['Guarantor_Phone'] || '',
          digitalSkills: profile['Digital_Skills'] || '',
          digitalSkills2: profile['Digital_Skills_2'] || '',
          financialAspirations: profile['Financial_Aspirations'] || '',
          dependents: profile['Dependents'] || '',
          nationalId: profile['National ID Number'] || '',
          trainingStatus: (profile['Training_Status'] === 'Completed' ? 'Completed' : 'In Progress') as any,
          programStatus: profile['Program_Status'] || 'Outreach',
          localMentorName: '', // Not provided in CSV
          localMentorContact: '', // Not provided in CSV
          emergencyContact: '', // Not provided in CSV
          transitionStatus: 'Not Started', // Default value
          onboardedToTracker: false // Default value
        });
        
        successCount++;
        console.log(`Imported youth profile for ${fullName}`);
      } catch (error) {
        console.error(`Error importing profile for ${profile['Name'] || 'unknown'}: ${error}`);
        errorCount++;
      }
    }
    
    console.log(`Youth profile CSV import completed: ${successCount} successful, ${errorCount} failed`);
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error importing youth profiles from CSV:', error);
    throw error;
  }
}

/**
 * Main function to import youth profiles from a CSV file
 */
export async function importYouthProfilesFromCsv(): Promise<void> {
  try {
    console.log('Starting youth profile import from CSV file...');
    
    // Check if profiles have already been imported from CSV
    const alreadyImported = await checkIfYouthProfilesImportedFromCsv();
    if (alreadyImported) {
      console.log('Youth profiles have already been imported from CSV. Skipping import.');
      return;
    }
    
    // Truncate existing youth profiles
    await truncateYouthProfiles();
    
    // Parse the profiles from the CSV file
    const filePath = '../attached_assets/DARE Youth.csv';
    const profiles = await parseYouthProfilesFromCsv(filePath);
    
    console.log(`Parsed ${profiles.length} youth profiles from CSV file`);
    
    // Import the profiles
    const importResult = await importYouthProfiles(profiles);
    
    // Mark profiles as imported
    await markYouthProfilesAsImportedFromCsv();
    
    console.log(`
====== YOUTH PROFILE CSV IMPORT SUMMARY ======
- Truncated all existing youth profiles
- Parsed ${profiles.length} profiles from CSV file
- Imported ${importResult.successCount} profiles successfully
- Failed to import ${importResult.errorCount} profiles
=========================================
    `);
  } catch (error) {
    console.error('Error importing youth profiles from CSV file:', error);
    throw error;
  }
}

// Run the import function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importYouthProfilesFromCsv().then(() => {
    console.log('Youth profile import from CSV file completed');
    process.exit(0);
  }).catch(error => {
    console.error('Youth profile import from CSV file failed:', error);
    process.exit(1);
  });
}