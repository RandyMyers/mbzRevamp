const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PaymentGatewayKey = require('../models/paymentGatewayKey');

async function updateSquadKeys() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    const result = await PaymentGatewayKey.findOneAndUpdate(
      { type: 'squad' },
      {
        $set: {
          publicKey: 'sandbox_pk_dcf04978cd7644bbb7b74e13179e9443a55edd9adf04',
          secretKey: 'sandbox_sk_dcf04978cd7644bbb7b7437471919139b83fd29fdf07',
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    console.log('Squad keys updated successfully:');
    console.log('- Public Key:', result.publicKey.substring(0, 20) + '...');
    console.log('- Secret Key:', result.secretKey.substring(0, 20) + '...');

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateSquadKeys();
