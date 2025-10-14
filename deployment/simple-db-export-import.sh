#!/bin/bash

echo "📦 Simple Database Export/Import: Render → Digital Ocean"
echo "======================================================"

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
print_info "This script will export your database from Render and import it to Digital Ocean"
echo ""

# Step 1: Get Render connection details
print_info "Step 1: Get your Render MongoDB connection string"
echo ""
echo "Go to your Render dashboard → MongoDB service → Copy connection string"
echo "It looks like: mongodb://user:password@host:port/database"
echo ""

read -p "Enter your Render MongoDB connection string: " RENDER_MONGO_URL

if [ -z "$RENDER_MONGO_URL" ]; then
    echo "❌ No connection string provided. Exiting."
    exit 1
fi

# Step 2: Install MongoDB tools
print_info "Step 2: Installing MongoDB tools..."
apt update -qq
apt install -y -qq mongodb-database-tools

# Step 3: Create backup directory
print_info "Step 3: Creating backup directory..."
mkdir -p /tmp/db-migration
cd /tmp/db-migration

# Step 4: Export from Render
print_info "Step 4: Exporting database from Render..."
print_warning "This may take a few minutes depending on your database size..."

mongodump --uri="$RENDER_MONGO_URL" --out=./render-export

if [ $? -eq 0 ]; then
    print_success "Database exported successfully from Render"
else
    echo "❌ Failed to export from Render. Check your connection string."
    exit 1
fi

# Step 5: Check what was exported
print_info "Step 5: Checking exported data..."
ls -la ./render-export/
echo ""
echo "Collections exported:"
find ./render-export -name "*.bson" | wc -l

# Step 6: Import to local MongoDB
print_info "Step 6: Importing to local MongoDB..."

# Extract database name from connection string
DB_NAME=$(echo $RENDER_MONGO_URL | sed 's/.*\///' | sed 's/?.*//')
echo "Database name: $DB_NAME"

# Start MongoDB if not running
systemctl start mongod
sleep 2

# Import the data
mongorestore --db="$DB_NAME" ./render-export/$DB_NAME

if [ $? -eq 0 ]; then
    print_success "Database imported successfully to local MongoDB"
else
    echo "❌ Failed to import to local MongoDB"
    exit 1
fi

# Step 7: Update environment variables
print_info "Step 7: Updating environment variables..."

cd /var/www/mbztech

# Backup current .env
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update MONGO_URL to point to local MongoDB
LOCAL_MONGO_URL="mongodb://127.0.0.1:27017/$DB_NAME"

# Update .env file
if grep -q "MONGO_URL=" .env; then
    sed -i "s|MONGO_URL=.*|MONGO_URL=$LOCAL_MONGO_URL|" .env
else
    echo "MONGO_URL=$LOCAL_MONGO_URL" >> .env
fi

print_success "Environment variables updated"

# Step 8: Test the connection
print_info "Step 8: Testing database connection..."

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

# Step 9: Restart application
print_info "Step 9: Restarting application..."
pm2 restart mbztech-api

# Wait and check status
sleep 5
pm2 status

# Step 10: Cleanup
print_info "Step 10: Cleaning up..."
rm -rf /tmp/db-migration

print_success "Migration completed successfully!"
echo ""
echo "🎉 Your database has been migrated from Render to Digital Ocean!"
echo ""
echo "📋 What was done:"
echo "  ✅ Exported all data from Render MongoDB"
echo "  ✅ Imported data to local MongoDB on Digital Ocean"
echo "  ✅ Updated environment variables"
echo "  ✅ Restarted application"
echo ""
echo "🔍 Test your application now to make sure everything works!"
echo ""
echo "⚠️  Keep your Render database for a few days as backup"
