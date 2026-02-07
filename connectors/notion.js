/**
 * Notion Connector
 * Integration with Notion MCP for documentation and knowledge management
 * 
 * Official 1st-party MCP: https://mcp.notion.com
 * 
 * Ad Ops Use Cases:
 * - Campaign playbooks/SOPs
 * - Vendor documentation
 * - Meeting notes
 * - Knowledge base
 * - Campaign tracking databases
 */

const name = 'Notion';
const shortName = 'Notion';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// OAuth placeholder - would connect to real Notion MCP
const oauth = {
  provider: 'notion',
  scopes: ['read_content', 'update_content', 'insert_content'],
  mcpEndpoint: 'https://mcp.notion.com',
  connected: false,
  accessToken: null
};

// Tool definitions for MCP integration
const tools = [
  {
    name: 'notion_search',
    description: 'Search pages and databases in Notion workspace',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text' },
        filter: { 
          type: 'object',
          description: 'Filter by object type',
          properties: {
            property: { type: 'string', enum: ['object'] },
            value: { type: 'string', enum: ['page', 'database'] }
          }
        },
        sort: {
          type: 'object',
          description: 'Sort results',
          properties: {
            direction: { type: 'string', enum: ['ascending', 'descending'] },
            timestamp: { type: 'string', enum: ['last_edited_time'] }
          }
        }
      },
      required: ['query']
    }
  },
  {
    name: 'notion_get_page',
    description: 'Get page content and properties',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' }
      },
      required: ['page_id']
    }
  },
  {
    name: 'notion_create_page',
    description: 'Create a new page with content',
    inputSchema: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: 'Parent page or database ID' },
        parent_type: { type: 'string', enum: ['page_id', 'database_id'], description: 'Parent type' },
        title: { type: 'string', description: 'Page title' },
        properties: { type: 'object', description: 'Page properties (for database pages)' },
        content: { type: 'array', description: 'Array of block objects for page content' }
      },
      required: ['parent_id', 'title']
    }
  },
  {
    name: 'notion_update_page',
    description: 'Update page properties',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
        properties: { type: 'object', description: 'Properties to update' },
        archived: { type: 'boolean', description: 'Archive/unarchive page' }
      },
      required: ['page_id']
    }
  },
  {
    name: 'notion_query_database',
    description: 'Query a database with filters and sorts',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Database ID' },
        filter: { type: 'object', description: 'Filter conditions' },
        sorts: { type: 'array', description: 'Sort conditions' },
        page_size: { type: 'number', description: 'Results per page (max 100)' }
      },
      required: ['database_id']
    }
  },
  {
    name: 'notion_add_block',
    description: 'Add a content block to a page',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID to add block to' },
        block_type: { type: 'string', description: 'Block type (paragraph, heading_1, bulleted_list_item, etc.)' },
        content: { type: 'string', description: 'Text content for the block' },
        after: { type: 'string', description: 'Block ID to insert after' }
      },
      required: ['page_id', 'block_type', 'content']
    }
  }
];

// Mock data simulating Notion workspace
const MOCK_PAGES = [
  {
    id: 'page-001',
    object: 'page',
    created_time: '2025-12-01T10:00:00Z',
    last_edited_time: '2026-02-05T14:30:00Z',
    parent: { type: 'workspace', workspace: true },
    archived: false,
    properties: {
      title: { title: [{ text: { content: 'Ad Ops Command Center - Home' } }] }
    },
    icon: { type: 'emoji', emoji: '🎯' },
    cover: null,
    url: 'https://notion.so/adops/home-xxx'
  },
  {
    id: 'page-002',
    object: 'page',
    created_time: '2025-12-15T09:00:00Z',
    last_edited_time: '2026-02-01T11:00:00Z',
    parent: { type: 'page_id', page_id: 'page-001' },
    archived: false,
    properties: {
      title: { title: [{ text: { content: 'Campaign Setup SOP' } }] }
    },
    icon: { type: 'emoji', emoji: '📋' },
    url: 'https://notion.so/adops/campaign-setup-sop-xxx'
  },
  {
    id: 'page-003',
    object: 'page',
    created_time: '2026-01-10T08:00:00Z',
    last_edited_time: '2026-02-06T09:15:00Z',
    parent: { type: 'page_id', page_id: 'page-001' },
    archived: false,
    properties: {
      title: { title: [{ text: { content: 'Galaxy S25 Launch Playbook' } }] }
    },
    icon: { type: 'emoji', emoji: '📱' },
    url: 'https://notion.so/adops/galaxy-s25-playbook-xxx'
  },
  {
    id: 'page-004',
    object: 'page',
    created_time: '2026-01-20T14:00:00Z',
    last_edited_time: '2026-02-05T16:45:00Z',
    parent: { type: 'page_id', page_id: 'page-001' },
    archived: false,
    properties: {
      title: { title: [{ text: { content: 'Vendor Contacts & Documentation' } }] }
    },
    icon: { type: 'emoji', emoji: '🤝' },
    url: 'https://notion.so/adops/vendor-docs-xxx'
  },
  {
    id: 'page-005',
    object: 'page',
    created_time: '2026-02-03T10:00:00Z',
    last_edited_time: '2026-02-03T12:30:00Z',
    parent: { type: 'page_id', page_id: 'page-001' },
    archived: false,
    properties: {
      title: { title: [{ text: { content: 'Weekly Sync Notes - Feb 3, 2026' } }] }
    },
    icon: { type: 'emoji', emoji: '📝' },
    url: 'https://notion.so/adops/weekly-sync-xxx'
  }
];

const MOCK_DATABASES = [
  {
    id: 'db-001',
    object: 'database',
    created_time: '2025-12-01T10:00:00Z',
    last_edited_time: '2026-02-06T08:00:00Z',
    title: [{ text: { content: 'Campaign Tracker' } }],
    description: [{ text: { content: 'Master database of all advertising campaigns' } }],
    icon: { type: 'emoji', emoji: '📊' },
    parent: { type: 'page_id', page_id: 'page-001' },
    url: 'https://notion.so/adops/campaign-tracker-xxx',
    properties: {
      'Campaign Name': { id: 'title', type: 'title' },
      'Status': { id: 'status', type: 'select', select: { options: [
        { name: 'Planning', color: 'gray' },
        { name: 'Setup', color: 'yellow' },
        { name: 'Live', color: 'green' },
        { name: 'Paused', color: 'orange' },
        { name: 'Completed', color: 'blue' }
      ]}},
      'DSP': { id: 'dsp', type: 'multi_select', multi_select: { options: [
        { name: 'TTD', color: 'purple' },
        { name: 'DV360', color: 'blue' },
        { name: 'Amazon', color: 'orange' }
      ]}},
      'Budget': { id: 'budget', type: 'number', number: { format: 'dollar' } },
      'Start Date': { id: 'start', type: 'date' },
      'End Date': { id: 'end', type: 'date' },
      'Owner': { id: 'owner', type: 'people' },
      'LOB': { id: 'lob', type: 'select' },
      'Channel': { id: 'channel', type: 'select' }
    }
  },
  {
    id: 'db-002',
    object: 'database',
    created_time: '2026-01-01T10:00:00Z',
    last_edited_time: '2026-02-06T10:00:00Z',
    title: [{ text: { content: 'Creative Assets' } }],
    description: [{ text: { content: 'Creative asset library with specs and approvals' } }],
    icon: { type: 'emoji', emoji: '🎨' },
    parent: { type: 'page_id', page_id: 'page-001' },
    url: 'https://notion.so/adops/creative-assets-xxx',
    properties: {
      'Asset Name': { id: 'title', type: 'title' },
      'Type': { id: 'type', type: 'select', select: { options: [
        { name: 'Video', color: 'red' },
        { name: 'Display', color: 'blue' },
        { name: 'Native', color: 'green' },
        { name: 'Audio', color: 'purple' }
      ]}},
      'Dimensions': { id: 'dims', type: 'rich_text' },
      'Duration': { id: 'duration', type: 'rich_text' },
      'Status': { id: 'status', type: 'select' },
      'Campaign': { id: 'campaign', type: 'relation' },
      'Figma Link': { id: 'figma', type: 'url' }
    }
  },
  {
    id: 'db-003',
    object: 'database',
    created_time: '2026-01-01T10:00:00Z',
    last_edited_time: '2026-02-04T15:00:00Z',
    title: [{ text: { content: 'Meeting Notes' } }],
    description: [{ text: { content: 'Archive of team meeting notes and action items' } }],
    icon: { type: 'emoji', emoji: '📝' },
    parent: { type: 'page_id', page_id: 'page-001' },
    url: 'https://notion.so/adops/meeting-notes-xxx',
    properties: {
      'Meeting Title': { id: 'title', type: 'title' },
      'Date': { id: 'date', type: 'date' },
      'Type': { id: 'type', type: 'select' },
      'Attendees': { id: 'attendees', type: 'people' },
      'Action Items': { id: 'actions', type: 'relation' }
    }
  }
];

const MOCK_DATABASE_ENTRIES = {
  'db-001': [
    {
      id: 'entry-001',
      object: 'page',
      parent: { type: 'database_id', database_id: 'db-001' },
      created_time: '2026-01-05T10:00:00Z',
      last_edited_time: '2026-02-06T08:00:00Z',
      properties: {
        'Campaign Name': { title: [{ text: { content: 'Galaxy S25 Launch - Awareness' } }] },
        'Status': { select: { name: 'Live', color: 'green' } },
        'DSP': { multi_select: [{ name: 'TTD' }, { name: 'DV360' }] },
        'Budget': { number: 150000 },
        'Start Date': { date: { start: '2026-01-15' } },
        'End Date': { date: { start: '2026-02-28' } },
        'LOB': { select: { name: 'Mobile' } },
        'Channel': { select: { name: 'CTV' } }
      }
    },
    {
      id: 'entry-002',
      object: 'page',
      parent: { type: 'database_id', database_id: 'db-001' },
      created_time: '2026-01-10T14:00:00Z',
      last_edited_time: '2026-02-05T11:30:00Z',
      properties: {
        'Campaign Name': { title: [{ text: { content: 'Galaxy Watch 7 - Consideration' } }] },
        'Status': { select: { name: 'Live', color: 'green' } },
        'DSP': { multi_select: [{ name: 'DV360' }] },
        'Budget': { number: 75000 },
        'Start Date': { date: { start: '2026-01-20' } },
        'End Date': { date: { start: '2026-03-15' } },
        'LOB': { select: { name: 'Wearables' } },
        'Channel': { select: { name: 'OLV' } }
      }
    },
    {
      id: 'entry-003',
      object: 'page',
      parent: { type: 'database_id', database_id: 'db-001' },
      created_time: '2025-12-20T09:00:00Z',
      last_edited_time: '2026-01-31T16:00:00Z',
      properties: {
        'Campaign Name': { title: [{ text: { content: 'Home Appliances Q1 - Display' } }] },
        'Status': { select: { name: 'Paused', color: 'orange' } },
        'DSP': { multi_select: [{ name: 'TTD' }] },
        'Budget': { number: 50000 },
        'Start Date': { date: { start: '2026-01-01' } },
        'End Date': { date: { start: '2026-03-31' } },
        'LOB': { select: { name: 'Home' } },
        'Channel': { select: { name: 'Display' } }
      }
    }
  ],
  'db-002': [
    {
      id: 'asset-001',
      object: 'page',
      parent: { type: 'database_id', database_id: 'db-002' },
      properties: {
        'Asset Name': { title: [{ text: { content: 'S25 Launch Hero - 30s' } }] },
        'Type': { select: { name: 'Video', color: 'red' } },
        'Dimensions': { rich_text: [{ text: { content: '1920x1080' } }] },
        'Duration': { rich_text: [{ text: { content: '30 seconds' } }] },
        'Status': { select: { name: 'Approved', color: 'green' } },
        'Figma Link': { url: 'https://figma.com/file/s25-hero-30s' }
      }
    },
    {
      id: 'asset-002',
      object: 'page',
      parent: { type: 'database_id', database_id: 'db-002' },
      properties: {
        'Asset Name': { title: [{ text: { content: 'S25 Features - 15s' } }] },
        'Type': { select: { name: 'Video', color: 'red' } },
        'Dimensions': { rich_text: [{ text: { content: '1920x1080' } }] },
        'Duration': { rich_text: [{ text: { content: '15 seconds' } }] },
        'Status': { select: { name: 'In Review', color: 'yellow' } },
        'Figma Link': { url: 'https://figma.com/file/s25-features-15s' }
      }
    }
  ]
};

const MOCK_PAGE_CONTENT = {
  'page-002': {
    blocks: [
      { type: 'heading_1', content: 'Campaign Setup Standard Operating Procedure' },
      { type: 'paragraph', content: 'This document outlines the step-by-step process for setting up new advertising campaigns across all DSPs.' },
      { type: 'heading_2', content: '1. Pre-Setup Checklist' },
      { type: 'bulleted_list_item', content: 'Confirm budget and flight dates with Media Planner' },
      { type: 'bulleted_list_item', content: 'Verify creative assets are approved and specs are correct' },
      { type: 'bulleted_list_item', content: 'Obtain targeting parameters and audience lists' },
      { type: 'bulleted_list_item', content: 'Confirm pixel/tracking implementation' },
      { type: 'heading_2', content: '2. DSP Setup Steps' },
      { type: 'paragraph', content: 'Follow the DSP-specific guides below for detailed setup instructions.' },
      { type: 'callout', content: '⚠️ Always double-check targeting before launching to avoid waste' }
    ]
  },
  'page-003': {
    blocks: [
      { type: 'heading_1', content: 'Galaxy S25 Launch Campaign Playbook' },
      { type: 'callout', content: '📱 Launch Date: January 15, 2026 | Total Budget: $500K | Primary KPI: Awareness' },
      { type: 'heading_2', content: 'Campaign Overview' },
      { type: 'paragraph', content: 'Multi-channel awareness campaign for the Galaxy S25 flagship launch, targeting tech enthusiasts and mobile upgraders.' },
      { type: 'heading_2', content: 'Channel Allocation' },
      { type: 'bulleted_list_item', content: 'CTV: 40% ($200K) - Premium streaming inventory' },
      { type: 'bulleted_list_item', content: 'OLV: 30% ($150K) - YouTube + programmatic video' },
      { type: 'bulleted_list_item', content: 'Display: 20% ($100K) - High-impact formats' },
      { type: 'bulleted_list_item', content: 'Audio: 10% ($50K) - Podcast sponsorships' },
      { type: 'heading_2', content: 'Key Milestones' },
      { type: 'numbered_list_item', content: 'Jan 10: All creatives approved' },
      { type: 'numbered_list_item', content: 'Jan 12: DSP campaigns set up and QA\'d' },
      { type: 'numbered_list_item', content: 'Jan 15: Launch Day - all campaigns live' },
      { type: 'numbered_list_item', content: 'Jan 22: First week performance review' },
      { type: 'numbered_list_item', content: 'Feb 15: Mid-flight optimization' }
    ]
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
    features: ['Pages', 'Databases', 'Search', 'Blocks', 'Rich Text'],
    useCases: ['Playbooks/SOPs', 'Campaign Tracker', 'Meeting Notes', 'Knowledge Base']
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  // Try real API first, fall back to mock
  const apiClient = require('./api-client');
  
  if (apiClient.hasNotion) {
    try {
      return await handleRealApiCall(apiClient.notion, toolName, params);
    } catch (err) {
      console.error(`[Notion] Real API error, falling back to mock: ${err.message}`);
    }
  }
  
  // Mock fallback
  await simulateLatency();
  switch (toolName) {
    case 'notion_search':
      return search(params.query, params.filter, params.sort);
    case 'notion_get_page':
      return getPage(params.page_id);
    case 'notion_create_page':
      return createPage(params);
    case 'notion_update_page':
      return updatePage(params);
    case 'notion_query_database':
      return queryDatabase(params);
    case 'notion_add_block':
      return addBlock(params);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function handleRealApiCall(api, toolName, params) {
  switch (toolName) {
    case 'notion_search':
      return api.search(params.query, params.filter ? { filter: params.filter } : {});
      
    case 'notion_get_page':
      return api.getPage(params.page_id);
      
    case 'notion_create_page':
      return api.createPage({
        parent: params.parent_id 
          ? { page_id: params.parent_id }
          : { database_id: params.database_id },
        properties: params.properties || {},
        children: params.content ? [{ 
          type: 'paragraph', 
          paragraph: { rich_text: [{ text: { content: params.content } }] } 
        }] : []
      });
      
    case 'notion_update_page':
      return api.updatePage(params.page_id, params.properties);
      
    case 'notion_query_database':
      return api.queryDatabase(params.database_id, params.filter, params.sorts);
      
    case 'notion_add_block':
      return api.appendBlock(params.page_id, [{
        type: params.type || 'paragraph',
        [params.type || 'paragraph']: {
          rich_text: [{ text: { content: params.content } }]
        }
      }]);
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Search pages and databases
 */
function search(query, filter, sort) {
  const q = query.toLowerCase();
  let results = [];
  
  // Search pages
  if (!filter || filter.value !== 'database') {
    const matchingPages = MOCK_PAGES.filter(p => {
      const title = p.properties.title.title[0]?.text?.content?.toLowerCase() || '';
      return title.includes(q);
    });
    results.push(...matchingPages);
  }
  
  // Search databases
  if (!filter || filter.value !== 'page') {
    const matchingDbs = MOCK_DATABASES.filter(d => {
      const title = d.title[0]?.text?.content?.toLowerCase() || '';
      return title.includes(q);
    });
    results.push(...matchingDbs);
  }
  
  // Apply sort
  if (sort?.direction === 'descending') {
    results.sort((a, b) => new Date(b.last_edited_time) - new Date(a.last_edited_time));
  } else if (sort?.direction === 'ascending') {
    results.sort((a, b) => new Date(a.last_edited_time) - new Date(b.last_edited_time));
  }
  
  return {
    object: 'list',
    results,
    has_more: false
  };
}

/**
 * Get page with content
 */
function getPage(pageId) {
  const page = MOCK_PAGES.find(p => p.id === pageId);
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }
  
  const content = MOCK_PAGE_CONTENT[pageId];
  
  return {
    ...page,
    content: content?.blocks || []
  };
}

/**
 * Create new page
 */
function createPage(params) {
  const newPage = {
    id: `page-${Date.now()}`,
    object: 'page',
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    parent: { 
      type: params.parent_type || 'page_id', 
      [params.parent_type || 'page_id']: params.parent_id 
    },
    archived: false,
    properties: {
      title: { title: [{ text: { content: params.title } }] },
      ...params.properties
    },
    icon: null,
    url: `https://notion.so/adops/${params.title.toLowerCase().replace(/\s+/g, '-')}-xxx`
  };
  
  MOCK_PAGES.push(newPage);
  
  // Add content if provided
  if (params.content) {
    MOCK_PAGE_CONTENT[newPage.id] = { blocks: params.content };
  }
  
  return newPage;
}

/**
 * Update page properties
 */
function updatePage(params) {
  const page = MOCK_PAGES.find(p => p.id === params.page_id);
  if (!page) {
    throw new Error(`Page not found: ${params.page_id}`);
  }
  
  if (params.properties) {
    Object.assign(page.properties, params.properties);
  }
  
  if (params.archived !== undefined) {
    page.archived = params.archived;
  }
  
  page.last_edited_time = new Date().toISOString();
  
  return page;
}

/**
 * Query database with filters
 */
function queryDatabase(params) {
  const entries = MOCK_DATABASE_ENTRIES[params.database_id] || [];
  let results = [...entries];
  
  // Apply filters (simplified)
  if (params.filter) {
    // Real implementation would parse complex filter objects
    // This is a simplified version
    if (params.filter.property && params.filter.select) {
      results = results.filter(e => {
        const prop = e.properties[params.filter.property];
        return prop?.select?.name === params.filter.select.equals;
      });
    }
  }
  
  // Apply sorts
  if (params.sorts && params.sorts.length > 0) {
    const sort = params.sorts[0];
    results.sort((a, b) => {
      const aVal = a.properties[sort.property];
      const bVal = b.properties[sort.property];
      const direction = sort.direction === 'descending' ? -1 : 1;
      
      if (aVal?.date?.start && bVal?.date?.start) {
        return direction * (new Date(aVal.date.start) - new Date(bVal.date.start));
      }
      return 0;
    });
  }
  
  // Apply page size
  if (params.page_size) {
    results = results.slice(0, params.page_size);
  }
  
  return {
    object: 'list',
    results,
    has_more: false
  };
}

/**
 * Add block to page
 */
function addBlock(params) {
  const { page_id, block_type, content, after } = params;
  
  if (!MOCK_PAGE_CONTENT[page_id]) {
    MOCK_PAGE_CONTENT[page_id] = { blocks: [] };
  }
  
  const newBlock = {
    id: `block-${Date.now()}`,
    type: block_type,
    content,
    created_time: new Date().toISOString()
  };
  
  if (after) {
    const idx = MOCK_PAGE_CONTENT[page_id].blocks.findIndex(b => b.id === after);
    if (idx >= 0) {
      MOCK_PAGE_CONTENT[page_id].blocks.splice(idx + 1, 0, newBlock);
    } else {
      MOCK_PAGE_CONTENT[page_id].blocks.push(newBlock);
    }
  } else {
    MOCK_PAGE_CONTENT[page_id].blocks.push(newBlock);
  }
  
  return newBlock;
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
  search,
  getPage,
  createPage,
  updatePage,
  queryDatabase,
  addBlock
};
