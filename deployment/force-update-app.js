#!/bin/bash

echo "🔧 Force updating app.js on production server..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking current app.js content..."
echo "Current app.js size: $(wc -c < app.js) bytes"
echo "Current app.js last modified: $(ls -la app.js)"

echo -e "\n2. Checking if our debug messages are in the current app.js..."
if grep -q "Setting up Swagger documentation" app.js; then
    echo "✅ Debug messages found in app.js"
else
    echo "❌ Debug messages NOT found in app.js - this is the problem!"
fi

echo -e "\n3. Checking backup files..."
ls -la app-backup-*.js 2>/dev/null || echo "No backup files found"

echo -e "\n4. The issue is that the main server is running the OLD app.js file"
echo "We need to ensure the server is running the NEW app.js with our Swagger setup"

echo -e "\n5. Let's check what PM2 is actually running..."
pm2 show mbztech-api

echo -e "\n6. Force stopping and starting PM2 to ensure it picks up the new app.js..."
pm2 delete mbztech-api
sleep 2
pm2 start app.js --name mbztech-api
sleep 3

echo -e "\n7. Checking if the new server shows our debug messages..."
pm2 logs mbztech-api --lines 20 --nostream | grep -E "(Setting up Swagger|Swagger specs loaded|Swagger UI available)" || echo "No Swagger debug messages found"

echo -e "\n8. Testing Swagger endpoints after force restart..."
echo "Testing /api-docs/test..."
curl -s https://api.elapix.store/api-docs/test | head -100

echo -e "\n9. Testing /api-docs/swagger.json..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n✅ Force update complete!"
