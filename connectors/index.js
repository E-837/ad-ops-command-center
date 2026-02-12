/**
 * Connector Registry
 * Central hub for DSP and productivity tool integrations
 */

const ttd = require('./ttd');
const dv360 = require('./dv360');
const amazonDsp = require('./amazon-dsp');
const googleAds = require('./google-ads');
const metaAds = require('./meta-ads');
const asana = require('./asana');
const notion = require('./notion');
const figma = require('./figma');
const canva = require('./canva');

// DSP Connectors
const DSP_CONNECTORS = {
  ttd,
  dv360,
  'amazon-dsp': amazonDsp,
  'google-ads': googleAds,
  'meta-ads': metaAds
};

// Productivity/Creative Tool Connectors
const PRODUCTIVITY_CONNECTORS = {
  asana,
  notion,
  figma,
  canva
};

// All connectors combined
const CONNECTORS = {
  ...DSP_CONNECTORS,
  ...PRODUCTIVITY_CONNECTORS
};

/**
 * Get connector by ID
 */
function getConnector(connectorId) {
  return CONNECTORS[connectorId] || null;
}

/**
 * Get all connectors
 */
function getAllConnectors() {
  return Object.entries(CONNECTORS).map(([id, connector]) => ({
    id,
    ...connector.getInfo()
  }));
}

/**
 * Get DSP connectors only
 */
function getDSPConnectors() {
  return Object.entries(DSP_CONNECTORS).map(([id, connector]) => ({
    id,
    ...connector.getInfo()
  }));
}

/**
 * Get productivity connectors only
 */
function getProductivityConnectors() {
  return Object.entries(PRODUCTIVITY_CONNECTORS).map(([id, connector]) => ({
    id,
    ...connector.getInfo()
  }));
}

/**
 * Get connector status
 */
function getConnectorStatus() {
  return Object.entries(CONNECTORS).map(([id, connector]) => ({
    id,
    name: connector.name,
    status: connector.status || 'ready',
    lastSync: connector.lastSync || null,
    category: DSP_CONNECTORS[id] ? 'dsp' : 'productivity'
  }));
}

/**
 * Fetch campaigns from all DSPs
 */
async function fetchAllCampaigns(options = {}) {
  const results = {
    campaigns: [],
    errors: []
  };
  
  for (const [id, connector] of Object.entries(DSP_CONNECTORS)) {
    try {
      const campaigns = await connector.getCampaigns(options);
      results.campaigns.push(...campaigns.map(c => ({ ...c, dsp: id })));
    } catch (err) {
      results.errors.push({ dsp: id, error: err.message });
    }
  }
  
  return results;
}

/**
 * Get pacing from all DSPs
 */
async function fetchAllPacing() {
  const results = {
    pacing: [],
    errors: []
  };
  
  for (const [id, connector] of Object.entries(DSP_CONNECTORS)) {
    try {
      const pacing = await connector.getPacing();
      results.pacing.push(...pacing.map(p => ({ ...p, dsp: id })));
    } catch (err) {
      results.errors.push({ dsp: id, error: err.message });
    }
  }
  
  return results;
}

/**
 * Get metrics from specific DSP
 */
async function getMetrics(dspId, campaignId, dateRange) {
  const connector = DSP_CONNECTORS[dspId];
  if (!connector) {
    throw new Error(`Unknown DSP: ${dspId}`);
  }
  
  return connector.getMetrics(campaignId, dateRange);
}

/**
 * Handle tool call for productivity connectors
 * Routes to the appropriate connector's handleToolCall
 */
async function handleProductivityToolCall(connectorId, toolName, params) {
  const connector = PRODUCTIVITY_CONNECTORS[connectorId];
  if (!connector) {
    throw new Error(`Unknown productivity connector: ${connectorId}`);
  }
  
  if (!connector.handleToolCall) {
    throw new Error(`Connector ${connectorId} does not support tool calls`);
  }
  
  return connector.handleToolCall(toolName, params);
}

/**
 * Get all available tools from productivity connectors
 */
function getProductivityTools() {
  const tools = [];
  
  for (const [connectorId, connector] of Object.entries(PRODUCTIVITY_CONNECTORS)) {
    if (connector.tools) {
      tools.push(...connector.tools.map(t => ({
        ...t,
        connector: connectorId
      })));
    }
  }
  
  return tools;
}

module.exports = {
  CONNECTORS,
  DSP_CONNECTORS,
  PRODUCTIVITY_CONNECTORS,
  getConnector,
  getAllConnectors,
  getDSPConnectors,
  getProductivityConnectors,
  getConnectorStatus,
  fetchAllCampaigns,
  fetchAllPacing,
  getMetrics,
  handleProductivityToolCall,
  getProductivityTools
};
