const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/users');
const Organization = require('../models/organization');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Training = require('../models/Training');
const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const PerformanceReview = require('../models/PerformanceReview');
const Payroll = require('../models/Payroll');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    populateDemoData();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function populateDemoData() {
  try {
    console.log('🚀 Starting HR Demo Data Population...\n');

    // 1. Find existing super admin user
    console.log('👤 Finding existing super admin user...');
    const demoUser = await User.findOne({ role: 'super-admin' });
    
    if (!demoUser) {
      throw new Error('No super admin user found. Please create a super admin user first.');
    }
    
    console.log(`✅ Using existing super admin user: ${demoUser.email} (ID: ${demoUser._id})`);

    // 2. Create Departments
    console.log('🏢 Creating departments...');
    const departments = [
      { name: 'Engineering', description: 'Software development and technical operations' },
      { name: 'Human Resources', description: 'Employee management and organizational development' },
      { name: 'Marketing', description: 'Brand promotion and customer acquisition' },
      { name: 'Sales', description: 'Customer acquisition and revenue generation' },
      { name: 'Finance', description: 'Financial management and accounting' },
      { name: 'Operations', description: 'Business operations and process management' }
    ];

    const createdDepartments = [];
    for (const dept of departments) {
      const department = await Department.findOneAndUpdate(
        { name: dept.name },
        dept,
        { upsert: true, new: true }
      );
      createdDepartments.push(department);
    }
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // 4. Create Demo Employees
    console.log('👥 Creating demo employees...');
    const employees = [
      {
        fullName: 'John Smith',
        email: 'john.smith@elapix.store',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1 (555) 100-0001',
        jobTitle: 'Senior Software Engineer',
        department: createdDepartments[0]._id, // Engineering
        startDate: new Date('2023-01-15'),
        gender: 'Male',
        maritalStatus: 'Married',
        status: 'Active',
        salary: 95000
      },
      {
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@elapix.store',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1 (555) 100-0002',
        jobTitle: 'HR Manager',
        department: createdDepartments[1]._id, // HR
        startDate: new Date('2022-08-20'),
        gender: 'Female',
        maritalStatus: 'Single',
        status: 'Active',
        salary: 75000
      },
      {
        fullName: 'Mike Davis',
        email: 'mike.davis@elapix.store',
        firstName: 'Mike',
        lastName: 'Davis',
        phone: '+1 (555) 100-0003',
        jobTitle: 'Marketing Director',
        department: createdDepartments[2]._id, // Marketing
        startDate: new Date('2023-03-10'),
        gender: 'Male',
        maritalStatus: 'Married',
        status: 'Active',
        salary: 85000
      },
      {
        fullName: 'Emily Brown',
        email: 'emily.brown@elapix.store',
        firstName: 'Emily',
        lastName: 'Brown',
        phone: '+1 (555) 100-0004',
        jobTitle: 'Sales Representative',
        department: createdDepartments[3]._id, // Sales
        startDate: new Date('2023-06-01'),
        gender: 'Female',
        maritalStatus: 'Single',
        status: 'Active',
        salary: 65000
      },
      {
        fullName: 'David Wilson',
        email: 'david.wilson@elapix.store',
        firstName: 'David',
        lastName: 'Wilson',
        phone: '+1 (555) 100-0005',
        jobTitle: 'Financial Analyst',
        department: createdDepartments[4]._id, // Finance
        startDate: new Date('2022-11-15'),
        gender: 'Male',
        maritalStatus: 'Married',
        status: 'Active',
        salary: 70000
      }
    ];

    const createdEmployees = [];
    for (const emp of employees) {
      // Generate employee ID using the model's static method (Mb001Z format)
      const employeeId = await Employee.generateEmployeeId();
      const employeeData = { ...emp, employeeId };
      
      const employee = await Employee.findOneAndUpdate(
        { email: emp.email },
        employeeData,
        { upsert: true, new: true }
      );
      createdEmployees.push(employee);
    }
    console.log(`✅ Created ${createdEmployees.length} employees`);

    // 5. Create Training Programs
    console.log('🎓 Creating training programs...');
    const trainings = [
      {
        name: 'New Employee Orientation',
        description: 'Comprehensive orientation program for new hires',
        status: 'published',
        createdBy: demoUser._id
      },
      {
        name: 'JavaScript Advanced Concepts',
        description: 'Advanced JavaScript programming techniques',
        status: 'published',
        createdBy: demoUser._id
      },
      {
        name: 'Sales Training Program',
        description: 'Comprehensive sales techniques and strategies',
        status: 'published',
        createdBy: demoUser._id
      }
    ];

    const createdTrainings = [];
    for (const training of trainings) {
      const newTraining = await Training.findOneAndUpdate(
        { name: training.name },
        training,
        { upsert: true, new: true }
      );
      createdTrainings.push(newTraining);
    }
    console.log(`✅ Created ${createdTrainings.length} training programs`);

    // 6. Create Job Postings
    console.log('💼 Creating job postings...');
    const jobPostings = [
      {
        title: 'Frontend Developer',
        description: 'We are looking for a skilled frontend developer to join our team.',
        department: createdDepartments[0]._id, // Engineering
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-level',
        salaryRange: '$80,000 - $120,000',
        status: 'Open',
        requirements: [
          '3+ years of React experience',
          'Strong JavaScript skills',
          'Experience with modern CSS frameworks',
          'Knowledge of Git version control'
        ],
        responsibilities: [
          'Develop user-facing features',
          'Optimize applications for maximum speed',
          'Collaborate with backend developers',
          'Ensure cross-browser compatibility'
        ],
        postedBy: demoUser._id
      },
      {
        title: 'Marketing Specialist',
        description: 'Join our marketing team to help grow our brand presence.',
        department: createdDepartments[2]._id, // Marketing
        location: 'Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Entry-level',
        salaryRange: '$50,000 - $70,000',
        status: 'Open',
        requirements: [
          'Bachelor\'s degree in Marketing',
          '1+ years of digital marketing experience',
          'Knowledge of social media platforms',
          'Strong communication skills'
        ],
        responsibilities: [
          'Develop marketing campaigns',
          'Manage social media accounts',
          'Analyze marketing metrics',
          'Collaborate with sales team'
        ],
        postedBy: demoUser._id
      }
    ];

    const createdJobPostings = [];
    for (const job of jobPostings) {
      const newJob = await JobPosting.findOneAndUpdate(
        { title: job.title },
        job,
        { upsert: true, new: true }
      );
      createdJobPostings.push(newJob);
    }
    console.log(`✅ Created ${createdJobPostings.length} job postings`);

    // 7. Create Sample Applicants
    console.log('📝 Creating sample applicants...');
    const applicants = [
      {
        jobId: createdJobPostings[0]._id,
        name: 'Alice Cooper',
        email: 'alice.cooper@email.com',
        phone: '+1 (555) 200-0001',
        resume: 'https://example.com/resumes/alice-cooper.pdf',
        coverLetter: 'I am excited to apply for the Frontend Developer position...',
        status: 'Under Review',
        appliedDate: new Date()
      },
      {
        jobId: createdJobPostings[1]._id,
        name: 'Bob Taylor',
        email: 'bob.taylor@email.com',
        phone: '+1 (555) 200-0002',
        resume: 'https://example.com/resumes/bob-taylor.pdf',
        coverLetter: 'I am interested in the Marketing Specialist role...',
        status: 'Interview Scheduled',
        appliedDate: new Date()
      }
    ];

    const createdApplicants = [];
    for (const applicant of applicants) {
      const newApplicant = await Applicant.findOneAndUpdate(
        { email: applicant.email, jobId: applicant.jobId },
        applicant,
        { upsert: true, new: true }
      );
      createdApplicants.push(newApplicant);
    }
    console.log(`✅ Created ${createdApplicants.length} applicants`);

    // 8. Create Leave Requests
    console.log('🏖️ Creating leave requests...');
    const leaveRequests = [
      {
        employee: createdEmployees[0]._id,
        leaveType: 'Annual Leave',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-02-20'),
        reason: 'Family vacation',
        status: 'Approved',
        requestedDate: new Date('2024-01-15'),
        approvedBy: demoUser._id
      },
      {
        employee: createdEmployees[1]._id,
        leaveType: 'Sick Leave',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-22'),
        reason: 'Medical appointment',
        status: 'Pending',
        requestedDate: new Date('2024-01-18')
      }
    ];

    const createdLeaveRequests = [];
    for (const leave of leaveRequests) {
      const newLeave = await LeaveRequest.findOneAndUpdate(
        { 
          employee: leave.employee, 
          startDate: leave.startDate,
          endDate: leave.endDate 
        },
        leave,
        { upsert: true, new: true }
      );
      createdLeaveRequests.push(newLeave);
    }
    console.log(`✅ Created ${createdLeaveRequests.length} leave requests`);

    // 9. Create Leave Balances
    console.log('📊 Creating leave balances...');
    for (const employee of createdEmployees) {
      await LeaveBalance.findOneAndUpdate(
        { employee: employee._id },
        {
          employee: employee._id,
          annualLeave: 20,
          sickLeave: 10,
          personalLeave: 5,
          usedAnnualLeave: 5,
          usedSickLeave: 2,
          usedPersonalLeave: 1
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created leave balances for ${createdEmployees.length} employees`);

    // 10. Create Performance Reviews
    console.log('⭐ Creating performance reviews...');
    const performanceReviews = [
      {
        employee: createdEmployees[0]._id,
        reviewer: demoUser._id,
        title: 'Q4 2023 Performance Review',
        scheduledAt: new Date('2023-12-31'),
        locationType: 'online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: 'completed',
        feedback: 'Excellent performance this quarter. Successfully delivered 3 major features and mentored junior developers.',
        acknowledged: true
      },
      {
        employee: createdEmployees[1]._id,
        reviewer: demoUser._id,
        title: 'Q4 2023 Performance Review',
        scheduledAt: new Date('2024-01-15'),
        locationType: 'in_person',
        status: 'upcoming',
        feedback: '',
        acknowledged: false
      }
    ];

    const createdReviews = [];
    for (const review of performanceReviews) {
      const newReview = await PerformanceReview.findOneAndUpdate(
        { employee: review.employee, scheduledAt: review.scheduledAt },
        review,
        { upsert: true, new: true }
      );
      createdReviews.push(newReview);
    }
    console.log(`✅ Created ${createdReviews.length} performance reviews`);

    // 11. Create Sample Payroll Data
    console.log('💰 Creating sample payroll data...');
    const payrollData = {
      month: 1,
      year: 2024,
      currency: 'USD',
      items: createdEmployees.map(emp => ({
        employee: emp._id,
        gross: emp.salary,
        pension: emp.salary * 0.08,
        nhf: emp.salary * 0.02,
        cra: emp.salary * 0.15,
        taxableIncome: emp.salary * 0.75,
        paye: emp.salary * 0.20,
        netPay: emp.salary * 0.55
      })),
      totals: {
        gross: createdEmployees.reduce((sum, emp) => sum + emp.salary, 0),
        pension: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.08), 0),
        nhf: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.02), 0),
        cra: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.15), 0),
        taxableIncome: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.75), 0),
        paye: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.20), 0),
        netPay: createdEmployees.reduce((sum, emp) => sum + (emp.salary * 0.55), 0)
      }
    };

    await Payroll.findOneAndUpdate(
      { month: payrollData.month, year: payrollData.year },
      payrollData,
      { upsert: true, new: true }
    );
    console.log(`✅ Created payroll data for ${payrollData.month}/${payrollData.year}`);

    console.log('\n🎉 HR Demo Data Population Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Super Admin User: ${demoUser.email} (ID: ${demoUser._id})`);
    console.log(`   🏢 Departments: ${createdDepartments.length}`);
    console.log(`   👥 Employees: ${createdEmployees.length} (with Mb001Z format IDs)`);
    console.log(`   🎓 Training Programs: ${createdTrainings.length}`);
    console.log(`   💼 Job Postings: ${createdJobPostings.length}`);
    console.log(`   📝 Applicants: ${createdApplicants.length}`);
    console.log(`   🏖️ Leave Requests: ${createdLeaveRequests.length}`);
    console.log(`   ⭐ Performance Reviews: ${createdReviews.length}`);
    console.log(`   💰 Payroll Records: 1 (January 2024)`);
    
    console.log('\n🚀 Ready for frontend integration testing!');
    console.log('\n📝 Note: All HR data is associated with the existing super admin user');
    console.log('   Employee IDs follow the correct Mb001Z, Mb002Z format');
    console.log('   No organization references (super admin system)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating demo data:', error);
    process.exit(1);
  }
}
