const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test the overview endpoint to verify product categories data
async function testProductCategories() {
  try {
    console.log('🧪 Testing Product Categories Data...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Find a real user
    const User = require('./models/users');
    const user = await User.findOne().lean();
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`👤 Found user: ${user.email} (ID: ${user._id})`);
    
    // Test the overview endpoint with real user ID
    const response = await axios.get(`http://localhost:8800/api/overview/stats/${user._id}`);
    
    console.log('📊 Overview Stats Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const { productCategoriesDistribution } = response.data.data;
      
      console.log('\n📈 Product Categories Distribution:');
      console.log('Total categories:', productCategoriesDistribution?.length || 0);
      
      if (productCategoriesDistribution && productCategoriesDistribution.length > 0) {
        console.log('\nTop 5 Categories by Sales:');
        productCategoriesDistribution
          .sort((a, b) => (b.sales || 0) - (a.sales || 0))
          .slice(0, 5)
          .forEach((category, index) => {
            console.log(`${index + 1}. ${category.name}: $${category.sales?.toLocaleString() || 0} (${category.percentage?.toFixed(1) || 0}%)`);
          });
      } else {
        console.log('❌ No product categories data found');
      }
      
      // Test the data structure
      if (productCategoriesDistribution && productCategoriesDistribution.length > 0) {
        const sampleCategory = productCategoriesDistribution[0];
        console.log('\n🔍 Sample Category Data Structure:');
        console.log('Name:', sampleCategory.name);
        console.log('Sales:', sampleCategory.sales);
        console.log('Percentage:', sampleCategory.percentage);
        console.log('Color:', sampleCategory.color);
        console.log('Value:', sampleCategory.value);
      }
    } else {
      console.log('❌ Failed to get overview data');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the test
testProductCategories(); 
const mongoose = require('mongoose');
require('dotenv').config();

// Test the overview endpoint to verify product categories data
async function testProductCategories() {
  try {
    console.log('🧪 Testing Product Categories Data...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Find a real user
    const User = require('./models/users');
    const user = await User.findOne().lean();
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`👤 Found user: ${user.email} (ID: ${user._id})`);
    
    // Test the overview endpoint with real user ID
    const response = await axios.get(`http://localhost:8800/api/overview/stats/${user._id}`);
    
    console.log('📊 Overview Stats Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const { productCategoriesDistribution } = response.data.data;
      
      console.log('\n📈 Product Categories Distribution:');
      console.log('Total categories:', productCategoriesDistribution?.length || 0);
      
      if (productCategoriesDistribution && productCategoriesDistribution.length > 0) {
        console.log('\nTop 5 Categories by Sales:');
        productCategoriesDistribution
          .sort((a, b) => (b.sales || 0) - (a.sales || 0))
          .slice(0, 5)
          .forEach((category, index) => {
            console.log(`${index + 1}. ${category.name}: $${category.sales?.toLocaleString() || 0} (${category.percentage?.toFixed(1) || 0}%)`);
          });
      } else {
        console.log('❌ No product categories data found');
      }
      
      // Test the data structure
      if (productCategoriesDistribution && productCategoriesDistribution.length > 0) {
        const sampleCategory = productCategoriesDistribution[0];
        console.log('\n🔍 Sample Category Data Structure:');
        console.log('Name:', sampleCategory.name);
        console.log('Sales:', sampleCategory.sales);
        console.log('Percentage:', sampleCategory.percentage);
        console.log('Color:', sampleCategory.color);
        console.log('Value:', sampleCategory.value);
      }
    } else {
      console.log('❌ Failed to get overview data');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the test
testProductCategories(); 
 