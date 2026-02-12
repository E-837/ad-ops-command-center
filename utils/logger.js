/**
 * Structured Logging with Winston
 * 
 * Provides application-wide logging with:
 * - Multiple log levels (error, warn, info, debug)
 * - File and console output
 * - Colorized console in development
 * - JSON format for production parsing
 * - Request logging middleware
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('Server started', { port: 3002 });
 *   logger.error('Database error', { error: err.message });
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Custom format for console (colorized, human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// JSON format for file (machine-readable)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console output (always enabled)
  new winston.transports.Console({
    format: consoleFormat
  })
];

// File transports (production only, or if LOG_FILES=true)
if (isProduction || process.env.LOG_FILES === 'true') {
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  transports: transports,
  exitOnError: false
});

// Add request logging middleware
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

// Helper methods for common logging patterns
logger.logServerStart = (port, env = 'development') => {
  logger.info('🚀 Server started', {
    port,
    environment: env,
    nodeVersion: process.version,
    pid: process.pid
  });
};

logger.logServerStop = (reason = 'shutdown') => {
  logger.info('Server stopping', { reason });
};

logger.logDatabaseOperation = (operation, details = {}) => {
  logger.debug('Database operation', { operation, ...details });
};

logger.logConnectorOperation = (connector, operation, details = {}) => {
  logger.info('Connector operation', { connector, operation, ...details });
};

logger.logWorkflowExecution = (workflowId, executionId, status, details = {}) => {
  logger.info('Workflow execution', { workflowId, executionId, status, ...details });
};

logger.logAPIError = (endpoint, error, details = {}) => {
  logger.error('API error', {
    endpoint,
    error: error.message,
    stack: error.stack,
    ...details
  });
};

// Stream for Morgan (HTTP request logger) integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
