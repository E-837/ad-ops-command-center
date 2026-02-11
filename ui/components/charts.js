/**
 * Chart.js Components
 * Reusable chart components with dark theme
 */

// Dark theme configuration
const darkTheme = {
  backgroundColor: 'rgba(139, 92, 246, 0.1)',
  borderColor: '#8B5CF6',
  pointBackgroundColor: '#8B5CF6',
  pointBorderColor: '#fff',
  color: '#E5E7EB',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  tooltipBackgroundColor: 'rgba(17, 24, 39, 0.9)',
  tooltipBorderColor: '#8B5CF6',
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    size: 12
  }
};

// Color palette for multiple datasets
const colorPalette = [
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316'  // orange
];

/**
 * Create a line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} Chart instance
 */
function createLineChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: options.showLegend !== false,
        labels: {
          color: darkTheme.color,
          font: darkTheme.font
        }
      },
      tooltip: {
        backgroundColor: darkTheme.tooltipBackgroundColor,
        borderColor: darkTheme.tooltipBorderColor,
        borderWidth: 1,
        titleColor: darkTheme.color,
        bodyColor: darkTheme.color
      }
    },
    scales: {
      x: {
        grid: {
          color: darkTheme.gridColor
        },
        ticks: {
          color: darkTheme.color,
          font: darkTheme.font
        }
      },
      y: {
        grid: {
          color: darkTheme.gridColor
        },
        ticks: {
          color: darkTheme.color,
          font: darkTheme.font
        },
        beginAtZero: options.beginAtZero !== false
      }
    }
  };
  
  // Apply dataset styling
  data.datasets = data.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colorPalette[index % colorPalette.length] + '33',
    borderColor: dataset.borderColor || colorPalette[index % colorPalette.length],
    pointBackgroundColor: dataset.pointBackgroundColor || colorPalette[index % colorPalette.length],
    pointBorderColor: dataset.pointBorderColor || '#fff',
    tension: dataset.tension || 0.3,
    fill: dataset.fill !== false
  }));
  
  return new Chart(ctx, {
    type: 'line',
    data,
    options: { ...defaultOptions, ...options }
  });
}

/**
 * Create a bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} Chart instance
 */
function createBarChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: options.horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: options.showLegend !== false,
        labels: {
          color: darkTheme.color,
          font: darkTheme.font
        }
      },
      tooltip: {
        backgroundColor: darkTheme.tooltipBackgroundColor,
        borderColor: darkTheme.tooltipBorderColor,
        borderWidth: 1,
        titleColor: darkTheme.color,
        bodyColor: darkTheme.color
      }
    },
    scales: {
      x: {
        grid: {
          color: darkTheme.gridColor
        },
        ticks: {
          color: darkTheme.color,
          font: darkTheme.font
        }
      },
      y: {
        grid: {
          color: darkTheme.gridColor
        },
        ticks: {
          color: darkTheme.color,
          font: darkTheme.font
        },
        beginAtZero: options.beginAtZero !== false
      }
    }
  };
  
  // Apply dataset styling
  data.datasets = data.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colorPalette[index % colorPalette.length],
    borderColor: dataset.borderColor || colorPalette[index % colorPalette.length],
    borderWidth: dataset.borderWidth || 0
  }));
  
  return new Chart(ctx, {
    type: 'bar',
    data,
    options: { ...defaultOptions, ...options }
  });
}

/**
 * Create a pie chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} Chart instance
 */
function createPieChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: options.showLegend !== false,
        position: options.legendPosition || 'right',
        labels: {
          color: darkTheme.color,
          font: darkTheme.font,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: darkTheme.tooltipBackgroundColor,
        borderColor: darkTheme.tooltipBorderColor,
        borderWidth: 1,
        titleColor: darkTheme.color,
        bodyColor: darkTheme.color
      }
    }
  };
  
  // Apply styling to data
  data.datasets = data.datasets.map(dataset => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colorPalette,
    borderColor: '#1F2937',
    borderWidth: 2
  }));
  
  return new Chart(ctx, {
    type: 'pie',
    data,
    options: { ...defaultOptions, ...options }
  });
}

/**
 * Create a doughnut chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} Chart instance
 */
function createDoughnutChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: options.showLegend !== false,
        position: options.legendPosition || 'right',
        labels: {
          color: darkTheme.color,
          font: darkTheme.font,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: darkTheme.tooltipBackgroundColor,
        borderColor: darkTheme.tooltipBorderColor,
        borderWidth: 1,
        titleColor: darkTheme.color,
        bodyColor: darkTheme.color,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    cutout: options.cutout || '60%'
  };
  
  // Apply styling to data
  data.datasets = data.datasets.map(dataset => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colorPalette,
    borderColor: '#1F2937',
    borderWidth: 2
  }));
  
  return new Chart(ctx, {
    type: 'doughnut',
    data,
    options: { ...defaultOptions, ...options }
  });
}

/**
 * Create a gauge chart (using doughnut with custom plugin)
 * @param {string} canvasId - Canvas element ID
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {Object} options - Chart options
 * @returns {Chart} Chart instance
 */
function createGaugeChart(canvasId, value, max, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const percentage = (value / max) * 100;
  const remaining = max - value;
  
  // Determine color based on thresholds
  let color = '#10B981'; // green
  if (percentage < 60) {
    color = '#EF4444'; // red
  } else if (percentage < 80) {
    color = '#F59E0B'; // amber
  }
  
  const data = {
    datasets: [{
      data: [value, remaining],
      backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
      borderColor: '#1F2937',
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    cutout: '75%'
  };
  
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: { ...defaultOptions, ...options },
    plugins: [{
      id: 'gaugeText',
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.height;
        
        ctx.restore();
        ctx.font = 'bold 24px Inter';
        ctx.fillStyle = darkTheme.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${percentage.toFixed(1)}%`;
        const textX = width / 2;
        const textY = height / 2 + 10;
        
        ctx.fillText(text, textX, textY);
        
        // Add label below
        if (options.label) {
          ctx.font = '12px Inter';
          ctx.fillStyle = 'rgba(229, 231, 235, 0.6)';
          ctx.fillText(options.label, textX, textY + 25);
        }
        
        ctx.save();
      }
    }]
  });
  
  return chart;
}

/**
 * Update chart data
 * @param {Chart} chart - Chart instance
 * @param {Object} newData - New data
 */
function updateChart(chart, newData) {
  if (!chart) return;
  
  if (newData.labels) {
    chart.data.labels = newData.labels;
  }
  
  if (newData.datasets) {
    newData.datasets.forEach((dataset, index) => {
      if (chart.data.datasets[index]) {
        Object.assign(chart.data.datasets[index], dataset);
      } else {
        chart.data.datasets.push(dataset);
      }
    });
  }
  
  chart.update('none'); // Update without animation for performance
}

/**
 * Create skeleton loading state
 * @param {string} canvasId - Canvas element ID
 */
function showSkeletonChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const container = canvas.parentElement;
  if (!container) return;
  
  container.classList.add('skeleton-loading');
  canvas.style.opacity = '0.3';
}

/**
 * Hide skeleton loading state
 * @param {string} canvasId - Canvas element ID
 */
function hideSkeletonChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const container = canvas.parentElement;
  if (!container) return;
  
  container.classList.remove('skeleton-loading');
  canvas.style.opacity = '1';
}
