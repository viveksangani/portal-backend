const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Database URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.db.databaseName}`);
    
    // Verify we're connected to the test database
    if (conn.connection.db.databaseName !== 'test') {
      console.warn('Warning: Not connected to test database!');
      console.warn('Current database:', conn.connection.db.databaseName);
      console.warn('Please check MONGODB_URI environment variable');
    } else {
      console.log('Successfully connected to test database');
    }
    
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
