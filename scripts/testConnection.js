require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection successful!');
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    console.log('Connected to host:', mongoose.connection.host);
  } catch (error) {
    console.error('MongoDB connection failed!');
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection(); 