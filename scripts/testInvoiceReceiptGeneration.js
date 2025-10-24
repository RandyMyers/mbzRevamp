const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models and services
const Organization = require('../models/organization');
const Store = require('../models/store');
const Order = require('../models/order');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const User = require('../models/users');
const templateMergerService = require('../services/templateMergerService');

/**
 * Test script to generate actual invoices and receipts using pexashop organization data
 */
async function testInvoiceReceiptGeneration() {
  try {
    console.log('🔧 [TEST] Starting invoice and receipt generation test...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ [TEST] Connected to MongoDB');

    // Find pexashop organization
    const organization = await Organization.findOne({ name: 'pexashop' });
    if (!organization) {
      throw new Error('Pexashop organization not found');
    }
    console.log('✅ [TEST] Found organization:', organization.name);

    // Find Trendy kool store
    const store = await Store.findOne({ 
      organizationId: organization._id, 
      name: 'Trendy kool' 
    });
    if (!store) {
      throw new Error('Trendykool store not found');
    }
    console.log('✅ [TEST] Found store:', store.name);

    // Find a user from the organization
    const user = await User.findOne({ organization: organization._id });
    if (!user) {
      throw new Error('No user found for pexashop organization');
    }
    console.log('✅ [TEST] Found user:', user.email);

    // Find a non-cancelled order
    const order = await Order.findOne({ 
      organizationId: organization._id,
      storeId: store._id,
      status: { $ne: 'cancelled' }
    });

    if (!order) {
      throw new Error('No non-cancelled orders found');
    }
    console.log('✅ [TEST] Found order:', {
      id: order._id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      customerName: order.billing?.first_name,
      lineItemsCount: order.line_items?.length || 0
    });

    // Test 1: Generate Invoice from Order
    console.log('\n🔧 [TEST 1] Generating invoice from order...');
    
    // Get merged company info
    let mergedCompanyInfo = null;
    try {
      mergedCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(
        organization._id, 
        store._id, 
        'invoice'
      );
      console.log('✅ [TEST 1] Merged company info:', JSON.stringify(mergedCompanyInfo, null, 2));
    } catch (error) {
      console.error('❌ [TEST 1] Error getting merged company info:', error);
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(organization._id);
    console.log('✅ [TEST 1] Generated invoice number:', invoiceNumber);

    // Create invoice from order
    const newInvoice = new Invoice({
      invoiceNumber,
      customerId: order.customerId,
      storeId: order.storeId,
      organizationId: organization._id,
      userId: user._id,
      customerName: order.billing?.first_name || 'Customer',
      customerEmail: order.billing?.email || 'customer@example.com',
      customerAddress: {
        street: order.billing?.address_1 || '',
        city: order.billing?.city || '',
        state: order.billing?.state || '',
        zipCode: order.billing?.postcode || '',
        country: order.billing?.country || ''
      },
      items: order.line_items?.map(item => ({
        name: item.name,
        description: item.meta_data?.find(m => m.key === 'description')?.value || '',
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        totalPrice: parseFloat(item.total),
        taxRate: 0
      })) || [],
      subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
      taxAmount: parseFloat(order.total_tax || 0),
      discountAmount: parseFloat(order.discount_total || 0),
      totalAmount: parseFloat(order.total),
      currency: order.currency || 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: order.customer_note || '',
      terms: 'Payment is due within 30 days.',
      type: 'one_time',
      // Use merged company info from organization template settings
      companyInfo: mergedCompanyInfo,
      createdBy: user._id,
      updatedBy: user._id
    });

    newInvoice.calculateTotals();
    const savedInvoice = await newInvoice.save();
    console.log('✅ [TEST 1] Invoice created successfully:', {
      id: savedInvoice._id,
      invoiceNumber: savedInvoice.invoiceNumber,
      totalAmount: savedInvoice.totalAmount,
      companyInfo: savedInvoice.companyInfo
    });

    // Test 2: Generate Receipt from Order
    console.log('\n🔧 [TEST 2] Generating receipt from order...');
    
    // Get merged company info for receipt
    let mergedReceiptCompanyInfo = null;
    try {
      mergedReceiptCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(
        organization._id, 
        store._id, 
        'receipt'
      );
      console.log('✅ [TEST 2] Merged receipt company info:', JSON.stringify(mergedReceiptCompanyInfo, null, 2));
    } catch (error) {
      console.error('❌ [TEST 2] Error getting merged company info:', error);
    }

    // Generate receipt number
    const receiptNumber = await Receipt.generateReceiptNumber(organization._id);
    console.log('✅ [TEST 2] Generated receipt number:', receiptNumber);

    // Create receipt from order
    const newReceipt = new Receipt({
      receiptNumber,
      customerId: order.customerId,
      storeId: order.storeId,
      organizationId: organization._id,
      userId: user._id,
      customerName: order.billing?.first_name || 'Customer',
      customerEmail: order.billing?.email || 'customer@example.com',
      customerAddress: {
        street: order.billing?.address_1 || '',
        city: order.billing?.city || '',
        state: order.billing?.state || '',
        zipCode: order.billing?.postcode || '',
        country: order.billing?.country || ''
      },
      items: order.line_items?.map(item => ({
        name: item.name,
        description: item.meta_data?.find(m => m.key === 'description')?.value || '',
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        totalPrice: parseFloat(item.total),
        taxRate: 0
      })) || [],
      subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
      taxAmount: parseFloat(order.total_tax || 0),
      discountAmount: parseFloat(order.discount_total || 0),
      totalAmount: parseFloat(order.total),
      currency: order.currency || 'USD',
      paymentMethod: order.payment_method_title || 'Credit Card',
      transactionId: order.transaction_id || '',
      transactionDate: order.date_created || new Date(),
      description: order.customer_note || '',
      type: 'purchase',
      scenario: 'woocommerce_order',
      // Use merged company info from organization template settings
      companyInfo: mergedReceiptCompanyInfo,
      createdBy: user._id,
      updatedBy: user._id
    });

    newReceipt.calculateTotals();
    const savedReceipt = await newReceipt.save();
    console.log('✅ [TEST 2] Receipt created successfully:', {
      id: savedReceipt._id,
      receiptNumber: savedReceipt.receiptNumber,
      totalAmount: savedReceipt.totalAmount,
      companyInfo: savedReceipt.companyInfo
    });

    // Test 3: Verify the generated documents have personalized company info
    console.log('\n🔧 [TEST 3] Verifying personalized company info...');
    
    console.log('Invoice company info:', JSON.stringify(savedInvoice.companyInfo, null, 2));
    console.log('Receipt company info:', JSON.stringify(savedReceipt.companyInfo, null, 2));

    // Check if company info was properly merged
    if (savedInvoice.companyInfo && Object.keys(savedInvoice.companyInfo).length > 0) {
      console.log('✅ [TEST 3] Invoice has personalized company info');
    } else {
      console.log('⚠️ [TEST 3] Invoice missing personalized company info');
    }

    if (savedReceipt.companyInfo && Object.keys(savedReceipt.companyInfo).length > 0) {
      console.log('✅ [TEST 3] Receipt has personalized company info');
    } else {
      console.log('⚠️ [TEST 3] Receipt missing personalized company info');
    }

    console.log('\n✅ [TEST] Invoice and receipt generation test completed successfully!');
    console.log('\n📊 [SUMMARY] Generated documents:');
    console.log(`- Invoice: ${savedInvoice.invoiceNumber} (${savedInvoice.totalAmount} ${savedInvoice.currency})`);
    console.log(`- Receipt: ${savedReceipt.receiptNumber} (${savedReceipt.totalAmount} ${savedReceipt.currency})`);

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Disconnected from MongoDB');
  }
}

// Run the test
testInvoiceReceiptGeneration();
