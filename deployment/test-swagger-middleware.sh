#!/bin/bash

echo "🔍 Testing Swagger middleware setup..."

# Navigate to the application directory
cd /var/www/mbztech

# Create a simple test to verify Swagger middleware
echo "1. Testing Swagger middleware directly..."
node -e "
const express = require('express');
const { specs, swaggerUi } = require('./swagger.js');

console.log('Creating test app...');
const testApp = express();

console.log('Setting up Swagger middleware...');
testApp.use('/test-api-docs', swaggerUi.serve, swaggerUi.setup(specs));

console.log('Adding test endpoint...');
testApp.get('/test-api-docs/test', (req, res) => {
  res.json({ message: 'Test endpoint working', specs: !!specs, swaggerUi: !!swaggerUi });
});

console.log('Starting test server on port 3001...');
const server = testApp.listen(3001, () => {
  console.log('Test server started on port 3001');
  
  // Test the endpoint
  const http = require('http');
  const req = http.get('http://localhost:3001/test-api-docs/test', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Test endpoint response:', data);
      server.close();
    });
  });
  
  req.on('error', (err) => {
    console.log('Test endpoint error:', err.message);
    server.close();
  });
});
"
