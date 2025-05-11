import { db } from './db';
import { permissions, roles, rolePermissions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script adds the training module permissions
 */
export async function addTrainingPermissions() {
  try {
    console.log("Adding training permissions...");
    
    // Training module permissions
    const trainingPermissions = [
      { resource: 'training', action: 'view' },
      { resource: 'training', action: 'create' },
      { resource: 'training', action: 'edit' },
      { resource: 'training', action: 'delete' },
      { resource: 'training', action: 'manage' }
    ];
    
    let addedCount = 0;
    
    // Add each permission if it doesn't exist
    for (const perm of trainingPermissions) {
      // Check if permission exists
      const existing = await db.select()
        .from(permissions)
        .where(
          and(
            eq(permissions.resource, perm.resource),
            eq(permissions.action, perm.action)
          )
        );
      
      if (existing.length === 0) {
        // Add the permission
        await db.insert(permissions)
          .values({
            resource: perm.resource,
            action: perm.action,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        
        addedCount++;
        console.log(`Added permission: ${perm.resource}.${perm.action}`);
      } else {
        console.log(`Permission ${perm.resource}.${perm.action} already exists`);
      }
    }
    
    console.log(`Added ${addedCount} new training permissions`);
    
    // Add training permissions to admin role
    console.log("Assigning training permissions to admin role...");
    
    // 1. Get admin role
    const [adminRole] = await db.select()
      .from(roles)
      .where(eq(roles.name, 'admin'));
    
    if (!adminRole) {
      console.log("Admin role not found");
      return;
    }
    
    // 2. Get all training permissions
    const allTrainingPermissions = await db.select()
      .from(permissions)
      .where(eq(permissions.resource, 'training'));
    
    // 3. Assign each permission to admin role
    for (const perm of allTrainingPermissions) {
      try {
        await db.insert(rolePermissions)
          .values({
            roleId: adminRole.id,
            role: adminRole.name,
            resource: perm.resource,
            action: perm.action,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        
        console.log(`Assigned ${perm.resource}.${perm.action} to admin role`);
      } catch (err) {
        console.log(`Permission ${perm.resource}.${perm.action} already assigned to admin role`);
      }
    }
    
    console.log("Training permissions added and assigned to admin successfully!");
  } catch (error) {
    console.error('Error adding training permissions:', error);
    throw error;
  }
}

// Execute directly if this is the main module
if (import.meta.url === `file://${__filename}`) {
  addTrainingPermissions()
    .then(() => {
      console.log('Training permissions setup completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}