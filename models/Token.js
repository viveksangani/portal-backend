const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  lastUsed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
});

tokenSchema.pre('remove', function(next) {
  console.log('Pre-remove middleware triggered for token:', this._id);
  next();
});

tokenSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Token already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Token', tokenSchema); 