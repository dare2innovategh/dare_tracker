// Script to seed permissions
import pg from 'pg';
import dotenv from 'dotenv';
import process from 'process';

const { Pool } = pg;
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedPermissions() {
  try {
    console.log("Starting permission seeding...");

    // Check if permissions table is empty
    const { rows: existingPermissions } = await pool.query('SELECT COUNT(*) FROM role_permissions');
    
    if (parseInt(existingPermissions[0].count) === 0) {
      console.log("No existing permissions found, proceeding with seeding...");
      
      // Define module structure with resources
      const modules = {
        userManagement: ["users", "roles", "permissions"],
        youthProfile: ["youth_profiles", "youth_education", "youth_certifications", "youth_skills"],
        business: ["businesses", "business_tracking", "business_youth"],
        mentor: ["mentors", "mentor_assignments", "mentorship_messages", "business_advice"],
        admin: ["reports", "system_settings"]
      };
      
      const actions = ["view", "create", "edit", "delete", "manage"];
      const roles = ["admin", "reviewer", "mentor", "user", "manager"];
      
      // Define permission batches for bulk insert
      const defaultPermissions = [];
      
      // Admin has all permissions across all modules
      Object.values(modules).flat().forEach(resource => {
        actions.forEach(action => {
          defaultPermissions.push({
            role: "admin",
            resource,
            action,
          });
        });
      });
      
      // Mentor permissions - view all profiles, businesses; edit tracking and advice
      const mentorViewResources = [
        ...modules.youthProfile,
        ...modules.business,
        ...modules.mentor
      ];
      
      const mentorEditResources = [
        "business_tracking",
        "mentorship_messages",
        "business_advice"
      ];
      
      mentorViewResources.forEach(resource => {
        defaultPermissions.push({
          role: "mentor",
          resource,
          action: "view"
        });
      });
      
      mentorEditResources.forEach(resource => {
        defaultPermissions.push({
          role: "mentor",
          resource,
          action: "edit"
        });
        
        // Mentors can also create messages and advice
        if (resource === "mentorship_messages" || resource === "business_advice") {
          defaultPermissions.push({
            role: "mentor",
            resource,
            action: "create"
          });
        }
      });
      
      // Reviewer permissions - view and edit business tracking and reports
      const reviewerResources = [
        ...modules.business,
        ...modules.youthProfile,
        "reports"
      ];
      
      reviewerResources.forEach(resource => {
        defaultPermissions.push({
          role: "reviewer",
          resource,
          action: "view"
        });
      });
      
      defaultPermissions.push({
        role: "reviewer",
        resource: "business_tracking",
        action: "edit"
      });
      
      defaultPermissions.push({
        role: "reviewer",
        resource: "reports",
        action: "create"
      });
      
      // Manager permissions - broader access than mentors but less than admin
      const managerViewResources = [
        ...modules.userManagement,
        ...modules.youthProfile,
        ...modules.business,
        ...modules.mentor,
        "reports"
      ];
      
      const managerEditResources = [
        ...modules.youthProfile,
        ...modules.business,
        "mentors",
        "mentor_assignments",
        "reports"
      ];
      
      managerViewResources.forEach(resource => {
        defaultPermissions.push({
          role: "manager",
          resource,
          action: "view"
        });
      });
      
      managerEditResources.forEach(resource => {
        defaultPermissions.push({
          role: "manager",
          resource,
          action: "edit"
        });
        defaultPermissions.push({
          role: "manager",
          resource,
          action: "create"
        });
      });
      
      // Batch insert permissions
      if (defaultPermissions.length > 0) {
        // Insert permissions one by one to avoid issues with array parameter binding
        for (const perm of defaultPermissions) {
          await pool.query(
            'INSERT INTO role_permissions (role, resource, action) VALUES ($1, $2, $3)', 
            [perm.role, perm.resource, perm.action]
          );
        }
        console.log(`Seeded ${defaultPermissions.length} default role permissions.`);
      }
    } else {
      console.log(`Found ${existingPermissions[0].count} existing permissions, skipping permission seeding.`);
    }
  } catch (error) {
    console.error("Error seeding default permissions:", error);
    throw error;
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the seeding function
seedPermissions()
  .then(() => console.log("Permission seeding completed."))
  .catch(err => {
    console.error("Failed to seed permissions:", err);
    process.exit(1);
  });