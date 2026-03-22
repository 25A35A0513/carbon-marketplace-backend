const express = require('express');
const router  = express.Router();

const {
  getStats, getAllProjects, verifyProject,
  getAllUsers, updateUserStatus, getAllTransactions,
} = require('../controllers/adminController');
const {
  getAllContacts, getContactStats, updateContactStatus, deleteContact,
} = require('../controllers/ContactController');          // ✅ fixed casing
const { protect, authorize } = require('../middleware/auth');
const {
  verifyProjectRules, updateUserStatusRules, paginationRules, validate,
} = require('../middleware/validators');
const { body, param, query } = require('express-validator');

// All admin-only
router.use(protect, authorize('admin'));

// ── Platform stats ────────────────────────────────────────
router.get('/stats', getStats);

// ── Projects ──────────────────────────────────────────────
router.get('/projects',            paginationRules,       validate, getAllProjects);
router.put('/projects/:id/verify', verifyProjectRules,    validate, verifyProject);

// ── Users ─────────────────────────────────────────────────
router.get('/users',               paginationRules,       validate, getAllUsers);
router.patch('/users/:id/status',  updateUserStatusRules, validate, updateUserStatus);

// ── Transactions ──────────────────────────────────────────
router.get('/transactions',        paginationRules,       validate, getAllTransactions);

// ── Contact messages inbox ────────────────────────────────
router.get('/contacts/stats', getContactStats);
router.get('/contacts', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('status').optional().isIn(['new','read','replied','archived']),
  query('inquiryType').optional().isIn(['buyer','seller','platform','partner','press','other']),
], validate, getAllContacts);
router.patch('/contacts/:id', [
  param('id').isMongoId().withMessage('Invalid ID'),
  body('status').optional().isIn(['new','read','replied','archived']),
  body('adminNotes').optional().isString().isLength({ max: 1000 }),
], validate, updateContactStatus);
router.delete('/contacts/:id', [
  param('id').isMongoId().withMessage('Invalid ID'),
], validate, deleteContact);

module.exports = router;