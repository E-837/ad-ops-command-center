/**
 * Workflow Executor
 * Executes multi-step workflows with agent coordination
 */

const workflows = require('./workflows');
const agents = require('./agents');
const router = require('./router');
const { load, save } = require('./database/init');
const eventBus = require('./events/bus');
const eventTypes = require('./events/types');
const executions = require('./database/executions');
const projects = require('./database/projects');

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
    
    // Create execution record in database
    const executionRecord = executions.create({
      id: execution.id,
      projectId: execution.params.projectId || null,
      workflowId: execution.workflow,
      status: 'running',
      params: execution.params
    });
    
    executions.update(execution.id, {
      startedAt: execution.startedAt
    });
    
    // Link to project if specified
    if (execution.params.projectId) {
      try {
        projects.addExecution(execution.params.projectId, execution.id);
      } catch (err) {
        console.warn(`Could not link execution to project: ${err.message}`);
      }
    }
    
    // Emit workflow started event
    const startEvent = eventBus.emit(eventTypes.WORKFLOW_STARTED, {
      source: execution.id,
      workflowId: execution.workflow,
      executionId: execution.id,
      projectId: execution.params.projectId,
      params: execution.params,
      startedAt: execution.startedAt
    });
    
    executions.addEvent(execution.id, startEvent.id);
    
    try {
      const workflow = workflows.getWorkflow(execution.workflow);
      
      if (!workflow) {
        throw new Error(`Unknown workflow: ${execution.workflow}`);
      }
      
      // Check if workflow is an orchestrator
      const registry = workflows.getRegistry();
      const workflowMeta = registry.getWorkflowMeta(execution.workflow);
      
      let result;
      if (workflowMeta && workflowMeta.isOrchestrator) {
        // Execute orchestrator workflow with parallel support
        result = await executeOrchestrator(workflow, execution.params, workflowMeta);
      } else {
        // Execute regular workflow
        result = await workflow.run(execution.params);
      }
      
      execution.status = 'completed';
      execution.result = result;
      execution.completedAt = new Date().toISOString();
      
      // Update execution record
      executions.update(execution.id, {
        status: 'completed',
        result: result,
        completedAt: execution.completedAt
      });
      
      // Emit workflow completed event
      const completeEvent = eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
        source: execution.id,
        workflowId: execution.workflow,
        executionId: execution.id,
        projectId: execution.params.projectId,
        result: result,
        duration: new Date(execution.completedAt) - new Date(execution.startedAt),
        completedAt: execution.completedAt
      });
      
      executions.addEvent(execution.id, completeEvent.id);
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date().toISOString();
      
      // Update execution record
      executions.update(execution.id, {
        status: 'failed',
        error: error.message,
        completedAt: execution.completedAt
      });
      
      // Emit workflow failed event
      const failEvent = eventBus.emit(eventTypes.WORKFLOW_FAILED, {
        source: execution.id,
        workflowId: execution.workflow,
        executionId: execution.id,
        projectId: execution.params.projectId,
        error: error.message,
        failedAt: execution.completedAt
      });
      
      executions.addEvent(execution.id, failEvent.id);
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

/**
 * Execute an orchestrator workflow with parallel stage support
 */
async function executeOrchestrator(workflow, params, meta) {
  const results = {
    orchestratorId: `orch-${Date.now()}`,
    workflow: meta.id,
    status: 'running',
    startedAt: new Date().toISOString(),
    stages: [],
    subWorkflowResults: []
  };
  
  try {
    // Check if workflow has stages with parallel execution
    for (const stage of meta.stages || []) {
      if (stage.type === 'parallel-fan-out') {
        // Execute sub-workflow in parallel for each item
        const items = params[stage.foreachKey] || [];
        const subWorkflow = workflows.getWorkflow(stage.subWorkflow);
        
        if (!subWorkflow) {
          throw new Error(`Sub-workflow ${stage.subWorkflow} not found`);
        }
        
        // Execute in parallel
        const promises = items.map(async (item) => {
          try {
            const result = await subWorkflow.run({ ...params, ...item });
            return { success: true, item, result };
          } catch (error) {
            return { success: false, item, error: error.message };
          }
        });
        
        const subResults = await Promise.all(promises);
        
        results.stages.push({
          id: stage.id,
          name: stage.name,
          type: stage.type,
          status: subResults.every(r => r.success) ? 'completed' : 'partial',
          subWorkflowResults: subResults
        });
        
        results.subWorkflowResults.push(...subResults);
      } else {
        // Regular stage - just execute the workflow normally
        const result = await workflow.run(params);
        results.stages.push({
          id: stage.id,
          name: stage.name,
          status: 'completed',
          result
        });
      }
    }
    
    // If no special stages, just run the workflow
    if (results.stages.length === 0) {
      const result = await workflow.run(params);
      results.stages.push({
        id: 'default',
        name: 'Execution',
        status: 'completed',
        result
      });
    }
    
    results.status = 'completed';
    results.completedAt = new Date().toISOString();
    
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
    results.completedAt = new Date().toISOString();
  }
  
  return results;
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
  getStats,
  executeOrchestrator  // Export for testing
};
