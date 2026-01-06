const mongoose = require('mongoose');


const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  methodType: {
    type: String,
    enum: ['Bank Transfer', 'Crypto', 'Card'],
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'NGN', 'BTC', 'USDT'], // Define supported currencies
    required: true,
  },
  // Bank accounts
  bankAccountsUSD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountUSD',
  },
  bankAccountsEUR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountEUR',
    
  },
  bankAccountsGBP: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccountGBP',
    
  },
  // Crypto wallets
  cryptoWalletsBTC: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoWalletBTC',
  },
  
  cryptoWalletsUSDT: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CryptoWalletUSDT',
    
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Card payment gateway type (for card payments)
  cardGateway: {
    type: String,
    enum: ['flutterwave', 'paystack', 'squad'],
  },
  // Optionally, reference to a saved card (for future use)
  cardReference: {
    type: String,
  },

  // ========== Card Details for Display ==========
  cardLastFour: {
    type: String,
    maxlength: 4,
  },
  cardBrand: {
    type: String,  // visa, mastercard, verve, etc.
  },
  cardExpMonth: {
    type: String,
  },
  cardExpYear: {
    type: String,
  },
  cardBank: {
    type: String,  // issuing bank name
  },

  // ========== Gateway Tokens for Recurring Charges ==========
  // Paystack
  paystackAuthCode: {
    type: String,  // authorization_code for charging
  },
  paystackCustomerCode: {
    type: String,  // customer_code for identification
  },
  paystackEmail: {
    type: String,  // email used for the authorization
  },

  // Flutterwave
  flutterwaveToken: {
    type: String,  // card token for tokenized charges
  },
  flutterwaveEmail: {
    type: String,
  },

  // Squad
  squadToken: {
    type: String,
  },
  squadCustomerId: {
    type: String,
  },

  // ========== Metadata ==========
  isDefault: {
    type: Boolean,
    default: false,
  },
  nickname: {
    type: String,  // User-friendly name like "My Visa ****4242"
  },
  lastUsedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update timestamps
paymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
