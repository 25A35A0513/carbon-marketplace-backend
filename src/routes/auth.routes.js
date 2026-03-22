const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, refresh, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
    body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
  ],
  validate, register
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate, login
);

router.post('/refresh', refresh);
router.get('/me',       protect, getMe);
router.post('/logout',  protect, logout);

module.exports = router;
