const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getSellerProjects, createProject, updateProject, deleteProject, getSales } = require('../controllers/seller.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect, authorize('seller'));

router.get('/projects',        getSellerProjects);
router.get('/sales',           getSales);
router.post('/project',
  [
    body('project_name').trim().notEmpty().isLength({ min: 5 }),
    body('description').trim().notEmpty().isLength({ min: 20 }),
    body('location').trim().notEmpty(),
    body('impact_type').notEmpty(),
    body('total_credits').isInt({ min: 1 }),
    body('price_per_credit').isFloat({ min: 0.01 }),
  ],
  validate, createProject
);
router.put('/project/:id',    updateProject);
router.delete('/project/:id', deleteProject);

module.exports = router;
