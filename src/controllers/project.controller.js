const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginate } = require('../utils/apiResponse');

// @desc    Get all verified projects (marketplace)
// @route   GET /api/projects
// @access  Public
exports.getProjects = asyncHandler(async (req, res) => {
  const { impact_type, min_price, max_price, search, page = 1, limit = 12 } = req.query;

  const filter = { verification_status: 'verified', available_credits: { $gt: 0 } };
  if (impact_type)            filter.impact_type = impact_type;
  if (min_price || max_price) filter.price_per_credit = {};
  if (min_price) filter.price_per_credit.$gte = Number(min_price);
  if (max_price) filter.price_per_credit.$lte = Number(max_price);
  if (search) {
    filter.$or = [
      { project_name: { $regex: search, $options: 'i' } },
      { location:     { $regex: search, $options: 'i' } },
      { description:  { $regex: search, $options: 'i' } },
    ];
  }

  const skip  = (page - 1) * limit;
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('seller_id', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  paginate(res, projects, total, page, limit);
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('seller_id', 'name email');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  success(res, { data: project });
});
