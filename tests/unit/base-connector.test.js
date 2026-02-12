/**
 * Unit Tests: BaseConnector
 */

const BaseConnector = require('../../connectors/base-connector');

// Create a test connector for testing
class TestConnector extends BaseConnector {
  constructor() {
    super({
      name: 'Test Platform',
      shortName: 'Test',
      version: '1.0.0',
      oauth: {
        provider: 'test',
        scopes: ['read', 'write'],
        apiEndpoint: 'https://api.test.com/v1',
        tokenType: 'bearer',
        accountIdKey: 'TEST_ACCOUNT_ID'
      },
      envVars: ['TEST_ACCESS_TOKEN', 'TEST_ACCOUNT_ID'],
      connectionCheck: (creds) => !!(creds.TEST_ACCESS_TOKEN && creds.TEST_ACCOUNT_ID)
    });
    
    this.tools = [
      { name: 'test_tool', description: 'A test tool' }
    ];
  }
  
  async performConnectionTest() {
    return { message: 'Test connection successful' };
  }
  
  async executeLiveCall(toolName, params) {
    return this.successResponse({ message: `Live ${toolName}`, params });
  }
  
  async executeSandboxCall(toolName, params) {
    return this.successResponse({ message: `Sandbox ${toolName}`, params });
  }
}

describe('BaseConnector', () => {
  let connector;
  
  beforeEach(() => {
    connector = new TestConnector();
  });
  
  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(connector.name).toBe('Test Platform');
      expect(connector.shortName).toBe('Test');
      expect(connector.version).toBe('1.0.0');
      expect(connector.status).toBe('ready');
    });
    
    it('should load environment variables', () => {
      expect(connector.env).toBeDefined();
      expect(typeof connector.env).toBe('object');
    });
    
    it('should set OAuth configuration', () => {
      expect(connector.oauth.provider).toBe('test');
      expect(connector.oauth.scopes).toEqual(['read', 'write']);
      expect(connector.oauth.apiEndpoint).toBe('https://api.test.com/v1');
    });
  });
  
  describe('getInfo()', () => {
    it('should return connector information', () => {
      const info = connector.getInfo();
      
      expect(info.name).toBe('Test Platform');
      expect(info.shortName).toBe('Test');
      expect(info.version).toBe('1.0.0');
      expect(info.status).toBe('ready');
      expect(info.toolCount).toBe(1);
      expect(info.oauth).toBeDefined();
    });
  });
  
  describe('testConnection()', () => {
    it('should test connection successfully', async () => {
      const result = await connector.testConnection();
      
      expect(result.connected).toBeDefined();
      expect(result.mode).toBeDefined();
    });
  });
  
  describe('callTool()', () => {
    it('should route tool calls correctly', async () => {
      const result = await connector.callTool('test_tool', { param: 'value' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.connector).toBe('Test');
    });
    
    it('should return error for unknown tool', async () => {
      const result = await connector.callTool('unknown_tool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
  
  describe('handleToolCall() - backward compatibility', () => {
    it('should work as alias for callTool', async () => {
      const result = await connector.handleToolCall('test_tool', { param: 'value' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
  
  describe('response helpers', () => {
    it('successResponse() should format correctly', () => {
      const response = connector.successResponse({ data: 'test' });
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ data: 'test' });
      expect(response.metadata.connector).toBe('Test');
      expect(response.metadata.timestamp).toBeDefined();
    });
    
    it('errorResponse() should format correctly', () => {
      const response = connector.errorResponse('Test error');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test error');
      expect(response.metadata.connector).toBe('Test');
    });
  });
  
  describe('getTools()', () => {
    it('should return tool definitions', () => {
      const tools = connector.getTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('test_tool');
    });
  });
  
  describe('setStatus()', () => {
    it('should update connector status', () => {
      connector.setStatus('syncing');
      expect(connector.status).toBe('syncing');
      
      connector.setStatus('error');
      expect(connector.status).toBe('error');
    });
  });
  
  describe('updateLastSync()', () => {
    it('should update lastSync timestamp', () => {
      expect(connector.lastSync).toBeNull();
      
      connector.updateLastSync();
      
      expect(connector.lastSync).toBeDefined();
      expect(typeof connector.lastSync).toBe('string');
      expect(new Date(connector.lastSync)).toBeInstanceOf(Date);
    });
  });
});
