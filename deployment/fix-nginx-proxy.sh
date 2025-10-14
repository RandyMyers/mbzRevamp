#!/bin/bash

echo "🔧 Fixing nginx proxy configuration..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking what processes are running on port 8800..."
netstat -tlnp | grep :8800 || echo "No process on port 8800"

echo -e "\n2. Checking what processes are running on port 443..."
netstat -tlnp | grep :443 || echo "No process on port 443"

echo -e "\n3. Checking nginx configuration..."
if [ -f "/etc/nginx/sites-available/api.elapix.store" ]; then
    echo "Nginx config for api.elapix.store:"
    cat /etc/nginx/sites-available/api.elapix.store
else
    echo "Nginx config not found at /etc/nginx/sites-available/api.elapix.store"
    echo "Checking for other nginx configs..."
    ls -la /etc/nginx/sites-available/ | grep -i api
fi

echo -e "\n4. Checking if there are any other Node.js processes running..."
ps aux | grep node | grep -v grep

echo -e "\n5. Testing our fresh app directly on port 8800..."
curl -s http://localhost:8800/api/health | jq '.' || echo "Direct port 8800 failed"

echo -e "\n6. Testing our fresh app Swagger endpoints directly..."
curl -s http://localhost:8800/api-docs/test | jq '.' || echo "Direct Swagger test failed"

echo -e "\n7. Checking if nginx is running and what it's proxying to..."
systemctl status nginx | head -10

echo -e "\n8. The issue is likely that nginx is proxying to the wrong port or server"
echo "We need to update nginx to proxy to our fresh app on port 8800"

echo -e "\n✅ Nginx proxy check complete!"
echo "Next step: Update nginx configuration to proxy to port 8800"
