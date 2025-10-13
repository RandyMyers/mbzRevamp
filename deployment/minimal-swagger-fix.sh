#!/bin/bash

echo "🔧 Applying minimal Swagger fix..."

# Navigate to the application directory
cd /var/www/mbztech

# First, restore from backup if needed
echo "🔍 Checking for syntax errors..."
if ! node -c app.js 2>/dev/null; then
    echo "❌ Syntax error detected, restoring from backup..."
    if ls app-backup-*.js 1> /dev/null 2>&1; then
        LATEST_BACKUP=$(ls -t app-backup-*.js | head -1)
        echo "Restoring from: $LATEST_BACKUP"
        cp "$LATEST_BACKUP" app.js
        echo "✅ Restored from backup"
    else
        echo "❌ No backup found, cannot proceed"
        exit 1
    fi
fi

# Create a simple test to isolate the Swagger issue
echo "🧪 Creating isolated Swagger test..."

# Create a minimal test app
cat > test-minimal-swagger.js << 'EOF'
const express = require('express');
const { specs, swaggerUi } = require('./swagger.js');

console.log('Creating minimal test app...');
const app = express();

// Basic middleware
app.use(express.json());

// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Minimal test server is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger setup
console.log('Setting up Swagger...');
try {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('✅ Swagger middleware registered');
} catch (error) {
  console.error('❌ Swagger setup error:', error.message);
}

// Test endpoint
app.get('/api-docs/test', (req, res) => {
  res.json({ 
    message: 'Swagger test endpoint working',
    specs: !!specs,
    swaggerUi: !!swaggerUi,
    timestamp: new Date().toISOString()
  });
});

// Swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Minimal test server running on port ${PORT}`);
  console.log('Test the endpoints:');
  console.log('- http://localhost:3001/api/health');
  console.log('- http://localhost:3001/api-docs/test');
  console.log('- http://localhost:3001/api-docs');
  console.log('- http://localhost:3001/api-docs/swagger.json');
});
EOF

echo "Starting minimal test server..."
node test-minimal-swagger.js &
TEST_PID=$!

# Wait for server to start
sleep 3

# Test the endpoints
echo -e "\n🧪 Testing minimal server endpoints..."

echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\n2. Testing Swagger test endpoint..."
curl -s http://localhost:3001/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n3. Testing Swagger JSON endpoint..."
curl -s -I http://localhost:3001/api-docs/swagger.json | head -1

echo -e "\n4. Testing Swagger UI endpoint..."
curl -s -I http://localhost:3001/api-docs | head -1

# Stop test server
echo -e "\n🛑 Stopping test server..."
kill $TEST_PID 2>/dev/null
rm -f test-minimal-swagger.js

echo -e "\n✅ Minimal Swagger test complete!"
echo "If the minimal server works, the issue is in the main app.js configuration."
echo "If it doesn't work, the issue is with the Swagger setup itself."
