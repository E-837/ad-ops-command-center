/**
 * Real-time Client
 * SSE client for real-time updates
 */

class RealtimeClient {
  constructor(filters = {}) {
    this.filters = filters;
    this.eventSource = null;
    this.handlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.connected = false;
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
    
    this.connect();
  }

  /**
   * Connect to SSE stream
   */
  connect() {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (this.filters.eventTypes && Array.isArray(this.filters.eventTypes)) {
        queryParams.append('eventTypes', this.filters.eventTypes.join(','));
      }
      
      if (this.filters.workflowId) {
        queryParams.append('workflowId', this.filters.workflowId);
      }
      
      if (this.filters.executionId) {
        queryParams.append('executionId', this.filters.executionId);
      }
      
      if (this.filters.projectId) {
        queryParams.append('projectId', this.filters.projectId);
      }
      
      const url = `/api/stream${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log('[Realtime] Connecting to SSE:', url);
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        console.log('[Realtime] Connected to SSE stream');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Call connection callbacks
        this.connectionCallbacks.forEach(callback => callback());
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (err) {
          console.error('[Realtime] Error parsing event:', err);
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('[Realtime] SSE error:', error);
        this.connected = false;
        
        // Call disconnection callbacks
        this.disconnectionCallbacks.forEach(callback => callback());
        
        // Attempt to reconnect
        this.eventSource.close();
        this.attemptReconnect();
      };
      
    } catch (err) {
      console.error('[Realtime] Failed to connect:', err);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnect attempts reached. Falling back to polling.');
      this.startPollingFallback();
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start polling fallback
   */
  startPollingFallback() {
    console.log('[Realtime] Starting polling fallback');
    
    // Poll every 5 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for recent events
        const response = await fetch('/api/events?limit=10&since=' + new Date(Date.now() - 10000).toISOString());
        const events = await response.json();
        
        events.forEach(event => {
          this.handleEvent({
            type: event.type,
            data: event.payload
          });
        });
        
      } catch (err) {
        console.error('[Realtime] Polling error:', err);
      }
    }, 5000);
  }

  /**
   * Handle incoming event
   */
  handleEvent(event) {
    // Call wildcard handlers
    if (this.handlers['*']) {
      this.handlers['*'].forEach(handler => handler(event));
    }
    
    // Call specific event handlers
    if (this.handlers[event.type]) {
      this.handlers[event.type].forEach(handler => handler(event.data || event));
    }
  }

  /**
   * Register event handler
   * @param {string} eventType - Event type to listen for (use '*' for all events)
   * @param {Function} handler - Handler function
   */
  on(eventType, handler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }

  /**
   * Remove event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Handler function to remove
   */
  off(eventType, handler) {
    if (!this.handlers[eventType]) return;
    
    const index = this.handlers[eventType].indexOf(handler);
    if (index > -1) {
      this.handlers[eventType].splice(index, 1);
    }
  }

  /**
   * Register connection callback
   * @param {Function} callback - Callback function
   */
  onConnect(callback) {
    this.connectionCallbacks.push(callback);
    
    // Call immediately if already connected
    if (this.connected) {
      callback();
    }
  }

  /**
   * Register disconnection callback
   * @param {Function} callback - Callback function
   */
  onDisconnect(callback) {
    this.disconnectionCallbacks.push(callback);
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect() {
    console.log('[Realtime] Disconnecting from SSE');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.connected = false;
  }

  /**
   * Update filters
   * @param {Object} newFilters - New filters
   */
  updateFilters(newFilters) {
    this.filters = newFilters;
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

/**
 * Debounce function for chart updates
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Intersection Observer for lazy chart loading
 * Only update charts that are visible
 */
class VisibilityManager {
  constructor() {
    this.observers = new Map();
    
    if ('IntersectionObserver' in window) {
      this.supported = true;
    } else {
      this.supported = false;
      console.warn('[VisibilityManager] IntersectionObserver not supported');
    }
  }

  /**
   * Observe a chart element
   * @param {string} elementId - Element ID to observe
   * @param {Function} onVisible - Callback when visible
   * @param {Function} onHidden - Callback when hidden
   */
  observe(elementId, onVisible, onHidden) {
    if (!this.supported) {
      // If not supported, assume always visible
      onVisible();
      return;
    }
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[VisibilityManager] Element ${elementId} not found`);
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (onVisible) onVisible();
        } else {
          if (onHidden) onHidden();
        }
      });
    }, {
      threshold: 0.1 // Trigger when at least 10% visible
    });
    
    observer.observe(element);
    this.observers.set(elementId, observer);
  }

  /**
   * Stop observing an element
   * @param {string} elementId - Element ID
   */
  unobserve(elementId) {
    const observer = this.observers.get(elementId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(elementId);
    }
  }

  /**
   * Disconnect all observers
   */
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export for use in other scripts
window.RealtimeClient = RealtimeClient;
window.debounce = debounce;
window.VisibilityManager = VisibilityManager;
