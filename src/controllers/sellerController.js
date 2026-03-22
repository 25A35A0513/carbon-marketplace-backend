const Project     = require('../models/Project');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/seller/projects
const getMyProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip   = (page - 1) * limit;
  const filter = { seller: req.user._id };
  if (status) filter.status = status;

  const total    = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, projects, total, page, limit);
});

// POST /api/seller/projects
const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, seller: req.user._id });
  return sendSuccess(res, project, 'Project submitted for verification', 201);
});

// PUT /api/seller/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, seller: req.user._id });
  if (!project) return sendError(res, 'Project not found', 404);

  if (project.status === 'verified') {
    return sendError(res, 'Verified projects cannot be edited. Contact admin.', 400);
  }

  // Fields allowed to be updated
  const allowed = ['title', 'description', 'location', 'impactType',
                   'totalCredits', 'pricePerCredit', 'emoji'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) project[key] = req.body[key];
  });

  // Re-set to pending after edit
  project.status = 'pending';
  await project.save();

  return sendSuccess(res, project, 'Project updated and resubmitted for verification');
});

// DELETE /api/seller/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, seller: req.user._id });
  if (!project) return sendError(res, 'Project not found', 404);

  if (project.status === 'verified' && project.soldCredits > 0) {
    return sendError(res, 'Cannot delete a project with existing transactions', 400);
  }

  await project.deleteOne();
  return sendSuccess(res, null, 'Project deleted');
});

// GET /api/seller/sales — revenue + transaction breakdown
const getSales = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip   = (page - 1) * limit;
  const filter = { seller: req.user._id };

  const total = await Transaction.countDocuments(filter);
  const txns  = await Transaction.find(filter)
    .populate('buyer',   'name email')
    .populate('project', 'title impactType emoji')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Aggregate summary
  const [summary] = await Transaction.aggregate([
    { $match: { seller: req.user._id } },
    {
      $group: {
        _id:          null,
        totalRevenue: { $sum: '$totalAmount'      },
        totalSold:    { $sum: '$creditsPurchased' },
        txnCount:     { $sum: 1                   },
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    data: txns,
    summary: summary
      ? { totalRevenue: summary.totalRevenue, totalSold: summary.totalSold, txnCount: summary.txnCount }
      : { totalRevenue: 0, totalSold: 0, txnCount: 0 },
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
});

module.exports = { getMyProjects, createProject, updateProject, deleteProject, getSales };
