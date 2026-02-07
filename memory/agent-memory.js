/**
 * Agent Memory Store
 * Per-agent persistent memory for learning and context
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'database', 'memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'agent-memories.json');

// Ensure directory exists
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Memory structure per agent
function getEmptyAgentMemory() {
  return {
    shortTerm: [],      // Recent task context (last 10 tasks)
    longTerm: [],       // Persistent knowledge/facts
    preferences: {},    // Learned preferences
    mistakes: [],       // Learn from errors
    campaigns: []       // Campaign-specific learnings
  };
}

// Load all memories
function loadMemories() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[agent-memory] Load error:', err.message);
  }
  return {};
}

// Save all memories
function saveMemories(memories) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf8');
  } catch (err) {
    console.error('[agent-memory] Save error:', err.message);
  }
}

// Get or create agent memory
function getAgentMemory(agentId) {
  const memories = loadMemories();
  if (!memories[agentId]) {
    memories[agentId] = getEmptyAgentMemory();
    saveMemories(memories);
  }
  return memories[agentId];
}

/**
 * Store a memory for an agent
 */
function remember(agentId, type, data) {
  const memories = loadMemories();
  if (!memories[agentId]) {
    memories[agentId] = getEmptyAgentMemory();
  }
  
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'shortTerm':
      memories[agentId].shortTerm.push({
        ...data,
        timestamp
      });
      // Keep only last 10
      if (memories[agentId].shortTerm.length > 10) {
        memories[agentId].shortTerm = memories[agentId].shortTerm.slice(-10);
      }
      break;
      
    case 'longTerm':
      memories[agentId].longTerm.push({
        id: `fact-${Date.now()}`,
        ...data,
        timestamp
      });
      break;
      
    case 'preferences':
      if (data.key && data.value !== undefined) {
        memories[agentId].preferences[data.key] = {
          value: data.value,
          source: data.source || 'learned',
          timestamp
        };
      }
      break;
      
    case 'mistakes':
      memories[agentId].mistakes.push({
        ...data,
        timestamp
      });
      // Keep last 50 mistakes
      if (memories[agentId].mistakes.length > 50) {
        memories[agentId].mistakes = memories[agentId].mistakes.slice(-50);
      }
      break;
      
    case 'campaigns':
      memories[agentId].campaigns.push({
        ...data,
        timestamp
      });
      // Keep last 100 campaign learnings
      if (memories[agentId].campaigns.length > 100) {
        memories[agentId].campaigns = memories[agentId].campaigns.slice(-100);
      }
      break;
  }
  
  saveMemories(memories);
  return true;
}

/**
 * Recall memories for an agent
 */
function recall(agentId, query, limit = 10) {
  const memory = getAgentMemory(agentId);
  const results = [];
  
  const queryLower = query.toLowerCase();
  
  // Search short-term
  for (const m of memory.shortTerm) {
    if (JSON.stringify(m).toLowerCase().includes(queryLower)) {
      results.push({ type: 'shortTerm', ...m });
    }
  }
  
  // Search long-term
  for (const m of memory.longTerm) {
    if (JSON.stringify(m).toLowerCase().includes(queryLower)) {
      results.push({ type: 'longTerm', ...m });
    }
  }
  
  // Search campaigns
  for (const m of memory.campaigns) {
    if (JSON.stringify(m).toLowerCase().includes(queryLower)) {
      results.push({ type: 'campaign', ...m });
    }
  }
  
  return results.slice(0, limit);
}

/**
 * Get recent context
 */
function getRecentContext(agentId, n = 5) {
  const memory = getAgentMemory(agentId);
  return memory.shortTerm.slice(-n);
}

/**
 * Get campaign history
 */
function getCampaignHistory(agentId, campaignId) {
  const memory = getAgentMemory(agentId);
  return memory.campaigns.filter(c => c.campaignId === campaignId);
}

/**
 * Get preferences
 */
function getPreferences(agentId) {
  const memory = getAgentMemory(agentId);
  const prefs = {};
  for (const [key, val] of Object.entries(memory.preferences)) {
    prefs[key] = val.value;
  }
  return prefs;
}

/**
 * Get memory stats
 */
function getMemoryStats() {
  const memories = loadMemories();
  const stats = {
    totalAgents: Object.keys(memories).length,
    agents: {}
  };
  
  for (const [agentId, mem] of Object.entries(memories)) {
    stats.agents[agentId] = {
      shortTermCount: mem.shortTerm?.length || 0,
      longTermCount: mem.longTerm?.length || 0,
      preferencesCount: Object.keys(mem.preferences || {}).length,
      mistakesCount: mem.mistakes?.length || 0,
      campaignsCount: mem.campaigns?.length || 0
    };
  }
  
  return stats;
}

/**
 * Clear agent memory
 */
function clearMemory(agentId) {
  const memories = loadMemories();
  if (memories[agentId]) {
    memories[agentId] = getEmptyAgentMemory();
    saveMemories(memories);
  }
  return true;
}

module.exports = {
  remember,
  recall,
  getRecentContext,
  getCampaignHistory,
  getPreferences,
  getAgentMemory,
  getMemoryStats,
  clearMemory
};
