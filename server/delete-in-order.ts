/**
 * Script to delete all data from tables in a specific order
 * to respect foreign key constraints
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

async function deleteDataInOrder() {
  console.log("Starting to delete all data in the correct order...");
  
  try {
    // Define the order of tables to delete from to respect foreign key constraints
    const tablesToDelete = [
      // Start with leaf tables
      'youth_skills',
      'youth_training',
      'certifications',
      'youth_profiles',
      'business_resources',
      'business_youth_relationships',
      'business_activity_log',
      'business_advice',
      'business_tracking',
      'business_resource_costs',
      'business_makerspace_assignments',
      'feasibility_assessments',
      'business_profiles',
      'businesses',
      'mentorship_messages',
      'mentorship_meetings',
      'mentor_business_relationships',
      'mentors',
      'skills',
      'service_subcategories',
      'service_categories',
      'equipment_inventory',
      'makerspace_resource_costs', 
      'makerspace_resources',
      'makerspaces',
      'education',
      'training',
      'training_programs',
      'role_permissions',
      'role_users',
      'permissions',
      'roles',
      'custom_roles',
      'reports',
      'migration_flags',
      'session'
      // Skip 'users' to preserve admin account
    ];
    
    // Process each table in order
    for (const tableName of tablesToDelete) {
      console.log(`Deleting all data from table: ${tableName}`);
      try {
        // Try regular delete
        const result = await db.execute(sql`DELETE FROM ${sql.identifier(tableName)};`);
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
      } catch (error) {
        console.error(`Error deleting from table ${tableName}:`, error);
      }
    }
    
    console.log("All data deleted successfully!");
    return { success: true, message: "All data deleted successfully" };
  } catch (error) {
    console.error("Error during data deletion:", error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

// Execute the script
deleteDataInOrder()
  .then((result) => {
    console.log("Delete all data operation completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during data deletion:", error);
    process.exit(1);
  });

export { deleteDataInOrder };