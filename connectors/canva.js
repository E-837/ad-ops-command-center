/**
 * Canva Connector
 * Integration with Canva API for design creation and management
 * 
 * Official API: https://api.canva.com/rest/v1/...
 * 
 * Ad Ops Use Cases:
 * - Create ad designs from templates
 * - Export creatives in various formats
 * - Upload and manage brand assets
 * - Collaborative design workflows
 */

const fs = require('fs');
const path = require('path');

const name = 'Canva';
const shortName = 'Canva';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
  }
  
  return env;
}

let env = loadEnv();

// Token state
let accessToken = env.CANVA_ACCESS_TOKEN || null;
let refreshToken = env.CANVA_REFRESH_TOKEN || null;
const clientId = env.CANVA_CLIENT_ID || null;
const clientSecret = env.CANVA_CLIENT_SECRET || null;

const hasCanva = !!(accessToken && clientId);

// OAuth configuration
const oauth = {
  provider: 'canva',
  scopes: ['design:content:read', 'design:content:write', 'design:meta:read', 'asset:read', 'asset:write', 'folder:read', 'folder:write'],
  mcpEndpoint: 'https://api.canva.com/rest/v1',
  connected: hasCanva,
  accessToken: accessToken ? '***' : null
};

// Tool definitions for MCP integration
const tools = [
  {
    name: 'canva_create_design',
    description: 'Create a new Canva design (blank or from template)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Design title' },
        design_type: { 
          type: 'string', 
          enum: ['custom', 'presentation', 'doc', 'whiteboard'],
          description: 'Type of design (default: custom)' 
        },
        width: { type: 'number', description: 'Width in pixels (for custom type)' },
        height: { type: 'number', description: 'Height in pixels (for custom type)' },
        preset: {
          type: 'string',
          enum: ['A4', 'USLetter', 'Presentation16_9', 'Presentation4_3', 'InstagramPost', 'InstagramStory', 'FacebookPost', 'YouTubeThumbnail'],
          description: 'Preset size'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'canva_list_designs',
    description: 'List user\'s Canva designs',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        ownership: { 
          type: 'string', 
          enum: ['owned', 'shared', 'any'],
          description: 'Filter by ownership' 
        },
        limit: { type: 'number', description: 'Max results (default: 25)' },
        continuation: { type: 'string', description: 'Pagination token' }
      }
    }
  },
  {
    name: 'canva_get_design',
    description: 'Get design metadata by ID',
    inputSchema: {
      type: 'object',
      properties: {
        design_id: { type: 'string', description: 'Canva design ID' }
      },
      required: ['design_id']
    }
  },
  {
    name: 'canva_export_design',
    description: 'Export design as PNG, JPG, or PDF',
    inputSchema: {
      type: 'object',
      properties: {
        design_id: { type: 'string', description: 'Canva design ID' },
        format: { 
          type: 'string', 
          enum: ['png', 'jpg', 'pdf'],
          description: 'Export format (default: png)' 
        },
        pages: {
          type: 'array',
          items: { type: 'number' },
          description: 'Page numbers to export (1-indexed)'
        },
        quality: {
          type: 'string',
          enum: ['regular', 'high'],
          description: 'Export quality'
        }
      },
      required: ['design_id']
    }
  },
  {
    name: 'canva_upload_asset',
    description: 'Upload an image asset to Canva',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Asset name' },
        url: { type: 'string', description: 'URL of image to upload' },
        parent_folder_id: { type: 'string', description: 'Folder ID to upload into' }
      },
      required: ['name', 'url']
    }
  },
  {
    name: 'canva_list_assets',
    description: 'List assets in a folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string', description: 'Folder ID (root if not specified)' },
        limit: { type: 'number', description: 'Max results (default: 25)' },
        continuation: { type: 'string', description: 'Pagination token' }
      }
    }
  }
];

// Preset dimensions
const PRESETS = {
  'A4': { width: 2480, height: 3508 },
  'USLetter': { width: 2550, height: 3300 },
  'Presentation16_9': { width: 1920, height: 1080 },
  'Presentation4_3': { width: 1024, height: 768 },
  'InstagramPost': { width: 1080, height: 1080 },
  'InstagramStory': { width: 1080, height: 1920 },
  'FacebookPost': { width: 1200, height: 630 },
  'YouTubeThumbnail': { width: 1280, height: 720 }
};

/**
 * Refresh access token using refresh_token
 */
async function refreshAccessToken() {
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing OAuth credentials for token refresh');
  }
  
  const response = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${err}`);
  }
  
  const data = await response.json();
  accessToken = data.access_token;
  if (data.refresh_token) {
    refreshToken = data.refresh_token;
  }
  
  // Update env file with new tokens
  updateEnvTokens(accessToken, refreshToken);
  
  return accessToken;
}

/**
 * Update .env file with new tokens
 */
function updateEnvTokens(newAccessToken, newRefreshToken) {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Update access token
    if (content.includes('CANVA_ACCESS_TOKEN=')) {
      content = content.replace(/CANVA_ACCESS_TOKEN=.*/g, `CANVA_ACCESS_TOKEN=${newAccessToken}`);
    }
    
    // Update refresh token if provided
    if (newRefreshToken && content.includes('CANVA_REFRESH_TOKEN=')) {
      content = content.replace(/CANVA_REFRESH_TOKEN=.*/g, `CANVA_REFRESH_TOKEN=${newRefreshToken}`);
    }
    
    fs.writeFileSync(envPath, content);
    env = loadEnv(); // Reload
  }
}

/**
 * Make authenticated API request with automatic token refresh
 */
async function apiRequest(endpoint, options = {}, retried = false) {
  if (!accessToken) {
    throw new Error('Canva not configured - missing access token');
  }
  
  const url = `https://api.canva.com/rest/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // Handle token expiration
  if (response.status === 401 && !retried) {
    console.log('[Canva] Token expired, refreshing...');
    await refreshAccessToken();
    return apiRequest(endpoint, options, true);
  }
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Canva API error: ${response.status} - ${err}`);
  }
  
  // Some endpoints return empty body
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

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
    connected: hasCanva,
    features: ['Design Creation', 'Templates', 'Asset Management', 'Export', 'Collaboration'],
    useCases: ['Ad Creative Design', 'Social Media Assets', 'Brand Templates', 'Quick Exports'],
    toolCount: tools.length
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  if (!hasCanva) {
    return { 
      error: 'Canva not configured', 
      mock: true,
      message: 'Set CANVA_ACCESS_TOKEN in config/.env to enable live Canva API'
    };
  }
  
  try {
    switch (toolName) {
      case 'canva_create_design':
        return await createDesign(params);
      case 'canva_list_designs':
        return await listDesigns(params);
      case 'canva_get_design':
        return await getDesign(params.design_id);
      case 'canva_export_design':
        return await exportDesign(params);
      case 'canva_upload_asset':
        return await uploadAsset(params);
      case 'canva_list_assets':
        return await listAssets(params);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    status = 'error';
    throw err;
  }
}

/**
 * Create a new design
 */
async function createDesign(params) {
  const { title, design_type = 'custom', width, height, preset } = params;
  
  // Determine dimensions
  let finalWidth = width;
  let finalHeight = height;
  
  if (preset && PRESETS[preset]) {
    finalWidth = PRESETS[preset].width;
    finalHeight = PRESETS[preset].height;
  } else if (!finalWidth || !finalHeight) {
    // Default to Instagram Post size
    finalWidth = 1080;
    finalHeight = 1080;
  }
  
  const body = {
    design_type: design_type === 'custom' ? undefined : design_type,
    title,
    ...(design_type === 'custom' && {
      width: finalWidth,
      height: finalHeight
    })
  };
  
  const response = await apiRequest('/designs', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  return {
    design: response.design,
    dimensions: { width: finalWidth, height: finalHeight },
    editUrl: response.design?.urls?.edit_url
  };
}

/**
 * List designs
 */
async function listDesigns(params = {}) {
  const { query, ownership = 'owned', limit = 25, continuation } = params;
  
  const searchParams = new URLSearchParams();
  if (query) searchParams.set('query', query);
  if (ownership) searchParams.set('ownership', ownership);
  if (limit) searchParams.set('limit', limit.toString());
  if (continuation) searchParams.set('continuation', continuation);
  
  const endpoint = `/designs?${searchParams.toString()}`;
  return await apiRequest(endpoint);
}

/**
 * Get design by ID
 */
async function getDesign(designId) {
  return await apiRequest(`/designs/${designId}`);
}

/**
 * Export design to image/PDF
 */
async function exportDesign(params) {
  const { design_id, format = 'png', pages, quality = 'regular' } = params;
  
  // Start export job
  const exportBody = {
    format: format.toUpperCase(),
    ...(quality && { quality }),
    ...(pages && { pages: pages.map(p => ({ page_number: p })) })
  };
  
  const exportResponse = await apiRequest(`/designs/${design_id}/exports`, {
    method: 'POST',
    body: JSON.stringify(exportBody)
  });
  
  const jobId = exportResponse.job?.id;
  
  if (!jobId) {
    return exportResponse;
  }
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await apiRequest(`/designs/${design_id}/exports/${jobId}`);
    
    if (statusResponse.job?.status === 'success') {
      return {
        status: 'success',
        urls: statusResponse.job.urls,
        format,
        designId: design_id
      };
    }
    
    if (statusResponse.job?.status === 'failed') {
      throw new Error('Export failed: ' + (statusResponse.job.error?.message || 'Unknown error'));
    }
    
    attempts++;
  }
  
  return {
    status: 'processing',
    jobId,
    message: 'Export still processing - check back with job ID'
  };
}

/**
 * Upload asset to Canva
 */
async function uploadAsset(params) {
  const { name, url, parent_folder_id } = params;
  
  const body = {
    name,
    url,
    ...(parent_folder_id && { parent_folder_id })
  };
  
  // Start upload job
  const response = await apiRequest('/asset-uploads', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  const jobId = response.job?.id;
  
  if (!jobId) {
    return response;
  }
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await apiRequest(`/asset-uploads/${jobId}`);
    
    if (statusResponse.job?.status === 'success') {
      return {
        status: 'success',
        asset: statusResponse.job.asset,
        name
      };
    }
    
    if (statusResponse.job?.status === 'failed') {
      throw new Error('Upload failed: ' + (statusResponse.job.error?.message || 'Unknown error'));
    }
    
    attempts++;
  }
  
  return {
    status: 'processing',
    jobId,
    message: 'Upload still processing'
  };
}

/**
 * List assets in folder
 */
async function listAssets(params = {}) {
  const { folder_id, limit = 25, continuation } = params;
  
  const searchParams = new URLSearchParams();
  if (limit) searchParams.set('limit', limit.toString());
  if (continuation) searchParams.set('continuation', continuation);
  
  const endpoint = folder_id 
    ? `/folders/${folder_id}/items?${searchParams.toString()}`
    : `/folders?${searchParams.toString()}`;
    
  return await apiRequest(endpoint);
}

/**
 * Test connection
 */
async function testConnection() {
  if (!hasCanva) {
    return { connected: false, error: 'Not configured' };
  }
  
  try {
    // Try to list designs as a connection test
    await listDesigns({ limit: 1 });
    status = 'connected';
    return { connected: true, lastSync: new Date().toISOString() };
  } catch (err) {
    status = 'error';
    return { connected: false, error: err.message };
  }
}

module.exports = {
  name,
  shortName,
  version,
  status,
  lastSync,
  oauth,
  tools,
  hasCanva,
  getInfo,
  handleToolCall,
  createDesign,
  listDesigns,
  getDesign,
  exportDesign,
  uploadAsset,
  listAssets,
  testConnection,
  refreshAccessToken,
  PRESETS
};
