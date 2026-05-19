const { validationResult } = require('express-validator');

// Processes validation rules results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors occurred on your request.',
      errors: errors.array().map(err => ({
        field: err.path || err.param, // handles older/newer versions of express-validator
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = { validate };
