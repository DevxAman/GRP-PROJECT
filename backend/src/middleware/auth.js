const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies the JWT token, finds the user, and attaches it to the request object
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token provided, set isAuthenticated to false and continue
    if (!token) {
      console.log('No token provided');
      req.isAuthenticated = false;
      return next();
    }

    try {
      // Verify the token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
      );
      
      // Find the user by ID
      const user = await User.findById(decoded.userId);
      
      // If user not found, set isAuthenticated to false
      if (!user) {
        console.log('User not found');
        req.isAuthenticated = false;
        return next();
      }

      // Attach user to request
      req.user = user;
      req.isAuthenticated = true;
      next();
    } catch (jwtError) {
      // Token is invalid or expired
      console.log('Invalid token:', jwtError.message);
      req.isAuthenticated = false;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Requires authentication 
 * To be used after the auth middleware
 * Returns 401 if the user is not authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

module.exports = { auth, requireAuth }; 