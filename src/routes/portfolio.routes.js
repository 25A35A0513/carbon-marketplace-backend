const express = require('express');
const router = express.Router();
const { getPortfolio } = require('../controllers/portfolio.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('buyer'), getPortfolio);

module.exports = router;
