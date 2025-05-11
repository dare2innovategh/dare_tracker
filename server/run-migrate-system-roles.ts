import { migrateSystemRoles } from './migrate-system-roles';

// Run the migration directly
migrateSystemRoles()
  .then(() => {
    console.log("System roles migration script completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("System roles migration script failed:", error);
    process.exit(1);
  });