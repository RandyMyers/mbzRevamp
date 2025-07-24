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

// Get overview statistics - fetch all data without date filters
exports.getOverviewStats = async (req, res) => {
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

    // Calculate total revenue with better error handling
    const totalRevenue = allOrders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.total);
      return sum + (isNaN(orderTotal) ? 0 : orderTotal);
    }, 0);

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
        
                 // Charts and breakdowns
         salesTrend,
         orderSources,
         orderStatusDistribution,
         productCategoriesDistribution,
         stockStatusDistribution,
         topProducts,
         recentOrders,
        
        // Raw data for frontend filtering
        allOrders,
        allCustomers,
        allProducts
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