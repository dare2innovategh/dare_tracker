import { sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import * as crypto from 'crypto';

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
 * Mark mentors as imported in the migration_flags table
 */
async function markMentorsAsImported(): Promise<void> {
  await db.execute(sql`
    INSERT INTO migration_flags (flag_name, completed, completed_at)
    VALUES ('mentors_imported', TRUE, NOW())
    ON CONFLICT (flag_name) 
    DO UPDATE SET completed = TRUE, completed_at = NOW()
  `);
}

/**
 * Import new mentors data from the provided information
 */
async function importNewMentors() {
  try {
    console.log('Starting import of new mentors data...');
    
    // Mentors data from the pasted text
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
    
    let successCount = 0;
    
    // Create user accounts and mentor profiles for each mentor
    for (const mentor of mentorsData) {
      try {
        // Generate username from name
        const username = mentor.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        
        // Create a new user account with hashed password
        const password = await hashPassword('Mentor2025');
        
        const [newUser] = await db.insert(schema.users).values({
          username,
          password,
          fullName: mentor.name,
          email: mentor.email,
          role: 'mentor',
          district: mentor.assignedDistrict as any, // Type casting to handle the district enum
        }).returning();
        
        console.log(`Created user account for ${mentor.name} with ID ${newUser.id}`);
        
        // Create mentor profile
        const [newMentor] = await db.insert(schema.mentors).values({
          userId: newUser.id,
          name: mentor.name,
          phone: mentor.phone,
          email: mentor.email,
          assignedDistrict: mentor.assignedDistrict as any, // Type casting to handle the district enum
          assignedDistricts: JSON.stringify([mentor.assignedDistrict]),
          bio: mentor.bio,
          specialization: 'Youth Entrepreneurship',
          isActive: true,
        }).returning();
        
        console.log(`Created mentor profile for ${mentor.name} with ID ${newMentor.id}`);
        successCount++;
      } catch (error) {
        console.error(`Error creating mentor profile for ${mentor.name}:`, error);
      }
    }
    
    // Mark the migration as complete
    await markMentorsAsImported();
    
    console.log(`Successfully imported ${successCount} mentors out of ${mentorsData.length} total`);
  } catch (error) {
    console.error('Error importing mentors:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importNewMentors()
    .then(() => {
      console.log('Mentor import completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during mentor import:', error);
      process.exit(1);
    });
}

export { importNewMentors };