import { db } from "./db";
import * as schema from "@shared/schema";
import * as crypto from 'crypto';

export async function seedAdminUser() {
  console.log("Checking for admin user...");
  
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(schema.users)
      .where(schema.users.username === "dareadmin")
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists. Skipping creation.");
      return;
    }
    
    // Create admin user with hashed password
    const password = "Dareadmin2025";
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const hashedPassword = `${hash}.${salt}`;
    
    // Insert admin user
    const [newUser] = await db.insert(schema.users).values({
      username: "dareadmin",
      password: hashedPassword,
      fullName: "System Administrator",
      role: "admin",
      email: "admin@dare.example.com",
      createdAt: new Date()
    }).returning();
    
    console.log(`Created admin user with ID: ${newUser.id}`);
    
    // Check if the admin role exists in custom_roles table
    const existingRole = await db.select().from(schema.customRoles)
      .where(schema.customRoles.name === "admin")
      .limit(1);
      
    if (existingRole.length === 0) {
      // Create admin role if it doesn't exist
      const [adminRole] = await db.insert(schema.customRoles).values({
        name: "admin",
        description: "System Administrator with full access",
        isSystemRole: true,
        isEditable: true,
        createdAt: new Date()
      }).returning();
      
      console.log(`Created admin role with ID: ${adminRole.id}`);
    }
    
    console.log("Admin user seeded successfully!");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// Run this file directly if needed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}