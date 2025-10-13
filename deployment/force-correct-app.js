#!/bin/bash

echo "🔧 Force using the correct app.js file..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking what's in our current app.js..."
echo "First 10 lines of app.js:"
head -10 app.js

echo -e "\n2. Checking if our fresh app.js has the right content..."
if grep -q "🚀 Setting up Swagger" app.js; then
    echo "✅ Fresh app.js content found"
else
    echo "❌ Fresh app.js content NOT found - this is the problem!"
fi

echo -e "\n3. Checking PM2 status..."
pm2 list

echo -e "\n4. Force stopping PM2 completely..."
pm2 kill
sleep 3

echo -e "\n5. Starting PM2 fresh with our app.js..."
pm2 start app.js --name mbztech-api
sleep 5

echo -e "\n6. Checking PM2 logs to see if our fresh app is running..."
pm2 logs mbztech-api --lines 10 --nostream

echo -e "\n7. Testing if the server is now running our fresh app..."
echo "Testing health endpoint (should show different response):"
curl -s https://api.elapix.store/api/health | jq '.'

echo -e "\n8. Testing Swagger endpoints..."
echo "Testing /api-docs/test:"
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n9. Testing /api-docs/swagger.json:"
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n10. Testing /api-docs:"
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n✅ Force correct app.js complete!"
