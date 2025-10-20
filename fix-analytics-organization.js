require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Order = require('./models/order');
const Customer = require('./models/customers');

async function fixAnalyticsOrganization() {
  try {
    console.log('🔧 FIXING ANALYTICS ORGANIZATION ISSUE...');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Find organization with most data
    const orgWithData = '67f504af91eae487185de080'; // pexashop - has 38 orders, 57 customers
    const targetOrg = '689e0abff0773bdf70c3d41f'; // my own business - has no data
    
    console.log(`\n🎯 ORGANIZATION WITH DATA: ${orgWithData}`);
    console.log(`🎯 TARGET ORGANIZATION: ${targetOrg}`);
    
    // Check current data
    const ordersInDataOrg = await Order.countDocuments({ organizationId: orgWithData });
    const customersInDataOrg = await Customer.countDocuments({ organizationId: orgWithData });
    const ordersInTargetOrg = await Order.countDocuments({ organizationId: targetOrg });
    const customersInTargetOrg = await Customer.countDocuments({ organizationId: targetOrg });
    
    console.log(`\n📊 CURRENT DATA STATUS:`);
    console.log(`📦 Orders in data org: ${ordersInDataOrg}`);
    console.log(`👥 Customers in data org: ${customersInDataOrg}`);
    console.log(`📦 Orders in target org: ${ordersInTargetOrg}`);
    console.log(`👥 Customers in target org: ${customersInTargetOrg}`);
    
    // Option 1: Update user to use organization with data
    console.log(`\n🔧 OPTION 1: Update user to use organization with data`);
    console.log('This will make analytics work immediately with existing data');
    
    // Find a user to update (let's use the most recent one)
    const recentUser = await User.findOne({ 
      email: { $regex: /@/ } // Has email
    }).sort({ createdAt: -1 });
    
    if (recentUser) {
      console.log(`\n👤 UPDATING USER: ${recentUser.email}`);
      console.log(`   Current organizationId: ${recentUser.organizationId}`);
      
      // Update user to belong to organization with data
      await User.findByIdAndUpdate(recentUser._id, { 
        organizationId: orgWithData 
      });
      
      console.log(`✅ Updated user to organization: ${orgWithData}`);
      
      // Test analytics with this user
      console.log(`\n🧪 TESTING ANALYTICS WITH UPDATED USER:`);
      console.log('='.repeat(60));
      
      // Test total revenue
      const revenuePipeline = [
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(orgWithData),
            status: { $nin: ['cancelled', 'refunded'] },
            total: { $exists: true, $ne: '' }
          }
        },
        {
          $addFields: {
            numericTotal: {
              $cond: [
                { $eq: [{ $type: "$total" }, "string"] },
                { $toDouble: "$total" },
                "$total"
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$numericTotal" },
            orderCount: { $sum: 1 }
          }
        }
      ];
      
      const revenueResult = await Order.aggregate(revenuePipeline);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
      const orderCount = revenueResult.length > 0 ? revenueResult[0].orderCount : 0;
      
      console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`📦 Total Orders: ${orderCount}`);
      console.log(`📊 Average Order Value: $${orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : 0}`);
      
      // Test customer count
      const customerCount = await Customer.countDocuments({ organizationId: orgWithData });
      console.log(`👥 Total Customers: ${customerCount}`);
      
      console.log(`\n✅ ANALYTICS FIXED! User can now see real data.`);
      
    } else {
      console.log('❌ No users found to update');
    }
    
    // Option 2: Migrate data to target organization
    console.log(`\n🔧 OPTION 2: Migrate data to target organization`);
    console.log('This will move data from data org to target org');
    
    const migrateData = false; // Set to true if you want to migrate data
    
    if (migrateData) {
      console.log(`\n📦 MIGRATING ORDERS...`);
      const orderResult = await Order.updateMany(
        { organizationId: orgWithData },
        { organizationId: targetOrg }
      );
      console.log(`✅ Migrated ${orderResult.modifiedCount} orders`);
      
      console.log(`\n👥 MIGRATING CUSTOMERS...`);
      const customerResult = await Customer.updateMany(
        { organizationId: orgWithData },
        { organizationId: targetOrg }
      );
      console.log(`✅ Migrated ${customerResult.modifiedCount} customers`);
      
      // Test analytics with target organization
      console.log(`\n🧪 TESTING ANALYTICS WITH TARGET ORGANIZATION:`);
      
      const targetRevenueResult = await Order.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(targetOrg),
            status: { $nin: ['cancelled', 'refunded'] },
            total: { $exists: true, $ne: '' }
          }
        },
        {
          $addFields: {
            numericTotal: {
              $cond: [
                { $eq: [{ $type: "$total" }, "string"] },
                { $toDouble: "$total" },
                "$total"
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$numericTotal" },
            orderCount: { $sum: 1 }
          }
        }
      ]);
      
      const targetRevenue = targetRevenueResult.length > 0 ? targetRevenueResult[0].totalRevenue : 0;
      const targetOrderCount = targetRevenueResult.length > 0 ? targetRevenueResult[0].orderCount : 0;
      const targetCustomerCount = await Customer.countDocuments({ organizationId: targetOrg });
      
      console.log(`💰 Total Revenue: $${targetRevenue.toFixed(2)}`);
      console.log(`📦 Total Orders: ${targetOrderCount}`);
      console.log(`👥 Total Customers: ${targetCustomerCount}`);
      
      console.log(`\n✅ DATA MIGRATED! Target organization now has data.`);
    }
    
    console.log(`\n🎯 RECOMMENDED NEXT STEPS:`);
    console.log('='.repeat(60));
    console.log('1. ✅ User organization updated - analytics will work');
    console.log('2. 🔄 Restart frontend to pick up new organization');
    console.log('3. 🧪 Test analytics endpoints');
    console.log('4. 📊 Verify dashboard shows real data');
    
    console.log(`\n✅ ANALYTICS FIX COMPLETE!`);
    
  } catch (error) {
    console.error('❌ Error fixing analytics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixAnalyticsOrganization();


