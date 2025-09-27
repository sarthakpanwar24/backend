import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    // Log detailed validation errors for debugging
    console.log('Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      validationErrors: details
    });
    
    throw new ValidationError('Validation failed', details);
  }
  next();
};

/**
 * Voucher validation rules
 */
export const validateVoucher = [
  body('association')
    .trim()
    .notEmpty()
    .withMessage('Association is required')
    .isLength({ max: 100 })
    .withMessage('Association name cannot exceed 100 characters'),
  
  body('financialYear')
    .trim()
    .notEmpty()
    .withMessage('Financial year is required')
    .matches(/^\d{4}-\d{2,4}$/)
    .withMessage('Financial year must be in format YYYY-YY or YYYY-YYYY'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .custom((value) => {
      // Accept various date formats: YYYY-MM-DD, ISO string, etc.
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Date must be a valid date');
      }
      if (date > new Date()) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
  
  body('payee')
    .trim()
    .notEmpty()
    .withMessage('Payee is required')
    .isLength({ max: 200 })
    .withMessage('Payee name cannot exceed 200 characters'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      const num = Number(value);
      if (num <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (!Number.isFinite(num)) {
        throw new Error('Amount must be a valid number');
      }
      return true;
    }),
  
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),
  
  body('approvedBy')
    .trim()
    .notEmpty()
    .withMessage('Approved by is required')
    .isLength({ max: 100 })
    .withMessage('Approved by name cannot exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: draft, pending, approved, rejected'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Voucher update validation rules
 */
export const validateVoucherUpdate = [
  body('association')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Association name cannot exceed 100 characters'),
  
  body('financialYear')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2,4}$/)
    .withMessage('Financial year must be in format YYYY-YY or YYYY-YYYY'),
  
  body('date')
    .optional()
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Date must be a valid date');
        }
        if (date > new Date()) {
          throw new Error('Date cannot be in the future');
        }
      }
      return true;
    }),
  
  body('payee')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Payee name cannot exceed 200 characters'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (value !== undefined) {
        const num = Number(value);
        if (num <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        if (!Number.isFinite(num)) {
          throw new Error('Amount must be a valid number');
        }
      }
      return true;
    }),
  
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),
  
  body('approvedBy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Approved by name cannot exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: draft, pending, approved, rejected'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * ID parameter validation
 */
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

/**
 * Query parameters validation
 */
export const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'date', 'amount', 'payee', 'association'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected'])
    .withMessage('Invalid status filter'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('minAmount')
    .optional()
    .isNumeric()
    .withMessage('Min amount must be a number'),
  
  query('maxAmount')
    .optional()
    .isNumeric()
    .withMessage('Max amount must be a number'),
  
  handleValidationErrors
];
