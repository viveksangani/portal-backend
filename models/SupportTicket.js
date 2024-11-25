const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  type: String
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['USER', 'SUPPORT', 'SYSTEM'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [attachmentSchema],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  category: {
    type: String,
    enum: ['TECHNICAL', 'BILLING', 'API_USAGE', 'ACCOUNT', 'OTHER'],
    required: true
  },
  messages: [messageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove all indexes first
supportTicketSchema.pre('save', async function() {
  const Model = mongoose.model('SupportTicket', supportTicketSchema);
  try {
    await Model.collection.dropIndexes();
  } catch (error) {
    console.log('No indexes to drop');
  }
});

// Create a script to fix existing records
const fixExistingRecords = async () => {
  const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
  try {
    const tickets = await SupportTicket.find({ ticketId: null });
    for (const ticket of tickets) {
      ticket.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await ticket.save();
    }
    console.log('Fixed existing records');
  } catch (error) {
    console.error('Error fixing records:', error);
  }
};

// Run the fix script when the model is first loaded
if (mongoose.connection.readyState === 1) {
  fixExistingRecords();
}

module.exports = mongoose.model('SupportTicket', supportTicketSchema); 