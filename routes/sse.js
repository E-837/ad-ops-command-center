/**
 * Server-Sent Events (SSE) Routes
 * Real-time event streaming
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const sseManager = require('../events/sse-manager');

// SSE event stream endpoint
router.get('/stream', (req, res) => {
  // Parse filters from query params
  const filters = {};
  
  if (req.query.eventTypes) {
    filters.eventTypes = req.query.eventTypes.split(',');
  }
  
  if (req.query.workflowId) {
    filters.workflowId = req.query.workflowId;
  }
  
  if (req.query.executionId) {
    filters.executionId = req.query.executionId;
  }
  
  if (req.query.projectId) {
    filters.projectId = req.query.projectId;
  }
  
  // Add client to SSE manager
  const clientId = sseManager.addClient(res, filters);
  
  // Log connection
  logger.info('SSE client connected', { clientId, filters });
});

// SSE connection stats
router.get('/stats', (req, res) => {
  const stats = sseManager.getStats();
  res.json(stats);
});

module.exports = router;
