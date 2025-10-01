/**
 * Survey Seeding Script
 * 
 * This script seeds the database with comprehensive survey questionnaires
 * that would be used in an e-commerce/business platform for testing purposes.
 * 
 * Run with: node scripts/seedSurveys.js
 */

const mongoose = require('mongoose');
const connectDB = require('../helper/connectDB');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');

// Sample survey data with realistic questionnaires
const surveyData = [
  {
    title: "Customer Satisfaction Survey",
    description: "Help us understand your experience with our platform and services",
    category: "customer-satisfaction",
    estimatedTime: "3-5 minutes",
    status: "active",
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgress: true,
    showResults: false,
    tags: ["customer", "satisfaction", "feedback"],
    questions: [
      {
        id: 1,
        type: "rating",
        question: "How would you rate your overall satisfaction with our platform?",
        description: "Please rate from 1 (Very Dissatisfied) to 5 (Very Satisfied)",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 1
      },
      {
        id: 2,
        type: "single-choice",
        question: "How did you first hear about us?",
        description: "Select the option that best describes how you discovered our platform",
        required: true,
        options: [
          { value: "search-engine", label: "Search Engine (Google, Bing, etc.)" },
          { value: "social-media", label: "Social Media" },
          { value: "friend-referral", label: "Friend/Family Referral" },
          { value: "advertisement", label: "Advertisement" },
          { value: "other", label: "Other" }
        ],
        order: 2
      },
      {
        id: 3,
        type: "multiple-choice",
        question: "What features do you use most frequently?",
        description: "Select all that apply",
        required: false,
        options: [
          { value: "product-search", label: "Product Search" },
          { value: "order-tracking", label: "Order Tracking" },
          { value: "customer-support", label: "Customer Support" },
          { value: "account-management", label: "Account Management" },
          { value: "mobile-app", label: "Mobile App" }
        ],
        order: 3
      },
      {
        id: 4,
        type: "text",
        question: "What improvements would you like to see on our platform?",
        description: "Please provide specific suggestions for improvement",
        required: false,
        order: 4
      },
      {
        id: 5,
        type: "boolean",
        question: "Would you recommend our platform to others?",
        description: "Would you be likely to refer our platform to friends or colleagues?",
        required: true,
        order: 5
      }
    ]
  },
  {
    title: "Employee Engagement Survey",
    description: "Help us understand your experience as an employee and improve our workplace",
    category: "hr",
    estimatedTime: "5-7 minutes",
    status: "active",
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgress: true,
    showResults: false,
    tags: ["employee", "engagement", "hr"],
    questions: [
      {
        id: 1,
        type: "rating",
        question: "How satisfied are you with your current role?",
        description: "Rate your job satisfaction from 1 (Very Dissatisfied) to 5 (Very Satisfied)",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 1
      },
      {
        id: 2,
        type: "single-choice",
        question: "How would you describe the company culture?",
        description: "Select the option that best describes our workplace culture",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - Collaborative and supportive" },
          { value: "good", label: "Good - Generally positive environment" },
          { value: "average", label: "Average - Room for improvement" },
          { value: "poor", label: "Poor - Needs significant improvement" }
        ],
        order: 2
      },
      {
        id: 3,
        type: "multiple-choice",
        question: "What aspects of your job do you find most rewarding?",
        description: "Select all that apply",
        required: false,
        options: [
          { value: "challenging-work", label: "Challenging and interesting work" },
          { value: "team-collaboration", label: "Working with great colleagues" },
          { value: "career-growth", label: "Opportunities for career growth" },
          { value: "work-life-balance", label: "Good work-life balance" },
          { value: "recognition", label: "Recognition for achievements" },
          { value: "benefits", label: "Benefits and compensation" }
        ],
        order: 3
      },
      {
        id: 4,
        type: "single-choice",
        question: "How often do you receive feedback from your manager?",
        description: "Select the frequency that best matches your experience",
        required: true,
        options: [
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "rarely", label: "Rarely or never" }
        ],
        order: 4
      },
      {
        id: 5,
        type: "text",
        question: "What suggestions do you have for improving our workplace?",
        description: "Please share any ideas for making our workplace better",
        required: false,
        order: 5
      },
      {
        id: 6,
        type: "boolean",
        question: "Do you feel valued as an employee?",
        description: "Do you feel that your contributions are recognized and valued?",
        required: true,
        order: 6
      }
    ]
  },
  {
    title: "Product Feedback Survey",
    description: "Share your experience with our products to help us improve quality and features",
    category: "product-feedback",
    estimatedTime: "4-6 minutes",
    status: "active",
    allowAnonymous: false,
    allowMultipleResponses: true,
    showProgress: true,
    showResults: true,
    tags: ["product", "feedback", "quality"],
    questions: [
      {
        id: 1,
        type: "single-choice",
        question: "Which product category did you purchase?",
        description: "Select the main category of your recent purchase",
        required: true,
        options: [
          { value: "electronics", label: "Electronics" },
          { value: "clothing", label: "Clothing & Accessories" },
          { value: "home-garden", label: "Home & Garden" },
          { value: "health-beauty", label: "Health & Beauty" },
          { value: "sports", label: "Sports & Outdoors" },
          { value: "books", label: "Books & Media" },
          { value: "other", label: "Other" }
        ],
        order: 1
      },
      {
        id: 2,
        type: "rating",
        question: "How would you rate the product quality?",
        description: "Rate the overall quality of the product you received",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 2
      },
      {
        id: 3,
        type: "rating",
        question: "How accurate was the product description?",
        description: "Rate how well the product matched its online description",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 3
      },
      {
        id: 4,
        type: "single-choice",
        question: "How was the packaging?",
        description: "Select the option that best describes the packaging quality",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - Secure and well-presented" },
          { value: "good", label: "Good - Adequate protection" },
          { value: "average", label: "Average - Basic packaging" },
          { value: "poor", label: "Poor - Damaged or inadequate" }
        ],
        order: 4
      },
      {
        id: 5,
        type: "multiple-choice",
        question: "What factors influenced your purchase decision?",
        description: "Select all factors that were important in your decision",
        required: false,
        options: [
          { value: "price", label: "Price" },
          { value: "quality", label: "Product Quality" },
          { value: "brand", label: "Brand Reputation" },
          { value: "reviews", label: "Customer Reviews" },
          { value: "shipping", label: "Shipping Speed" },
          { value: "return-policy", label: "Return Policy" }
        ],
        order: 5
      },
      {
        id: 6,
        type: "text",
        question: "What would you improve about this product?",
        description: "Please share specific suggestions for product improvement",
        required: false,
        order: 6
      }
    ]
  },
  {
    title: "Website Usability Survey",
    description: "Help us improve our website's user experience and navigation",
    category: "usability",
    estimatedTime: "3-4 minutes",
    status: "active",
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgress: true,
    showResults: false,
    tags: ["website", "usability", "ux"],
    questions: [
      {
        id: 1,
        type: "rating",
        question: "How easy is it to navigate our website?",
        description: "Rate the ease of navigation from 1 (Very Difficult) to 5 (Very Easy)",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 1
      },
      {
        id: 2,
        type: "single-choice",
        question: "Which device do you primarily use to access our website?",
        description: "Select your primary device for browsing our site",
        required: true,
        options: [
          { value: "desktop", label: "Desktop Computer" },
          { value: "laptop", label: "Laptop" },
          { value: "tablet", label: "Tablet" },
          { value: "mobile", label: "Mobile Phone" }
        ],
        order: 2
      },
      {
        id: 3,
        type: "multiple-choice",
        question: "What challenges do you face when using our website?",
        description: "Select all issues you have encountered",
        required: false,
        options: [
          { value: "slow-loading", label: "Pages load too slowly" },
          { value: "hard-to-find", label: "Difficult to find products" },
          { value: "checkout-issues", label: "Problems during checkout" },
          { value: "mobile-responsive", label: "Poor mobile experience" },
          { value: "search-function", label: "Search function not working well" },
          { value: "none", label: "No major issues" }
        ],
        order: 3
      },
      {
        id: 4,
        type: "single-choice",
        question: "How often do you visit our website?",
        description: "Select the frequency that best matches your usage",
        required: true,
        options: [
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "rarely", label: "Rarely" },
          { value: "first-time", label: "First time visitor" }
        ],
        order: 4
      },
      {
        id: 5,
        type: "text",
        question: "What features would make our website better?",
        description: "Please suggest specific improvements for our website",
        required: false,
        order: 5
      }
    ]
  },
  {
    title: "Customer Support Experience Survey",
    description: "Share your experience with our customer support team",
    category: "support",
    estimatedTime: "2-3 minutes",
    status: "active",
    allowAnonymous: false,
    allowMultipleResponses: false,
    showProgress: true,
    showResults: false,
    tags: ["support", "customer-service", "experience"],
    questions: [
      {
        id: 1,
        type: "single-choice",
        question: "How did you contact our support team?",
        description: "Select the method you used to reach customer support",
        required: true,
        options: [
          { value: "live-chat", label: "Live Chat" },
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone Call" },
          { value: "ticket", label: "Support Ticket" },
          { value: "social-media", label: "Social Media" }
        ],
        order: 1
      },
      {
        id: 2,
        type: "rating",
        question: "How would you rate the response time?",
        description: "Rate how quickly our support team responded (1 = Very Slow, 5 = Very Fast)",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 2
      },
      {
        id: 3,
        type: "rating",
        question: "How satisfied are you with the solution provided?",
        description: "Rate your satisfaction with the support resolution (1 = Very Dissatisfied, 5 = Very Satisfied)",
        required: true,
        minRating: 1,
        maxRating: 5,
        order: 3
      },
      {
        id: 4,
        type: "single-choice",
        question: "Was your issue resolved?",
        description: "Select the option that best describes the outcome",
        required: true,
        options: [
          { value: "completely", label: "Yes, completely resolved" },
          { value: "partially", label: "Partially resolved" },
          { value: "not-resolved", label: "Not resolved" },
          { value: "escalated", label: "Escalated to another department" }
        ],
        order: 4
      },
      {
        id: 5,
        type: "text",
        question: "Any additional comments about your support experience?",
        description: "Please share any additional feedback about our customer support",
        required: false,
        order: 5
      }
    ]
  },
  {
    title: "Market Research Survey",
    description: "Help us understand market trends and customer preferences",
    category: "market-research",
    estimatedTime: "6-8 minutes",
    status: "active",
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgress: true,
    showResults: false,
    tags: ["market-research", "trends", "preferences"],
    questions: [
      {
        id: 1,
        type: "single-choice",
        question: "What is your age range?",
        description: "Select your age group",
        required: true,
        options: [
          { value: "18-24", label: "18-24 years" },
          { value: "25-34", label: "25-34 years" },
          { value: "35-44", label: "35-44 years" },
          { value: "45-54", label: "45-54 years" },
          { value: "55-64", label: "55-64 years" },
          { value: "65+", label: "65+ years" }
        ],
        order: 1
      },
      {
        id: 2,
        type: "single-choice",
        question: "What is your annual household income?",
        description: "Select your approximate household income range",
        required: true,
        options: [
          { value: "under-25k", label: "Under $25,000" },
          { value: "25k-50k", label: "$25,000 - $50,000" },
          { value: "50k-75k", label: "$50,000 - $75,000" },
          { value: "75k-100k", label: "$75,000 - $100,000" },
          { value: "100k-150k", label: "$100,000 - $150,000" },
          { value: "over-150k", label: "Over $150,000" },
          { value: "prefer-not-to-say", label: "Prefer not to say" }
        ],
        order: 2
      },
      {
        id: 3,
        type: "multiple-choice",
        question: "Which of these products interest you most?",
        description: "Select all products that appeal to you",
        required: false,
        options: [
          { value: "smartphones", label: "Smartphones & Accessories" },
          { value: "laptops", label: "Laptops & Computers" },
          { value: "home-appliances", label: "Home Appliances" },
          { value: "fashion", label: "Fashion & Clothing" },
          { value: "beauty", label: "Beauty & Personal Care" },
          { value: "fitness", label: "Fitness & Sports" },
          { value: "books", label: "Books & Education" },
          { value: "automotive", label: "Automotive Products" }
        ],
        order: 3
      },
      {
        id: 4,
        type: "single-choice",
        question: "How important is sustainability in your purchasing decisions?",
        description: "Rate the importance of eco-friendly and sustainable products",
        required: true,
        options: [
          { value: "very-important", label: "Very Important" },
          { value: "somewhat-important", label: "Somewhat Important" },
          { value: "neutral", label: "Neutral" },
          { value: "not-very-important", label: "Not Very Important" },
          { value: "not-important", label: "Not Important" }
        ],
        order: 4
      },
      {
        id: 5,
        type: "single-choice",
        question: "What influences your online shopping decisions most?",
        description: "Select the most influential factor in your online purchases",
        required: true,
        options: [
          { value: "price", label: "Price" },
          { value: "quality", label: "Product Quality" },
          { value: "reviews", label: "Customer Reviews" },
          { value: "brand", label: "Brand Reputation" },
          { value: "shipping", label: "Free/Quick Shipping" },
          { value: "return-policy", label: "Return Policy" }
        ],
        order: 5
      },
      {
        id: 6,
        type: "text",
        question: "What new product categories would you like to see on our platform?",
        description: "Please suggest new product categories you'd be interested in",
        required: false,
        order: 6
      }
    ]
  }
];

async function seedSurveys() {
  try {
    console.log('🌱 Starting survey seeding process...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get existing organizations and users for seeding
    const Organization = require('../models/organization');
    const User = require('../models/users');
    
    const organizations = await Organization.find({}).limit(3);
    const users = await User.find({}).limit(3);
    
    if (organizations.length === 0) {
      console.log('❌ No organizations found. Please create organizations first.');
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }
    
    console.log(`📊 Found ${organizations.length} organizations and ${users.length} users`);

    // Clear existing surveys (optional - remove if you want to keep existing data)
    const existingSurveys = await Survey.countDocuments();
    if (existingSurveys > 0) {
      console.log(`🗑️ Found ${existingSurveys} existing surveys. Clearing them...`);
      await Survey.deleteMany({});
      console.log('✅ Cleared existing surveys');
    }

    let seededCount = 0;

    // Seed surveys for each organization
    for (const org of organizations) {
      console.log(`\n🏢 Seeding surveys for organization: ${org.name}`);
      
      // Assign different surveys to different organizations
      const surveysForOrg = surveyData.map((surveyTemplate, index) => {
        const user = users[index % users.length]; // Rotate users
        
        return {
          ...surveyTemplate,
          organizationId: org._id,
          createdBy: user._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        };
      });

      // Create surveys
      for (const surveyData of surveysForOrg) {
        const survey = new Survey(surveyData);
        await survey.save();
        seededCount++;
        console.log(`  ✅ Created: ${survey.title}`);
      }
    }

    console.log(`\n🎉 Survey seeding completed successfully!`);
    console.log(`📊 Total surveys created: ${seededCount}`);
    console.log(`🏢 Surveys per organization: ${surveyData.length}`);
    
    // Display summary
    const totalSurveys = await Survey.countDocuments();
    const activeSurveys = await Survey.countDocuments({ status: 'active' });
    const draftSurveys = await Survey.countDocuments({ status: 'draft' });
    
    console.log('\n📈 Survey Summary:');
    console.log(`   Total Surveys: ${totalSurveys}`);
    console.log(`   Active Surveys: ${activeSurveys}`);
    console.log(`   Draft Surveys: ${draftSurveys}`);
    
    // Display categories
    const categories = await Survey.distinct('category');
    console.log(`   Categories: ${categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding surveys:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedSurveys();
}

module.exports = { seedSurveys, surveyData };
