#!/bin/bash

# Exit on any error
set -e

# Pull the latest changes from Git
echo "Pulling latest changes from Git..."
git pull origin HEAD || {
  echo "Error: Git pull failed"
  exit 1
}

# Install dependencies using pnpm
echo "Installing dependencies using pnpm..."
pnpm install || {
  echo "Error: pnpm install failed"
  exit 1
}

Build the project
echo "Building project..."
pnpm build || {
  echo "Error: pnpm build failed"
  exit 1
}

# Restart the PM2 process
echo "Restarting PM2 process..."
pm2 restart prod-api || {
  echo "Error: PM2 restart failed"
  exit 1
}

echo "PROD Deployment successful!"
