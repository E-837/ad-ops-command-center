/**
 * Digital Advertising Command - Server
 * Express server with modular API routes
 * 
 * Refactored: Routes moved to /routes directory for better maintainability
 */

const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./database/init');
const eventTriggers = require('./events/triggers');
const cronJobs = require('./cron-jobs');
const sseManager = require('./events/sse-manager');
const eventBus = require('./events/bus');

const app = express();
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());
app.use(logger.requestMiddleware);  // Request logging

// Serve static files from build/ in production, ui/ in development
const staticDir = isProduction ? path.join(__dirname, 'build') : path.join(__dirname, 'ui');
app.use(express.static(staticDir));
if (isProduction) {
  logger.info('Serving production build from build/ directory');
} else {
  logger.debug('Serving development files from ui/ directory');
}

// Initialize database
db.initialize();

// Initialize SSE integration with event bus
eventBus.setSSEManager(sseManager);

// --- Modular API Routes ---
const campaignsRouter = require('./routes/campaigns');
const analyticsRouter = require('./routes/analytics');
const workflowsRouter = require('./routes/workflows');
const connectorsRouter = require('./routes/connectors');
const agentsRouter = require('./routes/agents');
const sseRouter = require('./routes/sse');
const integrationsRouter = require('./routes/integrations');
const projectsRouter = require('./routes/projects');
const executionsRouter = require('./routes/executions');
const eventsRouter = require('./routes/events');
const templatesRouter = require('./routes/templates');
const domainRouter = require('./routes/domain');

// Mount routers
app.use('/api/campaigns', campaignsRouter);
app.use('/api', sseRouter);  // Mounts /api/stream and /api/stream/stats
app.use('/api', analyticsRouter);  // Mounts /api/pacing, /api/insights, /api/analytics/*
app.use('/api/workflows', workflowsRouter);
app.use('/api/connectors', connectorsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api', integrationsRouter);  // Mounts webhooks, recommendations, ab-tests, predictions
app.use('/api/projects', projectsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/domain', domainRouter);

// --- API: Health Check ---
app.get('/api/health', (req, res) => {
  // Get real connection status
  let connections = {};
  try {
    const apiClient = require('./connectors/api-client');
    connections = apiClient.getConnectionStatus();
  } catch (e) {
    connections = { error: e.message };
  }
  
  res.json({
    status: 'ok',
    name: 'Digital Advertising Command',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.getStats(),
    connections
  });
});

// --- Static UI Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'dashboard.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'projects.html'));
});

app.get('/workflows', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'workflows.html'));
});

app.get('/workflow-detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'workflow-detail.html'));
});

app.get('/campaigns', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'campaigns.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'reports.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'analytics.html'));
});

app.get('/integrations', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'integrations.html'));
});

// Legacy route redirect
app.get('/insights', (req, res) => {
  res.redirect('/reports');
});

app.get('/agents', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'agents.html'));
});

app.get('/query', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'query.html'));
});

app.get('/architecture', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'architecture.html'));
});

app.get('/connectors', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'connectors.html'));
});

// --- Global Error Handler Middleware ---
// Must be defined after all routes
app.use((err, req, res, next) => {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(err.details && { details: err.details }),
    ...(err.resource && { resource: err.resource }),
    ...(err.platform && { platform: err.platform }),
    ...(err.retryAfter && { retryAfter: err.retryAfter }),
    // Include stack trace in development only
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// --- Error Handling ---
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
});

// --- Start Server ---
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.logServerStart(PORT, process.env.NODE_ENV || 'development');
  
  console.log(`\n🎯 Digital Advertising Command v2.0.0`);
  console.log(`🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`📁 Projects:     http://localhost:${PORT}/projects`);
  console.log(`⚡ Workflows:    http://localhost:${PORT}/workflows`);
  console.log(`📈 Campaigns:    http://localhost:${PORT}/campaigns`);
  console.log(`📊 Reports:      http://localhost:${PORT}/reports`);
  console.log(`🤖 Agents:       http://localhost:${PORT}/agents`);
  console.log(`🔌 Connectors:   http://localhost:${PORT}/connectors`);
  console.log(`🏗️  Architecture: http://localhost:${PORT}/architecture`);
  console.log(`💬 Query:        http://localhost:${PORT}/query`);
  console.log(`\n📡 API: http://localhost:${PORT}/api/`);
  
  // Initialize event triggers and cron jobs
  logger.info('Initializing automation');
  try {
    eventTriggers.initializeTriggers();
    eventTriggers.autoRegisterWorkflowTriggers();
    cronJobs.initializeCronJobs();
    cronJobs.autoRegisterWorkflowCrons();
    logger.info('Automation initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize automation', { error: error.message, stack: error.stack });
  }
});

server.on('error', (err) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.logServerStop('SIGTERM received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.logServerStop('SIGINT received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
