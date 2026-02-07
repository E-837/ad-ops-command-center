/**
 * Figma Connector
 * Integration with Figma MCP for creative asset management
 * 
 * Official 1st-party MCP: Figma MCP Server (via Figma API)
 * Reference: https://www.figma.com/developers/api
 * 
 * Ad Ops Use Cases:
 * - Creative specs for DSP uploads
 * - Ad dimensions/formats verification
 * - Brand guidelines access
 * - Design handoff and review
 * - Export assets for campaigns
 */

const name = 'Figma';
const shortName = 'Figma';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// OAuth placeholder - would connect to real Figma MCP
const oauth = {
  provider: 'figma',
  scopes: ['file_read', 'file_comments:read'],
  mcpEndpoint: 'https://api.figma.com/v1',
  connected: false,
  accessToken: null
};

// Tool definitions for MCP integration
const tools = [
  {
    name: 'figma_get_file',
    description: 'Get Figma file metadata and structure (pages, frames, components)',
    inputSchema: {
      type: 'object',
      properties: {
        file_key: { type: 'string', description: 'Figma file key (from URL)' },
        depth: { type: 'number', description: 'Depth of node tree to return (default: 2)' }
      },
      required: ['file_key']
    }
  },
  {
    name: 'figma_get_node',
    description: 'Get specific design node (frame, component, etc.) with properties',
    inputSchema: {
      type: 'object',
      properties: {
        file_key: { type: 'string', description: 'Figma file key' },
        node_id: { type: 'string', description: 'Node ID (e.g., "1:234")' }
      },
      required: ['file_key', 'node_id']
    }
  },
  {
    name: 'figma_get_images',
    description: 'Export nodes as images (PNG, JPG, SVG, PDF)',
    inputSchema: {
      type: 'object',
      properties: {
        file_key: { type: 'string', description: 'Figma file key' },
        node_ids: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of node IDs to export' 
        },
        format: { 
          type: 'string', 
          enum: ['png', 'jpg', 'svg', 'pdf'],
          description: 'Export format' 
        },
        scale: { type: 'number', description: 'Scale factor (1-4)' }
      },
      required: ['file_key', 'node_ids']
    }
  },
  {
    name: 'figma_get_comments',
    description: 'Get comments on a Figma file',
    inputSchema: {
      type: 'object',
      properties: {
        file_key: { type: 'string', description: 'Figma file key' }
      },
      required: ['file_key']
    }
  },
  {
    name: 'figma_list_projects',
    description: 'List projects in a team',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: 'string', description: 'Figma team ID' }
      },
      required: ['team_id']
    }
  },
  {
    name: 'figma_get_styles',
    description: 'Get design system styles (colors, typography, effects)',
    inputSchema: {
      type: 'object',
      properties: {
        file_key: { type: 'string', description: 'Figma file key' }
      },
      required: ['file_key']
    }
  }
];

// Mock data simulating Figma workspace for Samsung Ad Ops
const MOCK_TEAM = {
  id: 'team-samsung-adops',
  name: 'Samsung Ad Ops Creative'
};

const MOCK_PROJECTS = [
  {
    id: 'proj-001',
    name: 'Galaxy S25 Campaign Assets',
    team_id: MOCK_TEAM.id,
    files: ['file-s25-video', 'file-s25-display', 'file-s25-native']
  },
  {
    id: 'proj-002',
    name: 'Galaxy Watch 7 Campaign',
    team_id: MOCK_TEAM.id,
    files: ['file-watch7-video', 'file-watch7-display']
  },
  {
    id: 'proj-003',
    name: 'Brand Guidelines & Templates',
    team_id: MOCK_TEAM.id,
    files: ['file-brand-guide', 'file-ad-templates']
  },
  {
    id: 'proj-004',
    name: 'Ad Spec Templates',
    team_id: MOCK_TEAM.id,
    files: ['file-ctv-specs', 'file-display-specs', 'file-video-specs']
  }
];

const MOCK_FILES = {
  'file-s25-video': {
    key: 'file-s25-video',
    name: 'S25 Video Creatives',
    lastModified: '2026-02-05T14:30:00Z',
    version: '847291038',
    thumbnailUrl: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/thumbnails/xxx',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:1',
          name: 'CTV Ads',
          type: 'CANVAS',
          children: [
            {
              id: '1:100',
              name: 'S25 Hero - 30s',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 0, width: 1920, height: 1080 },
              children: [],
              exportSettings: [{ format: 'MP4', suffix: '', constraint: { type: 'SCALE', value: 1 } }]
            },
            {
              id: '1:101',
              name: 'S25 Features - 15s',
              type: 'FRAME',
              absoluteBoundingBox: { x: 2000, y: 0, width: 1920, height: 1080 },
              children: []
            },
            {
              id: '1:102',
              name: 'S25 AI Camera - 15s',
              type: 'FRAME',
              absoluteBoundingBox: { x: 4000, y: 0, width: 1920, height: 1080 },
              children: []
            }
          ]
        },
        {
          id: '2:1',
          name: 'OLV Pre-roll',
          type: 'CANVAS',
          children: [
            {
              id: '2:100',
              name: 'YouTube Pre-roll 6s',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 0, width: 1920, height: 1080 },
              children: []
            },
            {
              id: '2:101',
              name: 'YouTube Pre-roll 15s',
              type: 'FRAME',
              absoluteBoundingBox: { x: 2000, y: 0, width: 1920, height: 1080 },
              children: []
            }
          ]
        }
      ]
    }
  },
  'file-s25-display': {
    key: 'file-s25-display',
    name: 'S25 Display Banners',
    lastModified: '2026-02-06T09:00:00Z',
    version: '847392847',
    thumbnailUrl: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/thumbnails/yyy',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:1',
          name: 'Standard IAB',
          type: 'CANVAS',
          children: [
            {
              id: '1:200',
              name: '300x250 Medium Rectangle',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 250 },
              children: [
                { id: '1:201', name: 'Background', type: 'RECTANGLE', fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] },
                { id: '1:202', name: 'Logo', type: 'COMPONENT', componentId: 'comp-logo' },
                { id: '1:203', name: 'Headline', type: 'TEXT', characters: 'Introducing Galaxy S25' },
                { id: '1:204', name: 'CTA', type: 'COMPONENT', componentId: 'comp-cta' }
              ]
            },
            {
              id: '1:210',
              name: '728x90 Leaderboard',
              type: 'FRAME',
              absoluteBoundingBox: { x: 400, y: 0, width: 728, height: 90 },
              children: []
            },
            {
              id: '1:220',
              name: '160x600 Wide Skyscraper',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 300, width: 160, height: 600 },
              children: []
            },
            {
              id: '1:230',
              name: '320x50 Mobile Leaderboard',
              type: 'FRAME',
              absoluteBoundingBox: { x: 400, y: 300, width: 320, height: 50 },
              children: []
            },
            {
              id: '1:240',
              name: '970x250 Billboard',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 1000, width: 970, height: 250 },
              children: []
            }
          ]
        },
        {
          id: '2:1',
          name: 'Rich Media',
          type: 'CANVAS',
          children: [
            {
              id: '2:200',
              name: '300x600 Half Page Expandable',
              type: 'FRAME',
              absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 600 },
              children: []
            },
            {
              id: '2:210',
              name: '970x90 Pushdown',
              type: 'FRAME',
              absoluteBoundingBox: { x: 400, y: 0, width: 970, height: 90 },
              children: []
            }
          ]
        }
      ]
    }
  },
  'file-brand-guide': {
    key: 'file-brand-guide',
    name: 'Samsung Brand Guidelines 2026',
    lastModified: '2026-01-15T10:00:00Z',
    version: '840293847',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:1',
          name: 'Colors',
          type: 'CANVAS',
          children: [
            { id: '1:100', name: 'Primary Blue', type: 'FRAME', fills: [{ type: 'SOLID', color: { r: 0.04, g: 0.45, b: 0.87 } }] },
            { id: '1:101', name: 'Black', type: 'FRAME', fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] },
            { id: '1:102', name: 'White', type: 'FRAME', fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] }
          ]
        },
        {
          id: '2:1',
          name: 'Typography',
          type: 'CANVAS',
          children: [
            { id: '2:100', name: 'Samsung Sharp Sans', type: 'FRAME' },
            { id: '2:101', name: 'Samsung One', type: 'FRAME' }
          ]
        },
        {
          id: '3:1',
          name: 'Logo Usage',
          type: 'CANVAS',
          children: []
        }
      ]
    }
  },
  'file-ad-templates': {
    key: 'file-ad-templates',
    name: 'Ad Creative Templates',
    lastModified: '2026-02-01T11:30:00Z',
    version: '845938271',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:1',
          name: 'Video Templates',
          type: 'CANVAS',
          children: [
            { id: '1:100', name: 'CTV 30s Template', type: 'COMPONENT' },
            { id: '1:101', name: 'CTV 15s Template', type: 'COMPONENT' },
            { id: '1:102', name: 'Pre-roll 6s Template', type: 'COMPONENT' }
          ]
        },
        {
          id: '2:1',
          name: 'Display Templates',
          type: 'CANVAS',
          children: [
            { id: '2:100', name: '300x250 Template', type: 'COMPONENT' },
            { id: '2:101', name: '728x90 Template', type: 'COMPONENT' },
            { id: '2:102', name: '160x600 Template', type: 'COMPONENT' }
          ]
        }
      ]
    }
  }
};

const MOCK_COMMENTS = {
  'file-s25-display': [
    {
      id: 'comment-001',
      file_key: 'file-s25-display',
      parent_id: '',
      user: { id: 'user-001', handle: 'sarah.chen', img_url: 'https://...' },
      created_at: '2026-02-05T10:30:00Z',
      resolved_at: null,
      message: 'The CTA button needs to be more prominent - can we increase size by 10%?',
      client_meta: { node_id: '1:200', node_offset: { x: 150, y: 220 } },
      order_id: 1
    },
    {
      id: 'comment-002',
      file_key: 'file-s25-display',
      parent_id: 'comment-001',
      user: { id: 'user-002', handle: 'mike.designer', img_url: 'https://...' },
      created_at: '2026-02-05T11:00:00Z',
      resolved_at: null,
      message: 'Done! Updated all sizes. Please review.',
      client_meta: null,
      order_id: 2
    },
    {
      id: 'comment-003',
      file_key: 'file-s25-display',
      parent_id: '',
      user: { id: 'user-001', handle: 'sarah.chen', img_url: 'https://...' },
      created_at: '2026-02-06T09:00:00Z',
      resolved_at: '2026-02-06T09:15:00Z',
      message: 'All banners look great! Approved for trafficking.',
      client_meta: null,
      order_id: 3
    }
  ],
  'file-s25-video': [
    {
      id: 'comment-010',
      file_key: 'file-s25-video',
      parent_id: '',
      user: { id: 'user-003', handle: 'compliance.team', img_url: 'https://...' },
      created_at: '2026-02-04T16:00:00Z',
      resolved_at: '2026-02-05T09:00:00Z',
      message: 'Need to add disclaimer text for Galaxy AI features per legal requirements.',
      client_meta: { node_id: '1:100' },
      order_id: 1
    }
  ]
};

const MOCK_STYLES = {
  'file-brand-guide': {
    colors: [
      { key: 'style-001', name: 'Samsung Blue', style_type: 'FILL', description: 'Primary brand color', color: { r: 10, g: 115, b: 222, a: 1 } },
      { key: 'style-002', name: 'Samsung Black', style_type: 'FILL', description: 'Primary text color', color: { r: 0, g: 0, b: 0, a: 1 } },
      { key: 'style-003', name: 'Samsung White', style_type: 'FILL', description: 'Background color', color: { r: 255, g: 255, b: 255, a: 1 } },
      { key: 'style-004', name: 'Galaxy Purple', style_type: 'FILL', description: 'Accent for Galaxy devices', color: { r: 102, g: 51, b: 153, a: 1 } }
    ],
    typography: [
      { key: 'style-010', name: 'Headline Large', style_type: 'TEXT', fontFamily: 'Samsung Sharp Sans', fontWeight: 700, fontSize: 48 },
      { key: 'style-011', name: 'Headline Medium', style_type: 'TEXT', fontFamily: 'Samsung Sharp Sans', fontWeight: 700, fontSize: 32 },
      { key: 'style-012', name: 'Body', style_type: 'TEXT', fontFamily: 'Samsung One', fontWeight: 400, fontSize: 16 },
      { key: 'style-013', name: 'CTA Text', style_type: 'TEXT', fontFamily: 'Samsung Sharp Sans', fontWeight: 700, fontSize: 14 }
    ],
    effects: [
      { key: 'style-020', name: 'Card Shadow', style_type: 'EFFECT', effectType: 'DROP_SHADOW', radius: 8, offset: { x: 0, y: 4 } },
      { key: 'style-021', name: 'Glow', style_type: 'EFFECT', effectType: 'LAYER_BLUR', radius: 20 }
    ]
  }
};

const MOCK_IMAGE_EXPORTS = {
  'file-s25-display': {
    '1:200': 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/300x250.png',
    '1:210': 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/728x90.png',
    '1:220': 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/160x600.png',
    '1:230': 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/320x50.png',
    '1:240': 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/970x250.png'
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
    mcpEndpoint: oauth.mcpEndpoint,
    connected: oauth.connected,
    features: ['Files', 'Nodes', 'Image Export', 'Comments', 'Styles'],
    useCases: ['Creative Specs', 'Asset Export', 'Brand Guidelines', 'Design Review']
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  // Try real API first, fall back to mock
  const apiClient = require('./api-client');
  
  if (apiClient.hasFigma) {
    try {
      return await handleRealApiCall(apiClient.figma, toolName, params);
    } catch (err) {
      console.error(`[Figma] Real API error, falling back to mock: ${err.message}`);
    }
  }
  
  // Mock fallback
  await simulateLatency();
  switch (toolName) {
    case 'figma_get_file':
      return getFile(params.file_key, params.depth);
    case 'figma_get_node':
      return getNode(params.file_key, params.node_id);
    case 'figma_get_images':
      return getImages(params.file_key, params.node_ids, params.format, params.scale);
    case 'figma_get_comments':
      return getComments(params.file_key);
    case 'figma_list_projects':
      return listProjects(params.team_id);
    case 'figma_get_styles':
      return getStyles(params.file_key);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function handleRealApiCall(api, toolName, params) {
  switch (toolName) {
    case 'figma_get_file':
      return api.getFile(params.file_key);
      
    case 'figma_get_node':
      return api.getFileNodes(params.file_key, params.node_id);
      
    case 'figma_get_images':
      return api.getImages(
        params.file_key, 
        params.node_ids, 
        params.format || 'png', 
        params.scale || 1
      );
      
    case 'figma_get_comments':
      return api.getComments(params.file_key);
      
    case 'figma_list_projects':
      return api.getTeamProjects(params.team_id);
      
    case 'figma_get_styles':
      return api.getStyles(params.file_key);
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Get file metadata and structure
 */
function getFile(fileKey, depth = 2) {
  const file = MOCK_FILES[fileKey];
  if (!file) {
    throw new Error(`File not found: ${fileKey}`);
  }
  
  // Limit depth of returned tree
  const limitDepth = (node, currentDepth) => {
    if (currentDepth >= depth) {
      const { children, ...rest } = node;
      return { ...rest, children: children ? `[${children.length} children]` : undefined };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => limitDepth(child, currentDepth + 1))
      };
    }
    return node;
  };
  
  return {
    ...file,
    document: limitDepth(file.document, 0)
  };
}

/**
 * Get specific node
 */
function getNode(fileKey, nodeId) {
  const file = MOCK_FILES[fileKey];
  if (!file) {
    throw new Error(`File not found: ${fileKey}`);
  }
  
  // Recursive search for node
  const findNode = (node) => {
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
    }
    return null;
  };
  
  const node = findNode(file.document);
  if (!node) {
    throw new Error(`Node not found: ${nodeId} in file ${fileKey}`);
  }
  
  return {
    document: node,
    name: file.name,
    lastModified: file.lastModified
  };
}

/**
 * Export nodes as images
 */
function getImages(fileKey, nodeIds, format = 'png', scale = 1) {
  const images = MOCK_IMAGE_EXPORTS[fileKey] || {};
  
  const result = {
    err: null,
    images: {}
  };
  
  for (const nodeId of nodeIds) {
    if (images[nodeId]) {
      result.images[nodeId] = images[nodeId].replace('.png', `.${format}`) + `?scale=${scale}`;
    } else {
      result.images[nodeId] = `https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/${fileKey}/${nodeId.replace(':', '-')}.${format}?scale=${scale}`;
    }
  }
  
  return result;
}

/**
 * Get comments on file
 */
function getComments(fileKey) {
  const comments = MOCK_COMMENTS[fileKey] || [];
  
  return {
    comments: comments.map(c => ({
      ...c,
      reactions: [],
      order_id: c.order_id.toString()
    }))
  };
}

/**
 * List projects in team
 */
function listProjects(teamId) {
  const projects = MOCK_PROJECTS.filter(p => p.team_id === teamId || teamId === MOCK_TEAM.id);
  
  return {
    name: MOCK_TEAM.name,
    projects: projects.map(p => ({
      id: p.id,
      name: p.name
    }))
  };
}

/**
 * Get design system styles
 */
function getStyles(fileKey) {
  const styles = MOCK_STYLES[fileKey] || MOCK_STYLES['file-brand-guide'];
  
  return {
    status: 200,
    meta: {
      styles: [
        ...styles.colors.map(s => ({ ...s, style_type: 'FILL' })),
        ...styles.typography.map(s => ({ ...s, style_type: 'TEXT' })),
        ...styles.effects.map(s => ({ ...s, style_type: 'EFFECT' }))
      ]
    }
  };
}

/**
 * Get ad specs from creative frames
 */
function getAdSpecs(fileKey) {
  const file = MOCK_FILES[fileKey];
  if (!file) return [];
  
  const specs = [];
  
  const extractSpecs = (node) => {
    if (node.type === 'FRAME' && node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      specs.push({
        name: node.name,
        nodeId: node.id,
        width,
        height,
        aspectRatio: `${width}:${height}`,
        format: detectFormat(width, height)
      });
    }
    if (node.children) {
      node.children.forEach(extractSpecs);
    }
  };
  
  extractSpecs(file.document);
  return specs;
}

/**
 * Detect ad format from dimensions
 */
function detectFormat(width, height) {
  const formats = {
    '300x250': 'Medium Rectangle',
    '728x90': 'Leaderboard',
    '160x600': 'Wide Skyscraper',
    '320x50': 'Mobile Leaderboard',
    '970x250': 'Billboard',
    '300x600': 'Half Page',
    '970x90': 'Super Leaderboard',
    '1920x1080': 'Full HD Video',
    '1280x720': 'HD Video'
  };
  
  return formats[`${width}x${height}`] || 'Custom';
}

// Helper
function simulateLatency() {
  return new Promise(resolve => setTimeout(resolve, 50));
}

module.exports = {
  name,
  shortName,
  version,
  status,
  lastSync,
  oauth,
  tools,
  getInfo,
  handleToolCall,
  getFile,
  getNode,
  getImages,
  getComments,
  listProjects,
  getStyles,
  getAdSpecs,
  detectFormat
};
