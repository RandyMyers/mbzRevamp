#!/bin/bash

echo "🔄 Restarting server and testing analytics endpoints..."
echo "====================================================="

# Navigate to the application directory
cd /var/www/mbztech

# Restart the application
echo "⏹️  Stopping current server..."
pm2 stop mbztech-api

echo "🚀 Starting server..."
pm2 start app.js --name mbztech-api

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test analytics endpoints
echo "🧪 Testing analytics endpoints..."

# Test total revenue endpoint
echo "1. Testing total-revenue endpoint..."
curl -s -X GET "https://api.elapix.store/api/analytics/total-revenue?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON response"

echo -e "\n2. Testing total-orders endpoint..."
curl -s -X GET "https://api.elapix.store/api/analytics/total-orders?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON response"

echo -e "\n3. Testing new-customers endpoint..."
curl -s -X GET "https://api.elapix.store/api/analytics/new-customers?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON response"

echo -e "\n4. Testing health endpoint..."
curl -s -X GET "https://api.elapix.store/api/health" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON response"

echo -e "\n📊 Checking application status..."
pm2 status

echo -e "\n📝 Recent logs (last 10 lines):"
pm2 logs mbztech-api --lines 10

echo -e "\n✅ Server restart and analytics testing complete!"
