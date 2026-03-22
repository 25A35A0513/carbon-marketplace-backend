const express = require('express');
const router  = express.Router();

const { buyCredits, getPortfolio, getMyTransactions } = require('../controllers/creditController');
const { protect, authorize }    = require('../middleware/auth');
const { buyCreditsRules, paginationRules, validate } = require('../middleware/validators');

// All buyer-only
router.use(protect, authorize('buyer'));

router.post('/buy/:projectId', buyCreditsRules, validate, buyCredits);
router.get('/portfolio',       getPortfolio);
router.get('/transactions',    paginationRules, validate, getMyTransactions);

module.exports = router;
