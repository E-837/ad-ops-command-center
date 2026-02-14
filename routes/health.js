/**
 * Health Check Routes
 * 
 * Endpoints:
 * - GET /api/health - Basic health check
 * - GET /api/health/processes - Process pool & semaphore status
 */

const express = require('express');
const router = express.Router();
const { getSemaphoreStatus, getActiveProcesses } = require('../scripts/mcp-helper');
const processCleanup = require('../utils/process-cleanup');

/**
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * Process monitoring endpoint
 */
router.get('/processes', (req, res) => {
  const semaphore = getSemaphoreStatus();
  const active = getActiveProcesses();
  const cleanup = processCleanup.getStats();
  
  // Alert if too many processes
  const alert = active.length > 5 ? {
    level: 'warning',
    message: `${active.length} active processes detected (recommended max: 5)`
  } : null;
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    semaphore,
    activeProcesses: {
      count: active.length,
      processes: active
    },
    cleanup,
    alert
  });
});

module.exports = router;
