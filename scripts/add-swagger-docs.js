const fs = require('fs');
const path = require('path');

// List of route files that already have Swagger documentation
const filesWithSwagger = [
  'storeOverviewRoutes.js',
  'onboardingRoutes.js', 
  'adminRoutes.js',
  'userRoutes.js',
  'authRoutes.js',
  'productRoutes.js',
  'orderRoutes.js',
  'storeRoutes.js'
];

// Route file mappings to their API tags
const routeTagMappings = {
  'customerRoutes.js': 'Customers',
  'emailRoutes.js': 'Emails',
  'emailTemplateRoutes.js': 'Email Templates',
  'emailSignatureRoutes.js': 'Email Signatures',
  'inboxRoutes.js': 'Inbox',
  'archivedRoutes.js': 'Archived',
  'draftRoutes.js': 'Drafts',
  'sentRoutes.js': 'Sent',
  'trashRoutes.js': 'Trash',
  'inventoryRoutes.js': 'Inventory',
  'paymentRoutes.js': 'Payments',
  'subscriptionsRoutes.js': 'Subscriptions',
  'subscriptionPlansRoutes.js': 'Subscription Plans',
  'websiteRoutes.js': 'Websites',
  'templateRoutes.js': 'Templates',
  'progressRoutes.js': 'Website Progress',
  'exchangeRateRoutes.js': 'Exchange Rates',
  'userPreferencesRoutes.js': 'User Preferences',
  'analyticsRoutes.js': 'Analytics',
  'advancedAnalyticsRoutes.js': 'Advanced Analytics',
  'callSchedulerRoutes.js': 'Call Scheduler',
  'supportRoutes.js': 'Support',
  'paymentGatewayKeyRoutes.js': 'Payment Gateway Keys',
  'chatIntegrationRoutes.js': 'Chat Integration',
  'campaignRoutes.js': 'Campaigns',
  'dashboardRoutes.js': 'Dashboard',
  'overviewRoutes.js': 'Overview',
  'webhookRoutes.js': 'Webhooks',
  'wooCommerceReportsRoutes.js': 'WooCommerce Reports',
  'contactRoutes.js': 'Contacts',
  'auditLogRoutes.js': 'Audit Logs',
  'notificationRoutes.js': 'Notifications',
  'notificationTemplateRoutes.js': 'Notification Templates',
  'notificationSettingsRoutes.js': 'Notification Settings',
  'roleRoutes.js': 'Roles',
  'groupRoutes.js': 'Groups',
  'invitationRoutes.js': 'Invitations',
  'invoiceRoutes.js': 'Invoices',
  'receiptRoutes.js': 'Receipts',
  'feedbackRoutes.js': 'Feedback',
  'surveyRoutes.js': 'Surveys',
  'suggestionRoutes.js': 'Suggestions',
  'selfServiceRoutes.js': 'Self Service',
  'contentManagementRoutes.js': 'Content Management',
  'jobPostingRoutes.js': 'Job Postings',
  'invoiceTemplateRoutes.js': 'Invoice Templates',
  'shippingLabelRoutes.js': 'Shipping Labels',
  'categoryRoutes.js': 'Categories',
  'organizationRoutes.js': 'Organizations',
  'affiliateRoutes.js': 'Affiliates',
  'senderRoutes.js': 'Senders',
  'receiverRoutes.js': 'Receivers',
  'taskRoutes.js': 'Tasks'
};

function addSwaggerTagToFile(filePath, tagName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has Swagger documentation
    if (content.includes('@swagger') || content.includes('@openapi')) {
      console.log(`✅ ${path.basename(filePath)} already has Swagger documentation`);
      return;
    }
    
    // Find the line after the require statements
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find where to insert the Swagger tag (after require statements)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const router = express.Router();')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // Create the Swagger tag comment
    const swaggerTag = `\n/**\n * @swagger\n * tags:\n *   - name: ${tagName}\n *     description: ${tagName.toLowerCase()} operations\n */\n`;
    
    // Insert the Swagger tag
    lines.splice(insertIndex, 0, swaggerTag);
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ Added Swagger tag to ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  const routesDir = path.join(__dirname, '../routes');
  
  console.log('🚀 Adding Swagger documentation to route files...\n');
  
  // Get all route files
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  let processedCount = 0;
  
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const tagName = routeTagMappings[file] || file.replace('Routes.js', '').replace(/([A-Z])/g, ' $1').trim();
    
    addSwaggerTagToFile(filePath, tagName);
    processedCount++;
  });
  
  console.log(`\n🎉 Processed ${processedCount} route files`);
  console.log('📝 Note: You may need to add individual endpoint documentation for each route');
}

if (require.main === module) {
  main();
}

module.exports = { addSwaggerTagToFile };
