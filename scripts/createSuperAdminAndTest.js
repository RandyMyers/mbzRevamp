const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

// Import models
const User = require('../models/users');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    createSuperAdminAndTest();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function createSuperAdminAndTest() {
  try {
    console.log('🚀 Creating Super Admin and Testing Dashboard...\n');

    // 1. Create a new super admin user
    console.log('1. Creating new super admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await User.findOneAndUpdate(
      { email: 'testadmin@elapix.store' },
      {
        fullName: 'Test Admin',
        username: 'testadmin@elapix.store',
        email: 'testadmin@elapix.store',
        password: hashedPassword,
        role: 'super-admin',
        isStaffAccount: false,
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ Super admin created: ${superAdmin.email}`);

    // 2. Test login to get token
    console.log('\n2. Testing login to get token...');
    const loginResponse = await axios.post('http://127.0.0.1:8800/api/auth/super-admin/login', {
      username: 'testadmin@elapix.store',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Failed to login: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // 3. Test the dashboard overview endpoint
    console.log('\n3. Testing dashboard overview endpoint...');
    const dashboardResponse = await axios.get('http://127.0.0.1:8800/api/admin/hr/dashboard', {
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

    // 4. Test other HR endpoints
    console.log('\n4. Testing other HR endpoints...');
    
    // Test employees list
    try {
      const employeesResponse = await axios.get('http://127.0.0.1:8800/api/admin/hr/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (employeesResponse.data.success) {
        console.log(`✅ Employees list: ${employeesResponse.data.employees?.length || 0} employees found`);
      } else {
        console.log('❌ Employees list failed:', employeesResponse.data.message);
      }
    } catch (err) {
      console.log('❌ Employees list error:', err.response?.data?.message || err.message);
    }

    // Test attendance calendar
    try {
      const calendarResponse = await axios.get('http://127.0.0.1:8800/api/admin/hr/attendance/calendar?year=2024&month=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (calendarResponse.data.success) {
        console.log(`✅ Attendance calendar: ${calendarResponse.data.data.days?.length || 0} days found`);
      } else {
        console.log('❌ Attendance calendar failed:', calendarResponse.data.message);
      }
    } catch (err) {
      console.log('❌ Attendance calendar error:', err.response?.data?.message || err.message);
    }

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    mongoose.connection.close();
  }
}
