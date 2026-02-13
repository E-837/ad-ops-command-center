/**
 * Workflow Routes
 * Workflow execution and management
 */

const express = require('express');
const router = express.Router();
const workflows = require('../workflows');
const executions = require('../database/executions');
const { NotFoundError, ValidationError } = require('../utils/errors');

function validateWorkflowInputs(req, res, next) {
  try {
    const workflow = workflows.getWorkflow(req.params.name);
    if (!workflow) {
      throw new NotFoundError('Workflow', req.params.name);
    }

    const inputs = workflow.meta?.inputs || {};
    const payload = req.body || {};

    for (const [key, schema] of Object.entries(inputs)) {
      if (schema.required && (payload[key] === undefined || payload[key] === null || payload[key] === '')) {
        throw new ValidationError(`Missing required field: ${key}`);
      }

      if (payload[key] !== undefined && schema.type) {
        const value = payload[key];
        const isValidType = (
          (schema.type === 'array' && Array.isArray(value)) ||
          (schema.type === 'number' && typeof value === 'number') ||
          (schema.type === 'string' && typeof value === 'string') ||
          (schema.type === 'boolean' && typeof value === 'boolean') ||
          (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value))
        );

        if (!isValidType) {
          throw new ValidationError(`Invalid type for ${key}: expected ${schema.type}`);
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Get all workflows with categorization
router.get('/', (req, res, next) => {
  try {
    const registry = workflows.getRegistry();
    const categories = registry.getCategories();
    const allWorkflows = registry.getAllWorkflows();

    res.json({
      workflows: allWorkflows,
      categories,
      stats: registry.getStats()
    });
  } catch (err) {
    next(err);
  }
});

// Get workflow by name
router.get('/:name', (req, res, next) => {
  try {
    const registry = workflows.getRegistry();
    const workflow = registry.getWorkflow(req.params.name);

    if (!workflow) {
      throw new NotFoundError('Workflow', req.params.name);
    }

    res.json({
      id: workflow.id,
      ...workflow.meta
    });
  } catch (err) {
    next(err);
  }
});

// Run workflow
router.post('/:name/run', validateWorkflowInputs, async (req, res, next) => {
  try {
    const result = await workflows.runWorkflow(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Brief-to-campaign shortcut endpoint
router.post('/brief-to-campaign', async (req, res, next) => {
  try {
    const brief = String(req.body?.brief || '').trim();
    if (!brief) {
      throw new ValidationError('brief is required');
    }

    const result = await workflows.runWorkflow('brief-to-campaign', {
      brief,
      fullLifecycle: req.body?.fullLifecycle === true,
      campaign: req.body?.campaign,
      includeSearch: req.body?.includeSearch === true
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get workflow execution history
router.get('/:name/history', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = executions.getRecentByWorkflow(req.params.name, limit);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
