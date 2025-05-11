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
 * Generate a secure password
 * Combining uppercase, lowercase, numbers, and special characters
 */
function generateSecurePassword(): string {
  const length = 10;
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Check if system roles and leaders have already been seeded
 */
async function checkIfSystemRolesAndLeadersSeeded(): Promise<boolean> {
  const result = await db.select()
    .from(sql`migration_flags`)
    .where(sql`flag_name = 'system_roles_and_leaders_seeded'`);
  
  return result.length > 0;
}

/**
 * Mark system roles and leaders as seeded
 */
async function markSystemRolesAndLeadersAsSeeded(): Promise<void> {
  await db.execute(sql`
    INSERT INTO migration_flags (flag_name, completed, completed_at)
    VALUES ('system_roles_and_leaders_seeded', TRUE, NOW())
    ON CONFLICT (flag_name) 
    DO UPDATE SET completed = TRUE, completed_at = NOW()
  `);
}

/**
 * Seed system roles and create leadership users
 */
async function seedSystemRolesAndLeaders() {
  try {
    console.log('Starting to seed system roles and leadership users...');
    
    // Check if already seeded
    const alreadySeeded = await checkIfSystemRolesAndLeadersSeeded();
    if (alreadySeeded) {
      console.log('System roles and leadership users were already seeded.');
      return;
    }
    
    // 1. Create editable system roles for leadership team
    console.log('Creating system roles...');
    
    // Program Lead role
    const [programLeadRole] = await db.insert(schema.roles).values({
      name: 'Program Lead',
      description: 'Overall program leadership and oversight',
      isSystem: true,
      isEditable: true
    }).returning();
    
    // RMEL Lead role
    const [rmelLeadRole] = await db.insert(schema.roles).values({
      name: 'RMEL Lead',
      description: 'Monitoring, Evaluation, and Learning leadership',
      isSystem: true,
      isEditable: true
    }).returning();
    
    // IHS Lead role
    const [ihsLeadRole] = await db.insert(schema.roles).values({
      name: 'IHS Lead',
      description: 'Innovation Hub Services leadership',
      isSystem: true,
      isEditable: true
    }).returning();
    
    // MKTS Lead role
    const [mktsLeadRole] = await db.insert(schema.roles).values({
      name: 'MKTS Lead',
      description: 'Market and Technical Services leadership',
      isSystem: true,
      isEditable: true
    }).returning();
    
    // Communication Lead role
    const [communicationLeadRole] = await db.insert(schema.roles).values({
      name: 'Communication Lead',
      description: 'Program communication and outreach leadership',
      isSystem: true,
      isEditable: true
    }).returning();
    
    // Regular User role (not editable, view-only access)
    const [userRole] = await db.insert(schema.roles).values({
      name: 'User',
      description: 'Regular user with view-only access to non-administrative content',
      isSystem: true,
      isEditable: false
    }).returning();
    
    console.log('System roles created successfully.');
    
    // 2. Create user accounts for leadership team
    console.log('Creating user accounts for leadership team...');
    
    // Track created users and their passwords
    const createdUsers = [];
    
    // Prof. Richard Boateng - Program Lead
    const richardPassword = generateSecurePassword();
    const richardHashedPassword = await hashPassword(richardPassword);
    const [richardUser] = await db.insert(schema.users).values({
      username: 'richard_boateng',
      password: richardHashedPassword,
      fullName: 'Prof. Richard Boateng',
      email: 'richard.boateng@gmail.com',
      role: 'manager',
      district: 'Bekwai',
      isActive: true,
    }).returning();
    
    // Add to created users list
    createdUsers.push({
      name: 'Prof. Richard Boateng',
      username: 'richard_boateng',
      password: richardPassword,
      role: 'Program Lead',
      email: 'richard.boateng@gmail.com'
    });
    
    console.log(`Created user account for Prof. Richard Boateng with ID ${richardUser.id}`);
    
    // Dr. John Serbe Marfo - RMEL Lead
    const johnPassword = generateSecurePassword();
    const johnHashedPassword = await hashPassword(johnPassword);
    const [johnUser] = await db.insert(schema.users).values({
      username: 'john_marfo',
      password: johnHashedPassword,
      fullName: 'Dr. John Serbe Marfo',
      email: 'serbemarfo@gmail.com',
      role: 'manager',
      district: 'Bekwai',
      isActive: true,
    }).returning();
    
    // Add to created users list
    createdUsers.push({
      name: 'Dr. John Serbe Marfo',
      username: 'john_marfo',
      password: johnPassword,
      role: 'RMEL Lead',
      email: 'serbemarfo@gmail.com'
    });
    
    console.log(`Created user account for Dr. John Serbe Marfo with ID ${johnUser.id}`);
    
    // Gideon Brefo - IHS Lead
    const gideonPassword = generateSecurePassword();
    const gideonHashedPassword = await hashPassword(gideonPassword);
    const [gideonUser] = await db.insert(schema.users).values({
      username: 'gideon_brefo',
      password: gideonHashedPassword,
      fullName: 'Gideon Brefo',
      email: 'gideon@hapaspace.com',
      role: 'manager',
      district: 'Bekwai',
      isActive: true,
    }).returning();
    
    // Add to created users list
    createdUsers.push({
      name: 'Gideon Brefo',
      username: 'gideon_brefo',
      password: gideonPassword,
      role: 'IHS Lead',
      email: 'gideon@hapaspace.com'
    });
    
    console.log(`Created user account for Gideon Brefo with ID ${gideonUser.id}`);
    
    // Dr. Joseph Budu - MKTS Lead
    const josephPassword = generateSecurePassword();
    const josephHashedPassword = await hashPassword(josephPassword);
    const [josephUser] = await db.insert(schema.users).values({
      username: 'joseph_budu',
      password: josephHashedPassword,
      fullName: 'Dr. Joseph Budu',
      email: 'buduson@gmail.com',
      role: 'manager',
      district: 'Bekwai',
      isActive: true,
    }).returning();
    
    // Add to created users list
    createdUsers.push({
      name: 'Dr. Joseph Budu',
      username: 'joseph_budu',
      password: josephPassword,
      role: 'MKTS Lead',
      email: 'buduson@gmail.com'
    });
    
    console.log(`Created user account for Dr. Joseph Budu with ID ${josephUser.id}`);
    
    // Emmanuel Dankwah - Communication Lead
    const emmanuelPassword = generateSecurePassword();
    const emmanuelHashedPassword = await hashPassword(emmanuelPassword);
    const [emmanuelUser] = await db.insert(schema.users).values({
      username: 'emmanuel_dankwah',
      password: emmanuelHashedPassword,
      fullName: 'Emmanuel Dankwah',
      email: 'jesterdankwah@gmail.com',
      role: 'manager',
      district: 'Bekwai',
      isActive: true,
    }).returning();
    
    // Add to created users list
    createdUsers.push({
      name: 'Emmanuel Dankwah',
      username: 'emmanuel_dankwah',
      password: emmanuelPassword,
      role: 'Communication Lead',
      email: 'jesterdankwah@gmail.com'
    });
    
    console.log(`Created user account for Emmanuel Dankwah with ID ${emmanuelUser.id}`);
    
    // 3. Associate users with their roles
    console.log('Associating users with their roles...');
    
    try {
      // Create role-user associations
      await db.execute(sql`
        INSERT INTO role_users (role_id, user_id)
        VALUES 
          (${programLeadRole.id}, ${richardUser.id}),
          (${rmelLeadRole.id}, ${johnUser.id}),
          (${ihsLeadRole.id}, ${gideonUser.id}),
          (${mktsLeadRole.id}, ${josephUser.id}),
          (${communicationLeadRole.id}, ${emmanuelUser.id})
      `);
      
      console.log('Users associated with roles successfully.');
    } catch (error) {
      console.log('Note: Could not associate users with roles. Table may not exist yet:', error.message);
      
      // If the table doesn't exist, we'll just continue
      console.log('Creating temporary role associations in the console output.');
    }
    
    // Mark as seeded in the migration_flags
    await markSystemRolesAndLeadersAsSeeded();
    
    console.log('System roles and leadership users seeded successfully!');
    
    // Display user credentials
    console.log('\n====== LEADERSHIP TEAM ACCOUNT CREDENTIALS ======');
    createdUsers.forEach(user => {
      console.log(`
Name: ${user.name}
Role: ${user.role}
Username: ${user.username}
Password: ${user.password}
Email: ${user.email}
      `);
    });
    console.log('====================================');
    
    return {
      leadershipAccounts: createdUsers
    };
    
  } catch (error) {
    console.error('Error seeding system roles and leadership users:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSystemRolesAndLeaders()
    .then((result) => {
      if (result && result.leadershipAccounts) {
        console.log('Leadership accounts created successfully!');
        
        // Display user credentials again outside the function
        console.log('\n====== LEADERSHIP TEAM ACCOUNT CREDENTIALS ======');
        result.leadershipAccounts.forEach(user => {
          console.log(`
Name: ${user.name}
Role: ${user.role}
Username: ${user.username}
Password: ${user.password}
Email: ${user.email}
          `);
        });
        console.log('====================================');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during system roles and leadership users seeding:', error);
      process.exit(1);
    });
}