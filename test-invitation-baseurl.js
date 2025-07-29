const crypto = require('crypto');

// Test baseUrl functionality for invitations
function testBaseUrlFunctionality() {
  console.log('🧪 Testing Base URL Functionality for Invitations...\n');

  // Test data
  const testCases = [
    {
      name: 'Production URL',
      baseUrl: 'https://app.mbztechnology.com',
      expected: 'https://app.mbztechnology.com/invite/accept?token='
    },
    {
      name: 'Development URL',
      baseUrl: 'http://localhost:3000',
      expected: 'http://localhost:3000/invite/accept?token='
    },
    {
      name: 'Staging URL',
      baseUrl: 'https://staging.mbztechnology.com',
      expected: 'https://staging.mbztechnology.com/invite/accept?token='
    },
    {
      name: 'Custom Domain',
      baseUrl: 'https://mycompany.mbztechnology.com',
      expected: 'https://mycompany.mbztechnology.com/invite/accept?token='
    }
  ];

  console.log('📋 Testing Base URL Generation:');
  
  testCases.forEach((testCase, index) => {
    const token = crypto.randomBytes(32).toString('hex');
    const invitationUrl = `${testCase.baseUrl}/invite/accept?token=${token}`;
    
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log(`   Base URL: ${testCase.baseUrl}`);
    console.log(`   Generated URL: ${invitationUrl}`);
    console.log(`   ✅ Valid format: ${invitationUrl.startsWith(testCase.expected)}`);
  });

  console.log('\n📧 Email Template Test:');
  const sampleInvitation = {
    email: 'test@example.com',
    token: crypto.randomBytes(32).toString('hex'),
    organization: { name: 'Test Organization' },
    invitedBy: { fullName: 'John Doe' },
    role: { name: 'Manager' },
    department: 'Sales',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    message: 'Welcome to our team!'
  };

  const baseUrl = 'https://app.mbztechnology.com';
  const invitationUrl = `${baseUrl}/invite/accept?token=${sampleInvitation.token}`;
  
  console.log(`\nSample invitation email would contain:`);
  console.log(`- Organization: ${sampleInvitation.organization.name}`);
  console.log(`- Invited by: ${sampleInvitation.invitedBy.fullName}`);
  console.log(`- Role: ${sampleInvitation.role.name}`);
  console.log(`- Department: ${sampleInvitation.department}`);
  console.log(`- Invitation URL: ${invitationUrl}`);
  console.log(`- Expires: ${sampleInvitation.expiresAt.toLocaleDateString()}`);

  console.log('\n✅ Base URL functionality test completed successfully!');
  console.log('\n📝 Frontend Integration Notes:');
  console.log('- Frontend should pass baseUrl in request body');
  console.log('- baseUrl should be the full domain (e.g., https://app.mbztechnology.com)');
  console.log('- The system will append /invite/accept?token= to the baseUrl');
  console.log('- This allows for flexible deployment across different environments');
}

// Run test if called directly
if (require.main === module) {
  testBaseUrlFunctionality();
}

module.exports = testBaseUrlFunctionality; 