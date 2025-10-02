const https = require('https');
const { URL } = require('url');

/**
 * SSL Certificate Checker
 * This script checks if the SSL certificate for a given URL is valid
 */

function checkSSLCertificate(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'GET',
        rejectUnauthorized: true // This will cause the request to fail if the certificate is invalid
      };

      const req = https.request(options, (res) => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          message: 'SSL certificate is valid'
        });
      });

      req.on('error', (error) => {
        if (error.code === 'CERT_HAS_EXPIRED') {
          resolve({
            success: false,
            error: 'CERT_HAS_EXPIRED',
            message: 'SSL certificate has expired'
          });
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          resolve({
            success: false,
            error: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
            message: 'SSL certificate cannot be verified'
          });
        } else {
          resolve({
            success: false,
            error: error.code,
            message: error.message
          });
        }
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'TIMEOUT',
          message: 'Connection timeout'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        success: false,
        error: 'INVALID_URL',
        message: 'Invalid URL format'
      });
    }
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node checkSSL.js <url>');
    console.log('Example: node checkSSL.js https://imperialaccount.com');
    process.exit(1);
  }

  const url = args[0];
  console.log(`🔍 Checking SSL certificate for: ${url}`);
  console.log('─'.repeat(50));

  const result = await checkSSLCertificate(url);

  if (result.success) {
    console.log('✅ SSL Certificate Status: VALID');
    console.log(`📊 HTTP Status: ${result.statusCode}`);
    console.log(`💬 Message: ${result.message}`);
  } else {
    console.log('❌ SSL Certificate Status: INVALID');
    console.log(`🔴 Error Code: ${result.error}`);
    console.log(`💬 Message: ${result.message}`);
    
    if (result.error === 'CERT_HAS_EXPIRED') {
      console.log('\n🔧 Recommended Actions:');
      console.log('1. Contact your hosting provider to renew the SSL certificate');
      console.log('2. Use Let\'s Encrypt for free SSL certificates');
      console.log('3. Check your domain registrar for SSL certificate renewal');
      console.log('4. For testing only: Set WOOCOMMERCE_BYPASS_SSL=true in your environment');
    }
  }

  console.log('─'.repeat(50));
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkSSLCertificate };
