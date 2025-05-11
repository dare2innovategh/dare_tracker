import { db, pool } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

/**
 * Hash a password
 * @param password - The password to hash
 * @returns The hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Create an admin user in the database 
 */
async function createSimpleAdminUser() {
  try {
    console.log("Creating admin user...");
    
    // Check if admin already exists
    const [existingAdmin] = await db.select().from(users)
      .where(eq(users.username, 'dareadmin'));
    
    if (existingAdmin) {
      console.log("Admin user already exists. Username: dareadmin");
      return;
    }
    
    // Create admin user with provided credentials
    const hashedPassword = await hashPassword("Dareadmin2025");
    
    const [adminUser] = await db.insert(users).values({
      username: "dareadmin",
      password: hashedPassword,
      fullName: "DARE System Administrator",
      role: "admin",
      district: "Bekwai",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log("Admin user created successfully");
    console.log("Username: dareadmin");
    console.log("Password: Dareadmin2025");
    
    return adminUser;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// Run the function
createSimpleAdminUser()
  .then(() => {
    console.log("Admin user creation process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  });