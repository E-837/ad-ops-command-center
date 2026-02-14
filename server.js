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
const processCleanup = require('./utils/process-cleanup');
const communicationBus = require('./agents/communication-bus');

const app = express();
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const reactDistDir = path.join(__dirname, 'ui-react', 'dist');
const legacyUiDir = path.join(__dirname, 'ui');

// Middleware
app.use(express.json());
app.use(logger.requestMiddleware);  // Request logging

if (isProduction) {
  logger.info('Serving production build from ui-react/dist directory');
} else if (isDevelopment) {
  logger.info('Development mode: proxying UI requests to Vite dev server at http://localhost:5173');
} else {
  logger.info('Non-production mode detected; defaulting UI requests to Vite dev server');
}

// Initialize database
db.initialize();

// Initialize SSE integration with event bus
eventBus.setSSEManager(sseManager);

// Bridge A2A bus messages onto SSE stream for UI real-time activity
communicationBus.on('message', (message) => {
  sseManager.broadcast({
    type: 'agent_message',
    data: message,
  });
});

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
const reportsRouter = require('./routes/reports');
const domainRouter = require('./routes/domain');
const healthRouter = require('./routes/health');

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
app.use('/api/reports', reportsRouter);
app.use('/api/domain', domainRouter);
app.use('/api/health', healthRouter);  // Health & process monitoring

// --- API: Dashboard aggregate ---
app.get('/api/dashboard', async (req, res, next) => {
  try {
    const [projectsRes, executionsRes, campaignsRes, pacingRes] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/projects`).then((r) => r.json()).catch(() => ({})),
      fetch(`http://localhost:${PORT}/api/executions?limit=25`).then((r) => r.json()).catch(() => ({})),
      fetch(`http://localhost:${PORT}/api/campaigns`).then((r) => r.json()).catch(() => ({})),
      fetch(`http://localhost:${PORT}/api/pacing`).then((r) => r.json()).catch(() => ({})),
    ]);

    res.json({
      projects: projectsRes.projects || projectsRes.data || [],
      executions: executionsRes.executions || executionsRes.data || [],
      campaigns: campaignsRes.campaigns || campaignsRes.data || [],
      pacing: pacingRes.data || pacingRes || { pacing: [] },
    });
  } catch (err) {
    next(err);
  }
});

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
if (isDevelopment) {
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    const query = req.url.slice(req.path.length);
    const proxyPath = req.path === '/insights' ? '/reports' : req.path;
    const viteUrl = `http://localhost:5173${proxyPath}${query}`;

    try {
      const response = await fetch(viteUrl);
      const body = Buffer.from(await response.arrayBuffer());

      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-encoding') {
          res.setHeader(key, value);
        }
      });

      res.status(response.status).send(body);
    } catch (error) {
      res.status(502).send('Development UI proxy is enabled but Vite is not reachable at http://localhost:5173');
    }
  });
} else {
  // Optional legacy UI access for rollback/debugging
  app.use('/legacy', express.static(legacyUiDir));
  app.get('/legacy', (req, res) => {
    res.sendFile(path.join(legacyUiDir, 'index.html'));
  });

  // Serve React static build
  app.use(express.static(reactDistDir));

  // All non-API routes go to React app
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(reactDistDir, 'index.html'));
  });
}

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
  
  // Start process cleanup scanner
  try {
    processCleanup.start();
    logger.info('Process cleanup scanner started');
  } catch (error) {
    logger.error('Failed to start process cleanup', { error: error.message });
  }
});

server.on('error', (err) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.logServerStop('SIGTERM received');
  
  // Stop process cleanup scanner
  processCleanup.stop();
  logger.info('Process cleanup stopped');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.logServerStop('SIGINT received');
  
  // Stop process cleanup scanner
  processCleanup.stop();
  logger.info('Process cleanup stopped');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
