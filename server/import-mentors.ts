/**
 * Script to import mentors from provided data
 * This will create user accounts with mentor role and corresponding mentor profiles
 */
import { db } from './db';
import { users, mentors } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Function to hash a password
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Mentor data to import
const mentorData = [
  {
    name: "Prof. Afia Frimpomaa Asare Marfo",
    phone: "0244723472",
    email: "afamarfo.pharm@knust.edu.gh",
    assignedDistrict: "Bekwai",
    bio: "Prof. Afia Frimpomaa Asare Marfo is an Associate Professor of Pharmacy Practice at KNUST with over a decade of experience mentoring young women in clinical pharmacy and public health.",
    specialization: "Pharmacy Practice, Public Health, Mentoring"
  },
  {
    name: "Dr. (Mrs) Matilda Kokui Owusu-Bio",
    phone: "0204253131",
    email: "mkobio.ksb@knust.edu.gh",
    assignedDistrict: "Gushegu",
    bio: "Dr. Matilda Kokui Owusu-Bio is a lecturer and senior advisor at KNUST with expertise in logistics, digital education, and gender inclusion in supply chains.",
    specialization: "Logistics, Digital Education, Gender Inclusion"
  },
  {
    name: "Dr. Sheena Lovia Boateng",
    phone: "0559868938",
    email: "slboateng@ug.edu.gh",
    assignedDistrict: "Lower Manya Krobo",
    bio: "Dr. Sheena Lovia Boateng, a senior lecturer at the University of Ghana Business School, is a pioneer in digital entrepreneurship, women's empowerment, and academic mentorship.",
    specialization: "Digital Entrepreneurship, Women Empowerment, Marketing"
  },
  {
    name: "Ms. Naomi Kokuro",
    phone: "0248864864",
    email: "naomikokuro@gmail.com",
    assignedDistrict: "Gushegu",
    bio: "Ms. Naomi Kokuro is a marketing strategist and social entrepreneur with over 15 years of experience mentoring young women through entrepreneurship and digital skills training.",
    specialization: "Marketing Strategy, Social Entrepreneurship, Digital Skills Training"
  },
  {
    name: "Joseph Budu",
    phone: "0541003884",
    email: "josbudu@gimpa.edu.gh",
    assignedDistrict: "Bekwai",
    bio: "Head, GIMPA Hub for Teaching and Learning",
    specialization: "Teaching and Learning, Academic Leadership"
  }
];

// Function to generate a username from full name
function generateUsername(fullName: string): string {
  // Remove any titles and parentheses content
  let cleanName = fullName
    .replace(/Prof\.|Dr\.|Mrs|Ms\.|Mr\./g, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
  
  // Split the name and get initials or first name
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  let username = '';
  
  if (nameParts.length > 1) {
    // Use first name and last name for username
    username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
  } else {
    username = nameParts[0].toLowerCase();
  }
  
  // Ensure no spaces and replace special characters
  username = username.replace(/\s+/g, '').replace(/[^\w]/g, '');
  
  return username;
}

// Main function to import mentors
async function importMentors() {
  console.log('Starting mentor import process...');
  const defaultPassword = 'Dare2023!'; // Default password for all mentor accounts
  
  try {
    for (const mentor of mentorData) {
      // Generate username
      const username = generateUsername(mentor.name);
      console.log(`Processing mentor: ${mentor.name} with username: ${username}`);
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username));
      
      if (existingUser.length > 0) {
        console.log(`User with username ${username} already exists. Skipping.`);
        continue;
      }
      
      // 1. Create user account with mentor role
      const hashedPassword = await hashPassword(defaultPassword);
      const [user] = await db.insert(users).values({
        username,
        password: hashedPassword,
        fullName: mentor.name,
        email: mentor.email,
        role: 'mentor',
        district: mentor.assignedDistrict as any, 
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
        profilePicture: null,
        isVerified: true,
        verificationCode: null,
        lastLogin: null
      }).returning();
      
      console.log(`Created user account for ${mentor.name} with ID: ${user.id}`);
      
      // 2. Create mentor profile linked to user account
      const [mentorProfile] = await db.insert(mentors).values({
        userId: user.id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
        assignedDistrict: mentor.assignedDistrict as any,
        specialization: mentor.specialization,
        bio: mentor.bio,
        isActive: true,
        profilePicture: null,
        createdAt: new Date(),
        assignedDistricts: JSON.stringify([mentor.assignedDistrict])
      }).returning();
      
      console.log(`Created mentor profile for ${mentor.name} with ID: ${mentorProfile.id}`);
    }
    
    console.log('Mentor import completed successfully');
  } catch (error) {
    console.error('Error importing mentors:', error);
  }
}

// Export the function for use in migration
export { importMentors };

// Only run import if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importMentors()
    .then(() => {
      console.log('Script execution completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Script execution failed:', err);
      process.exit(1);
    });
}