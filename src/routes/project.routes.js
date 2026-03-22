const express = require('express');
const router = express.Router();
const { getProjects, getProject } = require('../controllers/project.controller');

router.get('/',    getProjects);
router.get('/:id', getProject);

module.exports = router;
