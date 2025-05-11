/**
 * Script to clear all data from the main tables
 * This will completely reset your database by clearing all records
 * while preserving the table structure.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file name and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function clearAllTables() {
  console.log("Starting to clear all tables...");
  
  try {
    // Disable foreign key checks temporarily to avoid constraint errors
    await db.execute(sql`SET session_replication_role = 'replica';`);

    // List of tables to clear in a specific order to avoid foreign key issues
    const tables = [
      // Youth related tables
      "youth_certifications",
      "youth_education",
      "youth_skills",
      "youth_training",
      "youth_profiles",
      
      // Business related tables
      "business_youth",
      "business_resources",
      "business_tracking",
      "feasibility_assessments",
      "business_profiles",
      
      // User and permission related tables
      "role_permissions",
      "role_users",
      "custom_roles",
      "mentorship_messages",
      "mentor_business_relationships",
      "mentors",
      "skills",
      "users"
    ];

    // Clear each table
    for (const table of tables) {
      console.log(`Clearing table: ${table}`);
      try {
        const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
        console.log(`Cleared table ${table}: ${result.rowCount} rows deleted`);
      } catch (error) {
        console.error(`Error clearing table ${table}:`, error);
      }
    }

    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin';`);

    console.log("All tables cleared successfully!");
    
    // Now recreate the admin user
    await createAdminUser();
    
    return { success: true, message: "All tables cleared successfully" };
  } catch (error) {
    console.error("Error clearing tables:", error);
    return { success: false, message: error.message };
  }
}

async function hashPassword(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import('crypto');
  const { promisify } = await import('util');
  
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  console.log("Creating admin user...");
  
  try {
    // First check if admin already exists
    const adminCheck = await db.execute(
      sql`SELECT * FROM users WHERE username = 'admin' LIMIT 1`
    );
    
    if (adminCheck.rowCount > 0) {
      console.log("Admin user already exists, skipping creation");
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword("admin");
    
    // Create admin user
    const result = await db.execute(
      sql`INSERT INTO users (username, password, email, full_name, role, created_at, updated_at) 
          VALUES ('admin', ${hashedPassword}, 'admin@example.com', 'Administrator', 'admin', NOW(), NOW())
          RETURNING id`
    );
    
    const adminId = result.rows[0].id;
    console.log(`Admin user created with ID: ${adminId}`);
    
    // Create admin role if it doesn't exist
    const roleCheck = await db.execute(
      sql`SELECT * FROM custom_roles WHERE name = 'admin' LIMIT 1`
    );
    
    if (roleCheck.rowCount === 0) {
      const roleResult = await db.execute(
        sql`INSERT INTO custom_roles (name, description, is_system_role, is_editable, created_at, updated_at)
            VALUES ('admin', 'Administrator with full system access', true, false, NOW(), NOW())
            RETURNING id`
      );
      
      const roleId = roleResult.rows[0].id;
      console.log(`Admin role created with ID: ${roleId}`);
      
      // Associate admin user with admin role
      await db.execute(
        sql`INSERT INTO role_users (role_id, user_id, created_at) 
            VALUES (${roleId}, ${adminId}, NOW())`
      );
      
      console.log(`Admin user associated with admin role`);
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Execute the script immediately in ES modules
clearAllTables()
  .then((result) => {
    console.log("Clear tables operation completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during table cleanup:", error);
    process.exit(1);
  });

export { clearAllTables };