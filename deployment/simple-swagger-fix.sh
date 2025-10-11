#!/bin/bash

echo "🔧 Applying simple Swagger fix..."

# Navigate to the application directory
cd /var/www/mbztech

# Backup current app.js
echo "💾 Backing up current app.js..."
cp app.js app-backup-$(date +%Y%m%d-%H%M%S).js

# Create a simple fix by adding error handling around Swagger setup
echo "📝 Adding error handling to Swagger setup..."

# Create a patch for the Swagger setup
cat > swagger-patch.js << 'EOF'
// Swagger API Documentation with error handling
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

// Serve Swagger JSON with error handling
app.get('/api-docs/swagger.json', (req, res) => {
  console.log('Swagger JSON endpoint accessed');
  console.log('Specs available:', specs ? 'Yes' : 'No');
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.send(specs);
  } catch (error) {
    console.error('Error serving Swagger JSON:', error.message);
    res.status(500).json({ error: 'Failed to serve Swagger JSON' });
  }
});
EOF

# Apply the patch to app.js
echo "Applying patch to app.js..."

# Find the Swagger section and replace it
sed -i '/Swagger API Documentation/,/res\.send(specs);/c\
// Swagger API Documentation with error handling\
console.log('\''Setting up Swagger documentation...'\'');\
console.log('\''Swagger specs loaded:'\'', specs ? '\''Yes'\'' : '\''No'\'');\
console.log('\''Swagger UI available:'\'', swaggerUi ? '\''Yes'\'' : '\''No'\'');\
\
try {\
  // Swagger UI setup\
  app.use('\''/api-docs'\'', swaggerUi.serve, swaggerUi.setup(specs, {\
    customCss: '\''.swagger-ui .topbar { display: none }'\'',\
    customSiteTitle: '\''MBZ Tech Platform API Documentation'\'',\
    customfavIcon: '\''/favicon.ico'\'',\
    swaggerOptions: {\
      persistAuthorization: true,\
      displayRequestDuration: true,\
      filter: true,\
      deepLinking: true,\
      url: '\''/api-docs/swagger.json'\'',\
      validatorUrl: null\
    }\
  }));\
  console.log('\''✅ Swagger UI middleware registered successfully'\'');\
} catch (error) {\
  console.error('\''❌ Error setting up Swagger UI:'\'', error.message);\
}\
\
console.log('\''Swagger documentation setup complete'\'');\
\
// Test endpoint to verify Swagger setup\
app.get('\''/api-docs/test'\'', (req, res) => {\
  console.log('\''Swagger test endpoint accessed'\'');\
  res.json({\
    message: '\''Swagger test endpoint working'\'',\
    specsLoaded: !!specs,\
    swaggerUiLoaded: !!swaggerUi,\
    timestamp: new Date().toISOString()\
  });\
});\
\
// Serve Swagger JSON with error handling\
app.get('\''/api-docs/swagger.json'\'', (req, res) => {\
  console.log('\''Swagger JSON endpoint accessed'\'');\
  console.log('\''Specs available:'\'', specs ? '\''Yes'\'' : '\''No'\'');\
  try {\
    res.setHeader('\''Content-Type'\'', '\''application/json'\'');\
    res.setHeader('\''Access-Control-Allow-Origin'\'', '\''*'\'');\
    res.setHeader('\''Access-Control-Allow-Methods'\'', '\''GET, POST, PUT, DELETE, OPTIONS'\'');\
    res.setHeader('\''Access-Control-Allow-Headers'\'', '\''Content-Type, Authorization'\'');\
    res.send(specs);\
  } catch (error) {\
    console.error('\''Error serving Swagger JSON:'\'', error.message);\
    res.status(500).json({ error: '\''Failed to serve Swagger JSON'\'' });\
  }\
});' app.js

# Test the updated app.js
echo "🧪 Testing updated app.js..."
node -c app.js && echo "✅ app.js syntax is valid" || echo "❌ app.js has syntax errors"

# Restart the server
echo "🔄 Restarting server..."
pm2 restart mbztech-api

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the endpoints
echo "🧪 Testing Swagger endpoints..."

echo "1. Testing Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n2. Testing Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n3. Testing Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

# Clean up
rm -f swagger-patch.js

echo -e "\n✅ Swagger fix complete!"
