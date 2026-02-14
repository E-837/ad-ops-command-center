/**
 * Base Agent class with opt-in A2A messaging hooks.
 */

const communicationBus = require('./communication-bus');

class BaseAgent {
  constructor(config = {}) {
    this.id = config.id || config.role;
    this.name = config.name || this.id;
    this.role = config.role || this.id;
    this.description = config.description || '';
    this.model = config.model || 'gpt-5.3-codex';
    this.capabilities = config.capabilities || [];
    this.tools = config.tools || [];
    this.systemPrompt = config.systemPrompt || '';
    this.bus = config.bus || communicationBus;

    this.bus.subscribe(this.id, (message) => this.receiveMessage(message));
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      description: this.description,
      model: this.model,
      capabilities: this.capabilities,
      tools: this.tools
    };
  }

  sendMessage(to, message) {
    return this.bus.send(this.id, to, message);
  }

  broadcastMessage(message) {
    return this.bus.broadcast(this.id, message);
  }

  async receiveMessage(message) {
    if (!message || typeof message !== 'object') {
      return { status: 'ignored', reason: 'Invalid message format' };
    }

    if (message.type === 'query' || message.type === 'request') {
      return this.processQuery(message.payload?.query || '', message.payload?.context || {});
    }

    return { status: 'received', messageId: message.id };
  }

  // Override in derived classes
  async processQuery() {
    throw new Error(`${this.name} must implement processQuery(query, context)`);
  }
}

module.exports = BaseAgent;
