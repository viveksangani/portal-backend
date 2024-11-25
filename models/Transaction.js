const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['PURCHASE', 'API_USAGE', 'BONUS', 'REFUND'],
    required: true,
    index: true
  },
  metadata: {
    apiName: String,
    packageName: String,
    orderId: String,
    paymentId: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 