#!/bin/bash

echo "🔄 Fixing Swagger configuration on production server..."

# Navigate to the application directory
cd /var/www/mbztech

# Backup current swagger.js
echo "💾 Backing up current swagger.js..."
cp swagger.js swagger-backup-$(date +%Y%m%d-%H%M%S).js

# Create simplified swagger.js directly on the server
echo "📝 Creating simplified swagger.js..."
cat > swagger.js << 'EOF'
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MBZ Tech Platform API',
      version: '1.0.0',
      description: 'Complete API documentation for MBZ Tech Platform - E-commerce Management System',
      contact: {
        name: 'MBZ Tech Support',
        email: 'support@mbztech.com'
      }
    },
    servers: [
      {
        url: 'https://api.elapix.store',
        description: 'Production server (Digital Ocean)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      }
    }
  },
  apis: [
    './routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
EOF

# Test the new swagger.js file
echo "🧪 Testing new swagger.js file..."
node -e "const { specs, swaggerUi } = require('./swagger'); console.log('Specs loaded:', !!specs); console.log('SwaggerUI loaded:', !!swaggerUi);" || {
  echo "❌ Error in swagger.js file, restoring backup..."
  cp swagger-backup-*.js swagger.js
  exit 1
}

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

echo -e "\n✅ Swagger fix complete!"
echo "📖 Swagger documentation should now be available at: https://api.elapix.store/api-docs"
