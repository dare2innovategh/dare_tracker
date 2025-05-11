import { supabase } from './db';
import { SupabaseAdapter } from './supabase-adapter';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

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
 * Create an admin user in the Supabase database
 */
async function createAdminUser() {
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  console.log("Checking if admin user already exists...");
  
  try {
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (existingUser) {
      console.log("Admin user already exists");
      return true;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Insert admin user
    console.log("Creating admin user...");
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@dare.org',
      fullName: 'DARE Admin',
      role: 'admin',
      district: 'Bekwai', // Default district
      createdAt: new Date().toISOString()
    };
    
    const { data: result, error } = await supabase
      .from('users')
      .insert({
        username: adminUser.username,
        password: adminUser.password,
        email: adminUser.email,
        full_name: adminUser.fullName,
        role: adminUser.role,
        district: adminUser.district,
        created_at: adminUser.createdAt
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating admin user:", error);
      return false;
    }
    
    console.log("Admin user created successfully:", result.id);
    return true;
  } catch (error) {
    console.error("Exception creating admin user:", error);
    return false;
  }
}

// Execute the function if this script is run directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  createAdminUser()
    .then((success) => {
      if (success) {
        console.log("Admin user creation process completed successfully");
        process.exit(0);
      } else {
        console.error("Admin user creation process failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Error in admin user creation process:", error);
      process.exit(1);
    });
}

export { createAdminUser };