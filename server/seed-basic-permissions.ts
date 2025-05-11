import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Seed basic permissions for our roles
 */
async function seedBasicPermissions() {
  try {
    console.log('Starting to seed basic permissions...');
    
    // Mark the initial seed as complete in migration_flags
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('permissions_seeded', TRUE, NOW())
      ON CONFLICT (flag_name) 
      DO UPDATE SET completed = TRUE, completed_at = NOW()
    `);
    
    // Get all the role IDs
    const programLead = await db.select().from(sql`roles`).where(sql`name = 'Program Lead'`).limit(1);
    const rmelLead = await db.select().from(sql`roles`).where(sql`name = 'RMEL Lead'`).limit(1);
    const ihsLead = await db.select().from(sql`roles`).where(sql`name = 'IHS Lead'`).limit(1);
    const mktsLead = await db.select().from(sql`roles`).where(sql`name = 'MKTS Lead'`).limit(1);
    const communicationLead = await db.select().from(sql`roles`).where(sql`name = 'Communication Lead'`).limit(1);
    const userRole = await db.select().from(sql`roles`).where(sql`name = 'User'`).limit(1);
    
    console.log('Roles fetched:', {
      programLead: programLead.length > 0 ? programLead[0].id : 'not found',
      rmelLead: rmelLead.length > 0 ? rmelLead[0].id : 'not found',
      ihsLead: ihsLead.length > 0 ? ihsLead[0].id : 'not found',
      mktsLead: mktsLead.length > 0 ? mktsLead[0].id : 'not found',
      communicationLead: communicationLead.length > 0 ? communicationLead[0].id : 'not found',
      userRole: userRole.length > 0 ? userRole[0].id : 'not found'
    });
    
    // Insert some key permissions for testing
    const viewYouthPermission = await db.execute(sql`
      INSERT INTO permissions (resource, action, description)
      VALUES ('youth_profiles', 'view', 'View youth profiles')
      ON CONFLICT (resource, action) 
      DO UPDATE SET description = 'View youth profiles'
      RETURNING id
    `);
    
    const viewBusinessPermission = await db.execute(sql`
      INSERT INTO permissions (resource, action, description)
      VALUES ('businesses', 'view', 'View businesses')
      ON CONFLICT (resource, action) 
      DO UPDATE SET description = 'View businesses'
      RETURNING id
    `);
    
    const editYouthPermission = await db.execute(sql`
      INSERT INTO permissions (resource, action, description)
      VALUES ('youth_profiles', 'edit', 'Edit youth profiles')
      ON CONFLICT (resource, action) 
      DO UPDATE SET description = 'Edit youth profiles'
      RETURNING id
    `);
    
    console.log('Key permissions created for testing');
    
    if (programLead.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${programLead[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${programLead[0].id}, ${editYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${programLead[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    // Assign view permission to all roles
    if (rmelLead.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${rmelLead[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${rmelLead[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    if (ihsLead.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${ihsLead[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${ihsLead[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    if (mktsLead.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${mktsLead[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${mktsLead[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    if (communicationLead.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${communicationLead[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${communicationLead[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    if (userRole.length > 0 && viewYouthPermission.rows.length > 0) {
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${userRole[0].id}, ${viewYouthPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (${userRole[0].id}, ${viewBusinessPermission.rows[0].id})
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }
    
    console.log('Basic permissions seeded successfully!');
  } catch (error) {
    console.error('Error seeding basic permissions:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBasicPermissions()
    .then(() => {
      console.log('Basic permissions seeding completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during basic permissions seeding:', error);
      process.exit(1);
    });
}