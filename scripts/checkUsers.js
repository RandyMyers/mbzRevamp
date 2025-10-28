const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/users');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    checkUsers();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function checkUsers() {
  try {
    console.log('👤 Checking existing users...\n');
    
    const users = await User.find({}).select('email role fullName isStaffAccount');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Full Name: ${user.fullName || 'N/A'}`);
      console.log(`   Staff Account: ${user.isStaffAccount || false}`);
      console.log('');
    });
    
    // Check for super admin users specifically
    const superAdmins = users.filter(user => user.role === 'super-admin');
    if (superAdmins.length > 0) {
      console.log('🔑 Super Admin Users:');
      superAdmins.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.fullName || 'No name'})`);
      });
    } else {
      console.log('❌ No super admin users found');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    mongoose.connection.close();
  }
}
