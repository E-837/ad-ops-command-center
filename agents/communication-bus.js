/**
 * Agent Communication Bus
 * Event-based A2A messaging with persistent message logging.
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CommunicationBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.subscribers = new Map();
    this.messageLogPath = options.messageLogPath || path.join(process.cwd(), 'database', 'data', 'agent-messages.json');
    this.defaultMaxMessages = Number(options.defaultMaxMessages || 10);
    this.sessions = new Map(); // queryId -> { maxMessages, count }

    this.#ensureLogFile();
  }

  subscribe(agent, handler) {
    if (!agent || typeof handler !== 'function') {
      throw new Error('subscribe(agent, handler) requires a valid agent and handler');
    }

    const agentId = typeof agent === 'string' ? agent : agent.id;
    if (!agentId) throw new Error('Agent must have an id');

    this.subscribers.set(agentId, handler);
    this.emit('subscribed', { agent: agentId, timestamp: new Date().toISOString() });

    return () => this.subscribers.delete(agentId);
  }

  startSession(queryId, maxMessages = this.defaultMaxMessages) {
    if (!queryId) return;
    this.sessions.set(queryId, { maxMessages, count: 0 });
  }

  endSession(queryId) {
    if (!queryId) return;
    this.sessions.delete(queryId);
  }

  send(fromAgent, toAgent, message = {}) {
    const msg = this.#buildMessage(fromAgent, toAgent, message);
    this.#assertMessageLimit(msg);
    this.#logMessage(msg);

    const handler = this.subscribers.get(msg.to);
    if (!handler) {
      return { delivered: false, message: msg, error: `Agent not subscribed: ${msg.to}` };
    }

    try {
      handler(msg);
      this.emit('message', msg);
      return { delivered: true, message: msg };
    } catch (error) {
      this.emit('error', error);
      return { delivered: false, message: msg, error: error.message };
    }
  }

  broadcast(fromAgent, message = {}) {
    const fromId = this.#normalizeAgentId(fromAgent);
    const recipients = [...this.subscribers.keys()].filter((id) => id !== fromId);

    return recipients.map((recipient) => this.send(fromId, recipient, message));
  }

  getMessages({ queryId, limit } = {}) {
    try {
      const messages = JSON.parse(fs.readFileSync(this.messageLogPath, 'utf8'));
      let filtered = Array.isArray(messages) ? messages : [];
      if (queryId) {
        filtered = filtered.filter((m) => m?.payload?.queryId === queryId || m?.queryId === queryId);
      }
      if (limit && Number.isFinite(limit)) {
        filtered = filtered.slice(-Math.max(0, Number(limit)));
      }
      return filtered;
    } catch {
      return [];
    }
  }

  #buildMessage(fromAgent, toAgent, message) {
    const from = this.#normalizeAgentId(fromAgent);
    const to = this.#normalizeAgentId(toAgent);

    if (!from || !to) {
      throw new Error('send(fromAgent, toAgent, message) requires valid from/to agent identifiers');
    }

    const msgObj = typeof message === 'string'
      ? { type: 'text', payload: { text: message } }
      : { ...message };

    return {
      id: msgObj.id || crypto.randomUUID(),
      from,
      to,
      type: msgObj.type || 'request',
      payload: msgObj.payload || {},
      timestamp: msgObj.timestamp || new Date().toISOString(),
      ...(msgObj.queryId ? { queryId: msgObj.queryId } : {})
    };
  }

  #normalizeAgentId(agent) {
    if (!agent) return null;
    if (typeof agent === 'string') return agent;
    if (typeof agent === 'object') return agent.id || agent.role || null;
    return null;
  }

  #assertMessageLimit(message) {
    const queryId = message.queryId || message.payload?.queryId;
    if (!queryId) return;

    const session = this.sessions.get(queryId) || { maxMessages: this.defaultMaxMessages, count: 0 };
    if (session.count >= session.maxMessages) {
      throw new Error(`A2A message limit reached for query ${queryId} (${session.maxMessages})`);
    }

    session.count += 1;
    this.sessions.set(queryId, session);
  }

  #ensureLogFile() {
    const dir = path.dirname(this.messageLogPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.messageLogPath)) fs.writeFileSync(this.messageLogPath, '[]', 'utf8');
  }

  #logMessage(message) {
    try {
      const current = JSON.parse(fs.readFileSync(this.messageLogPath, 'utf8'));
      const messages = Array.isArray(current) ? current : [];
      messages.push(message);
      fs.writeFileSync(this.messageLogPath, JSON.stringify(messages, null, 2), 'utf8');
    } catch {
      fs.writeFileSync(this.messageLogPath, JSON.stringify([message], null, 2), 'utf8');
    }
  }
}

module.exports = new CommunicationBus();
module.exports.CommunicationBus = CommunicationBus;
