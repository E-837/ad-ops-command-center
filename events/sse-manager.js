/**
 * SSE Manager
 * Manages Server-Sent Events connections for real-time updates
 */

class SSEManager {
  constructor() {
    this.clients = new Map(); // Map of response objects to client metadata
    this.eventQueue = []; // Queue for batching events
    this.batchInterval = 100; // Batch events every 100ms (max 10 msgs/sec)
    this.maxQueueSize = 50; // Max events to queue before forcing flush
    this.startBatchProcessor();
  }

  /**
   * Add a new SSE client connection
   * @param {Response} res - Express response object
   * @param {Object} filters - Optional filters for this client
   * @returns {string} clientId
   */
  addClient(res, filters = {}) {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Configure SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();
    
    // Store client
    this.clients.set(res, {
      id: clientId,
      filters,
      connectedAt: new Date().toISOString(),
      lastPing: Date.now(),
      eventsSent: 0
    });
    
    // Send connection confirmation
    this.sendToClient(res, {
      type: 'connected',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        filters
      }
    });
    
    // Setup keepalive ping
    const pingInterval = setInterval(() => {
      if (!this.clients.has(res)) {
        clearInterval(pingInterval);
        return;
      }
      
      try {
        res.write(': ping\n\n');
        const metadata = this.clients.get(res);
        if (metadata) {
          metadata.lastPing = Date.now();
        }
      } catch (err) {
        // Client disconnected
        clearInterval(pingInterval);
        this.removeClient(res);
      }
    }, 30000); // Ping every 30 seconds
    
    // Handle client disconnect
    res.on('close', () => {
      clearInterval(pingInterval);
      this.removeClient(res);
    });
    
    console.log(`[SSE] Client connected: ${clientId} (filters: ${JSON.stringify(filters)})`);
    return clientId;
  }

  /**
   * Remove a client connection
   * @param {Response} res - Express response object
   */
  removeClient(res) {
    const metadata = this.clients.get(res);
    if (metadata) {
      console.log(`[SSE] Client disconnected: ${metadata.id} (sent ${metadata.eventsSent} events)`);
      this.clients.delete(res);
    }
  }

  /**
   * Send event to a specific client
   * @param {Response} res - Express response object
   * @param {Object} event - Event to send
   */
  sendToClient(res, event) {
    try {
      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
      
      const metadata = this.clients.get(res);
      if (metadata) {
        metadata.eventsSent++;
      }
    } catch (err) {
      console.error('[SSE] Error sending to client:', err.message);
      this.removeClient(res);
    }
  }

  /**
   * Broadcast event to all connected clients
   * @param {Object} event - Event to broadcast
   */
  broadcast(event) {
    // Add to queue for batching
    this.eventQueue.push({
      event,
      filterFn: null
    });
    
    // Force flush if queue is too large
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flushQueue();
    }
  }

  /**
   * Broadcast event to filtered subset of clients
   * @param {Object} event - Event to broadcast
   * @param {Function} filterFn - Function that returns true if client should receive event
   */
  broadcastToFiltered(event, filterFn) {
    this.eventQueue.push({
      event,
      filterFn
    });
    
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flushQueue();
    }
  }

  /**
   * Start the batch processor
   */
  startBatchProcessor() {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushQueue();
      }
    }, this.batchInterval);
  }

  /**
   * Flush the event queue
   */
  flushQueue() {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    // Process each queued event
    events.forEach(({ event, filterFn }) => {
      this.clients.forEach((metadata, res) => {
        // Apply filter function if provided
        if (filterFn && !filterFn(metadata)) {
          return;
        }
        
        // Apply client filters
        if (!this.matchesFilters(event, metadata.filters)) {
          return;
        }
        
        this.sendToClient(res, event);
      });
    });
  }

  /**
   * Check if event matches client filters
   * @param {Object} event - Event to check
   * @param {Object} filters - Client filters
   * @returns {boolean}
   */
  matchesFilters(event, filters) {
    // No filters = receive everything
    if (Object.keys(filters).length === 0) {
      return true;
    }
    
    // Filter by event type
    if (filters.eventTypes && !filters.eventTypes.includes(event.type)) {
      return false;
    }
    
    // Filter by workflow ID
    if (filters.workflowId && event.data?.workflowId !== filters.workflowId) {
      return false;
    }
    
    // Filter by execution ID
    if (filters.executionId && event.data?.executionId !== filters.executionId) {
      return false;
    }
    
    // Filter by project ID
    if (filters.projectId && event.data?.projectId !== filters.projectId) {
      return false;
    }
    
    return true;
  }

  /**
   * Get count of active clients
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Get statistics about connected clients
   * @returns {Object}
   */
  getStats() {
    const clients = [];
    this.clients.forEach((metadata, res) => {
      clients.push({
        id: metadata.id,
        connectedAt: metadata.connectedAt,
        eventsSent: metadata.eventsSent,
        lastPing: metadata.lastPing,
        filters: metadata.filters
      });
    });
    
    return {
      activeClients: this.clients.size,
      queuedEvents: this.eventQueue.length,
      clients
    };
  }

  /**
   * Clean up dead connections
   */
  cleanupDeadConnections() {
    const now = Date.now();
    const timeout = 60000; // 60 seconds since last ping
    
    this.clients.forEach((metadata, res) => {
      if (now - metadata.lastPing > timeout) {
        console.log(`[SSE] Cleaning up dead connection: ${metadata.id}`);
        this.removeClient(res);
      }
    });
  }
}

// Singleton instance
const sseManager = new SSEManager();

// Periodic cleanup of dead connections
setInterval(() => {
  sseManager.cleanupDeadConnections();
}, 60000); // Every 60 seconds

module.exports = sseManager;
