/**
 * DV360 Connector
 * Integration with Display & Video 360 API
 */

const name = 'Display & Video 360';
const shortName = 'DV360';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Mock data for demo
const MOCK_CAMPAIGNS = [
  {
    id: 'dv360-camp-001',
    name: 'Galaxy S25 YouTube Masthead',
    advertiserId: 'adv-samsung-dv360',
    status: 'live',
    budget: 250000,
    spent: 125000,
    startDate: '2026-01-10',
    endDate: '2026-02-14',
    channel: 'olv',
    funnel: 'awareness',
    lob: 'mobile'
  },
  {
    id: 'dv360-camp-002',
    name: 'Demand Gen - Wearables Q1',
    advertiserId: 'adv-samsung-dv360',
    status: 'live',
    budget: 100000,
    spent: 45000,
    startDate: '2026-01-15',
    endDate: '2026-03-31',
    channel: 'demand-gen',
    funnel: 'consideration',
    lob: 'wearables'
  },
  {
    id: 'dv360-camp-003',
    name: 'Education Display - Back to School',
    advertiserId: 'adv-samsung-dv360',
    status: 'scheduled',
    budget: 75000,
    spent: 0,
    startDate: '2026-02-15',
    endDate: '2026-04-30',
    channel: 'display',
    funnel: 'conversion',
    lob: 'education'
  },
  {
    id: 'dv360-camp-004',
    name: 'CTV Home Appliances',
    advertiserId: 'adv-samsung-dv360',
    status: 'live',
    budget: 180000,
    spent: 72000,
    startDate: '2026-01-01',
    endDate: '2026-03-15',
    channel: 'ctv',
    funnel: 'awareness',
    lob: 'home'
  }
];

const MOCK_METRICS = {
  'dv360-camp-001': {
    impressions: 12000000,
    clicks: 48000,
    conversions: 320,
    ctr: 0.40,
    cpm: 10.42,
    vcr: 92,
    viewability: 88,
    youtubeViews: 8500000
  },
  'dv360-camp-002': {
    impressions: 3500000,
    clicks: 52500,
    conversions: 875,
    ctr: 1.50,
    cpm: 12.86,
    viewability: 82
  },
  'dv360-camp-003': {
    impressions: 0,
    clicks: 0,
    conversions: 0
  },
  'dv360-camp-004': {
    impressions: 2400000,
    clicks: 4800,
    conversions: 96,
    ctr: 0.20,
    cpm: 30.00,
    vcr: 95,
    viewability: 96
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
    features: ['YouTube Access', 'Demand Gen', 'Google Audiences', 'CM360 Integration'],
    channels: ['display', 'olv', 'ctv', 'audio', 'demand-gen'],
    minBudget: 5000
  };
}

/**
 * Get campaigns
 */
async function getCampaigns(options = {}) {
  await simulateLatency();
  
  let campaigns = [...MOCK_CAMPAIGNS];
  
  if (options.status) {
    campaigns = campaigns.filter(c => c.status === options.status);
  }
  
  if (options.lob) {
    campaigns = campaigns.filter(c => c.lob === options.lob);
  }
  
  if (options.channel) {
    campaigns = campaigns.filter(c => c.channel === options.channel);
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
 * Get YouTube-specific metrics
 */
async function getYouTubeMetrics(campaignId) {
  await simulateLatency();
  
  const metrics = MOCK_METRICS[campaignId];
  if (!metrics?.youtubeViews) {
    return null;
  }
  
  return {
    campaignId,
    views: metrics.youtubeViews,
    vcr: metrics.vcr,
    earnedViews: Math.round(metrics.youtubeViews * 0.15),
    avgViewDuration: '0:18'
  };
}

/**
 * Create campaign (mock)
 */
async function createCampaign(campaignData) {
  await simulateLatency();
  
  const newCampaign = {
    id: `dv360-camp-${Date.now()}`,
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
 * Get Demand Gen campaigns
 */
async function getDemandGenCampaigns() {
  await simulateLatency();
  return MOCK_CAMPAIGNS.filter(c => c.channel === 'demand-gen');
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
  getYouTubeMetrics,
  createCampaign,
  updateCampaign,
  getDemandGenCampaigns
};
