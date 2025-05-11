import { useSystemRolesOnly } from './use-system-roles';

async function main() {
  console.log("Starting migration to use system roles only...");
  
  const result = await useSystemRolesOnly();
  
  if (result) {
    console.log("Migration to system roles only completed successfully!");
  } else {
    console.error("Migration to system roles only failed!");
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error during migration:", err);
  process.exit(1);
});