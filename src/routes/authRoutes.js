const express = require('express');
const router  = express.Router();

const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerRules, loginRules, validate,
} = require('../middleware/validators');

// Public
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.post('/refresh',  refresh);

// Protected
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);

module.exports = router;
