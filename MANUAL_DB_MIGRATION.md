# Manual Database Migration: Render → Digital Ocean

## Overview
This guide shows you how to manually export your database from Render and import it to Digital Ocean.

## Prerequisites
- Your Render MongoDB connection string
- Access to your Digital Ocean server
- MongoDB tools installed

## Step-by-Step Process

### Step 1: Get Your Render Connection String
1. Go to your Render dashboard
2. Find your MongoDB service
3. Copy the connection string (looks like: `mongodb://user:password@host:port/database`)

### Step 2: Install MongoDB Tools on Digital Ocean
```bash
# SSH into your Digital Ocean server
ssh root@your-server-ip

# Update package list
apt update

# Install MongoDB tools
apt install -y mongodb-database-tools
```

### Step 3: Export from Render
```bash
# Create a directory for the export
mkdir -p /tmp/db-export
cd /tmp/db-export

# Export the database (replace with your actual connection string)
mongodump --uri="mongodb://user:password@host:port/database" --out=./render-backup
```

### Step 4: Check What Was Exported
```bash
# List the exported files
ls -la ./render-backup/

# See what collections were exported
find ./render-backup -name "*.bson" | head -10
```

### Step 5: Import to Local MongoDB
```bash
# Make sure MongoDB is running
systemctl start mongod

# Import the data (replace 'your-database-name' with actual name)
mongorestore --db="your-database-name" ./render-backup/your-database-name
```

### Step 6: Update Environment Variables
```bash
# Navigate to your app directory
cd /var/www/mbztech

# Backup your current .env file
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update the MONGO_URL in .env file
# Replace the old Render URL with local MongoDB URL
sed -i 's|MONGO_URL=.*|MONGO_URL=mongodb://127.0.0.1:27017/your-database-name|' .env

# Verify the change
grep MONGO_URL .env
```

### Step 7: Test the Connection
```bash
# Test the database connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected successfully');
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('Collections:', collections.map(c => c.name));
  })
  .catch(console.error)
  .finally(() => mongoose.disconnect());
"
```

### Step 8: Restart Your Application
```bash
# Restart the application
pm2 restart mbztech-api

# Check status
pm2 status

# Check logs
pm2 logs mbztech-api --lines 20
```

### Step 9: Clean Up
```bash
# Remove temporary files
rm -rf /tmp/db-export
```

## Alternative: Using the Automated Script

Instead of doing it manually, you can use the automated script:

```bash
# Make it executable
chmod +x deployment/simple-db-export-import.sh

# Run the script
./deployment/simple-db-export-import.sh
```

The script will:
- Ask for your Render connection string
- Export the database
- Import to local MongoDB
- Update environment variables
- Restart the application
- Clean up temporary files

## Troubleshooting

### Common Issues:

1. **Connection failed to Render:**
   - Check your connection string
   - Ensure your Digital Ocean IP is whitelisted in Render
   - Verify the database is accessible

2. **Import failed:**
   - Make sure MongoDB is running: `systemctl start mongod`
   - Check disk space: `df -h`
   - Verify the database name is correct

3. **Application won't start:**
   - Check the .env file: `grep MONGO_URL .env`
   - Check application logs: `pm2 logs mbztech-api`
   - Test connection manually

### Useful Commands:

```bash
# Check MongoDB status
systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Check disk space
df -h

# Check application logs
pm2 logs mbztech-api --lines 50

# Test MongoDB connection
mongosh --eval "db.adminCommand('ping')"
```

## Verification

After migration, verify everything works:

1. **Check collections:**
   ```bash
   mongosh --eval "use your-database-name; db.getCollectionNames()"
   ```

2. **Test your application:**
   - Login to your app
   - Check if data loads correctly
   - Test all major features

3. **Check application logs:**
   ```bash
   pm2 logs mbztech-api --lines 20
   ```

## Backup Strategy

After successful migration:

1. **Keep Render database** for a few days as backup
2. **Set up regular backups** of your local MongoDB:
   ```bash
   # Create backup script
   echo '#!/bin/bash
   mongodump --db=your-database-name --out=/backup/mongodb-$(date +%Y%m%d-%H%M%S)' > /usr/local/bin/backup-mongodb.sh
   chmod +x /usr/local/bin/backup-mongodb.sh
   ```

3. **Schedule regular backups:**
   ```bash
   # Add to crontab (daily backup at 2 AM)
   echo "0 2 * * * /usr/local/bin/backup-mongodb.sh" | crontab -
   ```

## Success!

Once everything is working:
- ✅ Your data is now on Digital Ocean
- ✅ Your application is running locally
- ✅ You have full control over your database
- ✅ No more dependency on Render for database
