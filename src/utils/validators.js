const { check, validationResult } = require('express-validator');
const { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = require('./constants');

// Validate user registration
exports.validateRegistration = [
  check('username')
    .isLength({ min: 4 })
    .withMessage('Username must be at least 4 characters'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  check('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Invalid role')
];

// Validate question creation
exports.validateQuestion = [
  check('text')
    .notEmpty()
    .withMessage('Question text is required'),
  check('categoryId')
    .isInt()
    .withMessage('Valid category ID required'),
  check('answers')
    .isArray({ min: 2 })
    .withMessage('At least two answers required'),
  check('answers.*.text')
    .notEmpty()
    .withMessage('Answer text is required'),
  check('answers.*.isCorrect')
    .isBoolean()
    .withMessage('Invalid answer correctness value')
];

// Validate file upload
exports.validateFileUpload = [
  check('file')
    .custom((value, { req }) => {
      if (!req.file) throw new Error('File is required');
      return true;
    }),
  check('file.mimetype')
    .custom((value) => ALLOWED_FILE_TYPES.includes(value))
    .withMessage('Invalid file type'),
  check('file.size')
    .custom((value) => value <= MAX_FILE_SIZE)
    .withMessage('File size exceeds limit')
];