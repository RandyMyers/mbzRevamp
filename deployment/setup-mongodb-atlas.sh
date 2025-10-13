#!/bin/bash

echo "☁️  Setting up MongoDB Atlas (Cloud Database)"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to the application directory
cd /var/www/mbztech

echo ""
print_info "This script will help you set up MongoDB Atlas as your cloud database"
echo ""

print_info "Step 1: Create MongoDB Atlas account and cluster"
echo ""
echo "1. Go to https://www.mongodb.com/atlas"
echo "2. Sign up for a free account (if you don't have one)"
echo "3. Create a new cluster (free tier available)"
echo "4. Choose a region close to your Digital Ocean server"
echo "5. Create a database user with read/write permissions"
echo "6. Whitelist your Digital Ocean server IP address"
echo "7. Get your connection string"
echo ""

read -p "Enter your MongoDB Atlas connection string: " ATLAS_MONGO_URL

if [ -z "$ATLAS_MONGO_URL" ]; then
    print_error "No connection string provided. Exiting."
    exit 1
fi

# Step 2: Test the Atlas connection
print_info "Step 2: Testing MongoDB Atlas connection..."

node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('$ATLAS_MONGO_URL')
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ Atlas cluster is responding');
  })
  .catch((error) => {
    console.log('❌ Connection error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

if [ $? -eq 0 ]; then
    print_success "MongoDB Atlas connection test successful"
else
    print_error "MongoDB Atlas connection test failed"
    echo ""
    echo "Common issues:"
    echo "1. IP address not whitelisted in Atlas"
    echo "2. Database user doesn't have proper permissions"
    echo "3. Connection string is incorrect"
    echo "4. Network connectivity issues"
    exit 1
fi

# Step 3: Update environment variables
print_info "Step 3: Updating environment variables..."

# Backup current .env
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update .env file
if grep -q "MONGO_URL=" .env; then
    sed -i "s|MONGO_URL=.*|MONGO_URL=$ATLAS_MONGO_URL|" .env
else
    echo "MONGO_URL=$ATLAS_MONGO_URL" >> .env
fi

print_success "Environment variables updated"

# Step 4: Restart the application
print_info "Step 4: Restarting the application..."
pm2 restart mbztech-api

# Wait for restart
sleep 5

# Check application status
pm2 status

print_success "Application restarted with MongoDB Atlas"

echo ""
print_success "MongoDB Atlas setup completed successfully!"
echo ""
echo "🎉 Your application is now using MongoDB Atlas!"
echo ""
echo "📋 Summary:"
echo "  - MongoDB Atlas connection configured"
echo "  - Environment variables updated"
echo "  - Application restarted"
echo ""
echo "🔍 Next steps:"
echo "  1. Test your application thoroughly"
echo "  2. Create some test data to verify everything works"
echo "  3. Set up MongoDB Atlas backups (automatic with Atlas)"
echo "  4. Monitor your Atlas cluster usage"
echo ""
echo "💡 Benefits of MongoDB Atlas:"
echo "  - Managed database service"
echo "  - Automatic backups"
echo "  - Built-in monitoring"
echo "  - Easy scaling"
echo "  - Global clusters available"
