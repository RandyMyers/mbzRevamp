#!/bin/bash

echo "🔧 Fixing Swagger routes issue..."

# Navigate to the application directory
cd /var/www/mbztech

# Backup current app.js
echo "💾 Backing up current app.js..."
cp app.js app-backup-$(date +%Y%m%d-%H%M%S).js

# Create a fixed version of app.js with better Swagger setup
echo "📝 Creating fixed app.js with improved Swagger setup..."

# First, let's check what's in the current app.js around the Swagger setup
echo "Current Swagger setup in app.js:"
grep -A 20 -B 5 "Swagger API Documentation" app.js

# Let's create a simple test to see if the issue is with the middleware order
echo -e "\n🧪 Testing if the issue is with middleware order..."

# Create a minimal test app to verify Swagger works
cat > test-swagger-app.js << 'EOF'
const express = require('express');
const { specs, swaggerUi } = require('./swagger.js');

const app = express();

// Basic middleware
app.use(express.json());

// Swagger setup
console.log('Setting up Swagger...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Test endpoint
app.get('/api-docs/test', (req, res) => {
  res.json({ 
    message: 'Swagger test endpoint working',
    specs: !!specs,
    swaggerUi: !!swaggerUi,
    timestamp: new Date().toISOString()
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('- http://localhost:3001/api/health');
  console.log('- http://localhost:3001/api-docs/test');
  console.log('- http://localhost:3001/api-docs');
});
EOF

echo "Starting test server..."
node test-swagger-app.js &
TEST_PID=$!

# Wait for server to start
sleep 3

# Test the endpoints
echo -e "\n🧪 Testing endpoints on test server..."

echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\n2. Testing Swagger test endpoint..."
curl -s http://localhost:3001/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n3. Testing Swagger UI endpoint..."
curl -s -I http://localhost:3001/api-docs | head -1

# Stop test server
kill $TEST_PID 2>/dev/null
rm -f test-swagger-app.js

echo -e "\n✅ Test complete!"
