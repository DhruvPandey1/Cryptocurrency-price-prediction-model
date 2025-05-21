const jwt = require('jsonwebtoken');
require('dotenv').config();

// Protect middleware (authentication check)
exports.protect = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Basic authorize middleware (placeholder for future role-based implementation)
exports.authorize = function() {
  return function(req, res, next) {
    // Since you don't have roles yet, this simply checks if the user is authenticated
    // (which is already handled by the protect middleware)
    if (!req.user) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    
    // You could add additional authorization logic here in the future
    // For now, just pass to the next middleware
    next();
  };
};