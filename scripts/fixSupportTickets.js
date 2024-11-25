require('dotenv').config();
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');

async function fixTickets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all tickets without ticketId
    const tickets = await SupportTicket.find({ ticketId: null });
    console.log(`Found ${tickets.length} tickets to fix`);

    // Update each ticket
    for (const ticket of tickets) {
      ticket.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await ticket.save();
      console.log(`Fixed ticket: ${ticket._id}`);
    }

    console.log('All tickets fixed');
  } catch (error) {
    console.error('Error fixing tickets:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixTickets(); 