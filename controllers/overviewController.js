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
exports.getOverviewStats = async (req, res) => {
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
    
    // Determine display currency
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Get all orders for the organization (no date filter)
    const allOrders = await safeQuery(async () => {
      return await Order.find({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }).lean();
    }, []);

    // Get all customers for the organization (no date filter)
    const allCustomers = await safeQuery(async () => {
      return await Customer.find({
        organizationId: orgId
      }).lean();
    }, []);

    // Get all products for the organization (no date filter)
    const allProducts = await safeQuery(async () => {
      return await Inventory.find({
        organizationId: orgId
      }).lean();
    }, []);
    
    console.log(`Found ${allProducts.length} products in inventory for organization ${orgId}`);
    console.log('Sample products:', allProducts.slice(0, 3).map(p => ({ 
      name: p.name, 
      product_Id: p.product_Id, 
      sku: p.sku, 
      hasImages: p.images && p.images.length > 0,
      imageCount: p.images ? p.images.length : 0
    })));
    
    // Check how many products have images
    const productsWithImages = allProducts.filter(p => p.images && p.images.length > 0);
    console.log(`Products with images: ${productsWithImages.length}/${allProducts.length}`);
    if (productsWithImages.length > 0) {
      console.log('Sample products with images:', productsWithImages.slice(0, 2).map(p => ({
        name: p.name,
        product_Id: p.product_Id,
        sku: p.sku,
        imageSrc: p.images[0].src
      })));
    }

    // Calculate total revenue with multi-currency support
    let totalRevenue = 0;
    let revenueBreakdown = {};
    
    try {
      const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(organizationId);
      const revenueResults = await Order.aggregate(revenuePipeline);
      const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency);
      totalRevenue = revenueSummary.totalConverted || 0;
      revenueBreakdown = revenueSummary.currencyBreakdown || {};
    } catch (error) {
      console.error('Revenue calculation error:', error);
      // Fallback to simple sum if currency conversion fails
      totalRevenue = allOrders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total);
        return sum + (isNaN(orderTotal) ? 0 : orderTotal);
      }, 0);
    }

    // Calculate total orders
    const totalOrders = allOrders.length;

    // Calculate total customers
    const totalCustomers = allCustomers.length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate order sources breakdown
    const orderSources = allOrders.reduce((acc, order) => {
      const source = order.created_via || 'manual';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Get order status distribution
    const orderStatusDistribution = allOrders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate product categories distribution
    const categoryCounts = {};

    allProducts.forEach(product => {
      if (product.categories && product.categories.length > 0) {
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

    // Calculate stock status distribution
    const stockStatusCounts = {};

    allProducts.forEach(product => {
      const stockStatus = product.stock_status || 'unknown';
      
      // Count products per stock status
      if (!stockStatusCounts[stockStatus]) {
        stockStatusCounts[stockStatus] = 0;
      }
      stockStatusCounts[stockStatus]++;
    });

    // Calculate sales impact by stock status with multi-currency support
    const stockStatusSales = {};
    
    // Create a map of product IDs to stock status for faster lookup
    const productStockStatusMap = {};
    allProducts.forEach(product => {
      const stockStatus = product.stock_status || 'unknown';
      productStockStatusMap[product._id.toString()] = stockStatus;
      productStockStatusMap[product.product_Id?.toString()] = stockStatus;
      productStockStatusMap[product.sku] = stockStatus;
    });

    // Calculate sales by stock status with currency conversion
    for (const order of allOrders) {
      if (order.line_items) {
        for (const item of order.line_items) {
          // Find the product stock status
          const productId = item.inventoryId?.toString() || item.product_id?.toString();
          const stockStatus = productStockStatusMap[productId] || 'unknown';
          
          if (!stockStatusSales[stockStatus]) {
            stockStatusSales[stockStatus] = 0;
          }
          
          // Convert item subtotal to target currency
          const itemSubtotal = parseFloat(item.subtotal) || 0;
          const orderCurrency = order.currency || 'USD';
          
          if (orderCurrency === targetCurrency) {
            stockStatusSales[stockStatus] += itemSubtotal;
          } else {
            try {
              const convertedAmount = await currencyUtils.convertCurrency(
                itemSubtotal, 
                orderCurrency, 
                targetCurrency, 
                organizationId
              );
              stockStatusSales[stockStatus] += convertedAmount;
            } catch (error) {
              console.error(`Currency conversion error for order ${order._id}:`, error);
              // Fallback to original amount
              stockStatusSales[stockStatus] += itemSubtotal;
            }
          }
        }
      }
    }

    // Calculate sales by category with multi-currency support
    const categorySales = {};
    
    // Create a map of product IDs to categories for faster lookup
    const productCategoryMap = {};
    allProducts.forEach(product => {
      const categories = product.categories && product.categories.length > 0 
        ? product.categories.map(cat => cat.name) 
        : ['Uncategorized'];
      productCategoryMap[product._id.toString()] = categories;
      productCategoryMap[product.product_Id?.toString()] = categories;
      productCategoryMap[product.sku] = categories;
    });

    // Calculate sales by category with currency conversion
    for (const order of allOrders) {
      if (order.line_items) {
        for (const item of order.line_items) {
          // Find the product categories
          const productId = item.inventoryId?.toString() || item.product_id?.toString();
          const categories = productCategoryMap[productId] || ['Uncategorized'];
          
          // Convert item subtotal to target currency
          const itemSubtotal = parseFloat(item.subtotal) || 0;
          const orderCurrency = order.currency || 'USD';
          let convertedSubtotal = itemSubtotal;
          
          if (orderCurrency !== targetCurrency) {
            try {
              convertedSubtotal = await currencyUtils.convertCurrency(
                itemSubtotal, 
                orderCurrency, 
                targetCurrency, 
                organizationId
              );
            } catch (error) {
              console.error(`Currency conversion error for order ${order._id}:`, error);
              // Fallback to original amount
              convertedSubtotal = itemSubtotal;
            }
          }
          
          // Add to each category
          categories.forEach(categoryName => {
            if (!categorySales[categoryName]) {
              categorySales[categoryName] = 0;
            }
            categorySales[categoryName] += convertedSubtotal;
          });
        }
      }
    }

    // Convert to array format for pie chart
    const productCategoriesDistribution = Object.keys(categoryCounts).map(categoryName => {
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
    }).sort((a, b) => b.value - a.value).slice(0, 8);

    // Convert stock status to array format for pie chart
    const stockStatusDistribution = Object.keys(stockStatusCounts).map(stockStatus => {
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

    console.log('Stock Status Distribution:', stockStatusDistribution);
    console.log('Stock Status Counts:', stockStatusCounts);
    console.log('Stock Status Sales:', stockStatusSales);

    // Get top products by sales with multi-currency support
    const productSales = {};
    
    for (const order of allOrders) {
      if (order.line_items) {
        for (const item of order.line_items) {
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
            const subtotal = parseFloat(item.subtotal) || 0;
            const orderCurrency = order.currency || 'USD';
            
            productSales[productId].quantity += quantity;
            
            // Convert subtotal to target currency
            if (orderCurrency === targetCurrency) {
              productSales[productId].revenue += subtotal * quantity;
            } else {
              try {
                const convertedSubtotal = await currencyUtils.convertCurrency(
                  subtotal, 
                  orderCurrency, 
                  targetCurrency, 
                  organizationId
                );
                productSales[productId].revenue += convertedSubtotal * quantity;
              } catch (error) {
                console.error(`Currency conversion error for product ${productId}:`, error);
                // Fallback to original amount
                productSales[productId].revenue += subtotal * quantity;
              }
            }
          }
        }
      }
    }

    // Convert to array and sort by revenue
    const topProductsArray = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log('Top products before image lookup:', topProductsArray.map(p => ({
      name: p.name,
      productId: p.productId,
      isInventoryId: p.isInventoryId,
      revenue: p.revenue
    })));

    // Fetch product details including images for top products
    const topProducts = await Promise.all(
      topProductsArray.map(async (product) => {
        try {
          let inventoryProduct = null;
          
          console.log(`Processing product: ${product.name}, productId: ${product.productId}, isInventoryId: ${product.isInventoryId}`);
          
          // If we have a proper inventoryId (ObjectId), use findById
          if (product.isInventoryId && mongoose.Types.ObjectId.isValid(product.productId)) {
            inventoryProduct = await Inventory.findById(product.productId).lean();
            console.log(`Found product by inventoryId: ${product.productId}`, inventoryProduct ? 'SUCCESS' : 'NOT FOUND');
          } else {
            // Otherwise, try to find by product_id or other fields with organization filter
            const searchQuery = {
              organizationId: orgId,
              $or: [
                { product_Id: parseInt(product.productId) || product.productId },
                { sku: product.productId },
                { name: { $regex: product.name, $options: 'i' } }
              ]
            };
            console.log('Search query:', JSON.stringify(searchQuery, null, 2));
            inventoryProduct = await Inventory.findOne(searchQuery).lean();
            console.log(`Found product by other fields: ${product.productId} (${product.name})`, inventoryProduct ? 'SUCCESS' : 'NOT FOUND');
          }
          
          if (inventoryProduct && inventoryProduct.images && inventoryProduct.images.length > 0) {
            console.log(`Product ${product.name} has ${inventoryProduct.images.length} images, using: ${inventoryProduct.images[0].src}`);
            return {
              ...product,
              image: inventoryProduct.images[0].src,
              id: product.productId
            };
          } else {
            // Try one more search without organization filter as fallback
            if (!product.isInventoryId) {
              console.log(`Trying fallback search without organization filter for: ${product.name}`);
              const fallbackSearchQuery = {
                $or: [
                  { product_Id: parseInt(product.productId) || product.productId },
                  { sku: product.productId },
                  { name: { $regex: product.name, $options: 'i' } }
                ]
              };
              console.log('Fallback search query:', JSON.stringify(fallbackSearchQuery, null, 2));
              const fallbackProduct = await Inventory.findOne(fallbackSearchQuery).lean();
              console.log(`Fallback search result for ${product.name}:`, fallbackProduct ? 'FOUND' : 'NOT FOUND');
              
              if (fallbackProduct && fallbackProduct.images && fallbackProduct.images.length > 0) {
                console.log(`Product ${product.name} found via fallback, has ${fallbackProduct.images.length} images, using: ${fallbackProduct.images[0].src}`);
                return {
                  ...product,
                  image: fallbackProduct.images[0].src,
                  id: product.productId
                };
              }
            }
            
            // Final fallback to placeholder image
            console.log(`Product ${product.name} has no images, using placeholder`);
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

    // Get recent orders (last 5)
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
      .slice(0, 5)
      .map(order => ({
        id: order._id,
        orderId: order.number || order._id,
        customer: order.billing ? `${order.billing.first_name} ${order.billing.last_name}` : 'Unknown',
        product: order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Unknown',
        status: order.status || 'unknown',
        amount: order.total || '0',
        date: order.date_created
      }));

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
      data: {
        // Stats
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        currency: targetCurrency,
        revenueBreakdown,
        
        // Charts and breakdowns
        salesTrend,
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
      customer: order.billing ? `${order.billing.first_name} ${order.billing.last_name}` : 'Unknown',
      product: order.line_items && order.line_items.length > 0 ? order.line_items[0].name : 'Unknown',
      status: order.status || 'unknown',
      amount: order.total || '0',
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

    // Calculate sales impact by stock status
    allOrders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
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
            stockStatusSales[stockStatus] += parseFloat(item.subtotal) || 0;
          }
        });
      }
    });

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
    const allProducts = await safeQuery(async () => {
      return await Inventory.find({
        organizationId: orgId
      }).lean();
    }, []);

    // Calculate categories distribution
    const categoryCounts = {};
    const categorySales = {};

    allProducts.forEach(product => {
      if (product.categories && product.categories.length > 0) {
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

    // Calculate sales by category
    allOrders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          // Find the product in inventory
          const product = allProducts.find(p => 
            p._id.toString() === item.inventoryId?.toString() ||
            p.product_Id?.toString() === item.product_id ||
            p.sku === item.product_id
          );

          if (product && product.categories && product.categories.length > 0) {
            product.categories.forEach(category => {
              const categoryName = category.name;
              if (!categorySales[categoryName]) {
                categorySales[categoryName] = 0;
              }
              categorySales[categoryName] += parseFloat(item.subtotal) || 0;
            });
          } else {
            // Handle products without categories
            const uncategorized = 'Uncategorized';
            if (!categorySales[uncategorized]) {
              categorySales[uncategorized] = 0;
            }
            categorySales[uncategorized] += parseFloat(item.subtotal) || 0;
          }
        });
      }
    });

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
