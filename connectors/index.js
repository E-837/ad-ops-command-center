/**
 * Connector Registry
 * Central hub for DSP integrations
 */

const ttd = require('./ttd');
const dv360 = require('./dv360');
const amazonDsp = require('./amazon-dsp');

const CONNECTORS = {
  ttd,
  dv360,
  'amazon-dsp': amazonDsp
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
 * Get connector status
 */
function getConnectorStatus() {
  return Object.entries(CONNECTORS).map(([id, connector]) => ({
    id,
    name: connector.name,
    status: connector.status || 'ready',
    lastSync: connector.lastSync || null
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
  
  for (const [id, connector] of Object.entries(CONNECTORS)) {
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
  
  for (const [id, connector] of Object.entries(CONNECTORS)) {
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
  const connector = CONNECTORS[dspId];
  if (!connector) {
    throw new Error(`Unknown DSP: ${dspId}`);
  }
  
  return connector.getMetrics(campaignId, dateRange);
}

module.exports = {
  CONNECTORS,
  getConnector,
  getAllConnectors,
  getConnectorStatus,
  fetchAllCampaigns,
  fetchAllPacing,
  getMetrics
};
