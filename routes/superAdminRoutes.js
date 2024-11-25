const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// Middleware to check if user is super admin
const isSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Super Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking super admin status' });
  }
};

// Get all users
router.get('/users', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user admin status
router.patch('/users/:userId', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot modify super admin status' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

module.exports = router; 