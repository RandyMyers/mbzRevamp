/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard metrics and widgets
 *
 * /api/dashboard/stats/{organizationId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get basic dashboard stats
 *     parameters:
 *       - in: path
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
 *       200: { description: Stats }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/dashboard/sales-trend/{organizationId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get sales trend data
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d, 12m, ytd], default: 30d }
 *     responses:
 *       200: { description: Trend data }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/dashboard/top-products/{organizationId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get top products
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Top products }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/dashboard/customer-metrics/{organizationId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get customer metrics
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Metrics }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/dashboard/notifications/{organizationId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard notifications
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notifications }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 */
const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const Website = require('../models/website');
const Task = require('../models/task');
const Campaign = require('../models/campaigns');
const SupportTicket = require('../models/support');
const mongoose = require('mongoose');
const currencyUtils = require('../utils/currencyUtils');

// Helper function to safely handle database queries with default values
const safeQuery = async (queryFunction, defaultValue = 0) => {
  try {
    return await queryFunction();
  } catch (error) {
    console.error('Database query error:', error);
    return defaultValue;
  }
};

// Helper function to calculate date range for growth comparison
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

// Dashboard Overview Stats
exports.getOverviewStats = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId, displayCurrency } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    // Determine display currency
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency revenue aggregation with safe handling
    let revenueSummary = { totalConverted: 0, targetCurrency, currencyBreakdown: {} };
    try {
      const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(organizationId);
      const revenueResults = await Order.aggregate(revenuePipeline);
      revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency);
    } catch (error) {
      console.error('Revenue calculation error:', error);
      // Keep default values
    }

    // Other stats with safe handling
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalWebsites,
      totalTasks,
      totalCampaigns,
      totalTickets
    ] = await Promise.all([
      // Orders
      safeQuery(() => Order.countDocuments({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      })),
      // Customers
      safeQuery(() => Customer.countDocuments({
        organizationId: orgId
      })),
      // Products
      safeQuery(() => Inventory.countDocuments({
        organizationId: orgId
      })),
      // Websites
      safeQuery(() => Website.countDocuments({
        organization: orgId
      })),
      // Tasks
      safeQuery(() => Task.countDocuments({
        organization: orgId
      })),
      // Campaigns
      safeQuery(() => Campaign.countDocuments({
        organization: orgId
      })),
      // Support Tickets
      safeQuery(() => SupportTicket.countDocuments({
        organizationId: orgId
      }))
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueSummary.totalConverted || 0,
        revenueCurrency: revenueSummary.targetCurrency || 'USD',
        revenueBreakdown: revenueSummary.currencyBreakdown || {},
        orders: totalOrders || 0,
        customers: totalCustomers || 0,
        products: totalProducts || 0,
        websites: totalWebsites || 0,
        tasks: totalTasks || 0,
        campaigns: totalCampaigns || 0,
        tickets: totalTickets || 0
      }
    });
  } catch (error) {
    console.error('Dashboard Overview Stats Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get dashboard overview stats"
    });
  }
};

// Get Sales Trend Data
exports.getSalesTrend = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const startDate = getDateRange(timeRange);
    const endDate = new Date();

    // Get sales data by month/week
    const salesData = await safeQuery(async () => {
      const pipeline = [
        {
          $match: {
            organizationId: orgId,
            date_created: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date_created' },
              month: { $month: '$date_created' },
              week: { $week: '$date_created' }
            },
            sales: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 }
        }
      ];

      return await Order.aggregate(pipeline);
    }, []);

    // Transform data for frontend charts
    const chartData = salesData.map(item => ({
      name: `${item._id.month}/${item._id.year}`,
      sales: item.sales || 0,
      orders: item.orders || 0
    }));

    // If no data, return default structure
    if (chartData.length === 0) {
      chartData.push(
        { name: 'No Data', sales: 0, orders: 0 }
      );
    }

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Sales Trend Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get sales trend data",
      data: [{ name: 'No Data', sales: 0, orders: 0 }]
    });
  }
};

// Get Top Products
exports.getTopProducts = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    const topProducts = await safeQuery(async () => {
      const pipeline = [
        {
          $match: {
            organizationId: orgId,
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalSales: { $sum: '$items.total' },
            quantity: { $sum: '$items.quantity' },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { totalSales: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ];

      return await Order.aggregate(pipeline);
    }, []);

    // Transform data for frontend with actual product images
    const transformedProducts = await Promise.all(
      topProducts.map(async (product, index) => {
        try {
          let inventoryProduct = null;
          let image = '/placeholder.svg';
          
          // Try to find the product in inventory using multiple methods
          if (product._id && mongoose.Types.ObjectId.isValid(product._id)) {
            // First try by _id if it's a valid ObjectId
            inventoryProduct = await Inventory.findById(product._id).lean();
          }
          
          // If not found by _id, try by other fields
          if (!inventoryProduct) {
            inventoryProduct = await Inventory.findOne({
              $or: [
                { product_Id: product._id },
                { sku: product._id },
                { name: product.name }
              ]
            }).lean();
          }
          
          if (inventoryProduct && inventoryProduct.images && inventoryProduct.images.length > 0) {
            image = inventoryProduct.images[0].src;
          }
          
          return {
            id: product._id?.toString() || `product-${index}`,
            name: product.name || 'Unknown Product',
            sales: product.totalSales || 0,
            quantity: product.quantity || 0,
            orders: product.orders || 0,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
            image: image
          };
        } catch (error) {
          console.error(`Error fetching product details for ${product._id}:`, error);
          return {
            id: product._id?.toString() || `product-${index}`,
            name: product.name || 'Unknown Product',
            sales: product.totalSales || 0,
            quantity: product.quantity || 0,
            orders: product.orders || 0,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
            image: '/placeholder.svg'
          };
        }
      })
    );

    res.json({
      success: true,
      data: transformedProducts
    });
  } catch (error) {
    console.error('Top Products Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get top products data",
      data: []
    });
  }
};

// Get Customer Metrics
exports.getCustomerMetrics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const startDate = getDateRange('30d');

    const customerMetrics = await safeQuery(async () => {
      const pipeline = [
        {
          $match: {
            organizationId: orgId,
            date_created: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            newCustomers: { $sum: 1 },
            avgOrderValue: { $avg: '$total' }
          }
        }
      ];

      return await Customer.aggregate(pipeline);
    }, [{ totalCustomers: 0, newCustomers: 0, avgOrderValue: 0 }]);

    const metrics = customerMetrics[0] || { totalCustomers: 0, newCustomers: 0, avgOrderValue: 0 };

    // Get customer acquisition trend
    const acquisitionTrend = await safeQuery(async () => {
      const pipeline = [
        {
          $match: {
            organizationId: orgId,
            date_created: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date_created' },
              month: { $month: '$date_created' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ];

      return await Customer.aggregate(pipeline);
    }, []);

    res.json({
      success: true,
      data: {
        totalCustomers: metrics.totalCustomers || 0,
        newCustomers: metrics.newCustomers || 0,
        avgOrderValue: metrics.avgOrderValue || 0,
        acquisitionTrend: acquisitionTrend.map(item => ({
          name: `${item._id.month}/${item._id.year}`,
          customers: item.count || 0
        }))
      }
    });
  } catch (error) {
    console.error('Customer Metrics Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get customer metrics",
      data: {
        totalCustomers: 0,
        newCustomers: 0,
        avgOrderValue: 0,
        acquisitionTrend: []
      }
    });
  }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get low inventory alerts
    const lowInventoryAlerts = await safeQuery(async () => {
      return await Inventory.find({
        organizationId: orgId,
        quantity: { $lte: 10 },
        updatedAt: { $gte: oneDayAgo }
      }).limit(5).lean();
    }, []);

    // Get recent orders
    const recentOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        date_created: { $gte: oneDayAgo }
      }).limit(5).lean();
    }, []);

    // Get new customers
    const newCustomers = await safeQuery(async () => {
      return await Customer.find({
        organizationId: orgId,
        date_created: { $gte: oneDayAgo }
      }).limit(5).lean();
    }, []);

    // Transform into notifications
    const notifications = [];

    // Low inventory notifications
    lowInventoryAlerts.forEach(item => {
      notifications.push({
        id: `inventory-${item._id}`,
        type: 'alert',
        message: `Low inventory alert for '${item.name || 'Product'}'`,
        time: new Date(item.updatedAt).toLocaleString(),
        icon: 'AlertTriangle'
      });
    });

    // New customer notifications
    newCustomers.forEach(customer => {
      notifications.push({
        id: `customer-${customer._id}`,
        type: 'info',
        message: `New customer registration: ${customer.fullName || 'Unknown'}`,
        time: new Date(customer.date_created).toLocaleString(),
        icon: 'Users'
      });
    });

    // Recent order notifications
    recentOrders.forEach(order => {
      notifications.push({
        id: `order-${order._id}`,
        type: 'success',
        message: `Order #${order.number || order._id.toString().slice(-6)} has been ${order.status}`,
        time: new Date(order.date_created).toLocaleString(),
        icon: 'ShoppingBag'
      });
    });

    // Sort by time (newest first) and limit to 10
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    notifications.splice(10);

    // If no notifications, add a welcome message
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        type: 'info',
        message: 'Welcome to your dashboard! Start by adding products or connecting your store.',
        time: new Date().toLocaleString(),
        icon: 'Info'
      });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Notifications Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get notifications",
      data: [{
        id: 'welcome',
        type: 'info',
        message: 'Welcome to your dashboard! Start by adding products or connecting your store.',
        time: new Date().toLocaleString(),
        icon: 'Info'
      }]
    });
  }
}; 