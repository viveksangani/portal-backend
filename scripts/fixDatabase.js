require('dotenv').config();
const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the problematic index
    await mongoose.connection.db.collection('supporttickets').dropIndex('ticketNumber_1');
    console.log('Dropped ticketNumber index');

    // Drop the problematic index if it exists
    try {
      await mongoose.connection.db.collection('supporttickets').dropIndex('ticketId_1');
      console.log('Dropped ticketId index');
    } catch (error) {
      console.log('No ticketId index to drop');
    }

    // Update all documents that have null ticketId
    const result = await mongoose.connection.db.collection('supporttickets').updateMany(
      { ticketId: null },
      { 
        $set: { 
          ticketId: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} documents`);
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixDatabase(); 