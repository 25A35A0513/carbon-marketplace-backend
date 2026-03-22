const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');

// @desc    Get user's transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'buyer'
    ? { buyer_id: req.user._id }
    : { seller_id: req.user._id };

  const transactions = await Transaction.find(filter)
    .populate('project_id', 'project_name location impact_type emoji')
    .populate('buyer_id',   'name email')
    .populate('seller_id',  'name email')
    .sort({ createdAt: -1 });

  success(res, { data: transactions, count: transactions.length });
});
