#!/bin/bash

echo "🔍 Debugging app.js and server logs..."

# Navigate to the application directory
cd /var/www/mbztech

# Check app.js syntax
echo "1. Checking app.js syntax..."
node -c app.js && echo "✅ app.js syntax is valid" || echo "❌ app.js has syntax errors"

# Check if app.js can be loaded
echo -e "\n2. Testing app.js loading..."
node -e "
try {
  console.log('Loading app.js...');
  const app = require('./app.js');
  console.log('✅ app.js loaded successfully');
  console.log('App type:', typeof app);
} catch (error) {
  console.log('❌ Error loading app.js:', error.message);
  console.log('Stack trace:', error.stack);
}
"

# Check PM2 logs for errors
echo -e "\n3. Checking PM2 logs for errors..."
pm2 logs mbztech-api --lines 20 --nostream | tail -20

# Check if the server is actually running the updated code
echo -e "\n4. Testing if server is running updated code..."
curl -s https://api.elapix.store/api/health | jq '.timestamp' || echo "Health endpoint failed"

echo -e "\n5. Checking if Swagger routes are registered..."
# Let's check if we can access the app object and see what routes are registered
node -e "
try {
  const app = require('./app.js');
  console.log('App loaded, checking routes...');
  // This is a bit tricky to check routes without starting the server
  console.log('App object type:', typeof app);
} catch (error) {
  console.log('Error:', error.message);
}
"
