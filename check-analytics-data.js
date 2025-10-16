require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/order');
const Customer = require('./models/customers');
const Product = require('./models/inventory');

async function checkAnalyticsData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Check orders data
    console.log('\n📊 ORDERS ANALYSIS:');
    const totalOrders = await Order.countDocuments();
    console.log('   Total orders in database:', totalOrders);
    
    const ordersWithOrg = await Order.countDocuments({ organizationId: { $exists: true } });
    console.log('   Orders with organizationId:', ordersWithOrg);
    
    const ordersWithDate = await Order.countDocuments({ date_created: { $exists: true } });
    console.log('   Orders with date_created:', ordersWithDate);
    
    const ordersWithTotal = await Order.countDocuments({ total: { $exists: true, $ne: '' } });
    console.log('   Orders with total:', ordersWithTotal);
    
    const ordersWithStatus = await Order.countDocuments({ status: { $exists: true } });
    console.log('   Orders with status:', ordersWithStatus);
    
    // Check customers data
    console.log('\n👥 CUSTOMERS ANALYSIS:');
    const totalCustomers = await Customer.countDocuments();
    console.log('   Total customers in database:', totalCustomers);
    
    const customersWithOrg = await Customer.countDocuments({ organizationId: { $exists: true } });
    console.log('   Customers with organizationId:', customersWithOrg);
    
    const customersWithDate = await Customer.countDocuments({ 
      $or: [
        { date_created: { $exists: true } },
        { createdAt: { $exists: true } }
      ]
    });
    console.log('   Customers with date fields:', customersWithDate);
    
    // Check products data
    console.log('\n📦 PRODUCTS ANALYSIS:');
    const totalProducts = await Product.countDocuments();
    console.log('   Total products in database:', totalProducts);
    
    const productsWithOrg = await Product.countDocuments({ organizationId: { $exists: true } });
    console.log('   Products with organizationId:', productsWithOrg);
    
    // Sample data structures
    console.log('\n📋 SAMPLE DATA STRUCTURES:');
    
    const sampleOrder = await Order.findOne().lean();
    if (sampleOrder) {
      console.log('   Sample order keys:', Object.keys(sampleOrder));
      console.log('   Sample order organizationId:', sampleOrder.organizationId);
      console.log('   Sample order date_created:', sampleOrder.date_created);
      console.log('   Sample order total:', sampleOrder.total);
      console.log('   Sample order status:', sampleOrder.status);
    } else {
      console.log('   ❌ No orders found in database');
    }
    
    const sampleCustomer = await Customer.findOne().lean();
    if (sampleCustomer) {
      console.log('   Sample customer keys:', Object.keys(sampleCustomer));
      console.log('   Sample customer organizationId:', sampleCustomer.organizationId);
      console.log('   Sample customer date_created:', sampleCustomer.date_created);
      console.log('   Sample customer createdAt:', sampleCustomer.createdAt);
    } else {
      console.log('   ❌ No customers found in database');
    }
    
    // Check for specific organization data
    console.log('\n🏢 ORGANIZATION DATA CHECK:');
    const orgId = '689e0abff0773bdf70c3d41f'; // From the error logs
    console.log(`   Checking data for organization: ${orgId}`);
    
    const orgOrders = await Order.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(orgId) 
    });
    console.log(`   Orders for this organization: ${orgOrders}`);
    
    const orgCustomers = await Customer.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(orgId) 
    });
    console.log(`   Customers for this organization: ${orgCustomers}`);
    
    const orgProducts = await Product.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(orgId) 
    });
    console.log(`   Products for this organization: ${orgProducts}`);
    
    // Check recent data
    console.log('\n📅 RECENT DATA CHECK:');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(orgId),
      date_created: { $gte: thirtyDaysAgo }
    });
    console.log(`   Recent orders (30 days): ${recentOrders}`);
    
    const recentCustomers = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(orgId),
      $or: [
        { date_created: { $gte: thirtyDaysAgo } },
        { createdAt: { $gte: thirtyDaysAgo } }
      ]
    });
    console.log(`   Recent customers (30 days): ${recentCustomers}`);
    
    console.log('\n✅ Data analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during data analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkAnalyticsData();
