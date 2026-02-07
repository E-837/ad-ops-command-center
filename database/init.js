/**
 * Database Initialization
 * Sets up SQLite and ensures schema exists
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname);
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_DIR = path.join(__dirname, 'memory');

// Ensure directories exist
[DATA_DIR, MEMORY_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Simple JSON-based storage (fallback if SQLite not available)
const JSON_STORE = {};

function getStorePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function load(name, fallback = {}) {
  const filePath = getStorePath(name);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`[db] Load error for ${name}:`, err.message);
  }
  return fallback;
}

function save(name, data) {
  const filePath = getStorePath(name);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[db] Save error for ${name}:`, err.message);
    return false;
  }
}

/**
 * Initialize database
 */
function initialize() {
  console.log('[db] Initializing database...');
  
  // Initialize default data stores
  const stores = [
    'campaigns',
    'flights',
    'creatives',
    'agents',
    'activity',
    'workflows'
  ];
  
  for (const store of stores) {
    const current = load(store);
    if (Object.keys(current).length === 0) {
      save(store, store === 'activity' ? [] : {});
    }
  }
  
  // Seed initial data if empty
  const campaigns = load('campaigns', {});
  if (Object.keys(campaigns).length === 0) {
    seedInitialData();
  }
  
  console.log('[db] Database initialized');
  return true;
}

/**
 * Seed initial campaign data
 */
function seedInitialData() {
  // Import mock data from connectors
  const campaigns = {};
  
  // These will be populated on first connector sync
  save('campaigns', campaigns);
  
  // Initialize agents
  const agents = {
    'media-planner': {
      name: 'Media Planner',
      status: 'idle',
      lastActive: new Date().toISOString()
    },
    'trader': {
      name: 'Trader',
      status: 'idle',
      lastActive: new Date().toISOString()
    },
    'analyst': {
      name: 'Analyst',
      status: 'idle',
      lastActive: new Date().toISOString()
    },
    'creative-ops': {
      name: 'Creative Ops',
      status: 'idle',
      lastActive: new Date().toISOString()
    },
    'compliance': {
      name: 'Compliance',
      status: 'idle',
      lastActive: new Date().toISOString()
    }
  };
  save('agents', agents);
  
  console.log('[db] Seeded initial data');
}

/**
 * Get database stats
 */
function getStats() {
  return {
    campaigns: Object.keys(load('campaigns', {})).length,
    flights: Object.keys(load('flights', {})).length,
    creatives: Object.keys(load('creatives', {})).length,
    agents: Object.keys(load('agents', {})).length,
    activityCount: (load('activity', [])).length
  };
}

module.exports = {
  initialize,
  load,
  save,
  getStats,
  DATA_DIR,
  MEMORY_DIR
};
