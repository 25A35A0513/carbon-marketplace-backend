const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    buyer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    project: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Project',
      required: true,
    },

    // ── Snapshot fields (de-normalised so records stay accurate
    //    even if project is later edited) ──────────────────
    projectTitle:   { type: String, required: true },
    creditsPurchased: {
      type:    Number,
      required:[true, 'Credits purchased is required'],
      min:     [1,    'Must purchase at least 1 credit'],
    },
    pricePerCredit: {
      type:    Number,
      required: true,
    },
    totalAmount: {
      type:    Number,
      required: true,
    },

    status: {
      type:    String,
      enum:    ['completed', 'refunded', 'disputed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────
TransactionSchema.index({ buyer:   1 });
TransactionSchema.index({ seller:  1 });
TransactionSchema.index({ project: 1 });
TransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
