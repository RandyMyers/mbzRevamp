#!/bin/bash

echo "🔄 Migrating from MongoDB Atlas to Digital Ocean"
echo "==============================================="

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
print_info "Current Atlas connection string detected:"
echo "mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM"
echo ""

# Step 1: Install MongoDB tools
print_info "Step 1: Installing MongoDB tools..."
apt update -qq
apt install -y -qq mongodb-database-tools

# Step 2: Create backup directory
print_info "Step 2: Creating backup directory..."
mkdir -p /tmp/atlas-migration
cd /tmp/atlas-migration

# Step 3: Export from Atlas
print_info "Step 3: Exporting database from MongoDB Atlas..."
print_warning "This may take a few minutes depending on your database size..."

ATLAS_URL="mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority"

mongodump --uri="$ATLAS_URL" --out=./atlas-export

if [ $? -eq 0 ]; then
    print_success "Database exported successfully from Atlas"
else
    echo "❌ Failed to export from Atlas. Check your connection string and network access."
    exit 1
fi

# Step 4: Check what was exported
print_info "Step 4: Checking exported data..."
ls -la ./atlas-export/
echo ""
echo "Collections exported:"
find ./atlas-export -name "*.bson" | wc -l

# Step 5: Import to local MongoDB
print_info "Step 5: Importing to local MongoDB..."

# Start MongoDB if not running
systemctl start mongod
sleep 2

# Import the data
mongorestore --db="MBZCRM" ./atlas-export/MBZCRM

if [ $? -eq 0 ]; then
    print_success "Database imported successfully to local MongoDB"
else
    echo "❌ Failed to import to local MongoDB"
    exit 1
fi

# Step 6: Update environment variables
print_info "Step 6: Updating environment variables..."

cd /var/www/mbztech

# Backup current .env
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update MONGO_URL to point to local MongoDB
LOCAL_MONGO_URL="mongodb://127.0.0.1:27017/MBZCRM"

# Update .env file
if grep -q "MONGO_URL=" .env; then
    sed -i "s|MONGO_URL=.*|MONGO_URL=$LOCAL_MONGO_URL|" .env
else
    echo "MONGO_URL=$LOCAL_MONGO_URL" >> .env
fi

print_success "Environment variables updated"

# Step 7: Test the connection
print_info "Step 7: Testing database connection..."

node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected to local MongoDB successfully');
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

# Step 8: Restart application
print_info "Step 8: Restarting application..."
pm2 restart mbztech-api

# Wait and check status
sleep 5
pm2 status

# Step 9: Cleanup
print_info "Step 9: Cleaning up..."
rm -rf /tmp/atlas-migration

print_success "Migration completed successfully!"
echo ""
echo "🎉 Your database has been migrated from MongoDB Atlas to Digital Ocean!"
echo ""
echo "📋 What was done:"
echo "  ✅ Exported all data from MongoDB Atlas (MBZCRM database)"
echo "  ✅ Imported data to local MongoDB on Digital Ocean"
echo "  ✅ Updated environment variables"
echo "  ✅ Restarted application"
echo ""
echo "🔍 Test your application now to make sure everything works!"
echo ""
echo "⚠️  Keep your Atlas cluster for a few days as backup"
echo ""
echo "💡 Next steps:"
echo "  1. Test all features of your application"
echo "  2. Verify all data is accessible"
echo "  3. Set up regular backups of your local MongoDB"
echo "  4. Consider deleting the Atlas cluster after confirming everything works"
