import { db, pool } from "./db";

/**
 * This script creates the custom_roles and role_permissions tables if they don't exist
 */
async function createCustomRolesTable() {
  console.log("Starting to create custom_roles and role_permissions tables...");
  
  try {
    // Check if custom_roles table exists
    const { rows: customRolesTables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'custom_roles'
    `);
    
    if (customRolesTables.length === 0) {
      console.log("Creating custom_roles table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS custom_roles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by INTEGER REFERENCES users(id)
        )
      `);
      console.log("custom_roles table created successfully");
    } else {
      console.log("custom_roles table already exists, skipping");
    }
    
    // Check if role_permissions table exists
    const { rows: rolePermissionsTables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'role_permissions'
    `);
    
    if (rolePermissionsTables.length === 0) {
      console.log("Creating role_permissions table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id SERIAL PRIMARY KEY,
          role_id INTEGER REFERENCES custom_roles(id) ON DELETE CASCADE,
          resource TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(role_id, resource, action)
        )
      `);
      console.log("role_permissions table created successfully");
    } else {
      console.log("role_permissions table already exists, skipping");
    }
    
    console.log("Tables creation completed successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  } finally {
    console.log("Finished tables creation operation");
  }
}

// Run the function
createCustomRolesTable()
  .then(() => {
    console.log("Custom roles and permissions tables creation completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create custom roles and permissions tables:", error);
    process.exit(1);
  });