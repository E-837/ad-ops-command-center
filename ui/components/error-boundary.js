/**
 * error-boundary.js
 * Global Error Boundary for UI
 * Week 10, Day 44: Error Handling & Edge Cases
 */

const ErrorBoundary = {
  initialized: false,
  errorCount: 0,
  maxErrors: 10,
  errorLog: [],

  /**
   * Initialize error boundary
   */
  init() {
    if (this.initialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event, event);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason, event);
    });

    // Network error handler
    this.interceptFetch();
    this.interceptXHR();

    this.initialized = true;
    console.log('🛡️  Error Boundary initialized');
  },

  /**
   * Handle synchronous errors
   */
  handleError(error, event) {
    console.error('🚨 Uncaught error:', error);
    
    this.errorCount++;
    this.logError({
      type: 'error',
      message: error.message || String(error),
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href
    });

    // Prevent default browser error handling
    if (event) {
      event.preventDefault();
    }

    // Show error UI
    this.showErrorPage({
      title: 'Something went wrong',
      message: 'An unexpected error occurred. The page may not function correctly.',
      error: error.message || String(error),
      canRecover: true,
      showDetails: true
    });

    // Too many errors - suggest refresh
    if (this.errorCount > this.maxErrors) {
      this.showCriticalError();
    }
  },

  /**
   * Handle promise rejections
   */
  handlePromiseRejection(reason, event) {
    console.error('🚨 Unhandled promise rejection:', reason);
    
    this.logError({
      type: 'promise-rejection',
      message: reason?.message || String(reason),
      stack: reason?.stack,
      timestamp: Date.now(),
      url: window.location.href
    });

    // Prevent default handling
    if (event) {
      event.preventDefault();
    }

    // Show toast for promise rejections (less severe than errors)
    this.showToast({
      message: 'Operation failed. Please try again.',
      type: 'error',
      duration: 5000
    });
  },

  /**
   * Intercept fetch to handle network errors
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Handle HTTP errors
        if (!response.ok) {
          this.handleHttpError(response, args[0]);
        }
        
        return response;
      } catch (error) {
        this.handleNetworkError(error, args[0]);
        throw error;
      }
    };
  },

  /**
   * Intercept XMLHttpRequest
   */
  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(...args) {
      this._url = args[1];
      return originalOpen.apply(this, args);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('error', (event) => {
        ErrorBoundary.handleNetworkError(event, this._url);
      });
      
      this.addEventListener('load', () => {
        if (this.status >= 400) {
          ErrorBoundary.handleHttpError({
            status: this.status,
            statusText: this.statusText,
            url: this._url
          }, this._url);
        }
      });
      
      return originalSend.apply(this, args);
    };
  },

  /**
   * Handle HTTP errors
   */
  handleHttpError(response, url) {
    const status = response.status;
    
    if (status === 401 || status === 403) {
      this.showToast({
        message: 'Authentication required. Please log in.',
        type: 'error',
        duration: 5000
      });
    } else if (status === 404) {
      this.showToast({
        message: 'Resource not found.',
        type: 'warning',
        duration: 3000
      });
    } else if (status === 429) {
      this.showToast({
        message: 'Too many requests. Please wait a moment.',
        type: 'warning',
        duration: 5000
      });
    } else if (status >= 500) {
      this.showToast({
        message: 'Server error. Our team has been notified.',
        type: 'error',
        duration: 5000
      });
    }

    this.logError({
      type: 'http-error',
      status,
      statusText: response.statusText,
      url: url || response.url,
      timestamp: Date.now()
    });
  },

  /**
   * Handle network errors
   */
  handleNetworkError(error, url) {
    console.error('🌐 Network error:', error);
    
    this.logError({
      type: 'network-error',
      message: error.message || 'Network request failed',
      url,
      timestamp: Date.now()
    });

    this.showToast({
      message: 'Network error. Please check your connection.',
      type: 'error',
      duration: 5000,
      action: {
        label: 'Retry',
        callback: () => window.location.reload()
      }
    });
  },

  /**
   * Show error page overlay
   */
  showErrorPage({ title, message, error, canRecover, showDetails }) {
    // Remove existing error overlay
    const existing = document.getElementById('error-boundary-overlay');
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'error-boundary-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    `;

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95));
        border: 1px solid rgba(255, 100, 100, 0.3);
        border-radius: 16px;
        padding: 40px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
          <h1 style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
            ${title}
          </h1>
          <p style="color: rgba(255, 255, 255, 0.7); margin: 0; font-size: 16px;">
            ${message}
          </p>
        </div>
        
        ${showDetails && error ? `
          <div style="
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 3px solid #ff6b6b;
          ">
            <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 8px;">
              ERROR DETAILS
            </div>
            <code style="
              color: #ff8080;
              font-family: 'Monaco', 'Courier New', monospace;
              font-size: 13px;
              display: block;
              word-wrap: break-word;
            ">
              ${this.escapeHtml(error)}
            </code>
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="location.reload()" style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
            🔄 Refresh Page
          </button>
          
          ${canRecover ? `
            <button onclick="document.getElementById('error-boundary-overlay').remove()" style="
              background: rgba(255, 255, 255, 0.1);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 14px 28px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
              Continue Anyway
            </button>
          ` : ''}
          
          <button onclick="ErrorBoundary.reportError()" style="
            background: transparent;
            color: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.color='white'; this.style.borderColor='rgba(255, 255, 255, 0.4)'" onmouseout="this.style.color='rgba(255, 255, 255, 0.6)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'">
            📧 Report Issue
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  /**
   * Show critical error (too many errors)
   */
  showCriticalError() {
    this.showErrorPage({
      title: 'Multiple Errors Detected',
      message: 'The application has encountered multiple errors. Please refresh the page.',
      error: `${this.errorCount} errors occurred`,
      canRecover: false,
      showDetails: true
    });
  },

  /**
   * Show toast notification
   */
  showToast({ message, type = 'info', duration = 3000, action }) {
    const container = this.getToastContainer();
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #ee5a6f)' :
                   type === 'warning' ? 'linear-gradient(135deg, #f7b731, #fa8231)' :
                   type === 'success' ? 'linear-gradient(135deg, #2ecc71, #27ae60)' :
                   'linear-gradient(135deg, #667eea, #764ba2)'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      animation: slideIn 0.3s ease;
      min-width: 300px;
      max-width: 500px;
    `;

    const icon = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    }[type];

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <span style="font-size: 20px;">${icon}</span>
        <span style="font-size: 14px; font-weight: 500;">${message}</span>
      </div>
      ${action ? `
        <button onclick="${action.callback}" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        ">
          ${action.label}
        </button>
      ` : ''}
    `;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Get or create toast container
   */
  getToastContainer() {
    let container = document.getElementById('toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999998;
        display: flex;
        flex-direction: column;
      `;
      document.body.appendChild(container);
    }
    
    return container;
  },

  /**
   * Log error for debugging
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo);
    
    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    // Send to server (if error reporting endpoint exists)
    this.sendErrorReport(errorInfo);
  },

  /**
   * Send error report to server
   */
  async sendErrorReport(errorInfo) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...errorInfo,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      });
    } catch (e) {
      // Silent fail - don't create error loop
      console.warn('Failed to send error report:', e);
    }
  },

  /**
   * Report error via email/support
   */
  reportError() {
    const errorData = {
      errors: this.errorLog,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const subject = encodeURIComponent('Ad Ops Command Center - Error Report');
    const body = encodeURIComponent(`
Error Report
============

URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Recent Errors:
${JSON.stringify(this.errorLog, null, 2)}
    `);

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  },

  /**
   * Escape HTML for safe display
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Get error log
   */
  getErrorLog() {
    return this.errorLog;
  },

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    this.errorCount = 0;
  }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ErrorBoundary.init());
} else {
  ErrorBoundary.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}
