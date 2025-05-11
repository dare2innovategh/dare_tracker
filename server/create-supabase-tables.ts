import { runTableCreation } from './supabase-migration';

async function main() {
  console.log("Starting Supabase table creation...");
  const success = await runTableCreation();
  
  if (success) {
    console.log("✅ Supabase tables created successfully");
    process.exit(0);
  } else {
    console.error("❌ Failed to create Supabase tables");
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Error in table creation script:", error);
  process.exit(1);
});