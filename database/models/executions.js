/**
 * Executions Model - Database-backed
 * Replaces database/executions.js with Knex queries
 */

const db = require('../db');

/**
 * Create a new execution
 */
async function create(executionData) {
  const id = executionData.id || `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const execution = {
    id,
    projectId: executionData.projectId || null,
    workflowId: executionData.workflowId,
    status: executionData.status || 'queued',
    params: JSON.stringify(executionData.params || {}),
    stages: JSON.stringify(executionData.stages || []),
    result: null,
    error: null,
    artifacts: JSON.stringify(executionData.artifacts || []),
    duration: executionData.duration || null,
    startedAt: null,
    completedAt: null,
    createdAt: now
  };
  
  await db('executions').insert(execution);
  
  return deserializeExecution(execution);
}

/**
 * Update an existing execution
 */
async function update(executionId, updates) {
  const existing = await get(executionId);
  
  if (!existing) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const updateData = { ...updates };
  
  // Serialize JSON fields if present
  if (updates.params !== undefined) {
    updateData.params = JSON.stringify(updates.params);
  }
  if (updates.stages !== undefined) {
    updateData.stages = JSON.stringify(updates.stages);
  }
  if (updates.result !== undefined) {
    updateData.result = JSON.stringify(updates.result);
  }
  if (updates.artifacts !== undefined) {
    updateData.artifacts = JSON.stringify(updates.artifacts);
  }
  
  // Don't allow changing id or createdAt
  delete updateData.id;
  delete updateData.createdAt;
  
  await db('executions').where({ id: executionId }).update(updateData);
  
  return get(executionId);
}

/**
 * Get an execution by ID
 */
async function get(executionId) {
  const execution = await db('executions')
    .where({ id: executionId })
    .first();
  
  return execution ? deserializeExecution(execution) : null;
}

/**
 * List all executions with optional filtering
 */
async function list(filter = {}) {
  let query = db('executions');
  
  // Filter by projectId
  if (filter.projectId) {
    query = query.where('projectId', filter.projectId);
  }
  
  // Filter by workflowId
  if (filter.workflowId) {
    query = query.where('workflowId', filter.workflowId);
  }
  
  // Filter by status
  if (filter.status) {
    query = query.where('status', filter.status);
  }
  
  // Filter by date range
  if (filter.since) {
    query = query.where('createdAt', '>=', new Date(filter.since).toISOString());
  }
  
  if (filter.until) {
    query = query.where('createdAt', '<=', new Date(filter.until).toISOString());
  }
  
  // Sort by most recent first
  query = query.orderBy('createdAt', 'desc');
  
  // Limit results
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  
  const executions = await query;
  return executions.map(deserializeExecution);
}

/**
 * Delete an execution
 */
async function deleteExecution(executionId) {
  const existing = await get(executionId);
  
  if (!existing) {
    return { success: false, error: 'Execution not found' };
  }
  
  await db('executions').where({ id: executionId }).del();
  
  return { success: true };
}

/**
 * Get executions by project
 */
async function getByProject(projectId, limit = 10) {
  return list({ projectId, limit });
}

/**
 * Get recent executions
 */
async function getRecent(limit = 10) {
  return list({ limit });
}

/**
 * Add a stage to an execution
 */
async function addStage(executionId, stage) {
  const execution = await get(executionId);
  
  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const stages = execution.stages || [];
  stages.push({
    id: stage.id,
    name: stage.name,
    status: stage.status || 'pending',
    agent: stage.agent || null,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null
  });
  
  await db('executions')
    .where({ id: executionId })
    .update({ stages: JSON.stringify(stages) });
  
  return get(executionId);
}

/**
 * Update a stage in an execution
 */
async function updateStage(executionId, stageId, updates) {
  const execution = await get(executionId);
  
  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const stages = execution.stages || [];
  const stage = stages.find(s => s.id === stageId);
  
  if (!stage) {
    throw new Error(`Stage ${stageId} not found in execution ${executionId}`);
  }
  
  Object.assign(stage, updates);
  
  await db('executions')
    .where({ id: executionId })
    .update({ stages: JSON.stringify(stages) });
  
  return get(executionId);
}

/**
 * Add an event to an execution
 * (Events are now linked via foreign key, but we keep this for backward compatibility)
 */
async function addEvent(executionId, eventId) {
  const execution = await get(executionId);
  
  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  // Event relationship is now managed via the events table
  // This function is kept for backward compatibility
  return execution;
}

/**
 * Add an artifact to an execution
 */
async function addArtifact(executionId, artifact) {
  const execution = await get(executionId);
  
  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }
  
  const artifacts = execution.artifacts || [];
  artifacts.push({
    type: artifact.type,
    url: artifact.url,
    name: artifact.name || artifact.type,
    createdAt: new Date().toISOString()
  });
  
  await db('executions')
    .where({ id: executionId })
    .update({ artifacts: JSON.stringify(artifacts) });
  
  return get(executionId);
}

/**
 * Get execution statistics
 */
async function getStats() {
  const executions = await list();
  
  return {
    total: executions.length,
    byStatus: executions.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {}),
    byWorkflow: executions.reduce((acc, e) => {
      acc[e.workflowId] = (acc[e.workflowId] || 0) + 1;
      return acc;
    }, {}),
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'running').length
  };
}

/**
 * Get recent executions for a workflow
 */
async function getRecentByWorkflow(workflowId, limit = 10) {
  return list({ workflowId, limit });
}

/**
 * Get recent executions for a project
 */
async function getRecentByProject(projectId, limit = 10) {
  return list({ projectId, limit });
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeExecution(execution) {
  return {
    ...execution,
    params: typeof execution.params === 'string' ? JSON.parse(execution.params) : execution.params,
    stages: typeof execution.stages === 'string' ? JSON.parse(execution.stages) : execution.stages,
    result: execution.result && typeof execution.result === 'string' ? JSON.parse(execution.result) : execution.result,
    artifacts: typeof execution.artifacts === 'string' ? JSON.parse(execution.artifacts) : execution.artifacts,
    events: [] // Events now come from events table via foreign key
  };
}

module.exports = {
  create,
  update,
  get,
  list,
  delete: deleteExecution,
  getByProject,
  getRecent,
  addStage,
  updateStage,
  addEvent,
  addArtifact,
  getStats,
  getRecentByWorkflow,
  getRecentByProject
};
