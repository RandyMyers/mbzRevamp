#!/bin/bash

echo "🔍 Debugging route registration issue..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking recent server logs for any errors..."
pm2 logs mbztech-api --lines 50 --nostream | tail -20

echo -e "\n2. Testing if the issue is with the route path..."
echo "Testing different Swagger paths:"

echo "Testing /api-docs (without trailing slash)..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo "Testing /api-docs/ (with trailing slash)..."
curl -s -I https://api.elapix.store/api-docs/ | head -1

echo "Testing /api-docs/index.html..."
curl -s -I https://api.elapix.store/api-docs/index.html | head -1

echo -e "\n3. Testing if the issue is with the test endpoint specifically..."
echo "Testing /api-docs/test..."
curl -s https://api.elapix.store/api-docs/test

echo -e "\n4. Testing if the issue is with the swagger.json endpoint..."
echo "Testing /api-docs/swagger.json..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n5. Checking if there are any route conflicts..."
echo "Testing if any other routes are responding on /api-docs path..."
curl -s -I https://api.elapix.store/api-docs/anything | head -1

echo -e "\n6. Testing with verbose curl to see what's happening..."
echo "Verbose test of /api-docs/test:"
curl -v https://api.elapix.store/api-docs/test 2>&1 | head -20

echo -e "\n7. Checking if the issue is with the server restart..."
echo "Force restarting server and checking logs..."
pm2 restart mbztech-api
sleep 3
echo "Recent logs after restart:"
pm2 logs mbztech-api --lines 10 --nostream

echo -e "\n8. Testing immediately after restart..."
sleep 2
echo "Testing /api-docs/test after restart..."
curl -s https://api.elapix.store/api-docs/test

echo -e "\n✅ Route registration debug complete!"
