const fs = require('fs');
const path = require('path');

/**
 * Script to enable SSL bypass for WooCommerce API calls
 * This is for development/testing only - NOT for production use
 */

const envPath = path.join(__dirname, '..', '.env');

function enableSSLBypass() {
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Check if WOOCOMMERCE_BYPASS_SSL already exists
    if (envContent.includes('WOOCOMMERCE_BYPASS_SSL')) {
      console.log('⚠️  WOOCOMMERCE_BYPASS_SSL already exists in .env file');
      
      // Update existing value
      envContent = envContent.replace(
        /WOOCOMMERCE_BYPASS_SSL\s*=\s*.*/,
        'WOOCOMMERCE_BYPASS_SSL=true'
      );
    } else {
      // Add new environment variable
      envContent += '\n# SSL Bypass for WooCommerce API (DEVELOPMENT ONLY)\n';
      envContent += 'WOOCOMMERCE_BYPASS_SSL=true\n';
    }
    
    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ SSL bypass enabled for WooCommerce API calls');
    console.log('⚠️  WARNING: This bypasses SSL certificate validation');
    console.log('⚠️  WARNING: Only use this for development/testing');
    console.log('⚠️  WARNING: For production, renew your SSL certificate instead');
    console.log('');
    console.log('🔄 Please restart your server for changes to take effect');
    console.log('📝 Added to .env: WOOCOMMERCE_BYPASS_SSL=true');
    
  } catch (error) {
    console.error('❌ Error enabling SSL bypass:', error.message);
    process.exit(1);
  }
}

function disableSSLBypass() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file does not exist');
      return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove SSL bypass configuration
    envContent = envContent.replace(/\n# SSL Bypass for WooCommerce API \(DEVELOPMENT ONLY\)\n/, '');
    envContent = envContent.replace(/\nWOOCOMMERCE_BYPASS_SSL\s*=\s*.*\n/, '\n');
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ SSL bypass disabled');
    console.log('🔄 Please restart your server for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error disabling SSL bypass:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file does not exist');
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const sslBypassMatch = envContent.match(/WOOCOMMERCE_BYPASS_SSL\s*=\s*(.*)/);
    
    if (sslBypassMatch) {
      const value = sslBypassMatch[1].trim();
      console.log(`📊 SSL Bypass Status: ${value === 'true' ? 'ENABLED' : 'DISABLED'}`);
      
      if (value === 'true') {
        console.log('⚠️  WARNING: SSL certificate validation is bypassed');
        console.log('⚠️  WARNING: This should only be used for development/testing');
      }
    } else {
      console.log('📊 SSL Bypass Status: NOT CONFIGURED');
    }
    
  } catch (error) {
    console.error('❌ Error checking SSL bypass status:', error.message);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'enable':
    enableSSLBypass();
    break;
  case 'disable':
    disableSSLBypass();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('SSL Bypass Management Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/enableSSLBypass.js enable   - Enable SSL bypass (development only)');
    console.log('  node scripts/enableSSLBypass.js disable  - Disable SSL bypass');
    console.log('  node scripts/enableSSLBypass.js status   - Show current status');
    console.log('');
    console.log('⚠️  WARNING: SSL bypass should ONLY be used for development/testing');
    console.log('⚠️  WARNING: For production, renew your SSL certificate instead');
    break;
}
