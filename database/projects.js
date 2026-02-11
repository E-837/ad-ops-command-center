/**
 * Projects Data Model
 * Unified project management for campaigns, ad ops projects, and infrastructure
 */

const { load, save } = require('./init');

const STORE_NAME = 'projects';

/**
 * Project schema:
 * {
 *   id: string,
 *   type: 'campaign' | 'dsp-onboarding' | 'jbp' | 'migration' | 'rfp' | 'infrastructure',
 *   name: string,
 *   status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled',
 *   owner: string,  // agent-id or user
 *   startDate: string (ISO),
 *   endDate: string (ISO),
 *   budget: number,
 *   platform: string,  // e.g., 'ttd', 'dv360', 'asana', 'multiple'
 *   metadata: object,  // type-specific metadata
 *   executions: string[],  // execution IDs
 *   asanaProjectId: string | null,
 *   campaigns: string[],  // campaign IDs if type is 'campaign'
 *   milestones: [ { name, status, date } ],
 *   artifacts: [ { type, url, createdAt } ],
 *   metrics: { completion, health, blockers },
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO)
 * }
 */

/**
 * Load all projects from storage
 */
function loadProjects() {
  return load(STORE_NAME, {});
}

/**
 * Save all projects to storage
 */
function saveProjects(projects) {
  return save(STORE_NAME, projects);
}

/**
 * Create a new project
 */
function create(projectData) {
  const projects = loadProjects();
  
  const id = projectData.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const project = {
    id,
    type: projectData.type || 'campaign',
    name: projectData.name,
    status: projectData.status || 'planning',
    owner: projectData.owner || 'system',
    startDate: projectData.startDate || null,
    endDate: projectData.endDate || null,
    budget: projectData.budget || null,
    platform: projectData.platform || null,
    metadata: projectData.metadata || {},
    executions: projectData.executions || [],
    asanaProjectId: projectData.asanaProjectId || null,
    campaigns: projectData.campaigns || [],
    milestones: projectData.milestones || [],
    artifacts: projectData.artifacts || [],
    metrics: projectData.metrics || {
      completion: 0,
      health: 'on-track',
      blockers: []
    },
    createdAt: now,
    updatedAt: now
  };
  
  projects[id] = project;
  saveProjects(projects);
  
  return project;
}

/**
 * Update an existing project
 */
function update(projectId, updates) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  const project = projects[projectId];
  
  // Update fields
  Object.assign(project, updates);
  project.updatedAt = new Date().toISOString();
  
  // Don't allow changing id, createdAt
  project.id = projectId;
  
  saveProjects(projects);
  
  return project;
}

/**
 * Get a project by ID
 */
function get(projectId) {
  const projects = loadProjects();
  return projects[projectId] || null;
}

/**
 * List all projects with optional filtering
 */
function list(filter = {}) {
  const projects = loadProjects();
  let projectList = Object.values(projects);
  
  // Filter by type
  if (filter.type) {
    projectList = projectList.filter(p => p.type === filter.type);
  }
  
  // Filter by status
  if (filter.status) {
    projectList = projectList.filter(p => p.status === filter.status);
  }
  
  // Filter by owner
  if (filter.owner) {
    projectList = projectList.filter(p => p.owner === filter.owner);
  }
  
  // Filter by platform
  if (filter.platform) {
    projectList = projectList.filter(p => p.platform === filter.platform);
  }
  
  // Filter by health
  if (filter.health) {
    projectList = projectList.filter(p => p.metrics?.health === filter.health);
  }
  
  // Sort by most recent first
  projectList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  // Limit results
  if (filter.limit) {
    projectList = projectList.slice(0, filter.limit);
  }
  
  return projectList;
}

/**
 * Delete a project
 */
function deleteProject(projectId) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    return { success: false, error: 'Project not found' };
  }
  
  delete projects[projectId];
  saveProjects(projects);
  
  return { success: true };
}

/**
 * Add an execution to a project
 */
function addExecution(projectId, executionId) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  if (!projects[projectId].executions.includes(executionId)) {
    projects[projectId].executions.push(executionId);
    projects[projectId].updatedAt = new Date().toISOString();
    saveProjects(projects);
  }
  
  return projects[projectId];
}

/**
 * Add a milestone to a project
 */
function addMilestone(projectId, milestone) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  projects[projectId].milestones.push({
    name: milestone.name,
    status: milestone.status || 'pending',
    date: milestone.date || null,
    createdAt: new Date().toISOString()
  });
  
  projects[projectId].updatedAt = new Date().toISOString();
  saveProjects(projects);
  
  return projects[projectId];
}

/**
 * Add an artifact to a project
 */
function addArtifact(projectId, artifact) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  projects[projectId].artifacts.push({
    type: artifact.type,
    url: artifact.url,
    name: artifact.name || artifact.type,
    createdAt: new Date().toISOString()
  });
  
  projects[projectId].updatedAt = new Date().toISOString();
  saveProjects(projects);
  
  return projects[projectId];
}

/**
 * Update project metrics
 */
function updateMetrics(projectId, metrics) {
  const projects = loadProjects();
  
  if (!projects[projectId]) {
    throw new Error(`Project ${projectId} not found`);
  }
  
  Object.assign(projects[projectId].metrics, metrics);
  projects[projectId].updatedAt = new Date().toISOString();
  saveProjects(projects);
  
  return projects[projectId];
}

/**
 * Get project statistics
 */
function getStats() {
  const projects = loadProjects();
  const projectList = Object.values(projects);
  
  return {
    total: projectList.length,
    byType: projectList.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {}),
    byStatus: projectList.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}),
    byHealth: projectList.reduce((acc, p) => {
      const health = p.metrics?.health || 'unknown';
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    }, {}),
    active: projectList.filter(p => p.status === 'active').length,
    atRisk: projectList.filter(p => p.metrics?.health === 'at-risk').length,
    blocked: projectList.filter(p => p.metrics?.health === 'blocked').length
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
