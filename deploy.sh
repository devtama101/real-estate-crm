#!/bin/bash
# Deploy script for Real Estate CRM
# Run this on the VPS to deploy the latest version

set -e

echo "Deploying Real Estate CRM..."

# Navigate to project directory
cd ~/real-estate-crm

# Pull latest code
echo "Pulling latest code..."
cd real-estate-crm-src
git pull
cd ..

# Build Docker image
echo "Building Docker image..."
docker build -t real-estate-crm:latest ~/real-estate-crm/real-estate-crm-src

# Restart app container
echo "Restarting app..."
docker compose up -d app

# Update database schema via temp container
echo "Updating database schema..."
docker run --rm \
  --network real-estate-crm_real-estate-crm-network \
  -e DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2-)" \
  -v $(pwd)/real-estate-crm-src:/app \
  -w /app \
  node:20-alpine \
  sh -c 'npx prisma generate && npx prisma db push --accept-data-loss'

# Show status
echo ""
echo "Deployment complete!"
echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Recent app logs:"
docker compose logs app --tail 20
