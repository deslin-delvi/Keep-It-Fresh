const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // First check for x-auth-token header (for frontend/chatbot compatibility)
  if (req.header('x-auth-token')) {
    token = req.header('x-auth-token');
  }
  // Then check for Bearer token in Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if no token
  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  // Verify token
  try {
    // Verify token
    const decoded = jwt.verify(token, 'jwtSecret'); // Replace with environment variable later

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    // Check if user exists
    if (!req.user) {
      console.log('Auth failed: User not found');
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth failed: Invalid token', error.message);
    res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };