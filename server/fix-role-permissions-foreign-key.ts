import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * This script fixes the foreign key constraint on the role_permissions table
 * to reference the roles table instead of custom_roles.
 */
async function fixRolePermissionsForeignKey() {
  try {
    console.log("Starting to fix role_permissions foreign key constraint...");
    
    // First, drop the existing foreign key constraint
    console.log("1. Dropping existing foreign key constraint...");
    await db.execute(sql`
      ALTER TABLE IF EXISTS role_permissions 
      DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey
    `);
    
    // Then add the new foreign key constraint referencing the roles table
    console.log("2. Adding new foreign key constraint referencing roles table...");
    await db.execute(sql`
      ALTER TABLE role_permissions
      ADD CONSTRAINT role_permissions_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES roles(id)
      ON DELETE CASCADE
    `);
    
    console.log("Foreign key constraint successfully updated!");
  } catch (error) {
    console.error("Error fixing role permissions foreign key:", error);
    throw error;
  }
}

// Run the script directly if executed as a main module
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRolePermissionsForeignKey()
    .then(() => {
      console.log("Successfully fixed role_permissions foreign key constraint");
      process.exit(0);
    })
    .catch(error => {
      console.error("Failed to fix role_permissions foreign key constraint:", error);
      process.exit(1);
    });
}