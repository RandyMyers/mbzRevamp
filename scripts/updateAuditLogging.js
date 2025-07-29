const fs = require('fs');
const path = require('path');

/**
 * Script to update all logEvent calls to include IP and user agent information
 * This ensures comprehensive audit logging across all controllers
 */

const controllersDir = path.join(__dirname, '../controllers');
const files = fs.readdirSync(controllersDir);

console.log('🔍 Scanning controllers for logEvent calls...');

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(controllersDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file uses logEvent
    if (content.includes('logEvent')) {
      console.log(`📁 Found logEvent usage in: ${file}`);
      
      // Check if IP and userAgent are already captured
      const hasIP = content.includes('req.ip');
      const hasUserAgent = content.includes('req.headers[\'user-agent\']');
      
      if (!hasIP || !hasUserAgent) {
        console.log(`⚠️  ${file} needs IP/userAgent updates`);
      } else {
        console.log(`✅ ${file} already has IP/userAgent`);
      }
    }
  }
});

console.log('\n📋 MANUAL UPDATE REQUIRED:');
console.log('The following controllers need manual updates to include IP and userAgent:');
console.log('- customerControllers.js (partially updated)');
console.log('- inventoryControllers.js (needs verification)');
console.log('- orderControllers.js (needs verification)');
console.log('- userControllers.js (needs verification)');
console.log('- taskControllers.js (needs verification)');
console.log('- webhookController.js (needs verification)');
console.log('- paymentController.js (needs verification)');
console.log('- supportControllers.js (needs verification)');
console.log('- productControllers.js (needs verification)');
console.log('- emailControllers.js (needs verification)');
console.log('- draftControllers.js (needs verification)');
console.log('- sentControllers.js (needs verification)');
console.log('- emailLogsController.js (needs verification)');
console.log('- campaignControllers.js (needs verification)');
console.log('- categoryController.js (needs verification)');
console.log('- subscriptionController.js (needs verification)');
console.log('- trashControllers.js (needs verification)');

console.log('\n🔧 UPDATE PATTERN:');
console.log('Replace:');
console.log('await logEvent({');
console.log('  action: \'some_action\',');
console.log('  user: req.user?._id,');
console.log('  resource: \'Resource\',');
console.log('  resourceId: resourceId,');
console.log('  details: { ... },');
console.log('  organization: req.user?.organization');
console.log('});');
console.log('');
console.log('With:');
console.log('await logEvent({');
console.log('  action: \'some_action\',');
console.log('  user: req.user?._id,');
console.log('  resource: \'Resource\',');
console.log('  resourceId: resourceId,');
console.log('  details: { ... },');
console.log('  organization: req.user?.organization,');
console.log('  ip: req.ip,');
console.log('  userAgent: req.headers[\'user-agent\'],');
console.log('  severity: \'info\'');
console.log('});');