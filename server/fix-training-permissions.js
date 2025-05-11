// Simple script to add training permissions using direct SQL queries
import { pool } from './db.js';

// Fallback to require if import fails
try {
  if (!pool) {
    console.log("ESM import failed, trying CommonJS require...");
    const db = require('./db');
    pool = db.pool;
  }
} catch (e) {
  console.log("Error with imports, will try direct SQL later:", e.message);
}

async function addTrainingPermissions() {
  console.log("Adding training permissions via SQL...");
  
  try {
    // Check existing training permissions
    const checkResult = await pool.query(
      "SELECT * FROM permissions WHERE resource = 'training'"
    );
    
    if (checkResult.rows.length === 0) {
      console.log("No training permissions found, adding them...");
      
      // Insert training permissions
      await pool.query(`
        INSERT INTO permissions (resource, action, created_at, updated_at)
        VALUES 
          ('training', 'view', NOW(), NOW()),
          ('training', 'create', NOW(), NOW()),
          ('training', 'edit', NOW(), NOW()),
          ('training', 'delete', NOW(), NOW()),
          ('training', 'manage', NOW(), NOW())
        ON CONFLICT (resource, action) DO NOTHING
      `);
      
      console.log("Training permissions added successfully");
    } else {
      console.log(`Found ${checkResult.rows.length} existing training permissions`);
    }
    
    // Get admin role
    const adminRole = await pool.query(
      "SELECT * FROM roles WHERE name = 'admin'"
    );
    
    if (adminRole.rows.length === 0) {
      console.log("Admin role not found");
      return;
    }
    
    const adminId = adminRole.rows[0].id;
    
    // Get all training permissions
    const trainingPermissions = await pool.query(
      "SELECT * FROM permissions WHERE resource = 'training'"
    );
    
    // Assign all training permissions to admin
    for (const perm of trainingPermissions.rows) {
      await pool.query(`
        INSERT INTO role_permissions 
          (role_id, role, resource, action, created_at, updated_at)
        VALUES 
          ($1, 'admin', $2, $3, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [adminId, perm.resource, perm.action]);
      
      console.log(`Assigned ${perm.resource}.${perm.action} to admin role`);
    }
    
    console.log("All training permissions assigned to admin role");
    
    // List all permissions
    const allPermissions = await pool.query("SELECT * FROM permissions");
    console.log(`Total permissions in system: ${allPermissions.rows.length}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    console.log("Script completed");
  }
}

// Execute immediately
addTrainingPermissions();