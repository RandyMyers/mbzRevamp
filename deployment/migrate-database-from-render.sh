#!/bin/bash

echo "🔄 Database Migration from Render to Digital Ocean"
echo "================================================="

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
print_info "This script will help you migrate your MongoDB database from Render to Digital Ocean"
echo ""

# Step 1: Get Render database connection details
print_info "Step 1: Get your Render database connection details"
echo ""
echo "You need to get your Render MongoDB connection string:"
echo "1. Go to your Render dashboard"
echo "2. Find your MongoDB service"
echo "3. Copy the connection string (it looks like: mongodb://user:password@host:port/database)"
echo ""

read -p "Enter your Render MongoDB connection string: " RENDER_MONGO_URL

if [ -z "$RENDER_MONGO_URL" ]; then
    print_error "No connection string provided. Exiting."
    exit 1
fi

# Step 2: Install MongoDB tools if not already installed
print_info "Step 2: Installing MongoDB tools..."
apt update -qq
apt install -y -qq mongodb-database-tools

# Step 3: Create backup directory
print_info "Step 3: Creating backup directory..."
mkdir -p /tmp/mongodb-migration
cd /tmp/mongodb-migration

# Step 4: Export data from Render
print_info "Step 4: Exporting data from Render MongoDB..."
print_warning "This may take a while depending on your database size..."

# Extract database name from connection string
DB_NAME=$(echo $RENDER_MONGO_URL | sed 's/.*\///' | sed 's/?.*//')

echo "Database name: $DB_NAME"

# Export all collections
mongodump --uri="$RENDER_MONGO_URL" --out=./render-backup

if [ $? -eq 0 ]; then
    print_success "Data exported successfully from Render"
else
    print_error "Failed to export data from Render"
    exit 1
fi

# Step 5: Check local MongoDB connection
print_info "Step 5: Checking local MongoDB connection..."

# Test local MongoDB connection
mongosh --eval "db.adminCommand('ping')" --quiet

if [ $? -eq 0 ]; then
    print_success "Local MongoDB is running"
else
    print_error "Local MongoDB is not running. Please start it first:"
    echo "sudo systemctl start mongod"
    exit 1
fi

# Step 6: Import data to local MongoDB
print_info "Step 6: Importing data to local MongoDB..."

# Create the database if it doesn't exist
mongosh --eval "use $DB_NAME" --quiet

# Import all collections
mongorestore --db="$DB_NAME" ./render-backup/$DB_NAME

if [ $? -eq 0 ]; then
    print_success "Data imported successfully to local MongoDB"
else
    print_error "Failed to import data to local MongoDB"
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

# Step 8: Test the new connection
print_info "Step 8: Testing the new database connection..."

node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Successfully connected to local MongoDB');
    return mongoose.connection.db.admin().listCollections().toArray();
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

if [ $? -eq 0 ]; then
    print_success "Database connection test successful"
else
    print_error "Database connection test failed"
    exit 1
fi

# Step 9: Restart the application
print_info "Step 9: Restarting the application..."
pm2 restart mbztech-api

# Wait for restart
sleep 5

# Check application status
pm2 status

print_success "Application restarted with new database"

# Step 10: Cleanup
print_info "Step 10: Cleaning up temporary files..."
rm -rf /tmp/mongodb-migration

print_success "Migration completed successfully!"
echo ""
echo "🎉 Your database has been migrated from Render to Digital Ocean!"
echo ""
echo "📋 Summary:"
echo "  - Data exported from Render MongoDB"
echo "  - Data imported to local MongoDB"
echo "  - Environment variables updated"
echo "  - Application restarted"
echo ""
echo "🔍 Next steps:"
echo "  1. Test your application thoroughly"
echo "  2. Verify all data is accessible"
echo "  3. Update your Render MongoDB service to read-only (optional)"
echo "  4. Consider setting up MongoDB backups on Digital Ocean"
echo ""
echo "⚠️  Important: Keep your Render database for a few days as backup"
echo "   until you're confident everything is working correctly."
