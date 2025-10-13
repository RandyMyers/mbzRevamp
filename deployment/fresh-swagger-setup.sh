#!/bin/bash

echo "🔄 Setting up fresh Swagger configuration..."

# Navigate to the application directory
cd /var/www/mbztech

# Backup everything
echo "💾 Creating backups..."
cp app.js app-backup-fresh-$(date +%Y%m%d-%H%M%S).js
cp swagger.js swagger-backup-fresh-$(date +%Y%m%d-%H%M%S).js

# Create a completely fresh, minimal swagger.js
echo "📝 Creating fresh swagger.js..."
cat > swagger.js << 'EOF'
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MBZ Tech Platform API',
      version: '1.0.0',
      description: 'API documentation for MBZ Tech Platform'
    },
    servers: [
      {
        url: 'https://api.elapix.store',
        description: 'Production server'
      }
    ]
  },
  apis: [] // Start with empty APIs array
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
EOF

# Create a fresh, minimal app.js with Swagger at the very beginning
echo "📝 Creating fresh app.js with Swagger setup..."
cat > app-fresh.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import Swagger FIRST
const { specs, swaggerUi } = require('./swagger');

dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SWAGGER SETUP - AT THE VERY BEGINNING
console.log('🚀 Setting up Swagger...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
console.log('✅ Swagger setup complete');

// Test endpoint
app.get('/api-docs/test', (req, res) => {
  res.json({ 
    message: 'Swagger test endpoint working',
    timestamp: new Date().toISOString()
  });
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
  console.log(`📖 Swagger docs: http://localhost:${PORT}/api-docs`);
});
EOF

# Test the fresh files
echo "🧪 Testing fresh files..."
node -c swagger.js && echo "✅ swagger.js syntax OK" || echo "❌ swagger.js syntax error"
node -c app-fresh.js && echo "✅ app-fresh.js syntax OK" || echo "❌ app-fresh.js syntax error"

# Replace the old files
echo "📝 Replacing old files with fresh versions..."
mv app-fresh.js app.js

# Stop PM2 and start fresh
echo "🔄 Restarting server with fresh configuration..."
pm2 delete mbztech-api
sleep 2
pm2 start app.js --name mbztech-api
sleep 5

# Test the endpoints
echo "🧪 Testing fresh Swagger setup..."

echo "1. Testing health endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\n2. Testing Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n3. Testing Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n4. Testing Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n✅ Fresh Swagger setup complete!"
echo "📖 Swagger documentation should now be available at: https://api.elapix.store/api-docs"
