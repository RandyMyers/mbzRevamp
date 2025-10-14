#!/bin/bash

echo "🔄 Restarting MBZ Tech API server..."

# Navigate to the application directory
cd /var/www/mbztech

# Stop the current PM2 process
echo "⏹️  Stopping current server..."
pm2 stop mbztech-api || echo "No PM2 process found"

# Start the server again
echo "🚀 Starting server..."
pm2 start app.js --name mbztech-api

# Wait a moment for the server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the endpoints
echo "🧪 Testing endpoints..."

echo "1. Testing health endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\n2. Testing Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n3. Testing Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n4. Testing Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n✅ Server restart and testing complete!"
echo "📖 Swagger documentation should be available at: https://api.elapix.store/api-docs"
