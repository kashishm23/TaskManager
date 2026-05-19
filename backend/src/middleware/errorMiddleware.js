// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('[Error Handler]:', err.stack || err.message || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Sequelize Unique Constraint Violation (e.g., trying to register an email already registered)
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  // Handle Sequelize Model Validation Violations
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { errorHandler };
