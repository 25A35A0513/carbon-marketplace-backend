const User = require('../models/User');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');

// @desc    Get all projects (admin view)
// @route   GET /api/admin/projects
exports.getAllProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { verification_status: status } : {};
  const projects = await Project.find(filter)
    .populate('seller_id', 'name email')
    .sort({ createdAt: -1 });
  success(res, { data: projects, count: projects.length });
});

// @desc    Verify or reject a project
// @route   PUT /api/admin/project/verify/:id
exports.verifyProject = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'verified' or 'rejected'." });
  }
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    {
      verification_status: status,
      verification_notes:  notes,
      verified_at:         new Date(),
      verified_by:         req.user._id,
    },
    { new: true }
  );
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  success(res, { data: project }, `Project ${status}.`);
});

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  success(res, { data: users, count: users.length });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'." });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  success(res, { data: user }, `User ${status}.`);
});

// @desc    Get all transactions
// @route   GET /api/admin/transactions
exports.getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find()
    .populate('buyer_id',  'name email')
    .populate('seller_id', 'name email')
    .populate('project_id', 'project_name location')
    .sort({ createdAt: -1 });

  const totalVolume  = transactions.reduce((s, t) => s + t.total_price, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.credits_purchased, 0);

  success(res, {
    data: {
      summary: { total_volume: totalVolume, total_credits: totalCredits, total_transactions: transactions.length },
      transactions,
    },
  });
});

// @desc    Get platform overview stats
// @route   GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [userCount, projectCount, transactionCount, pendingCount] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Transaction.countDocuments(),
    Project.countDocuments({ verification_status: 'pending' }),
  ]);
  const volumeAgg = await Transaction.aggregate([
    { $group: { _id: null, total: { $sum: '$total_price' }, credits: { $sum: '$credits_purchased' } } },
  ]);
  success(res, {
    data: {
      users: userCount,
      projects: projectCount,
      transactions: transactionCount,
      pending_verification: pendingCount,
      total_volume: volumeAgg[0]?.total || 0,
      total_credits_traded: volumeAgg[0]?.credits || 0,
    },
  });
});
