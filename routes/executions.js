/**
 * Execution Routes
 * Workflow execution tracking and management
 */

const express = require('express');
const router = express.Router();
const executions = require('../database/executions');

// List all executions with filters
router.get('/', (req, res) => {
  try {
    const filter = {
      projectId: req.query.projectId,
      workflowId: req.query.workflowId,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const executionList = executions.list(filter);
    const stats = executions.getStats();
    
    res.json({
      executions: executionList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get execution by ID
router.get('/:id', (req, res) => {
  try {
    const execution = executions.get(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel execution
router.post('/:id/cancel', (req, res) => {
  try {
    const execution = executions.get(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    if (execution.status !== 'queued' && execution.status !== 'running') {
      return res.status(400).json({ error: 'Can only cancel queued or running executions' });
    }
    
    executions.update(req.params.id, {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
