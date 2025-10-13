#!/bin/bash

echo "🔧 Fixing Swagger in main app.js..."

# Navigate to the application directory
cd /var/www/mbztech

# First, restore from backup if needed
echo "🔍 Checking for syntax errors..."
if ! node -c app.js 2>/dev/null; then
    echo "❌ Syntax error detected, restoring from backup..."
    if ls app-backup-*.js 1> /dev/null 2>&1; then
        LATEST_BACKUP=$(ls -t app-backup-*.js | head -1)
        echo "Restoring from: $LATEST_BACKUP"
        cp "$LATEST_BACKUP" app.js
        echo "✅ Restored from backup"
    else
        echo "❌ No backup found, cannot proceed"
        exit 1
    fi
fi

# The issue is likely that the Swagger routes are being overridden by other middleware
# Let's move the Swagger setup to the very beginning, right after basic middleware

echo "📝 Moving Swagger setup to the beginning of middleware chain..."

# Create a backup
cp app.js app-backup-before-swagger-fix-$(date +%Y%m%d-%H%M%S).js

# Find where the Swagger setup is currently located
echo "Current Swagger setup location:"
grep -n "Swagger API Documentation" app.js

# Create a new app.js with Swagger moved to the beginning
cat > app-new.js << 'EOF'
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

// Import Swagger configuration FIRST
const { specs, swaggerUi } = require('./swagger');

// Importing route files
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const storeRoutes = require('./routes/storeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
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
const productRoutes = require('./routes/productRoutes');
const senderRoutes = require('./routes/senderRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const taskRoutes = require('./routes/taskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const subscriptionPlansRoutes = require('./routes/subscriptionPlansRoutes');
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
const contactRoutes = require('./routes/contactRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes');
const notificationSettingsRoutes = require('./routes/notificationSettingsRoutes');
const roleRoutes = require('./routes/roleRoutes');
const groupRoutes = require('./routes/groupRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const selfServiceRoutes = require('./routes/selfServiceRoutes');
const contentManagementRoutes = require('./routes/contentManagementRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');
const invoiceTemplateRoutes = require('./routes/invoiceTemplateRoutes');
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

// Basic middleware
console.log('About to set up middleware');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'https://api.elapix.store'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); 
app.use(morgan('dev')); 

app.use(
  fileUpload({
    useTempFiles: true,
    createParentPath: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }
  })
);

// Serve local uploads for hybrid attachment system
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SWAGGER SETUP - MOVED TO THE BEGINNING
console.log('Setting up Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

try {
  // Swagger UI setup
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
  console.log('✅ Swagger UI middleware registered successfully');
} catch (error) {
  console.error('❌ Error setting up Swagger UI:', error.message);
}

console.log('Swagger documentation setup complete');

// Test endpoint to verify Swagger setup
app.get('/api-docs/test', (req, res) => {
  console.log('Swagger test endpoint accessed');
  res.json({
    message: 'Swagger test endpoint working',
    specsLoaded: !!specs,
    swaggerUiLoaded: !!swaggerUi,
    timestamp: new Date().toISOString()
  });
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  console.log('Swagger JSON endpoint accessed');
  console.log('Specs available:', specs ? 'Yes' : 'No');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(specs);
});

// Health check endpoint with explicit CORS headers
app.get('/api/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  res.status(200).json({ 
    success: true, 
    message: 'MBZ Tech Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cors: 'enabled'
  });
});

// All other routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', subscriptionPlansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
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
app.use('/api/contact', contactRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-templates', notificationTemplateRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/self-service', selfServiceRoutes);
app.use('/api/content-management', contentManagementRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/api/invoice/templates', invoiceTemplateRoutes);
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

EOF

# Test the new app.js
echo "🧪 Testing new app.js..."
node -c app-new.js && echo "✅ app-new.js syntax is valid" || {
  echo "❌ app-new.js has syntax errors"
  exit 1
}

# Replace the old app.js
echo "📝 Replacing app.js with fixed version..."
mv app-new.js app.js

# Restart the server
echo "🔄 Restarting server..."
pm2 restart mbztech-api

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the endpoints
echo "🧪 Testing Swagger endpoints..."

echo "1. Testing Swagger test endpoint..."
curl -s https://api.elapix.store/api-docs/test | jq '.' || echo "Swagger test endpoint failed"

echo -e "\n2. Testing Swagger JSON endpoint..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n3. Testing Swagger UI endpoint..."
curl -s -I https://api.elapix.store/api-docs | head -1

echo -e "\n✅ Main app Swagger fix complete!"
