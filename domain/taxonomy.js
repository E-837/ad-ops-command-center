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

// Standard IAB Ad Sizes (Display)
const AD_SIZES = {
  // Desktop
  MEDIUM_RECTANGLE: { width: 300, height: 250, name: 'Medium Rectangle', type: 'desktop', iab: true },
  LEADERBOARD: { width: 728, height: 90, name: 'Leaderboard', type: 'desktop', iab: true },
  WIDE_SKYSCRAPER: { width: 160, height: 600, name: 'Wide Skyscraper', type: 'desktop', iab: true },
  HALF_PAGE: { width: 300, height: 600, name: 'Half Page', type: 'desktop', iab: true },
  BILLBOARD: { width: 970, height: 250, name: 'Billboard', type: 'desktop', iab: true },
  SUPER_LEADERBOARD: { width: 970, height: 90, name: 'Super Leaderboard', type: 'desktop', iab: true },
  LARGE_RECTANGLE: { width: 336, height: 280, name: 'Large Rectangle', type: 'desktop', iab: true },
  
  // Mobile
  MOBILE_LEADERBOARD: { width: 320, height: 50, name: 'Mobile Leaderboard', type: 'mobile', iab: true },
  MOBILE_BANNER: { width: 300, height: 50, name: 'Mobile Banner', type: 'mobile', iab: true },
  MOBILE_INTERSTITIAL: { width: 320, height: 480, name: 'Mobile Interstitial', type: 'mobile', iab: true },
  MOBILE_INTERSTITIAL_HD: { width: 480, height: 320, name: 'Mobile Interstitial HD', type: 'mobile', iab: true },
  
  // Tablet
  TABLET_LEADERBOARD: { width: 768, height: 90, name: 'Tablet Leaderboard', type: 'tablet', iab: true },
  TABLET_FULL_BANNER: { width: 468, height: 60, name: 'Tablet Full Banner', type: 'tablet', iab: true }
};

// Video Ad Formats
const VIDEO_FORMATS = {
  // CTV/OTT
  CTV_15S: { width: 1920, height: 1080, duration: 15, name: 'CTV 15 Second', channel: 'ctv', vastVersion: '4.0' },
  CTV_30S: { width: 1920, height: 1080, duration: 30, name: 'CTV 30 Second', channel: 'ctv', vastVersion: '4.0' },
  CTV_60S: { width: 1920, height: 1080, duration: 60, name: 'CTV 60 Second', channel: 'ctv', vastVersion: '4.0' },
  
  // Online Video
  PREROLL_6S: { width: 1920, height: 1080, duration: 6, name: 'Pre-roll 6 Second (Bumper)', channel: 'olv', vastVersion: '3.0' },
  PREROLL_15S: { width: 1920, height: 1080, duration: 15, name: 'Pre-roll 15 Second', channel: 'olv', vastVersion: '3.0' },
  PREROLL_30S: { width: 1920, height: 1080, duration: 30, name: 'Pre-roll 30 Second', channel: 'olv', vastVersion: '3.0' },
  MIDROLL: { width: 1920, height: 1080, duration: 30, name: 'Mid-roll', channel: 'olv', vastVersion: '3.0' },
  OUTSTREAM: { width: 1280, height: 720, duration: 30, name: 'Outstream', channel: 'olv', vastVersion: '3.0' },
  
  // Vertical Video
  YOUTUBE_SHORTS: { width: 1080, height: 1920, duration: 60, name: 'YouTube Shorts', channel: 'olv', aspect: '9:16' },
  VERTICAL_VIDEO: { width: 1080, height: 1920, duration: 15, name: 'Vertical Video', channel: 'social', aspect: '9:16' }
};

// Native Ad Formats
const NATIVE_FORMATS = {
  NATIVE_IMAGE_LANDSCAPE: { width: 1200, height: 627, aspectRatio: '1.91:1', name: 'Native Image (Landscape)' },
  NATIVE_IMAGE_SQUARE: { width: 1200, height: 1200, aspectRatio: '1:1', name: 'Native Image (Square)' },
  NATIVE_LOGO: { width: 300, height: 300, aspectRatio: '1:1', name: 'Native Logo' },
  NATIVE_VIDEO: { width: 1280, height: 720, duration: 30, name: 'Native Video' }
};

// Audio Ad Formats
const AUDIO_FORMATS = {
  AUDIO_15S: { duration: 15, bitrate: '192kbps', format: 'mp3', name: 'Audio 15 Second' },
  AUDIO_30S: { duration: 30, bitrate: '192kbps', format: 'mp3', name: 'Audio 30 Second' },
  AUDIO_60S: { duration: 60, bitrate: '192kbps', format: 'mp3', name: 'Audio 60 Second' },
  COMPANION_BANNER: { width: 300, height: 250, name: 'Audio Companion Banner' }
};

// Creative File Requirements by DSP
const DSP_CREATIVE_REQUIREMENTS = {
  TTD: {
    display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB', ssl: true },
    video: { formats: ['mp4', 'webm'], maxSize: '200MB', vast: ['2.0', '3.0', '4.0'] },
    native: { formats: ['jpg', 'png'], maxSize: '1MB' }
  },
  DV360: {
    display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB', gwd: true },
    video: { formats: ['mp4', 'webm'], maxSize: '1GB', vast: ['3.0', '4.0'] },
    native: { formats: ['jpg', 'png'], maxSize: '1MB' }
  },
  AMAZON_DSP: {
    display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '200KB' },
    video: { formats: ['mp4'], maxSize: '500MB', vast: ['2.0', '3.0'] },
    native: { formats: ['jpg', 'png'], maxSize: '1MB' }
  }
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
    },
    creative: {
      adSizes: AD_SIZES,
      videoFormats: VIDEO_FORMATS,
      nativeFormats: NATIVE_FORMATS,
      audioFormats: AUDIO_FORMATS,
      dspRequirements: DSP_CREATIVE_REQUIREMENTS
    }
  };
}

/**
 * Get all ad sizes
 */
function getAdSizes(type) {
  if (type) {
    return Object.values(AD_SIZES).filter(s => s.type === type);
  }
  return Object.values(AD_SIZES);
}

/**
 * Get ad size by dimensions
 */
function getAdSizeByDimensions(width, height) {
  return Object.values(AD_SIZES).find(s => s.width === width && s.height === height);
}

/**
 * Get video formats by channel
 */
function getVideoFormats(channel) {
  if (channel) {
    return Object.values(VIDEO_FORMATS).filter(f => f.channel === channel);
  }
  return Object.values(VIDEO_FORMATS);
}

/**
 * Get native formats
 */
function getNativeFormats() {
  return Object.values(NATIVE_FORMATS);
}

/**
 * Get audio formats
 */
function getAudioFormats() {
  return Object.values(AUDIO_FORMATS);
}

/**
 * Get DSP creative requirements
 */
function getDSPCreativeRequirements(dspId, channel) {
  const dsp = DSP_CREATIVE_REQUIREMENTS[dspId.toUpperCase().replace('-', '_')];
  if (!dsp) return null;
  if (channel) return dsp[channel] || null;
  return dsp;
}

/**
 * Validate creative for DSP
 */
function validateCreativeForDSP(creative, dspId, channel) {
  const requirements = getDSPCreativeRequirements(dspId, channel);
  if (!requirements) {
    return { valid: false, issues: [`Unknown DSP or channel: ${dspId}/${channel}`] };
  }
  
  const issues = [];
  
  // Check format
  if (creative.format && !requirements.formats.includes(creative.format.toLowerCase())) {
    issues.push(`Format ${creative.format} not supported. Use: ${requirements.formats.join(', ')}`);
  }
  
  // Check size (if provided as string like "150KB")
  if (creative.fileSize && requirements.maxSize) {
    const maxBytes = parseFileSize(requirements.maxSize);
    const actualBytes = typeof creative.fileSize === 'string' 
      ? parseFileSize(creative.fileSize) 
      : creative.fileSize;
    
    if (actualBytes > maxBytes) {
      issues.push(`File size exceeds limit of ${requirements.maxSize}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    requirements
  };
}

/**
 * Parse file size string to bytes
 */
function parseFileSize(sizeStr) {
  const match = String(sizeStr).match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) return parseInt(sizeStr) || 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'B': return value;
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    default: return value;
  }
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
  AD_SIZES,
  VIDEO_FORMATS,
  NATIVE_FORMATS,
  AUDIO_FORMATS,
  DSP_CREATIVE_REQUIREMENTS,
  getLOBs,
  getChannels,
  getChannelsForDSP,
  getFunnelStages,
  getMarkets,
  getDSPs,
  isChannelAvailable,
  getNode,
  validateCombination,
  getFullTaxonomy,
  getAdSizes,
  getAdSizeByDimensions,
  getVideoFormats,
  getNativeFormats,
  getAudioFormats,
  getDSPCreativeRequirements,
  validateCreativeForDSP
};
