import { db } from './db';
import { sql } from 'drizzle-orm';
import { youthProfiles, users } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

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
 * Mark additional youth profiles as imported
 */
async function markAdditionalYouthProfilesAsImported(): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('additional_youth_profiles_imported', true, NOW())
      ON CONFLICT (flag_name) DO UPDATE SET completed = true, completed_at = NOW()
    `);
    console.log('Additional youth profiles marked as imported in migration_flags table');
  } catch (error) {
    console.error('Error marking additional youth profiles as imported:', error);
    throw error;
  }
}

/**
 * Check if additional youth profiles have already been imported
 * @returns boolean indicating if additional profiles have been imported
 */
async function checkIfAdditionalYouthProfilesImported(): Promise<boolean> {
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
    
    // Check if additional youth profiles have been imported
    const additionalYouthProfilesImported = await db.select()
      .from(sql`migration_flags`)
      .where(sql`flag_name = 'additional_youth_profiles_imported'`);
    
    return additionalYouthProfilesImported.length > 0;
  } catch (error) {
    console.error('Error checking if additional youth profiles have been imported:', error);
    return false;
  }
}

/**
 * Get list of existing participant codes to avoid duplicates
 */
async function getExistingParticipantCodes(): Promise<Set<string>> {
  try {
    const existingProfiles = await db.select({
      participantCode: youthProfiles.participantCode
    }).from(youthProfiles);
    
    const existingCodes = new Set<string>();
    for (const profile of existingProfiles) {
      if (profile.participantCode) {
        existingCodes.add(profile.participantCode);
      }
    }
    
    console.log(`Found ${existingCodes.size} existing participant codes`);
    return existingCodes;
  } catch (error) {
    console.error('Error getting existing participant codes:', error);
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
 * Import additional youth profiles into the database
 * @param profilesData Youth profile data from CSV
 * @param existingCodes Set of existing participant codes
 */
async function importAdditionalYouthProfiles(
  profilesData: any[], 
  existingCodes: Set<string>
): Promise<{ successCount: number, errorCount: number, skippedCount: number }> {
  try {
    console.log(`Starting import of additional youth profiles from CSV...`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const profile of profilesData) {
      try {
        // Skip rows where "Contacted" is "No" or empty
        if (profile['Contacted'] === 'No' || profile['Contacted'] === 'Unreachable' || !profile['Contacted']) {
          console.log(`Skipping profile for ${profile['Name']} as contact status is ${profile['Contacted']}`);
          skippedCount++;
          continue;
        }
        
        // Skip if name is missing
        if (!profile['Name']) {
          console.log('Skipping profile with missing name');
          skippedCount++;
          continue;
        }
        
        // Check if participant code already exists
        const participantCode = profile['participant_code'] || '';
        if (participantCode && existingCodes.has(participantCode)) {
          console.log(`Skipping profile for ${profile['Name']} as participant code ${participantCode} already exists`);
          skippedCount++;
          continue;
        }
        
        // Create username based on name and district
        const fullName = profile['Name'];
        const district = profile['District'] || 'Bekwai';
        const username = `${fullName.toLowerCase().replace(/\s+/g, '_')}_${district.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
        
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
          dareModel = 'MakerSpace';
        } else if (profile['Job Anchor (Madam)'] === 'yes') {
          dareModel = 'Madam Anchor';
        }
        
        // Create the youth profile
        await db.insert(youthProfiles).values({
          userId: user.id,
          participantCode: participantCode || null,
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
    
    console.log(`Additional youth profile CSV import completed: ${successCount} successful, ${errorCount} failed, ${skippedCount} skipped`);
    return { successCount, errorCount, skippedCount };
  } catch (error) {
    console.error('Error importing additional youth profiles from CSV:', error);
    throw error;
  }
}

/**
 * Main function to import additional youth profiles from a CSV file
 */
export async function importAdditionalYouthProfiles(): Promise<void> {
  try {
    console.log('Starting additional youth profile import from CSV file...');
    
    // Check if additional profiles have already been imported
    const alreadyImported = await checkIfAdditionalYouthProfilesImported();
    if (alreadyImported) {
      console.log('Additional youth profiles have already been imported. Skipping import.');
      return;
    }
    
    // Get existing participant codes
    const existingCodes = await getExistingParticipantCodes();
    
    // Parse the profiles from the CSV file
    let profiles;
    const filePath = './attached_assets/DARE Youth.csv';
    try {
      profiles = await parseYouthProfilesFromCsv(filePath);
    } catch (error) {
      // If the file isn't found at the first path, try an alternative path
      console.log(`Could not find CSV at ${filePath}, trying alternative path...`);
      const altFilePath = '../attached_assets/DARE Youth.csv';
      profiles = await parseYouthProfilesFromCsv(altFilePath);
    }
    
    console.log(`Parsed ${profiles.length} youth profiles from CSV file`);
    
    // Import the profiles
    const importResult = await importAdditionalYouthProfiles(profiles, existingCodes);
    
    // Mark profiles as imported
    await markAdditionalYouthProfilesAsImported();
    
    console.log(`
====== ADDITIONAL YOUTH PROFILE CSV IMPORT SUMMARY ======
- Parsed ${profiles.length} profiles from CSV file
- Imported ${importResult.successCount} profiles successfully
- Failed to import ${importResult.errorCount} profiles
- Skipped ${importResult.skippedCount} profiles (duplicates or invalid)
=========================================
    `);
  } catch (error) {
    console.error('Error importing additional youth profiles from CSV file:', error);
    throw error;
  }
}

// Run the import function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importAdditionalYouthProfiles().then(() => {
    console.log('Additional youth profile import from CSV file completed');
    process.exit(0);
  }).catch(error => {
    console.error('Additional youth profile import from CSV file failed:', error);
    process.exit(1);
  });
}