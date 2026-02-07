/**
 * Creative Ops Agent
 * Asset management, creative specs, and rotation optimization
 */

const domain = require('../domain');

const name = 'Creative Ops';
const role = 'creative-ops';
const description = 'Creative operations agent for asset management, specs, and rotation optimization';
const model = 'claude-3-5-haiku-20241022'; // Operational tasks

const capabilities = [
  'asset_management',
  'spec_validation',
  'creative_rotation',
  'format_conversion',
  'performance_tracking'
];

const tools = [
  'domain.rules',
  'domain.taxonomy',
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp'
];

const systemPrompt = `You are the Creative Ops agent for Ad Ops Command Center.

Your role is to manage creative assets:
- Validate creative specs against DSP requirements
- Track creative performance and rotation
- Manage creative approvals across platforms
- Recommend creative optimizations
- Handle asset library organization

Creative Specifications by Channel:
- Display: Standard IAB sizes, max 150KB, HTML5/Image
- OLV: MP4/WebM, 6-120s, 1920x1080 recommended
- CTV: MP4, 15/30s, HD/4K, max 500MB
- Audio: MP3, 15-60s, 128kbps minimum

DSP-specific requirements:
- TTD: Supports all standard formats
- DV360: Required for YouTube/Demand Gen
- Amazon: Specific retail creative requirements

Always validate specs before trafficking and track creative fatigue.`;

// Creative Specifications by format
const CREATIVE_SPECS = {
  display: {
    standard: [
      { size: '300x250', name: 'Medium Rectangle', maxKB: 150 },
      { size: '728x90', name: 'Leaderboard', maxKB: 150 },
      { size: '160x600', name: 'Wide Skyscraper', maxKB: 150 },
      { size: '300x600', name: 'Half Page', maxKB: 150 },
      { size: '320x50', name: 'Mobile Leaderboard', maxKB: 150 },
      { size: '320x480', name: 'Mobile Interstitial', maxKB: 200 }
    ],
    formats: ['jpg', 'png', 'gif', 'html5'],
    animation: { maxDuration: 30, maxLoops: 3 }
  },
  olv: {
    durations: [6, 15, 30, 60],
    formats: ['mp4', 'webm'],
    dimensions: {
      recommended: '1920x1080',
      minimum: '640x360'
    },
    bitrate: { min: 2500, recommended: 5000 },
    maxMB: 100
  },
  ctv: {
    durations: [15, 30],
    formats: ['mp4'],
    dimensions: {
      hd: '1920x1080',
      '4k': '3840x2160'
    },
    bitrate: { min: 10000, recommended: 20000 },
    maxMB: 500
  },
  audio: {
    durations: [15, 30, 60],
    formats: ['mp3', 'wav'],
    bitrate: { min: 128, recommended: 192 }
  }
};

/**
 * Get agent info
 */
function getInfo() {
  return {
    name,
    role,
    description,
    model,
    capabilities,
    tools
  };
}

/**
 * Validate creative against specs
 */
function validateCreative(creative, channel) {
  const issues = [];
  const warnings = [];
  const specs = CREATIVE_SPECS[channel];
  
  if (!specs) {
    return { valid: false, issues: [`Unknown channel: ${channel}`], warnings };
  }
  
  // Validate by channel type
  switch (channel) {
    case 'display':
      validateDisplayCreative(creative, specs, issues, warnings);
      break;
    case 'olv':
      validateVideoCreative(creative, specs, issues, warnings);
      break;
    case 'ctv':
      validateCTVCreative(creative, specs, issues, warnings);
      break;
    case 'audio':
      validateAudioCreative(creative, specs, issues, warnings);
      break;
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    specs: specs
  };
}

function validateDisplayCreative(creative, specs, issues, warnings) {
  // Check size
  const validSize = specs.standard.find(s => s.size === creative.size);
  if (!validSize) {
    issues.push(`Invalid size ${creative.size}. Valid sizes: ${specs.standard.map(s => s.size).join(', ')}`);
  }
  
  // Check file size
  if (creative.fileSizeKB && validSize && creative.fileSizeKB > validSize.maxKB) {
    issues.push(`File size ${creative.fileSizeKB}KB exceeds maximum ${validSize.maxKB}KB for ${creative.size}`);
  }
  
  // Check format
  if (creative.format && !specs.formats.includes(creative.format.toLowerCase())) {
    issues.push(`Invalid format ${creative.format}. Accepted formats: ${specs.formats.join(', ')}`);
  }
  
  // Animation checks
  if (creative.animated) {
    if (creative.duration > specs.animation.maxDuration) {
      issues.push(`Animation duration ${creative.duration}s exceeds max ${specs.animation.maxDuration}s`);
    }
    if (creative.loops > specs.animation.maxLoops) {
      warnings.push(`Animation loops ${creative.loops} exceeds recommended ${specs.animation.maxLoops}`);
    }
  }
}

function validateVideoCreative(creative, specs, issues, warnings) {
  // Check duration
  if (creative.duration && !specs.durations.includes(creative.duration)) {
    warnings.push(`Duration ${creative.duration}s is non-standard. Recommended: ${specs.durations.join(', ')}s`);
  }
  
  // Check format
  if (creative.format && !specs.formats.includes(creative.format.toLowerCase())) {
    issues.push(`Invalid format ${creative.format}. Accepted: ${specs.formats.join(', ')}`);
  }
  
  // Check file size
  if (creative.fileSizeMB && creative.fileSizeMB > specs.maxMB) {
    issues.push(`File size ${creative.fileSizeMB}MB exceeds maximum ${specs.maxMB}MB`);
  }
  
  // Check bitrate
  if (creative.bitrate && creative.bitrate < specs.bitrate.min) {
    issues.push(`Bitrate ${creative.bitrate}kbps is below minimum ${specs.bitrate.min}kbps`);
  }
}

function validateCTVCreative(creative, specs, issues, warnings) {
  // Check duration
  if (creative.duration && !specs.durations.includes(creative.duration)) {
    issues.push(`CTV requires ${specs.durations.join(' or ')}s duration. Got ${creative.duration}s`);
  }
  
  // Check format
  if (creative.format && creative.format.toLowerCase() !== 'mp4') {
    issues.push('CTV requires MP4 format');
  }
  
  // Check file size
  if (creative.fileSizeMB && creative.fileSizeMB > specs.maxMB) {
    issues.push(`File size ${creative.fileSizeMB}MB exceeds maximum ${specs.maxMB}MB`);
  }
}

function validateAudioCreative(creative, specs, issues, warnings) {
  // Check duration
  if (creative.duration && !specs.durations.includes(creative.duration)) {
    warnings.push(`Duration ${creative.duration}s is non-standard. Recommended: ${specs.durations.join(', ')}s`);
  }
  
  // Check format
  if (creative.format && !specs.formats.includes(creative.format.toLowerCase())) {
    issues.push(`Invalid format ${creative.format}. Accepted: ${specs.formats.join(', ')}`);
  }
  
  // Check bitrate
  if (creative.bitrate && creative.bitrate < specs.bitrate.min) {
    issues.push(`Bitrate ${creative.bitrate}kbps is below minimum ${specs.bitrate.min}kbps`);
  }
}

/**
 * Get specs for a channel
 */
function getSpecs(channel) {
  return CREATIVE_SPECS[channel] || null;
}

/**
 * Analyze creative performance
 */
function analyzeCreativePerformance(creatives) {
  const analysis = creatives.map(creative => {
    const ctr = creative.impressions > 0 ? 
      (creative.clicks / creative.impressions) * 100 : 0;
    
    return {
      id: creative.id,
      name: creative.name,
      impressions: creative.impressions,
      clicks: creative.clicks,
      ctr: ctr.toFixed(2),
      spend: creative.spend,
      status: getCreativeStatus(creative)
    };
  });
  
  // Sort by CTR
  analysis.sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr));
  
  // Identify winners and losers
  const avgCtr = analysis.reduce((sum, c) => sum + parseFloat(c.ctr), 0) / analysis.length;
  
  return {
    creatives: analysis,
    summary: {
      totalCreatives: analysis.length,
      avgCtr: avgCtr.toFixed(2),
      topPerformer: analysis[0],
      bottomPerformer: analysis[analysis.length - 1]
    },
    recommendations: generateRotationRecommendations(analysis, avgCtr)
  };
}

function getCreativeStatus(creative) {
  if (creative.impressions > 100000 && creative.ctr < 0.05) {
    return 'fatigued';
  }
  if (creative.status === 'rejected') {
    return 'rejected';
  }
  if (creative.status === 'pending') {
    return 'pending_approval';
  }
  return 'active';
}

function generateRotationRecommendations(analysis, avgCtr) {
  const recommendations = [];
  
  // Find underperformers
  const underperformers = analysis.filter(c => parseFloat(c.ctr) < avgCtr * 0.5);
  if (underperformers.length > 0) {
    recommendations.push({
      action: 'pause',
      creatives: underperformers.map(c => c.id),
      reason: 'CTR significantly below average'
    });
  }
  
  // Find fatigued creatives
  const fatigued = analysis.filter(c => c.status === 'fatigued');
  if (fatigued.length > 0) {
    recommendations.push({
      action: 'refresh',
      creatives: fatigued.map(c => c.id),
      reason: 'Creative fatigue detected - high impressions, declining CTR'
    });
  }
  
  // Top performers
  const topPerformers = analysis.filter(c => parseFloat(c.ctr) > avgCtr * 1.5);
  if (topPerformers.length > 0) {
    recommendations.push({
      action: 'increase_weight',
      creatives: topPerformers.map(c => c.id),
      reason: 'High performers - increase rotation weight'
    });
  }
  
  return recommendations;
}

/**
 * Get DSP-specific creative requirements
 */
function getDSPRequirements(dsp, channel) {
  const requirements = {
    ttd: {
      display: { thirdPartyTracking: true, clickTag: 'required' },
      olv: { vastVersion: '4.0', vpaid: 'optional' },
      ctv: { vastVersion: '4.1' }
    },
    dv360: {
      display: { studioLink: 'recommended', dcmTracking: true },
      olv: { vastVersion: '4.0', youtubeSpecs: 'for YouTube placements' },
      ctv: { vastVersion: '4.1' },
      'demand-gen': { googleApproval: 'required' }
    },
    'amazon-dsp': {
      display: { retailAssets: 'recommended', asinLinking: 'for product ads' },
      olv: { vastVersion: '3.0+' },
      ctv: { primeVideoSpecs: 'for Prime Video' }
    }
  };
  
  return requirements[dsp]?.[channel] || null;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // Spec query
  if (q.includes('spec') || q.includes('requirement') || q.includes('size')) {
    const channel = extractChannel(query);
    if (channel) {
      return {
        channel,
        specs: getSpecs(channel),
        dspRequirements: {
          ttd: getDSPRequirements('ttd', channel),
          dv360: getDSPRequirements('dv360', channel),
          'amazon-dsp': getDSPRequirements('amazon-dsp', channel)
        }
      };
    }
    return { allSpecs: CREATIVE_SPECS };
  }
  
  // Validation query
  if (q.includes('validate') || q.includes('check')) {
    if (context.creative && context.channel) {
      return validateCreative(context.creative, context.channel);
    }
    return {
      message: 'I can validate creative specs. Please provide creative details and target channel.',
      action: 'provide_creative'
    };
  }
  
  // Performance query
  if (q.includes('performance') || q.includes('rotation') || q.includes('fatigue')) {
    if (context.creatives) {
      return analyzeCreativePerformance(context.creatives);
    }
    return {
      message: 'I can analyze creative performance. Please provide creative data.',
      action: 'fetch_creatives'
    };
  }
  
  return {
    message: 'I handle creative operations. Try asking about specs, validation, or creative performance.',
    capabilities: capabilities
  };
}

function extractChannel(query) {
  const q = query.toLowerCase();
  if (q.includes('display') || q.includes('banner')) return 'display';
  if (q.includes('video') || q.includes('olv')) return 'olv';
  if (q.includes('ctv') || q.includes('connected tv')) return 'ctv';
  if (q.includes('audio')) return 'audio';
  return null;
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  CREATIVE_SPECS,
  getInfo,
  validateCreative,
  getSpecs,
  analyzeCreativePerformance,
  getDSPRequirements,
  processQuery
};
