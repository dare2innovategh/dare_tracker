// upload-essential-files.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

// GitHub Configuration
const GITHUB_TOKEN = "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";
const REPO_OWNER = "dare2innovategh";
const REPO_NAME = "Youth-In-Job-Tracker";
const BRANCH = "main";

// Essential directories
const ESSENTIAL_DIRS = [
  'client',
  'server',
  'shared',
  'migrations',
  'scripts',
  'uploads'
];

// Essential files
const ESSENTIAL_FILES = [
  'README.md',
  'DEPLOY_GUIDE.md',
  'DATABASE_GUIDE.md',
  'package.json',
  'package-lock.json',
  'tailwind.config.ts',
  'tsconfig.json',
  'vite.config.ts',
  'drizzle.config.ts',
  'postcss.config.js',
  'theme.json',
  '.env.example',
  'deploy-github.js',
  'push-to-github.sh',
  'github-push.sh',
  'github-setup.js',
  'prepare-for-download.js',
  'youth-profiles-template.csv'
];

// Skip these directories
const SKIP_DIRS = [
  '.git',
  'node_modules',
  '.cache',
  '.local',
  '.vscode',
  '.github',
  '.replit'
];

// For tracking progress
let filesProcessed = 0;
let totalFiles = 0;
let successfulUploads = 0;

// Function to get a file's SHA (needed for updates)
async function getFileSHA(filePath) {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return data.sha;
    }
    return null;
  } catch (error) {
    console.error(`Error getting SHA for ${filePath}:`, error.message);
    return null;
  }
}

// Function to update a file on GitHub
async function updateFile(filePath, content, message = "Update file") {
  try {
    const sha = await getFileSHA(filePath);
    
    const payload = {
      message: message,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH
    };
    
    if (sha) {
      payload.sha = sha;
    }
    
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.status === 200 || response.status === 201) {
      filesProcessed++;
      successfulUploads++;
      process.stdout.write(`\rUploaded ${filesProcessed}/${totalFiles} files (${successfulUploads} successful)...`);
      return true;
    } else {
      filesProcessed++;
      const errorText = await response.text();
      console.error(`\nError updating ${filePath}: Status ${response.status}`);
      //console.error(errorText);
      return false;
    }
  } catch (error) {
    filesProcessed++;
    console.error(`\nError updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to check if a file is essential
function isEssentialFile(filePath) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  
  // Check if it's in essential directories
  for (const dir of ESSENTIAL_DIRS) {
    if (filePath.startsWith(dir + '/') || filePath === dir) {
      return true;
    }
  }
  
  // Check if it's an essential file
  return ESSENTIAL_FILES.includes(fileName) || ESSENTIAL_FILES.includes(filePath);
}

// Function to check if a directory should be skipped
function shouldSkipDir(dirPath) {
  for (const skipDir of SKIP_DIRS) {
    if (dirPath.startsWith(skipDir + '/') || dirPath === skipDir) {
      return true;
    }
  }
  return false;
}

// Function to get all essential files
function getEssentialFiles(dir = '.', fileList = []) {
  if (shouldSkipDir(dir)) {
    return fileList;
  }
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          if (!shouldSkipDir(filePath)) {
            getEssentialFiles(filePath, fileList);
          }
        } else {
          if (isEssentialFile(filePath)) {
            fileList.push(filePath);
          }
        }
      } catch (error) {
        console.error(`Error accessing ${filePath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return fileList;
}

// Function to create directories that don't exist
async function createDirectoryStructure(filePath) {
  const dirPath = path.dirname(filePath);
  if (dirPath === '.') return;
  
  // Check if directory exists
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${dirPath}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.status === 404) {
      // Directory doesn't exist, create it with a placeholder file
      await updateFile(`${dirPath}/.gitkeep`, '', `Create directory ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error.message);
  }
}

// Main function to push essential files
async function pushEssentialFiles() {
  console.log("Preparing to push essential files to GitHub...");
  
  try {
    // Run prepare-for-download script
    console.log("Running prepare-for-download.js...");
    execSync('node prepare-for-download.js', { stdio: 'inherit' });
    
    // Get all essential files
    console.log("Scanning for essential files to upload...");
    const essentialFiles = getEssentialFiles();
    totalFiles = essentialFiles.length;
    console.log(`Found ${totalFiles} essential files to upload.`);
    
    // Create directory structure
    console.log("Creating directory structure...");
    for (const filePath of essentialFiles) {
      await createDirectoryStructure(filePath);
    }
    
    // Process files in chunks to avoid rate limiting
    const CHUNK_SIZE = 3;
    for (let i = 0; i < essentialFiles.length; i += CHUNK_SIZE) {
      const chunk = essentialFiles.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(async (filePath) => {
        try {
          let content;
          try {
            // Try to read as text first
            content = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            // If that fails, read as binary
            content = fs.readFileSync(filePath);
          }
          
          await updateFile(filePath, content);
        } catch (error) {
          filesProcessed++;
          console.error(`\nError reading ${filePath}:`, error.message);
        }
      });
      
      await Promise.all(promises);
      
      // Add a delay to avoid rate limiting
      if (i + CHUNK_SIZE < essentialFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("\nEssential files push completed!");
    console.log(`Successfully uploaded ${successfulUploads}/${totalFiles} essential files to https://github.com/${REPO_OWNER}/${REPO_NAME}`);
    
    if (successfulUploads < totalFiles) {
      console.log("\nSome files could not be uploaded. Please download the project and push manually.");
    }
    
  } catch (error) {
    console.error("\nError during essential files push:", error.message);
    console.log("Please download the project and push manually using Git commands.");
  }
}

// Execute the push
pushEssentialFiles().catch(error => {
  console.error("An unexpected error occurred:", error);
});