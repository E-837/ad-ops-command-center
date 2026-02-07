/**
 * Amazon DSP Connector
 * Integration with Amazon Advertising API
 */

const name = 'Amazon DSP';
const shortName = 'Amazon';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Mock data for demo
const MOCK_CAMPAIGNS = [
  {
    id: 'amzn-camp-001',
    name: 'Galaxy S25 - Amazon Purchase Intent',
    advertiserId: 'adv-samsung-amzn',
    status: 'live',
    budget: 200000,
    spent: 95000,
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    channel: 'display',
    funnel: 'conversion',
    lob: 'mobile'
  },
  {
    id: 'amzn-camp-002',
    name: 'Home Appliances - Sponsored Display',
    advertiserId: 'adv-samsung-amzn',
    status: 'live',
    budget: 120000,
    spent: 48000,
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    channel: 'display',
    funnel: 'conversion',
    lob: 'home'
  },
  {
    id: 'amzn-camp-003',
    name: 'Twitch - Gaming Monitors OLV',
    advertiserId: 'adv-samsung-amzn',
    status: 'live',
    budget: 80000,
    spent: 32000,
    startDate: '2026-01-20',
    endDate: '2026-03-15',
    channel: 'olv',
    funnel: 'awareness',
    lob: 'business'
  }
];

const MOCK_METRICS = {
  'amzn-camp-001': {
    impressions: 8500000,
    clicks: 42500,
    conversions: 1200,
    ctr: 0.50,
    cpm: 11.18,
    dpvr: 2.5, // Detail Page View Rate
    atc: 850,  // Add to Cart
    purchases: 320,
    roas: 4.2,
    viewability: 72
  },
  'amzn-camp-002': {
    impressions: 5000000,
    clicks: 15000,
    conversions: 450,
    ctr: 0.30,
    cpm: 9.60,
    dpvr: 1.8,
    atc: 380,
    purchases: 180,
    roas: 3.5,
    viewability: 68
  },
  'amzn-camp-003': {
    impressions: 2000000,
    clicks: 8000,
    conversions: 120,
    ctr: 0.40,
    cpm: 16.00,
    vcr: 82,
    viewability: 78,
    twitchViews: 1500000
  }
};

// Amazon-specific audience segments
const AUDIENCE_SEGMENTS = {
  inMarket: [
    'In-Market: Consumer Electronics',
    'In-Market: Smartphones',
    'In-Market: Smart Home',
    'In-Market: Wearable Technology'
  ],
  lifestyle: [
    'Lifestyle: Tech Enthusiasts',
    'Lifestyle: Early Adopters',
    'Lifestyle: Premium Shoppers'
  ],
  purchase: [
    'Past Purchasers: Samsung',
    'Past Purchasers: Consumer Electronics',
    'Cart Abandoners: Electronics'
  ]
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
    features: ['Amazon Audiences', 'Retail Data', 'Twitch', 'Fire TV'],
    channels: ['display', 'olv', 'ctv'],
    minBudget: 15000
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
 * Get Amazon-specific retail metrics
 */
async function getRetailMetrics(campaignId) {
  await simulateLatency();
  
  const metrics = MOCK_METRICS[campaignId];
  if (!metrics) {
    return null;
  }
  
  return {
    campaignId,
    dpvr: metrics.dpvr || 0,
    atc: metrics.atc || 0,
    purchases: metrics.purchases || 0,
    roas: metrics.roas || 0,
    newToBrand: Math.round((metrics.purchases || 0) * 0.35) // 35% NTB rate
  };
}

/**
 * Get available audience segments
 */
async function getAudienceSegments(category) {
  await simulateLatency();
  
  if (category) {
    return AUDIENCE_SEGMENTS[category] || [];
  }
  
  return AUDIENCE_SEGMENTS;
}

/**
 * Create campaign (mock)
 */
async function createCampaign(campaignData) {
  await simulateLatency();
  
  const newCampaign = {
    id: `amzn-camp-${Date.now()}`,
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
  getRetailMetrics,
  getAudienceSegments,
  createCampaign,
  updateCampaign
};
