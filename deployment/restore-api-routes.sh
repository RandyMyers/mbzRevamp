#!/bin/bash

echo "🔧 Restoring missing API routes..."

# Navigate to the application directory
cd /var/www/mbztech

echo "1. Checking current app.js to see what routes are missing..."
echo "Current app.js size: $(wc -c < app.js) bytes"
echo "Current app.js routes:"
grep -n "app.use.*api" app.js || echo "No API routes found"

echo -e "\n2. We need to restore all the API routes that were in the original app.js"
echo "Let's check what backup files we have..."
ls -la app-backup*.js

echo -e "\n3. Creating a comprehensive app.js with all API routes..."

# Create a new app.js that includes all the necessary routes
cat > app-with-routes.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import FULL Swagger configuration
const { specs, swaggerUi } = require('./swagger');

// Import all route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
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
const taskRoutes = require('./routes/taskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const subscriptionPlansRoutes = require('./routes/subscriptionPlansRoutes');
const senderRoutes = require('./routes/senderRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');

dotenv.config();

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'https://api.elapix.store'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// FULL SWAGGER SETUP - AT THE VERY BEGINNING
console.log('🚀 Setting up FULL Swagger documentation...');
console.log('Swagger specs loaded:', specs ? 'Yes' : 'No');
console.log('Swagger UI available:', swaggerUi ? 'Yes' : 'No');

try {
  // Full Swagger UI setup with all options
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
  console.log('✅ Full Swagger UI middleware registered successfully');
} catch (error) {
  console.error('❌ Error setting up Full Swagger UI:', error.message);
}

console.log('✅ Full Swagger documentation setup complete');

// Test endpoint to verify Swagger setup
app.get('/api-docs/test', (req, res) => {
  res.json({ 
    message: 'Full Swagger test endpoint working',
    specsLoaded: !!specs,
    swaggerUiLoaded: !!swaggerUi,
    specsSize: JSON.stringify(specs).length,
    timestamp: new Date().toISOString()
  });
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(specs);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MBZ Tech Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// ALL API ROUTES
console.log('🚀 Setting up API routes...');

// Authentication routes (CRITICAL - this fixes the login issue)
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

// All other API routes
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

console.log('✅ All API routes registered');

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/mbztech')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 Full Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
});
EOF

echo "4. Testing the new app.js with all routes..."
node -c app-with-routes.js && echo "✅ app-with-routes.js syntax OK" || {
  echo "❌ app-with-routes.js syntax error"
  exit 1
}

echo -e "\n5. Replacing app.js with full routes version..."
mv app-with-routes.js app.js

echo -e "\n6. Restarting PM2 with all API routes..."
pm2 restart mbztech-api
sleep 5

echo -e "\n7. Testing the login endpoint (this should fix the 404 error)..."

echo "Testing /api/auth/login endpoint..."
curl -s -I https://api.elapix.store/api/auth/login | head -1

echo -e "\nTesting health endpoint..."
curl -s https://api.elapix.store/api/health | jq '.' || echo "Health endpoint failed"

echo -e "\nTesting Swagger endpoints..."
curl -s -I https://api.elapix.store/api-docs/swagger.json | head -1

echo -e "\n8. Checking PM2 logs for any errors..."
pm2 logs mbztech-api --lines 10 --nostream

echo -e "\n✅ API routes restoration complete!"
echo "🔐 Login endpoint should now be available at: https://api.elapix.store/api/auth/login"
echo "📖 Full Swagger documentation: https://api.elapix.store/api-docs"
