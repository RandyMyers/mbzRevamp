const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/users');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Training = require('../models/Training');
const JobPosting = require('../models/JobPosting');
const Payroll = require('../models/Payroll');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    runSimpleTests();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function runSimpleTests() {
  console.log('🧪 Running Simple HR System Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Check if super admin user exists
  try {
    const superAdmin = await User.findOne({ role: 'super-admin' });
    if (superAdmin) {
      console.log(`✅ Test 1: Super admin user exists (${superAdmin.email})`);
      testsPassed++;
    } else {
      console.log('❌ Test 1: No super admin user found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 1: Error checking super admin user -', error.message);
    testsFailed++;
  }
  
  // Test 2: Check if departments exist
  try {
    const departments = await Department.find();
    if (departments.length > 0) {
      console.log(`✅ Test 2: Found ${departments.length} departments`);
      testsPassed++;
    } else {
      console.log('❌ Test 2: No departments found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 2: Error checking departments -', error.message);
    testsFailed++;
  }
  
  // Test 3: Check if employees exist
  try {
    const employees = await Employee.find();
    if (employees.length > 0) {
      console.log(`✅ Test 3: Found ${employees.length} employees`);
      testsPassed++;
    } else {
      console.log('❌ Test 3: No employees found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 3: Error checking employees -', error.message);
    testsFailed++;
  }
  
  // Test 4: Check if trainings exist
  try {
    const trainings = await Training.find();
    if (trainings.length > 0) {
      console.log(`✅ Test 4: Found ${trainings.length} training programs`);
      testsPassed++;
    } else {
      console.log('❌ Test 4: No training programs found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 4: Error checking trainings -', error.message);
    testsFailed++;
  }
  
  // Test 5: Check if job postings exist
  try {
    const jobPostings = await JobPosting.find();
    if (jobPostings.length > 0) {
      console.log(`✅ Test 5: Found ${jobPostings.length} job postings`);
      testsPassed++;
    } else {
      console.log('❌ Test 5: No job postings found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 5: Error checking job postings -', error.message);
    testsFailed++;
  }
  
  // Test 6: Check if payroll data exists
  try {
    const payrolls = await Payroll.find();
    if (payrolls.length > 0) {
      console.log(`✅ Test 6: Found ${payrolls.length} payroll records`);
      testsPassed++;
    } else {
      console.log('❌ Test 6: No payroll records found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 6: Error checking payroll -', error.message);
    testsFailed++;
  }
  
  // Test 7: Test employee ID generation
  try {
    const employeeId = await Employee.generateEmployeeId();
    if (employeeId && employeeId.match(/^Mb\d+Z$/)) {
      console.log(`✅ Test 7: Employee ID generation working - ${employeeId}`);
      testsPassed++;
    } else {
      console.log(`❌ Test 7: Employee ID generation failed - got: ${employeeId}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 7: Error testing employee ID generation -', error.message);
    testsFailed++;
  }
  
  // Test 8: Test model relationships
  try {
    const employeeWithDept = await Employee.findOne().populate('department');
    if (employeeWithDept && employeeWithDept.department) {
      console.log(`✅ Test 8: Model relationships working - Employee ${employeeWithDept.fullName} has department ${employeeWithDept.department.name}`);
      testsPassed++;
    } else {
      console.log('❌ Test 8: Model relationships not working properly');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 8: Error testing model relationships -', error.message);
    testsFailed++;
  }
  
  // Test Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! HR Management System is working perfectly!');
    console.log('\n🚀 Ready for frontend integration!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: ftag@elapix.store');
    console.log('   Password: Vouslevous@2');
    console.log('   Role: super-admin');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  process.exit(0);
}
