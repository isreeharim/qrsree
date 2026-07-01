const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after a set of express-validator rules and turns the first
 * validation failure into an AppError, so the rest of the app doesn't
 * need to know about express-validator's response shape.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(new AppError(firstError.msg, 400));
  }
  return next();
}

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const createQrRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('destinationUrl')
    .trim()
    .notEmpty()
    .withMessage('Destination URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Destination URL must be a valid URL (include http:// or https://)'),
];

const updateQrRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('destinationUrl')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Destination URL cannot be empty')
    .isURL({ require_protocol: true })
    .withMessage('Destination URL must be a valid URL (include http:// or https://)'),
];

const scanLocationRules = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180'),
];

const registerRules = [
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

module.exports = {
  validate,
  loginRules,
  registerRules,
  createQrRules,
  updateQrRules,
  scanLocationRules,
};
