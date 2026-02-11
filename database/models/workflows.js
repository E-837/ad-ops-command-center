/**
 * Workflows Model - NEW
 * Store workflow configurations in database
 */

const db = require('../db');

/**
 * Register or update a workflow
 */
async function register(workflowData) {
  const id = workflowData.id;
  const now = new Date().toISOString();
  
  // Check if workflow exists
  const existing = await get(id);
  
  const workflow = {
    id,
    name: workflowData.name,
    category: workflowData.category || null,
    version: workflowData.version || '1.0.0',
    config: JSON.stringify(workflowData.config || {}),
    enabled: workflowData.enabled !== undefined ? workflowData.enabled : true,
    description: workflowData.description || null,
    metadata: JSON.stringify(workflowData.metadata || {}),
    updatedAt: now
  };
  
  if (existing) {
    // Update existing workflow
    await db('workflows').where({ id }).update(workflow);
  } else {
    // Insert new workflow
    workflow.createdAt = now;
    await db('workflows').insert(workflow);
  }
  
  return get(id);
}

/**
 * Get a workflow by ID
 */
async function get(workflowId) {
  const workflow = await db('workflows')
    .where({ id: workflowId })
    .first();
  
  return workflow ? deserializeWorkflow(workflow) : null;
}

/**
 * List all workflows with optional filtering
 */
async function list(filter = {}) {
  let query = db('workflows');
  
  // Filter by category
  if (filter.category) {
    query = query.where('category', filter.category);
  }
  
  // Filter by enabled status
  if (filter.enabled !== undefined) {
    query = query.where('enabled', filter.enabled);
  }
  
  // Sort by name
  query = query.orderBy('name', 'asc');
  
  // Limit results
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  
  const workflows = await query;
  return workflows.map(deserializeWorkflow);
}

/**
 * Get workflows by category
 */
async function getByCategory(category) {
  return list({ category });
}

/**
 * Get all enabled workflows
 */
async function getAllEnabled() {
  return list({ enabled: true });
}

/**
 * Update workflow configuration
 */
async function updateConfig(workflowId, config) {
  const existing = await get(workflowId);
  
  if (!existing) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  
  await db('workflows')
    .where({ id: workflowId })
    .update({
      config: JSON.stringify(config),
      updatedAt: new Date().toISOString()
    });
  
  return get(workflowId);
}

/**
 * Enable/disable a workflow
 */
async function setEnabled(workflowId, enabled) {
  const existing = await get(workflowId);
  
  if (!existing) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  
  await db('workflows')
    .where({ id: workflowId })
    .update({
      enabled,
      updatedAt: new Date().toISOString()
    });
  
  return get(workflowId);
}

/**
 * Delete a workflow
 */
async function deleteWorkflow(workflowId) {
  const existing = await get(workflowId);
  
  if (!existing) {
    return { success: false, error: 'Workflow not found' };
  }
  
  await db('workflows').where({ id: workflowId }).del();
  
  return { success: true };
}

/**
 * Get workflow statistics
 */
async function getStats() {
  const workflows = await list();
  
  return {
    total: workflows.length,
    enabled: workflows.filter(w => w.enabled).length,
    disabled: workflows.filter(w => !w.enabled).length,
    byCategory: workflows.reduce((acc, w) => {
      const category = w.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {})
  };
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeWorkflow(workflow) {
  return {
    ...workflow,
    config: typeof workflow.config === 'string' ? JSON.parse(workflow.config) : workflow.config,
    metadata: typeof workflow.metadata === 'string' ? JSON.parse(workflow.metadata) : workflow.metadata,
    enabled: Boolean(workflow.enabled) // SQLite stores as 0/1
  };
}

module.exports = {
  register,
  get,
  list,
  getByCategory,
  getAllEnabled,
  updateConfig,
  setEnabled,
  delete: deleteWorkflow,
  getStats
};
