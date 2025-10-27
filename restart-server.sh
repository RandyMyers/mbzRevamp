#!/bin/bash

# 🚀 Server Restart Script
# This script restarts the server to pick up the latest code changes

echo "🔄 Restarting server to apply latest changes..."

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "📦 PM2 detected - restarting PM2 processes..."
    pm2 restart all
    pm2 status
    echo "✅ PM2 processes restarted"
else
    echo "⚠️ PM2 not found - manual restart required"
    echo "Please restart your server manually to apply the latest changes"
fi

echo "🎉 Server restart completed!"
echo "The latest invitation fixes should now be active"




