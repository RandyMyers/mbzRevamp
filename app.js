const express = require('express');
const http = require('http');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

const fileUpload = require('express-fileupload');
const receiverEvent = require('./helper/receiverEvent');
//const currencyEvent = require('./helper/exchangeRateEvent')

// Import Swagger configuration
const { specs, swaggerUi } = require('./swagger');

// Importing route files
const userRoutes = require('./routes/userRoutes');
//const policiesRoutes = require('./routes/policyRoutes');
const authRoutes = require('./routes/authRoutes');
//const blogRoutes = require('./routes/blogRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');
//const visitorRoutes = require('./routes/visitorRoutes');
//const interactionRoutes = require('./routes/interactionRoutes');
//const triggerRoutes = require('./routes/triggerRoutes');
//const actionRoutes = require('./routes/actionRoutes');
//const conditionRoutes = require('./routes/conditionRoutes');
//const bankAccountEURRoutes = require('./routes/bankAccountEURRoutes');
//const bankAccountUSDRoutes = require('./routes/bankAccountUSDRoutes');
//const bankAccountGBPRoutes = require('./routes/bankAccountGBPRoutes');
//const dealRoutes = require('./routes/dealRoutes');
const organizationRoutes = require('./routes/organizationRoutes');  // New Coupon Routes
const storeRoutes = require('./routes/storeRoutes'); 
//const exchangeRateRoutes = require('./routes/exchangeRateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');  // New Category Routes
//const cryptoWalletBTCRoutes = require('./routes/cryptoWalletBTCRoutes');
//const cryptoWalletUSDTRoutes = require('./routes/cryptoWalletUSDTRoutes');
//const cartRoutes = require('./routes/cartRoutes');
const customerRoutes = require('./routes/customerRoutes');
const emailRoutes = require('./routes/emailRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const emailSignatureRoutes = require('./routes/emailSignatureRoutes');
const inboxRoutes = require('./routes/inboxRoutes');
const archivedRoutes = require('./routes/archivedRoutes');
const draftRoutes = require('./routes/draftRoutes');
const sentRoutes = require('./routes/sentRoutes');
const trashRoutes = require('./routes/trashRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
//const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const productRoutes = require('./routes/productRoutes');
const senderRoutes = require('./routes/senderRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
//const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
//const connectedAccountRoutes = require('./routes/connectedAccountRoutes');
const taskRoutes = require('./routes/taskRoutes');
//const workflowRoutes = require('./routes/workflowRoutes');
//const siteRoutes = require('./routes/siteRoutes');
//const subscriptionRoutes = require('./routes/subscriptionRoutes');  // New Subscription Routes
//const discountRoutes = require('./routes/discountRoutes');  // New Discount Usage Routes
//const discountUsageRoutes = require('./routes/discountUsageRoutes');  // New Discount Usage Routes
const paymentRoutes = require('./routes/paymentRoutes');
//const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');  // New Subscription Plan Routes
//const paymentLinkRoutes = require('./routes/paymentLinkRoutes');  // New Payment Link Routes
const websiteRoutes = require('./routes/websiteRoutes');
const templateRoutes = require('./routes/templateRoutes');
const progressRoutes = require('./routes/websiteProgressRoutes');
const exchangeRateRoutes = require('./routes/exchangeRateRoutes');
const userPreferencesRoutes = require('./routes/userPreferencesRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const advancedAnalyticsRoutes = require('./routes/advancedAnalyticsRoutes');
const callSchedulerRoutes = require('./routes/callSchedulerRoutes');
const supportRoutes = require('./routes/supportRoutes');
const paymentGatewayKeyRoutes = require('./routes/paymentGatewayKeyRoutes');
const chatIntegrationRoutes = require('./routes/chatIntegrationRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const storeOverviewRoutes = require('./routes/storeOverviewRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const wooCommerceReportsRoutes = require('./routes/wooCommerceReportsRoutes');
//const exportRoutes = require('./routes/exportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const adminRoutes = require('./routes/adminRoutes');
console.log('Loaded adminRoutes type:', typeof adminRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes');
const notificationSettingsRoutes = require('./routes/notificationSettingsRoutes');
// Add missing route imports
const roleRoutes = require('./routes/roleRoutes');
const groupRoutes = require('./routes/groupRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

// New InvoicesAndReceipts & Feedback routes
const invoiceRoutes = require('./routes/invoiceRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');

const invoiceTemplateRoutes = require('./routes/invoiceTemplateRoutes');

// New Shipping Label routes
const shippingLabelRoutes = require('./routes/shippingLabelRoutes');

dotenv.config();

const cloudinary = require('cloudinary').v2;
const app = express();

// Cloudinary Configuration
const cloudinaryConfig = require('./config/cloudinary');

// Set Cloudinary configuration as a local variable
app.use((req, res, next) => {
  cloudinary.config(cloudinaryConfig);
  next();
});

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });

// Middleware
app.use(cors({
  origin: '*',  // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE'],  // Adjust allowed methods as needed
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers if needed
}));
app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); 
app.use(morgan('dev')); 

app.use(
  fileUpload({
    useTempFiles: true, // Store files in memory instead of a temporary directory
    createParentPath: true, // Create the 'uploads' directory if not exists
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }
  })
);

// Serve local uploads for hybrid attachment system
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MBZ Tech Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'MBZ Tech Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Using imported routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/affiliates', affiliateRoutes);
//app.use('/api/sites', siteRoutes);
//app.use('/api/triggers', triggerRoutes);
//app.use('/api/actions', actionRoutes);
//app.use('/api/conditions', conditionRoutes);
//app.use('/api/connected/accounts', connectedAccountRoutes);

//app.use('/api/bank/accounts/eur', bankAccountEURRoutes);
//app.use('/api/bank/accounts/usd', bankAccountUSDRoutes);
//app.use('/api/bank/accounts/gbp', bankAccountGBPRoutes);
//app.use('/api/exchange-rates', exchangeRateRoutes);
//app.use('/api/deals', dealRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

//app.use('/api/wallets/btc', cryptoWalletBTCRoutes);
//app.use('/api/wallets/usdt', cryptoWalletUSDTRoutes);


app.use('/api/customers', customerRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email/templates', emailTemplateRoutes);
app.use('/api/email-signatures', emailSignatureRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/archived', archivedRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/sent', sentRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/website/templates', templateRoutes);
app.use('/api/website/progress', progressRoutes);
//app.use('/api/payment/method', paymentMethodRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/senders', senderRoutes);
//app.use('/api/senders', senderRoutes);
//app.use('/api/sms/templates', smsTemplateRoutes);
app.use('/api/tasks', taskRoutes);
//app.use('/api/workflows', workflowRoutes);
//app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', require('./routes/subscriptionPlansRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionsRoutes'));
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/calls', callSchedulerRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment-gateways', paymentGatewayKeyRoutes);
app.use('/api/chat-integrations', chatIntegrationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/store-overview', storeOverviewRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/woocommerce', wooCommerceReportsRoutes);
//app.use('/api/export', exportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-templates', notificationTemplateRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/admin', adminRoutes);

// New InvoicesAndReceipts & Feedback routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/invoice/templates', invoiceTemplateRoutes);

// New Shipping Label routes
app.use('/api/shipping-labels', shippingLabelRoutes);

//Start the cron job for receiver emails
receiverEvent.scheduleEmailSync();

// Initialize Exchange Rate Sync Service
const rateSyncService = require('./services/rateSyncService');
rateSyncService.initialize()
  .then(() => {
    console.log('✅ Exchange Rate Sync Service initialized');
  })
  .catch((error) => {
    console.error('❌ Failed to initialize Exchange Rate Sync Service:', error);
  });

// Start the server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Remove the global error handler - let each controller handle its own errors
// app.use(errorHandler);
