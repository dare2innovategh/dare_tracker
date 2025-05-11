import fs from 'fs';
import { storage } from './storage';
import { db } from './db';
import { youthSkills, skills, youthProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Import youth profiles from a tab-separated values (TSV) file
 * @param options Import options
 */
export async function importYouthProfilesFromTSV(options: { 
  filePath: string;
  clearExisting?: boolean;
}): Promise<{ importedCount: number; skippedCount: number }> {
  console.log(`Starting youth profile import from TSV file: ${options.filePath}`);
  
  // Clear existing profiles if requested
  if (options.clearExisting) {
    console.log('Clearing existing youth profiles before import...');
    try {
      // Clear youth skills first (foreign key constraint)
      await db.delete(youthSkills);
      
      // Then clear youth profiles
      await db.delete(youthProfiles);
      console.log('Existing youth profiles cleared successfully');
    } catch (error) {
      console.error('Error clearing existing youth profiles:', error);
      throw new Error('Failed to clear existing youth profiles');
    }
  }
  
  // Initialize counters
  let importedCount = 0;
  let skippedCount = 0;
  
  try {
    // Read and parse the TSV file
    const fileContent = fs.readFileSync(options.filePath, 'utf8');
    const rows = fileContent.split('\n').filter(line => line.trim());
    
    // Get the headers from the first row
    const headers = rows[0].split('\t').map(header => header.trim());
    
    // Fetch all skills from the database for mapping
    const allSkills = await db.select().from(skills);
    
    // Process each row (skip the header row)
    for (let i = 1; i < rows.length; i++) {
      try {
        const row = rows[i].split('\t');
        if (row.length < 10) {
          console.warn(`Skipping row ${i+1}: Insufficient columns (expected at least 10, got ${row.length})`);
          skippedCount++;
          continue;
        }
        
        // Create a mapping of headers to values
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (index < row.length) {
            rowData[header] = row[index].trim();
          }
        });
        
        // Extract core fields
        const participantCode = rowData['Participant Code'] || rowData['participantCode'] || null;
        const fullName = rowData['Full Name'] || rowData['Name'] || rowData['fullName'] || '';
        const phoneNumber = rowData['Phone Number'] || rowData['Phone'] || rowData['phoneNumber'] || null;
        const gender = rowData['Gender'] || rowData['gender'] || null;
        const district = rowData['District'] || rowData['district'] || null;
        const town = rowData['Town'] || rowData['town'] || null;
        const maritalStatus = rowData['Marital Status'] || rowData['maritalStatus'] || null;
        const childrenCount = parseInt(rowData['Children'] || rowData['childrenCount'] || '0') || 0;
        
        // Parse age and year of birth
        let yearOfBirth: number | null = null;
        let age: number | null = null;
        
        if (rowData['YOB'] || rowData['yearOfBirth']) {
          const yobValue = rowData['YOB'] || rowData['yearOfBirth'];
          yearOfBirth = parseInt(yobValue) || null;
        }
        
        if (rowData['Age'] || rowData['age']) {
          const ageValue = rowData['Age'] || rowData['age'];
          age = parseInt(ageValue) || null;
        }
        
        const ageGroup = rowData['Age Group'] || rowData['ageGroup'] || null;
        
        // Business and employment fields
        const businessInterest = rowData['Business Interest'] || rowData['businessInterest'] || null;
        const employmentStatus = rowData['Employment Status'] || rowData['employmentStatus'] || null;
        const specificJob = rowData['Specific Job'] || rowData['specificJob'] || null;
        
        // DARE model fields
        const pwdStatus = rowData['PWD Status'] || rowData['pwdStatus'] || null;
        const dareModel = rowData['DARE Model'] || rowData['dareModel'] || null;
        
        // Madam-apprentice relationship
        const isMadam = (rowData['Is Madam'] || rowData['isMadam'] || '').toLowerCase() === 'yes' || (rowData['Is Madam'] || rowData['isMadam'] || '').toLowerCase() === 'true';
        const isApprentice = (rowData['Is Apprentice'] || rowData['isApprentice'] || '').toLowerCase() === 'yes' || (rowData['Is Apprentice'] || rowData['isApprentice'] || '').toLowerCase() === 'true';
        const madamName = rowData['Madam Name'] || rowData['madamName'] || null;
        const madamPhone = rowData['Madam Phone'] || rowData['madamPhone'] || null;
        
        // Apprentice information
        let apprenticeNames: string[] = [];
        if (rowData['Apprentice Names'] || rowData['apprenticeNames']) {
          const names = rowData['Apprentice Names'] || rowData['apprenticeNames'] || '';
          apprenticeNames = names.split(',').map(name => name.trim()).filter(Boolean);
        }
        
        const apprenticePhone = rowData['Apprentice Phone'] || rowData['apprenticePhone'] || null;
        
        // Guarantor information
        const guarantor = rowData['Guarantor'] || rowData['guarantor'] || null;
        const guarantorPhone = rowData['Guarantor Phone'] || rowData['guarantorPhone'] || null;
        
        // Skills and aspirations
        const coreSkills = rowData['Core Skills'] || rowData['coreSkills'] || null;
        const digitalSkills = rowData['Digital Skills'] || rowData['digitalSkills'] || null;
        const digitalSkills2 = rowData['Digital Skills 2'] || rowData['digitalSkills2'] || null;
        const financialAspirations = rowData['Financial Aspirations'] || rowData['financialAspirations'] || null;
        
        // Other fields
        const dependents = rowData['Dependents'] || rowData['dependents'] || null;
        const nationalId = rowData['National ID'] || rowData['nationalId'] || null;
        
        // Set status as requested
        const trainingStatus = "Completed";
        const programStatus = "Outreach";
        
        // Check if this participant code already exists
        if (participantCode) {
          const existingProfile = await storage.getYouthProfileByParticipantCode(participantCode);
          if (existingProfile) {
            console.log(`Skipping duplicate participant code: ${participantCode}`);
            skippedCount++;
            continue;
          }
        }
        
        // Prepare the youth profile data
        const profileData = {
          participantCode,
          fullName,
          phoneNumber,
          gender,
          district,
          town,
          maritalStatus,
          childrenCount,
          yearOfBirth,
          age,
          ageGroup,
          businessInterest,
          employmentStatus,
          specificJob,
          pwdStatus,
          dareModel,
          isMadam,
          isApprentice,
          madamName,
          madamPhone,
          apprenticeNames: apprenticeNames.length > 0 ? apprenticeNames : null,
          apprenticePhone,
          guarantor,
          guarantorPhone,
          digitalSkills,
          digitalSkills2,
          financialAspirations,
          dependents,
          nationalId,
          trainingStatus,
          programStatus,
          // Additional fields required by the schema
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Create the youth profile
        const createdProfile = await storage.createYouthProfile(profileData);
        
        // Handle skills if present
        if (coreSkills && createdProfile) {
          // Parse skills and identify any matching skills in the database
          const skillsList = coreSkills.split(',').map(s => s.trim()).filter(Boolean);
          
          for (const skillName of skillsList) {
            // Find a matching skill in the database
            const matchingSkill = allSkills.find(s => 
              s.name.toLowerCase() === skillName.toLowerCase() ||
              skillName.toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(skillName.toLowerCase())
            );
            
            if (matchingSkill) {
              // Add skill to the youth profile
              await storage.addSkillToYouthProfile(createdProfile.id, matchingSkill.id);
            } else {
              console.log(`Could not find matching skill in database for: ${skillName}`);
            }
          }
        }
        
        console.log(`Imported youth profile: ${fullName} (${participantCode})`);
        importedCount++;
      } catch (error) {
        console.error(`Error importing row ${i+1}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`Import completed: ${importedCount} profiles imported, ${skippedCount} profiles skipped`);
    return { importedCount, skippedCount };
  } catch (error) {
    console.error('Error importing youth profiles from TSV:', error);
    throw new Error('Failed to import youth profiles from TSV file');
  }
}