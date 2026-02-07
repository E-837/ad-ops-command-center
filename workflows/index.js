/**
 * Workflow Registry
 * Central registry for ad ops workflows
 */

const campaignLaunch = require('./campaign-launch');
const pacingCheck = require('./pacing-check');
const wowReport = require('./wow-report');
const optimization = require('./optimization');
const anomalyDetection = require('./anomaly-detection');

const WORKFLOWS = {
  'campaign-launch': campaignLaunch,
  'pacing-check': pacingCheck,
  'wow-report': wowReport,
  'optimization': optimization,
  'anomaly-detection': anomalyDetection
};

/**
 * Get workflow by name
 */
function getWorkflow(name) {
  return WORKFLOWS[name] || null;
}

/**
 * Get all workflows
 */
function getAllWorkflows() {
  return Object.entries(WORKFLOWS).map(([name, workflow]) => ({
    name,
    ...workflow.getInfo()
  }));
}

/**
 * Run a workflow
 */
async function runWorkflow(name, params = {}) {
  const workflow = WORKFLOWS[name];
  if (!workflow) {
    throw new Error(`Unknown workflow: ${name}`);
  }
  
  return workflow.run(params);
}

module.exports = {
  WORKFLOWS,
  getWorkflow,
  getAllWorkflows,
  runWorkflow
};
