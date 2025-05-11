import { testSupabaseConnection, checkSupabaseTables } from './supabase';

// Self-executing async function
(async () => {
  console.log('Testing Supabase connection...');
  
  // Test basic connection
  const isConnected = await testSupabaseConnection();
  console.log(`Connection test ${isConnected ? 'passed' : 'failed'}`);
  
  if (isConnected) {
    // Check tables
    console.log('Checking Supabase tables...');
    const tableCheck = await checkSupabaseTables();
    
    if (tableCheck.success) {
      console.log('All required tables exist in Supabase!');
      console.log('Existing tables:', tableCheck.existingTables);
    } else {
      console.log('Some tables are missing from Supabase:');
      console.log('Missing tables:', tableCheck.missingTables);
      console.log('Existing tables:', tableCheck.existingTables);
    }
  }
})().catch(err => {
  console.error('Error during Supabase tests:', err);
  process.exit(1);
});