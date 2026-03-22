const mongoose    = require('mongoose');
const Project     = require('../models/Project');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/credits/buy/:projectId
const buyCredits = asyncHandler(async (req, res) => {
  const { credits }   = req.body;
  const { projectId } = req.params;
  const buyer         = req.user;

  // Use a session so the credit deduction + transaction creation are atomic
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findById(projectId).session(session);
    if (!project)                             throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    if (project.status !== 'verified')        throw Object.assign(new Error('Project is not verified for trading'), { statusCode: 400 });
    if (project.availableCredits < credits)   throw Object.assign(new Error(`Only ${project.availableCredits} credits available`), { statusCode: 400 });
    if (project.seller.toString() === buyer._id.toString())
      throw Object.assign(new Error('Sellers cannot buy their own credits'), { statusCode: 400 });

    // Deduct credits
    project.availableCredits -= credits;
    await project.save({ session });

    // Create transaction record
    const [txn] = await Transaction.create(
      [{
        buyer:            buyer._id,
        seller:           project.seller,
        project:          project._id,
        projectTitle:     project.title,
        creditsPurchased: credits,
        pricePerCredit:   project.pricePerCredit,
        totalAmount:      credits * project.pricePerCredit,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await txn.populate([
      { path: 'buyer',   select: 'name email' },
      { path: 'seller',  select: 'name email' },
      { path: 'project', select: 'title location impactType emoji' },
    ]);

    return sendSuccess(res, populated, 'Credits purchased successfully', 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

// GET /api/credits/portfolio — buyer's aggregated holdings
const getPortfolio = asyncHandler(async (req, res) => {
  const holdings = await Transaction.aggregate([
    { $match: { buyer: req.user._id } },
    {
      $group: {
        _id:              '$project',
        projectTitle:     { $first: '$projectTitle' },
        totalCredits:     { $sum: '$creditsPurchased' },
        totalSpent:       { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
        lastPurchase:     { $max: '$createdAt' },
      },
    },
    { $sort: { totalCredits: -1 } },
  ]);

  // Populate project details
  await Transaction.populate(holdings, { path: '_id', select: 'title location impactType emoji status', model: 'Project' });

  const summary = {
    totalCredits: holdings.reduce((s, h) => s + h.totalCredits, 0),
    totalSpent:   holdings.reduce((s, h) => s + h.totalSpent,   0),
    projectCount: holdings.length,
  };

  return sendSuccess(res, { holdings, summary });
});

// GET /api/credits/transactions — buyer's transaction history
const getMyTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip  = (page - 1) * limit;
  const filter = { buyer: req.user._id };

  const total = await Transaction.countDocuments(filter);
  const txns  = await Transaction.find(filter)
    .populate('project', 'title impactType emoji location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, txns, total, page, limit);
});

module.exports = { buyCredits, getPortfolio, getMyTransactions };
