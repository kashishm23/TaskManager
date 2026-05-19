const { body } = require('express-validator');
const { validate } = require('./validationMiddleware');

// User Registration input validators
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('role')
    .optional()
    .isIn(['Admin', 'Member']).withMessage('Role must be either Admin or Member.'),
  validate
];

// User Login input validators
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  validate
];

// Project creation/modification validators
const projectValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required.')
    .isLength({ min: 3 }).withMessage('Project name must be at least 3 characters long.'),
  body('description')
    .optional()
    .trim(),
  validate
];

// Task creation validators
const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required.')
    .isLength({ min: 3 }).withMessage('Task title must be at least 3 characters long.'),
  body('description')
    .optional()
    .trim(),
  body('assignedTo')
    .optional({ nullable: true })
    .isInt().withMessage('Assigned User ID must be a valid integer ID.'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO 8601 format date (e.g. YYYY-MM-DD).'),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed']).withMessage('Status must be either Pending, In Progress, or Completed.'),
  validate
];

// Task updates validator (all fields are optional, but validated if present)
const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Task title must be at least 3 characters long if provided.'),
  body('description')
    .optional()
    .trim(),
  body('assignedTo')
    .optional({ nullable: true })
    .isInt().withMessage('Assigned User ID must be a valid integer ID.'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO 8601 format date (e.g. YYYY-MM-DD).'),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed']).withMessage('Status must be either Pending, In Progress, or Completed.'),
  validate
];

// Add Member to Project validators
const addMemberValidator = [
  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .isInt().withMessage('User ID must be an integer.'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  projectValidator,
  createTaskValidator,
  updateTaskValidator,
  addMemberValidator
};
