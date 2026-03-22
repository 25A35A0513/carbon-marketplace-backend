const mongoose = require('mongoose');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');

// @desc    Buy carbon credits
// @route   POST /api/credits/buy
// @access  Private (buyer)
exports.buyCredits = asyncHandler(async (req, res) => {
  const { project_id, credits_amount } = req.body;

  if (!project_id || !credits_amount || credits_amount < 1) {
    return res.status(400).json({ success: false, message: 'project_id and credits_amount (≥1) are required.' });
  }

  // Use a Mongoose session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findById(project_id).session(session);

    if (!project) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.verification_status !== 'verified') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Project is not verified for trading.' });
    }
    if (project.available_credits < credits_amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Only ${project.available_credits} credits available.`,
      });
    }

    const total_price = parseFloat((credits_amount * project.price_per_credit).toFixed(2));

    // Deduct credits atomically
    await Project.findByIdAndUpdate(
      project_id,
      { $inc: { available_credits: -credits_amount, sold_credits: credits_amount } },
      { session }
    );

    // Create transaction ledger entry
    const transaction = await Transaction.create([{
      buyer_id:          req.user._id,
      seller_id:         project.seller_id,
      project_id:        project._id,
      credits_purchased: credits_amount,
      price_per_credit:  project.price_per_credit,
      total_price,
      status:            'completed',
      snapshot: {
        buyer_name:       req.user.name,
        seller_name:      '', // populated below if needed
        project_name:     project.project_name,
        project_location: project.location,
      },
    }], { session });

    await session.commitTransaction();
    session.endSession();

    success(res, { data: transaction[0] }, 'Credits purchased successfully.', 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});
