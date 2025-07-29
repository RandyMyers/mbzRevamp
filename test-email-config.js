const nodemailer = require('nodemailer');

// Test email configuration
async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');

  // Log current environment variables
  console.log('📧 Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'mbztechnology.com (default)');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '465 (default)');
  console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Not set');
  console.log('SMTP_FROM:', process.env.SMTP_FROM || 'Will use SMTP_USER');
  console.log('');

  // Create transporter with MBZTECH settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mbztechnology.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
    secure: true, // SSL for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    console.log('🔧 Testing SMTP Connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📋 Configuration Summary:');
    console.log(`Host: ${process.env.SMTP_HOST || 'mbztechnology.com'}`);
    console.log(`Port: ${process.env.SMTP_PORT || '465'}`);
    console.log(`Secure: true (SSL)`);
    console.log(`User: ${process.env.SMTP_USER}`);
    console.log(`From: ${process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`}`);
    
    console.log('\n🎉 Email configuration is ready for invitation emails!');
    
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if SMTP_USER and SMTP_PASS are set in .env');
    console.log('2. Verify the SMTP credentials are correct');
    console.log('3. Ensure the SMTP server allows authentication');
    console.log('4. Check if port 465 is open and SSL is enabled');
  }
}

// Run test if called directly
if (require.main === module) {
  testEmailConfig()
    .then(() => {
      console.log('\n✅ Email configuration test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Email configuration test failed:', error);
      process.exit(1);
    });
}

module.exports = testEmailConfig; 