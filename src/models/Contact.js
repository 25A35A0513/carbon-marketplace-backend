const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [80, 'Name too long'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    subject: {
      type:      String,
      trim:      true,
      maxlength: [200, 'Subject too long'],
      default:   'General Enquiry',
    },
    inquiryType: {
      type:    String,
      enum:    ['buyer', 'seller', 'platform', 'partner', 'press', 'other'],
      default: 'other',
    },
    message: {
      type:      String,
      required:  [true, 'Message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [3000, 'Message too long'],
    },
    // Which page the form was submitted from
    source: {
      type:    String,
      enum:    ['landing', 'contact_page'],
      default: 'contact_page',
    },
    // Status for admin to track
    status: {
      type:    String,
      enum:    ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    // Optional: linked user if they were logged in
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },
    adminNotes: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', ContactSchema);