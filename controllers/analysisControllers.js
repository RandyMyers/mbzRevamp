/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Business analytics endpoints
 *
 * /api/analytics/total-revenue:
 *   get:
 *     tags: [Analytics]
 *     summary: Get total revenue for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: displayCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Revenue summary }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/analytics/total-orders:
 *   get:
 *     tags: [Analytics]
 *     summary: Get total orders for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Orders count }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/analytics/new-customers:
 *   get:
 *     tags: [Analytics]
 *     summary: Get new customers for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: New customers count }
 *       500: { description: Server error }
 *
 * /api/analytics/average-order-value:
 *   get:
 *     tags: [Analytics]
 *     summary: Get average order value for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: displayCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: AOV }
 *       500: { description: Server error }
 *
 * /api/analytics/return-rate:
 *   get:
 *     tags: [Analytics]
 *     summary: Get return rate percentage for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Return rate }
 *       500: { description: Server error }
 *
 * /api/analytics/lifetime-value:
 *   get:
 *     tags: [Analytics]
 *     summary: Get average customer lifetime value
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: displayCurrency
 *         schema: { type: string }
 *     responses:
 *       200: { description: LTV }
 *       500: { description: Server error }
 *
 * /api/analytics/customer-acquisition:
 *   get:
 *     tags: [Analytics]
 *     summary: Get customer acquisition by source for a time range
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Acquisition breakdown }
 *       500: { description: Server error }
 *
 * /api/analytics/product-performance:
 *   get:
 *     tags: [Analytics]
 *     summary: Get top product performance
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: displayCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Product performance }
 *       500: { description: Server error }
 *
 * /api/analytics/funnel-data:
 *   get:
 *     tags: [Analytics]
 *     summary: Get funnel data across stages
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Funnel stages }
 *       500: { description: Server error }
 *
 * /api/analytics/retention-data:
 *   get:
 *     tags: [Analytics]
 *     summary: Get retention cohort data
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Retention data }
 *       500: { description: Server error }
 *
 * /api/analytics/regional-sales:
 *   get:
 *     tags: [Analytics]
 *     summary: Get sales by region
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: displayCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Regional sales }
 *       500: { description: Server error }
 */
const Order = require('../models/order');
const Customer = require('../models/customers');
const Product = require('../models/inventory');
const Organization = require('../models/organization');
const currencyUtils = require('../utils/currencyUtils');
const mongoose = require('mongoose');

// Helper function to calculate date range
const getDateRange = (timeRange) => {
  const now = new Date();
  const ranges = {
    '7d': new Date(new Date().setDate(now.getDate() - 7)),
    '30d': new Date(new Date().setDate(now.getDate() - 30)),
    '90d': new Date(new Date().setDate(now.getDate() - 90)),
    '12m': new Date(new Date().setDate(now.getDate() - 365)),
    'ytd': new Date(new Date(now.getFullYear(), 0, 1))
  };
  return ranges[timeRange] || ranges['30d'];
};

// Helper function to get previous period date range for growth calculations
const getPreviousPeriodRange = (timeRange) => {
  const now = new Date();
  const daysDiff = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '12m': 365,
    'ytd': Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24))
  };
  const days = daysDiff[timeRange] || 30;

  return {
    currentStart: new Date(new Date().setDate(now.getDate() - days)),
    previousStart: new Date(new Date().setDate(now.getDate() - (days * 2))),
    previousEnd: new Date(new Date().setDate(now.getDate() - days))
  };
};

// Revenue Growth (compares current period to previous period)
exports.revenueGrowth = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);
    const { currentStart, previousStart, previousEnd } = getPreviousPeriodRange(timeRange);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Get current period revenue
    const currentRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId,
      targetCurrency,
      { date_created: { $gte: currentStart } }
    );
    const currentRevenueResults = await Order.aggregate(currentRevenuePipeline);
    const currentRevenueSummary = await currencyUtils.processMultiCurrencyResults(currentRevenueResults, targetCurrency, organizationId);

    // Get previous period revenue
    const previousRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId,
      targetCurrency,
      { date_created: { $gte: previousStart, $lt: previousEnd } }
    );
    const previousRevenueResults = await Order.aggregate(previousRevenuePipeline);
    const previousRevenueSummary = await currencyUtils.processMultiCurrencyResults(previousRevenueResults, targetCurrency, organizationId);

    const currentRevenue = currentRevenueSummary.totalConverted;
    const previousRevenue = previousRevenueSummary.totalConverted;

    const growth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : (currentRevenue > 0 ? 100 : 0);

    res.json({
      success: true,
      data: {
        growth: Math.round(growth * 100) / 100,
        currentRevenue,
        previousRevenue,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Revenue Growth Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Order Growth (compares current period to previous period)
exports.orderGrowth = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const { currentStart, previousStart, previousEnd } = getPreviousPeriodRange(timeRange);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Get current period orders
    const currentOrders = await Order.countDocuments({
      organizationId: orgObjectId,
      date_created: { $gte: currentStart },
      status: { $nin: ['cancelled', 'refunded'] }
    });

    // Get previous period orders
    const previousOrders = await Order.countDocuments({
      organizationId: orgObjectId,
      date_created: { $gte: previousStart, $lt: previousEnd },
      status: { $nin: ['cancelled', 'refunded'] }
    });

    const growth = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : (currentOrders > 0 ? 100 : 0);

    res.json({
      success: true,
      data: {
        growth: Math.round(growth * 100) / 100,
        currentOrders,
        previousOrders
      }
    });
  } catch (error) {
    console.error('Order Growth Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.totalRevenue = async (req, res) => {
    try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    console.log('🔍 Total Revenue Analytics Request:');
    console.log('   Organization ID:', organizationId);
    console.log('   Time Range:', timeRange);
    console.log('   User ID:', userId);
    console.log('   Display Currency:', displayCurrency);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    // Debug: Check data existence
    const totalOrdersInDB = await Order.countDocuments();
    const ordersForOrg = await Order.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    });
    console.log('📊 Debug - Total orders in DB:', totalOrdersInDB);
    console.log('📊 Debug - Orders for this org:', ordersForOrg);

    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency revenue aggregation with time filter
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId, 
      targetCurrency, 
      { date_created: { $gte: startDate } }
    );
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency, organizationId);

    res.json({
      success: true,
      data: { 
        totalRevenue: revenueSummary.totalConverted,
        currency: revenueSummary.targetCurrency,
        currencyBreakdown: revenueSummary.currencyBreakdown,
        timeRange: {
          start: startDate,
          end: new Date()
        }
      },
      debug: {
        organizationId,
        totalOrdersInDB,
        ordersForOrg,
        hasData: ordersForOrg > 0,
        issue: ordersForOrg === 0 ? "No orders found for this organization" : null
      }
    });
    } catch (error) {
    console.error('Total Revenue Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate total revenue"
    });
  }
};

// Total Orders
exports.totalOrders = async (req, res) => {
    try {
    const { timeRange, organizationId } = req.query;
    
    console.log('🔍 Total Orders Analytics Request:');
    console.log('   Organization ID:', organizationId);
    console.log('   Time Range:', timeRange);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    // Debug: Check data existence
    const totalOrdersInDB = await Order.countDocuments();
    const ordersForOrg = await Order.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    });
    console.log('📊 Debug - Total orders in DB:', totalOrdersInDB);
    console.log('📊 Debug - Orders for this org:', ordersForOrg);

    const startDate = getDateRange(timeRange);

    const query = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['cancelled', 'refunded'] },
      total: { $exists: true, $ne: "" } // Only count orders with a total
    };

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: { 
        totalOrders,
        timeRange: {
          start: startDate,
          end: new Date() // Include end date for clarity
        }
      },
      debug: {
        organizationId,
        totalOrdersInDB,
        ordersForOrg,
        hasData: ordersForOrg > 0,
        issue: ordersForOrg === 0 ? "No orders found for this organization" : null
      }
    });
    } catch (error) {
    console.error('Total Orders Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count orders"
    });
    }
  };

// New Customers
exports.newCustomers = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;

    console.log('🔍 New Customers Analytics Request:');
    console.log('   Organization ID:', organizationId);
    console.log('   Time Range:', timeRange);

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    // Debug: Check data existence
    const totalCustomersInDB = await Customer.countDocuments();
    const customersForOrg = await Customer.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    });
    console.log('📊 Debug - Total customers in DB:', totalCustomersInDB);
    console.log('📊 Debug - Customers for this org:', customersForOrg);

    const startDate = getDateRange(timeRange);

    // Cast organizationId and support either date_created (Woo) or createdAt
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const newCustomers = await Customer.countDocuments({
      organizationId: orgObjectId,
      $or: [
        { date_created: { $gte: startDate } },
        { createdAt: { $gte: startDate } }
      ]
    });

    res.json({ 
      success: true, 
      data: { newCustomers },
      debug: {
        organizationId,
        totalCustomersInDB,
        customersForOrg,
        hasData: customersForOrg > 0,
        issue: customersForOrg === 0 ? "No customers found for this organization" : null
      }
    });
  } catch (error) {
    console.error('New Customers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Average Order Value
exports.averageOrderValue = async (req, res) => {
    try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency average order value calculation
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId, 
      targetCurrency, 
      { date_created: { $gte: startDate } }
    );
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency, organizationId);

    // Get total order count for the period
    const totalOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['cancelled', 'refunded'] }
    });
    
    const averageOrderValue = totalOrders > 0 ? revenueSummary.totalConverted / totalOrders : 0;

    res.json({
      success: true,
      data: { 
        averageOrderValue,
        currency: revenueSummary.targetCurrency,
        totalOrders
      },
      debug: {
        organizationId,
        totalOrdersInDB: await Order.countDocuments(),
        ordersForOrg: totalOrders,
        hasData: totalOrders > 0,
        issue: totalOrders === 0 ? "No orders found for this organization" : null
      }
    });
    } catch (error) {
    console.error('Average Order Value Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Return Rate
exports.returnRate = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const startDate = getDateRange(timeRange);

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const totalOrders = await Order.countDocuments({
      organizationId: orgObjectId,
      date_created: { $gte: startDate }
    });

    // Consider an order as returned if status indicates refund/return/cancel OR refunds array has entries
    const returnedOrders = await Order.countDocuments({
      organizationId: orgObjectId,
      date_created: { $gte: startDate },
      $or: [
        { status: { $in: ['returned', 'refunded'] } },
        { refunds: { $exists: true, $ne: [], $not: { $size: 0 } } }
      ]
    });

    const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    res.json({ success: true, data: { returnRate } });
  } catch (error) {
    console.error('Return Rate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Customer Retention Rate (percentage of customers who made repeat purchases)
exports.customerRetentionRate = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const startDate = getDateRange(timeRange);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Get all customers with their order counts
    const customerOrderCounts = await Order.aggregate([
      {
        $match: {
          organizationId: orgObjectId,
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalCustomers = customerOrderCounts.length;
    const repeatCustomers = customerOrderCounts.filter(c => c.orderCount > 1).length;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    res.json({
      success: true,
      data: {
        retentionRate,
        totalCustomers,
        repeatCustomers,
        oneTimeCustomers: totalCustomers - repeatCustomers
      }
    });
  } catch (error) {
    console.error('Customer Retention Rate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Churn Rate (percentage of customers who haven't purchased recently)
exports.churnRate = async (req, res) => {
  try {
    const { organizationId, churnPeriodDays = 90 } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() - parseInt(churnPeriodDays));

    // Get all customers who have ever purchased
    const allCustomers = await Order.aggregate([
      {
        $match: {
          organizationId: orgObjectId,
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: '$customerId',
          lastPurchase: { $max: '$date_created' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const totalCustomers = allCustomers.length;
    const churnedCustomers = allCustomers.filter(c => c.lastPurchase < churnDate).length;
    const activeCustomers = totalCustomers - churnedCustomers;
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    res.json({
      success: true,
      data: {
        churnRate,
        totalCustomers,
        churnedCustomers,
        activeCustomers,
        churnPeriodDays: parseInt(churnPeriodDays)
      }
    });
  } catch (error) {
    console.error('Churn Rate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Top Customers by Spending
exports.topCustomers = async (req, res) => {
  try {
    const { organizationId, userId, displayCurrency, limit = 10 } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: orgObjectId,
          status: { $nin: ['cancelled', 'refunded'] }
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
          _id: '$customerId',
          totalSpent: { $sum: '$numericTotal' },
          orderCount: { $sum: 1 },
          lastPurchase: { $max: '$date_created' },
          currency: { $first: '$currency' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: { path: '$customer', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          customerId: '$_id',
          name: {
            $ifNull: [
              '$customer.first_name',
              { $concat: [{ $ifNull: ['$customer.billing.first_name', ''] }, ' ', { $ifNull: ['$customer.billing.last_name', ''] }] }
            ]
          },
          email: { $ifNull: ['$customer.email', '$customer.billing.email'] },
          totalSpent: 1,
          orderCount: 1,
          lastPurchase: 1,
          currency: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const topCustomers = await Order.aggregate(pipeline);

    // Convert to target currency
    const convertedCustomers = await Promise.all(
      topCustomers.map(async (customer) => {
        const convertedSpent = await currencyUtils.convertCurrency(
          customer.totalSpent,
          customer.currency || 'USD',
          targetCurrency,
          organizationId
        );

        return {
          customerId: customer.customerId,
          name: customer.name?.trim() || 'Unknown',
          email: customer.email || '',
          totalSpent: convertedSpent,
          orderCount: customer.orderCount,
          lastPurchase: customer.lastPurchase
        };
      })
    );

    res.json({
      success: true,
      data: {
        topCustomers: convertedCustomers,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Top Customers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Sales Time Series (daily revenue and orders breakdown)
exports.salesTimeSeries = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);
    const startDate = getDateRange(timeRange);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: orgObjectId,
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
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
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date_created" }
          },
          revenue: { $sum: "$numericTotal" },
          orders: { $sum: 1 },
          currency: { $first: "$currency" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          orders: 1,
          currency: 1,
          _id: 0
        }
      }
    ];

    const salesData = await Order.aggregate(pipeline);

    // Convert to target currency
    const convertedSalesData = await Promise.all(
      salesData.map(async (day) => {
        const convertedRevenue = await currencyUtils.convertCurrency(
          day.revenue,
          day.currency || 'USD',
          targetCurrency,
          organizationId
        );

        return {
          date: day.date,
          revenue: convertedRevenue,
          orders: day.orders
        };
      })
    );

    res.json({
      success: true,
      data: {
        salesData: convertedSalesData,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Sales Time Series Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lifetime Value
exports.lifetimeValue = async (req, res) => {
  try {
    const { organizationId, userId, displayCurrency } = req.query;
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $nin: ['cancelled', 'refunded'] }
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
          },
          orderCurrency: {
            $ifNull: ["$currency", "USD"]
          }
        }
      },
      {
        $group: {
          _id: {
            customerId: '$customerId',
            currency: '$orderCurrency'
          },
          totalSpent: { $sum: "$numericTotal" }
        }
      },
      {
        $group: {
          _id: "$_id.customerId",
          spendingByCurrency: {
            $push: {
              currency: "$_id.currency",
              amount: "$totalSpent"
            }
          }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    
    // Convert each customer's spending to target currency
    let totalConvertedLTV = 0;
    const customerCount = result.length;

    for (const customer of result) {
      const convertedTotal = await currencyUtils.convertMultipleCurrencies(
        customer.spendingByCurrency,
        targetCurrency,
        organizationId
      );
      totalConvertedLTV += convertedTotal;
    }

    const averageLTV = customerCount > 0 ? totalConvertedLTV / customerCount : 0;

    res.json({
      success: true,
      data: { 
        lifetimeValue: averageLTV,
        currency: targetCurrency,
        customerCount
      }
    });
  } catch (error) {
    console.error('Lifetime Value Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Customer Acquisition
exports.customerAcquisition = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    
    const startDate = getDateRange(timeRange);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$created_via",
          customers: { $addToSet: "$customerId" }
        }
      },
      {
        $project: {
          source: "$_id",
          customers: { $size: "$customers" }
        }
      }
    ];

    const sources = await Order.aggregate(pipeline);
    
    const totalCustomers = sources.reduce((sum, source) => sum + source.customers, 0);

    const acquisitionData = sources.map(source => ({
      source: source.source || 'Direct',
      customers: source.customers,
      percentage: totalCustomers > 0 
        ? Math.round((source.customers / totalCustomers) * 100) 
        : 0
    }));

    res.json({
      success: true,
      data: { sources: acquisitionData }
    });
  } catch (error) {
    console.error('Customer Acquisition Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Product Performance
exports.productPerformance = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $unwind: "$line_items"
      },
      {
        $group: {
          _id: "$line_items.inventoryId",
          // Use line_items.total when available to avoid double-counting
          sales: { $sum: { $toDouble: "$line_items.total" } },
          quantity: { $sum: "$line_items.quantity" },
          currency: { $first: "$currency" }
        }
      },
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          name: "$product.name",
          sales: 1,
          quantity: 1,
          currency: 1,
          profit: { 
            $multiply: [
              "$quantity",
              { $subtract: [{ $toDouble: "$product.regular_price" }, { $toDouble: "$product.cost" }] }
            ]
          }
        }
      },
      {
        $sort: { sales: -1 }
      }
    ];

    const products = await Order.aggregate(pipeline);

    // Convert sales amounts to target currency
    const convertedProducts = await Promise.all(
      products.map(async (product) => {
        const convertedSales = await currencyUtils.convertCurrency(
          product.sales,
          product.currency || 'USD',
          targetCurrency,
          organizationId
        );
        
        return {
          ...product,
          sales: convertedSales,
          originalSales: product.sales,
          originalCurrency: product.currency,
          convertedCurrency: targetCurrency
        };
      })
    );

    res.json({
      success: true,
      data: { 
        products: convertedProducts,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Product Performance Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Funnel Data - Shows order funnel based on actual order statuses
exports.funnelData = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;

    const startDate = getDateRange(timeRange);

    // Get all orders (including pending, on-hold, etc.)
    const allOrdersQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate }
    };
    const allOrders = await Order.countDocuments(allOrdersQuery);

    // Get orders that started checkout (not cancelled or failed)
    const checkoutQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['cancelled', 'failed', 'trash'] }
    };
    const checkoutStarts = await Order.countDocuments(checkoutQuery);

    // Get orders in processing state
    const processingQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $in: ['processing', 'completed', 'on-hold'] }
    };
    const processingOrders = await Order.countDocuments(processingQuery);

    // Get completed purchases
    const purchaseQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: 'completed'
    };
    const completedPurchases = await Order.countDocuments(purchaseQuery);

    const funnelStages = [
      { stage: "Orders Created", count: allOrders },
      { stage: "Checkout Started", count: checkoutStarts },
      { stage: "Payment Received", count: processingOrders },
      { stage: "Completed", count: completedPurchases }
    ];

    res.json({
      success: true,
      data: { stages: funnelStages }
    });
  } catch (error) {
    console.error('Funnel Data Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Retention Data
exports.retentionData = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$date_created' },
          lastOrder: { $max: '$date_created' }
        }
      },
      {
        $project: {
          orderCount: 1,
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$daysSinceFirstOrder', 30] }, then: '30 days' },
                { case: { $lte: ['$daysSinceFirstOrder', 60] }, then: '60 days' },
                { case: { $lte: ['$daysSinceFirstOrder', 90] }, then: '90 days' }
              ],
              default: '90+ days'
            }
          },
          customerCount: { $sum: 1 },
          averageOrders: { $avg: '$orderCount' }
        }
      }
    ];

    const retentionData = await Order.aggregate(pipeline);

    res.json({
      success: true,
      data: { retentionData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Regional Sales
exports.regionalSales = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $addFields: {
          numericTotal: { $toDouble: "$total" }
        }
      },
      {
        $group: {
          _id: "$shipping.country",
          sales: { $sum: "$numericTotal" },
          customers: { $addToSet: "$customerId" },
          currency: { $first: "$currency" }
        }
      },
      {
        $project: {
          region: { $ifNull: ["$_id", "Unknown"] },
          sales: 1,
          customers: { $size: "$customers" },
          currency: 1
        }
      },
      {
        $sort: { sales: -1 }
      }
    ];

    const regionalData = await Order.aggregate(pipeline);

    // Convert sales amounts to target currency
    const convertedRegionalData = await Promise.all(
      regionalData.map(async (region) => {
        const convertedSales = await currencyUtils.convertCurrency(
          region.sales,
          region.currency || 'USD',
          targetCurrency,
          organizationId
        );
        
        return {
          ...region,
          sales: convertedSales,
          originalSales: region.sales,
          originalCurrency: region.currency,
          convertedCurrency: targetCurrency
        };
      })
    );

    res.json({
      success: true,
      data: { 
        regionalData: convertedRegionalData,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Regional Sales Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
