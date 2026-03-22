/**
 * Send a successful JSON response.
 * @param {Response} res
 * @param {*}        data
 * @param {string}   message
 * @param {number}   statusCode  default 200
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error JSON response.
 * @param {Response} res
 * @param {string}   message
 * @param {number}   statusCode  default 400
 * @param {*}        errors      optional validation errors array
 */
const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Paginated list response.
 */
const sendPaginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
