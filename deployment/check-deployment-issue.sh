#!/bin/bash

echo "🔍 Checking deployment issue..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking if swagger.js is the simplified version we created..."
if [ -f "swagger.js" ]; then
    echo "swagger.js content:"
    cat swagger.js
    echo -e "\n--- End of swagger.js ---"
else
    echo "❌ swagger.js not found!"
fi

echo -e "\n2. Checking if there are multiple swagger files..."
find . -name "*swagger*" -type f

echo -e "\n3. Checking if the original swagger-backup.js exists..."
if [ -f "swagger-backup.js" ]; then
    echo "✅ Original swagger-backup.js exists"
    echo "Size: $(wc -c < swagger-backup.js) bytes"
else
    echo "❌ Original swagger-backup.js not found"
fi

echo -e "\n4. Testing if the issue is with the swagger.js file itself..."
node -e "
try {
  console.log('Testing swagger.js loading...');
  const { specs, swaggerUi } = require('./swagger.js');
  console.log('✅ swagger.js loads successfully');
  console.log('Specs loaded:', !!specs);
  console.log('SwaggerUI loaded:', !!swaggerUi);
  
  // Test if specs is valid
  if (specs) {
    console.log('Specs info:');
    console.log('- Title:', specs.info?.title);
    console.log('- Version:', specs.info?.version);
    console.log('- Servers:', specs.servers?.length || 0);
  }
} catch (error) {
  console.log('❌ Error loading swagger.js:', error.message);
}
"

echo -e "\n5. Checking if the issue is with the app.js import..."
node -e "
try {
  console.log('Testing app.js swagger import...');
  // Just test the import without starting the server
  const swaggerImport = require('./swagger.js');
  console.log('✅ Swagger import works in app.js context');
  console.log('Import result:', Object.keys(swaggerImport));
} catch (error) {
  console.log('❌ Error importing swagger in app.js context:', error.message);
}
"

echo -e "\n6. Checking if there are any backup files that might be interfering..."
ls -la *backup* 2>/dev/null || echo "No backup files found"

echo -e "\n✅ Deployment issue check complete!"
