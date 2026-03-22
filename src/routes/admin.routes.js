const express = require('express');
const router = express.Router();
const { getAllProjects, verifyProject, getAllUsers, updateUserStatus, getAllTransactions, getStats } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats',                    getStats);
router.get('/projects',                 getAllProjects);
router.put('/project/verify/:id',       verifyProject);
router.get('/users',                    getAllUsers);
router.put('/users/:id/status',         updateUserStatus);
router.get('/transactions',             getAllTransactions);

module.exports = router;
