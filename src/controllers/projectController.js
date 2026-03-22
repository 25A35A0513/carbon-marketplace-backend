const Project        = require('../models/Project');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler }  = require('../middleware/errorHandler');

// GET /api/projects — public, paginated, filterable
const getProjects = asyncHandler(async (req, res) => {
  const {
    page        = 1,
    limit       = 12,
    status      = 'verified',
    impactType,
    search,
    sort        = '-createdAt',
  } = req.query;

  const filter = {};
  if (status)     filter.status     = status;
  if (impactType) filter.impactType = impactType;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip  = (page - 1) * limit;
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('seller', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, projects, total, page, limit);
});

// GET /api/projects/:id — public single project
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('seller', 'name email');

  if (!project) return sendError(res, 'Project not found', 404);
  return sendSuccess(res, project);
});

module.exports = { getProjects, getProjectById };
