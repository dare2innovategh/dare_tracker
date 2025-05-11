import { db } from "./db";
import { sql } from "drizzle-orm";
import * as crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdminPassword() {
  console.log("Resetting admin password...");
  
  try {
    // Check if admin user exists
    const adminUsers = await db.execute(sql`
      SELECT id, username FROM users WHERE username = 'dareadmin'
    `);
    
    if (adminUsers.rows.length === 0) {
      console.log("Admin user doesn't exist, creating it...");
      
      // Generate hashed password
      const hashedPassword = await hashPassword("Dareadmin2025");
      
      // Insert new admin user
      await db.execute(sql`
        INSERT INTO users (username, password, full_name, role, created_at)
        VALUES ('dareadmin', ${hashedPassword}, 'System Administrator', 'admin', NOW())
      `);
      
      console.log("Created admin user with username 'dareadmin' and password 'Dareadmin2025'");
    } else {
      const adminId = adminUsers.rows[0].id;
      console.log(`Admin user exists with ID: ${adminId}`);
      
      // Generate new hashed password
      const hashedPassword = await hashPassword("Dareadmin2025");
      
      // Update the admin password
      await db.execute(sql`
        UPDATE users 
        SET password = ${hashedPassword}
        WHERE username = 'dareadmin'
      `);
      
      console.log("Admin password has been reset to 'Dareadmin2025'");
    }
    
    console.log("Password reset completed successfully!");
  } catch (error) {
    console.error("Error resetting admin password:", error);
    throw error;
  }
}

// Run directly if executed as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  resetAdminPassword()
    .then(() => {
      console.log("Password reset script completed");
      process.exit(0);
    })
    .catch(err => {
      console.error("Error:", err);
      process.exit(1);
    });
}

export { resetAdminPassword };