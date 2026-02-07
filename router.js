/**
 * Agent Router
 * Routes queries and tasks to appropriate agents
 */

const agents = require('./agents');

// Query routing patterns
const ROUTING_PATTERNS = [
  // Media Planner patterns
  {
    agent: 'media-planner',
    patterns: [
      /budget/i,
      /plan/i,
      /strategy/i,
      /channel mix/i,
      /allocat/i,
      /forecast/i,
      /recommend.*channel/i,
      /how.*spend/i,
      /media.*plan/i
    ]
  },
  // Trader patterns
  {
    agent: 'trader',
    patterns: [
      /pacing/i,
      /bid/i,
      /spend/i,
      /dsp/i,
      /flight/i,
      /activat/i,
      /behind/i,
      /ahead/i,
      /adjust/i,
      /ttd|dv360|amazon/i
    ]
  },
  // Analyst patterns
  {
    agent: 'analyst',
    patterns: [
      /report/i,
      /insight/i,
      /performance/i,
      /trend/i,
      /anomal/i,
      /wow|week.?over.?week/i,
      /benchmark/i,
      /analyz/i,
      /metric/i,
      /ctr|cpm|cpa|roas/i
    ]
  },
  // Creative Ops patterns
  {
    agent: 'creative-ops',
    patterns: [
      /creative/i,
      /asset/i,
      /spec/i,
      /rotation/i,
      /format/i,
      /banner/i,
      /video.*ad/i,
      /dimension/i,
      /file.*size/i
    ]
  },
  // Compliance patterns
  {
    agent: 'compliance',
    patterns: [
      /brand.?safety/i,
      /fraud/i,
      /viewability/i,
      /ivt/i,
      /compliance/i,
      /block/i,
      /safe/i,
      /quality/i,
      /invalid.?traffic/i
    ]
  }
];

/**
 * Route a query to the appropriate agent
 */
function routeQuery(query) {
  if (!query) return 'analyst'; // Default
  
  // Check each pattern group
  for (const { agent, patterns } of ROUTING_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return agent;
      }
    }
  }
  
  // Default to analyst for general queries
  return 'analyst';
}

/**
 * Get all routing rules (for debugging)
 */
function getRoutingRules() {
  return ROUTING_PATTERNS.map(({ agent, patterns }) => ({
    agent,
    patternCount: patterns.length,
    examples: patterns.slice(0, 3).map(p => p.source)
  }));
}

/**
 * Route a task to agent(s)
 */
function routeTask(task) {
  const result = {
    primary: null,
    secondary: [],
    reason: ''
  };
  
  // Task type routing
  if (task.type === 'campaign-launch') {
    result.primary = 'media-planner';
    result.secondary = ['trader', 'creative-ops', 'compliance'];
    result.reason = 'Campaign launch requires planning coordination';
  } else if (task.type === 'pacing-check') {
    result.primary = 'trader';
    result.reason = 'Pacing is trader responsibility';
  } else if (task.type === 'report') {
    result.primary = 'analyst';
    result.reason = 'Reporting is analyst responsibility';
  } else if (task.type === 'creative-review') {
    result.primary = 'creative-ops';
    result.secondary = ['compliance'];
    result.reason = 'Creative review with compliance check';
  } else if (task.type === 'optimization') {
    result.primary = 'trader';
    result.secondary = ['analyst'];
    result.reason = 'Optimization with analysis support';
  } else {
    // Use text-based routing
    const text = [task.title, task.description, ...(task.tags || [])].join(' ');
    result.primary = routeQuery(text);
    result.reason = 'Routed based on task content';
  }
  
  return result;
}

/**
 * Get agent for workflow stage
 */
function getAgentForStage(stageName) {
  const stageAgents = {
    planning: 'media-planner',
    plan: 'media-planner',
    strategy: 'media-planner',
    creation: 'trader',
    create: 'trader',
    activation: 'trader',
    creative: 'creative-ops',
    assets: 'creative-ops',
    verification: 'compliance',
    verify: 'compliance',
    approval: 'trader',
    approve: 'trader',
    analysis: 'analyst',
    report: 'analyst'
  };
  
  return stageAgents[stageName.toLowerCase()] || 'analyst';
}

module.exports = {
  routeQuery,
  getRoutingRules,
  routeTask,
  getAgentForStage
};
