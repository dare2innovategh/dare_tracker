import * as fs from 'fs';
import { db } from './db';
import { youthProfiles, skills, youthSkills } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { convertObjectKeysToSnakeCase } from './utils';

/**
 * Direct import of youth profiles from TSV file
 * This script will import the data directly into the database
 */
async function directImportYouthProfiles() {
  try {
    console.log('Starting direct import of youth profiles...');
    
    // Read the TSV file
    const filePath = '../attached_assets/Pasted-Contacted-No-participant-code-Name-Phone-Phone-Number-Gender-Marital-Status-Children-YOB-Age-Age-G-1745229839133.txt';
    console.log(`Attempting to read file from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Parse headers (first line)
    const headers = lines[0].split('\t');
    
    // Map header indices
    const headerMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      headerMap[header.trim()] = index;
    });
    
    // Define required header mappings
    const fieldMappings: Record<string, string[]> = {
      fullName: ['Name'],
      participantCode: ['participant_code'],
      district: ['District'],
      town: ['Town'],
      phoneNumber: ['Phone_Number', 'Phone'],
      gender: ['Gender'],
      maritalStatus: ['Marital_Status'],
      childrenCount: ['Children'],
      yearOfBirth: ['YOB'],
      age: ['Age'],
      ageGroup: ['Age_Group'],
      coreSkills: ['Core_Skills'],
      businessInterest: ['Business_Interest', 'Sector'],
      employmentStatus: ['Employment_Status'],
      specificJob: ['Specific_Job'],
      pwdStatus: ['PWD_Status'],
      dareModel: ['DARE_Model'],
      madamName: ['Madam_Name'],
      madamPhone: ['Madam_Phone'],
      guarantor: ['Guarantor'],
      guarantorPhone: ['Guarantor_Phone'],
      digitalSkills: ['Digital_Skills'],
      financialAspirations: ['Financial_Aspirations'],
      nationalId: ['National ID Number'],
      trainingStatus: ['Training_Status'],
      programStatus: ['Program_Status'],
    };
    
    // Get existing skills from database
    const existingSkills = await db.select().from(skills);
    const skillMap = new Map<string, number>();
    existingSkills.forEach((skill) => {
      // Create a map of lowercase skill names to skill IDs for fuzzy matching
      skillMap.set(skill.name.toLowerCase(), skill.id);
    });
    
    console.log(`Found ${existingSkills.length} existing skills in the database`);
    
    let imported = 0;
    let skipped = 0;
    const errorRows: number[] = [];
    
    // Process each data row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines
      
      const values = line.split('\t');
      if (values.length < 5) continue; // Skip lines with insufficient data
      
      try {
        // Previously we were filtering by "Contacted" status, but now we're importing all records
        // Keeping the index lookup for logging purposes
        const contactedIndex = headerMap['Contacted'] || 0;
        const contacted = values[contactedIndex]?.trim();
        
        console.log(`Processing row ${i + 1} - Contact status: ${contacted || 'Not specified'}`);
        
        // We no longer skip based on "Contacted" status
        
        // Extract data based on header mappings
        const profile: Record<string, any> = {
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Set default values as requested
        profile.trainingStatus = 'Completed';
        profile.programStatus = 'Outreach';
        
        // Ensure district is one of the valid enum values
        const validDistricts = ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"];
        
        // Extract field values using mappings
        for (const [field, possibleHeaders] of Object.entries(fieldMappings)) {
          let value = null;
          
          // Try each possible header name
          for (const header of possibleHeaders) {
            const index = headerMap[header];
            if (index !== undefined && values[index] && values[index].trim()) {
              value = values[index].trim();
              break;
            }
          }
          
          // Handle specific field types
          if (field === 'childrenCount' || field === 'yearOfBirth' || field === 'age') {
            profile[field] = value ? parseInt(value, 10) : null;
            // Ensure NaN values become null
            if (isNaN(profile[field])) profile[field] = null;
          } else if (field === 'district' && value) {
            // Ensure district is one of the valid enum values
            if (validDistricts.includes(value)) {
              profile[field] = value;
            } else {
              // Default to Bekwai if invalid district
              console.log(`Invalid district "${value}" for ${profile.fullName || 'unknown'}, defaulting to Bekwai`);
              profile[field] = "Bekwai";
            }
          } else {
            profile[field] = value;
          }
        }
        
        // Skip if no full name
        if (!profile.fullName) {
          console.log(`Skipping row ${i + 1} - Missing full name`);
          skipped++;
          continue;
        }
        
        // Check if profile already exists by participant code
        if (profile.participantCode) {
          const existingProfile = await db.select()
            .from(youthProfiles)
            .where(eq(youthProfiles.participantCode, profile.participantCode));
          
          if (existingProfile.length > 0) {
            console.log(`Skipping row ${i + 1} - Profile with code ${profile.participantCode} already exists`);
            skipped++;
            continue;
          }
        }
        
        // Insert the profile
        console.log(`Importing profile: ${profile.fullName} (${profile.participantCode || 'No code'})`);
        
        // Convert camelCase keys to snake_case for database compatibility
        const dbProfile = convertObjectKeysToSnakeCase(profile);
        console.log('Converted profile with snake_case keys:', dbProfile);
        
        const [newProfile] = await db.insert(youthProfiles).values(dbProfile).returning();
        
        // Match skills if core skills are present
        if (profile.coreSkills && newProfile.id) {
          const coreSkillsList = profile.coreSkills.split(',').map((s: string) => s.trim());
          
          for (const skillName of coreSkillsList) {
            if (!skillName) continue;
            
            // Try to find matching skill in the database
            let matchedSkillId = null;
            
            // Try exact match first
            const skillNormalized = skillName.toLowerCase();
            if (skillMap.has(skillNormalized)) {
              matchedSkillId = skillMap.get(skillNormalized);
            } else {
              // Try partial matches
              for (const [existingSkill, skillId] of skillMap.entries()) {
                if (skillNormalized.includes(existingSkill) || 
                    existingSkill.includes(skillNormalized)) {
                  matchedSkillId = skillId;
                  break;
                }
              }
            }
            
            // If we found a match, associate the skill with the youth profile
            if (matchedSkillId) {
              try {
                // Create youth skill relation and convert to snake_case
                const youthSkill = convertObjectKeysToSnakeCase({
                  youthId: newProfile.id,
                  skillId: matchedSkillId,
                  proficiency: 'Beginner',
                  createdAt: new Date()
                });
                
                await db.insert(youthSkills).values(youthSkill);
                console.log(`Added skill ${matchedSkillId} to profile ${newProfile.id}`);
              } catch (error) {
                console.log(`Error adding skill ${matchedSkillId} to profile ${newProfile.id}: ${error}`);
              }
            }
          }
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}: ${error}`);
        errorRows.push(i + 1);
      }
    }
    
    console.log('Youth profile import completed!');
    console.log(`Successfully imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    
    if (errorRows.length > 0) {
      console.log(`Errors in rows: ${errorRows.join(', ')}`);
    }
    
    return { imported, skipped, errorRows };
  } catch (error) {
    console.error('Error importing youth profiles:', error);
    throw error;
  }
}

// Run the import function
directImportYouthProfiles()
  .then(() => {
    console.log('Direct import complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });

export { directImportYouthProfiles };