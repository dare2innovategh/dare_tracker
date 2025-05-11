import { db } from './db';
import { roles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to add the Admin role with full system privileges
 */
async function addAdminRole() {
  try {
    console.log("Checking if Admin role exists...");
    
    // Check if Admin role already exists
    const existingAdmin = await db.select().from(roles).where(eq(roles.name, "Admin")).execute();
    
    if (existingAdmin.length > 0) {
      console.log("Admin role already exists.");
      return;
    }
    
    // Add the Admin role
    await db.insert(roles).values({
      name: "Admin",
      description: "System administrator with full access to all features",
      isSystem: true,
      isEditable: false,
    }).execute();
    
    console.log("Admin role added successfully.");
  } catch (error) {
    console.error("Error adding Admin role:", error);
  }
}

// Execute the script if run directly
if (require.main === module) {
  addAdminRole()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { addAdminRole };