/**
 * Workflow Routes
 * Workflow execution and management
 */

const express = require('express');
const router = express.Router();
const workflows = require('../workflows');
const executions = require('../database/executions');
const { loadCheckpoint } = require('../utils/checkpoint');
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

// Run workflow (async — returns 202 with executionId, runs in background)
router.post('/:name/run', validateWorkflowInputs, async (req, res, next) => {
  try {
    const execution = executions.create({
      workflowId: req.params.name,
      status: 'queued',
      params: req.body
    });

    // Queue for background execution — don't block the HTTP request
    const executor = require('../executor');
    executor.queueWorkflow(req.params.name, {
      ...req.body,
      executionId: execution.id
    });

    // Return immediately with 202 Accepted
    res.status(202).json({
      executionId: execution.id,
      status: 'queued',
      statusUrl: `/api/workflows/${req.params.name}/executions/${execution.id}`,
      eventsUrl: `/api/workflows/${req.params.name}/executions/${execution.id}/events`
    });
  } catch (err) {
    next(err);
  }
});

// Get execution status (polling endpoint)
router.get('/:name/executions/:executionId', (req, res, next) => {
  try {
    const execution = executions.get(req.params.executionId);
    if (!execution) {
      throw new NotFoundError('Execution', req.params.executionId);
    }
    res.json(execution);
  } catch (err) {
    next(err);
  }
});

// SSE endpoint for real-time progress streaming
router.get('/:name/executions/:executionId/events', (req, res) => {
  const eventBus = require('../events/bus');
  const executionId = req.params.executionId;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send current state immediately
  const current = executions.get(executionId);
  if (current) {
    res.write(`data: ${JSON.stringify({ type: 'status', ...current })}\n\n`);
    // If already done, close immediately
    if (current.status === 'completed' || current.status === 'failed') {
      res.end();
      return;
    }
  }

  // Stream future events
  const handler = (eventType, event) => {
    if (event && event.executionId === executionId) {
      res.write(`data: ${JSON.stringify({ type: eventType, ...event })}\n\n`);
      if (eventType === 'WORKFLOW_COMPLETED' || eventType === 'WORKFLOW_FAILED') {
        setTimeout(() => res.end(), 100);
      }
    }
  };

  // Listen on relevant event types
  const eventTypes = require('../events/types');
  const events = [
    eventTypes.WORKFLOW_STARTED, eventTypes.WORKFLOW_COMPLETED, eventTypes.WORKFLOW_FAILED,
    eventTypes.WORKFLOW_STAGE_STARTED, eventTypes.WORKFLOW_STAGE_COMPLETED,
    eventTypes.WORKFLOW_STAGE_PROGRESS
  ];
  for (const evt of events) {
    eventBus.on(evt, (data) => handler(evt, data));
  }

  req.on('close', () => {
    for (const evt of events) {
      eventBus.removeListener(evt, handler);
    }
  });
});

// Resume workflow from checkpoint
router.post('/:name/resume/:executionId', async (req, res, next) => {
  try {
    const workflow = workflows.getWorkflow(req.params.name);
    if (!workflow) {
      throw new NotFoundError('Workflow', req.params.name);
    }

    const checkpoint = loadCheckpoint(req.params.executionId);
    if (!checkpoint) {
      throw new NotFoundError('Checkpoint', req.params.executionId);
    }
    if (checkpoint.workflowId && checkpoint.workflowId !== req.params.name) {
      throw new ValidationError(`Checkpoint belongs to workflow ${checkpoint.workflowId}, not ${req.params.name}`);
    }

    let execution = executions.get(req.params.executionId);
    if (!execution) {
      execution = executions.create({
        id: req.params.executionId,
        workflowId: req.params.name,
        status: 'running',
        params: req.body || {}
      });
    }

    executions.update(req.params.executionId, {
      status: 'running',
      startedAt: execution.startedAt || new Date().toISOString(),
      params: {
        ...(execution.params || {}),
        ...(req.body || {})
      }
    });

    const result = await workflows.runWorkflow(req.params.name, {
      ...(execution.params || {}),
      ...(req.body || {}),
      executionId: req.params.executionId,
      resume: true
    });

    executions.update(req.params.executionId, {
      status: result.status || 'completed',
      stages: result.stages || [],
      result,
      error: result.error || null,
      completedAt: new Date().toISOString()
    });

    res.json({ ...result, executionId: req.params.executionId, resumed: true });
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
