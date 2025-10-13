const fs = require('fs');
const path = require('path');

// Route file mappings to their API tags and base paths
const routeConfigs = {
  'customerRoutes.js': { tag: 'Customers', basePath: '/api/customers' },
  'emailRoutes.js': { tag: 'Emails', basePath: '/api/emails' },
  'emailTemplateRoutes.js': { tag: 'Email Templates', basePath: '/api/email/templates' },
  'emailSignatureRoutes.js': { tag: 'Email Signatures', basePath: '/api/email-signatures' },
  'inboxRoutes.js': { tag: 'Inbox', basePath: '/api/inbox' },
  'archivedRoutes.js': { tag: 'Archived', basePath: '/api/archived' },
  'draftRoutes.js': { tag: 'Drafts', basePath: '/api/drafts' },
  'sentRoutes.js': { tag: 'Sent', basePath: '/api/sent' },
  'trashRoutes.js': { tag: 'Trash', basePath: '/api/trash' },
  'inventoryRoutes.js': { tag: 'Inventory', basePath: '/api/inventory' },
  'paymentRoutes.js': { tag: 'Payments', basePath: '/api/payments' },
  'subscriptionsRoutes.js': { tag: 'Subscriptions', basePath: '/api/subscriptions' },
  'subscriptionPlansRoutes.js': { tag: 'Subscription Plans', basePath: '/api/plans' },
  'websiteRoutes.js': { tag: 'Websites', basePath: '/api/websites' },
  'templateRoutes.js': { tag: 'Templates', basePath: '/api/website/templates' },
  'progressRoutes.js': { tag: 'Website Progress', basePath: '/api/website/progress' },
  'exchangeRateRoutes.js': { tag: 'Exchange Rates', basePath: '/api/exchange-rates' },
  'userPreferencesRoutes.js': { tag: 'User Preferences', basePath: '/api/user-preferences' },
  'analyticsRoutes.js': { tag: 'Analytics', basePath: '/api/analytics' },
  'advancedAnalyticsRoutes.js': { tag: 'Advanced Analytics', basePath: '/api/advanced-analytics' },
  'callSchedulerRoutes.js': { tag: 'Call Scheduler', basePath: '/api/calls' },
  'supportRoutes.js': { tag: 'Support', basePath: '/api/support' },
  'paymentGatewayKeyRoutes.js': { tag: 'Payment Gateway Keys', basePath: '/api/payment-gateways' },
  'chatIntegrationRoutes.js': { tag: 'Chat Integration', basePath: '/api/chat-integrations' },
  'campaignRoutes.js': { tag: 'Campaigns', basePath: '/api/campaigns' },
  'dashboardRoutes.js': { tag: 'Dashboard', basePath: '/api/dashboard' },
  'overviewRoutes.js': { tag: 'Overview', basePath: '/api/overview' },
  'webhookRoutes.js': { tag: 'Webhooks', basePath: '/api/webhooks' },
  'wooCommerceReportsRoutes.js': { tag: 'WooCommerce Reports', basePath: '/api/woocommerce' },
  'contactRoutes.js': { tag: 'Contacts', basePath: '/api/contact' },
  'auditLogRoutes.js': { tag: 'Audit Logs', basePath: '/api/audit-logs' },
  'notificationRoutes.js': { tag: 'Notifications', basePath: '/api/notifications' },
  'notificationTemplateRoutes.js': { tag: 'Notification Templates', basePath: '/api/notification-templates' },
  'notificationSettingsRoutes.js': { tag: 'Notification Settings', basePath: '/api/notification-settings' },
  'roleRoutes.js': { tag: 'Roles', basePath: '/api/roles' },
  'groupRoutes.js': { tag: 'Groups', basePath: '/api/groups' },
  'invitationRoutes.js': { tag: 'Invitations', basePath: '/api/invitations' },
  'invoiceRoutes.js': { tag: 'Invoices', basePath: '/api/invoices' },
  'receiptRoutes.js': { tag: 'Receipts', basePath: '/api/receipts' },
  'feedbackRoutes.js': { tag: 'Feedback', basePath: '/api/feedback' },
  'surveyRoutes.js': { tag: 'Surveys', basePath: '/api/surveys' },
  'suggestionRoutes.js': { tag: 'Suggestions', basePath: '/api/suggestions' },
  'selfServiceRoutes.js': { tag: 'Self Service', basePath: '/api/self-service' },
  'contentManagementRoutes.js': { tag: 'Content Management', basePath: '/api/content-management' },
  'jobPostingRoutes.js': { tag: 'Job Postings', basePath: '/api/job-postings' },
  'invoiceTemplateRoutes.js': { tag: 'Invoice Templates', basePath: '/api/invoice/templates' },
  'shippingLabelRoutes.js': { tag: 'Shipping Labels', basePath: '/api/shipping-labels' },
  'categoryRoutes.js': { tag: 'Categories', basePath: '/api/categories' },
  'organizationRoutes.js': { tag: 'Organizations', basePath: '/api/organization' },
  'affiliateRoutes.js': { tag: 'Affiliates', basePath: '/api/affiliates' },
  'senderRoutes.js': { tag: 'Senders', basePath: '/api/senders' },
  'receiverRoutes.js': { tag: 'Receivers', basePath: '/api/receivers' },
  'taskRoutes.js': { tag: 'Tasks', basePath: '/api/tasks' }
};

function generateSwaggerDocForRoute(routeLine, basePath, tagName) {
  const trimmedLine = routeLine.trim();
  
  // Extract method and path from route definition
  const routeMatch = trimmedLine.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (!routeMatch) return null;
  
  const method = routeMatch[1].toLowerCase();
  const routePath = routeMatch[2];
  const fullPath = basePath + routePath;
  
  // Generate basic Swagger documentation
  const summary = generateSummary(method, routePath);
  const operationId = generateOperationId(method, routePath);
  
  let swaggerDoc = `/**
 * @swagger
 * ${fullPath}:
 *   ${method}:
 *     summary: ${summary}
 *     tags: [${tagName}]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */`;
  
  return swaggerDoc;
}

function generateSummary(method, path) {
  const pathParts = path.split('/').filter(part => part && !part.startsWith(':'));
  const lastPart = pathParts[pathParts.length - 1] || 'item';
  
  const methodActions = {
    'get': 'Get',
    'post': 'Create',
    'put': 'Update',
    'patch': 'Update',
    'delete': 'Delete'
  };
  
  const action = methodActions[method] || 'Process';
  return `${action} ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`;
}

function generateOperationId(method, path) {
  const cleanPath = path.replace(/[\/:]/g, '_').replace(/^_+|_+$/g, '');
  return `${method}_${cleanPath}`;
}

function addSwaggerDocsToFile(filePath, config) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has comprehensive Swagger documentation
    const hasComprehensiveDocs = content.includes('@swagger') && 
                                content.includes('summary:') && 
                                content.includes('responses:');
    
    if (hasComprehensiveDocs) {
      console.log(`✅ ${path.basename(filePath)} already has comprehensive Swagger documentation`);
      return;
    }
    
    const lines = content.split('\n');
    const newLines = [];
    let inSwaggerTag = false;
    let swaggerTagAdded = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're in the Swagger tag section
      if (line.includes('@swagger') && line.includes('tags:')) {
        inSwaggerTag = true;
        newLines.push(line);
        continue;
      }
      
      // End of Swagger tag section
      if (inSwaggerTag && line.includes('*/')) {
        inSwaggerTag = false;
        swaggerTagAdded = true;
        newLines.push(line);
        continue;
      }
      
      // If we're in the Swagger tag section, just add the line
      if (inSwaggerTag) {
        newLines.push(line);
        continue;
      }
      
      // Look for route definitions
      if (line.includes('router.') && (line.includes('get') || line.includes('post') || 
          line.includes('put') || line.includes('patch') || line.includes('delete'))) {
        
        // Add Swagger documentation before the route
        const swaggerDoc = generateSwaggerDocForRoute(line, config.basePath, config.tag);
        if (swaggerDoc) {
          newLines.push('');
          newLines.push(swaggerDoc);
        }
      }
      
      newLines.push(line);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`✅ Added comprehensive Swagger docs to ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  const routesDir = path.join(__dirname, '../routes');
  
  console.log('🚀 Adding comprehensive Swagger documentation to route files...\n');
  
  let processedCount = 0;
  
  Object.entries(routeConfigs).forEach(([fileName, config]) => {
    const filePath = path.join(routesDir, fileName);
    
    if (fs.existsSync(filePath)) {
      addSwaggerDocsToFile(filePath, config);
      processedCount++;
    } else {
      console.log(`⚠️  File not found: ${fileName}`);
    }
  });
  
  console.log(`\n🎉 Processed ${processedCount} route files`);
  console.log('📝 Comprehensive Swagger documentation has been added to all route files');
}

if (require.main === module) {
  main();
}

module.exports = { addSwaggerDocsToFile };
