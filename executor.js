/**
 * Workflow Executor
 * Executes multi-step workflows with agent coordination
 */

const workflows = require('./workflows');
const agents = require('./agents');
const router = require('./router');
const { load, save } = require('./database/init');

// Workflow execution queue
let executionQueue = [];
let isProcessing = false;

/**
 * Queue a workflow for execution
 */
function queueWorkflow(workflowName, params, options = {}) {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  const execution = {
    id: executionId,
    workflow: workflowName,
    params,
    status: 'queued',
    priority: options.priority || 'normal',
    queuedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null
  };
  
  executionQueue.push(execution);
  
  // Sort by priority
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  executionQueue.sort((a, b) => 
    (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
  );
  
  // Start processing if not already
  if (!isProcessing) {
    processQueue();
  }
  
  // Persist queue state
  saveQueueState();
  
  return executionId;
}

/**
 * Process the execution queue
 */
async function processQueue() {
  if (isProcessing || executionQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  while (executionQueue.length > 0) {
    const execution = executionQueue.find(e => e.status === 'queued');
    if (!execution) break;
    
    execution.status = 'running';
    execution.startedAt = new Date().toISOString();
    saveQueueState();
    
    try {
      const workflow = workflows.getWorkflow(execution.workflow);
      
      if (!workflow) {
        throw new Error(`Unknown workflow: ${execution.workflow}`);
      }
      
      // Execute workflow
      const result = await workflow.run(execution.params);
      
      execution.status = 'completed';
      execution.result = result;
      execution.completedAt = new Date().toISOString();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date().toISOString();
    }
    
    saveQueueState();
  }
  
  isProcessing = false;
}

/**
 * Get execution status
 */
function getExecutionStatus(executionId) {
  return executionQueue.find(e => e.id === executionId) || null;
}

/**
 * Get all executions
 */
function getAllExecutions(limit = 50) {
  return executionQueue.slice(-limit);
}

/**
 * Get pending executions
 */
function getPendingExecutions() {
  return executionQueue.filter(e => e.status === 'queued' || e.status === 'running');
}

/**
 * Cancel an execution
 */
function cancelExecution(executionId) {
  const execution = executionQueue.find(e => e.id === executionId);
  
  if (!execution) {
    return { success: false, error: 'Execution not found' };
  }
  
  if (execution.status !== 'queued') {
    return { success: false, error: 'Can only cancel queued executions' };
  }
  
  execution.status = 'cancelled';
  execution.completedAt = new Date().toISOString();
  saveQueueState();
  
  return { success: true };
}

/**
 * Run workflow immediately (bypasses queue)
 */
async function runImmediate(workflowName, params) {
  const workflow = workflows.getWorkflow(workflowName);
  
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowName}`);
  }
  
  return workflow.run(params);
}

/**
 * Save queue state to disk
 */
function saveQueueState() {
  // Keep only recent executions
  if (executionQueue.length > 200) {
    executionQueue = executionQueue.slice(-200);
  }
  
  save('workflow-executions', executionQueue);
}

/**
 * Load queue state from disk
 */
function loadQueueState() {
  const saved = load('workflow-executions', []);
  
  // Filter out old completed executions (keep last 24 hours)
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  
  executionQueue = saved.filter(e => 
    e.status === 'queued' || 
    e.status === 'running' ||
    new Date(e.completedAt || e.queuedAt) > cutoff
  );
  
  // Reset any "running" executions to "queued" (in case of restart)
  executionQueue.forEach(e => {
    if (e.status === 'running') {
      e.status = 'queued';
      e.startedAt = null;
    }
  });
  
  saveQueueState();
}

/**
 * Get executor stats
 */
function getStats() {
  return {
    total: executionQueue.length,
    queued: executionQueue.filter(e => e.status === 'queued').length,
    running: executionQueue.filter(e => e.status === 'running').length,
    completed: executionQueue.filter(e => e.status === 'completed').length,
    failed: executionQueue.filter(e => e.status === 'failed').length,
    isProcessing
  };
}

// Initialize on load
loadQueueState();

module.exports = {
  queueWorkflow,
  getExecutionStatus,
  getAllExecutions,
  getPendingExecutions,
  cancelExecution,
  runImmediate,
  getStats
};
