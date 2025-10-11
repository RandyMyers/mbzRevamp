#!/bin/bash

echo "🔍 Debugging app.js execution..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking if app.js can be executed directly..."
node -e "
try {
  console.log('Testing app.js execution...');
  const app = require('./app.js');
  console.log('✅ app.js executed successfully');
  console.log('App type:', typeof app);
} catch (error) {
  console.log('❌ Error executing app.js:', error.message);
  console.log('Stack trace:', error.stack);
}
"

echo -e "\n2. Checking if there are any syntax errors in app.js..."
node -c app.js && echo "✅ app.js syntax is valid" || echo "❌ app.js has syntax errors"

echo -e "\n3. Checking the first 20 lines of app.js to see what's being executed..."
head -20 app.js

echo -e "\n4. Checking if our debug messages are actually in the file..."
grep -n "Setting up Swagger documentation" app.js

echo -e "\n5. Checking PM2 logs to see what's actually being executed..."
pm2 logs mbztech-api --lines 30 --nostream

echo -e "\n6. Testing if the issue is with the server startup..."
echo "Let's see what happens when we start the server manually..."
timeout 10s node app.js &
MANUAL_PID=$!
sleep 3
echo "Manual server started, checking if it shows our debug messages..."
kill $MANUAL_PID 2>/dev/null

echo -e "\n7. Checking if there are any environment variables affecting execution..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo -e "\n8. Checking if the issue is with the file permissions..."
ls -la app.js

echo -e "\n9. Let's try a different approach - create a minimal test app.js..."
cat > test-app.js << 'EOF'
const express = require('express');
const { specs, swaggerUi } = require('./swagger.js');

console.log('=== TEST APP STARTING ===');
console.log('Setting up Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

const app = express();

try {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('✅ Swagger UI middleware registered successfully');
} catch (error) {
  console.error('❌ Error setting up Swagger UI:', error.message);
}

app.get('/api-docs/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Test server running' });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
EOF

echo "Starting test app..."
node test-app.js &
TEST_PID=$!
sleep 3

echo "Testing test app endpoints..."
curl -s http://localhost:3003/api/health | jq '.' || echo "Test app health failed"
curl -s http://localhost:3003/api-docs/test | jq '.' || echo "Test app swagger failed"

kill $TEST_PID 2>/dev/null
rm -f test-app.js

echo -e "\n✅ App execution debug complete!"
