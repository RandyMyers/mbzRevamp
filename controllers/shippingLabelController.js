const ShippingLabel = require('../models/shippingLabel');
const Order = require('../models/order');
const Customer = require('../models/customers');
const Store = require('../models/store');
const { createAuditLog } = require('../helpers/auditLogHelper');
const logEvent = require('../helper/logEvent');
const PDFDocument = require('pdfkit');

// Generate shipping label for an order
exports.generateShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { carrier = 'USPS', serviceType = 'Priority' } = req.body;
    
    // Get order with customer and store data
    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('storeId');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if shipping label already exists
    const existingLabel = await ShippingLabel.findOne({ orderId });
    if (existingLabel) {
      return res.status(400).json({ 
        error: 'Shipping label already exists for this order',
        data: existingLabel 
      });
    }
    
    // Generate tracking number
    const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
    
    // Get store information for from address
    const store = await Store.findById(order.storeId);
    
    // Create shipping label
    const shippingLabel = new ShippingLabel({
      orderId,
      organizationId: order.organizationId,
      storeId: order.storeId,
      trackingNumber,
      carrier,
      serviceType,
      labelData: {
        fromAddress: {
          name: store ? store.name : 'Store',
          company: store ? store.name : 'Store',
          address1: "123 Store Street",
          city: "Store City",
          state: "CA",
          postalCode: "90210",
          country: "United States",
          phone: "+1 (555) 000-0000",
        },
        toAddress: {
          name: `${order.shipping.first_name || ''} ${order.shipping.last_name || ''}`.trim(),
          company: order.shipping.company || '',
          address1: order.shipping.address_1 || '',
          address2: order.shipping.address_2 || '',
          city: order.shipping.city || '',
          state: order.shipping.state || '',
          postalCode: order.shipping.postcode || '',
          country: order.shipping.country || '',
          phone: order.shipping.phone || '',
        },
        packageDetails: {
          weight: 16, // Default 1 pound
          dimensions: {
            length: 12,
            width: 8,
            height: 6,
          },
        },
      },
    });
    
    await shippingLabel.save();
    
    // Create audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'ShippingLabel',
      entityId: shippingLabel._id,
      userId: req.user.id,
      organizationId: order.organizationId,
      details: {
        orderId,
        trackingNumber,
        carrier,
        serviceType,
      },
    });
    
    // Log event
    await logEvent('shipping_label_created', {
      orderId,
      trackingNumber,
      carrier,
      serviceType,
      userId: req.user.id,
      organizationId: order.organizationId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Shipping label generated successfully',
      data: shippingLabel,
    });
    
  } catch (error) {
    console.error('Error generating shipping label:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get shipping label by order ID
exports.getShippingLabelByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const shippingLabel = await ShippingLabel.findOne({ orderId })
      .populate('orderId')
      .populate('storeId');
    
    if (!shippingLabel) {
      return res.status(404).json({ error: 'Shipping label not found' });
    }
    
    res.json({
      success: true,
      data: shippingLabel,
    });
    
  } catch (error) {
    console.error('Error getting shipping label:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all shipping labels for organization
exports.getShippingLabelsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, status, carrier } = req.query;
    
    const query = { organizationId };
    if (status) query.status = status;
    if (carrier) query.carrier = carrier;
    
    const shippingLabels = await ShippingLabel.find(query)
      .populate('orderId')
      .populate('storeId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ShippingLabel.countDocuments(query);
    
    res.json({
      success: true,
      data: shippingLabels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
    
  } catch (error) {
    console.error('Error getting shipping labels:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate PDF for shipping label
exports.generateShippingLabelPDF = async (req, res) => {
  try {
    const { labelId } = req.params;
    
    const shippingLabel = await ShippingLabel.findById(labelId)
      .populate('orderId')
      .populate('storeId');
    
    if (!shippingLabel) {
      return res.status(404).json({ error: 'Shipping label not found' });
    }
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shipping-label-${shippingLabel.trackingNumber}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(24).text('SHIPPING LABEL', { align: 'center' });
    doc.moveDown();
    
    // Header section
    doc.fontSize(12);
    doc.text(`From: ${shippingLabel.labelData.fromAddress.name}`, { align: 'left' });
    doc.text(`Tracking #: ${shippingLabel.trackingNumber}`, { align: 'right' });
    doc.moveDown();
    
    // Order information
    doc.fontSize(14).text('Order Information:', { underline: true });
    doc.fontSize(12);
    doc.text(`Order Number: ${shippingLabel.orderId.number || shippingLabel.orderId._id}`);
    doc.text(`Carrier: ${shippingLabel.carrier}`);
    doc.text(`Service: ${shippingLabel.serviceType}`);
    doc.moveDown();
    
    // From address
    doc.fontSize(14).text('Ship From:', { underline: true });
    doc.fontSize(12);
    const fromAddr = shippingLabel.labelData.fromAddress;
    doc.text(`${fromAddr.name}`);
    if (fromAddr.company) doc.text(fromAddr.company);
    doc.text(fromAddr.address1);
    if (fromAddr.address2) doc.text(fromAddr.address2);
    doc.text(`${fromAddr.city}, ${fromAddr.state} ${fromAddr.postalCode}`);
    doc.text(fromAddr.country);
    doc.moveDown();
    
    // To address
    doc.fontSize(14).text('Ship To:', { underline: true });
    doc.fontSize(12);
    const toAddr = shippingLabel.labelData.toAddress;
    doc.text(`${toAddr.name}`);
    if (toAddr.company) doc.text(toAddr.company);
    doc.text(toAddr.address1);
    if (toAddr.address2) doc.text(toAddr.address2);
    doc.text(`${toAddr.city}, ${toAddr.state} ${toAddr.postalCode}`);
    doc.text(toAddr.country);
    doc.moveDown();
    
    // Package details
    doc.fontSize(14).text('Package Details:', { underline: true });
    doc.fontSize(12);
    const pkg = shippingLabel.labelData.packageDetails;
    doc.text(`Weight: ${pkg.weight} oz`);
    doc.text(`Dimensions: ${pkg.dimensions.length}" x ${pkg.dimensions.width}" x ${pkg.dimensions.height}"`);
    doc.moveDown();
    
    // Footer
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update shipping label status
exports.updateShippingLabelStatus = async (req, res) => {
  try {
    const { labelId } = req.params;
    const { status } = req.body;
    
    const shippingLabel = await ShippingLabel.findByIdAndUpdate(
      labelId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!shippingLabel) {
      return res.status(404).json({ error: 'Shipping label not found' });
    }
    
    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entity: 'ShippingLabel',
      entityId: shippingLabel._id,
      userId: req.user.id,
      organizationId: shippingLabel.organizationId,
      details: { status },
    });
    
    // Log event
    await logEvent('shipping_label_status_updated', {
      labelId: shippingLabel._id,
      status,
      userId: req.user.id,
      organizationId: shippingLabel.organizationId,
    });
    
    res.json({
      success: true,
      message: 'Shipping label status updated',
      data: shippingLabel,
    });
    
  } catch (error) {
    console.error('Error updating shipping label:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk generate shipping labels
exports.bulkGenerateShippingLabels = async (req, res) => {
  try {
    const { orderIds, carrier = 'USPS', serviceType = 'Priority' } = req.body;
    const { organizationId } = req.params;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs array is required' });
    }
    
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);
        if (!order || order.organizationId.toString() !== organizationId) {
          results.push({ orderId, success: false, error: 'Order not found or unauthorized' });
          continue;
        }
        
        // Check if label already exists
        const existingLabel = await ShippingLabel.findOne({ orderId });
        if (existingLabel) {
          results.push({ orderId, success: false, error: 'Shipping label already exists' });
          continue;
        }
        
        // Get store information
        const store = await Store.findById(order.storeId);
        
        // Generate tracking number
        const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
        
        // Create shipping label
        const shippingLabel = new ShippingLabel({
          orderId,
          organizationId,
          storeId: order.storeId,
          trackingNumber,
          carrier,
          serviceType,
          labelData: {
            fromAddress: {
              name: store ? store.name : 'Store',
              company: store ? store.name : 'Store',
              address1: "123 Store Street",
              city: "Store City",
              state: "CA",
              postalCode: "90210",
              country: "United States",
              phone: "+1 (555) 000-0000",
            },
            toAddress: {
              name: `${order.shipping.first_name || ''} ${order.shipping.last_name || ''}`.trim(),
              company: order.shipping.company || '',
              address1: order.shipping.address_1 || '',
              address2: order.shipping.address_2 || '',
              city: order.shipping.city || '',
              state: order.shipping.state || '',
              postalCode: order.shipping.postcode || '',
              country: order.shipping.country || '',
              phone: order.shipping.phone || '',
            },
            packageDetails: {
              weight: 16,
              dimensions: {
                length: 12,
                width: 8,
                height: 6,
              },
            },
          },
        });
        
        await shippingLabel.save();
        results.push({ orderId, success: true, labelId: shippingLabel._id, trackingNumber });
        
      } catch (error) {
        results.push({ orderId, success: false, error: error.message });
      }
    }
    
    // Log bulk operation
    await logEvent('bulk_shipping_labels_generated', {
      organizationId,
      totalOrders: orderIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      userId: req.user.id,
    });
    
    res.json({
      success: true,
      message: 'Bulk shipping label generation completed',
      data: results,
    });
    
  } catch (error) {
    console.error('Error in bulk generation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get shipping label by ID
exports.getShippingLabelById = async (req, res) => {
  try {
    const { labelId } = req.params;
    
    const shippingLabel = await ShippingLabel.findById(labelId)
      .populate('orderId')
      .populate('storeId');
    
    if (!shippingLabel) {
      return res.status(404).json({ error: 'Shipping label not found' });
    }
    
    res.json({
      success: true,
      data: shippingLabel,
    });
    
  } catch (error) {
    console.error('Error getting shipping label:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete shipping label
exports.deleteShippingLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    
    const shippingLabel = await ShippingLabel.findByIdAndDelete(labelId);
    
    if (!shippingLabel) {
      return res.status(404).json({ error: 'Shipping label not found' });
    }
    
    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entity: 'ShippingLabel',
      entityId: labelId,
      userId: req.user.id,
      organizationId: shippingLabel.organizationId,
      details: { trackingNumber: shippingLabel.trackingNumber },
    });
    
    res.json({
      success: true,
      message: 'Shipping label deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting shipping label:', error);
    res.status(500).json({ error: error.message });
  }
}; 