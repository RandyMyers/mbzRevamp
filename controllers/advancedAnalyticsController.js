const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const currencyUtils = require('../utils/currencyUtils');
const mongoose = require('mongoose');

// Helper: get date range for period
const getDateRange = (period) => {
  if (!period || period === 'all') return null;
  const now = new Date();
  switch (period) {
    case 'day': return [new Date(now.getFullYear(), now.getMonth(), now.getDate()), now];
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return [start, now];
    }
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return [start, now];
    }
    case 'year': return [new Date(now.getFullYear(), 0, 1), now];
    default: return null;
  }
};

// Helper to build date filter
const buildDateFilter = (period) => {
  const range = getDateRange(period);
  if (!range) return {};
  return { date_created: { $gte: range[0], $lte: range[1] } };
};

/**
 * @swagger
 * /api/advanced-analytics/total-revenue:
 *   get:
 *     summary: Get total revenue by time period with multi-currency support
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for revenue calculation
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID for currency preferences
 *       - in: query
 *         name: displayCurrency
 *         schema:
 *           type: string
 *         description: Currency code for displaying amounts (e.g., USD, EUR)
 *     responses:
 *       200:
 *         description: Total revenue data retrieved successfully
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
 *                     currency:
 *                       type: string
 *                       description: Display currency code
 *                       example: "USD"
 *                     currencyBreakdown:
 *                       type: object
 *                       description: Revenue breakdown by original currency
 *       400:
 *         description: Bad request - Missing required parameters
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
// 1. Total Revenue by period
exports.totalRevenueByPeriod = async (req, res) => {
  try {
    const { organizationId, period, userId, displayCurrency } = req.query;
    const dateFilter = buildDateFilter(period);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency revenue aggregation with time filter
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId, 
      targetCurrency, 
      { ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } }
    );
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency, organizationId);

    res.json({ 
      success: true, 
      data: { 
        totalRevenue: revenueSummary.totalConverted,
        currency: revenueSummary.targetCurrency,
        currencyBreakdown: revenueSummary.currencyBreakdown
      } 
    });
  } catch (error) {
    console.error('Total Revenue by Period Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/revenue-by-product:
 *   get:
 *     summary: Get revenue breakdown by product with multi-currency support
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for revenue calculation
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID for currency preferences
 *       - in: query
 *         name: displayCurrency
 *         schema:
 *           type: string
 *         description: Currency code for displaying amounts (e.g., USD, EUR)
 *     responses:
 *       200:
 *         description: Revenue by product data retrieved successfully
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
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                         description: Product inventory ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         description: Product name
 *                         example: "Premium Widget"
 *                       sales:
 *                         type: number
 *                         description: Converted sales amount in display currency
 *                         example: 5000.75
 *                       quantity:
 *                         type: number
 *                         description: Total quantity sold
 *                         example: 100
 *                       originalSales:
 *                         type: number
 *                         description: Original sales amount in original currency
 *                         example: 4500.00
 *                       originalCurrency:
 *                         type: string
 *                         description: Original currency code
 *                         example: "EUR"
 *                       convertedCurrency:
 *                         type: string
 *                         description: Display currency code
 *                         example: "USD"
 *                 currency:
 *                   type: string
 *                   description: Display currency code
 *                   example: "USD"
 *       400:
 *         description: Bad request - Missing required parameters
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
// 2. Revenue by Product
exports.revenueByProduct = async (req, res) => {
  try {
    const { organizationId, period, userId, displayCurrency } = req.query;
    const dateFilter = buildDateFilter(period);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] }
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.inventoryId",
        sales: { $sum: { $multiply: ["$line_items.quantity", { $toDouble: "$line_items.subtotal" }] } },
        quantity: { $sum: "$line_items.quantity" },
        currency: { $first: "$currency" }
      }},
      { $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        sales: 1,
        quantity: 1,
        currency: 1
      }},
      { $sort: { sales: -1 } }
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
      data: convertedProducts,
      currency: targetCurrency
    });
  } catch (error) {
    console.error('Revenue by Product Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/order-status-distribution:
 *   get:
 *     summary: Get order status distribution by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for order analysis
 *     responses:
 *       200:
 *         description: Order status distribution data retrieved successfully
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
 *                       _id:
 *                         type: string
 *                         description: Order status
 *                         example: "completed"
 *                       count:
 *                         type: number
 *                         description: Number of orders with this status
 *                         example: 150
 *       400:
 *         description: Bad request - Missing required parameters
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
// 3. Order Status Distribution
exports.orderStatusDistribution = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter
      }},
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }}
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/new-vs-returning-customers:
 *   get:
 *     summary: Get new vs returning customers analysis by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for customer analysis
 *     responses:
 *       200:
 *         description: New vs returning customers data retrieved successfully
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
 *                     new:
 *                       type: number
 *                       description: Number of new customers in the period
 *                       example: 25
 *                     returning:
 *                       type: number
 *                       description: Number of returning customers in the period
 *                       example: 75
 *       400:
 *         description: Bad request - Missing required parameters
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
// Improved New vs. Returning Customers
exports.newVsReturningCustomers = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);

    // Find all customers who placed orders in this period
    const ordersInPeriod = await Order.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: { $nin: ['cancelled', 'refunded'] }
    }).select('customerId date_created');

    const customerIdsInPeriod = [...new Set(ordersInPeriod.map(o => o.customerId?.toString()).filter(Boolean))];

    // Find first order date for each customer
    const firstOrders = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), customerId: { $in: customerIdsInPeriod.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$customerId", firstOrder: { $min: "$date_created" } } }
    ]);

    const periodRange = getDateRange(period);
    const periodStart = periodRange ? periodRange[0] : new Date(0);
    const periodEnd = periodRange ? periodRange[1] : new Date();

    let newCount = 0, returningCount = 0;
    for (const fo of firstOrders) {
      if (fo.firstOrder >= periodStart && fo.firstOrder <= periodEnd) {
        newCount++;
      } else {
        returningCount++;
      }
    }

    res.json({ success: true, data: { new: newCount, returning: returningCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/acquisition-sources:
 *   get:
 *     summary: Get customer acquisition sources analysis by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for acquisition analysis
 *     responses:
 *       200:
 *         description: Acquisition sources data retrieved successfully
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
 *                         description: Customer acquisition source
 *                         example: "WooCommerce"
 *                       customers:
 *                         type: number
 *                         description: Number of customers from this source
 *                         example: 45
 *                       percentage:
 *                         type: number
 *                         description: Percentage of total customers
 *                         example: 60
 *       400:
 *         description: Bad request - Missing required parameters
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
// Improved Acquisition Sources (unique customers)
exports.acquisitionSources = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);

    // Get unique customers and their first order in the period
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $sort: { date_created: 1 } },
      { $group: { _id: "$customerId", created_via: { $first: "$created_via" } } },
      { $group: { _id: "$created_via", customers: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);

    // Calculate percentages
    const total = result.reduce((sum, src) => sum + src.customers, 0);
    const sources = result.map(src => ({
      source: src._id || 'Direct',
      customers: src.customers,
      percentage: total > 0 ? Math.round((src.customers / total) * 100) : 0
    }));

    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/customer-lifetime-value:
 *   get:
 *     summary: Get customer lifetime value analysis with multi-currency support
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for LTV analysis
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID for currency preferences
 *       - in: query
 *         name: displayCurrency
 *         schema:
 *           type: string
 *         description: Currency code for displaying amounts (e.g., USD, EUR)
 *     responses:
 *       200:
 *         description: Customer lifetime value data retrieved successfully
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
 *                     lifetimeValue:
 *                       type: number
 *                       description: Average customer lifetime value in display currency
 *                       example: 1250.75
 *                     currency:
 *                       type: string
 *                       description: Display currency code
 *                       example: "USD"
 *                     customerCount:
 *                       type: number
 *                       description: Number of customers analyzed
 *                       example: 150
 *       400:
 *         description: Bad request - Missing required parameters
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
// Customer Lifetime Value (LTV)
exports.customerLifetimeValue = async (req, res) => {
  try {
    const { organizationId, period, userId, displayCurrency } = req.query;
    const dateFilter = buildDateFilter(period);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $addFields: { 
        numericTotal: { $cond: [ { $eq: [{ $type: "$total" }, "string"] }, { $toDouble: "$total" }, "$total" ] },
        orderCurrency: { $ifNull: ["$currency", "USD"] }
      } },
      { $group: { 
        _id: {
          customerId: '$customerId',
          currency: '$orderCurrency'
        }, 
        totalSpent: { $sum: "$numericTotal" } 
      } },
      { $group: { 
        _id: "$_id.customerId",
        spendingByCurrency: {
          $push: {
            currency: "$_id.currency",
            amount: "$totalSpent"
          }
        }
      } }
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
    console.error('Customer Lifetime Value Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/repeat-purchase-rate:
 *   get:
 *     summary: Get repeat purchase rate analysis by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for repeat purchase analysis
 *     responses:
 *       200:
 *         description: Repeat purchase rate data retrieved successfully
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
 *                     repeatPurchaseRate:
 *                       type: number
 *                       description: Percentage of customers who made repeat purchases
 *                       example: 35.5
 *                     totalCustomers:
 *                       type: number
 *                       description: Total number of customers analyzed
 *                       example: 200
 *                     repeatCustomers:
 *                       type: number
 *                       description: Number of customers with repeat purchases
 *                       example: 71
 *       400:
 *         description: Bad request - Missing required parameters
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
// Repeat Purchase Rate
exports.repeatPurchaseRate = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    // Customers with more than 1 order in the period
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
      { $group: { _id: null, repeaters: { $sum: { $cond: [ { $gt: ["$orderCount", 1] }, 1, 0 ] } }, total: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);
    const repeatRate = result[0] && result[0].total > 0 ? (result[0].repeaters / result[0].total) * 100 : 0;
    res.json({ success: true, data: { repeatPurchaseRate: repeatRate.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/retention-cohort:
 *   get:
 *     summary: Get customer retention cohort analysis for last 6 months
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Retention cohort data retrieved successfully
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
 *                       cohort:
 *                         type: string
 *                         description: Cohort period (YYYY-MM format)
 *                         example: "2024-01"
 *                       orders:
 *                         type: number
 *                         description: Number of orders in this cohort
 *                         example: 150
 *       400:
 *         description: Bad request - Missing required parameters
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
// Retention Cohort (simple: orders per month for last 6 months)
exports.retentionCohort = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }).reverse();
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: { $nin: ['cancelled', 'refunded'] } } },
      { $project: { customerId: 1, year: { $year: "$date_created" }, month: { $month: "$date_created" } } },
      { $group: { _id: { customerId: "$customerId", year: "$year", month: "$month" }, count: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);
    // Build cohort table
    const cohorts = {};
    result.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!cohorts[key]) cohorts[key] = 0;
      cohorts[key] += r.count;
    });
    const cohortArr = months.map(m => ({ cohort: `${m.year}-${m.month}`, orders: cohorts[`${m.year}-${m.month}`] || 0 }));
    res.json({ success: true, data: cohortArr });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/geographic-distribution:
 *   get:
 *     summary: Get customer geographic distribution analysis by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for geographic analysis
 *     responses:
 *       200:
 *         description: Geographic distribution data retrieved successfully
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
 *                       city:
 *                         type: string
 *                         description: City name
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         description: State/province name
 *                         example: "NY"
 *                       country:
 *                         type: string
 *                         description: Country name
 *                         example: "USA"
 *                       customers:
 *                         type: number
 *                         description: Number of customers in this region
 *                         example: 25
 *       400:
 *         description: Bad request - Missing required parameters
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
// Improved Geographic Distribution (city, state, country, with fallbacks)
exports.geographicDistribution = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    // 1. Get all paying customers for the org
    const customers = await Customer.find({ organizationId, is_paying_customer: true });
    // 2. For each customer, get address (shipping > billing > most recent order)
    const addressMap = {};
    for (const customer of customers) {
      let address = null;
      if (customer.shipping && customer.shipping.city) {
        address = customer.shipping;
      } else if (customer.billing && customer.billing.city) {
        address = customer.billing;
      } else {
        // Fallback: get most recent order's address
        const order = await Order.findOne({ customerId: customer._id, organizationId: customer.organizationId, ...dateFilter })
          .sort({ date_created: -1 });
        if (order && order.shipping && order.shipping.city) {
          address = order.shipping;
        } else if (order && order.billing && order.billing.city) {
          address = order.billing;
        }
      }
      if (address) {
        addressMap[customer._id.toString()] = {
          city: address.city || 'Unknown',
          state: address.state || 'Unknown',
          country: address.country || 'Unknown'
        };
      }
    }
    // 3. Aggregate by city, state, country
    const regionCounts = {};
    Object.values(addressMap).forEach(addr => {
      const key = `${addr.city}|${addr.state}|${addr.country}`;
      if (!regionCounts[key]) regionCounts[key] = { city: addr.city, state: addr.state, country: addr.country, customers: 0 };
      regionCounts[key].customers++;
    });
    const result = Object.values(regionCounts).sort((a, b) => b.customers - a.customers);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/low-stock:
 *   get:
 *     summary: Get products with low stock below threshold
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 10
 *         description: Stock quantity threshold for low stock alert
 *     responses:
 *       200:
 *         description: Low stock products data retrieved successfully
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
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                         description: Product ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         description: Product name
 *                         example: "Premium Widget"
 *                       stock_quantity:
 *                         type: number
 *                         description: Current stock quantity
 *                         example: 5
 *       400:
 *         description: Bad request - Missing required parameters
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
// 7. Low Stock
exports.lowStock = async (req, res) => {
  try {
    const { organizationId, threshold = 10 } = req.query;
    const products = await Inventory.find({
      organizationId,
      stock_quantity: { $lte: Number(threshold) },
      status: 'publish'
    }).select('name stock_quantity');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/advanced-analytics/abandoned-cart-rate:
 *   get:
 *     summary: Get abandoned cart rate analysis by time period
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: all
 *         description: Time period for abandoned cart analysis
 *     responses:
 *       200:
 *         description: Abandoned cart rate data retrieved successfully
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
 *                     abandonedCartRate:
 *                       type: number
 *                       description: Percentage of abandoned carts
 *                       example: 25.5
 *                     totalCarts:
 *                       type: number
 *                       description: Total number of carts created
 *                       example: 200
 *                     abandonedCarts:
 *                       type: number
 *                       description: Number of abandoned carts
 *                       example: 51
 *       400:
 *         description: Bad request - Missing required parameters
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
// 8. Abandoned Cart Rate
exports.abandonedCartRate = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const totalCarts = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: { $in: ['draft', 'pending', 'completed'] }
    });
    const completed = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: 'completed'
    });
    const abandoned = totalCarts - completed;
    const rate = totalCarts > 0 ? (abandoned / totalCarts) * 100 : 0;
    res.json({ success: true, data: { abandoned, totalCarts, rate: rate.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Best Sellers
exports.bestSellers = async (req, res) => {
  try {
    const { organizationId, period, userId, displayCurrency } = req.query;
    const dateFilter = buildDateFilter(period);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] }
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.inventoryId",
        quantity: { $sum: "$line_items.quantity" },
        sales: { $sum: { $multiply: ["$line_items.quantity", { $toDouble: "$line_items.subtotal" }] } },
        currency: { $first: "$currency" }
      }},
      { $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        sales: 1,
        quantity: 1,
        currency: 1
      }},
      { $sort: { quantity: -1 } }
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
      data: convertedProducts,
      currency: targetCurrency
    });
  } catch (error) {
    console.error('Best Sellers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 8. Abandoned Cart Rate
exports.abandonedCartRate = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const totalCarts = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: { $in: ['draft', 'pending', 'completed'] }
    });
    const completed = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: 'completed'
    });
    const abandoned = totalCarts - completed;
    const rate = totalCarts > 0 ? (abandoned / totalCarts) * 100 : 0;
    res.json({ success: true, data: { abandoned, totalCarts, rate: rate.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Best Sellers
exports.bestSellers = async (req, res) => {
  try {
    const { organizationId, period, userId, displayCurrency } = req.query;
    const dateFilter = buildDateFilter(period);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] }
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.inventoryId",
        quantity: { $sum: "$line_items.quantity" },
        sales: { $sum: { $multiply: ["$line_items.quantity", { $toDouble: "$line_items.subtotal" }] } },
        currency: { $first: "$currency" }
      }},
      { $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        sales: 1,
        quantity: 1,
        currency: 1
      }},
      { $sort: { quantity: -1 } }
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
      data: convertedProducts,
      currency: targetCurrency
    });
  } catch (error) {
    console.error('Best Sellers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ... Add more analytics as needed ... 