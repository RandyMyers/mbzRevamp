/**
 * Survey Response Seeding Script
 * 
 * This script seeds the database with sample survey responses
 * for testing the survey system functionality.
 * 
 * Run with: node scripts/seedSurveyResponses.js
 */

const mongoose = require('mongoose');
const connectDB = require('../helper/connectDB');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const User = require('../models/users');

// Sample response data
const sampleResponses = [
  // Customer Satisfaction Survey responses
  {
    surveyTitle: "Customer Satisfaction Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "How would you rate your overall satisfaction with our platform?", questionType: "rating", response: 5 },
          { questionId: 2, question: "How did you first hear about us?", questionType: "single-choice", response: "search-engine" },
          { questionId: 3, question: "What features do you use most frequently?", questionType: "multiple-choice", response: ["product-search", "order-tracking"] },
          { questionId: 4, question: "What improvements would you like to see on our platform?", questionType: "text", response: "Faster checkout process and better mobile experience" },
          { questionId: 5, question: "Would you recommend our platform to others?", questionType: "boolean", response: true }
        ],
        isAnonymous: false,
        timeSpent: 240 // 4 minutes
      },
      {
        responses: [
          { questionId: 1, question: "How would you rate your overall satisfaction with our platform?", questionType: "rating", response: 4 },
          { questionId: 2, question: "How did you first hear about us?", questionType: "single-choice", response: "social-media" },
          { questionId: 3, question: "What features do you use most frequently?", questionType: "multiple-choice", response: ["product-search", "customer-support"] },
          { questionId: 4, question: "What improvements would you like to see on our platform?", questionType: "text", response: "More product variety" },
          { questionId: 5, question: "Would you recommend our platform to others?", questionType: "boolean", response: true }
        ],
        isAnonymous: true,
        timeSpent: 180 // 3 minutes
      },
      {
        responses: [
          { questionId: 1, question: "How would you rate your overall satisfaction with our platform?", questionType: "rating", response: 3 },
          { questionId: 2, question: "How did you first hear about us?", questionType: "single-choice", response: "friend-referral" },
          { questionId: 3, question: "What features do you use most frequently?", questionType: "multiple-choice", response: ["order-tracking", "account-management"] },
          { questionId: 4, question: "What improvements would you like to see on our platform?", questionType: "text", response: "Better search functionality" },
          { questionId: 5, question: "Would you recommend our platform to others?", questionType: "boolean", response: false }
        ],
        isAnonymous: false,
        timeSpent: 300 // 5 minutes
      }
    ]
  },
  // Employee Engagement Survey responses
  {
    surveyTitle: "Employee Engagement Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "How satisfied are you with your current role?", questionType: "rating", response: 4 },
          { questionId: 2, question: "How would you describe the company culture?", questionType: "single-choice", response: "good" },
          { questionId: 3, question: "What aspects of your job do you find most rewarding?", questionType: "multiple-choice", response: ["challenging-work", "team-collaboration"] },
          { questionId: 4, question: "How often do you receive feedback from your manager?", questionType: "single-choice", response: "weekly" },
          { questionId: 5, question: "What suggestions do you have for improving our workplace?", questionType: "text", response: "More flexible working hours and better communication tools" },
          { questionId: 6, question: "Do you feel valued as an employee?", questionType: "boolean", response: true }
        ],
        isAnonymous: true,
        timeSpent: 360 // 6 minutes
      },
      {
        responses: [
          { questionId: 1, question: "How satisfied are you with your current role?", questionType: "rating", response: 5 },
          { questionId: 2, question: "How would you describe the company culture?", questionType: "single-choice", response: "excellent" },
          { questionId: 3, question: "What aspects of your job do you find most rewarding?", questionType: "multiple-choice", response: ["career-growth", "recognition"] },
          { questionId: 4, question: "How often do you receive feedback from your manager?", questionType: "single-choice", response: "monthly" },
          { questionId: 5, question: "What suggestions do you have for improving our workplace?", questionType: "text", response: "More team building activities" },
          { questionId: 6, question: "Do you feel valued as an employee?", questionType: "boolean", response: true }
        ],
        isAnonymous: false,
        timeSpent: 420 // 7 minutes
      }
    ]
  },
  // Product Feedback Survey responses
  {
    surveyTitle: "Product Feedback Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "Which product category did you purchase?", questionType: "single-choice", response: "electronics" },
          { questionId: 2, question: "How would you rate the product quality?", questionType: "rating", response: 5 },
          { questionId: 3, question: "How accurate was the product description?", questionType: "rating", response: 4 },
          { questionId: 4, question: "How was the packaging?", questionType: "single-choice", response: "excellent" },
          { questionId: 5, question: "What factors influenced your purchase decision?", questionType: "multiple-choice", response: ["price", "quality", "reviews"] },
          { questionId: 6, question: "What would you improve about this product?", questionType: "text", response: "Better user manual and longer warranty" }
        ],
        isAnonymous: false,
        timeSpent: 300 // 5 minutes
      },
      {
        responses: [
          { questionId: 1, question: "Which product category did you purchase?", questionType: "single-choice", response: "clothing" },
          { questionId: 2, question: "How would you rate the product quality?", questionType: "rating", response: 3 },
          { questionId: 3, question: "How accurate was the product description?", questionType: "rating", response: 4 },
          { questionId: 4, question: "How was the packaging?", questionType: "single-choice", response: "good" },
          { questionId: 5, question: "What factors influenced your purchase decision?", questionType: "multiple-choice", response: ["price", "brand"] },
          { questionId: 6, question: "What would you improve about this product?", questionType: "text", response: "Better sizing chart and more color options" }
        ],
        isAnonymous: false,
        timeSpent: 240 // 4 minutes
      }
    ]
  },
  // Website Usability Survey responses
  {
    surveyTitle: "Website Usability Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "How easy is it to navigate our website?", questionType: "rating", response: 4 },
          { questionId: 2, question: "Which device do you primarily use to access our website?", questionType: "single-choice", response: "desktop" },
          { questionId: 3, question: "What challenges do you face when using our website?", questionType: "multiple-choice", response: ["slow-loading"] },
          { questionId: 4, question: "How often do you visit our website?", questionType: "single-choice", response: "weekly" },
          { questionId: 5, question: "What features would make our website better?", questionType: "text", response: "Better search filters and wishlist functionality" }
        ],
        isAnonymous: true,
        timeSpent: 180 // 3 minutes
      },
      {
        responses: [
          { questionId: 1, question: "How easy is it to navigate our website?", questionType: "rating", response: 3 },
          { questionId: 2, question: "Which device do you primarily use to access our website?", questionType: "single-choice", response: "mobile" },
          { questionId: 3, question: "What challenges do you face when using our website?", questionType: "multiple-choice", response: ["mobile-responsive", "search-function"] },
          { questionId: 4, question: "How often do you visit our website?", questionType: "single-choice", response: "monthly" },
          { questionId: 5, question: "What features would make our website better?", questionType: "text", response: "Better mobile interface and faster loading times" }
        ],
        isAnonymous: false,
        timeSpent: 240 // 4 minutes
      }
    ]
  },
  // Customer Support Experience Survey responses
  {
    surveyTitle: "Customer Support Experience Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "How did you contact our support team?", questionType: "single-choice", response: "live-chat" },
          { questionId: 2, question: "How would you rate the response time?", questionType: "rating", response: 5 },
          { questionId: 3, question: "How satisfied are you with the solution provided?", questionType: "rating", response: 4 },
          { questionId: 4, question: "Was your issue resolved?", questionType: "single-choice", response: "completely" },
          { questionId: 5, question: "Any additional comments about your support experience?", questionType: "text", response: "Very helpful and professional support team" }
        ],
        isAnonymous: false,
        timeSpent: 120 // 2 minutes
      },
      {
        responses: [
          { questionId: 1, question: "How did you contact our support team?", questionType: "single-choice", response: "email" },
          { questionId: 2, question: "How would you rate the response time?", questionType: "rating", response: 3 },
          { questionId: 3, question: "How satisfied are you with the solution provided?", questionType: "rating", response: 3 },
          { questionId: 4, question: "Was your issue resolved?", questionType: "single-choice", response: "partially" },
          { questionId: 5, question: "Any additional comments about your support experience?", questionType: "text", response: "Response was slow but eventually helpful" }
        ],
        isAnonymous: false,
        timeSpent: 180 // 3 minutes
      }
    ]
  },
  // Market Research Survey responses
  {
    surveyTitle: "Market Research Survey",
    responses: [
      {
        responses: [
          { questionId: 1, question: "What is your age range?", questionType: "single-choice", response: "25-34" },
          { questionId: 2, question: "What is your annual household income?", questionType: "single-choice", response: "50k-75k" },
          { questionId: 3, question: "Which of these products interest you most?", questionType: "multiple-choice", response: ["smartphones", "laptops"] },
          { questionId: 4, question: "How important is sustainability in your purchasing decisions?", questionType: "single-choice", response: "very-important" },
          { questionId: 5, question: "What influences your online shopping decisions most?", questionType: "single-choice", response: "quality" },
          { questionId: 6, question: "What new product categories would you like to see on our platform?", questionType: "text", response: "Smart home devices and eco-friendly products" }
        ],
        isAnonymous: true,
        timeSpent: 360 // 6 minutes
      },
      {
        responses: [
          { questionId: 1, question: "What is your age range?", questionType: "single-choice", response: "35-44" },
          { questionId: 2, question: "What is your annual household income?", questionType: "single-choice", response: "75k-100k" },
          { questionId: 3, question: "Which of these products interest you most?", questionType: "multiple-choice", response: ["home-appliances", "fashion"] },
          { questionId: 4, question: "How important is sustainability in your purchasing decisions?", questionType: "single-choice", response: "somewhat-important" },
          { questionId: 5, question: "What influences your online shopping decisions most?", questionType: "single-choice", response: "reviews" },
          { questionId: 6, question: "What new product categories would you like to see on our platform?", questionType: "text", response: "Premium home decor and luxury items" }
        ],
        isAnonymous: false,
        timeSpent: 480 // 8 minutes
      }
    ]
  }
];

async function seedSurveyResponses() {
  try {
    console.log('🌱 Starting survey response seeding process...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get existing surveys
    const surveys = await Survey.find({ status: 'active' });
    const users = await User.find({});
    
    if (surveys.length === 0) {
      console.log('❌ No active surveys found. Please run seedSurveys.js first.');
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }
    
    console.log(`📊 Found ${surveys.length} active surveys and ${users.length} users`);

    // Clear existing survey responses (optional)
    const existingResponses = await SurveyResponse.countDocuments();
    if (existingResponses > 0) {
      console.log(`🗑️ Found ${existingResponses} existing survey responses. Clearing them...`);
      await SurveyResponse.deleteMany({});
      console.log('✅ Cleared existing survey responses');
    }

    let seededCount = 0;

    // Seed responses for each survey
    for (const survey of surveys) {
      console.log(`\n📝 Seeding responses for: ${survey.title}`);
      
      // Find matching response data
      const responseData = sampleResponses.find(data => data.surveyTitle === survey.title);
      
      if (!responseData) {
        console.log(`  ⚠️ No sample responses found for: ${survey.title}`);
        continue;
      }

      // Create responses
      for (let i = 0; i < responseData.responses.length; i++) {
        const responseTemplate = responseData.responses[i];
        const user = users[i % users.length]; // Rotate users
        
        const surveyResponse = new SurveyResponse({
          surveyId: survey._id,
          userId: responseTemplate.isAnonymous ? null : user._id,
          organizationId: survey.organizationId,
          responses: responseTemplate.responses,
          isAnonymous: responseTemplate.isAnonymous,
          status: 'completed',
          timeSpent: responseTemplate.timeSpent,
          startedAt: new Date(Date.now() - (responseTemplate.timeSpent * 1000)), // Started X seconds ago
          completedAt: new Date(),
          submittedAt: new Date(),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          browser: 'Chrome',
          device: 'Desktop',
          ipAddress: `192.168.1.${100 + i}`,
          sessionId: `session_${Date.now()}_${i}`,
          progress: 100
        });

        await surveyResponse.save();
        seededCount++;
        
        // Update survey statistics
        survey.totalResponses += 1;
        survey.completedResponses += 1;
        survey.averageCompletionTime = 
          ((survey.averageCompletionTime * (survey.completedResponses - 1)) + (responseTemplate.timeSpent / 60)) / survey.completedResponses;
        
        console.log(`  ✅ Created response ${i + 1} (${responseTemplate.isAnonymous ? 'Anonymous' : user.fullName || user.email})`);
      }

      // Save updated survey statistics
      await survey.save();
    }

    console.log(`\n🎉 Survey response seeding completed successfully!`);
    console.log(`📊 Total responses created: ${seededCount}`);
    
    // Display summary
    const totalResponses = await SurveyResponse.countDocuments();
    const anonymousResponses = await SurveyResponse.countDocuments({ isAnonymous: true });
    const completedResponses = await SurveyResponse.countDocuments({ status: 'completed' });
    
    console.log('\n📈 Response Summary:');
    console.log(`   Total Responses: ${totalResponses}`);
    console.log(`   Anonymous Responses: ${anonymousResponses}`);
    console.log(`   Completed Responses: ${completedResponses}`);
    
    // Display survey statistics
    console.log('\n📊 Survey Statistics:');
    for (const survey of surveys) {
      const responseCount = await SurveyResponse.countDocuments({ surveyId: survey._id });
      console.log(`   ${survey.title}: ${responseCount} responses`);
    }

  } catch (error) {
    console.error('❌ Error seeding survey responses:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedSurveyResponses();
}

module.exports = { seedSurveyResponses, sampleResponses };
