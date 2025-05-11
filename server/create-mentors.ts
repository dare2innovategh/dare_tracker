import { db } from "./db";
import { sql } from "drizzle-orm";
import * as crypto from 'crypto';

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${hash}.${salt}`;
}

interface MentorData {
  name: string;
  phone: string;
  email: string;
  assignedDistrict: string;
  bio: string;
}

export async function createMentorAccounts() {
  console.log("Starting to create mentor accounts...");

  const mentorData: MentorData[] = [
    {
      name: "Prof. Afia Frimpomaa Asare Marfo",
      phone: "0244723472",
      email: "afamarfo.pharm@knust.edu.gh",
      assignedDistrict: "Bekwai",
      bio: "Prof. Afia Frimpomaa Asare Marfo is an Associate Professor of Pharmacy Practice at KNUST with over a decade of experience mentoring young women in clinical pharmacy and public health."
    },
    {
      name: "Dr. Matilda Kokui Owusu-Bio",
      phone: "0204253131",
      email: "mkobio.ksb@knust.edu.gh",
      assignedDistrict: "Gushegu",
      bio: "Dr. Matilda Kokui Owusu-Bio is a lecturer and senior advisor at KNUST with expertise in logistics, digital education, and gender inclusion in supply chains."
    },
    {
      name: "Dr. Sheena Lovia Boateng",
      phone: "0559868938",
      email: "slboateng@ug.edu.gh",
      assignedDistrict: "Lower Manya Krobo, Yilo Krobo",
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

  try {
    // Get mentor role ID from roles table (ID 34)
    const mentorRoles = await db.execute(sql`
      SELECT * FROM roles WHERE id = 34
    `);
    
    if (mentorRoles.rows.length === 0) {
      console.error("Mentor role not found in roles table with ID 34");
      return { success: false, error: "Mentor role not found" };
    }
    
    const mentorRole = mentorRoles.rows[0];
    const createdMentors = [];

    for (const mentor of mentorData) {
      // Check if user already exists with this email
      const existingUsers = await db.execute(sql`
        SELECT * FROM users WHERE email = ${mentor.email}
      `);
      
      if (existingUsers.rows.length > 0) {
        console.log(`User with email ${mentor.email} already exists, skipping`);
        continue;
      }
      
      // Create username from email (before the @ symbol)
      const username = mentor.email.split('@')[0];
      
      // Default password - should be changed on first login
      const hashedPassword = await hashPassword("DARE2025!");
      
      // Insert user
      const insertedUser = await db.execute(sql`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES (${username}, ${hashedPassword}, ${mentor.email}, ${mentor.name}, ${mentorRole.id})
        RETURNING *
      `);
      
      const user = insertedUser.rows[0];
      console.log(`Created user account for ${mentor.name}`);
      
      // Parse assigned districts
      const assignedDistricts = mentor.assignedDistrict.split(',').map(d => d.trim());
      const assignedDistrictsJson = JSON.stringify(assignedDistricts);
      
      // Insert mentor
      const insertedMentor = await db.execute(sql`
        INSERT INTO mentors (
          user_id, name, phone, email, assigned_district, assigned_districts, 
          bio, is_active, created_at
        )
        VALUES (
          ${user.id}, ${mentor.name}, ${mentor.phone}, ${mentor.email}, 
          ${assignedDistricts[0]}, ${assignedDistrictsJson}::jsonb, 
          ${mentor.bio}, true, NOW()
        )
        RETURNING *
      `);
      
      const mentorProfile = insertedMentor.rows[0];
      console.log(`Created mentor profile for ${mentor.name}`);
      
      createdMentors.push({
        user,
        mentor: mentorProfile
      });
    }

    return { 
      success: true, 
      message: `Successfully created ${createdMentors.length} mentor accounts`, 
      mentors: createdMentors 
    };
  } catch (error) {
    console.error("Error creating mentor accounts:", error);
    return { success: false, error };
  }
}

// Execute the function
export async function executeCreateMentorAccounts() {
  const result = await createMentorAccounts();
  console.log(JSON.stringify(result, null, 2));
  return result;
}