/**
 * Workflow Registry (Backward Compatible Wrapper)
 * Maintains backward compatibility while using new registry system
 */

const registry = require('./registry');

// Import all existing workflows
const campaignLaunch = require('./campaign-launch');
const pacingCheck = require('./pacing-check');
const wowReport = require('./wow-report');
const optimization = require('./optimization');
const anomalyDetection = require('./anomaly-detection');
const searchCampaignWorkflow = require('./search-campaign-workflow');

// Import project workflows
const prdToAsana = require('./projects/prd-to-asana');
const projectStatus = require('./projects/project-status');

// Import new campaign ops workflows (Phase 2)
const creativeTest = require('./campaign-ops/creative-test');

// Import new reporting workflows (Phase 2)
const monthlyReport = require('./reporting/monthly-report');
const crossChannelReport = require('./reporting/cross-channel-report');

// Import orchestration workflows (Phase 2)
const mediaPlanExecute = require('./orchestration/media-plan-execute');
const crossChannelLaunch = require('./orchestration/cross-channel-launch');

// Register all workflows
registry.register('campaign-launch', campaignLaunch);
registry.register('pacing-check', pacingCheck);
registry.register('wow-report', wowReport);
registry.register('optimization', optimization);
registry.register('anomaly-detection', anomalyDetection);
registry.register('search-campaign-workflow', searchCampaignWorkflow);
registry.register('prd-to-asana', prdToAsana);
registry.register('project-status', projectStatus);

// Phase 2 workflows
registry.register('creative-test', creativeTest);
registry.register('monthly-report', monthlyReport);
registry.register('cross-channel-report', crossChannelReport);
registry.register('media-plan-execute', mediaPlanExecute);
registry.register('cross-channel-launch', crossChannelLaunch);

// Backward compatible WORKFLOWS map
const WORKFLOWS = {
  'campaign-launch': campaignLaunch,
  'pacing-check': pacingCheck,
  'wow-report': wowReport,
  'optimization': optimization,
  'anomaly-detection': anomalyDetection,
  'search-campaign-workflow': searchCampaignWorkflow,
  'prd-to-asana': prdToAsana,
  'project-status': projectStatus,
  // Phase 2
  'creative-test': creativeTest,
  'monthly-report': monthlyReport,
  'cross-channel-report': crossChannelReport,
  'media-plan-execute': mediaPlanExecute,
  'cross-channel-launch': crossChannelLaunch
};

/**
 * Get workflow by name (backward compatible)
 */
function getWorkflow(name) {
  return WORKFLOWS[name] || null;
}

/**
 * Get all workflows (backward compatible)
 */
function getAllWorkflows() {
  return Object.entries(WORKFLOWS).map(([name, workflow]) => ({
    name,
    ...(workflow.getInfo ? workflow.getInfo() : { name: workflow.name || name })
  }));
}

/**
 * Run a workflow (backward compatible)
 */
async function runWorkflow(name, params = {}) {
  const workflow = WORKFLOWS[name];
  if (!workflow) {
    throw new Error(`Unknown workflow: ${name}`);
  }
  
  return workflow.run(params);
}

/**
 * NEW: Get the registry instance for new functionality
 */
function getRegistry() {
  return registry;
}

module.exports = {
  // Backward compatible exports
  WORKFLOWS,
  getWorkflow,
  getAllWorkflows,
  runWorkflow,
  
  // New registry access
  registry,
  getRegistry
};
