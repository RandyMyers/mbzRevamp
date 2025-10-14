#!/bin/bash

echo "🔄 Restoring full Swagger configuration..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Creating backup of current working minimal setup..."
cp swagger.js swagger-minimal-backup-$(date +%Y%m%d-%H%M%S).js
cp app.js app-minimal-backup-$(date +%Y%m%d-%H%M%S).js

echo "2. Restoring the original full swagger.js..."
if [ -f "swagger-backup.js" ]; then
    echo "Found original swagger-backup.js, restoring..."
    cp swagger-backup.js swagger.js
    echo "✅ Full swagger.js restored"
else
    echo "❌ Original swagger-backup.js not found"
    echo "Let's check what backup files we have..."
    ls -la swagger-backup*.js
    exit 1
fi

echo -e "\n3. Testing the full swagger.js file..."
node -e "
try {
  console.log('Testing full swagger.js...');
  const { specs, swaggerUi } = require('./swagger.js');
  console.log('✅ Full swagger.js loads successfully');
  console.log('Specs loaded:', !!specs);
  console.log('SwaggerUI loaded:', !!swaggerUi);
  console.log('Specs size:', JSON.stringify(specs).length, 'characters');
} catch (error) {
  console.log('❌ Error loading full swagger.js:', error.message);
  exit(1);
}
"

echo -e "\n4. Now we need to update app.js to use the full swagger configuration"
echo "The current app.js has minimal setup, we need to integrate the full swagger"

# Create a new app.js that combines our working minimal setup with the full swagger
echo -e "\n5. Creating app.js with full swagger integration..."

# First, let's get the current working app.js structure
cat > app-full-swagger.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import FULL Swagger configuration
const { specs, swaggerUi } = require('./swagger');

dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// FULL SWAGGER SETUP - AT THE VERY BEGINNING
console.log('🚀 Setting up FULL Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

try {
  // Full Swagger UI setup with all options
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
  console.log('✅ Full Swagger UI middleware registered successfully');
} catch (error) {
  console.error('❌ Error setting up Full Swagger UI:', error.message);
}

console.log('✅ Full Swagger documentation setup complete');

// Test endpoint to verify Swagger setup
app.get('/api-docs/test', (req, res) => {
  res.json({ 
    message: 'Full Swagger test endpoint working',
    specsLoaded: !!specs,
    swaggerUiLoaded: !!swaggerUi,
    specsSize: JSON.stringify(specs).length,
    timestamp: new Date().toISOString()
  });
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(specs);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MBZ Tech Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/mbztech')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 Full Swagger docs: http://localhost:${PORT}/api-docs`);
});
EOF

echo "6. Testing the new app.js with full swagger..."
node -c app-full-swagger.js && echo "✅ app-full-swagger.js syntax OK" || {
  echo "❌ app-full-swagger.js syntax error"
  exit 1
}

echo -e "\n7. Replacing app.js with full swagger version..."
mv app-full-swagger.js app.js

echo -e "\n8. Restarting PM2 with full swagger configuration..."
pm2 restart mbztech-api
sleep 5

echo -e "\n9. Testing full Swagger setup..."

echo "Testing health endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\nTesting Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\nTesting Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\nTesting Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n10. Checking PM2 logs for any errors..."
pm2 logs mbztech-api --lines 10 --nostream

echo -e "\n✅ Full Swagger restoration complete!"
echo "📖 Full Swagger documentation should now be available at: https://api.elapix.store/api-docs"
echo "🔍 Check the test endpoint to see the specs size and verify all API documentation is loaded"
