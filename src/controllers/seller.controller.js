const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginate } = require('../utils/apiResponse');

// @desc    Get seller's projects
// @route   GET /api/seller/projects
exports.getSellerProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ seller_id: req.user._id }).sort({ createdAt: -1 });
  success(res, { data: projects, count: projects.length });
});

// @desc    Create a new project
// @route   POST /api/seller/project
exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, seller_id: req.user._id });
  success(res, { data: project }, 'Project submitted for verification.', 201);
});

// @desc    Update a project
// @route   PUT /api/seller/project/:id
exports.updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findOne({ _id: req.params.id, seller_id: req.user._id });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (project.verification_status === 'verified') {
    // Limit what can be edited on verified projects
    const { description, emoji } = req.body;
    project = await Project.findByIdAndUpdate(req.params.id, { description, emoji }, { new: true, runValidators: true });
  } else {
    project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  }
  success(res, { data: project }, 'Project updated.');
});

// @desc    Delete a project
// @route   DELETE /api/seller/project/:id
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, seller_id: req.user._id });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (project.verification_status === 'verified') {
    return res.status(400).json({ success: false, message: 'Cannot delete a verified project. Contact admin.' });
  }
  await project.deleteOne();
  success(res, {}, 'Project deleted.');
});

// @desc    Get seller's sales history
// @route   GET /api/seller/sales
exports.getSales = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ seller_id: req.user._id })
    .populate('buyer_id', 'name email')
    .populate('project_id', 'project_name')
    .sort({ createdAt: -1 });

  const totalRevenue = transactions.reduce((s, t) => s + t.total_price, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.credits_purchased, 0);

  success(res, {
    data: {
      summary: { total_revenue: totalRevenue, total_credits_sold: totalCredits, total_transactions: transactions.length },
      transactions,
    },
  });
});
