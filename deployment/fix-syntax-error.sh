#!/bin/bash

echo "🔧 Fixing syntax error in app.js..."

# Navigate to the application directory
cd /var/www/mbztech

# Find the most recent backup
echo "🔍 Finding backup files..."
ls -la app-backup-*.js 2>/dev/null || echo "No backup files found"

# Restore from backup
echo "📝 Restoring from backup..."
if ls app-backup-*.js 1> /dev/null 2>&1; then
    LATEST_BACKUP=$(ls -t app-backup-*.js | head -1)
    echo "Restoring from: $LATEST_BACKUP"
    cp "$LATEST_BACKUP" app.js
    echo "✅ Restored from backup"
else
    echo "❌ No backup found, need to restore manually"
    exit 1
fi

# Test the restored app.js
echo "🧪 Testing restored app.js..."
node -c app.js && echo "✅ app.js syntax is valid" || echo "❌ app.js still has syntax errors"

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

echo -e "\n✅ Syntax error fix complete!"
