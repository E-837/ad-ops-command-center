# Chart.js Visualization Guide

Guide for using Chart.js visualizations in the Ad Ops Command platform.

## Overview

The platform provides a set of reusable chart components with dark theme styling that matches the existing glass-morphism UI. All charts support real-time updates via SSE.

## Installation

Chart.js is loaded via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
<script src="components/charts.js"></script>
<link rel="stylesheet" href="css/charts.css">
```

## Chart Types

### 1. Line Chart

Best for: Time-series data, trends over time

```javascript
const chart = createLineChart('my-canvas-id', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Workflows',
    data: [5, 8, 12, 7, 10, 15, 9]
  }]
}, {
  beginAtZero: true,
  showLegend: true
});
```

**Options:**
- `beginAtZero` (boolean): Start Y-axis at zero (default: true)
- `showLegend` (boolean): Show legend (default: true)
- `fill` (boolean): Fill area under line (default: true)
- `tension` (number): Line smoothness 0-1 (default: 0.3)

### 2. Bar Chart

Best for: Comparisons, categorical data

```javascript
const chart = createBarChart('my-canvas-id', {
  labels: ['Google', 'Meta', 'Pinterest', 'TikTok'],
  datasets: [{
    label: 'CTR (%)',
    data: [2.5, 1.8, 3.2, 2.1]
  }]
}, {
  horizontal: false,
  beginAtZero: true
});
```

**Options:**
- `horizontal` (boolean): Horizontal bars (default: false)
- `beginAtZero` (boolean): Start axis at zero (default: true)
- `showLegend` (boolean): Show legend (default: true)

### 3. Doughnut Chart

Best for: Composition, distribution

```javascript
const chart = createDoughnutChart('my-canvas-id', {
  labels: ['Google', 'Meta', 'Pinterest', 'Other'],
  datasets: [{
    data: [40, 35, 15, 10]
  }]
}, {
  cutout: '60%',
  legendPosition: 'right'
});
```

**Options:**
- `cutout` (string): Size of center hole (default: '60%')
- `legendPosition` (string): Legend position (default: 'right')
- `showLegend` (boolean): Show legend (default: true)

### 4. Pie Chart

Best for: Simple proportions

```javascript
const chart = createPieChart('my-canvas-id', {
  labels: ['Completed', 'Failed', 'Running'],
  datasets: [{
    data: [75, 15, 10]
  }]
}, {
  legendPosition: 'bottom'
});
```

**Options:**
- `legendPosition` (string): Legend position (default: 'right')
- `showLegend` (boolean): Show legend (default: true)

### 5. Gauge Chart

Best for: Progress, health indicators, percentages

```javascript
const chart = createGaugeChart('my-canvas-id', 85, 100, {
  label: 'Success Rate'
});
```

**Parameters:**
- `value` (number): Current value
- `max` (number): Maximum value
- `options.label` (string): Label below gauge

**Color Thresholds:**
- Green (>80%): Healthy
- Yellow (60-80%): Warning
- Red (<60%): Critical

## HTML Structure

### Basic Chart Container

```html
<div class="chart-container">
  <div class="chart-title">
    Chart Title
    <div class="chart-subtitle">Subtitle text</div>
  </div>
  <div class="chart-wrapper">
    <canvas id="my-chart"></canvas>
  </div>
</div>
```

### Chart Grid

```html
<div class="charts-grid">
  <div class="chart-container"><!-- Chart 1 --></div>
  <div class="chart-container"><!-- Chart 2 --></div>
  <div class="chart-container"><!-- Chart 3 --></div>
</div>
```

### Stat Card with Chart

```html
<div class="stat-card-with-chart">
  <div class="stat-card-header">
    <div>
      <div class="stat-value">$125,000</div>
      <div class="stat-label">Total Spend</div>
    </div>
    <span class="stat-change positive">↑ 12.5%</span>
  </div>
  <div class="chart-wrapper small">
    <canvas id="spend-trend"></canvas>
  </div>
</div>
```

## Real-time Updates

### Basic Update

```javascript
// Update existing chart
updateChart(chart, {
  labels: ['New', 'Labels'],
  datasets: [{
    data: [10, 20]
  }]
});
```

### Debounced Updates

Prevent excessive re-renders:

```javascript
const updateSpendChart = debounce((data) => {
  updateChart(charts.spend, data);
}, 1000);

realtime.on('metric.recorded', (event) => {
  updateSpendChart(transformData(event));
});
```

### Visibility-Aware Updates

Only update visible charts:

```javascript
const visibilityManager = new VisibilityManager();

visibilityManager.observe('my-chart', 
  () => {
    // Chart is visible - enable updates
    isVisible = true;
  },
  () => {
    // Chart is hidden - pause updates
    isVisible = false;
  }
);

realtime.on('workflow.completed', (event) => {
  if (isVisible) {
    updateChart(chart, newData);
  }
});
```

## Loading States

### Skeleton Loading

```javascript
// Show skeleton while loading
showSkeletonChart('my-chart');

// Load data
const data = await fetchChartData();

// Create chart
const chart = createLineChart('my-chart', data);

// Hide skeleton
hideSkeletonChart('my-chart');
```

### Empty State

```html
<div class="chart-empty-state">
  <div class="chart-empty-state-icon">📊</div>
  <div class="chart-empty-state-text">
    No data available yet.<br>
    Execute a workflow to see results.
  </div>
</div>
```

## Styling

### Dark Theme

All charts use the dark theme automatically. Colors are defined in `components/charts.js`:

```javascript
const darkTheme = {
  backgroundColor: 'rgba(139, 92, 246, 0.1)',
  borderColor: '#8B5CF6',
  color: '#E5E7EB',
  gridColor: 'rgba(255, 255, 255, 0.1)'
};
```

### Color Palette

```javascript
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
```

### Custom Colors

Override colors per dataset:

```javascript
const chart = createBarChart('my-chart', {
  labels: ['A', 'B', 'C'],
  datasets: [{
    label: 'Series 1',
    data: [10, 20, 30],
    backgroundColor: '#10B981', // Custom green
    borderColor: '#059669'
  }]
});
```

## Progress Indicators

### Stage Timeline

```html
<div class="stage-timeline">
  <div class="stage-item">
    <div class="stage-indicator completed">✓</div>
    <div class="stage-label">Planning</div>
  </div>
  <div class="stage-item">
    <div class="stage-indicator running">⚡</div>
    <div class="stage-label">Execution</div>
  </div>
  <div class="stage-item">
    <div class="stage-indicator pending">○</div>
    <div class="stage-label">Reporting</div>
  </div>
</div>
```

**Update via JavaScript:**

```javascript
realtime.on('stage.started', (event) => {
  updateStageIndicator(event.stageId, 'running');
});

realtime.on('stage.completed', (event) => {
  updateStageIndicator(event.stageId, 'completed');
});

function updateStageIndicator(stageId, status) {
  const indicator = document.querySelector(`[data-stage="${stageId}"]`);
  indicator.className = `stage-indicator ${status}`;
}
```

### Live Progress Bar

```html
<div class="live-progress">
  <div class="live-progress-bar">
    <div class="live-progress-fill" id="progress-fill" style="width: 0%"></div>
  </div>
  <div class="live-progress-label">
    <span>Processing...</span>
    <span class="live-progress-percentage" id="progress-pct">0%</span>
  </div>
</div>
```

**Update via JavaScript:**

```javascript
realtime.on('stage.progress', (event) => {
  const fill = document.getElementById('progress-fill');
  const pct = document.getElementById('progress-pct');
  
  fill.style.width = `${event.progress}%`;
  pct.textContent = `${event.progress}%`;
});
```

## Examples

### Dashboard Chart Setup

```javascript
// Initialize charts
const charts = {
  workflowActivity: null,
  successRate: null,
  platformDistribution: null,
  recentPerformance: null
};

function initializeCharts() {
  // Workflow Activity - Line Chart
  charts.workflowActivity = createLineChart('workflow-activity-chart', {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Workflows',
      data: [0, 0, 0, 0, 0, 0, 0]
    }]
  });
  
  // Success Rate - Gauge
  charts.successRate = createGaugeChart('success-rate-chart', 0, 100, {
    label: 'Success Rate'
  });
  
  // Platform Distribution - Doughnut
  charts.platformDistribution = createDoughnutChart('platform-distribution-chart', {
    labels: ['Google', 'Meta', 'Pinterest', 'Other'],
    datasets: [{
      data: [0, 0, 0, 0]
    }]
  });
  
  // Recent Performance - Bar
  charts.recentPerformance = createBarChart('recent-performance-chart', {
    labels: [],
    datasets: [{
      label: 'Duration (seconds)',
      data: []
    }]
  });
}

// Load data and update charts
async function loadChartData() {
  const data = await fetch('/api/dashboard-metrics').then(r => r.json());
  
  updateChart(charts.workflowActivity, {
    datasets: [{ data: data.workflowCounts }]
  });
  
  // Recreate gauge with new value
  charts.successRate.destroy();
  charts.successRate = createGaugeChart('success-rate-chart', 
    data.successRate, 100, { label: 'Success Rate' }
  );
  
  updateChart(charts.platformDistribution, {
    datasets: [{ data: data.platformBudgets }]
  });
  
  updateChart(charts.recentPerformance, {
    labels: data.executionLabels,
    datasets: [{ data: data.executionDurations }]
  });
}

// Real-time updates
const realtime = new RealtimeClient();

realtime.on('workflow.completed', debounce(() => {
  loadChartData();
}, 1000));
```

## Performance Tips

### 1. Disable Animations for Real-time Updates

```javascript
updateChart(chart, newData);
chart.update('none'); // Skip animation
```

### 2. Limit Data Points

```javascript
// Keep only last 30 data points
if (chart.data.labels.length > 30) {
  chart.data.labels.shift();
  chart.data.datasets[0].data.shift();
}
```

### 3. Use Decimation

For line charts with many points:

```javascript
createLineChart('my-chart', data, {
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb' // Largest Triangle Three Buckets
    }
  }
});
```

### 4. Destroy Charts When Done

```javascript
// When removing a chart
chart.destroy();
chart = null;
```

## Troubleshooting

### Chart Not Rendering

1. Check canvas element exists: `document.getElementById('chart-id')`
2. Check container has height: Chart containers need explicit height
3. Check Chart.js loaded: `typeof Chart !== 'undefined'`

### Chart Not Updating

1. Verify chart instance exists
2. Check data format matches original
3. Call `chart.update()` after modifying data

### Performance Issues

1. Add debouncing to updates
2. Use Intersection Observer
3. Disable animations
4. Limit data points

## Reference

- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- Local files:
  - `ui/components/charts.js` - Chart component library
  - `ui/css/charts.css` - Chart styling
  - `ui/js/realtime.js` - Real-time client
- Examples:
  - `ui/dashboard.html` - Dashboard with 4 charts
  - `demo-realtime.js` - Real-time demo script
