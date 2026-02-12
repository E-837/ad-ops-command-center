/**
 * BaseConnector - Abstract base class for all advertising platform connectors
 * 
 * Extracts common patterns across all connector implementations:
 * - Environment variable loading
 * - OAuth configuration management
 * - Dual-mode switching (live API vs sandbox)
 * - Tool call routing and error handling
 * - Status/health checking
 * - Sandbox response structure
 * 
 * All connectors should extend this class and implement platform-specific logic.
 */

const fs = require('fs');
const path = require('path');

class BaseConnector {
  /**
   * @param {Object} config - Connector configuration
   * @param {string} config.name - Full connector name (e.g., 'Meta Ads')
   * @param {string} config.shortName - Short name (e.g., 'Meta')
   * @param {string} config.version - Version string
   * @param {Object} config.oauth - OAuth configuration
   * @param {string} config.oauth.provider - Provider ID
   * @param {string[]} config.oauth.scopes - Required OAuth scopes
   * @param {string} config.oauth.apiEndpoint - Base API URL
   * @param {string} config.oauth.tokenType - Token type description
   * @param {string[]} config.envVars - Required environment variable names
   * @param {Function} config.connectionCheck - Function to determine if connected
   */
  constructor(config) {
    this.name = config.name;
    this.shortName = config.shortName;
    this.version = config.version || '1.0.0';
    this.status = 'ready';
    this.lastSync = null;
    
    // Load environment variables
    this.env = this.loadEnv();
    
    // Store configuration
    this.envVars = config.envVars || [];
    this.connectionCheckFn = config.connectionCheck;
    
    // Extract credentials from environment
    this.credentials = {};
    config.envVars.forEach(varName => {
      this.credentials[varName] = this.env[varName] || null;
    });
    
    // Determine connection status
    this.isConnected = config.connectionCheck ? config.connectionCheck(this.credentials) : false;
    
    // OAuth configuration
    this.oauth = {
      provider: config.oauth.provider,
      scopes: config.oauth.scopes,
      apiEndpoint: config.oauth.apiEndpoint,
      connected: this.isConnected,
      accountId: this.maskAccountId(config.oauth.accountIdKey),
      tokenType: config.oauth.tokenType
    };
    
    // Tool definitions (to be set by subclass)
    this.tools = [];
  }
  
  /**
   * Load environment variables from config/.env
   * @returns {Object} Environment variables as key-value pairs
   */
  loadEnv() {
    const envPath = path.join(__dirname, '..', 'config', '.env');
    const env = {};
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
        }
      });
    }
    
    return env;
  }
  
  /**
   * Mask account ID for display (show last 4 characters only)
   * @param {string} accountIdKey - Environment variable key for account ID
   * @returns {string|null} Masked account ID
   */
  maskAccountId(accountIdKey) {
    const accountId = this.credentials[accountIdKey];
    if (!accountId) return null;
    
    if (accountId.length > 4) {
      return `***${accountId.slice(-4)}`;
    }
    return accountId;
  }
  
  /**
   * Get connector information
   * @returns {Object} Connector metadata
   */
  getInfo() {
    return {
      name: this.name,
      shortName: this.shortName,
      version: this.version,
      status: this.status,
      lastSync: this.lastSync,
      connected: this.isConnected,
      oauth: this.oauth,
      toolCount: this.tools.length
    };
  }
  
  /**
   * Test connection to the platform
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    if (!this.isConnected) {
      return {
        connected: false,
        mode: 'sandbox',
        message: 'No credentials configured - running in sandbox mode'
      };
    }
    
    try {
      // Subclass should override this to perform actual API check
      const result = await this.performConnectionTest();
      return {
        connected: true,
        mode: 'live',
        ...result
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
  
  /**
   * Perform platform-specific connection test (override in subclass)
   * @returns {Promise<Object>}
   */
  async performConnectionTest() {
    throw new Error('performConnectionTest() must be implemented by subclass');
  }
  
  /**
   * Route and execute a tool call
   * @param {string} toolName - Name of the tool to call
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async callTool(toolName, params = {}) {
    try {
      // Check if tool exists
      const tool = this.tools.find(t => t.name === toolName);
      if (!tool) {
        return this.errorResponse(`Tool '${toolName}' not found`);
      }
      
      // Dual-mode routing: live API or sandbox
      if (this.isConnected) {
        return await this.executeLiveCall(toolName, params);
      } else {
        return await this.executeSandboxCall(toolName, params);
      }
    } catch (error) {
      return this.errorResponse(error.message);
    }
  }
  
  /**
   * Execute live API call (override in subclass)
   * @param {string} toolName
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async executeLiveCall(toolName, params) {
    throw new Error('executeLiveCall() must be implemented by subclass');
  }
  
  /**
   * Execute sandbox mock call (override in subclass)
   * @param {string} toolName
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async executeSandboxCall(toolName, params) {
    throw new Error('executeSandboxCall() must be implemented by subclass');
  }
  
  /**
   * Standard success response wrapper
   * @param {*} data - Response data
   * @param {Object} metadata - Additional metadata
   * @returns {Object}
   */
  successResponse(data, metadata = {}) {
    return {
      success: true,
      data,
      metadata: {
        connector: this.shortName,
        mode: this.isConnected ? 'live' : 'sandbox',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }
  
  /**
   * Standard error response wrapper
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Object}
   */
  errorResponse(message, details = {}) {
    return {
      success: false,
      error: message,
      metadata: {
        connector: this.shortName,
        mode: this.isConnected ? 'live' : 'sandbox',
        timestamp: new Date().toISOString(),
        ...details
      }
    };
  }
  
  /**
   * Refresh OAuth token if needed (override in subclass for platforms that need it)
   * @returns {Promise<boolean>} Success status
   */
  async refreshTokenIfNeeded() {
    // Default: no-op. Override for platforms with token refresh logic.
    return true;
  }
  
  /**
   * Update last sync timestamp
   */
  updateLastSync() {
    this.lastSync = new Date().toISOString();
  }
  
  /**
   * Get all available tools
   * @returns {Array} Tool definitions
   */
  getTools() {
    return this.tools;
  }
  
  /**
   * Set connector status
   * @param {string} newStatus - New status ('ready', 'error', 'syncing', etc.)
   */
  setStatus(newStatus) {
    this.status = newStatus;
  }
}

module.exports = BaseConnector;
