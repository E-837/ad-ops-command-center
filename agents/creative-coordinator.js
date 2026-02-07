/**
 * Creative Coordinator Agent
 * Creative asset management using Figma for design handoff and DSP trafficking
 * 
 * Responsibilities:
 * - Creative specs verification and extraction
 * - Asset export and format validation
 * - Brand guidelines compliance
 * - Design review coordination
 * - Creative-to-DSP trafficking support
 */

const name = 'Creative Coordinator';
const role = 'creative-coordinator';
const description = 'Creative coordination agent for design specs, asset management, and creative-to-DSP trafficking using Figma';
const model = 'claude-3-5-sonnet-20241022';

const capabilities = [
  'creative_specs',
  'asset_export',
  'format_validation',
  'brand_compliance',
  'design_review',
  'trafficking_support',
  'dimension_verification'
];

const tools = [
  'connectors.figma',
  'connectors.asana',
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp'
];

// Standard ad specifications for DSP trafficking
const AD_SPECS = {
  display: {
    standard: [
      { name: 'Medium Rectangle', width: 300, height: 250, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Leaderboard', width: 728, height: 90, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Wide Skyscraper', width: 160, height: 600, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Mobile Leaderboard', width: 320, height: 50, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '100KB' },
      { name: 'Billboard', width: 970, height: 250, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '200KB' },
      { name: 'Super Leaderboard', width: 970, height: 90, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Half Page', width: 300, height: 600, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Large Rectangle', width: 336, height: 280, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB' },
      { name: 'Smartphone Banner', width: 300, height: 50, formats: ['jpg', 'png', 'gif'], maxSize: '100KB' },
      { name: 'Smartphone Interstitial', width: 320, height: 480, formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '200KB' }
    ],
    richMedia: [
      { name: 'Expandable Banner', width: 300, height: 250, expandedWidth: 600, expandedHeight: 500, formats: ['html5'], maxSize: '500KB' },
      { name: 'Pushdown', width: 970, height: 90, expandedHeight: 415, formats: ['html5'], maxSize: '500KB' },
      { name: 'Floating', width: 400, height: 400, formats: ['html5'], maxSize: '300KB' }
    ]
  },
  video: {
    ctv: [
      { name: 'CTV 15s', width: 1920, height: 1080, duration: 15, formats: ['mp4'], maxSize: '75MB', bitrate: '15-20 Mbps' },
      { name: 'CTV 30s', width: 1920, height: 1080, duration: 30, formats: ['mp4'], maxSize: '150MB', bitrate: '15-20 Mbps' },
      { name: 'CTV 60s', width: 1920, height: 1080, duration: 60, formats: ['mp4'], maxSize: '300MB', bitrate: '15-20 Mbps' }
    ],
    olv: [
      { name: 'Pre-roll 6s', width: 1920, height: 1080, duration: 6, formats: ['mp4', 'webm'], maxSize: '30MB', bitrate: '8-10 Mbps' },
      { name: 'Pre-roll 15s', width: 1920, height: 1080, duration: 15, formats: ['mp4', 'webm'], maxSize: '75MB', bitrate: '8-10 Mbps' },
      { name: 'Pre-roll 30s', width: 1920, height: 1080, duration: 30, formats: ['mp4', 'webm'], maxSize: '150MB', bitrate: '8-10 Mbps' },
      { name: 'YouTube Shorts', width: 1080, height: 1920, duration: 60, formats: ['mp4'], maxSize: '200MB', bitrate: '8-10 Mbps' },
      { name: 'Outstream', width: 1280, height: 720, duration: 30, formats: ['mp4'], maxSize: '100MB', bitrate: '5-8 Mbps' }
    ],
    social: [
      { name: 'Instagram Reels', width: 1080, height: 1920, duration: 90, formats: ['mp4'], maxSize: '250MB' },
      { name: 'TikTok', width: 1080, height: 1920, duration: 60, formats: ['mp4'], maxSize: '287MB' },
      { name: 'Facebook Feed', width: 1080, height: 1080, duration: 120, formats: ['mp4'], maxSize: '4GB' }
    ]
  },
  native: [
    { name: 'Native Image', width: 1200, height: 627, aspectRatio: '1.91:1', formats: ['jpg', 'png'], maxSize: '1MB' },
    { name: 'Native Square', width: 1200, height: 1200, aspectRatio: '1:1', formats: ['jpg', 'png'], maxSize: '1MB' },
    { name: 'Native Logo', width: 300, height: 300, aspectRatio: '1:1', formats: ['png'], maxSize: '500KB' }
  ],
  audio: [
    { name: 'Audio 15s', duration: 15, formats: ['mp3', 'wav'], maxSize: '5MB', bitrate: '192 kbps' },
    { name: 'Audio 30s', duration: 30, formats: ['mp3', 'wav'], maxSize: '10MB', bitrate: '192 kbps' },
    { name: 'Audio 60s', duration: 60, formats: ['mp3', 'wav'], maxSize: '20MB', bitrate: '192 kbps' },
    { name: 'Companion Banner', width: 300, height: 250, formats: ['jpg', 'png'], maxSize: '150KB' }
  ]
};

const systemPrompt = `You are the Creative Coordinator agent for Ad Ops Command Center.

Your role is to manage creative assets and ensure proper specs for DSP trafficking:

**Figma Integration:**
- Extract creative specs from design files
- Verify dimensions and formats against DSP requirements
- Export assets for trafficking
- Review design comments and approval status
- Access brand guidelines and style references

**Key Responsibilities:**
1. Spec Verification: Confirm creatives meet DSP requirements
2. Asset Export: Generate properly formatted assets from Figma
3. Format Validation: Check file types, dimensions, file sizes
4. Brand Compliance: Verify creatives follow brand guidelines
5. Trafficking Support: Prepare assets with correct naming conventions

**DSP-Specific Requirements:**
- TTD: Standard IAB sizes, max 150KB for static, VAST for video
- DV360: Google Web Designer for rich media, YouTube specs for video
- Amazon: Amazon-specific formats and sizes

**Quality Checks:**
- Correct dimensions
- Safe zones respected
- CTA visible and clear
- Brand colors accurate
- Legal disclaimers present
- File size within limits

Always verify specs before approving creatives for trafficking.`;

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
 * Get all ad specifications
 */
function getAdSpecs() {
  return AD_SPECS;
}

/**
 * Get specs for a specific channel
 */
function getChannelSpecs(channel) {
  return AD_SPECS[channel] || null;
}

/**
 * Extract creative specs from Figma file
 */
async function extractCreativeSpecs(fileKey, figmaConnector) {
  const file = await figmaConnector.handleToolCall('figma_get_file', {
    file_key: fileKey,
    depth: 3
  });
  
  const specs = [];
  
  const extractFromNode = (node, pageName = '') => {
    if (node.type === 'FRAME' && node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      const matchedSpec = findMatchingSpec(width, height);
      
      specs.push({
        nodeId: node.id,
        name: node.name,
        page: pageName,
        dimensions: { width, height },
        aspectRatio: `${width}:${height}`,
        matchedSpec: matchedSpec?.name || 'Custom',
        matchedChannel: matchedSpec?.channel || 'Unknown',
        compliant: !!matchedSpec,
        exportFormats: node.exportSettings?.map(e => e.format) || ['PNG']
      });
    }
    
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        extractFromNode(child, node.type === 'CANVAS' ? node.name : pageName);
      }
    }
  };
  
  if (file.document?.children) {
    for (const page of file.document.children) {
      extractFromNode(page, page.name);
    }
  }
  
  return {
    fileName: file.name,
    lastModified: file.lastModified,
    creatives: specs,
    summary: {
      total: specs.length,
      compliant: specs.filter(s => s.compliant).length,
      nonCompliant: specs.filter(s => !s.compliant).length
    }
  };
}

/**
 * Find matching spec for dimensions
 */
function findMatchingSpec(width, height) {
  // Check display specs
  for (const spec of AD_SPECS.display.standard) {
    if (spec.width === width && spec.height === height) {
      return { ...spec, channel: 'display' };
    }
  }
  
  for (const spec of AD_SPECS.display.richMedia) {
    if (spec.width === width && spec.height === height) {
      return { ...spec, channel: 'display-rich-media' };
    }
  }
  
  // Check video specs
  for (const spec of AD_SPECS.video.ctv) {
    if (spec.width === width && spec.height === height) {
      return { ...spec, channel: 'ctv' };
    }
  }
  
  for (const spec of AD_SPECS.video.olv) {
    if (spec.width === width && spec.height === height) {
      return { ...spec, channel: 'olv' };
    }
  }
  
  // Check native specs
  for (const spec of AD_SPECS.native) {
    if (spec.width === width && spec.height === height) {
      return { ...spec, channel: 'native' };
    }
  }
  
  return null;
}

/**
 * Validate creative against DSP requirements
 */
function validateCreativeForDSP(creative, dsp, channel) {
  const issues = [];
  const warnings = [];
  
  // Get DSP-specific requirements
  const dspRequirements = getDSPRequirements(dsp, channel);
  
  // Check dimensions
  if (!creative.matchedSpec || !creative.compliant) {
    issues.push({
      type: 'dimension',
      message: `Non-standard dimensions: ${creative.dimensions.width}x${creative.dimensions.height}`,
      recommendation: 'Use IAB standard ad sizes for better inventory availability'
    });
  }
  
  // Check if format is supported
  if (creative.format && !dspRequirements.formats.includes(creative.format.toLowerCase())) {
    issues.push({
      type: 'format',
      message: `Format ${creative.format} not supported on ${dsp.toUpperCase()} for ${channel}`,
      recommendation: `Use one of: ${dspRequirements.formats.join(', ')}`
    });
  }
  
  // Check file size (if provided)
  if (creative.fileSize && dspRequirements.maxSize) {
    const maxBytes = parseSize(dspRequirements.maxSize);
    if (creative.fileSize > maxBytes) {
      issues.push({
        type: 'file_size',
        message: `File size ${formatSize(creative.fileSize)} exceeds ${dsp.toUpperCase()} limit of ${dspRequirements.maxSize}`,
        recommendation: 'Compress the asset or reduce quality'
      });
    }
  }
  
  // DSP-specific checks
  if (dsp === 'ttd') {
    if (channel === 'display' && creative.format === 'html5' && !creative.hasSSLAssets) {
      warnings.push('TTD requires all HTML5 assets to be SSL-compliant');
    }
  }
  
  if (dsp === 'dv360') {
    if (channel === 'display' && creative.format === 'html5' && !creative.isGWD) {
      warnings.push('DV360 prefers HTML5 creatives built with Google Web Designer');
    }
  }
  
  if (dsp === 'amazon-dsp') {
    if (!creative.hasClickTag) {
      warnings.push('Amazon DSP requires click tracking macros in creatives');
    }
  }
  
  return {
    creative: creative.name,
    dsp,
    channel,
    valid: issues.length === 0,
    issues,
    warnings,
    requirements: dspRequirements
  };
}

/**
 * Get DSP-specific requirements
 */
function getDSPRequirements(dsp, channel) {
  const baseRequirements = {
    ttd: {
      display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB', notes: 'VAST/VPAID for video' },
      video: { formats: ['mp4', 'webm'], maxSize: '200MB', notes: 'VAST 2.0/3.0/4.0 supported' },
      ctv: { formats: ['mp4'], maxSize: '300MB', notes: '15s, 30s, 60s durations' }
    },
    dv360: {
      display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '150KB', notes: 'GWD recommended for HTML5' },
      video: { formats: ['mp4', 'webm'], maxSize: '1GB', notes: 'YouTube specs apply' },
      ctv: { formats: ['mp4'], maxSize: '500MB', notes: 'YouTube CTV specs' }
    },
    'amazon-dsp': {
      display: { formats: ['jpg', 'png', 'gif', 'html5'], maxSize: '200KB', notes: 'Amazon-specific templates available' },
      video: { formats: ['mp4'], maxSize: '500MB', notes: 'Twitch/Fire TV specs vary' },
      ctv: { formats: ['mp4'], maxSize: '500MB', notes: 'Fire TV optimized' }
    }
  };
  
  return baseRequirements[dsp]?.[channel] || { formats: ['jpg', 'png'], maxSize: '150KB', notes: '' };
}

/**
 * Export assets from Figma
 */
async function exportAssets(fileKey, nodeIds, format, scale, figmaConnector) {
  const images = await figmaConnector.handleToolCall('figma_get_images', {
    file_key: fileKey,
    node_ids: nodeIds,
    format: format || 'png',
    scale: scale || 2 // 2x for retina
  });
  
  // Generate trafficking-ready naming
  const exports = Object.entries(images.images).map(([nodeId, url]) => ({
    nodeId,
    url,
    traffickingName: generateTraffickingName(nodeId, format),
    format
  }));
  
  return {
    fileKey,
    exports,
    count: exports.length,
    message: `Exported ${exports.length} assets in ${format} format`
  };
}

/**
 * Generate trafficking-ready file name
 */
function generateTraffickingName(nodeId, format) {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `SAMSUNG_${nodeId.replace(':', '-')}_${timestamp}.${format}`;
}

/**
 * Check brand compliance
 */
async function checkBrandCompliance(fileKey, figmaConnector) {
  // Get file styles
  const styles = await figmaConnector.handleToolCall('figma_get_styles', {
    file_key: fileKey
  });
  
  // Get brand guide styles
  const brandStyles = await figmaConnector.handleToolCall('figma_get_styles', {
    file_key: 'file-brand-guide'
  });
  
  const issues = [];
  const compliant = [];
  
  // Compare colors
  const fileColors = styles.meta.styles.filter(s => s.style_type === 'FILL');
  const brandColors = brandStyles.meta.styles.filter(s => s.style_type === 'FILL');
  
  for (const color of fileColors) {
    const matchesBrand = brandColors.some(bc => 
      bc.color?.r === color.color?.r &&
      bc.color?.g === color.color?.g &&
      bc.color?.b === color.color?.b
    );
    
    if (matchesBrand) {
      compliant.push({ type: 'color', name: color.name, status: 'approved' });
    } else {
      issues.push({
        type: 'color',
        name: color.name,
        message: 'Color not found in brand guidelines',
        severity: 'warning'
      });
    }
  }
  
  // Check typography
  const fileTypo = styles.meta.styles.filter(s => s.style_type === 'TEXT');
  const brandTypo = brandStyles.meta.styles.filter(s => s.style_type === 'TEXT');
  
  for (const typo of fileTypo) {
    const matchesBrand = brandTypo.some(bt => bt.fontFamily === typo.fontFamily);
    
    if (matchesBrand) {
      compliant.push({ type: 'typography', name: typo.name, status: 'approved' });
    } else {
      issues.push({
        type: 'typography',
        name: typo.name,
        fontFamily: typo.fontFamily,
        message: 'Font not in brand guidelines',
        severity: 'error'
      });
    }
  }
  
  return {
    fileKey,
    brandCompliant: issues.filter(i => i.severity === 'error').length === 0,
    compliantElements: compliant,
    issues,
    summary: {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      approved: compliant.length
    }
  };
}

/**
 * Get design review status from Figma comments
 */
async function getReviewStatus(fileKey, figmaConnector) {
  const comments = await figmaConnector.handleToolCall('figma_get_comments', {
    file_key: fileKey
  });
  
  const resolved = comments.comments.filter(c => c.resolved_at);
  const open = comments.comments.filter(c => !c.resolved_at && !c.parent_id);
  const replies = comments.comments.filter(c => c.parent_id);
  
  // Determine overall status
  let status = 'pending';
  if (open.length === 0 && resolved.length > 0) {
    status = 'approved';
  } else if (open.length > 0) {
    status = 'in_review';
  }
  
  return {
    fileKey,
    status,
    comments: {
      total: comments.comments.length,
      open: open.length,
      resolved: resolved.length,
      replies: replies.length
    },
    openComments: open.map(c => ({
      id: c.id,
      author: c.user.handle,
      message: c.message,
      createdAt: c.created_at,
      nodeId: c.client_meta?.node_id
    })),
    lastActivity: comments.comments.length > 0 
      ? comments.comments[comments.comments.length - 1].created_at 
      : null
  };
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // Specs query
  if (q.includes('spec') || q.includes('dimension') || q.includes('size')) {
    if (q.includes('display')) {
      return { specs: AD_SPECS.display, channel: 'display' };
    }
    if (q.includes('video') || q.includes('ctv') || q.includes('olv')) {
      return { specs: AD_SPECS.video, channel: 'video' };
    }
    if (q.includes('native')) {
      return { specs: AD_SPECS.native, channel: 'native' };
    }
    if (q.includes('audio')) {
      return { specs: AD_SPECS.audio, channel: 'audio' };
    }
    return { specs: AD_SPECS, message: 'All ad specifications' };
  }
  
  // Validation query
  if (q.includes('valid') || q.includes('check') || q.includes('verify')) {
    return {
      message: 'I can validate creatives against DSP requirements. Please provide the Figma file key.',
      action: 'validate_creative'
    };
  }
  
  // Export query
  if (q.includes('export') || q.includes('download')) {
    return {
      message: 'I can export assets from Figma. Which file and nodes would you like to export?',
      action: 'export_assets',
      availableFormats: ['png', 'jpg', 'svg', 'pdf']
    };
  }
  
  // Brand compliance
  if (q.includes('brand') || q.includes('complian')) {
    return {
      message: 'I can check creative files against brand guidelines. Provide a Figma file key.',
      action: 'check_brand_compliance'
    };
  }
  
  // Review status
  if (q.includes('review') || q.includes('comment') || q.includes('approval')) {
    return {
      message: 'I can check the review status of a Figma file. Which file would you like to check?',
      action: 'get_review_status'
    };
  }
  
  return {
    message: 'I coordinate creative assets and Figma workflows. I can help with specs, validation, exports, brand compliance, and review status.',
    capabilities
  };
}

// Helper functions
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+)(KB|MB|GB)$/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  AD_SPECS,
  getInfo,
  getAdSpecs,
  getChannelSpecs,
  extractCreativeSpecs,
  findMatchingSpec,
  validateCreativeForDSP,
  getDSPRequirements,
  exportAssets,
  checkBrandCompliance,
  getReviewStatus,
  processQuery
};
