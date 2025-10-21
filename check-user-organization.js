require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Organization = require('./models/organization');

async function checkUserOrganization() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Check the target organization
    const targetOrgId = '689e0abff0773bdf70c3d41f';
    console.log(`\n🎯 CHECKING TARGET ORGANIZATION: ${targetOrgId}`);
    console.log('='.repeat(60));
    
    const targetOrg = await Organization.findById(targetOrgId);
    if (targetOrg) {
      console.log(`🏢 Organization Name: ${targetOrg.name}`);
      console.log(`🏢 Organization ID: ${targetOrg._id}`);
      console.log(`🏢 Created: ${targetOrg.createdAt}`);
    } else {
      console.log('❌ Target organization not found');
    }
    
    // Check users in target organization
    const usersInTargetOrg = await User.find({ organizationId: targetOrgId });
    console.log(`\n👥 USERS IN TARGET ORGANIZATION: ${usersInTargetOrg.length}`);
    
    if (usersInTargetOrg.length > 0) {
      usersInTargetOrg.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.fullName || 'No name'})`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Created: ${user.createdAt}`);
      });
    } else {
      console.log('❌ No users found in target organization');
    }
    
    // Check all organizations and their users
    console.log('\n🏢 ALL ORGANIZATIONS:');
    console.log('='.repeat(60));
    
    const allOrgs = await Organization.find({}).sort({ createdAt: -1 });
    for (const org of allOrgs) {
      const userCount = await User.countDocuments({ organizationId: org._id });
      console.log(`\n🏢 ${org.name} (${org._id})`);
      console.log(`   👥 Users: ${userCount}`);
      console.log(`   📅 Created: ${org.createdAt}`);
      
      if (userCount > 0) {
        const users = await User.find({ organizationId: org._id }).select('email fullName role');
        users.forEach(user => {
          console.log(`      - ${user.email} (${user.role})`);
        });
      }
    }
    
    // Check which organization has the most data
    console.log('\n📊 ORGANIZATIONS WITH DATA:');
    console.log('='.repeat(60));
    
    const Order = require('./models/order');
    const Customer = require('./models/customers');
    const Product = require('./models/inventory');
    
    for (const org of allOrgs) {
      const orderCount = await Order.countDocuments({ organizationId: org._id });
      const customerCount = await Customer.countDocuments({ organizationId: org._id });
      const productCount = await Product.countDocuments({ organizationId: org._id });
      
      if (orderCount > 0 || customerCount > 0 || productCount > 0) {
        console.log(`\n🏢 ${org.name} (${org._id})`);
        console.log(`   📦 Orders: ${orderCount}`);
        console.log(`   👥 Customers: ${customerCount}`);
        console.log(`   📦 Products: ${productCount}`);
        
        // Show sample data
        if (orderCount > 0) {
          const sampleOrder = await Order.findOne({ organizationId: org._id });
          console.log(`   📦 Sample Order: $${sampleOrder.total} (${sampleOrder.status})`);
        }
      }
    }
    
    // Check if there's a user with a different organization that might be the correct one
    console.log('\n🔍 CHECKING FOR ACTIVE USERS:');
    console.log('='.repeat(60));
    
    const allUsers = await User.find({}).select('email fullName organizationId role createdAt');
    console.log(`👥 Total Users: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.fullName || 'No name'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organization: ${user.organizationId}`);
      console.log(`   Created: ${user.createdAt}`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (usersInTargetOrg.length === 0) {
      console.log('❌ ISSUE: No users in target organization');
      console.log('1. Check if user is logged in with correct account');
      console.log('2. Verify user belongs to correct organization');
      console.log('3. Consider updating user organization if needed');
    }
    
    if (allOrgs.length > 1) {
      console.log('\n💡 SUGGESTIONS:');
      console.log('1. Check which organization the user should belong to');
      console.log('2. Verify frontend is sending correct organization ID');
      console.log('3. Consider data migration if user is in wrong organization');
    }
    
    console.log('\n✅ User organization check complete!');
    
  } catch (error) {
    console.error('❌ Error during user organization check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkUserOrganization();
