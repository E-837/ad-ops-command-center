// errors.js - Error handling, toast notifications, and error boundary

class ErrorManager {
  constructor() {
    this.toasts = [];
    this.maxToasts = 5;
    this.init();
  }

  init() {
    // Create toast container
    this.toastContainer = this.createToastContainer();
    document.body.appendChild(this.toastContainer);

    // Set up global error boundary
    this.setupErrorBoundary();
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    `;
    return container;
  }

  // Show toast notification
  showToast(message, type = 'info', duration = 5000) {
    const toast = this.createToast(message, type);
    
    // Remove oldest toast if we have too many
    if (this.toasts.length >= this.maxToasts) {
      this.removeToast(this.toasts[0]);
    }
    
    this.toastContainer.appendChild(toast);
    this.toasts.push(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.removeToast(toast), duration);
    }
    
    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '⚠️',
      warning: '⚡',
      info: 'ℹ️'
    };
    
    const colors = {
      success: 'rgba(16, 185, 129, 0.2)',
      error: 'rgba(239, 68, 68, 0.2)',
      warning: 'rgba(245, 158, 11, 0.2)',
      info: 'rgba(59, 130, 246, 0.2)'
    };
    
    const borderColors = {
      success: 'rgba(16, 185, 129, 0.4)',
      error: 'rgba(239, 68, 68, 0.4)',
      warning: 'rgba(245, 158, 11, 0.4)',
      info: 'rgba(59, 130, 246, 0.4)'
    };
    
    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      border: 1px solid ${borderColors[type] || borderColors.info};
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    `;
    
    toast.innerHTML = `
      <span class="toast-icon" style="font-size: 20px; flex-shrink: 0;">${icons[type] || icons.info}</span>
      <span class="toast-message" style="flex: 1; font-size: 14px;">${message}</span>
      <button class="toast-close" style="
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      ">&times;</button>
    `;
    
    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToast(toast);
    });
    
    // Close on toast click
    toast.addEventListener('click', () => {
      this.removeToast(toast);
    });
    
    // Hover styles
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.color = '#fff';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'none';
      closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
    });
    
    return toast;
  }

  removeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  // Convenience methods
  success(message, duration) {
    return this.showToast(message, 'success', duration);
  }

  error(message, duration) {
    return this.showToast(message, 'error', duration);
  }

  warning(message, duration) {
    return this.showToast(message, 'warning', duration);
  }

  info(message, duration) {
    return this.showToast(message, 'info', duration);
  }

  // Create inline error message
  static createInlineError(message, options = {}) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.style.cssText = `
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fca5a5;
      margin: 12px 0;
      animation: fadeIn 0.3s ease;
    `;
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon';
    iconSpan.textContent = '⚠️';
    iconSpan.style.fontSize = '20px';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = message;
    textSpan.style.flex = '1';
    
    error.appendChild(iconSpan);
    error.appendChild(textSpan);
    
    if (options.retry) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-btn';
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = `
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fff;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      `;
      
      retryBtn.addEventListener('mouseenter', () => {
        retryBtn.style.background = 'rgba(239, 68, 68, 0.3)';
      });
      
      retryBtn.addEventListener('mouseleave', () => {
        retryBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      });
      
      retryBtn.addEventListener('click', options.retry);
      error.appendChild(retryBtn);
    }
    
    return error;
  }

  // Show error in element
  static showError(element, message, options = {}) {
    const error = ErrorManager.createInlineError(message, options);
    element.innerHTML = '';
    element.appendChild(error);
  }

  // Setup global error boundary
  setupErrorBoundary() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      
      // Don't show errors in development
      if (window.location.hostname === 'localhost') {
        return;
      }
      
      this.error('Something went wrong. Please try refreshing the page.');
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.location.hostname === 'localhost') {
        return;
      }
      
      this.error('An unexpected error occurred. Please try again.');
    });
  }

  // Show full-page error
  showErrorPage(message, options = {}) {
    const errorPage = document.createElement('div');
    errorPage.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(17, 24, 39, 0.98);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.3s ease;
    `;
    
    errorPage.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <div style="font-size: 64px; margin-bottom: 20px;">😞</div>
        <h1 style="color: #fff; font-size: 24px; margin-bottom: 12px;">Oops! Something went wrong</h1>
        <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 24px;">${message}</p>
        ${options.showRefresh ? `
          <button onclick="window.location.reload()" style="
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
          ">Refresh Page</button>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(errorPage);
  }

  // API error handler
  static async handleApiError(response) {
    let message = 'An error occurred';
    
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch (e) {
      message = `Error ${response.status}: ${response.statusText}`;
    }
    
    return message;
  }

  // Fetch with error handling
  static async fetchWithErrors(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const message = await ErrorManager.handleApiError(response);
        throw new Error(message);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      errorManager.error(error.message || 'Failed to fetch data');
      throw error;
    }
  }

  // Form validation error
  static showFieldError(input, message) {
    // Remove existing error
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add error class to input
    input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    input.classList.add('shake');
    
    // Create error message
    const error = document.createElement('div');
    error.className = 'field-error';
    error.style.cssText = `
      color: #fca5a5;
      font-size: 12px;
      margin-top: 4px;
      animation: fadeIn 0.3s ease;
    `;
    error.textContent = message;
    
    input.parentElement.appendChild(error);
    
    // Remove shake animation
    setTimeout(() => input.classList.remove('shake'), 500);
    
    // Clear error on input
    input.addEventListener('input', function clearError() {
      input.style.borderColor = '';
      if (error.parentElement) {
        error.remove();
      }
      input.removeEventListener('input', clearError);
    }, { once: true });
  }

  // Clear all field errors in form
  static clearFormErrors(form) {
    form.querySelectorAll('.field-error').forEach(error => error.remove());
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.style.borderColor = '';
    });
  }

  // Validate form
  static validateForm(form) {
    let isValid = true;
    ErrorManager.clearFormErrors(form);
    
    form.querySelectorAll('[required]').forEach(input => {
      if (!input.value.trim()) {
        ErrorManager.showFieldError(input, 'This field is required');
        isValid = false;
      }
    });
    
    form.querySelectorAll('[type="email"]').forEach(input => {
      if (input.value && !input.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        ErrorManager.showFieldError(input, 'Please enter a valid email');
        isValid = false;
      }
    });
    
    form.querySelectorAll('[type="url"]').forEach(input => {
      if (input.value && !input.value.match(/^https?:\/\/.+/)) {
        ErrorManager.showFieldError(input, 'Please enter a valid URL');
        isValid = false;
      }
    });
    
    form.querySelectorAll('[type="number"]').forEach(input => {
      if (input.value) {
        const num = parseFloat(input.value);
        if (isNaN(num)) {
          ErrorManager.showFieldError(input, 'Please enter a valid number');
          isValid = false;
        } else {
          if (input.min && num < parseFloat(input.min)) {
            ErrorManager.showFieldError(input, `Must be at least ${input.min}`);
            isValid = false;
          }
          if (input.max && num > parseFloat(input.max)) {
            ErrorManager.showFieldError(input, `Must be at most ${input.max}`);
            isValid = false;
          }
        }
      }
    });
    
    return isValid;
  }
}

// Export singleton instance
const errorManager = new ErrorManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorManager, errorManager };
}
