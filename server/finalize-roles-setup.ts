import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Finalize the roles setup by marking it as completed
 */
async function finalizeRolesSetup() {
  try {
    console.log('Finalizing roles setup...');
    
    // Mark the roles and permissions as seeded
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('permissions_seeded', TRUE, NOW())
      ON CONFLICT (flag_name) 
      DO UPDATE SET completed = TRUE, completed_at = NOW()
    `);
    
    // Print a summary of the created roles
    const roles = await db.select().from(sql`roles`);
    
    console.log('=== CREATED ROLES ===');
    for (const role of roles) {
      console.log(`ID: ${role.id}, Name: ${role.name}, Editable: ${role.is_editable}`);
    }
    
    console.log('\nRoles setup finalized successfully!');
    
    // List created leadership accounts
    const leadershipAccounts = await db.select().from(sql`users`)
      .where(sql`username IN ('richard_boateng', 'john_marfo', 'gideon_brefo', 'joseph_budu', 'emmanuel_dankwah')`);
    
    console.log('\n=== LEADERSHIP ACCOUNTS ===');
    for (const account of leadershipAccounts) {
      console.log(`Username: ${account.username}, Name: ${account.full_name}, Role: ${account.role}`);
    }
    
    console.log('\nLeadership accounts are ready to use.');
    console.log('Please refer to the previous output for the passwords.');
  } catch (error) {
    console.error('Error finalizing roles setup:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  finalizeRolesSetup()
    .then(() => {
      console.log('Roles setup finalization completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during roles setup finalization:', error);
      process.exit(1);
    });
}