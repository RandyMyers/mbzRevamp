const axios = require('axios');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'ftag@elapix.store',
  password: 'Vouslevous@2'
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    const result = await testFunction();
    if (result.success) {
      console.log(`✅ PASSED: ${testName}`);
      testResults.passed++;
    } else {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${JSON.stringify(result.error)}`);
      testResults.failed++;
      testResults.errors.push({ test: testName, error: result.error });
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

// Authentication test
async function testAuthentication() {
  const response = await makeRequest('POST', '/auth/login', TEST_USER);
  if (response.success && response.data.token) {
    authToken = response.data.token;
    return { success: true };
  }
  return { success: false, error: 'Authentication failed' };
}

// HR Management Tests
async function testListEmployees() {
  return await makeRequest('GET', '/admin/hr/employees');
}

async function testCreateEmployee() {
  const employeeData = {
    fullName: 'Test Employee',
    email: 'test.employee@elapix.store',
    firstName: 'Test',
    lastName: 'Employee',
    phone: '+1 (555) 999-9999',
    jobTitle: 'Test Developer',
    department: '507f1f77bcf86cd799439011', // Will be replaced with actual department ID
    startDate: new Date().toISOString(),
    gender: 'Male',
    maritalStatus: 'Single'
  };
  return await makeRequest('POST', '/admin/hr/employees', employeeData);
}

async function testListDepartments() {
  return await makeRequest('GET', '/admin/hr/departments');
}

async function testCreateDepartment() {
  const departmentData = {
    name: 'Test Department',
    description: 'A test department for testing purposes'
  };
  return await makeRequest('POST', '/admin/hr/departments', departmentData);
}

// Training Management Tests
async function testListTrainings() {
  return await makeRequest('GET', '/admin/training/trainings');
}

async function testCreateTraining() {
  const trainingData = {
    name: 'Test Training Program',
    description: 'A test training program for testing purposes',
    status: 'published'
  };
  return await makeRequest('POST', '/admin/training/trainings', trainingData);
}

// Recruitment Management Tests
async function testListJobPostings() {
  return await makeRequest('GET', '/admin/recruitment/job-postings');
}

async function testCreateJobPosting() {
  const jobData = {
    title: 'Test Developer Position',
    description: 'A test developer position for testing purposes',
    department: '507f1f77bcf86cd799439011',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryRange: '$60,000 - $80,000',
    status: 'Open',
    requirements: ['Test requirement 1', 'Test requirement 2'],
    responsibilities: ['Test responsibility 1', 'Test responsibility 2']
  };
  return await makeRequest('POST', '/admin/recruitment/job-postings', jobData);
}

// Payroll Management Tests
async function testPayrollHistory() {
  return await makeRequest('GET', '/admin/payroll/history');
}

async function testProcessPayroll() {
  const payrollData = {
    month: 2,
    year: 2024,
    currency: 'USD'
  };
  return await makeRequest('POST', '/admin/payroll/process', payrollData);
}

// Benefits Management Tests
async function testListBenefits() {
  return await makeRequest('GET', '/admin/benefits');
}

async function testCreateBenefit() {
  const benefitData = {
    name: 'Test Health Insurance',
    description: 'Test health insurance benefit',
    type: 'Health',
    coverage: 'Full',
    cost: 500,
    status: 'Active'
  };
  return await makeRequest('POST', '/admin/benefits', benefitData);
}

// Employee Self-Service Tests
async function testEmployeeProfile() {
  return await makeRequest('GET', '/employee/profile');
}

async function testEmployeeLeaveRequests() {
  return await makeRequest('GET', '/employee/leave-requests');
}

async function testEmployeePayrollInfo() {
  return await makeRequest('GET', '/employee/payroll-info');
}

// Document Management Tests
async function testListDocuments() {
  return await makeRequest('GET', '/admin/documents');
}

async function testCreateDocument() {
  const documentData = {
    title: 'Test Document',
    description: 'A test document for testing purposes',
    type: 'Policy',
    category: 'HR',
    accessLevel: 'Public'
  };
  return await makeRequest('POST', '/admin/documents', documentData);
}

// Workflow Automation Tests
async function testListWorkflows() {
  return await makeRequest('GET', '/admin/workflow/rules');
}

async function testCreateWorkflow() {
  const workflowData = {
    name: 'Test Workflow',
    description: 'A test workflow for testing purposes',
    trigger: 'employee_created',
    conditions: [],
    actions: ['send_notification'],
    status: 'Active'
  };
  return await makeRequest('POST', '/admin/workflow/rules', workflowData);
}

// HR Reporting Tests
async function testHRReports() {
  return await makeRequest('GET', '/admin/reports');
}

async function testEmployeeAnalytics() {
  return await makeRequest('GET', '/admin/reports/employee-analytics');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting HR Management System Tests...\n');
  console.log('=' * 60);
  
  // Authentication
  await runTest('Authentication', testAuthentication);
  
  if (!authToken) {
    console.log('\n❌ Cannot proceed without authentication. Please check login credentials.');
    return;
  }
  
  // HR Management
  await runTest('List Employees', testListEmployees);
  await runTest('Create Employee', testCreateEmployee);
  await runTest('List Departments', testListDepartments);
  await runTest('Create Department', testCreateDepartment);
  
  // Training Management
  await runTest('List Trainings', testListTrainings);
  await runTest('Create Training', testCreateTraining);
  
  // Recruitment Management
  await runTest('List Job Postings', testListJobPostings);
  await runTest('Create Job Posting', testCreateJobPosting);
  
  // Payroll Management
  await runTest('Payroll History', testPayrollHistory);
  await runTest('Process Payroll', testProcessPayroll);
  
  // Benefits Management
  await runTest('List Benefits', testListBenefits);
  await runTest('Create Benefit', testCreateBenefit);
  
  // Employee Self-Service
  await runTest('Employee Profile', testEmployeeProfile);
  await runTest('Employee Leave Requests', testEmployeeLeaveRequests);
  await runTest('Employee Payroll Info', testEmployeePayrollInfo);
  
  // Document Management
  await runTest('List Documents', testListDocuments);
  await runTest('Create Document', testCreateDocument);
  
  // Workflow Automation
  await runTest('List Workflows', testListWorkflows);
  await runTest('Create Workflow', testCreateWorkflow);
  
  // HR Reporting
  await runTest('HR Reports', testHRReports);
  await runTest('Employee Analytics', testEmployeeAnalytics);
  
  // Test Summary
  console.log('\n' + '=' * 60);
  console.log('📊 TEST SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${JSON.stringify(error.error)}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! HR Management System is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);


