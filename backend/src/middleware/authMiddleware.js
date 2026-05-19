const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect route middleware
const protect = async (req, res, next) => {
  let token;

  // 1. Check for Authorization header containing 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: "Bearer <token_string>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB using id from token payload (exclude password)
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found.'
        });
      }

      // Attach user object to the request
      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware]: Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed.'
      });
    }
  }

  // 2. If no token was found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.'
    });
  }
};

module.exports = { protect };
