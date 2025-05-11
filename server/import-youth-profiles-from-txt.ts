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
 * Check if youth profiles have already been imported
 * @returns boolean indicating if profiles have been imported
 */
async function checkIfYouthProfilesImported(): Promise<boolean> {
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
      .where(sql`flag_name = 'youth_profiles_imported_from_txt'`);
    
    return youthProfilesImported.length > 0;
  } catch (error) {
    console.error('Error checking if youth profiles have been imported:', error);
    return false;
  }
}

/**
 * Mark youth profiles as imported in the migration_flags table
 */
async function markYouthProfilesAsImported(): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('youth_profiles_imported_from_txt', true, NOW())
      ON CONFLICT (flag_name) DO UPDATE SET completed = true, completed_at = NOW()
    `);
    console.log('Youth profiles marked as imported in migration_flags table');
  } catch (error) {
    console.error('Error marking youth profiles as imported:', error);
    throw error;
  }
}

/**
 * Parse the text file with youth profiles
 * The file has no clear column separators but uses fixed widths
 * @param filePath Path to the text file
 * @returns Parsed youth profile data
 */
function parseYouthProfilesFromTxt(filePath: string): any[] {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split into lines
    const lines = fileContent.split('\n');
    
    // Define the column headers manually based on inspection of the file
    const headers = [
      'Created_Profile', 'District', 'participant_code', 'Name', 'Surname', 'Other_Names',
      'Phone', 'Phone_Number', 'Gender', 'Marital_Status', 'Children', 'YOB', 'Age',
      'Age_Group', 'Town', 'Core_Skills', 'Industry_Expertise', 'Education_Level',
      'Business_Interest', 'Employment_Status', 'Specific_Job', 'PWD_Status',
      'DARE_Model', 'Is_Madam', 'Is_Apprentice', 'Madam_Name', 'Madam_Phone',
      'Madam_Phone2', 'Apprentice_Name', 'Apprentice_Phone', 'Guarantor_Name',
      'Guarantor_Phone', 'Guarantor_Phone2', 'Local_Mentor', 'Local_Mentor_Contact',
      'Emergency_Contact', 'Emergency_Contact2', 'Financial_Aspirations', 'Dependents',
      'National_ID_Number', 'Recruited_for_Training', 'Training_Status', 'Program_Status'
    ];
    
    // Parse data from data lines (skip header line)
    const profiles = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty lines
      if (!line) continue;
      
      // Process each line
      const parts = line.split(/\s+/);
      const profile: Record<string, any> = {};
      
      // First part is always "Yes" for Created_Profile
      let partIndex = 0;
      profile['Created_Profile'] = parts[partIndex++];
      
      // District is always next
      profile['District'] = parts[partIndex++];
      
      // Participant code follows and is a unique identifier
      profile['participant_code'] = parts[partIndex++];
      
      // Name, which might be multiple words
      let nameEnd = partIndex;
      // Find the next numeric field (Phone)
      while (nameEnd < parts.length && !/^\d+$/.test(parts[nameEnd])) {
        nameEnd++;
      }
      
      // The name is all parts from partIndex to nameEnd
      profile['Name'] = parts.slice(partIndex, nameEnd).join(' ');
      partIndex = nameEnd;
      
      // Phone number is a sequence of digits
      profile['Phone'] = parts[partIndex++];
      
      // Next is the formatted phone number with country code
      profile['Phone_Number'] = parts[partIndex++];
      
      // Gender
      profile['Gender'] = parts[partIndex++];
      
      // Marital status
      profile['Marital_Status'] = parts[partIndex++];
      
      // Number of children (numeric)
      profile['Children'] = parts[partIndex++];
      
      // Year of birth (numeric)
      profile['YOB'] = parts[partIndex++];
      
      // Age (numeric)
      profile['Age'] = parts[partIndex++];
      
      // Age group (e.g., 20-24)
      profile['Age_Group'] = parts[partIndex++];
      
      // Town (might be multiple words)
      let townEnd = partIndex;
      // Town ends where we find a skilled field like "Dressmaking"
      const skillsKeywords = [
        'Dressmaking', 'Baking', 'Decoration', 'Hairdressing', 'Trading',
        'Social', 'Neating', 'Pastries', 'Beadmaking', 'Not Specified'
      ];
      
      while (townEnd < parts.length) {
        if (skillsKeywords.some(keyword => parts[townEnd].includes(keyword))) {
          break;
        }
        townEnd++;
      }
      
      profile['Town'] = parts.slice(partIndex, townEnd).join(' ');
      partIndex = townEnd;
      
      // Core skills can be compound like "Baking, Juicing"
      let skillsEnd = partIndex;
      while (skillsEnd < parts.length && 
             !['Not', 'Specified'].includes(parts[skillsEnd])) {
        skillsEnd++;
      }
      
      profile['Core_Skills'] = parts.slice(partIndex, skillsEnd).join(' ');
      partIndex = skillsEnd;
      
      // Industry expertise, education level, business interest are usually "Not Specified"
      if (parts[partIndex] === 'Not' && parts[partIndex + 1] === 'Specified') {
        profile['Industry_Expertise'] = 'Not Specified';
        partIndex += 2;
      } else {
        profile['Industry_Expertise'] = parts[partIndex++];
      }
      
      if (parts[partIndex] === 'Not' && parts[partIndex + 1] === 'Specified') {
        profile['Education_Level'] = 'Not Specified';
        partIndex += 2;
      } else {
        profile['Education_Level'] = parts[partIndex++];
      }
      
      if (parts[partIndex] === 'Not' && parts[partIndex + 1] === 'Specified') {
        profile['Business_Interest'] = 'Not Specified';
        partIndex += 2;
      } else {
        profile['Business_Interest'] = parts[partIndex++];
      }
      
      // Employment status
      profile['Employment_Status'] = parts[partIndex++];
      
      // Skip Specific_Job if not present (look for PWD_Status)
      if (['Not', 'Disabled'].includes(parts[partIndex])) {
        profile['Specific_Job'] = '';
      } else {
        profile['Specific_Job'] = parts[partIndex++];
      }
      
      // PWD Status
      if (parts[partIndex] === 'Not' && parts[partIndex + 1] === 'Disabled') {
        profile['PWD_Status'] = 'Not Disabled';
        partIndex += 2;
      } else if (parts[partIndex] === 'Disabled') {
        profile['PWD_Status'] = 'Disabled';
        partIndex++;
      } else {
        // Default
        profile['PWD_Status'] = 'Not Disabled';
      }
      
      // DARE Model
      if (['Collaborative', 'Maker', 'Space', 'Job', 'Anchor', 'Not', 'Specified'].includes(parts[partIndex])) {
        if (parts[partIndex] === 'Maker' && parts[partIndex + 1] === 'Space') {
          profile['DARE_Model'] = 'Maker Space';
          partIndex += 2;
        } else if (parts[partIndex] === 'Job' && parts[partIndex + 1] === 'Anchor') {
          profile['DARE_Model'] = 'Job Anchor';
          partIndex += 2;
        } else if (parts[partIndex] === 'Not' && parts[partIndex + 1] === 'Specified') {
          profile['DARE_Model'] = 'Not Specified';
          partIndex += 2;
        } else {
          profile['DARE_Model'] = parts[partIndex++];
        }
      } else {
        profile['DARE_Model'] = 'Not Specified';
      }
      
      // Is Madam (0 or 1)
      profile['Is_Madam'] = parts[partIndex++];
      
      // Is Apprentice (0 or 1)
      profile['Is_Apprentice'] = parts[partIndex++];
      
      // Remaining fields may not exist for all profiles, check the length
      if (partIndex < parts.length) {
        // Check for Madam Name if Is_Apprentice is 1
        if (profile['Is_Apprentice'] === '1') {
          // Get Madam Name
          let madamNameEnd = partIndex;
          while (madamNameEnd < parts.length && !/^\d+$/.test(parts[madamNameEnd])) {
            madamNameEnd++;
          }
          
          profile['Madam_Name'] = parts.slice(partIndex, madamNameEnd).join(' ');
          partIndex = madamNameEnd;
          
          // Madam Phone would be next if present
          if (partIndex < parts.length && /^\d+$/.test(parts[partIndex])) {
            profile['Madam_Phone'] = parts[partIndex++];
          }
          
          // Formatted Madam Phone would be next if present
          if (partIndex < parts.length && parts[partIndex].startsWith('+233')) {
            profile['Madam_Phone2'] = parts[partIndex++];
          }
        }
      }
      
      // Continue with the remaining fields, if present
      if (partIndex < parts.length) {
        if (parts[partIndex] === 'yes' || parts[partIndex] === 'yes,') {
          profile['Local_Mentor'] = 'yes';
          partIndex++;
        }
      }
      
      // Training Status and Program Status are usually the last two fields
      if (partIndex < parts.length && ['Completed', 'In', 'Progress'].includes(parts[partIndex])) {
        if (parts[partIndex] === 'In' && parts[partIndex + 1] === 'Progress') {
          profile['Training_Status'] = 'In Progress';
          partIndex += 2;
        } else {
          profile['Training_Status'] = parts[partIndex++];
        }
      }
      
      // Program Status (usually "Outreach")
      if (partIndex < parts.length) {
        profile['Program_Status'] = parts[partIndex++];
      }
      
      profiles.push(profile);
    }
    
    return profiles;
  } catch (error) {
    console.error('Error parsing youth profiles from TXT file:', error);
    throw error;
  }
}

/**
 * Import youth profiles into the database
 * @param profilesData Youth profile data
 */
async function importYouthProfiles(profilesData: any[]): Promise<{ successCount: number, errorCount: number }> {
  try {
    console.log(`Starting import of ${profilesData.length} youth profiles...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const profile of profilesData) {
      try {
        // Check if we have the necessary data
        if (!profile['Name']) {
          console.log('Skipping profile with missing name');
          errorCount++;
          continue;
        }
        
        // Format the name - combine Name, Surname, and Other_Names
        const firstName = profile['Name'] || '';
        const surname = profile['Surname'] || '';
        const otherNames = profile['Other_Names'] || '';
        
        // Combine all name parts, filtering out empty strings
        const fullName = [firstName, surname, otherNames].filter(Boolean).join(' ');
        
        // Normalize district name
        const district = profile['District'] || 'Bekwai';
        
        // Create a username based on the name and district
        const username = `${firstName.toLowerCase().replace(/\s+/g, '_')}_${district.toLowerCase().replace(/\s+/g, '_')}`;
        
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
        
        // Extract age information
        const yob = profile['YOB'] ? parseInt(profile['YOB']) : null;
        const age = profile['Age'] ? parseInt(profile['Age']) : null;
        const ageGroup = profile['Age_Group'] || '';
        
        // Extract child information
        const childrenCount = profile['Children'] ? parseInt(profile['Children']) : 0;
        
        // Convert string boolean values to actual booleans
        const isMadam = profile['Is_Madam'] === '1' || profile['Is_Madam'] === 'true' || profile['Is_Madam'] === '1';
        const isApprentice = profile['Is_Apprentice'] === '1' || profile['Is_Apprentice'] === 'true' || profile['Is_Apprentice'] === '1';
        
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
          ageGroup,
          coreSkills: profile['Core_Skills'] || '',
          skillLevel: '', // Not provided in the data
          businessInterest: profile['Business_Interest'] || '',
          employmentStatus: profile['Employment_Status'] || '',
          specificJob: profile['Specific_Job'] || '',
          pwdStatus: profile['PWD_Status'] || 'Not Disabled',
          dareModel: (profile['DARE_Model'] || 'Collaborative') as any,
          isMadam,
          isApprentice,
          madamName: profile['Madam_Name'] || '',
          madamPhone: profile['Madam_Phone'] || '',
          apprenticeNames: profile['Apprentice_Name(s)'] || '',
          apprenticePhone: profile['Apprentice_Phone'] || '',
          guarantor: profile['Guarantor_Name'] || '',
          guarantorPhone: profile['Guarantor_Phone'] || '',
          digitalSkills: '', // Not provided in the data
          digitalSkills2: '', // Not provided in the data
          financialAspirations: profile['Financial_Aspirations'] || '',
          dependents: profile['Dependents'] || '',
          nationalId: profile['National_ID_Number'] || '',
          trainingStatus: (profile['Training_Status'] === 'Completed' ? 'Completed' : 'In Progress') as any,
          programStatus: profile['Program_Status'] || 'Outreach',
          localMentorName: profile['Local_Mentor'] || '',
          localMentorContact: profile['Local_Mentor_Contact'] || '',
          emergencyContact: profile['Emergency_Contact'] || '',
          transitionStatus: 'Not Started', // Default value
          onboardedToTracker: false // Default value
        });
        
        successCount++;
        console.log(`Imported youth profile for ${fullName}`);
      } catch (error) {
        console.error(`Error importing profile: ${error}`);
        errorCount++;
      }
    }
    
    console.log(`Youth profile import completed: ${successCount} successful, ${errorCount} failed`);
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error importing youth profiles:', error);
    throw error;
  }
}

/**
 * Main function to import youth profiles from a TXT file
 */
export async function importYouthProfilesFromTxt(): Promise<void> {
  try {
    console.log('Starting youth profile import from TXT file...');
    
    // Check if profiles have already been imported
    const alreadyImported = await checkIfYouthProfilesImported();
    if (alreadyImported) {
      console.log('Youth profiles have already been imported. Skipping import.');
      return;
    }
    
    // Parse the profiles from the TXT file
    const filePath = './attached_assets/Pasted-Created-Profile-District-participant-code-Name-Surname-Other-Names-Phone-Phone-Number-Gender-Marita-1745413922824.txt';
    const profiles = parseYouthProfilesFromTxt(filePath);
    
    console.log(`Parsed ${profiles.length} youth profiles from TXT file`);
    
    // Import the profiles
    const importResult = await importYouthProfiles(profiles);
    
    // Mark profiles as imported
    await markYouthProfilesAsImported();
    
    console.log(`
====== YOUTH PROFILE IMPORT SUMMARY ======
- Parsed ${profiles.length} profiles from TXT file
- Imported ${importResult.successCount} profiles successfully
- Failed to import ${importResult.errorCount} profiles
=========================================
    `);
  } catch (error) {
    console.error('Error importing youth profiles from TXT file:', error);
    throw error;
  }
}

// Run the import function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importYouthProfilesFromTxt().then(() => {
    console.log('Youth profile import from TXT file completed');
    process.exit(0);
  }).catch(error => {
    console.error('Youth profile import from TXT file failed:', error);
    process.exit(1);
  });
}