#!/bin/bash
# Deploy MBZ Backend to Digital Ocean
# Simple git pull and PM2 restart

set -e

echo "======================================"
echo "MBZ Backend - Deploy to Digital Ocean"
echo "======================================"
echo ""

# Server configuration
SERVER="159.203.139.181"
USER="root"
BACKEND_PATH="/var/www/mbztech"
PM2_APP_NAME="mbztech-api"

# SSH options
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"

echo "Step 1: Pushing local changes..."
git add -A
git commit -m "Deploy update" --allow-empty
git push origin omale

echo ""
echo "Step 2: Deploying on server..."
ssh $SSH_OPTS $USER@$SERVER << 'ENDSSH'
cd /var/www/mbztech

echo "Pulling latest changes..."
git pull origin omale

echo "Installing dependencies..."
npm install --production

echo "Restarting PM2..."
pm2 restart mbztech-api

echo "Checking status..."
pm2 status

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "API is live at: https://api.elapix.store/api"
echo ""
echo "Useful commands:"
echo "  ssh root@$SERVER 'pm2 status'              - Check status"
echo "  ssh root@$SERVER 'pm2 logs $PM2_APP_NAME'  - View logs"
echo "  ssh root@$SERVER 'pm2 restart $PM2_APP_NAME' - Restart"
echo ""
