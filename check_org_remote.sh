#!/bin/bash
# Check organization subscription status on production server

set -e

ORG_ID="689e0abff0773bdf70c3d41f"
SERVER="159.203.139.181"
USER="root"
BACKEND_PATH="/var/www/mbztech"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"

echo "======================================"
echo "Checking Organization Subscription"
echo "======================================"
echo "Organization ID: $ORG_ID"
echo ""

echo "Step 1: Deploying debug script..."
git add -A
git commit -m "Add organization subscription debug script" --allow-empty
git push origin omale

echo ""
echo "Step 2: Running check on server..."
ssh $SSH_OPTS $USER@$SERVER << ENDSSH
cd $BACKEND_PATH

echo "Pulling latest changes..."
git pull origin omale

echo ""
echo "Running organization check..."
node scripts/checkOrgSubscription.js $ORG_ID

ENDSSH

echo ""
echo "======================================"
echo "Check Complete!"
echo "======================================"
