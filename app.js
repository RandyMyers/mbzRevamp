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
//const discountRoutes = require('./routes/discountRoutes');  // New Discount Usage Routes
//const discountUsageRoutes = require('./routes/discountUsageRoutes');  // New Discount Usage Routes
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const subscriptionPlansRoutes = require('./routes/subscriptionPlansRoutes');
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
console.log('Loaded notificationRoutes type:', typeof notificationRoutes);
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes');
console.log('Loaded notificationTemplateRoutes type:', typeof notificationTemplateRoutes);
const notificationSettingsRoutes = require('./routes/notificationSettingsRoutes');
console.log('Loaded notificationSettingsRoutes type:', typeof notificationSettingsRoutes);
// Add missing route imports
const roleRoutes = require('./routes/roleRoutes');
console.log('Loaded roleRoutes type:', typeof roleRoutes);
const groupRoutes = require('./routes/groupRoutes');
console.log('Loaded groupRoutes type:', typeof groupRoutes);
const invitationRoutes = require('./routes/invitationRoutes');
console.log('Loaded invitationRoutes type:', typeof invitationRoutes);

// New InvoicesAndReceipts & Feedback routes
const invoiceRoutes = require('./routes/invoiceRoutes');
console.log('Loaded invoiceRoutes type:', typeof invoiceRoutes);
const receiptRoutes = require('./routes/receiptRoutes');
console.log('Loaded receiptRoutes type:', typeof receiptRoutes);
const feedbackRoutes = require('./routes/feedbackRoutes');
console.log('Loaded feedbackRoutes type:', typeof feedbackRoutes);
const surveyRoutes = require('./routes/surveyRoutes');
console.log('Loaded surveyRoutes type:', typeof surveyRoutes);
const suggestionRoutes = require('./routes/suggestionRoutes');
console.log('Loaded suggestionRoutes type:', typeof suggestionRoutes);

// Onboarding routes
const onboardingRoutes = require('./routes/onboardingRoutes');
console.log('Loaded onboardingRoutes type:', typeof onboardingRoutes);

// New Self-Service and Content Management routes
const selfServiceRoutes = require('./routes/selfServiceRoutes');
console.log('Loaded selfServiceRoutes type:', typeof selfServiceRoutes);
const contentManagementRoutes = require('./routes/contentManagementRoutes');
console.log('Loaded contentManagementRoutes type:', typeof contentManagementRoutes);
const jobPostingRoutes = require('./routes/jobPostingRoutes');
console.log('Loaded jobPostingRoutes type:', typeof jobPostingRoutes);

const invoiceTemplateRoutes = require('./routes/invoiceTemplateRoutes');
console.log('Loaded invoiceTemplateRoutes type:', typeof invoiceTemplateRoutes);

// New Shipping Label routes
const shippingLabelRoutes = require('./routes/shippingLabelRoutes');
console.log('Loaded shippingLabelRoutes type:', typeof shippingLabelRoutes);

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
console.log('About to set up middleware');
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8800',
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://localhost:8081',
      'https://api.elapix.store',
      'https://crm.mbztechnology.com',
      'https://app.mbztechnology.com',
      'https://elapix.mbztechnology.com',
      'https://elapix.store'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: false,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
}));

// Additional CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:8800',
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:8080',
    'http://localhost:8081',
    'https://api.elapix.store',
    'https://crm.mbztechnology.com',
    'https://app.mbztechnology.com',
    'https://elapix.mbztechnology.com',
    'https://elapix.store'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});
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
console.log('Setting up Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

// Test endpoint to verify Swagger setup (must be before swaggerUi.serve)
app.get('/api-docs/test', (req, res) => {
  res.json({
    message: 'Swagger test endpoint working',
    specsLoaded: !!specs,
    swaggerUiLoaded: !!swaggerUi,
    timestamp: new Date().toISOString()
  });
});

// Serve Swagger JSON (must be before swaggerUi.serve)
app.get('/api-docs/swagger.json', (req, res) => {
  console.log('Swagger JSON endpoint accessed');
  console.log('Specs available:', specs ? 'Yes' : 'No');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(specs);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MBZ Tech Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    url: '/api-docs/swagger.json',
    validatorUrl: null
  }
}));

console.log('Swagger documentation setup complete');

// Health check endpoint with explicit CORS headers
app.get('/api/health', (req, res) => {
  // Set explicit CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(200).json({ 
    success: true, 
    message: 'MBZ Tech Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cors: 'enabled'
  });
});

// Using imported routes
console.log('About to mount authRoutes');
app.use('/api/auth', authRoutes);
console.log('Mounted authRoutes');
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
console.log('About to mount organizationRoutes');
app.use('/api/organization', organizationRoutes);
console.log('Mounted organizationRoutes');
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
app.use('/api/plans', subscriptionPlansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/calls', callSchedulerRoutes);
console.log('Mounted callSchedulerRoutes');
app.use('/api/support', supportRoutes);
console.log('Mounted supportRoutes');
app.use('/api/payment-gateways', paymentGatewayKeyRoutes);
console.log('Mounted paymentGatewayKeyRoutes');
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
console.log('Mounted notificationRoutes');
app.use('/api/notification-templates', notificationTemplateRoutes);
console.log('Mounted notificationTemplateRoutes');
app.use('/api/notification-settings', notificationSettingsRoutes);
console.log('Mounted notificationSettingsRoutes');
app.use('/api/admin', adminRoutes);
console.log('Mounted adminRoutes');

// Onboarding routes
app.use('/api/onboarding', onboardingRoutes);

// New InvoicesAndReceipts & Feedback routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/suggestions', suggestionRoutes);

// New Self-Service and Content Management routes
app.use('/api/self-service', selfServiceRoutes);
app.use('/api/content-management', contentManagementRoutes);
app.use('/api/job-postings', jobPostingRoutes);

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
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
});

// Remove the global error handler - let each controller handle its own errors
// app.use(errorHandler);
