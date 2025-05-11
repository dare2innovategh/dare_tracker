#!/bin/bash

# Configuration
REPO_URL="https://github.com/dare2innovategh/Youth-In-Job-Tracker.git"
GITHUB_TOKEN="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"

echo "Deploying to repository: $REPO_URL"

# Initialize Git repository if it doesn't exist
if [ ! -d ".git" ]; then
  echo "Initializing Git repository..."
  git init
fi

# Configure Git
echo "Configuring Git..."
git config user.name "DARE Ghana"
git config user.email "dare@example.com"

# Add all files to Git
echo "Adding files to Git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Deploy DARE Youth Job Tracker with improvements"

# Add the remote repository
git remote remove origin 2>/dev/null || true

# Modify the URL to include the token
REPO_URL_WITH_TOKEN="${REPO_URL/https:\/\//https:\/\/$GITHUB_TOKEN@}"
git remote add origin "$REPO_URL_WITH_TOKEN"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main --force || git push origin master --force

echo "Deployment successful!"