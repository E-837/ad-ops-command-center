/**
 * Custom Error Classes
 * Provides structured error handling with proper HTTP status codes
 */

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Client validation error (400)
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Resource not found error (404)
 */
class NotFoundError extends AppError {
  constructor(resource, identifier = null) {
    super(`${resource} not found${identifier ? `: ${identifier}` : ''}`, 404);
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Authentication error (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

/**
 * Permission error (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * External API error (502)
 */
class APIError extends AppError {
  constructor(message, platform = null, statusCode = 502) {
    super(message, statusCode);
    this.platform = platform;
  }
}

/**
 * Rate limit error (429)
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Database error (500)
 */
class DatabaseError extends AppError {
  constructor(message, operation = null) {
    super(message, 500);
    this.operation = operation;
  }
}

/**
 * Workflow execution error (500)
 */
class WorkflowError extends AppError {
  constructor(message, workflowId = null, executionId = null) {
    super(message, 500);
    this.workflowId = workflowId;
    this.executionId = executionId;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  APIError,
  RateLimitError,
  DatabaseError,
  WorkflowError
};
