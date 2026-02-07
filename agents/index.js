/**
 * Agent Registry
 * Central registry for all Ad Ops Command agents
 */

const mediaPlanner = require('./media-planner');
const trader = require('./trader');
const analyst = require('./analyst');
const creativeOps = require('./creative-ops');
const compliance = require('./compliance');

const AGENTS = {
  'media-planner': mediaPlanner,
  'trader': trader,
  'analyst': analyst,
  'creative-ops': creativeOps,
  'compliance': compliance
};

/**
 * Get agent by ID
 */
function getAgent(agentId) {
  return AGENTS[agentId] || null;
}

/**
 * Get all agents
 */
function getAllAgents() {
  return Object.entries(AGENTS).map(([id, agent]) => ({
    id,
    ...agent.getInfo()
  }));
}

/**
 * Get agents by capability
 */
function getAgentsByCapability(capability) {
  return Object.entries(AGENTS)
    .filter(([id, agent]) => agent.capabilities?.includes(capability))
    .map(([id, agent]) => ({ id, ...agent.getInfo() }));
}

/**
 * Route query to appropriate agent
 */
function routeQuery(query) {
  const q = query.toLowerCase();
  
  // Media planning queries
  if (q.includes('budget') || q.includes('plan') || q.includes('strategy') || 
      q.includes('channel mix') || q.includes('allocation')) {
    return 'media-planner';
  }
  
  // Trading queries
  if (q.includes('bid') || q.includes('pacing') || q.includes('spend') || 
      q.includes('dsp') || q.includes('flight')) {
    return 'trader';
  }
  
  // Analysis queries
  if (q.includes('report') || q.includes('insight') || q.includes('performance') ||
      q.includes('trend') || q.includes('anomaly') || q.includes('wow') || q.includes('week over week')) {
    return 'analyst';
  }
  
  // Creative queries
  if (q.includes('creative') || q.includes('asset') || q.includes('spec') ||
      q.includes('rotation') || q.includes('format')) {
    return 'creative-ops';
  }
  
  // Compliance queries
  if (q.includes('brand safety') || q.includes('fraud') || q.includes('viewability') ||
      q.includes('ivt') || q.includes('compliance')) {
    return 'compliance';
  }
  
  // Default to analyst for general queries
  return 'analyst';
}

/**
 * Get agent status
 */
function getAgentStatus() {
  return Object.entries(AGENTS).map(([id, agent]) => ({
    id,
    name: agent.name,
    status: 'idle', // Would be dynamic in production
    lastActive: new Date().toISOString()
  }));
}

module.exports = {
  AGENTS,
  getAgent,
  getAllAgents,
  getAgentsByCapability,
  routeQuery,
  getAgentStatus
};
