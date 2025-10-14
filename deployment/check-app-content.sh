#!/bin/bash

echo "🔍 Checking app.js content around Swagger setup..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking the exact content around the Swagger setup..."
echo "Lines around Swagger setup:"
grep -n -A 10 -B 5 "Swagger API Documentation" app.js

echo -e "\n2. Checking if there are any hidden characters or encoding issues..."
hexdump -C app.js | grep -A 5 -B 5 "Swagger"

echo -e "\n3. Checking the file size and line count..."
echo "File size: $(wc -c < app.js) bytes"
echo "Line count: $(wc -l < app.js) lines"

echo -e "\n4. Checking if the file is truncated or corrupted..."
echo "Last 10 lines of app.js:"
tail -10 app.js

echo -e "\n5. Checking if there are any syntax issues by testing specific sections..."
node -e "
try {
  console.log('Testing Swagger import...');
  const { specs, swaggerUi } = require('./swagger.js');
  console.log('✅ Swagger import works');
  
  console.log('Testing Express import...');
  const express = require('express');
  console.log('✅ Express import works');
  
  console.log('Testing app creation...');
  const app = express();
  console.log('✅ App creation works');
  
} catch (error) {
  console.log('❌ Error in imports:', error.message);
}
"

echo -e "\n6. Let's check if the issue is with the file encoding..."
file app.js

echo -e "\n7. Checking if there are any non-printable characters..."
cat -A app.js | grep -n "Swagger" | head -3

echo -e "\n✅ App content check complete!"
