#!/bin/bash

echo "🔍 Checking if server is running updated app.js..."

# Navigate to the application directory
cd /var/www/mbztech

# Check PM2 logs for our debug messages
echo "1. Checking for Swagger debug messages in logs..."
pm2 logs mbztech-api --lines 50 --nostream | grep -E "(Setting up Swagger|Swagger specs loaded|Swagger UI available|Swagger documentation setup complete)" || echo "No Swagger debug messages found"

echo -e "\n2. Checking for any error messages..."
pm2 logs mbztech-api --lines 20 --nostream | grep -i error || echo "No error messages found"

echo -e "\n3. Testing if the debug endpoint works..."
curl -s https://api.elapix.store/api-docs/test || echo "Debug endpoint failed"

echo -e "\n4. Checking server startup time..."
pm2 logs mbztech-api --lines 10 --nostream | grep -E "(Server is running|Connected to MongoDB)" || echo "No startup messages found"

echo -e "\n5. Force restart and check logs in real-time..."
echo "Restarting server and monitoring logs..."
pm2 restart mbztech-api
sleep 3
echo "Recent logs after restart:"
pm2 logs mbztech-api --lines 10 --nostream
