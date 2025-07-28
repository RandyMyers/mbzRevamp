/**
 * Exchange Rate Migration Script
 * 
 * This script migrates existing exchange rate records and creates global rate records
 * for common currencies to support the new API integration.
 */

const mongoose = require('mongoose');
const ExchangeRate = require('../models/exchangeRate');
require('dotenv').config();

// Common currency pairs for global rates
const COMMON_CURRENCY_PAIRS = [
  { base: 'USD', target: 'EUR', rate: 0.85 },
  { base: 'USD', target: 'GBP', rate: 0.73 },
  { base: 'USD', target: 'JPY', rate: 110.0 },
  { base: 'USD', target: 'CAD', rate: 1.25 },
  { base: 'USD', target: 'AUD', rate: 1.35 },
  { base: 'USD', target: 'CHF', rate: 0.92 },
  { base: 'USD', target: 'CNY', rate: 6.45 },
  { base: 'USD', target: 'NGN', rate: 410.0 },
  { base: 'EUR', target: 'USD', rate: 1.18 },
  { base: 'EUR', target: 'GBP', rate: 0.86 },
  { base: 'EUR', target: 'JPY', rate: 129.5 },
  { base: 'GBP', target: 'USD', rate: 1.37 },
  { base: 'GBP', target: 'EUR', rate: 1.16 },
  { base: 'GBP', target: 'JPY', rate: 150.7 },
  { base: 'JPY', target: 'USD', rate: 0.0091 },
  { base: 'JPY', target: 'EUR', rate: 0.0077 },
  { base: 'JPY', target: 'GBP', rate: 0.0066 },
  { base: 'CAD', target: 'USD', rate: 0.80 },
  { base: 'AUD', target: 'USD', rate: 0.74 },
  { base: 'CHF', target: 'USD', rate: 1.09 },
  { base: 'CNY', target: 'USD', rate: 0.155 },
  { base: 'NGN', target: 'USD', rate: 0.0024 }
];

async function migrateExchangeRates() {
  try {
    console.log('🔄 Starting Exchange Rate Migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Update existing records
    console.log('📝 Updating existing exchange rate records...');
    const updateResult = await ExchangeRate.updateMany(
      { isGlobal: { $exists: false } },
      { 
        $set: { 
          isGlobal: false,
          isExpired: false,
          source: 'system'
        }
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} existing records`);

    // Step 2: Create global rate records
    console.log('🌍 Creating global rate records...');
    let createdCount = 0;
    
    for (const pair of COMMON_CURRENCY_PAIRS) {
      try {
        // Check if global rate already exists
        const existingRate = await ExchangeRate.findOne({
          isGlobal: true,
          baseCurrency: pair.base,
          targetCurrency: pair.target
        });

        if (!existingRate) {
          const globalRate = new ExchangeRate({
            isGlobal: true,
            baseCurrency: pair.base,
            targetCurrency: pair.target,
            rate: pair.rate,
            isCustom: false,
            source: 'system',
            isActive: true,
            lastApiUpdate: new Date(),
            cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isExpired: false,
            apiVersion: 'v6'
          });

          await globalRate.save();
          createdCount++;
          console.log(`✅ Created global rate: ${pair.base} → ${pair.target} = ${pair.rate}`);
        } else {
          console.log(`⏭️  Global rate already exists: ${pair.base} → ${pair.target}`);
        }
      } catch (error) {
        console.error(`❌ Error creating global rate ${pair.base} → ${pair.target}:`, error.message);
      }
    }

    console.log(`✅ Created ${createdCount} new global rate records`);

    // Step 3: Create indexes
    console.log('📊 Creating database indexes...');
    await ExchangeRate.collection.createIndex({ isGlobal: 1, baseCurrency: 1, targetCurrency: 1 });
    await ExchangeRate.collection.createIndex({ cacheExpiry: 1, isExpired: 1 });
    await ExchangeRate.collection.createIndex({ source: 1, lastApiUpdate: 1 });
    await ExchangeRate.collection.createIndex({ isActive: 1, source: 1 });
    console.log('✅ Database indexes created');

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    const totalRates = await ExchangeRate.countDocuments();
    const globalRates = await ExchangeRate.countDocuments({ isGlobal: true });
    const orgRates = await ExchangeRate.countDocuments({ isGlobal: false });
    
    console.log(`📊 Migration Summary:`);
    console.log(`   Total rates: ${totalRates}`);
    console.log(`   Global rates: ${globalRates}`);
    console.log(`   Organization rates: ${orgRates}`);

    console.log('✅ Exchange Rate Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExchangeRates()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateExchangeRates; 
 * Exchange Rate Migration Script
 * 
 * This script migrates existing exchange rate records and creates global rate records
 * for common currencies to support the new API integration.
 */

const mongoose = require('mongoose');
const ExchangeRate = require('../models/exchangeRate');
require('dotenv').config();

// Common currency pairs for global rates
const COMMON_CURRENCY_PAIRS = [
  { base: 'USD', target: 'EUR', rate: 0.85 },
  { base: 'USD', target: 'GBP', rate: 0.73 },
  { base: 'USD', target: 'JPY', rate: 110.0 },
  { base: 'USD', target: 'CAD', rate: 1.25 },
  { base: 'USD', target: 'AUD', rate: 1.35 },
  { base: 'USD', target: 'CHF', rate: 0.92 },
  { base: 'USD', target: 'CNY', rate: 6.45 },
  { base: 'USD', target: 'NGN', rate: 410.0 },
  { base: 'EUR', target: 'USD', rate: 1.18 },
  { base: 'EUR', target: 'GBP', rate: 0.86 },
  { base: 'EUR', target: 'JPY', rate: 129.5 },
  { base: 'GBP', target: 'USD', rate: 1.37 },
  { base: 'GBP', target: 'EUR', rate: 1.16 },
  { base: 'GBP', target: 'JPY', rate: 150.7 },
  { base: 'JPY', target: 'USD', rate: 0.0091 },
  { base: 'JPY', target: 'EUR', rate: 0.0077 },
  { base: 'JPY', target: 'GBP', rate: 0.0066 },
  { base: 'CAD', target: 'USD', rate: 0.80 },
  { base: 'AUD', target: 'USD', rate: 0.74 },
  { base: 'CHF', target: 'USD', rate: 1.09 },
  { base: 'CNY', target: 'USD', rate: 0.155 },
  { base: 'NGN', target: 'USD', rate: 0.0024 }
];

async function migrateExchangeRates() {
  try {
    console.log('🔄 Starting Exchange Rate Migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Update existing records
    console.log('📝 Updating existing exchange rate records...');
    const updateResult = await ExchangeRate.updateMany(
      { isGlobal: { $exists: false } },
      { 
        $set: { 
          isGlobal: false,
          isExpired: false,
          source: 'system'
        }
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} existing records`);

    // Step 2: Create global rate records
    console.log('🌍 Creating global rate records...');
    let createdCount = 0;
    
    for (const pair of COMMON_CURRENCY_PAIRS) {
      try {
        // Check if global rate already exists
        const existingRate = await ExchangeRate.findOne({
          isGlobal: true,
          baseCurrency: pair.base,
          targetCurrency: pair.target
        });

        if (!existingRate) {
          const globalRate = new ExchangeRate({
            isGlobal: true,
            baseCurrency: pair.base,
            targetCurrency: pair.target,
            rate: pair.rate,
            isCustom: false,
            source: 'system',
            isActive: true,
            lastApiUpdate: new Date(),
            cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isExpired: false,
            apiVersion: 'v6'
          });

          await globalRate.save();
          createdCount++;
          console.log(`✅ Created global rate: ${pair.base} → ${pair.target} = ${pair.rate}`);
        } else {
          console.log(`⏭️  Global rate already exists: ${pair.base} → ${pair.target}`);
        }
      } catch (error) {
        console.error(`❌ Error creating global rate ${pair.base} → ${pair.target}:`, error.message);
      }
    }

    console.log(`✅ Created ${createdCount} new global rate records`);

    // Step 3: Create indexes
    console.log('📊 Creating database indexes...');
    await ExchangeRate.collection.createIndex({ isGlobal: 1, baseCurrency: 1, targetCurrency: 1 });
    await ExchangeRate.collection.createIndex({ cacheExpiry: 1, isExpired: 1 });
    await ExchangeRate.collection.createIndex({ source: 1, lastApiUpdate: 1 });
    await ExchangeRate.collection.createIndex({ isActive: 1, source: 1 });
    console.log('✅ Database indexes created');

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    const totalRates = await ExchangeRate.countDocuments();
    const globalRates = await ExchangeRate.countDocuments({ isGlobal: true });
    const orgRates = await ExchangeRate.countDocuments({ isGlobal: false });
    
    console.log(`📊 Migration Summary:`);
    console.log(`   Total rates: ${totalRates}`);
    console.log(`   Global rates: ${globalRates}`);
    console.log(`   Organization rates: ${orgRates}`);

    console.log('✅ Exchange Rate Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExchangeRates()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateExchangeRates; 
 