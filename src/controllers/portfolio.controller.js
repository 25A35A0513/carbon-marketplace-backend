const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');

// @desc    Get buyer portfolio
// @route   GET /api/portfolio
// @access  Private (buyer)
exports.getPortfolio = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    buyer_id: req.user._id,
    status: 'completed',
  }).populate('project_id', 'project_name location impact_type emoji');

  const totalCredits = transactions.reduce((s, t) => s + t.credits_purchased, 0);
  const totalSpent   = transactions.reduce((s, t) => s + t.total_price, 0);

  // Group by project
  const holdingsMap = {};
  transactions.forEach(t => {
    const pid = t.project_id?._id?.toString() || t.project_id?.toString();
    if (!holdingsMap[pid]) {
      holdingsMap[pid] = {
        project: t.project_id,
        credits: 0,
        spent: 0,
        transactions: 0,
      };
    }
    holdingsMap[pid].credits      += t.credits_purchased;
    holdingsMap[pid].spent        += t.total_price;
    holdingsMap[pid].transactions += 1;
  });

  success(res, {
    data: {
      summary: {
        total_credits: totalCredits,
        total_co2_offset_tons: totalCredits,
        total_invested: parseFloat(totalSpent.toFixed(2)),
        projects_count: Object.keys(holdingsMap).length,
      },
      holdings: Object.values(holdingsMap),
    },
  });
});
