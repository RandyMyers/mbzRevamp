require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/order');
const Customer = require('./models/customers');
const Product = require('./models/inventory');
const Organization = require('./models/organization');

async function verifyAnalyticsData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📊 DATABASE OVERVIEW:');
    console.log('='.repeat(50));
    
    // Get total counts
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrganizations = await Organization.countDocuments();
    
    console.log(`📦 Total Orders: ${totalOrders}`);
    console.log(`👥 Total Customers: ${totalCustomers}`);
    console.log(`📦 Total Products: ${totalProducts}`);
    console.log(`🏢 Total Organizations: ${totalOrganizations}`);
    
    // Get all organization IDs
    const allOrderOrgs = await Order.distinct('organizationId');
    const allCustomerOrgs = await Customer.distinct('organizationId');
    const allProductOrgs = await Product.distinct('organizationId');
    
    console.log('\n🏢 ORGANIZATIONS WITH DATA:');
    console.log('='.repeat(50));
    console.log(`📦 Orders belong to ${allOrderOrgs.length} organizations`);
    console.log(`👥 Customers belong to ${allCustomerOrgs.length} organizations`);
    console.log(`📦 Products belong to ${allProductOrgs.length} organizations`);
    
    // Check specific organization
    const targetOrgId = '689e0abff0773bdf70c3d41f';
    console.log(`\n🎯 TARGET ORGANIZATION: ${targetOrgId}`);
    console.log('='.repeat(50));
    
    const orgExists = await Organization.findById(targetOrgId);
    console.log(`🏢 Organization exists: ${!!orgExists}`);
    if (orgExists) {
      console.log(`🏢 Organization name: ${orgExists.name}`);
    }
    
    // Check data for target organization
    const ordersForTarget = await Order.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(targetOrgId) 
    });
    const customersForTarget = await Customer.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(targetOrgId) 
    });
    const productsForTarget = await Product.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(targetOrgId) 
    });
    
    console.log(`📦 Orders for target org: ${ordersForTarget}`);
    console.log(`👥 Customers for target org: ${customersForTarget}`);
    console.log(`📦 Products for target org: ${productsForTarget}`);
    
    // Check recent data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(targetOrgId),
      date_created: { $gte: thirtyDaysAgo }
    });
    
    const recentCustomers = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(targetOrgId),
      $or: [
        { date_created: { $gte: thirtyDaysAgo } },
        { createdAt: { $gte: thirtyDaysAgo } }
      ]
    });
    
    console.log(`\n📅 RECENT DATA (30 days):`);
    console.log('='.repeat(50));
    console.log(`📦 Recent orders: ${recentOrders}`);
    console.log(`👥 Recent customers: ${recentCustomers}`);
    
    // Test analytics calculations manually
    console.log('\n🧮 MANUAL ANALYTICS CALCULATIONS:');
    console.log('='.repeat(50));
    
    // Total Revenue Calculation
    const revenuePipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(targetOrgId),
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
    
    // Customer calculations
    const customerCount = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(targetOrgId)
    });
    
    const recentCustomerCount = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(targetOrgId),
      $or: [
        { date_created: { $gte: thirtyDaysAgo } },
        { createdAt: { $gte: thirtyDaysAgo } }
      ]
    });
    
    console.log(`👥 Total Customers: ${customerCount}`);
    console.log(`👥 Recent Customers (30d): ${recentCustomerCount}`);
    
    // Check sample data
    console.log('\n📋 SAMPLE DATA:');
    console.log('='.repeat(50));
    
    const sampleOrder = await Order.findOne({ 
      organizationId: new mongoose.Types.ObjectId(targetOrgId) 
    }).lean();
    
    if (sampleOrder) {
      console.log('📦 Sample Order:');
      console.log(`   ID: ${sampleOrder._id}`);
      console.log(`   Total: ${sampleOrder.total}`);
      console.log(`   Status: ${sampleOrder.status}`);
      console.log(`   Date: ${sampleOrder.date_created}`);
      console.log(`   Currency: ${sampleOrder.currency}`);
    } else {
      console.log('❌ No orders found for target organization');
    }
    
    const sampleCustomer = await Customer.findOne({ 
      organizationId: new mongoose.Types.ObjectId(targetOrgId) 
    }).lean();
    
    if (sampleCustomer) {
      console.log('👥 Sample Customer:');
      console.log(`   ID: ${sampleCustomer._id}`);
      console.log(`   Email: ${sampleCustomer.email}`);
      console.log(`   Date Created: ${sampleCustomer.date_created}`);
    } else {
      console.log('❌ No customers found for target organization');
    }
    
    // Check if there's data for other organizations
    if (allOrderOrgs.length > 0) {
      console.log('\n🔍 OTHER ORGANIZATIONS WITH DATA:');
      console.log('='.repeat(50));
      
      for (let i = 0; i < Math.min(3, allOrderOrgs.length); i++) {
        const orgId = allOrderOrgs[i];
        const orgOrders = await Order.countDocuments({ organizationId: orgId });
        const orgCustomers = await Customer.countDocuments({ organizationId: orgId });
        
        console.log(`🏢 Organization ${orgId}:`);
        console.log(`   📦 Orders: ${orgOrders}`);
        console.log(`   👥 Customers: ${orgCustomers}`);
      }
    }
    
    // Analytics accuracy check
    console.log('\n✅ ANALYTICS ACCURACY CHECK:');
    console.log('='.repeat(50));
    
    const issues = [];
    
    if (ordersForTarget === 0) {
      issues.push('❌ No orders found for target organization');
    }
    
    if (customersForTarget === 0) {
      issues.push('❌ No customers found for target organization');
    }
    
    if (totalRevenue === 0 && ordersForTarget > 0) {
      issues.push('❌ Orders exist but revenue calculation returns 0');
    }
    
    if (allOrderOrgs.length > 0 && ordersForTarget === 0) {
      issues.push('⚠️ Data exists for other organizations but not target organization');
    }
    
    if (issues.length === 0) {
      console.log('✅ All analytics calculations are accurate');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    if (ordersForTarget === 0 && allOrderOrgs.length > 0) {
      console.log('1. Check if frontend is sending correct organization ID');
      console.log('2. Verify user belongs to correct organization');
      console.log('3. Consider data migration if needed');
    }
    
    if (ordersForTarget > 0 && totalRevenue === 0) {
      console.log('1. Check order total field format');
      console.log('2. Verify currency conversion logic');
      console.log('3. Check order status filtering');
    }
    
    console.log('\n✅ Analytics data verification complete!');
    
  } catch (error) {
    console.error('❌ Error during analytics verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

verifyAnalyticsData();
