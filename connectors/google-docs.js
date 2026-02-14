/**
 * Google Docs Connector
 * Integration with google-docs MCP for Docs/Sheets workflows
 */

const mcpBridge = require('./mcp-bridge');

const name = 'Google Docs';
const shortName = 'Google Docs';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Cache for 60 seconds to match mcp-bridge cache TTL
let useMCP;
let lastCheck = 0;
const CHECK_INTERVAL = 60000; // 60 seconds

function isMCPAvailable() {
  const now = Date.now();
  
  // Re-check if cache expired or never checked
  if (typeof useMCP !== 'boolean' || (now - lastCheck) > CHECK_INTERVAL) {
    useMCP = mcpBridge.googleDocs.isAvailable();
    lastCheck = now;
  }
  
  return useMCP;
}

const oauth = {
  provider: 'google-docs',
  scopes: ['documents', 'spreadsheets', 'drive'],
  mcpEndpoint: 'google-docs',
  connected: false,
  accessToken: null
};

const tools = [
  { name: 'google_docs_create_doc', description: 'Create a Google Doc', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, parentFolderId: { type: 'string' } }, required: ['title'] } },
  { name: 'google_docs_get_doc', description: 'Read a Google Doc', inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, format: { type: 'string' }, maxLength: { type: 'number' } }, required: ['documentId'] } },
  { name: 'google_docs_update_doc', description: 'Append text to a Google Doc', inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, text: { type: 'string' } }, required: ['documentId', 'text'] } },
  { name: 'google_docs_create_sheet', description: 'Create a Google Sheet', inputSchema: { type: 'object', properties: { title: { type: 'string' }, parentFolderId: { type: 'string' }, initialData: { type: 'array' } }, required: ['title'] } },
  { name: 'google_docs_get_sheet', description: 'Read a Google Sheet range', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' } }, required: ['spreadsheetId'] } }
];

function getInfo() {
  return {
    name,
    shortName,
    version,
    status,
    lastSync,
    mcpEndpoint: oauth.mcpEndpoint,
    connected: isMCPAvailable(),
    connectionType: isMCPAvailable() ? 'mcp' : 'mock',
    statusLabel: isMCPAvailable() ? 'Connected via MCP' : 'Mock data',
    features: ['Google Docs', 'Google Sheets', 'Drive Files'],
    useCases: ['Report Drafting', 'Media Plans', 'Budget Tracking']
  };
}

async function handleToolCall(toolName, params = {}) {
  lastSync = new Date().toISOString();

  if (isMCPAvailable()) {
    try {
      let result;
      switch (toolName) {
        case 'google_docs_create_doc':
          result = await mcpBridge.googleDocs.createDoc(params);
          break;
        case 'google_docs_get_doc':
          result = await mcpBridge.googleDocs.getDoc(params);
          break;
        case 'google_docs_update_doc':
          result = await mcpBridge.googleDocs.updateDoc(params);
          break;
        case 'google_docs_create_sheet':
          result = await mcpBridge.googleDocs.createSheet(params);
          break;
        case 'google_docs_get_sheet':
          result = await mcpBridge.googleDocs.getSheet(params);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      if (result && result.success) {
        return { success: true, data: result.data, mode: 'mcp' };
      }
    } catch (err) {
      console.error(`[Google Docs] MCP error, falling back to mock: ${err.message}`);
    }
  }

  return mockToolCall(toolName, params);
}

function mockToolCall(toolName, params) {
  switch (toolName) {
    case 'google_docs_create_doc':
      return { success: true, mode: 'mock', data: { documentId: `mock-doc-${Date.now()}`, title: params.title, url: 'https://docs.google.com/document/d/mock' } };
    case 'google_docs_get_doc':
      return { success: true, mode: 'mock', data: { documentId: params.documentId, content: 'Mock Google Doc content', format: params.format || 'text' } };
    case 'google_docs_update_doc':
      return { success: true, mode: 'mock', data: { documentId: params.documentId, appended: params.text, updated: true } };
    case 'google_docs_create_sheet':
      return { success: true, mode: 'mock', data: { spreadsheetId: `mock-sheet-${Date.now()}`, title: params.title, url: 'https://docs.google.com/spreadsheets/d/mock' } };
    case 'google_docs_get_sheet':
      return { success: true, mode: 'mock', data: { spreadsheetId: params.spreadsheetId, range: params.range || 'A1:Z1000', values: [['Mock', 'Data']] } };
    default:
      throw new Error(`Unknown tool: ${toolName}`);
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
  getInfo,
  handleToolCall
};
