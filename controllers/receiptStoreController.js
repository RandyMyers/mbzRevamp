const Receipt = require('../models/Receipt');
const Store = require('../models/store');

/**
 * Get receipts for a specific store
 */
exports.getReceiptsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get user's organization
    const userOrganizationId = req.user?.organization;
    
    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: 'User organization not found'
      });
    }

    // Verify store exists and belongs to user's organization
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (store.organizationId.toString() !== userOrganizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access stores from your organization'
      });
    }

    if (!store.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Store is not active'
      });
    }

    // Build filter object
    const filter = { 
      storeId,
      organizationId: userOrganizationId
    };
    
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const receipts = await Receipt.find(filter)
      .populate('customerId', 'name email')
      .populate('storeId', 'name platformType')
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalReceipts = await Receipt.countDocuments(filter);
    const totalPages = Math.ceil(totalReceipts / limit);

    // Calculate store-specific statistics
    const storeStats = await Receipt.aggregate([
      { $match: { storeId: store._id, organizationId: userOrganizationId } },
      {
        $group: {
          _id: null,
          totalReceipts: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          completedReceipts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingReceipts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedReceipts: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          refundedReceipts: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Store receipts retrieved successfully',
      data: {
        receipts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReceipts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        store: {
          _id: store._id,
          name: store.name,
          platformType: store.platformType,
          url: store.url
        },
        statistics: storeStats[0] || {
          totalReceipts: 0,
          totalAmount: 0,
          completedReceipts: 0,
          pendingReceipts: 0,
          failedReceipts: 0,
          refundedReceipts: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [RECEIPT] Get receipts by store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store receipts',
      error: error.message
    });
  }
};


