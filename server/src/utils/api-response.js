/**
 * Standardized API Response Helpers
 */

export const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const created = (res, data, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

export const paginated = (res, { data, total, page, limit }) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const error = (res, message = 'Internal server error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
  };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
};

export const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

export const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

export const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

export const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, message, 400, details);
};
