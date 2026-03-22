const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/** Run validators and return 422 if any fail. */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 422, errors.array());
  }
  next();
};

// ── Auth ──────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Project ───────────────────────────────────────────────
const IMPACT_TYPES = [
  'Forest Conservation', 'Renewable Energy', 'Blue Carbon',
  'Clean Cooking', 'Peatland Conservation', 'Biodiversity Conservation',
  'Soil Carbon', 'Methane Capture', 'Other',
];

const projectRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be 20–2000 characters'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('impactType').isIn(IMPACT_TYPES).withMessage('Invalid impact type'),
  body('totalCredits').isInt({ min: 1 }).withMessage('Total credits must be a positive integer'),
  body('pricePerCredit').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('emoji').optional().isString(),
];

// ── Credit purchase ───────────────────────────────────────
const buyCreditsRules = [
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  body('credits').isInt({ min: 1 }).withMessage('Credits must be a positive integer'),
];

// ── Admin ─────────────────────────────────────────────────
const verifyProjectRules = [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('status').isIn(['verified', 'rejected']).withMessage('Status must be verified or rejected'),
  body('rejectionReason').if(body('status').equals('rejected'))
    .notEmpty().withMessage('Rejection reason required when rejecting'),
];

const updateUserStatusRules = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended'),
];

// ── Pagination ────────────────────────────────────────────
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  projectRules,
  buyCreditsRules,
  verifyProjectRules,
  updateUserStatusRules,
  paginationRules,
};
