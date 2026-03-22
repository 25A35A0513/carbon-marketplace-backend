const express = require('express');
const router = express.Router();
const { getTransactions } = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransactions);

module.exports = router;
