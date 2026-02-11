/**
 * Export Utilities
 * Helper functions for exporting data in various formats
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Filename for download
 * @returns {String} CSV string
 */
function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Build CSV rows
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle special cases
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape strings containing commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Convert data to JSON format
 * @param {*} data - Data to export
 * @param {String} filename - Filename for download
 * @returns {String} JSON string
 */
function exportToJSON(data, filename = 'export.json') {
  if (!data) {
    console.warn('No data to export');
    return '{}';
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    console.error('Error converting to JSON:', err);
    return '{}';
  }
}

/**
 * Download data as file (browser-side)
 * This function is meant to be used in the browser
 * @param {String} content - File content
 * @param {String} filename - Filename
 * @param {String} contentType - MIME type
 */
function downloadFile(content, filename, contentType = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard (browser-side)
 * @param {String} text - Text to copy
 * @returns {Promise<Boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    return false;
  }
}

/**
 * Format number with commas
 * @param {Number} num - Number to format
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted number
 */
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format currency
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format percentage
 * @param {Number} value - Value to format
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted percentage
 */
function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
}

// Node.js exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    exportToCSV,
    exportToJSON,
    formatNumber,
    formatCurrency,
    formatPercent
  };
}

// Browser exports
if (typeof window !== 'undefined') {
  window.ExportUtils = {
    exportToCSV,
    exportToJSON,
    downloadFile,
    copyToClipboard,
    formatNumber,
    formatCurrency,
    formatPercent
  };
}
