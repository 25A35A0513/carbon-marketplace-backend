const mongoose = require('mongoose');

const IMPACT_TYPES = [
  'Forest Conservation',
  'Renewable Energy',
  'Blue Carbon',
  'Clean Cooking',
  'Peatland Conservation',
  'Biodiversity Conservation',
  'Soil Carbon',
  'Methane Capture',
  'Other',
];

const ProjectSchema = new mongoose.Schema(
  {
    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Core Info ───────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Project title is required'],
      trim:      true,
      minlength: [5,   'Title must be at least 5 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      minlength: [20,  'Description must be at least 20 characters'],
      maxlength: [2000,'Description must be at most 2000 characters'],
    },
    location: {
      type:     String,
      required: [true, 'Location is required'],
      trim:     true,
    },
    impactType: {
      type:     String,
      required: [true, 'Impact type is required'],
      enum:     IMPACT_TYPES,
    },

    // ── Credits & Pricing ───────────────────────────────
    totalCredits: {
      type:    Number,
      required:[true, 'Total credits is required'],
      min:     [1, 'Total credits must be at least 1'],
    },
    availableCredits: {
      type: Number,
      min:  [0, 'Available credits cannot be negative'],
    },
    pricePerCredit: {
      type:    Number,
      required:[true, 'Price per credit is required'],
      min:     [0.01, 'Price must be greater than 0'],
    },

    // ── Metadata ────────────────────────────────────────
    emoji:  { type: String, default: '🌿' },
    status: {
      type:    String,
      enum:    ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedAt:  { type: Date },
    verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt:  { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Virtuals ─────────────────────────────────────────────
ProjectSchema.virtual('soldCredits').get(function () {
  return this.totalCredits - (this.availableCredits ?? this.totalCredits);
});

ProjectSchema.virtual('percentSold').get(function () {
  if (!this.totalCredits) return 0;
  return Math.round(((this.totalCredits - this.availableCredits) / this.totalCredits) * 100);
});

// ── Indexes ──────────────────────────────────────────────
ProjectSchema.index({ seller: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ impactType: 1 });
ProjectSchema.index({ title: 'text', description: 'text', location: 'text' });

// ── Pre-save: set availableCredits on creation ────────────
ProjectSchema.pre('save', function (next) {
  if (this.isNew && this.availableCredits === undefined) {
    this.availableCredits = this.totalCredits;
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
