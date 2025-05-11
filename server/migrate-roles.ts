import { db } from './db';
import { roles, customRoles } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to migrate the existing roles from the roles table to the custom_roles table
 * This will fix the permission system to work with the correct role IDs
 */
async function migrateRoles() {
  console.log('Starting migration of roles to custom_roles table...');
  
  try {
    // Get all roles from the roles table
    const existingRoles = await db.select().from(roles);
    console.log(`Found ${existingRoles.length} roles to migrate`);
    
    // Check if any roles exist in custom_roles already
    const customRolesCount = await db.select({ count: customRoles.id }).from(customRoles);
    console.log(`Found ${customRolesCount.length} existing custom roles`);
    
    if (customRolesCount.length > 0) {
      console.log('Custom roles table already has data, checking for admin role...');
      
      // Specifically look for admin role
      const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1);
      
      if (adminRole.length > 0) {
        // Check if admin role exists in custom_roles
        const customAdminRole = await db.select().from(customRoles).where(eq(customRoles.name, 'admin')).limit(1);
        
        if (customAdminRole.length === 0) {
          // Only add the admin role if it doesn't exist in custom_roles
          console.log('Migrating admin role to custom_roles');
          await db.insert(customRoles).values({
            id: adminRole[0].id, // Keep the same ID for consistent role reference
            name: adminRole[0].name,
            description: adminRole[0].description,
            createdAt: adminRole[0].createdAt,
            updatedAt: adminRole[0].updatedAt
          });
          console.log(`Admin role migrated successfully with ID: ${adminRole[0].id}`);
        } else {
          console.log(`Admin role already exists in custom_roles with ID: ${customAdminRole[0].id}`);
        }
      }
    } else {
      // If custom_roles is empty, migrate all roles
      console.log('Migrating all roles to custom_roles table...');
      
      for (const role of existingRoles) {
        await db.insert(customRoles).values({
          id: role.id, // Keep the same ID for consistent role reference
          name: role.name,
          description: role.description,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        });
        console.log(`Migrated role: ${role.name} with ID: ${role.id}`);
      }
      
      console.log('All roles migrated successfully');
    }
    
    console.log('Role migration completed');
  } catch (error) {
    console.error('Error migrating roles:', error);
  }
}

// Run the migration
migrateRoles().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});