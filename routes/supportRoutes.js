const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all tickets for a user
router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ lastUpdated: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching support tickets' });
  }
});

// Create new support ticket
router.post('/tickets', verifyToken, upload.array('attachments', 5), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    const { subject, category, priority, message } = req.body;

    // Validate required fields
    if (!subject || !category || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['subject', 'category', 'message']
      });
    }

    // Process attachments if any
    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      url: file.buffer.toString('base64'),
      type: file.mimetype
    })) || [];

    const ticket = new SupportTicket({
      userId: req.user.id,
      subject,
      category,
      priority: priority || 'MEDIUM',
      messages: [{
        sender: 'USER',
        content: message,
        attachments
      }]
    });

    console.log('Creating ticket:', ticket);
    await ticket.save();
    console.log('Ticket created successfully');

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ 
      message: 'Error creating support ticket',
      error: error.message,
      details: error.stack
    });
  }
});

// Add message to ticket
router.post('/tickets/:ticketId/messages', verifyToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({
      ticketId: req.params.ticketId,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      type: file.mimetype
    })) || [];

    ticket.messages.push({
      sender: 'USER',
      content: message,
      attachments
    });

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ 
      message: 'Error adding message to ticket',
      error: error.message 
    });
  }
});

// Update ticket status
router.patch('/tickets/:ticketId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId: req.params.ticketId, userId: req.user.id },
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Error updating ticket status' });
  }
});

// Get all tickets (admin only)
router.get('/admin/tickets', verifyToken, isAdmin, async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('userId', 'email firstName lastName')
      .sort({ lastUpdated: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

// Admin response to ticket
router.post('/admin/tickets/:ticketId/messages', verifyToken, isAdmin, upload.array('attachments', 5), async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      type: file.mimetype
    })) || [];

    ticket.messages.push({
      sender: 'SUPPORT',
      content: message,
      attachments
    });

    ticket.lastUpdated = new Date();
    await ticket.save();

    // Send email notification to user
    const user = await User.findById(ticket.userId);
    // TODO: Implement email notification

    res.json(ticket);
  } catch (error) {
    console.error('Error adding admin message:', error);
    res.status(500).json({ message: 'Error adding message to ticket' });
  }
});

// Update ticket priority (admin only)
router.patch('/admin/tickets/:ticketId/priority', verifyToken, isAdmin, async (req, res) => {
  try {
    const { priority } = req.body;
    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { priority },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket priority:', error);
    res.status(500).json({ message: 'Error updating ticket priority' });
  }
});

// Add this route to check admin status
router.get('/check-admin', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ isAdmin: user?.isAdmin || false });
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
});

// Update ticket status route
router.patch('/admin/tickets/:ticketId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { ticketId } = req.params;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await SupportTicket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    ticket.lastUpdated = new Date();

    // Add system message when ticket is closed
    if (status === 'CLOSED' || status === 'RESOLVED') {
      ticket.messages.push({
        sender: 'SYSTEM',
        content: `Ticket ${status.toLowerCase()} by support team`,
        timestamp: new Date(),
        attachments: []
      });
    }

    await ticket.save();

    // Send email notification to user
    const user = await User.findById(ticket.userId);
    // TODO: Implement email notification

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ 
      message: 'Error updating ticket status',
      error: error.message 
    });
  }
});

module.exports = router; 