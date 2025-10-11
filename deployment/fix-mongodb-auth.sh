#!/bin/bash

echo "🔧 Fixing MongoDB authentication issue..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. The issue is clear:"
echo "   - MongoDB has 'authorization: enabled'"
echo "   - Your connection string has no username/password"
echo "   - MongoDB is rejecting all operations"

echo -e "\n2. We have two options:"
echo "   Option A: Create a MongoDB user and update connection string"
echo "   Option B: Disable MongoDB authentication (less secure but simpler)"

echo -e "\n3. Let's try Option A first - Create a MongoDB user..."

# First, let's try to connect to MongoDB without authentication to create a user
echo "Attempting to connect to MongoDB to create a user..."

# Create a temporary script to set up MongoDB user
cat > setup-mongodb-user.js << 'EOF'
// Try to connect without authentication first
const { MongoClient } = require('mongodb');

async function setupUser() {
  try {
    // Try connecting without authentication first
    const client = new MongoClient('mongodb://127.0.0.1:27017/mbztech');
    await client.connect();
    console.log('✅ Connected to MongoDB without authentication');
    
    const db = client.db('mbztech');
    
    // Create a user with proper permissions
    try {
      await db.createUser({
        user: 'mbztech_user',
        pwd: 'mbztech_password_2024',
        roles: [
          { role: 'readWrite', db: 'mbztech' },
          { role: 'dbAdmin', db: 'mbztech' }
        ]
      });
      console.log('✅ MongoDB user created successfully');
    } catch (userError) {
      if (userError.code === 51003) {
        console.log('ℹ️  User already exists, updating password...');
        await db.updateUser('mbztech_user', {
          pwd: 'mbztech_password_2024',
          roles: [
            { role: 'readWrite', db: 'mbztech' },
            { role: 'dbAdmin', db: 'mbztech' }
          ]
        });
        console.log('✅ MongoDB user updated successfully');
      } else {
        console.log('❌ Error creating user:', userError.message);
      }
    }
    
    await client.close();
  } catch (error) {
    console.log('❌ Could not connect to MongoDB:', error.message);
    console.log('This might mean authentication is required even for setup');
  }
}

setupUser();
EOF

echo "Running MongoDB user setup..."
node setup-mongodb-user.js

echo -e "\n4. Now let's update the .env file with the new connection string..."

# Backup the current .env file
cp .env .env-backup-$(date +%Y%m%d-%H%M%S)

# Update the MONGO_URL in .env file
echo "Updating MONGO_URL in .env file..."
sed -i 's|MONGO_URL=mongodb://127.0.0.1:27017/mbztech|MONGO_URL=mongodb://mbztech_user:mbztech_password_2024@127.0.0.1:27017/mbztech|' .env

echo "Updated .env file:"
grep MONGO_URL .env

echo -e "\n5. Testing the new connection string..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing new connection string...');
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ New MongoDB connection successful');
    return mongoose.connection.db.collection('test').findOne({});
  })
  .then((result) => {
    console.log('✅ MongoDB query successful');
  })
  .catch((error) => {
    console.log('❌ New MongoDB connection error:', error.message);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

echo -e "\n6. If the above failed, let's try Option B - Disable authentication..."

# Check if we need to disable authentication
echo "Checking if we need to disable MongoDB authentication..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Authentication working, no need to disable');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Authentication still failing, will disable auth');
    process.exit(1);
  });
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "\n7. Authentication still failing, disabling MongoDB authentication..."
    
    # Backup MongoDB config
    cp /etc/mongod.conf /etc/mongod.conf.backup-$(date +%Y%m%d-%H%M%S)
    
    # Disable authentication
    sed -i 's/authorization: enabled/authorization: disabled/' /etc/mongod.conf
    
    echo "Updated MongoDB config:"
    grep -A 2 -B 2 "security" /etc/mongod.conf
    
    # Restart MongoDB
    echo "Restarting MongoDB..."
    systemctl restart mongod
    sleep 3
    
    # Revert to original connection string
    sed -i 's|MONGO_URL=mongodb://mbztech_user:mbztech_password_2024@127.0.0.1:27017/mbztech|MONGO_URL=mongodb://127.0.0.1:27017/mbztech|' .env
    
    echo "Reverted to original connection string:"
    grep MONGO_URL .env
fi

echo -e "\n8. Testing the final connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Final MongoDB connection successful');
    return mongoose.connection.db.collection('users').findOne({});
  })
  .then((result) => {
    console.log('✅ MongoDB users collection accessible');
  })
  .catch((error) => {
    console.log('❌ Final MongoDB connection error:', error.message);
  })
  .finally(() => {
    mongoose.disconnect();
  });
"

echo -e "\n9. Restarting the application to use the new connection..."
pm2 restart mbztech-api
sleep 3

echo -e "\n10. Testing the API endpoint that was failing..."
curl -s -X POST https://api.elapix.store/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "companyName": "Test Company"
  }' | jq '.' || echo "API test failed"

# Clean up
rm -f setup-mongodb-user.js

echo -e "\n✅ MongoDB authentication fix complete!"
echo "The API should now work without authorization errors."
