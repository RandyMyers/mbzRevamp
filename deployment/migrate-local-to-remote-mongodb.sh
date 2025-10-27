#!/bin/bash

echo "📦 Database Migration: Local MongoDB → Remote MongoDB"
echo "======================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if script is run from correct directory
if [ ! -f "app.js" ]; then
    print_error "Please run this script from your project root directory"
    exit 1
fi

echo ""
print_info "This script will migrate your local MongoDB to a remote MongoDB service"
echo ""
print_warning "IMPORTANT: Before starting, make sure you have:"
echo "  1. Created a MongoDB Atlas account (or other remote MongoDB service)"
echo "  2. Created a new cluster/database"
echo "  3. Added your Digital Ocean server IP to the whitelist"
echo "  4. Created a database user with read/write permissions"
echo ""

read -p "Have you completed the above steps? (yes/no): " READY

if [ "$READY" != "yes" ]; then
    echo ""
    print_info "No problem! Follow these steps first:"
    echo ""
    echo "For MongoDB Atlas:"
    echo "1. Go to https://www.mongodb.com/cloud/atlas/register"
    echo "2. Create a free account"
    echo "3. Create a new cluster (Free tier is fine)"
    echo "4. Go to Database Access → Add New Database User"
    echo "5. Go to Network Access → Add IP Address → Add your server IP"
    echo "6. Go to Databases → Connect → Connect your application"
    echo "7. Copy the connection string"
    echo ""
    exit 0
fi

# Step 1: Get the new remote MongoDB connection string
echo ""
print_info "Step 1: Enter your new remote MongoDB connection string"
echo ""
echo "Example formats:"
echo "MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname"
echo "Standard: mongodb://username:password@host:port/dbname"
echo ""

read -p "Enter your NEW remote MongoDB connection string: " NEW_MONGO_URL

if [ -z "$NEW_MONGO_URL" ]; then
    print_error "No connection string provided. Exiting."
    exit 1
fi

# Validate connection string format
if [[ ! "$NEW_MONGO_URL" =~ ^mongodb ]]; then
    print_error "Invalid MongoDB connection string format"
    exit 1
fi

# Step 2: Get current local database name
echo ""
print_info "Step 2: Detecting current local database..."

# Read from .env file
if [ -f ".env" ]; then
    source .env
    CURRENT_DB=$(echo $MONGO_URL | sed 's/.*\///')
    print_success "Found current database: $CURRENT_DB"
else
    print_error "No .env file found"
    exit 1
fi

# Step 3: Verify MongoDB tools are installed
print_info "Step 3: Checking MongoDB tools..."

if ! command -v mongodump &> /dev/null; then
    print_warning "mongodump not found. Installing MongoDB Database Tools..."

    # For Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y mongodb-database-tools
    else
        print_error "Please install MongoDB Database Tools manually"
        echo "Visit: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi
fi

print_success "MongoDB tools are installed"

# Step 4: Create backup directory
echo ""
print_info "Step 4: Creating backup directory..."
BACKUP_DIR="/tmp/mongodb-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_success "Backup directory created: $BACKUP_DIR"

# Step 5: Export from local MongoDB
echo ""
print_info "Step 5: Exporting database from local MongoDB..."
print_warning "This may take a few minutes depending on your database size..."

mongodump --db="$CURRENT_DB" --out="$BACKUP_DIR"

if [ $? -eq 0 ]; then
    print_success "Database exported successfully"

    # Show what was exported
    COLLECTION_COUNT=$(find "$BACKUP_DIR" -name "*.bson" | wc -l)
    print_info "Exported $COLLECTION_COUNT collections"
else
    print_error "Failed to export database"
    exit 1
fi

# Step 6: Test connection to new MongoDB
echo ""
print_info "Step 6: Testing connection to new remote MongoDB..."

node -e "
const mongoose = require('mongoose');

mongoose.connect('$NEW_MONGO_URL', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Successfully connected to new MongoDB!');
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Failed to connect to new MongoDB');
    console.log('Error:', error.message);
    process.exit(1);
  });
" 2>&1

if [ $? -ne 0 ]; then
    print_error "Cannot connect to new MongoDB. Please check:"
    echo "  - Connection string is correct"
    echo "  - Your server IP is whitelisted"
    echo "  - Database user credentials are correct"
    echo "  - Network connectivity"
    exit 1
fi

# Step 7: Import to new MongoDB
echo ""
print_info "Step 7: Importing database to new remote MongoDB..."
print_warning "This may take a few minutes depending on your database size..."

mongorestore --uri="$NEW_MONGO_URL" --nsFrom="${CURRENT_DB}.*" --nsTo="${CURRENT_DB}.*" "$BACKUP_DIR/$CURRENT_DB"

if [ $? -eq 0 ]; then
    print_success "Database imported successfully to new MongoDB"
else
    print_error "Failed to import to new MongoDB"
    print_warning "Your local data is safe. Backup is at: $BACKUP_DIR"
    exit 1
fi

# Step 8: Verify data migration
echo ""
print_info "Step 8: Verifying data migration..."

node -e "
const mongoose = require('mongoose');

mongoose.connect('$NEW_MONGO_URL')
  .then(() => {
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('✅ Collections in new database:');
    collections.forEach(col => console.log('  -', col.name));
    console.log('Total collections:', collections.length);
  })
  .catch((error) => {
    console.log('❌ Verification error:', error.message);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

# Step 9: Backup current .env and update
echo ""
print_info "Step 9: Updating environment variables..."

# Create backup of .env
ENV_BACKUP=".env.backup-$(date +%Y%m%d-%H%M%S)"
cp .env "$ENV_BACKUP"
print_success "Backed up .env to $ENV_BACKUP"

# Update MONGO_URL in .env
if grep -q "MONGO_URL=" .env; then
    # Escape special characters for sed
    ESCAPED_URL=$(echo "$NEW_MONGO_URL" | sed 's/[\/&]/\\&/g')
    sed -i "s|MONGO_URL=.*|MONGO_URL=$ESCAPED_URL|" .env
    print_success "Updated MONGO_URL in .env"
else
    echo "MONGO_URL=$NEW_MONGO_URL" >> .env
    print_success "Added MONGO_URL to .env"
fi

# Step 10: Test application connection
echo ""
print_info "Step 10: Testing application with new database..."

node -e "
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing with MONGO_URL from .env...');
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Application can connect to new database');
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('📊 Accessible collections:', collections.length);
  })
  .catch((error) => {
    console.log('❌ Application connection error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

if [ $? -ne 0 ]; then
    print_error "Application cannot connect to new database"
    print_warning "Restoring old .env file..."
    cp "$ENV_BACKUP" .env
    print_info "Old configuration restored"
    exit 1
fi

# Step 11: Restart application
echo ""
print_info "Step 11: Restarting application..."

# Check if using PM2
if command -v pm2 &> /dev/null; then
    pm2 restart all
    sleep 3
    pm2 status
else
    print_warning "PM2 not found. Please restart your application manually"
fi

# Step 12: Final verification
echo ""
print_info "Step 12: Final health check..."
sleep 5

# Check if app is running
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist)
    if echo "$PM2_STATUS" | grep -q '"status":"online"'; then
        print_success "Application is running"
    else
        print_error "Application may have issues. Check logs: pm2 logs"
    fi
fi

# Step 13: Summary
echo ""
echo "════════════════════════════════════════════════════════"
print_success "Migration completed successfully!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Migration Summary:"
echo "  ✅ Exported data from local MongoDB"
echo "  ✅ Imported data to remote MongoDB"
echo "  ✅ Updated environment variables"
echo "  ✅ Tested connections"
echo "  ✅ Restarted application"
echo ""
echo "📁 Backups created:"
echo "  - Database backup: $BACKUP_DIR"
echo "  - .env backup: $ENV_BACKUP"
echo ""
echo "🔍 Next steps:"
echo "  1. Test your application thoroughly"
echo "  2. Verify all features work correctly"
echo "  3. Check API endpoints"
echo "  4. Monitor application logs: pm2 logs"
echo ""
echo "⚠️  Important notes:"
echo "  - Keep the local MongoDB running for a few days as backup"
echo "  - Once confident, you can stop local MongoDB: sudo systemctl stop mongod"
echo "  - Keep your backups until you're sure everything works"
echo ""
echo "🗑️  To clean up backup later:"
echo "  rm -rf $BACKUP_DIR"
echo ""
print_success "Your application is now using the remote MongoDB! 🎉"
echo ""
