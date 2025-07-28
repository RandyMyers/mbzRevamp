/**
 * Store Overview Controller - Handles store overview analytics
 * 
 * This controller provides dedicated analytics for the stores overview tab including:
 * - Store statistics and metrics
 * - Store alerts and notifications
 * - Store performance comparison
 * - Revenue trends by store
 * 
 * Features:
 * - Multi-currency support
 * - Real-time alert detection
 * - Cross-store performance analysis
 * - Time-based trend analysis
 */

const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const Store = require('../models/store');
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

// Helper function to get date range for time periods
const getDateRange = (timeRange = '30d') => {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '12m':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

// Helper function to get previous period for comparison
const getPreviousPeriod = (startDate, endDate) => {
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime());
  const previousStartDate = new Date(startDate.getTime() - duration);
  
  return { previousStartDate, previousEndDate };
};

// 1. Store Stats - Basic store metrics
exports.getStoreStats = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d', userId, displayCurrency } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const startDate = getDateRange(timeRange);
    const endDate = new Date();
    const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, endDate);
    
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Current period stats
    const currentStats = await Promise.all([
      // Store count
      safeQuery(() => Store.countDocuments({ organizationId: new mongoose.Types.ObjectId(organizationId) })),
      // Active stores
      safeQuery(() => Store.countDocuments({ 
        organizationId: new mongoose.Types.ObjectId(organizationId), 
        isActive: true 
      })),
      // Total orders
      safeQuery(() => Order.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'refunded'] }
      })),
      // Total customers
      safeQuery(() => Customer.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: { $gte: startDate, $lte: endDate }
      })),
      // Total products
      safeQuery(() => Inventory.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }))
    ]);

    // Previous period stats for comparison
    const previousStats = await Promise.all([
      safeQuery(() => Store.countDocuments({ organizationId: new mongoose.Types.ObjectId(organizationId) })),
      safeQuery(() => Store.countDocuments({ 
        organizationId: new mongoose.Types.ObjectId(organizationId), 
        isActive: true 
      })),
      safeQuery(() => Order.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: { $gte: previousStartDate, $lt: startDate },
        status: { $nin: ['cancelled', 'refunded'] }
      })),
      safeQuery(() => Customer.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: { $gte: previousStartDate, $lt: startDate }
      })),
      safeQuery(() => Inventory.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }))
    ]);

    // Revenue calculation with multi-currency support
    let currentRevenue = 0;
    let previousRevenue = 0;

    try {
      const currentRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
        organizationId,
        targetCurrency,
        { date_created: { $gte: startDate, $lte: endDate } }
      );
      const currentRevenueResults = await Order.aggregate(currentRevenuePipeline);
      const currentRevenueSummary = await currencyUtils.processMultiCurrencyResults(
        currentRevenueResults, 
        targetCurrency, 
        organizationId
      );
      currentRevenue = currentRevenueSummary.totalConverted;
    } catch (error) {
      console.error('Error calculating current revenue:', error);
    }

    try {
      const previousRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
        organizationId,
        targetCurrency,
        { date_created: { $gte: previousStartDate, $lt: startDate } }
      );
      const previousRevenueResults = await Order.aggregate(previousRevenuePipeline);
      const previousRevenueSummary = await currencyUtils.processMultiCurrencyResults(
        previousRevenueResults, 
        targetCurrency, 
        organizationId
      );
      previousRevenue = previousRevenueSummary.totalConverted;
    } catch (error) {
      console.error('Error calculating previous revenue:', error);
    }

    // Calculate growth rates
    const calculateGrowth = (current, previous) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    };

    res.json({
      success: true,
      data: {
        storeCount: {
          current: currentStats[0],
          previous: previousStats[0],
          growth: calculateGrowth(currentStats[0], previousStats[0])
        },
        activeStores: {
          current: currentStats[1],
          previous: previousStats[1],
          growth: calculateGrowth(currentStats[1], previousStats[1])
        },
        totalRevenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: calculateGrowth(currentRevenue, previousRevenue),
          currency: targetCurrency
        },
        totalOrders: {
          current: currentStats[2],
          previous: previousStats[2],
          growth: calculateGrowth(currentStats[2], previousStats[2])
        },
        totalCustomers: {
          current: currentStats[3],
          previous: previousStats[3],
          growth: calculateGrowth(currentStats[3], previousStats[3])
        },
        totalProducts: {
          current: currentStats[4],
          previous: previousStats[4],
          growth: calculateGrowth(currentStats[4], previousStats[4])
        }
      }
    });

  } catch (error) {
    console.error('Store Stats Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch store statistics"
    });
  }
};

// 2. Store Alerts - Notifications and warnings
exports.getStoreAlerts = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const alerts = [];

    // Check for stores with old sync dates (>24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const storesWithOldSync = await Store.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: true,
      $or: [
        { lastSyncDate: { $lt: twentyFourHoursAgo } },
        { lastSyncDate: { $exists: false } }
      ]
    });

    storesWithOldSync.forEach(store => {
      alerts.push({
        type: "sync_warning",
        severity: "medium",
        message: `Store '${store.name}' hasn't synced in over 24 hours`,
        storeId: store._id,
        storeName: store.name,
        lastSyncDate: store.lastSyncDate
      });
    });

    // Check for inactive stores
    const inactiveStores = await Store.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: false
    });

    inactiveStores.forEach(store => {
      alerts.push({
        type: "inactive_store",
        severity: "low",
        message: `Store '${store.name}' is inactive`,
        storeId: store._id,
        storeName: store.name
      });
    });

    // Check for low stock items
    const lowStockItems = await Inventory.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      stock_quantity: { $lt: 10 }, // Low stock threshold
      stock_status: { $ne: 'outofstock' }
    });

    if (lowStockItems.length > 0) {
      alerts.push({
        type: "low_stock",
        severity: "high",
        message: `${lowStockItems.length} products are running low on stock`,
        productCount: lowStockItems.length,
        products: lowStockItems.map(item => ({
          id: item._id,
          name: item.name,
          stock: item.stock_quantity
        }))
      });
    }

    // Check for failed syncs (orders with sync errors)
    const failedOrderSyncs = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      syncError: { $exists: true, $ne: null }
    });

    if (failedOrderSyncs > 0) {
      alerts.push({
        type: "sync_error",
        severity: "high",
        message: `${failedOrderSyncs} orders have sync errors`,
        errorCount: failedOrderSyncs
      });
    }

    // Check for failed customer syncs
    const failedCustomerSyncs = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      syncError: { $exists: true, $ne: null }
    });

    if (failedCustomerSyncs > 0) {
      alerts.push({
        type: "sync_error",
        severity: "high",
        message: `${failedCustomerSyncs} customers have sync errors`,
        errorCount: failedCustomerSyncs
      });
    }

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Store Alerts Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch store alerts"
    });
  }
};

// 3. Store Performance Comparison - Store comparison chart (Time series data)
exports.getStorePerformanceComparison = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d', userId, displayCurrency } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const startDate = getDateRange(timeRange);
    const endDate = new Date();
    
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Get all stores for the organization
    const stores = await Store.find({
      organizationId: new mongoose.Types.ObjectId(organizationId)
    }).select('_id name platformType isActive');

    if (stores.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: {
          totalStores: 0,
          totalRevenue: 0,
          currency: targetCurrency
        }
      });
    }

    // Generate date range for the time period
    const dateRange = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get daily sales data for each store
    const storeSalesData = {};
    const storeSummary = {};

    for (const store of stores) {
      const storeId = store._id;
      const storeName = store.name;
      
      // Initialize store data
      storeSalesData[storeName] = {};
      storeSummary[storeName] = {
        storeId: storeId,
        storeName: storeName,
        platformType: store.platformType,
        isActive: store.isActive,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0
      };

      // Get daily sales for this store
      const dailySalesPipeline = [
        {
          $match: {
            storeId: storeId,
            date_created: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date_created" }
            },
            dailyRevenue: { $sum: "$total" },
            dailyOrders: { $sum: 1 },
            dailyCustomers: { $addToSet: "$customer_id" }
          }
        },
        {
          $project: {
            date: "$_id",
            dailyRevenue: 1,
            dailyOrders: 1,
            dailyCustomers: { $size: "$dailyCustomers" }
          }
        },
        { $sort: { date: 1 } }
      ];

      const dailySales = await Order.aggregate(dailySalesPipeline);

      // Fill in missing dates with 0
      for (const date of dateRange) {
        const dateStr = date.toISOString().split('T')[0];
        const dayData = dailySales.find(d => d.date === dateStr);
        
        storeSalesData[storeName][dateStr] = {
          revenue: dayData ? dayData.dailyRevenue : 0,
          orders: dayData ? dayData.dailyOrders : 0,
          customers: dayData ? dayData.dailyCustomers : 0
        };

        // Accumulate summary data
        storeSummary[storeName].totalRevenue += storeSalesData[storeName][dateStr].revenue;
        storeSummary[storeName].totalOrders += storeSalesData[storeName][dateStr].orders;
        storeSummary[storeName].totalCustomers += storeSalesData[storeName][dateStr].customers;
      }

      // Calculate average order value
      if (storeSummary[storeName].totalOrders > 0) {
        storeSummary[storeName].avgOrderValue = storeSummary[storeName].totalRevenue / storeSummary[storeName].totalOrders;
      }
    }

    // Convert to time series format for chart
    const chartData = dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dataPoint = { date: dateStr };
      
      // Add each store's revenue for this date
      for (const storeName in storeSalesData) {
        dataPoint[storeName] = storeSalesData[storeName][dateStr].revenue;
      }
      
      return dataPoint;
    });

    // Calculate overall summary
    const totalRevenue = Object.values(storeSummary).reduce((sum, store) => sum + store.totalRevenue, 0);
    const totalOrders = Object.values(storeSummary).reduce((sum, store) => sum + store.totalOrders, 0);
    const totalCustomers = Object.values(storeSummary).reduce((sum, store) => sum + store.totalCustomers, 0);

    res.json({
      success: true,
      data: chartData,
      summary: {
        totalStores: stores.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalCustomers,
        averageRevenue: stores.length > 0 ? Math.round((totalRevenue / stores.length) * 100) / 100 : 0,
        currency: targetCurrency,
        stores: Object.values(storeSummary)
      }
    });

  } catch (error) {
    console.error('Store Performance Comparison Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch store performance comparison"
    });
  }
};

// 4. Store Revenue Trends - Time-based revenue trends
exports.getStoreRevenueTrends = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d', userId, displayCurrency } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const startDate = getDateRange(timeRange);
    const endDate = new Date();
    const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, endDate);
    
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Daily trends
    const dailyTrends = await Order.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date_created" } },
          revenue: { $sum: { $toDouble: "$total" } },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Monthly trends
    const monthlyTrends = await Order.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date_created" } },
          revenue: { $sum: { $toDouble: "$total" } },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate growth rates
    const currentPeriodRevenue = dailyTrends.reduce((sum, day) => sum + day.revenue, 0);
    const currentPeriodOrders = dailyTrends.reduce((sum, day) => sum + day.orders, 0);

    const previousPeriodRevenue = await safeQuery(async () => {
      const result = await Order.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            date_created: { $gte: previousStartDate, $lt: startDate },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $toDouble: "$total" } },
            orders: { $sum: 1 }
          }
        }
      ]);
      return result[0] || { revenue: 0, orders: 0 };
    });

    const calculateGrowth = (current, previous) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    };

    res.json({
      success: true,
      data: {
        daily: dailyTrends.map(day => ({
          date: day._id,
          revenue: day.revenue,
          orders: day.orders
        })),
        monthly: monthlyTrends.map(month => ({
          month: month._id,
          revenue: month.revenue,
          orders: month.orders
        })),
        growth: {
          revenue: calculateGrowth(currentPeriodRevenue, previousPeriodRevenue.revenue),
          orders: calculateGrowth(currentPeriodOrders, previousPeriodRevenue.orders)
        },
        currency: targetCurrency
      }
    });

  } catch (error) {
    console.error('Store Revenue Trends Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch store revenue trends"
    });
  }
}; 