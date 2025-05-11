import { db } from './db';
import { roles, rolePermissions, customRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to completely remove all roles and permissions from the system
 * except for the admin role which will be recreated.
 */
async function cleanAllRoles() {
  try {
    console.log("Starting to clean all roles and permissions...");
    
    // 1. First delete all role permissions
    console.log("1. Deleting all role permissions...");
    await db.delete(rolePermissions).execute();
    console.log("All role permissions deleted");
    
    // 2. Delete all custom roles
    console.log("2. Deleting all custom roles...");
    await db.delete(customRoles).execute();
    console.log("All custom roles deleted");
    
    // 3. Delete all system roles (except admin which we'll recreate)
    console.log("3. Deleting all system roles...");
    await db.delete(roles).execute();
    console.log("All system roles deleted");
    
    // 4. Create the admin role again
    console.log("4. Creating admin role...");
    const [adminRole] = await db.insert(roles)
      .values({
        name: "admin",
        description: "Administrator with full access",
        isSystem: true,
        isEditable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Admin role created with ID: ${adminRole.id}`);
    
    // 5. Create essential leadership roles
    const leadershipRoles = [
      { name: "Program Lead", description: "Program Leadership" },
      { name: "Communication Lead", description: "Communication Leadership" },
      { name: "RMEL Lead", description: "Research/Monitoring/Evaluations/Learning Leadership" },
      { name: "IHS Lead", description: "Innovation Hubs/Spaces Leadership" },
      { name: "MKTS Lead", description: "Mentoring/Knowledge Transfer/Sustainability Leadership" },
      { name: "User", description: "Regular user" }
    ];
    
    console.log("5. Creating essential leadership roles...");
    for (const role of leadershipRoles) {
      const [createdRole] = await db.insert(roles)
        .values({
          name: role.name,
          description: role.description,
          isSystem: true,
          isEditable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`Created role: ${createdRole.name} with ID: ${createdRole.id}`);
    }
    
    // Verify roles
    const allRoles = await db.select().from(roles);
    console.log(`Roles created (${allRoles.length}): ${allRoles.map(r => r.name).join(', ')}`);
    
    console.log("All roles and permissions cleaned successfully");
  } catch (error) {
    console.error("Error cleaning roles:", error);
    throw error;
  }
}

// Run immediately if this file is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanAllRoles()
    .then(() => {
      console.log("All roles and permissions cleanup completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Roles cleanup failed:", error);
      process.exit(1);
    });
}