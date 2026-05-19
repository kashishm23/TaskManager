// Middleware to restrict access to specific roles (e.g., Admin)
const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Check if user object is attached to the request (set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in first.'
      });
    }

    // 2. Check if the user's role matches any of the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role (${req.user.role}) is not authorized to perform this action.`
      });
    }

    // 3. User is authorized, proceed to the next handler
    next();
  };
};

module.exports = { authorize };
