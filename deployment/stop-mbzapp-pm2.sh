#!/bin/bash

echo "🔧 Stopping the mbzapp PM2 service that's interfering..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Current PM2 services status..."
systemctl status pm2-mbzapp.service | head -10

echo -e "\n2. Stopping the mbzapp PM2 service..."
systemctl stop pm2-mbzapp.service

echo -e "\n3. Disabling the mbzapp PM2 service to prevent auto-start..."
systemctl disable pm2-mbzapp.service

echo -e "\n4. Checking if the service is stopped..."
systemctl status pm2-mbzapp.service | head -5

echo -e "\n5. Killing any remaining processes running the old app..."
pkill -f "node /var/www/mbztech/app.js" || echo "No processes to kill"

echo -e "\n6. Waiting for processes to die..."
sleep 3

echo -e "\n7. Checking what's running now..."
ps aux | grep "node /var/www/mbztech/app.js" | grep -v grep

echo -e "\n8. Checking our PM2 process (should be the only one running)..."
pm2 list

echo -e "\n9. Testing our fresh app directly on port 8800..."
curl -s http://localhost:8800/api/health | jq '.' || echo "Direct port 8800 failed"

echo -e "\n10. Testing our fresh app Swagger endpoints directly..."
curl -s http://localhost:8800/api-docs/test | jq '.' || echo "Direct Swagger test failed"

echo -e "\n11. Now testing the public endpoint (should work now)..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Public endpoint failed"

echo -e "\n12. Testing Swagger endpoints via public URL..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Public Swagger test failed"

echo -e "\n13. Testing Swagger UI via public URL..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n14. Testing Swagger JSON via public URL..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n✅ mbzapp PM2 service stopped!"
echo "The Swagger documentation should now be working at: https://api.elapix.store/api-docs"
