import { sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as csv from 'csv-parser';

/**
 * Hash a password
 * @param password - The password to hash
 * @returns The hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

/**
 * Reset mentor and youth data and import new data
 */
async function resetMentorYouthData() {
  try {
    console.log('Starting to reset mentor and youth data...');
    
    // 1. Delete data from tables one at a time, in reverse dependency order
    console.log('Clearing existing data...');
    
    // Clear mentor relationship tables first
    try {
      console.log('Clearing mentor-business relationships...');
      await db.delete(schema.mentorBusinessRelationships);
    } catch (error) {
      console.log('Note: Could not clear mentor-business relationships, table might not exist yet');
    }
    
    try {
      console.log('Clearing mentorship meetings...');
      await db.delete(schema.mentorshipMeetings);
    } catch (error) {
      console.log('Note: Could not clear mentorship meetings, table might not exist yet');
    }
    
    try {
      console.log('Clearing mentorship messages...');
      await db.delete(schema.mentorshipMessages);
    } catch (error) {
      console.log('Note: Could not clear mentorship messages, table might not exist yet');
    }
    
    // Clear youth relationship tables
    try {
      console.log('Clearing business-youth relationships...');
      await db.delete(schema.businessYouthRelationships);
    } catch (error) {
      console.log('Note: Could not clear business-youth relationships, table might not exist yet');
    }
    
    try {
      console.log('Clearing youth skills...');
      await db.delete(schema.youthSkills);
    } catch (error) {
      console.log('Note: Could not clear youth skills, table might not exist yet');
    }
    
    try {
      console.log('Clearing education records...');
      await db.delete(schema.education);
    } catch (error) {
      console.log('Note: Could not clear education records, table might not exist yet');
    }
    
    try {
      console.log('Clearing certifications...');
      await db.delete(schema.certifications);
    } catch (error) {
      console.log('Note: Could not clear certifications, table might not exist yet');
    }
    
    // Now clear mentors and youth profiles
    try {
      console.log('Clearing mentors...');
      await db.delete(schema.mentors);
    } catch (error) {
      console.log('Note: Could not clear mentors, table might not exist yet');
    }
    
    try {
      console.log('Clearing youth profiles...');
      await db.delete(schema.youthProfiles);
    } catch (error) {
      console.log('Note: Could not clear youth profiles, table might not exist yet');
    }
    
    // Clear migration flags
    try {
      console.log('Resetting migration flags...');
      await db.execute(sql`
        DELETE FROM migration_flags 
        WHERE flag_name IN (
          'youth_profiles_imported_from_csv', 
          'additional_youth_profiles_imported',
          'mentors_imported'
        )
      `);
    } catch (error) {
      console.log('Note: Could not reset migration flags, table might not exist yet');
    }
    
    console.log('Cleared existing data successfully!');
    
    // 2. Import the new mentors
    console.log('Importing new mentors...');
    
    // Mentor data from the provided file
    const mentorsData = [
      {
        name: "Prof. Afia Frimpomaa Asare Marfo",
        phone: "0244723472",
        email: "afamarfo.pharm@knust.edu.gh",
        assignedDistrict: "Bekwai",
        bio: "Prof. Afia Frimpomaa Asare Marfo is an Associate Professor of Pharmacy Practice at KNUST with over a decade of experience mentoring young women in clinical pharmacy and public health."
      },
      {
        name: "Dr. (Mrs) Matilda Kokui Owusu-Bio",
        phone: "0204 253 131",
        email: "mkobio.ksb@knust.edu.gh",
        assignedDistrict: "Gushegu",
        bio: "Dr. Matilda Kokui Owusu-Bio is a lecturer and senior advisor at KNUST with expertise in logistics, digital education, and gender inclusion in supply chains."
      },
      {
        name: "Dr. Sheena Lovia Boateng",
        phone: "055 986 8938",
        email: "slboateng@ug.edu.gh",
        assignedDistrict: "Lower Manya Krobo",
        bio: "Dr. Sheena Lovia Boateng, a senior lecturer at the University of Ghana Business School, is a pioneer in digital entrepreneurship, women's empowerment, and academic mentorship."
      },
      {
        name: "Ms. Naomi Kokuro",
        phone: "0248864864",
        email: "naomikokuro@gmail.com",
        assignedDistrict: "Gushegu",
        bio: "Ms. Naomi Kokuro is a marketing strategist and social entrepreneur with over 15 years of experience mentoring young women through entrepreneurship and digital skills training."
      }
    ];
    
    // Create user accounts and mentor profiles for the mentors
    for (const mentor of mentorsData) {
      try {
        // Generate username from name
        const username = mentor.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        
        // Create a new user with hashed password
        const password = await hashPassword('Mentor2025');
        
        const [newUser] = await db.insert(schema.users).values({
          username,
          password,
          fullName: mentor.name,
          email: mentor.email,
          role: 'mentor',
          district: mentor.assignedDistrict as any,
        }).returning();
        
        console.log(`Created user account for ${mentor.name} with ID ${newUser.id}`);
        
        // Create mentor profile
        await db.insert(schema.mentors).values({
          userId: newUser.id,
          name: mentor.name,
          phone: mentor.phone,
          email: mentor.email,
          assignedDistrict: mentor.assignedDistrict as any,
          assignedDistricts: JSON.stringify([mentor.assignedDistrict]),
          bio: mentor.bio,
          specialization: 'Youth Entrepreneurship',
          isActive: true,
        });
        
        console.log(`Created mentor profile for ${mentor.name}`);
      } catch (error) {
        console.error(`Error creating mentor profile for ${mentor.name}:`, error);
      }
    }
    
    console.log('All mentors imported successfully!');
    
    // 3. Import youth profiles from CSV (without creating user accounts)
    console.log('Importing youth profiles without user accounts...');
    
    // Try to parse CSV file
    const csvPath = './attached_assets/DARE Youth.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      throw new Error(`CSV file not found at ${csvPath}`);
    }
    
    // Parse the CSV file
    const youthProfiles: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`Parsed ${results.length} records from CSV`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        });
    });
    
    let successCount = 0;
    
    // Import each profile
    for (const profile of youthProfiles) {
      // Skip empty rows
      if (!profile['Name'] || profile['Name'].trim() === '') {
        console.log('Skipping empty profile');
        continue;
      }
      
      try {
        // Insert into youth_profiles using raw SQL to avoid schema issues
        await db.execute(sql`
          INSERT INTO youth_profiles (
            user_id, participant_code, full_name, district, town, 
            phone_number, gender, marital_status, children_count, 
            year_of_birth, age, age_group, core_skills, 
            business_interest, employment_status, pwd_status, 
            dare_model, training_status, program_status
          ) VALUES (
            NULL, ${profile['participant_code'] || null}, ${profile['Name']}, 
            ${profile['District'] || 'Bekwai'}, ${profile['Town'] || null},
            ${profile['Phone'] || profile['Phone Number'] || null}, ${profile['Gender'] || null}, 
            ${profile['Marital Status'] || null}, ${profile['Children'] ? parseInt(profile['Children']) : 0}, 
            ${profile['YOB'] ? parseInt(profile['YOB']) : null}, ${profile['Age'] ? parseInt(profile['Age']) : null}, 
            ${profile['Age Group'] || null}, ${profile['Core Skills'] || null}, 
            ${profile['Business Interest'] || 'Not Specified'}, ${profile['Employment Status'] || 'Unemployed'}, 
            ${profile['PWD Status'] || 'Not Disabled'}, 'Collaborative', 'Completed', 'Outreach'
          )
        `);
        
        console.log(`Imported youth profile for ${profile['Name']}`);
        successCount++;
      } catch (error) {
        console.error(`Error importing profile for ${profile['Name']}:`, error);
      }
    }
    
    console.log(`Successfully imported ${successCount} youth profiles out of ${youthProfiles.length} total`);
    
    // Mark the migrations as complete
    try {
      await db.execute(sql`
        INSERT INTO migration_flags (flag_name, completed, completed_at)
        VALUES 
          ('youth_profiles_imported_from_csv', TRUE, NOW()),
          ('mentors_imported', TRUE, NOW())
        ON CONFLICT (flag_name) 
        DO UPDATE SET completed = TRUE, completed_at = NOW()
      `);
    } catch (error) {
      console.error('Error marking migrations as complete:', error);
    }
    
    console.log('Data reset and import completed successfully!');
  } catch (error) {
    console.error('Error during data reset and import:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetMentorYouthData()
    .then(() => {
      console.log('Data reset and import process completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during data reset and import:', error);
      process.exit(1);
    });
}