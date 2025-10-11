#!/bin/bash

echo "🔍 Verifying app.js changes on production server..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking if app.js contains our debug messages..."
if grep -q "Setting up Swagger documentation" app.js; then
  echo "✅ Found 'Setting up Swagger documentation' message"
else
  echo "❌ 'Setting up Swagger documentation' message not found"
fi

if grep -q "Swagger specs loaded" app.js; then
  echo "✅ Found 'Swagger specs loaded' message"
else
  echo "❌ 'Swagger specs loaded' message not found"
fi

if grep -q "api-docs/test" app.js; then
  echo "✅ Found test endpoint '/api-docs/test'"
else
  echo "❌ Test endpoint '/api-docs/test' not found"
fi

echo -e "\n2. Checking app.js file size and last modified..."
ls -la app.js

echo -e "\n3. Checking if swagger.js exists and is readable..."
ls -la swagger.js

echo -e "\n4. Testing swagger.js loading..."
node -e "
try {
  const { specs, swaggerUi } = require('./swagger.js');
  console.log('✅ swagger.js loads successfully');
  console.log('Specs loaded:', !!specs);
  console.log('SwaggerUI loaded:', !!swaggerUi);
} catch (error) {
  console.log('❌ Error loading swagger.js:', error.message);
}
"
