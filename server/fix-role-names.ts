import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Update the role names with the correct full names in the description field
 * but keep shorter names in the name field due to varchar(50) limitation
 */
async function fixRoleNames() {
  try {
    console.log('Updating role names and descriptions...');
    
    // Update Program Lead role
    await db.execute(sql`
      UPDATE roles
      SET name = 'Program Lead',
          description = 'Overall program leadership and oversight'
      WHERE name = 'Program Lead'
    `);
    
    // Update RMEL Lead role
    await db.execute(sql`
      UPDATE roles
      SET name = 'RMEL Lead',
          description = 'Research, Monitoring, Evaluations, and Learnings Lead'
      WHERE name = 'RMEL Lead'
    `);
    
    // Update IHS Lead role
    await db.execute(sql`
      UPDATE roles
      SET name = 'IHS Lead',
          description = 'Innovation Hubs and Spaces Lead'
      WHERE name = 'IHS Lead'
    `);
    
    // Update MKTS Lead role
    await db.execute(sql`
      UPDATE roles
      SET name = 'MKTS Lead',
          description = 'Mentoring, Knowledge Transfer, and Sustainability Lead'
      WHERE name = 'MKTS Lead'
    `);
    
    // Update Communication Lead role
    await db.execute(sql`
      UPDATE roles
      SET name = 'Communication Lead',
          description = 'Program communication and outreach leadership'
      WHERE name = 'Communication Lead'
    `);
    
    console.log('Role names and descriptions have been updated successfully!');
    
    // Print updated roles
    const updatedRoles = await db.select().from(sql`roles`);
    
    console.log('\n=== UPDATED ROLES ===');
    console.log(updatedRoles.rows);
  } catch (error) {
    console.error('Error updating role names:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRoleNames()
    .then(() => {
      console.log('Role names update completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during role names update:', error);
      process.exit(1);
    });
}