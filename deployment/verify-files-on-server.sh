#!/bin/bash

echo "🔍 Verifying files on production server..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking if swagger.js exists and its content..."
if [ -f "swagger.js" ]; then
    echo "✅ swagger.js exists"
    echo "File size: $(wc -c < swagger.js) bytes"
    echo "Last modified: $(ls -la swagger.js)"
    echo "First 10 lines:"
    head -10 swagger.js
    echo "..."
    echo "Last 10 lines:"
    tail -10 swagger.js
else
    echo "❌ swagger.js does not exist!"
fi

echo -e "\n2. Checking if app.js exists and its content..."
if [ -f "app.js" ]; then
    echo "✅ app.js exists"
    echo "File size: $(wc -c < app.js) bytes"
    echo "Last modified: $(ls -la app.js)"
    echo "Contains Swagger setup:"
    grep -n "Swagger" app.js | head -5
else
    echo "❌ app.js does not exist!"
fi

echo -e "\n3. Checking if swagger dependencies are installed..."
if [ -f "package.json" ]; then
    echo "Checking package.json for swagger dependencies:"
    grep -i swagger package.json
else
    echo "❌ package.json not found!"
fi

echo -e "\n4. Checking node_modules for swagger packages..."
if [ -d "node_modules" ]; then
    echo "Swagger packages in node_modules:"
    ls node_modules | grep -i swagger || echo "No swagger packages found in node_modules"
else
    echo "❌ node_modules directory not found!"
fi

echo -e "\n5. Testing swagger.js loading directly..."
node -e "
try {
  console.log('Loading swagger.js...');
  const { specs, swaggerUi } = require('./swagger.js');
  console.log('✅ swagger.js loaded successfully');
  console.log('Specs type:', typeof specs);
  console.log('SwaggerUI type:', typeof swaggerUi);
  console.log('Specs size:', JSON.stringify(specs).length);
} catch (error) {
  console.log('❌ Error loading swagger.js:', error.message);
  console.log('Stack trace:', error.stack);
}
"

echo -e "\n6. Checking server logs for any swagger-related errors..."
pm2 logs mbztech-api --lines 20 --nostream | grep -i swagger || echo "No swagger-related log entries found"

echo -e "\n7. Testing if the issue is with file permissions..."
ls -la swagger.js app.js 2>/dev/null || echo "Files not found"

echo -e "\n✅ File verification complete!"
