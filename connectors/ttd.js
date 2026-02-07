/**
 * The Trade Desk Connector
 * Integration with TTD API for campaign management
 */

const name = 'The Trade Desk';
const shortName = 'TTD';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Mock data for demo (would connect to real API in production)
const MOCK_CAMPAIGNS = [
  {
    id: 'ttd-camp-001',
    name: 'Galaxy S25 Launch - Awareness',
    advertiserId: 'adv-samsung-001',
    status: 'live',
    budget: 150000,
    spent: 67500,
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    channel: 'ctv',
    funnel: 'awareness',
    lob: 'mobile'
  },
  {
    id: 'ttd-camp-002',
    name: 'Galaxy Watch 7 - Consideration',
    advertiserId: 'adv-samsung-001',
    status: 'live',
    budget: 75000,
    spent: 28000,
    startDate: '2026-01-20',
    endDate: '2026-03-15',
    channel: 'olv',
    funnel: 'consideration',
    lob: 'wearables'
  },
  {
    id: 'ttd-camp-003',
    name: 'Home Appliances Q1 - Display',
    advertiserId: 'adv-samsung-001',
    status: 'paused',
    budget: 50000,
    spent: 12500,
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    channel: 'display',
    funnel: 'conversion',
    lob: 'home'
  }
];

const MOCK_METRICS = {
  'ttd-camp-001': {
    impressions: 4500000,
    clicks: 9000,
    conversions: 150,
    ctr: 0.20,
    cpm: 15.00,
    vcr: 85,
    viewability: 92
  },
  'ttd-camp-002': {
    impressions: 1800000,
    clicks: 5400,
    conversions: 90,
    ctr: 0.30,
    cpm: 15.56,
    vcr: 78,
    viewability: 75
  },
  'ttd-camp-003': {
    impressions: 2500000,
    clicks: 2500,
    conversions: 125,
    ctr: 0.10,
    cpm: 5.00,
    viewability: 68
  }
};

/**
 * Get connector info
 */
function getInfo() {
  return {
    name,
    shortName,
    version,
    status,
    lastSync,
    features: ['Unified ID 2.0', 'Koa AI', 'Cross-device', 'Premium Inventory'],
    channels: ['display', 'olv', 'ctv', 'audio'],
    minBudget: 10000
  };
}

/**
 * Get campaigns
 */
async function getCampaigns(options = {}) {
  // Simulate API call
  await simulateLatency();
  
  let campaigns = [...MOCK_CAMPAIGNS];
  
  if (options.status) {
    campaigns = campaigns.filter(c => c.status === options.status);
  }
  
  if (options.lob) {
    campaigns = campaigns.filter(c => c.lob === options.lob);
  }
  
  lastSync = new Date().toISOString();
  return campaigns;
}

/**
 * Get campaign by ID
 */
async function getCampaign(campaignId) {
  await simulateLatency();
  return MOCK_CAMPAIGNS.find(c => c.id === campaignId) || null;
}

/**
 * Get pacing status
 */
async function getPacing() {
  await simulateLatency();
  
  return MOCK_CAMPAIGNS.filter(c => c.status === 'live').map(campaign => {
    const daysElapsed = getDaysElapsed(campaign.startDate);
    const totalDays = getTotalDays(campaign.startDate, campaign.endDate);
    const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
    const variance = ((campaign.spent - expectedSpend) / expectedSpend) * 100;
    
    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      budget: campaign.budget,
      spent: campaign.spent,
      remaining: campaign.budget - campaign.spent,
      expectedSpend: Math.round(expectedSpend),
      variance: variance.toFixed(1),
      status: getPackingStatus(variance),
      daysRemaining: totalDays - daysElapsed
    };
  });
}

/**
 * Get metrics for campaign
 */
async function getMetrics(campaignId, dateRange = {}) {
  await simulateLatency();
  
  const metrics = MOCK_METRICS[campaignId];
  if (!metrics) {
    throw new Error(`No metrics found for campaign ${campaignId}`);
  }
  
  return {
    campaignId,
    dateRange,
    metrics
  };
}

/**
 * Create campaign (mock)
 */
async function createCampaign(campaignData) {
  await simulateLatency();
  
  const newCampaign = {
    id: `ttd-camp-${Date.now()}`,
    ...campaignData,
    status: 'draft',
    spent: 0
  };
  
  MOCK_CAMPAIGNS.push(newCampaign);
  return newCampaign;
}

/**
 * Update campaign (mock)
 */
async function updateCampaign(campaignId, updates) {
  await simulateLatency();
  
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }
  
  Object.assign(campaign, updates);
  return campaign;
}

/**
 * Adjust bid (mock)
 */
async function adjustBid(campaignId, bidChange) {
  await simulateLatency();
  
  return {
    campaignId,
    bidChange,
    applied: true,
    timestamp: new Date().toISOString()
  };
}

// Helper functions
function simulateLatency() {
  return new Promise(resolve => setTimeout(resolve, 100));
}

function getDaysElapsed(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function getTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function getPackingStatus(variance) {
  if (variance < -20) return 'critical_behind';
  if (variance < -10) return 'behind';
  if (variance > 30) return 'critical_ahead';
  if (variance > 15) return 'ahead';
  return 'on_pace';
}

module.exports = {
  name,
  shortName,
  version,
  status,
  lastSync,
  getInfo,
  getCampaigns,
  getCampaign,
  getPacing,
  getMetrics,
  createCampaign,
  updateCampaign,
  adjustBid
};
