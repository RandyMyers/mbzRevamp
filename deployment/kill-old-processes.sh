#!/bin/bash

echo "🔧 Killing old Node.js processes and fixing the proxy..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Current Node.js processes:"
ps aux | grep "node /var/www/mbztech/app.js" | grep -v grep

echo -e "\n2. Killing old processes (8809, 8810) that are running the old app.js..."
kill 8809 8810 2>/dev/null || echo "Processes already killed or not found"

echo -e "\n3. Waiting for processes to die..."
sleep 3

echo -e "\n4. Checking if old processes are gone..."
ps aux | grep "node /var/www/mbztech/app.js" | grep -v grep

echo -e "\n5. Testing our fresh app directly on port 8800..."
curl -s http://localhost:8800/api/health | jq '.' || echo "Direct port 8800 failed"

echo -e "\n6. Testing our fresh app Swagger endpoints directly..."
curl -s http://localhost:8800/api-docs/test | jq '.' || echo "Direct Swagger test failed"

echo -e "\n7. Now testing the public endpoint (should work now)..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Public endpoint failed"

echo -e "\n8. Testing Swagger endpoints via public URL..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Public Swagger test failed"

echo -e "\n9. Testing Swagger UI via public URL..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n10. Testing Swagger JSON via public URL..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n✅ Old processes cleanup complete!"
echo "The Swagger documentation should now be working at: https://api.elapix.store/api-docs"
