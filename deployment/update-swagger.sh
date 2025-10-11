#!/bin/bash

echo "🔄 Updating Swagger configuration on production server..."

# Navigate to the application directory
cd /var/www/mbztech

# Backup current swagger.js
echo "💾 Backing up current swagger.js..."
cp swagger.js swagger-backup-$(date +%Y%m%d-%H%M%S).js

# Copy the simplified swagger configuration
echo "📝 Updating swagger.js with simplified version..."
cp /Users/maleo/Documents/Work/mbzRevamp/swagger-simple.js swagger.js

# Restart the server
echo "🔄 Restarting server..."
pm2 restart mbztech-api

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the endpoints
echo "🧪 Testing Swagger endpoints..."

echo "1. Testing Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n2. Testing Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n3. Testing Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n✅ Swagger update complete!"
echo "📖 Swagger documentation should now be available at: https://api.elapix.store/api-docs"
