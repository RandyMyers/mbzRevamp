#!/bin/bash

echo "🔄 Updating CORS configuration for elapix domains"
echo "================================================"

# Navigate to the application directory
cd /var/www/mbztech

echo "📥 Pulling latest changes..."
git pull origin omale

echo "🔄 Restarting application..."
pm2 restart mbztech-api

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

echo "🧪 Testing CORS for elapix domains..."
echo "Testing elapix.mbztechnology.com..."
curl -X OPTIONS "https://api.elapix.store/api/auth/login" \
  -H "Origin: https://elapix.mbztechnology.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

echo ""
echo "Testing elapix.store..."
curl -X OPTIONS "https://api.elapix.store/api/analytics/funnel-data" \
  -H "Origin: https://elapix.store" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

echo ""
echo "📊 Checking application status..."
pm2 status

echo ""
echo "📝 Recent logs (last 10 lines):"
pm2 logs mbztech-api --lines 10

echo ""
echo "✅ CORS update complete!"
echo "🌐 Your frontends should now work:"
echo "   - https://elapix.mbztechnology.com"
echo "   - https://elapix.store"
