require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: 'vivektech245@gmail.com' },
      { 
        $set: { 
          isAdmin: true,
          isSuperAdmin: true 
        } 
      },
      { new: true }
    );

    if (user) {
      console.log('Successfully updated user to super admin:', user.email);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

makeSuperAdmin(); 