/**
 * Complete Survey Seeding Script
 * 
 * This script runs both survey and survey response seeding
 * to populate the database with comprehensive test data.
 * 
 * Run with: node scripts/seedAllSurveys.js
 */

const { seedSurveys } = require('./seedSurveys');
const { seedSurveyResponses } = require('./seedSurveyResponses');

async function seedAllSurveys() {
  console.log('🚀 Starting complete survey seeding process...\n');
  
  try {
    // Step 1: Seed surveys
    console.log('='.repeat(50));
    console.log('STEP 1: Seeding Survey Templates');
    console.log('='.repeat(50));
    await seedSurveys();
    
    // Wait a moment between operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Seed survey responses
    console.log('\n' + '='.repeat(50));
    console.log('STEP 2: Seeding Survey Responses');
    console.log('='.repeat(50));
    await seedSurveyResponses();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 COMPLETE SURVEY SEEDING FINISHED!');
    console.log('='.repeat(50));
    console.log('✅ All surveys and responses have been seeded successfully');
    console.log('📊 Your database now contains comprehensive survey test data');
    console.log('🧪 Ready for testing survey functionality');
    
  } catch (error) {
    console.error('❌ Error in complete survey seeding:', error);
  }
}

// Run the complete seeding function
if (require.main === module) {
  seedAllSurveys();
}

module.exports = { seedAllSurveys };
