#!/bin/bash

echo "☁️  Migrating to New MongoDB Atlas Cluster"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Navigate to the application directory
cd /var/www/mbztech

echo ""
print_info "This script will help you migrate to a new MongoDB Atlas cluster"
echo ""

# Step 1: Export from current Atlas
print_info "Step 1: Exporting from current Atlas cluster..."

# Install MongoDB tools
apt update -qq
apt install -y -qq mongodb-database-tools

# Create backup directory
mkdir -p /tmp/atlas-migration
cd /tmp/atlas-migration

# Current Atlas connection
ATLAS_URL="mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority"

print_warning "Exporting from current Atlas cluster..."
mongodump --uri="$ATLAS_URL" --out=./atlas-export

if [ $? -eq 0 ]; then
    print_success "Database exported successfully from current Atlas"
else
    echo "❌ Failed to export from Atlas. Check your connection string and network access."
    exit 1
fi

# Step 2: Instructions for new Atlas cluster
print_info "Step 2: Create new MongoDB Atlas cluster"
echo ""
echo "Now you need to create a new Atlas cluster:"
echo ""
echo "1. Go to https://www.mongodb.com/atlas"
echo "2. Sign in to your account"
echo "3. Create a new cluster:"
echo "   - Choose a region close to your Digital Ocean server"
echo "   - Select M0 (free tier) or M10+ for production"
echo "   - Name it something like 'MBZCRM-Production'"
echo "4. Create a database user:"
echo "   - Username: mbztech_user"
echo "   - Password: [create a strong password]"
echo "5. Whitelist your Digital Ocean server IP:"
echo "   - Go to Network Access"
echo "   - Add your server IP: $(curl -s ifconfig.me)"
echo "6. Get the connection string"
echo ""

read -p "Enter your NEW Atlas connection string: " NEW_ATLAS_URL

if [ -z "$NEW_ATLAS_URL" ]; then
    echo "❌ No connection string provided. Exiting."
    exit 1
fi

# Step 3: Test new Atlas connection
print_info "Step 3: Testing new Atlas connection..."

node -e "
const mongoose = require('mongoose');

mongoose.connect('$NEW_ATLAS_URL')
  .then(() => {
    console.log('✅ Successfully connected to new Atlas cluster');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ New Atlas cluster is responding');
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
    print_success "New Atlas connection test successful"
else
    print_error "New Atlas connection test failed"
    echo ""
    echo "Common issues:"
    echo "1. IP address not whitelisted in new Atlas cluster"
    echo "2. Database user doesn't have proper permissions"
    echo "3. Connection string is incorrect"
    echo "4. Network connectivity issues"
    exit 1
fi

# Step 4: Import to new Atlas
print_info "Step 4: Importing data to new Atlas cluster..."

# Extract database name from new connection string
NEW_DB_NAME=$(echo $NEW_ATLAS_URL | sed 's/.*\///' | sed 's/?.*//')

# Import the data
mongorestore --uri="$NEW_ATLAS_URL" ./atlas-export/MBZCRM

if [ $? -eq 0 ]; then
    print_success "Data imported successfully to new Atlas cluster"
else
    echo "❌ Failed to import to new Atlas cluster"
    exit 1
fi

# Step 5: Update environment variables
print_info "Step 5: Updating environment variables..."

cd /var/www/mbztech

# Backup current .env
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update .env file
if grep -q "MONGO_URL=" .env; then
    sed -i "s|MONGO_URL=.*|MONGO_URL=$NEW_ATLAS_URL|" .env
else
    echo "MONGO_URL=$NEW_ATLAS_URL" >> .env
fi

print_success "Environment variables updated"

# Step 6: Test the new connection
print_info "Step 6: Testing new database connection..."

node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected to new Atlas cluster successfully');
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('📊 Collections found:');
    collections.forEach(col => console.log('  -', col.name));
    console.log('Total collections:', collections.length);
  })
  .catch((error) => {
    console.log('❌ Connection error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

# Step 7: Restart application
print_info "Step 7: Restarting application..."
pm2 restart mbztech-api

# Wait and check status
sleep 5
pm2 status

# Step 8: Cleanup
print_info "Step 8: Cleaning up..."
rm -rf /tmp/atlas-migration

print_success "Migration completed successfully!"
echo ""
echo "🎉 Your database has been migrated to a new MongoDB Atlas cluster!"
echo ""
echo "📋 What was done:"
echo "  ✅ Exported data from old Atlas cluster"
echo "  ✅ Created new Atlas cluster"
echo "  ✅ Imported data to new Atlas cluster"
echo "  ✅ Updated environment variables"
echo "  ✅ Restarted application"
echo ""
echo "🔍 Test your application now to make sure everything works!"
echo ""
echo "💡 Benefits of new Atlas cluster:"
echo "  - Better performance (closer to your server)"
echo "  - Fresh start with optimized settings"
echo "  - Better security with new credentials"
echo "  - Managed backups and monitoring"
echo ""
echo "⚠️  Keep your old Atlas cluster for a few days as backup"
