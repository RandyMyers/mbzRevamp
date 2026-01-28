#!/bin/bash
# Deploy MBZ Backend to Digital Ocean
# Uses SSH key authentication

set -e  # Exit on any error

echo "======================================"
echo "MBZ Backend - Deploy to Digital Ocean"
echo "======================================"
echo ""

# Digital Ocean server configuration
SERVER="159.203.139.181"
USER="root"

# SSH options for reliable connection
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"

# Server paths
BACKEND_PATH="/var/www/aafn-backend"
PM2_APP_NAME="mbztech-api"

echo "Step 1/2: Creating deployment package..."
echo "======================================"

# Create backend package (excluding unnecessary files)
echo "Packaging backend files..."
tar -czf mbz-backend-deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env.local' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    .

PACKAGE_SIZE=$(du -h mbz-backend-deployment.tar.gz | cut -f1)
echo "✅ Package created: mbz-backend-deployment.tar.gz ($PACKAGE_SIZE)"
echo ""

echo "Step 2/2: Deploying to server..."
echo "======================================"

# Upload package
echo "Uploading package to server..."
scp $SSH_OPTS mbz-backend-deployment.tar.gz $USER@$SERVER:/tmp/

# Deploy on server
echo "Deploying on server..."
ssh $SSH_OPTS $USER@$SERVER << ENDSSH
    cd $BACKEND_PATH

    # Extract new files (overwrites existing)
    echo "Extracting backend files..."
    tar -xzf /tmp/mbz-backend-deployment.tar.gz

    # Install dependencies if package.json changed
    echo "Installing dependencies..."
    npm install --production

    # Restart backend with PM2
    echo "Restarting backend..."
    pm2 restart $PM2_APP_NAME

    pm2 save

    # Cleanup
    rm -f /tmp/mbz-backend-deployment.tar.gz

    echo ""
    echo "✅ Backend deployed!"
    pm2 status
ENDSSH

# Cleanup local package
rm -f mbz-backend-deployment.tar.gz

echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "API is live at: https://api.elapix.store/api"
echo ""
echo "Useful commands:"
echo "  ssh root@$SERVER 'pm2 status'           - Check status"
echo "  ssh root@$SERVER 'pm2 logs $PM2_APP_NAME'  - View logs"
echo "  ssh root@$SERVER 'pm2 restart $PM2_APP_NAME' - Restart"
echo ""
