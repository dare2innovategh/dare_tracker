// scripts/post-download-setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * This script helps set up the project after downloading from Replit:
 * 1. Installs dependencies
 * 2. Creates a basic .env file
 * 3. Tries to run database migrations
 */
function setup() {
  console.log('Setting up project after download...');
  
  try {
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Create .env file if it doesn't exist
    if (!fs.existsSync('.env')) {
      console.log('Creating .env file from template...');
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('Created .env file from .env.example');
        console.log('IMPORTANT: Update the DATABASE_URL in .env with your actual database credentials!');
      } else {
        const envContent = '# Database Configuration\n' +
          'DATABASE_URL=postgres://username:password@localhost:5432/dare_youth_tracker\n\n' +
          '# Session Configuration\n' +
          'SESSION_SECRET=temporary_session_secret_change_me\n\n' +
          '# Server Configuration\n' +
          'PORT=5000\n' +
          'NODE_ENV=development';
        fs.writeFileSync('.env', envContent);
        console.log('Created basic .env file');
      }
    }
    
    console.log('\nSetup complete! Next steps:');
    console.log('1. Update the DATABASE_URL in .env with your actual database credentials');
    console.log('2. Run "npm run db:push" to set up the database schema');
    console.log('3. Run "npm run dev" to start the development server');
    
  } catch (error) {
    console.error('Error during setup:', error.message);
  }
}

// Run setup
setup();