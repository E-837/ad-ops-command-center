/**
 * Standard API Response Helpers
 * Provides consistent response format across all API endpoints
 */

/**
 * Success response wrapper
 * @param {*} data - Response data
 * @param {Object} meta - Optional metadata
 * @returns {Object} Standardized success response
 */
function success(data, meta = {}) {
  return {
    success: true,
    data,
    ...(Object.keys(meta).length > 0 && { meta })
  };
}

/**
 * Error response wrapper
 * @param {string} message - Error message
 * @param {*} details - Optional error details
 * @returns {Object} Standardized error response
 */
function error(message, details = null) {
  return {
    success: false,
    error: message,
    ...(details && { details })
  };
}

/**
 * Paginated response wrapper
 * @param {Array} items - Array of items
 * @param {number} page - Current page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Standardized paginated response
 */
function paginated(items, page, pageSize, total) {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    success: true,
    data: items,
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  };
}

/**
 * Created response wrapper
 * @param {*} data - Created resource data
 * @param {string} resourceId - ID of created resource
 * @returns {Object} Standardized creation response
 */
function created(data, resourceId = null) {
  return {
    success: true,
    data,
    ...(resourceId && { meta: { resourceId, created: true } })
  };
}

/**
 * Updated response wrapper
 * @param {*} data - Updated resource data
 * @param {string} resourceId - ID of updated resource
 * @returns {Object} Standardized update response
 */
function updated(data, resourceId = null) {
  return {
    success: true,
    data,
    ...(resourceId && { meta: { resourceId, updated: true } })
  };
}

/**
 * Deleted response wrapper
 * @param {string} resourceId - ID of deleted resource
 * @param {string} resourceType - Type of deleted resource
 * @returns {Object} Standardized deletion response
 */
function deleted(resourceId, resourceType = 'resource') {
  return {
    success: true,
    data: {
      deleted: true,
      resourceId,
      resourceType
    }
  };
}

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
function noContent(res) {
  res.status(204).end();
}

module.exports = {
  success,
  error,
  paginated,
  created,
  updated,
  deleted,
  noContent
};
