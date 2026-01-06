const mongoose = require('mongoose');
const PaymentGatewayKey = require('../models/paymentGatewayKey');
require('dotenv').config();

/**
 * Payment Gateway Keys Seed Data
 *
 * Supported Gateways:
 * - Flutterwave: Primary gateway for card payments (NGN, USD, EUR, GBP)
 * - Paystack: Nigerian payment gateway (NGN)
 * - Squad: Nigerian payment gateway with inline checkout
 * - Crypto: BTCPay Server (to be configured separately)
 */

const paymentGatewayKeys = [
  {
    name: 'Flutterwave',
    description: 'Primary payment gateway for card payments. Supports NGN, USD, EUR, GBP.',
    logoUrl: '/logos/flutterwave.png',
    type: 'flutterwave',
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-0cfc4338858cd764a92d3749fa39fde4-X',
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-c80cd8fb027f63d8315c6a20c3b0ac1e-X',
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || 'FLWSECK_TEST4158836a5221',
    isActive: true
  },
  {
    name: 'Paystack',
    description: 'Nigerian payment gateway. Supports NGN card payments.',
    logoUrl: '/logos/paystack.png',
    type: 'paystack',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_c9ac407057ba9a18d2ef53e8fadd2a7dde05c7ca',
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_4d1cf46dcfe46b96782077441a830d40d1162fbb',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || null,
    isActive: true
  },
  {
    name: 'Squad',
    description: 'Nigerian payment gateway with inline checkout support.',
    logoUrl: '/logos/squad.png',
    type: 'squad',
    publicKey: process.env.SQUAD_PUBLIC_KEY || 'pk_020ab36d76176b263dea8660c4de6ada007dee48',
    secretKey: process.env.SQUAD_SECRET_KEY || 'sk_020ab36d76176b2652828b0da4c374da001de95a',
    webhookSecret: process.env.SQUAD_WEBHOOK_SECRET || null,
    isActive: true
  }
];

async function seedPaymentGateways() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Check existing gateway keys
    const existingKeys = await PaymentGatewayKey.find({});
    console.log(`Found ${existingKeys.length} existing payment gateway keys`);

    // Upsert each gateway key
    for (const gatewayData of paymentGatewayKeys) {
      const existingKey = await PaymentGatewayKey.findOne({ type: gatewayData.type });

      if (existingKey) {
        // Update existing key
        await PaymentGatewayKey.findByIdAndUpdate(existingKey._id, gatewayData, { new: true });
        console.log(`Updated existing gateway: ${gatewayData.name}`);
      } else {
        // Create new key
        const key = new PaymentGatewayKey(gatewayData);
        await key.save();
        console.log(`Created new gateway: ${gatewayData.name}`);
      }
    }

    // Verify all keys were created/updated
    const allKeys = await PaymentGatewayKey.find({});

    console.log('\n=== Payment Gateway Keys Summary ===');
    for (const key of allKeys) {
      console.log(`\n${key.name} (${key.type})`);
      console.log(`   Public Key: ${key.publicKey.substring(0, 20)}...`);
      console.log(`   Secret Key: ${key.secretKey.substring(0, 15)}...`);
      console.log(`   Webhook Secret: ${key.webhookSecret ? key.webhookSecret.substring(0, 15) + '...' : 'Not set'}`);
      console.log(`   Active: ${key.isActive ? 'Yes' : 'No'}`);
    }

    console.log('\n Payment gateway keys seeded successfully!');
    console.log(`Total gateways: ${allKeys.length}`);

  } catch (error) {
    console.error('Error seeding payment gateways:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

/**
 * Delete all gateway keys and recreate them
 * Use this for a clean slate
 */
async function resetPaymentGateways() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Delete all gateway keys
    const deleted = await PaymentGatewayKey.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} existing gateway keys`);

    // Create all keys fresh
    for (const gatewayData of paymentGatewayKeys) {
      const key = new PaymentGatewayKey(gatewayData);
      await key.save();
      console.log(`Created gateway: ${gatewayData.name}`);
    }

    console.log('\n Payment gateway keys reset successfully!');

  } catch (error) {
    console.error('Error resetting payment gateways:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--reset')) {
    console.log('Running in RESET mode - will delete and recreate all gateway keys\n');
    resetPaymentGateways();
  } else {
    console.log('Running in UPSERT mode - will update existing or create new gateway keys\n');
    seedPaymentGateways();
  }
}

module.exports = {
  seedPaymentGateways,
  resetPaymentGateways,
  paymentGatewayKeys
};
