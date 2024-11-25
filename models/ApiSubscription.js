const mongoose = require('mongoose');

const apiSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add index for faster queries
apiSubscriptionSchema.index({ userId: 1, apiName: 1 });

module.exports = mongoose.model('ApiSubscription', apiSubscriptionSchema); 