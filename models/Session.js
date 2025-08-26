const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenId: { type: String, required: true, index: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, createdAt: -1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;












