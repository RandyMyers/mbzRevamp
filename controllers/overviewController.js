/**
 * Overview Controller - Handles dashboard overview statistics
 * 
 * This controller provides comprehensive analytics for the dashboard including:
 * - Revenue and order statistics
 * - Sales trends and product performance
 * - Customer analytics
 * - Order source breakdowns
 * 
 * Features:
 * - Multi-currency support (via currencyUtils)
 * - Safe error handling with fallback values
 * - Robust data validation and parsing
 * - Performance optimized queries
 */

const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const Store = require('../models/store');
const User = require('../models/users');
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

// Helper function to get organizationId from userId
const getOrganizationIdFromUserId = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user?.organization;
  } catch (error) {
    console.error('Error getting organizationId from userId:', error);
    return null;
  }
};

// Helper function to calculate date range for growth calculations
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
    currentEnd: new Date(),
    previousStart: new Date(new Date().setDate(now.getDate() - (days * 2))),
    previousEnd: new Date(new Date().setDate(now.getDate() - days))
  };
};

/**
 * @swagger
 * /api/overview/stats/{userId}:
 *   get:
 *     summary: Get comprehensive overview statistics for dashboard
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *       - in: query
 *         name: displayCurrency
 *         schema:
 *           type: string
 *         description: Currency code for displaying amounts (e.g., USD, EUR)
 *     responses:
 *       200:
 *         description: Overview statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue in display currency
 *                       example: 125000.50
 *                     totalOrders:
 *                       type: number
 *                       description: Total number of orders
 *                       example: 1250
 *                     totalCustomers:
 *                       type: number
 *                       description: Total number of customers
 *                       example: 450
 *                     averageOrderValue:
 *                       type: number
 *                       description: Average order value
 *                       example: 100.00
 *                     revenueBreakdown:
 *                       type: object
 *                       description: Revenue breakdown by currency
 *                     orderSources:
 *                       type: object
 *                       description: Order count by source
 *                     orderStatusDistribution:
 *                       type: object
 *                       description: Order count by status
 *                     categoryCounts:
 *                       type: object
 *                       description: Product count by category
 *                     stockStatusCounts:
 *                       type: object
 *                       description: Product count by stock status
 *                     stockStatusSales:
 *                       type: object
 *                       description: Sales impact by stock status
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
// Helper to batch convert currency amounts
const batchConvertCurrency = async (conversions, targetCurrency, organizationId) => {
  const rateCache = {};
  const results = [];

  for (const { amount, currency, index } of conversions) {
    if (currency === targetCurrency) {
      results[index] = amount;
      continue;
    }

    const cacheKey = `${currency}:${targetCurrency}`;
    if (!rateCache[cacheKey]) {
      rateCache[cacheKey] = await currencyUtils.getExchangeRate(organizationId, currency, targetCurrency);
    }

    const rate = rateCache[cacheKey];
    results[index] = rate ? amount * rate : amount;
  }

  return results;
};

exports.getOverviewStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayCurrency, timeRange, storeId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "User not found or no organization associated"
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Parse storeId if provided (for filtering by specific store)
    let storeIdFilter = null;
    if (storeId && storeId !== 'all') {
      try {
        storeIdFilter = new mongoose.Types.ObjectId(storeId);
      } catch (e) {
        console.warn('Invalid storeId provided:', storeId);
      }
    }

    // Determine display currency
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Calculate date ranges for growth calculations if timeRange is provided
    let currentPeriodFilter = null;
    let previousPeriodFilter = null;
    let periodDates = null;

    if (timeRange) {
      const { currentStart, currentEnd, previousStart, previousEnd } = getPreviousPeriodRange(timeRange);
      currentPeriodFilter = { date_created: { $gte: currentStart } };
      previousPeriodFilter = { date_created: { $gte: previousStart, $lt: previousEnd } };
      periodDates = {
        currentStart: currentStart.toISOString(),
        currentEnd: currentEnd.toISOString(),
        previousStart: previousStart.toISOString(),
        previousEnd: previousEnd.toISOString()
      };
    }

    // Build base match filter for orders (with optional date and store filter)
    const orderBaseMatch = {
      organizationId: orgId,
      status: { $nin: ['cancelled', 'refunded'] },
      ...(storeIdFilter ? { storeId: storeIdFilter } : {}),
      ...(currentPeriodFilter || {})
    };

    // Build base match filter for inventory (with optional store filter)
    const inventoryBaseMatch = {
      organizationId: orgId,
      ...(storeIdFilter ? { storeId: storeIdFilter } : {})
    };

    // Build base match filter for customers (with optional store filter)
    const customerBaseMatch = {
      organizationId: orgId,
      role: 'customer',
      ...(storeIdFilter ? { storeId: storeIdFilter } : {})
    };

    // Build queries array
    const queries = [
      // Revenue calculation with currency grouping (with optional date and store filter)
      Order.aggregate(currencyUtils.createMultiCurrencyRevenuePipeline(
        organizationId,
        targetCurrency,
        {
          ...(currentPeriodFilter || {}),
          ...(storeIdFilter ? { storeId: storeIdFilter } : {})
        }
      )),

      // Total customers count (with optional date and store filter) - only count actual customers, not admins
      Customer.countDocuments({
        ...customerBaseMatch,
        ...(currentPeriodFilter ? {
          $or: [
            currentPeriodFilter,
            { createdAt: currentPeriodFilter.date_created }
          ]
        } : {})
      }),

      // Order sources and status distribution
      Order.aggregate([
        { $match: orderBaseMatch },
        { $facet: {
          sources: [
            { $group: { _id: { $ifNull: ['$created_via', 'manual'] }, count: { $sum: 1 } } }
          ],
          statuses: [
            { $group: { _id: { $ifNull: ['$status', 'unknown'] }, count: { $sum: 1 } } }
          ]
        }}
      ]),

      // Category distribution (with optional store filter, not date-filtered)
      Inventory.aggregate([
        { $match: inventoryBaseMatch },
        { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$categories.name', 'Uncategorized'] },
          count: { $sum: 1 }
        }}
      ]),

      // Stock status distribution (with optional store filter, not date-filtered)
      Inventory.aggregate([
        { $match: inventoryBaseMatch },
        { $group: {
          _id: { $ifNull: ['$stock_status', 'unknown'] },
          count: { $sum: 1 }
        }}
      ]),

      // Top products by revenue (with optional date and store filter)
      Order.aggregate([
        { $match: orderBaseMatch },
        { $unwind: '$line_items' },
        { $group: {
          _id: { $ifNull: ['$line_items.inventoryId', '$line_items.product_id'] },
          name: { $first: '$line_items.name' },
          quantity: { $sum: { $toInt: { $ifNull: ['$line_items.quantity', 1] } } },
          revenue: { $sum: { $toDouble: { $ifNull: ['$line_items.subtotal', 0] } } },
          currency: { $first: { $ifNull: ['$currency', 'USD'] } }
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // Recent orders (with optional store filter, always show latest)
      Order.find({
        organizationId: orgId,
        ...(storeIdFilter ? { storeId: storeIdFilter } : {})
      })
        .sort({ date_created: -1 })
        .limit(5)
        .select('number _id billing line_items status total date_created storeId')
        .lean()
    ];

    // Add previous period queries if timeRange is provided
    if (timeRange) {
      const previousOrderMatch = {
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] },
        ...(storeIdFilter ? { storeId: storeIdFilter } : {}),
        ...previousPeriodFilter
      };

      queries.push(
        // Previous period revenue (with optional store filter)
        Order.aggregate(currencyUtils.createMultiCurrencyRevenuePipeline(
          organizationId,
          targetCurrency,
          {
            ...previousPeriodFilter,
            ...(storeIdFilter ? { storeId: storeIdFilter } : {})
          }
        )),

        // Previous period customers - only count actual customers, not admins (with optional store filter)
        Customer.countDocuments({
          ...customerBaseMatch,
          $or: [
            previousPeriodFilter,
            { createdAt: previousPeriodFilter.date_created }
          ]
        }),

        // Previous period order count (with optional store filter)
        Order.countDocuments(previousOrderMatch)
      );
    }

    // Run all queries in parallel
    const results = await Promise.all(queries);

    // Destructure current period results
    const [
      revenuePipelineResults,
      totalCustomers,
      orderStats,
      categoryStats,
      stockStatusStats,
      topProductStats,
      recentOrdersData,
      // Previous period results (if timeRange provided)
      previousRevenuePipelineResults,
      previousTotalCustomers,
      previousTotalOrders
    ] = results;

    // Process revenue with currency conversion
    let totalRevenue = 0;
    let revenueBreakdown = {};
    let totalOrders = 0;

    try {
      const revenueSummary = await currencyUtils.processMultiCurrencyResults(
        revenuePipelineResults,
        targetCurrency,
        organizationId
      );
      totalRevenue = revenueSummary.totalConverted || 0;
      revenueBreakdown = revenueSummary.currencyBreakdown || {};
      totalOrders = revenueSummary.totalOrders || 0;
    } catch (error) {
      console.error('Revenue calculation error:', error);
    }

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth percentages if timeRange is provided
    let revenueGrowth = null;
    let ordersGrowth = null;
    let customersGrowth = null;
    let aovGrowth = null;

    if (timeRange && previousRevenuePipelineResults) {
      try {
        // Process previous period revenue
        let previousTotalRevenue = 0;
        let previousOrderCount = previousTotalOrders || 0;

        const previousRevenueSummary = await currencyUtils.processMultiCurrencyResults(
          previousRevenuePipelineResults,
          targetCurrency,
          organizationId
        );
        previousTotalRevenue = previousRevenueSummary.totalConverted || 0;
        previousOrderCount = previousRevenueSummary.totalOrders || previousTotalOrders || 0;

        const previousAverageOrderValue = previousOrderCount > 0 ? previousTotalRevenue / previousOrderCount : 0;
        const previousCustomerCount = previousTotalCustomers || 0;

        // Calculate growth percentages
        revenueGrowth = previousTotalRevenue > 0
          ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
          : (totalRevenue > 0 ? 100 : 0);

        ordersGrowth = previousOrderCount > 0
          ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
          : (totalOrders > 0 ? 100 : 0);

        customersGrowth = previousCustomerCount > 0
          ? ((totalCustomers - previousCustomerCount) / previousCustomerCount) * 100
          : (totalCustomers > 0 ? 100 : 0);

        aovGrowth = previousAverageOrderValue > 0
          ? ((averageOrderValue - previousAverageOrderValue) / previousAverageOrderValue) * 100
          : (averageOrderValue > 0 ? 100 : 0);

      } catch (error) {
        console.error('Growth calculation error:', error);
        // Keep growth values as null on error
      }
    }

    // Process order stats
    const orderSources = {};
    const orderStatusDistribution = {};

    if (orderStats[0]) {
      orderStats[0].sources?.forEach(({ _id, count }) => {
        orderSources[_id] = count;
      });
      orderStats[0].statuses?.forEach(({ _id, count }) => {
        orderStatusDistribution[_id] = count;
      });
    }

    // Process category stats
    const categoryCounts = {};
    let totalProducts = 0;
    categoryStats.forEach(({ _id, count }) => {
      categoryCounts[_id] = count;
      totalProducts += count;
    });

    // Process stock status stats
    const stockStatusCounts = {};
    stockStatusStats.forEach(({ _id, count }) => {
      stockStatusCounts[_id] = count;
    });

    // Convert to array format for pie chart (without sales data for now - calculated separately if needed)
    const productCategoriesDistribution = Object.keys(categoryCounts).map(categoryName => {
      const count = categoryCounts[categoryName];
      const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;

      // Generate a consistent color based on category name
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ];
      const colorIndex = categoryName.length % colors.length;

      return {
        name: categoryName,
        value: count,
        sales: 0, // Will be populated if needed
        percentage: percentage,
        color: colors[colorIndex]
      };
    }).sort((a, b) => b.value - a.value).slice(0, 8);

    // Convert stock status to array format for pie chart
    const stockStatusDistribution = Object.keys(stockStatusCounts).map(stockStatus => {
      const count = stockStatusCounts[stockStatus];
      const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;

      // Generate appropriate colors for stock status
      const stockStatusColors = {
        'instock': '#10b981',      // Green for in stock
        'outofstock': '#ef4444',   // Red for out of stock
        'onbackorder': '#f59e0b',  // Orange for backorder
        'unknown': '#6b7280'       // Gray for unknown
      };

      // Format the display name
      const displayNames = {
        'instock': 'In Stock',
        'outofstock': 'Out of Stock',
        'onbackorder': 'On Backorder',
        'unknown': 'Unknown'
      };

      return {
        name: displayNames[stockStatus] || stockStatus,
        value: count,
        sales: 0, // Will be populated if needed
        percentage: percentage,
        color: stockStatusColors[stockStatus] || '#6b7280',
        status: stockStatus
      };
    }).sort((a, b) => b.value - a.value);

    // Fetch product images for top products (single batch query)
    const topProductIds = topProductStats
      .map(p => p._id)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));

    const productImages = {};
    if (topProductIds.length > 0) {
      const productsWithImages = await Inventory.find({
        _id: { $in: topProductIds },
        'images.0': { $exists: true }
      })
      .select('_id images')
      .lean();

      productsWithImages.forEach(p => {
        if (p.images && p.images.length > 0) {
          productImages[p._id.toString()] = p.images[0].src;
        }
      });
    }

    // Process top products with images
    const topProducts = topProductStats.map(product => ({
      name: product.name || 'Unknown Product',
      quantity: product.quantity,
      revenue: product.revenue,
      productId: product._id,
      image: productImages[product._id?.toString()] || '/placeholder.svg',
      id: product._id
    }));

    // Format recent orders
    const recentOrders = recentOrdersData.map(order => ({
      id: order._id,
      orderId: order.number || order._id,
      customer: order.billing ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
      product: order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Unknown',
      status: order.status || 'unknown',
      amount: String(order.total || '0'),
      date: order.date_created
    }));

    // Calculate sales trend using aggregation for better performance (with optional store filter)
    const salesTrend = await Order.aggregate([
      { $match: {
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] },
        ...(storeIdFilter ? { storeId: storeIdFilter } : {})
      } },
      { $addFields: {
        month: { $month: { $toDate: '$date_created' } },
        year: { $year: { $toDate: '$date_created' } },
        numericTotal: { $toDouble: { $ifNull: ['$total', 0] } }
      }},
      { $group: {
        _id: { month: '$month', year: '$year' },
        revenue: { $sum: '$numericTotal' },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Format sales trend for last 12 months
    const now = new Date();
    const formattedSalesTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getMonth() + 1}-${monthDate.getFullYear()}`;

      const monthData = salesTrend.find(s =>
        s._id.month === monthDate.getMonth() + 1 && s._id.year === monthDate.getFullYear()
      );

      formattedSalesTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthData?.revenue || 0,
        orders: monthData?.orders || 0
      });
    }

    res.json({
      success: true,
      data: {
        // Stats
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        currency: targetCurrency,
        revenueBreakdown,

        // Growth percentages (null if timeRange not provided)
        revenueGrowth,
        ordersGrowth,
        customersGrowth,
        aovGrowth,

        // Period info (null if timeRange not provided)
        timeRange: timeRange || null,
        periodDates,

        // Charts and breakdowns
        salesTrend: formattedSalesTrend,
        orderSources,
        orderStatusDistribution,
        productCategoriesDistribution,
        stockStatusDistribution,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Overview Stats Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get overview stats"
    });
  }
};

/**
 * @swagger
 * /api/overview/sales-trend/{userId}:
 *   get:
 *     summary: Get sales trend data for the last 12 months
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Sales trend data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         description: Month and year (e.g., "Jan 2024")
 *                         example: "Jan 2024"
 *                       revenue:
 *                         type: number
 *                         description: Total revenue for the month
 *                         example: 12500.75
 *                       orders:
 *                         type: number
 *                         description: Number of orders for the month
 *                         example: 125
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get sales trend"
 */
// Get sales trend data
exports.getSalesTrend = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "User not found or no organization associated" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Get all orders (no date filter)
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Calculate sales trend (monthly for last 12 months)
    const salesTrend = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date_created);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthRevenue = monthOrders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total);
        return sum + (isNaN(orderTotal) ? 0 : orderTotal);
      }, 0);
      const monthOrdersCount = monthOrders.length;
      
      salesTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrdersCount
      });
    }

    res.json({
      success: true,
      data: salesTrend
    });
  } catch (error) {
    console.error('Sales Trend Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get sales trend"
    });
  }
};

/**
 * @swagger
 * /api/overview/order-sources/{userId}:
 *   get:
 *     summary: Get order sources breakdown for analytics
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Order sources data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                         description: Order source (WooCommerce, API, Manual)
 *                         example: "WooCommerce"
 *                       count:
 *                         type: number
 *                         description: Number of orders from this source
 *                         example: 150
 *                       percentage:
 *                         type: number
 *                         description: Percentage of total orders
 *                         example: 75.5
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get order sources"
 */
// Get order sources data
exports.getOrderSources = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "User not found or no organization associated" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Get all orders (no date filter)
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Calculate order sources breakdown
    const orderSources = allOrders.reduce((acc, order) => {
      const source = order.created_via || 'manual';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format for charts
    const orderSourcesArray = Object.entries(orderSources).map(([source, count]) => ({
      source: source === 'checkout' ? 'WooCommerce' : source === 'rest-api' ? 'API' : 'Manual',
      count,
      percentage: allOrders.length > 0 ? (count / allOrders.length) * 100 : 0
    }));

    res.json({
      success: true,
      data: orderSourcesArray
    });
  } catch (error) {
    console.error('Order Sources Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get order sources"
    });
  }
};

/**
 * @swagger
 * /api/overview/top-products/{userId}:
 *   get:
 *     summary: Get top performing products by revenue
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Top products data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Product name
 *                         example: "Premium Widget"
 *                       quantity:
 *                         type: number
 *                         description: Total quantity sold
 *                         example: 150
 *                       revenue:
 *                         type: number
 *                         description: Total revenue generated
 *                         example: 7500.00
 *                       productId:
 *                         type: string
 *                         description: Product identifier
 *                         example: "507f1f77bcf86cd799439011"
 *                       image:
 *                         type: string
 *                         description: Product image URL
 *                         example: "https://example.com/image.jpg"
 *                       id:
 *                         type: string
 *                         description: Product ID for display
 *                         example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get top products"
 */
// Get top products data
exports.getTopProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "User not found or no organization associated" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Get all orders (no date filter)
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Get top products by sales
    const productSales = {};
    allOrders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          // Use inventoryId if available, otherwise fallback to product_id
          const productId = item.inventoryId || item.product_id;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                name: item.name || 'Unknown Product',
                quantity: 0,
                revenue: 0,
                productId: productId,
                isInventoryId: !!item.inventoryId // Flag to know if this is a proper ObjectId
              };
            }
            const quantity = parseInt(item.quantity) || 0;
            const subtotal = parseFloat(item.subtotal);
            productSales[productId].quantity += quantity;
            productSales[productId].revenue += (isNaN(subtotal) ? 0 : subtotal) * quantity;
          }
        });
      }
    });

    // Convert to array and sort by revenue
    const topProductsArray = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Fetch product details including images for top products
    const topProducts = await Promise.all(
      topProductsArray.map(async (product) => {
        try {
          let inventoryProduct = null;
          
          // If we have a proper inventoryId (ObjectId), use findById
          if (product.isInventoryId && mongoose.Types.ObjectId.isValid(product.productId)) {
            inventoryProduct = await Inventory.findById(product.productId).lean();
          } else {
            // Otherwise, try to find by product_id or other fields
            inventoryProduct = await Inventory.findOne({
              $or: [
                { product_Id: product.productId },
                { sku: product.productId },
                { name: product.name }
              ]
            }).lean();
          }
          
          if (inventoryProduct && inventoryProduct.images && inventoryProduct.images.length > 0) {
            return {
              ...product,
              image: inventoryProduct.images[0].src,
              id: product.productId
            };
          } else {
            // Fallback to placeholder image
            return {
              ...product,
              image: '/placeholder.svg',
              id: product.productId
            };
          }
        } catch (error) {
          console.error(`Error fetching product details for ${product.productId}:`, error);
          return {
            ...product,
            image: '/placeholder.svg',
            id: product.productId
          };
        }
      })
    );

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Top Products Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get top products"
    });
  }
};

/**
 * @swagger
 * /api/overview/recent-orders/{userId}:
 *   get:
 *     summary: Get recent orders for dashboard display
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Recent orders data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: ObjectId
 *                         description: Order ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       orderId:
 *                         type: string
 *                         description: Order number or ID
 *                         example: "#1234"
 *                       customer:
 *                         type: string
 *                         description: Customer full name
 *                         example: "John Doe"
 *                       product:
 *                         type: string
 *                         description: First product name from order
 *                         example: "Premium Widget"
 *                       status:
 *                         type: string
 *                         description: Order status
 *                         example: "completed"
 *                       amount:
 *                         type: string
 *                         description: Order total amount
 *                         example: "99.99"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Order creation date
 *                         example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get recent orders"
 */
// Get recent orders data
exports.getRecentOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "User not found or no organization associated" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Get all orders (no date filter) and sort by date
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId
      })
      .sort({ date_created: -1 })
      .limit(5)
      .lean();
    }, []);

    // Format recent orders
    const recentOrders = allOrders.map(order => ({
      id: order._id,
      orderId: order.number || order._id,
      customer: order.billing ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
      product: order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Unknown',
      status: order.status || 'unknown',
      amount: String(order.total || '0'),
      date: order.date_created
    }));

    res.json({
      success: true,
      data: recentOrders
    });
  } catch (error) {
    console.error('Recent Orders Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get recent orders"
    });
  }
};

/**
 * @swagger
 * /api/overview/test-product-images/{userId}:
 *   get:
 *     summary: Test endpoint to debug product image issues
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Product image test data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: number
 *                       description: Total number of products
 *                       example: 150
 *                     productsWithImages:
 *                       type: number
 *                       description: Number of products with images
 *                       example: 120
 *                     totalOrders:
 *                       type: number
 *                       description: Total number of orders
 *                       example: 500
 *                     uniqueProductIdsInOrders:
 *                       type: number
 *                       description: Number of unique products in orders
 *                       example: 75
 *                     productsInOrders:
 *                       type: number
 *                       description: Number of products that appear in orders
 *                       example: 75
 *                     productsInOrdersWithImages:
 *                       type: number
 *                       description: Number of products in orders with images
 *                       example: 60
 *                     sampleProductsWithImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Premium Widget"
 *                           product_Id:
 *                             type: number
 *                             example: 12345
 *                           sku:
 *                             type: string
 *                             example: "PW-001"
 *                           imageSrc:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                           imageCount:
 *                             type: number
 *                             example: 3
 *                     sampleProductsInOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Premium Widget"
 *                           product_Id:
 *                             type: number
 *                             example: 12345
 *                           sku:
 *                             type: string
 *                             example: "PW-001"
 *                           hasImages:
 *                             type: boolean
 *                             example: true
 *                           imageCount:
 *                             type: number
 *                             example: 3
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to test product images"
 */
// Test endpoint to debug product image issues
exports.testProductImages = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "User not found or no organization associated" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Get all products for the organization
    const allProducts = await Inventory.find({
      organizationId: orgId
    }).lean();

    // Get all orders for the organization
    const allOrders = await Order.find({
      organizationId: orgId,
      status: { $nin: ['cancelled', 'refunded'] }
    }).lean();

    // Extract product IDs from orders
    const orderProductIds = new Set();
    allOrders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          if (item.inventoryId) orderProductIds.add(item.inventoryId.toString());
          if (item.product_id) orderProductIds.add(item.product_id);
        });
      }
    });

    // Find products that appear in orders
    const productsInOrders = allProducts.filter(p => 
      orderProductIds.has(p._id.toString()) || 
      orderProductIds.has(p.product_Id?.toString()) ||
      orderProductIds.has(p.sku)
    );

    res.json({
      success: true,
      data: {
        totalProducts: allProducts.length,
        productsWithImages: allProducts.filter(p => p.images && p.images.length > 0).length,
        totalOrders: allOrders.length,
        uniqueProductIdsInOrders: orderProductIds.size,
        productsInOrders: productsInOrders.length,
        productsInOrdersWithImages: productsInOrders.filter(p => p.images && p.images.length > 0).length,
        sampleProductsWithImages: allProducts
          .filter(p => p.images && p.images.length > 0)
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            product_Id: p.product_Id,
            sku: p.sku,
            imageSrc: p.images[0].src,
            imageCount: p.images.length
          })),
        sampleProductsInOrders: productsInOrders
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            product_Id: p.product_Id,
            sku: p.sku,
            hasImages: p.images && p.images.length > 0,
            imageCount: p.images ? p.images.length : 0
          }))
      }
    });
  } catch (error) {
    console.error('Test Product Images Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to test product images"
    });
  }
};

/**
 * @swagger
 * /api/overview/stock-status-distribution/{userId}:
 *   get:
 *     summary: Get stock status distribution for pie chart visualization
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Stock status distribution data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Display name for stock status
 *                         example: "In Stock"
 *                       value:
 *                         type: number
 *                         description: Number of products with this status
 *                         example: 120
 *                       sales:
 *                         type: number
 *                         description: Total sales for products with this status
 *                         example: 15000.75
 *                       percentage:
 *                         type: number
 *                         description: Percentage of total products
 *                         example: 80.0
 *                       color:
 *                         type: string
 *                         description: Color code for chart visualization
 *                         example: "#10b981"
 *                       status:
 *                         type: string
 *                         description: Stock status identifier
 *                         example: "instock"
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get stock status distribution"
 */
// Get stock status distribution for pie chart
exports.getStockStatusDistribution = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayCurrency } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "User not found or no organization associated"
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Determine display currency for conversion
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Get all products for the organization
    const allProducts = await safeQuery(async () => {
      return await Inventory.find({
        organizationId: orgId
      }).lean();
    }, []);

    // Get all orders for the organization
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Calculate stock status distribution
    const stockStatusCounts = {};
    const stockStatusSales = {};

    allProducts.forEach(product => {
      const stockStatus = product.stock_status || 'unknown';

      // Count products per stock status
      if (!stockStatusCounts[stockStatus]) {
        stockStatusCounts[stockStatus] = 0;
      }
      stockStatusCounts[stockStatus]++;
    });

    // Calculate sales impact by stock status with currency conversion
    for (const order of allOrders) {
      if (order.line_items && Array.isArray(order.line_items)) {
        const orderCurrency = order.currency || 'USD';

        // Get exchange rate for this order's currency (cache rates per order currency)
        let exchangeRate = 1;
        if (orderCurrency !== targetCurrency) {
          exchangeRate = await currencyUtils.getExchangeRate(organizationId, orderCurrency, targetCurrency) || 1;
        }

        for (const item of order.line_items) {
          // Find the product in inventory
          const product = allProducts.find(p =>
            p._id.toString() === item.inventoryId?.toString() ||
            p.product_Id?.toString() === item.product_id ||
            p.sku === item.product_id
          );

          if (product) {
            const stockStatus = product.stock_status || 'unknown';
            if (!stockStatusSales[stockStatus]) {
              stockStatusSales[stockStatus] = 0;
            }
            // Convert subtotal to target currency before adding
            const subtotalInTargetCurrency = (parseFloat(item.subtotal) || 0) * exchangeRate;
            stockStatusSales[stockStatus] += subtotalInTargetCurrency;
          }
        }
      }
    }

    // Convert to array format for pie chart
    const stockStatusData = Object.keys(stockStatusCounts).map(stockStatus => {
      const count = stockStatusCounts[stockStatus];
      const sales = stockStatusSales[stockStatus] || 0;
      const percentage = allProducts.length > 0 ? (count / allProducts.length) * 100 : 0;
      
      // Generate appropriate colors for stock status
      const stockStatusColors = {
        'instock': '#10b981',      // Green for in stock
        'outofstock': '#ef4444',   // Red for out of stock
        'onbackorder': '#f59e0b',  // Orange for backorder
        'unknown': '#6b7280'       // Gray for unknown
      };
      
      // Format the display name
      const displayNames = {
        'instock': 'In Stock',
        'outofstock': 'Out of Stock',
        'onbackorder': 'On Backorder',
        'unknown': 'Unknown'
      };
      
      return {
        name: displayNames[stockStatus] || stockStatus,
        value: count,
        sales: sales,
        percentage: percentage,
        color: stockStatusColors[stockStatus] || '#6b7280',
        status: stockStatus
      };
    }).sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      data: stockStatusData
    });
  } catch (error) {
    console.error('Stock Status Distribution Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get stock status distribution"
    });
  }
};

/**
 * @swagger
 * /api/overview/product-categories-distribution/{userId}:
 *   get:
 *     summary: Get product categories distribution for pie chart visualization
 *     tags: [Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get organization context
 *     responses:
 *       200:
 *         description: Product categories distribution data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Category name
 *                         example: "Electronics"
 *                       value:
 *                         type: number
 *                         description: Number of products in this category
 *                         example: 45
 *                       sales:
 *                         type: number
 *                         description: Total sales for products in this category
 *                         example: 25000.50
 *                       percentage:
 *                         type: number
 *                         description: Percentage of total products
 *                         example: 30.0
 *                       color:
 *                         type: string
 *                         description: Color code for chart visualization
 *                         example: "#3b82f6"
 *       400:
 *         description: Bad request - Missing userId or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get product categories distribution"
 */
// Get product categories distribution for pie chart
exports.getProductCategoriesDistribution = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayCurrency } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // Get organizationId from userId
    const organizationId = await getOrganizationIdFromUserId(userId);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "User not found or no organization associated"
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Determine display currency for conversion
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Get all products for the organization
    const allProducts = await safeQuery(async () => {
      return await Inventory.find({
        organizationId: orgId
      }).lean();
    }, []);

    // Calculate categories distribution
    const categoryCounts = {};
    const categorySales = {};

    allProducts.forEach(product => {
      if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
        product.categories.forEach(category => {
          const categoryName = category.name;

          // Count products per category
          if (!categoryCounts[categoryName]) {
            categoryCounts[categoryName] = 0;
          }
          categoryCounts[categoryName]++;
        });
      } else {
        // Handle products without categories
        const uncategorized = 'Uncategorized';
        if (!categoryCounts[uncategorized]) {
          categoryCounts[uncategorized] = 0;
        }
        categoryCounts[uncategorized]++;
      }
    });

    // Get orders to calculate sales by category
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Calculate sales by category with currency conversion
    for (const order of allOrders) {
      if (order.line_items && Array.isArray(order.line_items)) {
        const orderCurrency = order.currency || 'USD';

        // Get exchange rate for this order's currency
        let exchangeRate = 1;
        if (orderCurrency !== targetCurrency) {
          exchangeRate = await currencyUtils.getExchangeRate(organizationId, orderCurrency, targetCurrency) || 1;
        }

        for (const item of order.line_items) {
          // Find the product in inventory
          const product = allProducts.find(p =>
            p._id.toString() === item.inventoryId?.toString() ||
            p.product_Id?.toString() === item.product_id ||
            p.sku === item.product_id
          );

          if (product && product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
            const subtotalInTargetCurrency = (parseFloat(item.subtotal) || 0) * exchangeRate;
            product.categories.forEach(category => {
              const categoryName = category.name;
              if (!categorySales[categoryName]) {
                categorySales[categoryName] = 0;
              }
              categorySales[categoryName] += subtotalInTargetCurrency;
            });
          } else {
            // Handle products without categories
            const uncategorized = 'Uncategorized';
            if (!categorySales[uncategorized]) {
              categorySales[uncategorized] = 0;
            }
            const subtotalInTargetCurrency = (parseFloat(item.subtotal) || 0) * exchangeRate;
            categorySales[uncategorized] += subtotalInTargetCurrency;
          }
        }
      }
    }

    // Convert to array format for pie chart
    const categoriesData = Object.keys(categoryCounts).map(categoryName => {
      const count = categoryCounts[categoryName];
      const sales = categorySales[categoryName] || 0;
      const percentage = allProducts.length > 0 ? (count / allProducts.length) * 100 : 0;
      
      // Generate a consistent color based on category name
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ];
      const colorIndex = categoryName.length % colors.length;
      
      return {
        name: categoryName,
        value: count,
        sales: sales,
        percentage: percentage,
        color: colors[colorIndex]
      };
    });

    // Sort by count (descending) and limit to top 8 categories
    const sortedCategories = categoriesData
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    res.json({
      success: true,
      data: sortedCategories
    });
  } catch (error) {
    console.error('Product Categories Distribution Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get product categories distribution"
    });
  }
};
