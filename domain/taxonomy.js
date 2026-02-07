/**
 * Ad Tech Taxonomy
 * Hierarchical classification system for advertising operations
 */

// Line of Business (Product Categories)
const LOB = {
  MOBILE: {
    id: 'mobile',
    name: 'Mobile',
    description: 'Smartphones and mobile devices',
    products: ['Galaxy S', 'Galaxy A', 'Galaxy Z', 'Galaxy M']
  },
  WEARABLES: {
    id: 'wearables',
    name: 'Wearables',
    description: 'Smartwatches and fitness trackers',
    products: ['Galaxy Watch', 'Galaxy Fit', 'Galaxy Buds', 'Galaxy Ring']
  },
  HOME: {
    id: 'home',
    name: 'Home',
    description: 'Home appliances and entertainment',
    products: ['TVs', 'Refrigerators', 'Washers', 'Air Conditioners', 'Soundbars']
  },
  EDUCATION: {
    id: 'education',
    name: 'Education',
    description: 'Education sector products',
    products: ['Galaxy Tab', 'Chromebook', 'Interactive Displays']
  },
  BUSINESS: {
    id: 'business',
    name: 'Business (B2B)',
    description: 'Enterprise and B2B solutions',
    products: ['Galaxy Enterprise', 'Knox', 'Displays', 'Signage']
  }
};

// Advertising Channels
const CHANNEL = {
  DISPLAY: {
    id: 'display',
    name: 'Display',
    description: 'Banner and rich media ads',
    formats: ['Standard Banner', 'Rich Media', 'Native', 'Interstitial'],
    dsps: ['ttd', 'dv360', 'amazon-dsp']
  },
  OLV: {
    id: 'olv',
    name: 'OLV (Online Video)',
    description: 'Video advertising across web and apps',
    formats: ['Pre-roll', 'Mid-roll', 'Post-roll', 'Outstream'],
    dsps: ['ttd', 'dv360', 'amazon-dsp']
  },
  CTV: {
    id: 'ctv',
    name: 'CTV (Connected TV)',
    description: 'Streaming TV advertising',
    formats: ['15s', '30s', 'Interactive'],
    dsps: ['ttd', 'dv360', 'amazon-dsp']
  },
  AUDIO: {
    id: 'audio',
    name: 'Audio',
    description: 'Streaming audio and podcast ads',
    formats: ['15s Audio', '30s Audio', 'Host Read'],
    dsps: ['ttd', 'dv360']
  },
  DEMAND_GEN: {
    id: 'demand-gen',
    name: 'Demand Gen',
    description: 'Google Discovery and YouTube Shorts',
    formats: ['Discovery', 'YouTube Shorts', 'Gmail'],
    dsps: ['dv360'] // Only available on DV360
  }
};

// Marketing Funnel Stages
const FUNNEL = {
  AWARENESS: {
    id: 'awareness',
    name: 'Awareness',
    description: 'Top of funnel - brand discovery',
    kpis: ['Impressions', 'Reach', 'Video Views', 'Brand Lift'],
    bidStrategies: ['CPM', 'vCPM', 'CPV']
  },
  CONSIDERATION: {
    id: 'consideration',
    name: 'Consideration',
    description: 'Mid funnel - product research',
    kpis: ['Clicks', 'CTR', 'Engagement', 'Site Visits'],
    bidStrategies: ['CPC', 'CPE', 'CPCV']
  },
  CONVERSION: {
    id: 'conversion',
    name: 'Conversion',
    description: 'Bottom funnel - purchase intent',
    kpis: ['Conversions', 'CPA', 'ROAS', 'Sales'],
    bidStrategies: ['CPA', 'tCPA', 'ROAS']
  }
};

// Market/Region
const MARKET = {
  US: { id: 'us', name: 'United States', currency: 'USD', timezone: 'America/New_York' },
  CA: { id: 'ca', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
  UK: { id: 'uk', name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
  DE: { id: 'de', name: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin' },
  FR: { id: 'fr', name: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
  JP: { id: 'jp', name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo' },
  KR: { id: 'kr', name: 'South Korea', currency: 'KRW', timezone: 'Asia/Seoul' },
  AU: { id: 'au', name: 'Australia', currency: 'AUD', timezone: 'Australia/Sydney' }
};

// DSP Platforms
const DSP = {
  TTD: {
    id: 'ttd',
    name: 'The Trade Desk',
    shortName: 'TTD',
    description: 'Independent DSP with premium inventory',
    features: ['Unified ID 2.0', 'Koa AI', 'Premium Inventory'],
    channels: ['display', 'olv', 'ctv', 'audio'],
    minSpend: 10000
  },
  DV360: {
    id: 'dv360',
    name: 'Display & Video 360',
    shortName: 'DV360',
    description: 'Google Marketing Platform DSP',
    features: ['YouTube Access', 'Google Audiences', 'Demand Gen'],
    channels: ['display', 'olv', 'ctv', 'audio', 'demand-gen'],
    minSpend: 5000
  },
  AMAZON_DSP: {
    id: 'amazon-dsp',
    name: 'Amazon DSP',
    shortName: 'Amazon',
    description: 'Amazon advertising platform',
    features: ['Amazon Audiences', 'Retail Data', 'Twitch'],
    channels: ['display', 'olv', 'ctv'],
    minSpend: 15000
  }
};

// Campaign Status
const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Flight Status
const FLIGHT_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PACING_BEHIND: 'pacing_behind',
  PACING_AHEAD: 'pacing_ahead',
  PAUSED: 'paused',
  ENDED: 'ended'
};

// Creative Status
const CREATIVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

/**
 * Get all LOBs
 */
function getLOBs() {
  return Object.values(LOB);
}

/**
 * Get all channels
 */
function getChannels() {
  return Object.values(CHANNEL);
}

/**
 * Get channels available for a DSP
 */
function getChannelsForDSP(dspId) {
  const dsp = DSP[dspId.toUpperCase().replace('-', '_')];
  if (!dsp) return [];
  return dsp.channels.map(chId => {
    const ch = Object.values(CHANNEL).find(c => c.id === chId);
    return ch || null;
  }).filter(Boolean);
}

/**
 * Get all funnel stages
 */
function getFunnelStages() {
  return Object.values(FUNNEL);
}

/**
 * Get all markets
 */
function getMarkets() {
  return Object.values(MARKET);
}

/**
 * Get all DSPs
 */
function getDSPs() {
  return Object.values(DSP);
}

/**
 * Check if channel is available on DSP
 */
function isChannelAvailable(channelId, dspId) {
  const dsp = DSP[dspId.toUpperCase().replace('-', '_')];
  if (!dsp) return false;
  return dsp.channels.includes(channelId);
}

/**
 * Get taxonomy node by path
 * e.g., "lob.mobile" or "channel.display"
 */
function getNode(path) {
  const [type, id] = path.split('.');
  switch (type.toLowerCase()) {
    case 'lob': return LOB[id.toUpperCase()];
    case 'channel': return CHANNEL[id.toUpperCase().replace('-', '_')];
    case 'funnel': return FUNNEL[id.toUpperCase()];
    case 'market': return MARKET[id.toUpperCase()];
    case 'dsp': return DSP[id.toUpperCase().replace('-', '_')];
    default: return null;
  }
}

/**
 * Validate taxonomy combination
 */
function validateCombination(lob, channel, funnel, dsp) {
  const issues = [];
  
  // Check if Demand Gen is only on DV360
  if (channel === 'demand-gen' && dsp !== 'dv360') {
    issues.push('Demand Gen channel is only available on DV360');
  }
  
  // Check if DSP supports channel
  if (!isChannelAvailable(channel, dsp)) {
    issues.push(`${channel} is not available on ${dsp}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get full taxonomy tree
 */
function getFullTaxonomy() {
  return {
    lob: LOB,
    channel: CHANNEL,
    funnel: FUNNEL,
    market: MARKET,
    dsp: DSP,
    status: {
      campaign: CAMPAIGN_STATUS,
      flight: FLIGHT_STATUS,
      creative: CREATIVE_STATUS
    }
  };
}

module.exports = {
  LOB,
  CHANNEL,
  FUNNEL,
  MARKET,
  DSP,
  CAMPAIGN_STATUS,
  FLIGHT_STATUS,
  CREATIVE_STATUS,
  getLOBs,
  getChannels,
  getChannelsForDSP,
  getFunnelStages,
  getMarkets,
  getDSPs,
  isChannelAvailable,
  getNode,
  validateCombination,
  getFullTaxonomy
};
