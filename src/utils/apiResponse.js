const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

const error = (res, message = 'Error', statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

const paginate = (res, data, total, page, limit) =>
  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data,
  });

module.exports = { success, error, paginate };
