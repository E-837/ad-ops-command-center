/**
 * Workflow Routes
 * Workflow execution and management
 */

const express = require('express');
const router = express.Router();
const workflows = require('../workflows');
const executions = require('../database/executions');

// Get all workflows with categorization
router.get('/', (req, res) => {
  const registry = workflows.getRegistry();
  const categories = registry.getCategories();
  const allWorkflows = registry.getAllWorkflows();
  
  res.json({
    workflows: allWorkflows,
    categories: categories,
    stats: registry.getStats()
  });
});

// Get workflow by name
router.get('/:name', (req, res) => {
  const registry = workflows.getRegistry();
  const workflow = registry.getWorkflow(req.params.name);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json({
    id: workflow.id,
    ...workflow.meta
  });
});

// Run workflow
router.post('/:name/run', async (req, res) => {
  try {
    const result = await workflows.runWorkflow(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Brief-to-campaign shortcut endpoint
router.post('/brief-to-campaign', async (req, res) => {
  try {
    const brief = String(req.body?.brief || '').trim();
    if (!brief) {
      return res.status(400).json({ error: 'brief is required' });
    }

    const result = await workflows.runWorkflow('brief-to-campaign', { brief });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get workflow execution history
router.get('/:name/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = executions.getRecentByWorkflow(req.params.name, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
