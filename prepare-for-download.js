// prepare-for-download.js
import fs from 'fs';
import path from 'path';

/**
 * This script prepares the project for download by:
 * 1. Creating a README.md file with important info
 * 2. Cleaning up unnecessary files
 * 3. Adding helpful deployment instructions
 */
function prepareForDownload() {
  console.log('Preparing project for download...');
  
  // Make sure README.md exists
  if (!fs.existsSync('README.md')) {
    console.log('Creating README.md...');
    const readmeContent = `# DARE Youth Job Tracker

A comprehensive platform for tracking youth employment, business performance, and mentorship in Ghana's DARE program.

## Important!

Please refer to the following files for deployment instructions:
- DEPLOY_GUIDE.md - Full deployment guide
- DATABASE_GUIDE.md - PostgreSQL database management guide

## Quick Start

1. Push this code to your GitHub repository
2. Deploy using Railway, Render, or your preferred hosting provider
3. Set up your PostgreSQL database
4. Configure environment variables

## Contact

For support or questions, contact the DARE Ghana team.
`;
    fs.writeFileSync('README.md', readmeContent);
  }
  
  // Make sure .gitignore exists
  if (!fs.existsSync('.gitignore')) {
    console.log('Creating .gitignore...');
    const gitignoreContent = `# Dependencies
/node_modules
/.pnp
.pnp.js

# Production build files
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor configs
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Replit specific
.replit
.replit.nix
.breakpoints
replit.nix
.upm/
.cache/
.config/

# GitHub token and deployment files
.git-url.txt
cookie.txt
github-setup.js
`;
    fs.writeFileSync('.gitignore', gitignoreContent);
  }
  
  // Make sure .env.example exists
  if (!fs.existsSync('.env.example')) {
    console.log('Creating .env.example...');
    const envExampleContent = `# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/dare_youth_tracker
# For Neon.tech deployments
# DATABASE_URL=postgres://username:password@ep-cool-banana-123456.us-east-2.aws.neon.tech/dare_youth_tracker?sslmode=require

# Session Configuration
SESSION_SECRET=your_session_secret_change_this_in_production

# Server Configuration
PORT=5000
NODE_ENV=development`;
    fs.writeFileSync('.env.example', envExampleContent);
  }
  
  // Check if scripts directory exists, if not create it
  if (!fs.existsSync('scripts')) {
    console.log('Creating scripts directory...');
    fs.mkdirSync('scripts');
  }
  
  // Create script to enable running migrations after download
  const migrationScriptPath = path.join('scripts', 'post-download-setup.js');
  if (!fs.existsSync(migrationScriptPath)) {
    console.log('Creating post-download setup script...');
    const migrationScriptContent = `// scripts/post-download-setup.js
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
        const envContent = '# Database Configuration\\n' +
          'DATABASE_URL=postgres://username:password@localhost:5432/dare_youth_tracker\\n\\n' +
          '# Session Configuration\\n' +
          'SESSION_SECRET=temporary_session_secret_change_me\\n\\n' +
          '# Server Configuration\\n' +
          'PORT=5000\\n' +
          'NODE_ENV=development';
        fs.writeFileSync('.env', envContent);
        console.log('Created basic .env file');
      }
    }
    
    console.log('\\nSetup complete! Next steps:');
    console.log('1. Update the DATABASE_URL in .env with your actual database credentials');
    console.log('2. Run "npm run db:push" to set up the database schema');
    console.log('3. Run "npm run dev" to start the development server');
    
  } catch (error) {
    console.error('Error during setup:', error.message);
  }
}

// Run setup
setup();`;
    fs.writeFileSync(migrationScriptPath, migrationScriptContent);
  }
  
  console.log('Project preparation completed successfully!');
  console.log('You can now download the project from Replit and deploy it to your GitHub repository.');
}

// Run the preparation
prepareForDownload();