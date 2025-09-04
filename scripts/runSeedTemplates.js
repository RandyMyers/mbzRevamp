const mongoose = require('mongoose');
const { seedNotificationTemplates } = require('./seedNotificationTemplates');

// MongoDB connection string
const MONGO_URL = 'mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority';

const runSeeding = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB successfully!');

    console.log('🌱 Starting notification template seeding...');
    const result = await seedNotificationTemplates();
    
    if (result.success) {
      console.log('🎉 Seeding completed successfully!');
      console.log(`📊 Results: ${result.created} created, ${result.skipped} skipped, ${result.total} total`);
    } else {
      console.error('❌ Seeding failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    console.log('🔌 Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ Connection closed.');
    process.exit(0);
  }
};

// Run the seeding
runSeeding();
