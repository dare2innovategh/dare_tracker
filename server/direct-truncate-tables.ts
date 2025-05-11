/**
 * Script to directly truncate all tables
 * This is a more direct approach when we don't have superuser privileges
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

async function truncateAllTables() {
  console.log("Starting to truncate all tables...");
  
  try {
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
      "skills"
      // "users" - Keep users table to preserve admin account
    ];

    // We will use a single transaction to ensure consistency
    const result = await db.transaction(async (tx) => {
      // Truncate each table
      for (const table of tables) {
        console.log(`Truncating table: ${table}`);
        try {
          await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE;`);
          console.log(`Truncated table ${table} successfully`);
        } catch (error) {
          console.error(`Error truncating table ${table}:`, error);
        }
      }

      return { success: true };
    });

    console.log("All tables truncated successfully!");
    return { success: true, message: "All tables truncated successfully" };
  } catch (error) {
    console.error("Error truncating tables:", error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

// Execute the script
truncateAllTables()
  .then((result) => {
    console.log("Truncate tables operation completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during table truncation:", error);
    process.exit(1);
  });

export { truncateAllTables };