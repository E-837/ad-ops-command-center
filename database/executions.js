/**
 * Executions Data Model
 * Workflow execution records with stage tracking
 */

const { load, save } = require('./init');

const STORE_NAME = 'executions';

/**
 * Execution schema:
 * {
 *   id: string,
 *   projectId: string | null,
 *   workflowId: string,
 *   status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
 *   params: object,
 *   stages: [ { id, name, status, agent, startedAt, completedAt, result, error } ],
 *   result: object | null,
 *   error: string | null,
 *   artifacts: [ { type, url, name } ],
 *   events: string[],  // event IDs
 *   startedAt: string (ISO) | null,
 *   completedAt: string (ISO) | null,
 *   createdAt: string (ISO)
 * }
 */

/**
 * Load all executions from storage
 */
function loadExecutions() {
  return load(STORE_NAME, {});
}

/**
 * Save all executions to storage
 */
function saveExecutions(executions) {
  return save(STORE_NAME, executions);
}

/**
 * Create a new execution
 */
function create(executionData) {
  const executions = loadExecutions();
  
  const id = executionData.id || `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const execution = {
    id,
    projectId: executionData.projectId || null,
    workflowId: executionData.workflowId,
    status: executionData.status || 'queued',
    params: executionData.params || {},
    stages: executionData.stages || [],
    result: null,
    error: null,
    artifacts: executionData.artifacts || [],
    events: executionData.events || [],
    startedAt: null,
    completedAt: null,
    createdAt: now
  };
  
  executions[id] = execution;
  saveExecutions(executions);
  
  return execution;
}

/**
 * Update an existing execution
 */
function update(executionId, updates) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const execution = executions[executionId];
  
  // Update fields
  Object.assign(execution, updates);
  
  // Don't allow changing id, createdAt
  execution.id = executionId;
  
  saveExecutions(executions);
  
  return execution;
}

/**
 * Get an execution by ID
 */
function get(executionId) {
  const executions = loadExecutions();
  return executions[executionId] || null;
}

/**
 * List all executions with optional filtering
 */
function list(filter = {}) {
  const executions = loadExecutions();
  let executionList = Object.values(executions);
  
  // Filter by projectId
  if (filter.projectId) {
    executionList = executionList.filter(e => e.projectId === filter.projectId);
  }
  
  // Filter by workflowId
  if (filter.workflowId) {
    executionList = executionList.filter(e => e.workflowId === filter.workflowId);
  }
  
  // Filter by status
  if (filter.status) {
    executionList = executionList.filter(e => e.status === filter.status);
  }
  
  // Filter by date range
  if (filter.since) {
    const since = new Date(filter.since);
    executionList = executionList.filter(e => new Date(e.createdAt) >= since);
  }
  
  if (filter.until) {
    const until = new Date(filter.until);
    executionList = executionList.filter(e => new Date(e.createdAt) <= until);
  }
  
  // Sort by most recent first
  executionList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Limit results
  if (filter.limit) {
    executionList = executionList.slice(0, filter.limit);
  }
  
  return executionList;
}

/**
 * Delete an execution
 */
function deleteExecution(executionId) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    return { success: false, error: 'Execution not found' };
  }
  
  delete executions[executionId];
  saveExecutions(executions);
  
  return { success: true };
}

/**
 * Add a stage to an execution
 */
function addStage(executionId, stage) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  executions[executionId].stages.push({
    id: stage.id,
    name: stage.name,
    status: stage.status || 'pending',
    agent: stage.agent || null,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null
  });
  
  saveExecutions(executions);
  
  return executions[executionId];
}

/**
 * Update a stage in an execution
 */
function updateStage(executionId, stageId, updates) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const stage = executions[executionId].stages.find(s => s.id === stageId);
  
  if (!stage) {
    throw new Error(`Stage ${stageId} not found in execution ${executionId}`);
  }
  
  Object.assign(stage, updates);
  saveExecutions(executions);
  
  return executions[executionId];
}

/**
 * Add an event to an execution
 */
function addEvent(executionId, eventId) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  if (!executions[executionId].events.includes(eventId)) {
    executions[executionId].events.push(eventId);
    saveExecutions(executions);
  }
  
  return executions[executionId];
}

/**
 * Add an artifact to an execution
 */
function addArtifact(executionId, artifact) {
  const executions = loadExecutions();
  
  if (!executions[executionId]) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  executions[executionId].artifacts.push({
    type: artifact.type,
    url: artifact.url,
    name: artifact.name || artifact.type,
    createdAt: new Date().toISOString()
  });
  
  saveExecutions(executions);
  
  return executions[executionId];
}

/**
 * Get execution statistics
 */
function getStats() {
  const executions = loadExecutions();
  const executionList = Object.values(executions);
  
  return {
    total: executionList.length,
    byStatus: executionList.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {}),
    byWorkflow: executionList.reduce((acc, e) => {
      acc[e.workflowId] = (acc[e.workflowId] || 0) + 1;
      return acc;
    }, {}),
    completed: executionList.filter(e => e.status === 'completed').length,
    failed: executionList.filter(e => e.status === 'failed').length,
    running: executionList.filter(e => e.status === 'running').length
  };
}

/**
 * Get recent executions for a workflow
 */
function getRecentByWorkflow(workflowId, limit = 10) {
  return list({ workflowId, limit });
}

/**
 * Get recent executions for a project
 */
function getRecentByProject(projectId, limit = 10) {
  return list({ projectId, limit });
}

module.exports = {
  create,
  update,
  get,
  list,
  delete: deleteExecution,
  addStage,
  updateStage,
  addEvent,
  addArtifact,
  getStats,
  getRecentByWorkflow,
  getRecentByProject
};
