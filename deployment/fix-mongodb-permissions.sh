#!/bin/bash

echo "🔧 Fixing MongoDB authorization issue..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking MongoDB connection and current user..."
echo "Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    return mongoose.connection.db.admin().currentOp();
  })
  .then((result) => {
    console.log('Current operation info:', result);
  })
  .catch((error) => {
    console.log('❌ MongoDB connection error:', error.message);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

echo -e "\n2. Checking MongoDB service status..."
systemctl status mongod | head -10

echo -e "\n3. Checking MongoDB logs for authorization errors..."
tail -20 /var/log/mongodb/mongod.log | grep -i "auth\|permission\|unauthorized" || echo "No auth errors in recent logs"

echo -e "\n4. The issue is likely that the MongoDB user doesn't have proper permissions"
echo "Let's check what user is being used in the connection string..."

# Extract the connection details from the environment
echo "Checking MONGO_URL environment variable..."
if [ -f ".env" ]; then
    echo "MONGO_URL from .env:"
    grep MONGO_URL .env | sed 's/MONGO_URL=.*@/MONGO_URL=***@/' || echo "MONGO_URL not found in .env"
else
    echo "No .env file found"
fi

echo -e "\n5. Common solutions for MongoDB authorization issues:"

echo "Option 1: Check if MongoDB user has proper roles"
echo "You need to connect to MongoDB and grant proper permissions:"
echo ""
echo "Connect to MongoDB:"
echo "mongo"
echo ""
echo "Then run these commands:"
echo "use mbztech"
echo "db.createUser({"
echo "  user: 'your_username',"
echo "  pwd: 'your_password',"
echo "  roles: ["
echo "    { role: 'readWrite', db: 'mbztech' },"
echo "    { role: 'dbAdmin', db: 'mbztech' }"
echo "  ]"
echo "})"
echo ""

echo "Option 2: If using MongoDB without authentication, check if auth is disabled"
echo "Check MongoDB config:"
echo "cat /etc/mongod.conf | grep -A 5 -B 5 auth"

echo -e "\n6. Let's check the current MongoDB configuration..."
if [ -f "/etc/mongod.conf" ]; then
    echo "MongoDB configuration:"
    grep -A 5 -B 5 "security\|auth" /etc/mongod.conf || echo "No security/auth section found"
else
    echo "MongoDB config file not found at /etc/mongod.conf"
fi

echo -e "\n7. Quick test to see if we can connect to MongoDB directly..."
echo "Testing direct MongoDB connection..."
mongo --eval "db.runCommand({connectionStatus: 1})" 2>/dev/null || echo "Direct mongo connection failed"

echo -e "\n8. Checking if there are any MongoDB users configured..."
mongo --eval "db.getUsers()" mbztech 2>/dev/null || echo "Could not get users (might need authentication)"

echo -e "\n✅ MongoDB permissions check complete!"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Check your MONGO_URL connection string in .env file"
echo "2. Ensure the MongoDB user has 'readWrite' and 'dbAdmin' roles on 'mbztech' database"
echo "3. If using authentication, make sure the credentials are correct"
echo "4. If not using authentication, ensure MongoDB is configured to allow unauthenticated access"
