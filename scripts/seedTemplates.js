// Seed script for templates
const mongoose = require('mongoose');
const Template = require('../models/template');
const User = require('../models/users');
const templateSeedData = require('./templateSeedData');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed templates
const seedTemplates = async () => {
  try {
    console.log('🌱 Starting template seeding process...\n');

    // Check if we need to find or create a system user
    let systemUser = await User.findOne({ email: 'system@mbztech.com' });
    
    if (!systemUser) {
      console.log('📝 System user not found. Looking for any super-admin user...');
      systemUser = await User.findOne({ role: 'super-admin' });
      
      if (!systemUser) {
        console.log('📝 No super-admin found. Looking for any admin user...');
        systemUser = await User.findOne({ role: 'admin' });
      }
      
      if (!systemUser) {
        console.log('⚠️  No admin or super-admin user found. Please provide a userId manually or create an admin user first.');
        console.log('⚠️  Proceeding with template creation but you may need to update userId later.');
        // Create a temporary system user ID (you'll need to update this)
        console.log('\n❌ ERROR: Cannot proceed without a valid user. Please create an admin user first.\n');
        process.exit(1);
      }
    }

    console.log(`✅ Using user: ${systemUser.name || systemUser.email} (ID: ${systemUser._id})\n`);

    // Check if templates already exist
    const existingTemplates = await Template.countDocuments();
    if (existingTemplates > 0) {
      console.log(`⚠️  Warning: ${existingTemplates} template(s) already exist in the database.`);
      console.log('   This script will add new templates. To start fresh, delete existing templates first.\n');
    }

    // Prepare template data with userId
    const templatesWithUser = templateSeedData.map(template => ({
      ...template,
      userId: systemUser._id
    }));

    // Insert templates
    console.log(`📦 Inserting ${templatesWithUser.length} templates...\n`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const templateData of templatesWithUser) {
      try {
        const template = new Template(templateData);
        await template.save();
        console.log(`✅ ${successCount + 1}. Created: ${templateData.name} (${templateData.category}) - $${templateData.price}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating ${templateData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} templates`);
    console.log(`❌ Failed: ${errorCount} templates`);
    console.log(`💰 Free templates: ${templatesWithUser.filter(t => t.price === 0).length}`);
    console.log(`💎 Premium templates: ${templatesWithUser.filter(t => t.price > 0).length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('🎉 Template seeding completed successfully!');
      console.log('📝 Note: Template images are not included. Add them via the update API endpoint.\n');
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run the seed script
const run = async () => {
  await connectDB();
  await seedTemplates();
  
  // Close connection
  await mongoose.connection.close();
  console.log('👋 Database connection closed.');
  process.exit(0);
};

run();

