/**
 * Projects Model - Database-backed
 * Replaces database/projects.js with Knex queries
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new project
 */
async function create(projectData) {
  const id = projectData.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const project = {
    id,
    name: projectData.name,
    type: projectData.type || 'campaign',
    status: projectData.status || 'planning',
    owner: projectData.owner || 'system',
    startDate: projectData.startDate || null,
    endDate: projectData.endDate || null,
    budget: projectData.budget || null,
    platform: projectData.platform || null,
    metadata: JSON.stringify(projectData.metadata || {}),
    asanaProjectId: projectData.asanaProjectId || null,
    milestones: JSON.stringify(projectData.milestones || []),
    artifacts: JSON.stringify(projectData.artifacts || []),
    metrics: JSON.stringify(projectData.metrics || {
      completion: 0,
      health: 'on-track',
      blockers: []
    }),
    createdAt: now,
    updatedAt: now
  };
  
  await db('projects').insert(project);
  
  // Return with parsed JSON fields
  return deserializeProject(project);
}

/**
 * Update an existing project
 */
async function update(projectId, updates) {
  const existing = await get(projectId);
  
  if (!existing) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Serialize JSON fields if present
  if (updates.metadata !== undefined) {
    updateData.metadata = JSON.stringify(updates.metadata);
  }
  if (updates.milestones !== undefined) {
    updateData.milestones = JSON.stringify(updates.milestones);
  }
  if (updates.artifacts !== undefined) {
    updateData.artifacts = JSON.stringify(updates.artifacts);
  }
  if (updates.metrics !== undefined) {
    updateData.metrics = JSON.stringify(updates.metrics);
  }
  
  // Don't allow changing id or createdAt
  delete updateData.id;
  delete updateData.createdAt;
  
  await db('projects').where({ id: projectId }).update(updateData);
  
  return get(projectId);
}

/**
 * Get a project by ID
 */
async function get(projectId) {
  const project = await db('projects')
    .where({ id: projectId })
    .whereNull('deletedAt')
    .first();
  
  return project ? deserializeProject(project) : null;
}

/**
 * List all projects with optional filtering
 */
async function list(filter = {}) {
  let query = db('projects').whereNull('deletedAt');
  
  // Filter by type
  if (filter.type) {
    query = query.where('type', filter.type);
  }
  
  // Filter by status
  if (filter.status) {
    query = query.where('status', filter.status);
  }
  
  // Filter by owner
  if (filter.owner) {
    query = query.where('owner', filter.owner);
  }
  
  // Filter by platform
  if (filter.platform) {
    query = query.where('platform', filter.platform);
  }
  
  // Filter by health (requires JSON query - simplified for SQLite)
  if (filter.health) {
    const projects = await query;
    return projects
      .map(deserializeProject)
      .filter(p => p.metrics?.health === filter.health)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, filter.limit || undefined);
  }
  
  // Sort by most recent first
  query = query.orderBy('updatedAt', 'desc');
  
  // Limit results
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  
  const projects = await query;
  return projects.map(deserializeProject);
}

/**
 * Delete a project (soft delete)
 */
async function deleteProject(projectId) {
  const existing = await get(projectId);
  
  if (!existing) {
    return { success: false, error: 'Project not found' };
  }
  
  await db('projects')
    .where({ id: projectId })
    .update({ deletedAt: new Date().toISOString() });
  
  return { success: true };
}

/**
 * Add an execution to a project
 * (Executions are now linked via foreign key, but we keep this for backward compatibility)
 */
async function addExecution(projectId, executionId) {
  const project = await get(projectId);
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  // Just update the timestamp to indicate activity
  await db('projects')
    .where({ id: projectId })
    .update({ updatedAt: new Date().toISOString() });
  
  return get(projectId);
}

/**
 * Add a milestone to a project
 */
async function addMilestone(projectId, milestone) {
  const project = await get(projectId);
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  const milestones = project.milestones || [];
  milestones.push({
    name: milestone.name,
    status: milestone.status || 'pending',
    date: milestone.date || null,
    createdAt: new Date().toISOString()
  });
  
  await db('projects')
    .where({ id: projectId })
    .update({
      milestones: JSON.stringify(milestones),
      updatedAt: new Date().toISOString()
    });
  
  return get(projectId);
}

/**
 * Add an artifact to a project
 */
async function addArtifact(projectId, artifact) {
  const project = await get(projectId);
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  const artifacts = project.artifacts || [];
  artifacts.push({
    type: artifact.type,
    url: artifact.url,
    name: artifact.name || artifact.type,
    createdAt: new Date().toISOString()
  });
  
  await db('projects')
    .where({ id: projectId })
    .update({
      artifacts: JSON.stringify(artifacts),
      updatedAt: new Date().toISOString()
    });
  
  return get(projectId);
}

/**
 * Update project metrics
 */
async function updateMetrics(projectId, metrics) {
  const project = await get(projectId);
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  const updatedMetrics = { ...project.metrics, ...metrics };
  
  await db('projects')
    .where({ id: projectId })
    .update({
      metrics: JSON.stringify(updatedMetrics),
      updatedAt: new Date().toISOString()
    });
  
  return get(projectId);
}

/**
 * Get project statistics
 */
async function getStats() {
  const projects = await list();
  
  return {
    total: projects.length,
    byType: projects.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {}),
    byStatus: projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}),
    byHealth: projects.reduce((acc, p) => {
      const health = p.metrics?.health || 'unknown';
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    }, {}),
    active: projects.filter(p => p.status === 'active').length,
    atRisk: projects.filter(p => p.metrics?.health === 'at-risk').length,
    blocked: projects.filter(p => p.metrics?.health === 'blocked').length
  };
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeProject(project) {
  return {
    ...project,
    metadata: typeof project.metadata === 'string' ? JSON.parse(project.metadata) : project.metadata,
    milestones: typeof project.milestones === 'string' ? JSON.parse(project.milestones) : project.milestones,
    artifacts: typeof project.artifacts === 'string' ? JSON.parse(project.artifacts) : project.artifacts,
    metrics: typeof project.metrics === 'string' ? JSON.parse(project.metrics) : project.metrics
  };
}

module.exports = {
  create,
  update,
  get,
  list,
  delete: deleteProject,
  addExecution,
  addMilestone,
  addArtifact,
  updateMetrics,
  getStats
};
