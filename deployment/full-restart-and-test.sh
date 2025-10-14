#!/bin/bash

echo "🔄 Full Server Restart and Endpoint Testing"
echo "==========================================="

# Navigate to the application directory
cd /var/www/mbztech

echo "⏹️  Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

echo "🧹 Clearing PM2 logs..."
pm2 flush

echo "🚀 Starting server fresh..."
pm2 start app.js --name mbztech-api

# Wait for server to fully start
echo "⏳ Waiting for server to start..."
sleep 10

echo "📊 Checking application status..."
pm2 status

echo ""
echo "🧪 Testing all endpoints..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s -X GET "https://api.elapix.store/api/health" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "Health endpoint failed"

# Test user endpoint
echo -e "\n2. Testing user endpoint..."
curl -s -X GET "https://api.elapix.store/api/users/get/68ec32c90d5eac09baad610c" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.' || echo "User endpoint failed"

# Test analytics endpoints
echo -e "\n3. Testing analytics endpoints..."

echo "   - Total Revenue:"
curl -s -X GET "https://api.elapix.store/api/analytics/total-revenue?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Total Orders:"
curl -s -X GET "https://api.elapix.store/api/analytics/total-orders?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - New Customers:"
curl -s -X GET "https://api.elapix.store/api/analytics/new-customers?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Average Order Value:"
curl -s -X GET "https://api.elapix.store/api/analytics/average-order-value?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Return Rate:"
curl -s -X GET "https://api.elapix.store/api/analytics/return-rate?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Lifetime Value:"
curl -s -X GET "https://api.elapix.store/api/analytics/lifetime-value?organizationId=68ec32c90d5eac09baad6108" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Product Performance:"
curl -s -X GET "https://api.elapix.store/api/analytics/product-performance?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Customer Acquisition:"
curl -s -X GET "https://api.elapix.store/api/analytics/customer-acquisition?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Funnel Data:"
curl -s -X GET "https://api.elapix.store/api/analytics/funnel-data?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Retention Data:"
curl -s -X GET "https://api.elapix.store/api/analytics/retention-data?organizationId=68ec32c90d5eac09baad6108" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo "   - Regional Sales:"
curl -s -X GET "https://api.elapix.store/api/analytics/regional-sales?organizationId=68ec32c90d5eac09baad6108&timeRange=30d" \
  -H "Origin: http://localhost:8081" \
  -H "Content-Type: application/json" | jq '.success' || echo "Failed"

echo ""
echo "📝 Recent logs (last 15 lines):"
pm2 logs mbztech-api --lines 15

echo ""
echo "✅ Full restart and testing complete!"
echo ""
echo "🎯 If all endpoints show 'true', your frontend should now work properly!"
echo "🔄 Try refreshing your frontend application now."
