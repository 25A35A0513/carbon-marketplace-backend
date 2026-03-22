const express = require('express');
const router  = express.Router();

const {
  submitContact,
  getAllContacts,
  getContactStats,
  updateContactStatus,
  deleteContact,
} = require('../controllers/contactController');          // ✅ fixed casing

const { protect, authorize } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 'Validation failed', 422, errors.array());
  next();
};

const submitRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Message must be 10–3000 characters'),
  body('subject').optional().trim().isLength({ max: 200 }),
  body('inquiryType').optional().isIn(['buyer','seller','platform','partner','press','other']),
  body('source').optional().isIn(['landing','contact_page']),
];

const updateRules = [
  param('id').isMongoId().withMessage('Invalid ID'),
  body('status').optional().isIn(['new','read','replied','archived']),
  body('adminNotes').optional().isString().isLength({ max: 1000 }),
];

// Public — no auth required
router.post('/', submitRules, validate, submitContact);

// Admin only
router.get('/stats',  protect, authorize('admin'), getContactStats);
router.get('/',       protect, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
], validate, getAllContacts);
router.patch('/:id',  protect, authorize('admin'), updateRules,  validate, updateContactStatus);
router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteContact);

module.exports = router;