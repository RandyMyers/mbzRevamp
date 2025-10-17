#!/bin/bash

echo "🚀 Deploying latest changes to MBZ Tech API server..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. 📥 Pulling latest changes from GitHub..."
git fetch origin
git pull origin omale

echo "2. 📦 Installing any new dependencies..."
npm install --production

echo "3. ⏹️  Stopping current server..."
pm2 stop mbztech-api || echo "No PM2 process found"

echo "4. 🚀 Starting server with latest changes..."
pm2 start app.js --name mbztech-api

echo "5. ⏳ Waiting for server to start..."
sleep 5

echo "6. 🧪 Testing endpoints..."

echo "Testing health endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\nTesting user creation endpoint (should now have auth middleware)..."
curl -s -I https://api.elapix.store/api/users/create | head -1

echo -e "\n✅ Deployment complete!"
echo "📖 Latest changes should now be live at: https://api.elapix.store"
