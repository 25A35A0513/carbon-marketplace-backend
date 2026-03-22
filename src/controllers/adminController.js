const User        = require('../models/User');
const Project     = require('../models/Project');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /api/admin/stats ───────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProjects,
    pendingProjects,
    verifiedProjects,
    rejectedProjects,
    totalTransactions,
    volumeAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Project.countDocuments({ status: 'pending'  }),
    Project.countDocuments({ status: 'verified' }),
    Project.countDocuments({ status: 'rejected' }),
    Transaction.countDocuments(),
    Transaction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$totalAmount' }, totalCredits: { $sum: '$creditsPurchased' } } },
    ]),
  ]);

  const buyers  = await User.countDocuments({ role: 'buyer'  });
  const sellers = await User.countDocuments({ role: 'seller' });
  const admins  = await User.countDocuments({ role: 'admin'  });

  const { totalVolume = 0, totalCredits = 0 } = volumeAgg[0] || {};

  return sendSuccess(res, {
    users:        { total: totalUsers, buyers, sellers, admins },
    projects:     { total: totalProjects, pending: pendingProjects, verified: verifiedProjects, rejected: rejectedProjects },
    transactions: { total: totalTransactions, totalVolume, totalCredits },
  });
});

// ── GET /api/admin/projects ────────────────────────────────
const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, impactType, search } = req.query;
  const skip   = (page - 1) * limit;
  const filter = {};
  if (status)     filter.status     = status;
  if (impactType) filter.impactType = impactType;
  if (search)     filter.$text      = { $search: search };

  const total    = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('seller',     'name email')
    .populate('verifiedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, projects, total, page, limit);
});

// ── PUT /api/admin/projects/:id/verify ────────────────────
const verifyProject = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) return sendError(res, 'Project not found', 404);

  if (project.status !== 'pending') {
    return sendError(res, `Project is already '${project.status}'`, 400);
  }

  project.status = status;

  if (status === 'verified') {
    project.verifiedAt = new Date();
    project.verifiedBy = req.user._id;
  } else {
    project.rejectedAt      = new Date();
    project.rejectionReason = rejectionReason;
  }

  await project.save();

  const populated = await project.populate([
    { path: 'seller',     select: 'name email' },
    { path: 'verifiedBy', select: 'name' },
  ]);

  return sendSuccess(res, populated, `Project ${status}`);
});

// ── GET /api/admin/users ───────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  const skip   = (page - 1) * limit;
  const filter = {};
  if (role)   filter.role   = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, users.map(u => u.toPublic()), total, page, limit);
});

// ── PATCH /api/admin/users/:id/status ─────────────────────
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 'Admins cannot change their own status', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);

  user.status = status;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, user.toPublic(), `User ${status}`);
});

// ── GET /api/admin/transactions ────────────────────────────
const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const total = await Transaction.countDocuments();
  const txns  = await Transaction.find()
    .populate('buyer',   'name email')
    .populate('seller',  'name email')
    .populate('project', 'title impactType emoji location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, txns, total, page, limit);
});

module.exports = {
  getStats,
  getAllProjects,
  verifyProject,
  getAllUsers,
  updateUserStatus,
  getAllTransactions,
};
