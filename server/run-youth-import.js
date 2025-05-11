// Direct command-line script to run the youth profile import
// This bypasses the API authentication for testing purposes

import { importYouthProfiles } from './import-excel-youth-profiles.ts';

async function runImport() {
  console.log('Starting direct youth profile import...');
  
  try {
    // Set clearExisting to true if you want to clear all existing profiles first
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log('WARNING: Existing youth profiles will be cleared!');
    }
    
    const result = await importYouthProfiles({ clearExisting });
    
    console.log('Import completed successfully!');
    console.log(`Imported: ${result.importedCount}, Skipped: ${result.skippedCount}`);
  } catch (error) {
    console.error('Youth profile import failed:', error);
    process.exit(1);
  }
}

// Run the import
runImport();