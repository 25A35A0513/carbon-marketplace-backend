const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,            // never returned in queries by default
    },
    role: {
      type:    String,
      enum:    ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
    status: {
      type:    String,
      enum:    ['active', 'suspended'],
      default: 'active',
    },
    refreshToken: {
      type:   String,
      select: false,
    },
  },
  {
    timestamps: true,               // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────

UserSchema.index({ role: 1 });

// ── Pre-save: hash password ────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare passwords ────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove sensitive fields from JSON output ──────────────
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
