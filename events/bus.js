/**
 * Event Bus
 * Pub/sub event system with persistence for workflow orchestration
 */

const EventEmitter = require('events');
const { load, save } = require('../database/init');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.events = [];
    this.maxHistorySize = 1000;
    this.sseManager = null; // Will be set after initialization
    this.loadHistory();
  }

  /**
   * Set SSE manager for broadcasting events
   * (Called after initialization to avoid circular dependency)
   */
  setSSEManager(manager) {
    this.sseManager = manager;
  }

  /**
   * Emit an event with automatic persistence
   */
  emit(type, data = {}) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      source: data.source || 'system',
      payload: data,
      timestamp: new Date().toISOString(),
      triggeredWorkflows: []
    };

    // Add to history
    this.events.push(event);
    
    // Trim history if too large
    if (this.events.length > this.maxHistorySize) {
      this.events = this.events.slice(-this.maxHistorySize);
    }
    
    // Persist to disk
    this.saveHistory();
    
    // Emit to listeners
    super.emit(type, event);
    super.emit('*', event); // Wildcard listener for all events
    
    // Broadcast to SSE clients if manager is available
    if (this.sseManager) {
      this.sseManager.broadcast({
        type,
        data: data
      });
    }
    
    // Broadcast to webhooks (async, don't await)
    this.broadcastToWebhooks(type, data).catch(err => {
      console.error('Error broadcasting to webhooks:', err);
    });
    
    return event;
  }

  /**
   * Broadcast event to registered webhooks
   */
  async broadcastToWebhooks(eventType, data) {
    try {
      const webhooks = require('../integrations/webhooks');
      await webhooks.broadcastToWebhooks(eventType, data);
    } catch (err) {
      // Fail silently if webhook module not available
      console.debug('Webhooks not available:', err.message);
    }
  }

  /**
   * Get event history with optional filtering
   */
  getHistory(filter = {}) {
    let filtered = [...this.events];
    
    // Filter by type
    if (filter.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    
    // Filter by source
    if (filter.source) {
      filtered = filtered.filter(e => e.source === filter.source);
    }
    
    // Filter by workflow
    if (filter.workflowId) {
      filtered = filtered.filter(e => 
        e.payload.workflowId === filter.workflowId ||
        e.source === filter.workflowId
      );
    }
    
    // Filter by project
    if (filter.projectId) {
      filtered = filtered.filter(e => 
        e.payload.projectId === filter.projectId
      );
    }
    
    // Filter by time range
    if (filter.since) {
      const since = new Date(filter.since);
      filtered = filtered.filter(e => new Date(e.timestamp) >= since);
    }
    
    if (filter.until) {
      const until = new Date(filter.until);
      filtered = filtered.filter(e => new Date(e.timestamp) <= until);
    }
    
    // Limit results
    const limit = filter.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Get recent events
   */
  getRecent(count = 50) {
    return this.events.slice(-count);
  }

  /**
   * Get events by type
   */
  getByType(type, limit = 100) {
    return this.getHistory({ type, limit });
  }

  /**
   * Get events by source
   */
  getBySource(source, limit = 100) {
    return this.getHistory({ source, limit });
  }

  /**
   * Get events for a workflow
   */
  getByWorkflow(workflowId, limit = 100) {
    return this.getHistory({ workflowId, limit });
  }

  /**
   * Get events for a project
   */
  getByProject(projectId, limit = 100) {
    return this.getHistory({ projectId, limit });
  }

  /**
   * Clear old events (keep recent N)
   */
  clearOld(keepCount = 500) {
    this.events = this.events.slice(-keepCount);
    this.saveHistory();
  }

  /**
   * Save event history to disk
   */
  saveHistory() {
    save('events', this.events);
  }

  /**
   * Load event history from disk
   */
  loadHistory() {
    this.events = load('events', []);
  }

  /**
   * Get statistics
   */
  getStats() {
    const types = {};
    const sources = {};
    
    this.events.forEach(event => {
      types[event.type] = (types[event.type] || 0) + 1;
      sources[event.source] = (sources[event.source] || 0) + 1;
    });
    
    return {
      total: this.events.length,
      types,
      sources,
      oldest: this.events[0]?.timestamp,
      newest: this.events[this.events.length - 1]?.timestamp
    };
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
