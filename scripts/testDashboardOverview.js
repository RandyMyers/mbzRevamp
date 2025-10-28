const axios = require('axios');

// Test the HR dashboard overview endpoint
async function testDashboardOverview() {
  try {
    console.log('🧪 Testing HR Dashboard Overview Endpoint...\n');
    
    // First, let's get a super admin token
    console.log('1. Getting super admin authentication token...');
    const loginResponse = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'info@ftag.ng',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Failed to login: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Test the dashboard overview endpoint
    console.log('2. Testing dashboard overview endpoint...');
    const dashboardResponse = await axios.get('http://127.0.0.1:5000/api/admin/hr/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard overview retrieved successfully!\n');
      console.log('📊 Dashboard Data:');
      console.log('==================');
      
      const data = dashboardResponse.data.data;
      
      // Statistics
      console.log('\n📈 Statistics:');
      console.log(`   Total Employees: ${data.statistics.totalEmployees}`);
      console.log(`   On Leave: ${data.statistics.onLeave}`);
      console.log(`   Pending Requests: ${data.statistics.pendingRequests}`);
      console.log(`   New Hires (30 days): ${data.statistics.newHires}`);
      console.log(`   Payroll Status: ${data.statistics.payrollStatus}`);
      console.log(`   Performance Reviews: ${data.statistics.performanceReviews}`);
      console.log(`   Average Attendance: ${data.statistics.averageAttendance}%`);
      
      // Activities
      console.log('\n📋 Recent Activities:');
      
      if (data.activities.leaveRequests && data.activities.leaveRequests.length > 0) {
        console.log('\n   🏖️  Leave Requests:');
        data.activities.leaveRequests.forEach((request, index) => {
          console.log(`      ${index + 1}. ${request.name} - ${request.description} (${request.status})`);
        });
      } else {
        console.log('   🏖️  Leave Requests: None');
      }
      
      if (data.activities.upcomingReviews && data.activities.upcomingReviews.length > 0) {
        console.log('\n   📝 Upcoming Reviews:');
        data.activities.upcomingReviews.forEach((review, index) => {
          console.log(`      ${index + 1}. ${review.name} - ${review.description} (${review.status})`);
        });
      } else {
        console.log('   📝 Upcoming Reviews: None');
      }
      
      if (data.activities.recentHires && data.activities.recentHires.length > 0) {
        console.log('\n   👥 Recent Hires:');
        data.activities.recentHires.forEach((hire, index) => {
          console.log(`      ${index + 1}. ${hire.name} - ${hire.description} (${hire.status})`);
        });
      } else {
        console.log('   👥 Recent Hires: None');
      }
      
      console.log('\n✅ Dashboard test completed successfully!');
      
    } else {
      console.log('❌ Dashboard overview failed:');
      console.log('Error:', dashboardResponse.data.error);
      console.log('Message:', dashboardResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDashboardOverview();
