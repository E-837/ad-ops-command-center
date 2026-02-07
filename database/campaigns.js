/**
 * Campaign Database Operations
 * CRUD operations for campaigns
 */

const { load, save } = require('./init');

const STORE_NAME = 'campaigns';

/**
 * Get all campaigns
 */
function getAll(filters = {}) {
  let campaigns = Object.entries(load(STORE_NAME, {}))
    .map(([id, campaign]) => ({ id, ...campaign }));
  
  // Apply filters
  if (filters.status) {
    campaigns = campaigns.filter(c => c.status === filters.status);
  }
  if (filters.dsp) {
    campaigns = campaigns.filter(c => c.dsp === filters.dsp);
  }
  if (filters.lob) {
    campaigns = campaigns.filter(c => c.lob === filters.lob);
  }
  if (filters.channel) {
    campaigns = campaigns.filter(c => c.channel === filters.channel);
  }
  if (filters.funnel) {
    campaigns = campaigns.filter(c => c.funnel === filters.funnel);
  }
  
  return campaigns;
}

/**
 * Get campaign by ID
 */
function getById(id) {
  const campaigns = load(STORE_NAME, {});
  return campaigns[id] ? { id, ...campaigns[id] } : null;
}

/**
 * Create campaign
 */
function create(campaignData) {
  const campaigns = load(STORE_NAME, {});
  const id = `camp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  campaigns[id] = {
    ...campaignData,
    status: campaignData.status || 'draft',
    spent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  save(STORE_NAME, campaigns);
  return { id, ...campaigns[id] };
}

/**
 * Update campaign
 */
function update(id, updates) {
  const campaigns = load(STORE_NAME, {});
  
  if (!campaigns[id]) {
    throw new Error(`Campaign not found: ${id}`);
  }
  
  campaigns[id] = {
    ...campaigns[id],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  save(STORE_NAME, campaigns);
  return { id, ...campaigns[id] };
}

/**
 * Delete campaign
 */
function remove(id) {
  const campaigns = load(STORE_NAME, {});
  
  if (!campaigns[id]) {
    throw new Error(`Campaign not found: ${id}`);
  }
  
  delete campaigns[id];
  save(STORE_NAME, campaigns);
  return true;
}

/**
 * Sync campaigns from connectors
 */
function syncFromConnectors(connectorCampaigns) {
  const campaigns = load(STORE_NAME, {});
  let added = 0, updated = 0;
  
  for (const campaign of connectorCampaigns) {
    const existing = campaigns[campaign.id];
    
    if (existing) {
      // Update existing
      campaigns[campaign.id] = {
        ...existing,
        ...campaign,
        updatedAt: new Date().toISOString()
      };
      updated++;
    } else {
      // Add new
      campaigns[campaign.id] = {
        ...campaign,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      added++;
    }
  }
  
  save(STORE_NAME, campaigns);
  return { added, updated, total: Object.keys(campaigns).length };
}

/**
 * Get campaign counts by dimension
 */
function getCounts() {
  const campaigns = getAll();
  
  return {
    total: campaigns.length,
    byStatus: groupBy(campaigns, 'status'),
    byDSP: groupBy(campaigns, 'dsp'),
    byLOB: groupBy(campaigns, 'lob'),
    byChannel: groupBy(campaigns, 'channel'),
    byFunnel: groupBy(campaigns, 'funnel')
  };
}

/**
 * Get campaigns with pacing issues
 */
function getPacingIssues() {
  const campaigns = getAll({ status: 'live' });
  const issues = [];
  
  for (const campaign of campaigns) {
    if (campaign.budget && campaign.spent && campaign.startDate && campaign.endDate) {
      const daysElapsed = Math.max(1, Math.floor(
        (new Date() - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24)
      ));
      const totalDays = Math.max(1, Math.floor(
        (new Date(campaign.endDate) - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24)
      ));
      const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
      const variance = ((campaign.spent - expectedSpend) / expectedSpend) * 100;
      
      if (Math.abs(variance) > 10) {
        issues.push({
          campaign,
          variance,
          status: variance < -20 ? 'critical_behind' :
                  variance < -10 ? 'behind' :
                  variance > 30 ? 'critical_ahead' :
                  variance > 10 ? 'ahead' : 'on_pace'
        });
      }
    }
  }
  
  return issues;
}

// Helper function
function groupBy(arr, key) {
  const result = {};
  for (const item of arr) {
    const val = item[key] || 'unknown';
    result[val] = (result[val] || 0) + 1;
  }
  return result;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  syncFromConnectors,
  getCounts,
  getPacingIssues
};
