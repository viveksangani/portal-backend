const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  requestBody: Object,
  responseBody: Object,
  statusCode: Number,
  ipAddress: String,
  userAgent: String,
  executionTime: Number, // in milliseconds
  creditsUsed: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('ApiLog', apiLogSchema); 