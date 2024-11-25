// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');
const { updateTokenUsage } = require('../controllers/authController');

const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // First try to verify as JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    } catch (jwtError) {
      // If JWT verification fails, check if it's an API token
      const apiToken = await Token.findOne({ token, isActive: true });
      if (!apiToken) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await User.findById(apiToken.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Update token usage without invalidating
      await updateTokenUsage(token);

      req.user = user;
      req.tokenId = apiToken._id;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = verifyToken;
