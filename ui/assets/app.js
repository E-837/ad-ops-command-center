/**
 * Ad Ops Command Center - Frontend JavaScript
 */

// API Helper
const api = {
  async get(endpoint) {
    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },
  
  async post(endpoint, data) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }
};

// Format helpers
const format = {
  currency(value) {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
    return '$' + value.toFixed(2);
  },
  
  percent(value) {
    return value.toFixed(1) + '%';
  },
  
  number(value) {
    return value.toLocaleString();
  },
  
  date(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
};

// UI Helpers
const ui = {
  showLoading(elementId) {
    document.getElementById(elementId).innerHTML = 
      '<p class="loading">Loading...</p>';
  },
  
  showError(elementId, message) {
    document.getElementById(elementId).innerHTML = 
      `<p class="error">${message}</p>`;
  },
  
  showEmpty(elementId, message = 'No data available') {
    document.getElementById(elementId).innerHTML = 
      `<p class="empty">${message}</p>`;
  }
};

// Active page highlighting
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

// Export for use in pages
window.api = api;
window.format = format;
window.ui = ui;
