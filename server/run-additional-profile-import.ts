import { importAdditionalYouthProfiles } from './import-additional-youth-profiles';

console.log('Starting additional youth profile import script...');

importAdditionalYouthProfiles()
  .then(() => {
    console.log('Additional youth profile import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error importing additional youth profiles:', error);
    process.exit(1);
  });