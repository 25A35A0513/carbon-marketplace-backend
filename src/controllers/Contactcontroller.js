const Contact      = require('../models/Contact');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyAccessToken } = require('../utils/jwt');
const logger           = require('../utils/logger');

// ── POST /api/contact  (fully public — no auth required) ──
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, inquiryType, message, source } = req.body;

  // Optionally read logged-in user from token — never reject if missing
  let userId = null;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      userId = decoded?.id || null;
    }
  } catch (_) {
    // No token or invalid token — that's fine, userId stays null
  }

  const contact = await Contact.create({
    name,
    email,
    subject:     subject     || 'General Enquiry',
    inquiryType: inquiryType || 'other',
    message,
    source:      source      || 'contact_page',
    user:        userId,
  });

  logger.info(`New contact message from ${email} [${inquiryType}]`);

  return sendSuccess(
    res,
    { id: contact._id, name: contact.name, email: contact.email },
    'Message received! We will reply within 24 hours.',
    201
  );
});

// ── GET /api/admin/contacts  (admin only) ─────────────────
const getAllContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, inquiryType } = req.query;
  const skip   = (page - 1) * limit;
  const filter = {};
  if (status)      filter.status      = status;
  if (inquiryType) filter.inquiryType = inquiryType;

  const total    = await Contact.countDocuments(filter);
  const contacts = await Contact.find(filter)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return sendPaginated(res, contacts, total, page, limit);
});

// ── GET /api/admin/contacts/stats  (admin only) ───────────
const getContactStats = asyncHandler(async (req, res) => {
  const [total, byStatus, byType, recent] = await Promise.all([
    Contact.countDocuments(),
    Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Contact.aggregate([
      { $group: { _id: '$inquiryType', count: { $sum: 1 } } },
    ]),
    Contact.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const statusMap = {};
  byStatus.forEach(s => { statusMap[s._id] = s.count; });

  const typeMap = {};
  byType.forEach(t => { typeMap[t._id] = t.count; });

  return sendSuccess(res, {
    total,
    lastSevenDays: recent,
    unread: statusMap.new || 0,
    byStatus: statusMap,
    byInquiryType: typeMap,
  });
});

// ── PATCH /api/admin/contacts/:id  (admin only) ───────────
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) return sendError(res, 'Message not found', 404);

  if (status)     contact.status     = status;
  if (adminNotes !== undefined) contact.adminNotes = adminNotes;
  await contact.save();

  return sendSuccess(res, contact, 'Updated');
});

// ── DELETE /api/admin/contacts/:id  (admin only) ──────────
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) return sendError(res, 'Message not found', 404);
  await contact.deleteOne();
  return sendSuccess(res, null, 'Message deleted');
});

module.exports = {
  submitContact,
  getAllContacts,
  getContactStats,
  updateContactStatus,
  deleteContact,
};