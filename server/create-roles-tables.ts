import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Create the roles and permissions tables in the database
 */
async function createRolesTables() {
  try {
    console.log('Starting to create roles and permissions tables...');
    
    // Create roles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        is_editable BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);
    
    console.log('Created roles table.');
    
    // Create permissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(resource, action)
      );
    `);
    
    console.log('Created permissions table.');
    
    // Create role_permissions junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        permission_id INTEGER NOT NULL REFERENCES permissions(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(role_id, permission_id)
      );
    `);
    
    console.log('Created role_permissions table.');
    
    // Create role_users junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_users (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(role_id, user_id)
      );
    `);
    
    console.log('Created role_users table.');
    
    // Mark the migration as complete
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('roles_tables_created', TRUE, NOW())
      ON CONFLICT (flag_name) 
      DO UPDATE SET completed = TRUE, completed_at = NOW()
    `);
    
    console.log('Roles and permissions tables created successfully!');
  } catch (error) {
    console.error('Error creating roles and permissions tables:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRolesTables()
    .then(() => {
      console.log('Roles and permissions tables creation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during roles and permissions tables creation:', error);
      process.exit(1);
    });
}