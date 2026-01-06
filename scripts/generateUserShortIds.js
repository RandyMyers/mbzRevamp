/**
 * Migration Script: Generate short_id for existing users
 *
 * Run with: node scripts/generateUserShortIds.js
 *
 * This script generates unique short_ids for all users who don't have one.
 * Format: C + 9 alphanumeric characters (e.g., C1A2B3C4D5)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');

// Generate a unique short_id
function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'C'; // Start with 'C' for Customer
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateShortIds() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all users without short_id
    const usersWithoutShortId = await User.find({
      $or: [
        { short_id: { $exists: false } },
        { short_id: null },
        { short_id: '' }
      ]
    });

    console.log(`📋 Found ${usersWithoutShortId.length} users without short_id`);

    if (usersWithoutShortId.length === 0) {
      console.log('✅ All users already have short_ids. Nothing to do.');
      await mongoose.disconnect();
      return;
    }

    // Get all existing short_ids to avoid collisions
    const existingShortIds = new Set(
      (await User.find({ short_id: { $exists: true, $ne: null } }, { short_id: 1 }))
        .map(u => u.short_id)
    );

    console.log(`📊 Found ${existingShortIds.size} existing short_ids`);

    let updated = 0;
    let errors = 0;

    for (const user of usersWithoutShortId) {
      try {
        // Generate unique short_id
        let shortId;
        let attempts = 0;
        const maxAttempts = 100;

        do {
          shortId = generateShortId();
          attempts++;
        } while (existingShortIds.has(shortId) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
          // Fallback: use timestamp-based ID
          shortId = 'C' + Date.now().toString(36).toUpperCase().slice(-9);
        }

        // Update user with new short_id
        await User.updateOne(
          { _id: user._id },
          { $set: { short_id: shortId } }
        );

        // Add to set to prevent duplicates in this batch
        existingShortIds.add(shortId);

        updated++;
        console.log(`✅ [${updated}/${usersWithoutShortId.length}] ${user.email} → ${shortId}`);

      } catch (error) {
        errors++;
        console.error(`❌ Error updating user ${user.email}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📋 Total processed: ${usersWithoutShortId.length}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
generateShortIds();
