#!/bin/bash

echo "🔍 Testing Swagger UI setup directly..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Creating a minimal test to isolate the Swagger UI issue..."

# Create a test that mimics exactly what the main app does
cat > test-swagger-ui.js << 'EOF'
const express = require('express');
const { specs, swaggerUi } = require('./swagger.js');

console.log('Creating test app with exact same setup as main app...');
const app = express();

// Basic middleware (same as main app)
app.use(express.json());

// CORS (same as main app)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger setup (EXACT same as main app)
console.log('Setting up Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

try {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MBZ Tech Platform API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      deepLinking: true,
      url: '/api-docs/swagger.json',
      validatorUrl: null
    }
  }));
  console.log('✅ Swagger UI middleware registered successfully');
} catch (error) {
  console.error('❌ Error setting up Swagger UI:', error.message);
}

console.log('Swagger documentation setup complete');

// Test endpoint to verify Swagger setup
app.get('/api-docs/test', (req, res) => {
  console.log('Swagger test endpoint accessed');
  res.json({
    message: 'Swagger test endpoint working',
    specsLoaded: !!specs,
    swaggerUiLoaded: !!swaggerUi,
    timestamp: new Date().toISOString()
  });
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  console.log('Swagger JSON endpoint accessed');
  console.log('Specs available:', specs ? 'Yes' : 'No');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(specs);
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('- http://localhost:3002/api/health');
  console.log('- http://localhost:3002/api-docs/test');
  console.log('- http://localhost:3002/api-docs');
  console.log('- http://localhost:3002/api-docs/swagger.json');
});
EOF

echo "Starting test server with exact same setup as main app..."
node test-swagger-ui.js &
TEST_PID=$!

# Wait for server to start
sleep 3

# Test the endpoints
echo -e "\n🧪 Testing endpoints on test server..."

echo "1. Testing health endpoint..."
curl -s http://localhost:3002/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\n2. Testing Swagger test endpoint..."
curl -s http://localhost:3002/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n3. Testing Swagger JSON endpoint..."
curl -s -I http://localhost:3002/api-docs/swagger.json | head -1

echo -e "\n4. Testing Swagger UI endpoint..."
curl -s -I http://localhost:3002/api-docs | head -1

# Stop test server
echo -e "\n🛑 Stopping test server..."
kill $TEST_PID 2>/dev/null
rm -f test-swagger-ui.js

echo -e "\n✅ Swagger UI test complete!"
echo "If this test works but the main app doesn't, there's something specific in the main app causing the issue."
