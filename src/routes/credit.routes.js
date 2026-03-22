const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { buyCredits } = require('../controllers/credit.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/buy',
  protect, authorize('buyer'),
  [
    body('project_id').notEmpty().withMessage('project_id is required'),
    body('credits_amount').isInt({ min: 1 }).withMessage('credits_amount must be a positive integer'),
  ],
  validate, buyCredits
);

module.exports = router;
