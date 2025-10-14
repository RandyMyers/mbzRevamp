#!/bin/bash

echo "🔍 Finding and stopping the service that's auto-restarting old processes..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking for systemd services related to mbztech..."
systemctl list-units --type=service | grep -i mbz || echo "No mbz services found"

echo -e "\n2. Checking for any services running as mbzapp user..."
systemctl list-units --type=service --state=running | grep -v "systemd\|dbus\|NetworkManager" | head -10

echo -e "\n3. Checking for any processes managed by systemd..."
ps aux | grep mbzapp | grep -v grep

echo -e "\n4. Checking if there's a systemd service file..."
find /etc/systemd/system/ -name "*mbz*" -o -name "*api*" 2>/dev/null || echo "No mbz systemd services found"

echo -e "\n5. Checking for any PM2 processes running as mbzapp..."
sudo -u mbzapp pm2 list 2>/dev/null || echo "No PM2 processes as mbzapp user"

echo -e "\n6. Checking for any supervisor or other process managers..."
ps aux | grep -E "(supervisor|forever|nodemon)" | grep -v grep || echo "No other process managers found"

echo -e "\n7. Let's try to stop any services that might be running the old app..."
echo "Stopping any potential services..."

# Try to stop common service names
for service in mbztech-api mbztech mbz-api api mbztech-app; do
    if systemctl is-active --quiet $service 2>/dev/null; then
        echo "Found and stopping service: $service"
        systemctl stop $service
    fi
done

echo -e "\n8. Killing all remaining Node.js processes running the old app..."
pkill -f "node /var/www/mbztech/app.js" || echo "No processes to kill"

echo -e "\n9. Waiting for processes to die..."
sleep 3

echo -e "\n10. Checking what's running now..."
ps aux | grep "node /var/www/mbztech/app.js" | grep -v grep

echo -e "\n11. Testing our fresh app directly on port 8800..."
curl -s http://localhost:8800/api/health | jq '.' || echo "Direct port 8800 failed"

echo -e "\n12. Testing our fresh app Swagger endpoints directly..."
curl -s http://localhost:8800/api-docs/test | jq '.' || echo "Direct Swagger test failed"

echo -e "\n13. Now testing the public endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Public endpoint failed"

echo -e "\n14. Testing Swagger endpoints via public URL..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Public Swagger test failed"

echo -e "\n✅ Service cleanup complete!"
