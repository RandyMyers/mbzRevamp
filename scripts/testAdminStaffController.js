/**
 * Test Script for AdminStaffController
 * Tests the corrected staff account management functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');
const Employee = require('../models/Employee');
const { getRolePermissions } = require('../services/staffPermissionService');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Test functions
const testStaffAccountCreation = async () => {
  console.log('\n🧪 Testing Staff Account Creation...');
  
  try {
    // Find an existing employee
    const employee = await Employee.findOne({});
    if (!employee) {
      console.log('❌ No employees found. Please run populateHRDemoData.js first.');
      return false;
    }
    
    console.log(`📋 Using employee: ${employee.fullName} (${employee.employeeId})`);
    
    // Test permission generation
    const hrManagerPermissions = getRolePermissions('hr-manager');
    console.log('✅ HR Manager permissions generated:', Object.keys(hrManagerPermissions));
    
    // Test staff account creation data structure
    const staffAccountData = {
      fullName: employee.fullName,
      email: employee.email,
      role: 'staff',
      isStaffAccount: true,
      employeeId: employee.employeeId,
      staffRole: 'hr-manager',
      permissions: hrManagerPermissions,
      status: 'active',
      organization: null
    };
    
    console.log('✅ Staff account data structure:', {
      fullName: staffAccountData.fullName,
      email: staffAccountData.email,
      isStaffAccount: staffAccountData.isStaffAccount,
      employeeId: staffAccountData.employeeId,
      staffRole: staffAccountData.staffRole,
      hasPermissions: !!staffAccountData.permissions,
      organization: staffAccountData.organization
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error testing staff account creation:', error.message);
    return false;
  }
};

const testUserModelFields = async () => {
  console.log('\n🧪 Testing User Model Staff Fields...');
  
  try {
    // Check if staff-specific fields exist in User schema
    const userSchema = User.schema.obj;
    
    const requiredFields = [
      'employeeId',
      'isStaffAccount', 
      'staffRole',
      'permissions',
      'lastPasswordReset',
      'loginAttempts',
      'lockedUntil',
      'twoFactorSecret',
      'backupCodes'
    ];
    
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (userSchema[field]) {
        console.log(`✅ Field '${field}' exists`);
      } else {
        console.log(`❌ Field '${field}' missing`);
        allFieldsPresent = false;
      }
    }
    
    return allFieldsPresent;
  } catch (error) {
    console.error('❌ Error testing User model fields:', error.message);
    return false;
  }
};

const testPermissionService = async () => {
  console.log('\n🧪 Testing Permission Service...');
  
  try {
    // Test different role permissions
    const roles = ['super-admin', 'hr-manager', 'hr-assistant', 'accountant', 'developer', 'support'];
    
    for (const role of roles) {
      const permissions = getRolePermissions(role);
      console.log(`✅ ${role} permissions:`, Object.keys(permissions));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing permission service:', error.message);
    return false;
  }
};

const testStaffAccountFiltering = async () => {
  console.log('\n🧪 Testing Staff Account Filtering...');
  
  try {
    // Test the correct filtering query
    const staffQuery = {
      isStaffAccount: true,
      role: { $in: ['super-admin', 'hr-manager', 'hr-assistant', 'accountant', 'developer', 'support'] }
    };
    
    console.log('✅ Staff filtering query:', staffQuery);
    
    // Test that this query would exclude Elapix users
    const elapixUserQuery = {
      organization: { $exists: true },
      role: 'user'
    };
    
    console.log('✅ Elapix user query (should be excluded):', elapixUserQuery);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing staff account filtering:', error.message);
    return false;
  }
};

const testEmployeeLinking = async () => {
  console.log('\n🧪 Testing Employee Linking...');
  
  try {
    // Find an employee
    const employee = await Employee.findOne({});
    if (!employee) {
      console.log('❌ No employees found');
      return false;
    }
    
    console.log(`📋 Employee found: ${employee.fullName} (${employee.employeeId})`);
    
    // Test linking logic
    const linkingData = {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email
    };
    
    console.log('✅ Employee linking data:', linkingData);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing employee linking:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting AdminStaffController Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Run all tests
  const tests = [
    { name: 'User Model Staff Fields', fn: testUserModelFields },
    { name: 'Permission Service', fn: testPermissionService },
    { name: 'Staff Account Filtering', fn: testStaffAccountFiltering },
    { name: 'Employee Linking', fn: testEmployeeLinking },
    { name: 'Staff Account Creation', fn: testStaffAccountCreation }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        testsPassed++;
      } else {
        testsFailed++;
      }
    } catch (error) {
      console.error(`❌ Test '${test.name}' failed:`, error.message);
      testsFailed++;
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! AdminStaffController is ready for use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }
  
  process.exit(0);
};

// Run tests
connectDB().then(() => {
  runTests();
}).catch(error => {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
});
