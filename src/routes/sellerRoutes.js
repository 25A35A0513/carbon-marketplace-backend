const express = require('express');
const router  = express.Router();

const {
  getMyProjects, createProject, updateProject, deleteProject, getSales,
} = require('../controllers/sellerController');
const { protect, authorize }  = require('../middleware/auth');
const { projectRules, paginationRules, validate } = require('../middleware/validators');

// All seller-only
router.use(protect, authorize('seller'));

// ── Sales (must be before /:id to avoid route conflict) ──
router.get('/sales',            paginationRules, validate, getSales);

// ── Projects (support both /seller and /seller/projects) ──
router.get('/',                 paginationRules, validate, getMyProjects);
router.get('/projects',         paginationRules, validate, getMyProjects);
router.post('/',                projectRules,    validate, createProject);
router.post('/projects',        projectRules,    validate, createProject);
router.put('/:id',              projectRules,    validate, updateProject);
router.put('/projects/:id',     projectRules,    validate, updateProject);
router.delete('/:id',           deleteProject);
router.delete('/projects/:id',  deleteProject);

module.exports = router;