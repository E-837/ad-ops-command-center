/**
 * Shared Memory Store
 * Cross-agent knowledge and context
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'database', 'memory');
const SHARED_FILE = path.join(MEMORY_DIR, 'shared-memory.json');

// Ensure directory exists
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function loadShared() {
  try {
    if (fs.existsSync(SHARED_FILE)) {
      return JSON.parse(fs.readFileSync(SHARED_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[shared-memory] Load error:', err.message);
  }
  return {
    facts: [],
    context: {},
    alerts: [],
    recentActions: []
  };
}

function saveShared(data) {
  try {
    fs.writeFileSync(SHARED_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[shared-memory] Save error:', err.message);
  }
}

/**
 * Add a shared fact
 */
function addFact(fact, source, category = 'general') {
  const shared = loadShared();
  
  shared.facts.push({
    id: `fact-${Date.now()}`,
    fact,
    source,
    category,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 200 facts
  if (shared.facts.length > 200) {
    shared.facts = shared.facts.slice(-200);
  }
  
  saveShared(shared);
  return true;
}

/**
 * Get facts by category
 */
function getFacts(category = null) {
  const shared = loadShared();
  
  if (category) {
    return shared.facts.filter(f => f.category === category);
  }
  
  return shared.facts;
}

/**
 * Set context value
 */
function setContext(key, value, ttlMinutes = null) {
  const shared = loadShared();
  
  shared.context[key] = {
    value,
    setAt: new Date().toISOString(),
    expiresAt: ttlMinutes ? 
      new Date(Date.now() + ttlMinutes * 60000).toISOString() : null
  };
  
  saveShared(shared);
  return true;
}

/**
 * Get context value
 */
function getContext(key) {
  const shared = loadShared();
  const ctx = shared.context[key];
  
  if (!ctx) return null;
  
  // Check expiry
  if (ctx.expiresAt && new Date(ctx.expiresAt) < new Date()) {
    delete shared.context[key];
    saveShared(shared);
    return null;
  }
  
  return ctx.value;
}

/**
 * Add alert for all agents
 */
function addAlert(alert) {
  const shared = loadShared();
  
  shared.alerts.push({
    id: `alert-${Date.now()}`,
    ...alert,
    acknowledged: false,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 50 alerts
  if (shared.alerts.length > 50) {
    shared.alerts = shared.alerts.slice(-50);
  }
  
  saveShared(shared);
  return true;
}

/**
 * Get active alerts
 */
function getActiveAlerts() {
  const shared = loadShared();
  return shared.alerts.filter(a => !a.acknowledged);
}

/**
 * Acknowledge alert
 */
function acknowledgeAlert(alertId, agentId) {
  const shared = loadShared();
  const alert = shared.alerts.find(a => a.id === alertId);
  
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = agentId;
    alert.acknowledgedAt = new Date().toISOString();
    saveShared(shared);
    return true;
  }
  
  return false;
}

/**
 * Log an action (for cross-agent awareness)
 */
function logAction(agentId, action, details) {
  const shared = loadShared();
  
  shared.recentActions.push({
    agentId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 100 actions
  if (shared.recentActions.length > 100) {
    shared.recentActions = shared.recentActions.slice(-100);
  }
  
  saveShared(shared);
  return true;
}

/**
 * Get recent actions
 */
function getRecentActions(limit = 20, agentId = null) {
  const shared = loadShared();
  let actions = shared.recentActions;
  
  if (agentId) {
    actions = actions.filter(a => a.agentId === agentId);
  }
  
  return actions.slice(-limit);
}

/**
 * Get all shared memory
 */
function getAll() {
  return loadShared();
}

module.exports = {
  addFact,
  getFacts,
  setContext,
  getContext,
  addAlert,
  getActiveAlerts,
  acknowledgeAlert,
  logAction,
  getRecentActions,
  getAll
};
