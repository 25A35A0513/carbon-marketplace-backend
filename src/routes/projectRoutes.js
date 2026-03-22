const express = require('express');
const router  = express.Router();

const { getProjects, getProjectById } = require('../controllers/projectController');
const { paginationRules, validate }   = require('../middleware/validators');

// All public
router.get('/',    paginationRules, validate, getProjects);
router.get('/:id', getProjectById);

module.exports = router;
