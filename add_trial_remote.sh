#!/bin/bash
# Add trial subscription to organization on production server

set -e

ORG_ID="689e0abff0773bdf70c3d41f"
SERVER="159.203.139.181"
USER="root"
BACKEND_PATH="/var/www/mbztech"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"

echo "======================================"
echo "Adding Trial to Organization"
echo "======================================"
echo "Organization ID: $ORG_ID"
echo ""

echo "Step 1: Deploying latest code to server..."
git add -A
git commit -m "Add trial subscription script" --allow-empty
git push origin omale

echo ""
echo "Step 2: Running trial script on server..."
ssh $SSH_OPTS $USER@$SERVER << ENDSSH
cd $BACKEND_PATH

echo "Pulling latest changes..."
git pull origin omale

echo "Running trial subscription script..."
node scripts/addTrialToOrganization.js $ORG_ID

echo ""
echo "✅ Trial added successfully!"
ENDSSH

echo ""
echo "======================================"
echo "🎉 Trial Subscription Added!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Refresh your browser (Cmd+Shift+R)"
echo "  2. Log in as any user in the organization"
echo "  3. Try accessing premium features (Stores, Orders, Marketing, etc.)"
echo ""
