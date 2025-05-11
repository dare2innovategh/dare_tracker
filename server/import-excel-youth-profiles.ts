import ExcelJS from 'exceljs';
import { db } from './db';
import { youthProfiles, insertYouthProfileSchema, skills, youthSkills } from '../shared/schema';
import path from 'path';
import { sql, eq } from 'drizzle-orm';

// Main import function
async function importYouthProfiles(options: { clearExisting?: boolean } = {}) {
  try {
    console.log('Starting youth profiles import from Excel...');
    const filePath = path.resolve('./dare_database_export_2025-04-12.xlsx');
    console.log(`Reading Excel file from: ${filePath}`);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Get the Youth Profiles worksheet
    const worksheet = workbook.getWorksheet('Youth Profiles');
    if (!worksheet) {
      throw new Error('Youth Profiles worksheet not found in Excel file');
    }
    
    console.log(`Found worksheet with ${worksheet.rowCount} rows`);
    
    // Get header row to map column names to indexes
    const headers: Record<string, number> = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[cell.value?.toString() ?? ''] = colNumber;
    });
    
    console.log('Headers found:', Object.keys(headers));
    
    // Check for required headers based on actual Excel file
    const requiredHeaders = [
      'ID', 'District', 'Contact Info', 'Full Name'
    ];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        throw new Error(`Required header "${header}" not found in Excel file`);
      }
    }
    
    // Get all skills from the database to map to youth skills
    const allSkills = await db.select().from(skills);
    console.log(`Found ${allSkills.length} skills in the database for mapping`);
    
    // Clear existing youth profiles if needed
    if (options.clearExisting) {
      console.log('Clearing existing youth profiles before import...');
      await db.execute(sql`TRUNCATE TABLE youth_profiles RESTART IDENTITY CASCADE`);
      console.log('Youth profiles table cleared successfully');
    }
    
    // Process each row (skip header row)
    let importedCount = 0;
    let skippedCount = 0;
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Skip empty rows
      if (!row.getCell(headers['ID']).value) {
        continue;
      }
      
      try {
        // Extract data from row using available headers
        const fullName = row.getCell(headers['Full Name']).value?.toString() || '';
        const district = row.getCell(headers['District']).value?.toString() || '';
        const town = row.getCell(headers['Town'])?.value?.toString() || '';
        const contactInfo = row.getCell(headers['Contact Info']).value?.toString() || '';
        const businessName = row.getCell(headers['Business Name'])?.value?.toString() || '';
        const businessLocation = row.getCell(headers['Business Location'])?.value?.toString() || '';
        const businessContact = row.getCell(headers['Business Contact'])?.value?.toString() || '';
        const dareModel = row.getCell(headers['DARE Model'])?.value?.toString() || '';
        const serviceCategory = row.getCell(headers['Service Category'])?.value?.toString() || '';
        const skillLevel = row.getCell(headers['Skill Level'])?.value?.toString() || '';
        const yearsOfExperience = row.getCell(headers['Years of Experience'])?.value || 0;
        const primarySkills = row.getCell(headers['Primary Skills'])?.value?.toString() || '';
        const secondarySkills = row.getCell(headers['Secondary Skills'])?.value?.toString() || '';
        const dareTraining = row.getCell(headers['DARE Training'])?.value?.toString() || '';
        
        // Parse registration date
        let createdAt: Date;
        const rawCreatedAt = row.getCell(headers['Created At'])?.value;
        
        if (rawCreatedAt instanceof Date) {
          createdAt = rawCreatedAt;
        } else if (typeof rawCreatedAt === 'string') {
          createdAt = new Date(rawCreatedAt);
        } else if (typeof rawCreatedAt === 'number') {
          // Excel stores dates as serial numbers, convert to JS date
          createdAt = new Date((rawCreatedAt - 25569) * 86400 * 1000);
        } else {
          createdAt = new Date();
        }
        
        // As per requirements, set training status to "Completed" and program status to "Outreach"
        const trainingStatus = "Completed";
        const programStatus = "Outreach";
        
        // Split skills into arrays
        const primarySkillsArray = primarySkills.split(',').map(skill => skill.trim()).filter(Boolean);
        const secondarySkillsArray = secondarySkills.split(',').map(skill => skill.trim()).filter(Boolean);
        
        // Insert the youth profile
        const result = await db.execute(sql`
          INSERT INTO youth_profiles (
            full_name, district, town, phone_number,
            business_interest, business_location, 
            business_contact, dare_model, industry_expertise,
            skill_level, years_of_experience, core_skills,
            digital_skills, training_status, program_status,
            created_at
          ) VALUES (
            ${fullName}, ${district}, ${town}, ${contactInfo},
            ${businessName}, ${businessLocation},
            ${businessContact}, ${dareModel}, ${serviceCategory},
            ${skillLevel}, ${yearsOfExperience}, ${primarySkills},
            ${secondarySkills}, ${trainingStatus}, ${programStatus},
            ${createdAt.toISOString()}
          )
          RETURNING id
        `);
        
        // Get the ID of the inserted profile
        const profileId = result.rows[0]?.id;
        
        if (profileId) {
          // Map and insert skills for this youth
          // First, process primary skills
          for (const skillName of primarySkillsArray) {
            // Find matching skills in database (case-insensitive)
            const matchingSkills = allSkills.filter(skill => 
              skill.name.toLowerCase() === skillName.toLowerCase() || 
              skillName.toLowerCase().includes(skill.name.toLowerCase())
            );
            
            if (matchingSkills.length > 0) {
              // Get the first matching skill
              const skill = matchingSkills[0];
              
              // Add youth-skill relationship
              await db.insert(youthSkills).values({
                youthId: profileId,
                skillId: skill.id,
                proficiencyLevel: 'Primary',
                yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : 0
              });
            } else {
              console.log(`Could not find matching skill for: ${skillName}`);
            }
          }
          
          // Then, process secondary skills
          for (const skillName of secondarySkillsArray) {
            // Find matching skills in database (case-insensitive)
            const matchingSkills = allSkills.filter(skill => 
              skill.name.toLowerCase() === skillName.toLowerCase() || 
              skillName.toLowerCase().includes(skill.name.toLowerCase())
            );
            
            if (matchingSkills.length > 0) {
              // Get the first matching skill
              const skill = matchingSkills[0];
              
              // Add youth-skill relationship
              await db.insert(youthSkills).values({
                youthId: profileId,
                skillId: skill.id,
                proficiencyLevel: 'Secondary',
                yearsOfExperience: Math.max(typeof yearsOfExperience === 'number' ? Math.floor(yearsOfExperience / 2) : 0, 1)
              });
            } else {
              console.log(`Could not find matching skill for: ${skillName}`);
            }
          }
        }
        
        console.log(`Imported youth profile: ${fullName}`);
        importedCount++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`Import completed. Imported: ${importedCount}, Skipped: ${skippedCount}`);
    return { importedCount, skippedCount };
  } catch (error) {
    console.error('Youth profile import failed:', error);
    throw error;
  }
}

// Run the import if this script is executed directly
// In ESM we can't use require.main === module, so we'll skip this for now
// This function will be called by the API endpoint

export { importYouthProfiles };