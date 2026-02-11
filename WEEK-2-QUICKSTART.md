# Week 2 Quick Start Guide

Real-time UI Updates + Visualizations (SSE + Chart.js)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install eventsource
```

### 2. Start the Server

```bash
npm start
```

Server runs on http://localhost:3002

### 3. Open the Dashboard

Navigate to http://localhost:3002/dashboard

You should see:
- 4 real-time charts
- Connection status indicator (green = connected)
- Charts updating automatically as workflows execute

### 4. Run the Demo

In a new terminal (while server is running):

```bash
npm run demo:realtime
```

This will:
- Simulate workflow executions
- Show real-time events in terminal
- Update charts in the browser (refresh dashboard to see)

Watch the dashboard update in real-time! 🎉

## 📊 What You'll See

### Dashboard Charts

1. **Workflow Activity** (top-left)
   - Line chart showing workflows per day (last 7 days)
   - Updates when workflows complete

2. **Success Rate** (top-right)
   - Gauge showing % of successful workflows
   - Color-coded: Green (>80%), Yellow (60-80%), Red (<60%)

3. **Platform Distribution** (bottom-left)
   - Doughnut chart showing budget by platform
   - Updates when campaigns are created/updated

4. **Recent Performance** (bottom-right)
   - Bar chart showing last 10 workflow execution times
   - Measured in seconds

### Connection Status

At the top of the charts section:
- 🟢 **Green dot**: Connected to real-time updates
- 🟡 **Spinner**: Reconnecting...

## 🧪 Testing

### Run SSE Tests

```bash
npm run test:realtime
```

This runs 6 comprehensive tests:
1. SSE Connection
2. Event Broadcast
3. Filtered Streams
4. Reconnection
5. Concurrent Clients (10)
6. Stats Endpoint

All tests should pass ✅

### Interactive Demo

```bash
npm run demo:realtime
```

Choose from:
1. Single workflow with stage updates
2. Batch workflows (populates charts)
3. Campaign events
4. Event statistics
5. Run all demos
6. Exit

## 🎯 Real-time Events

### Available Event Types

The platform emits 20+ event types:

**Workflow Events:**
- `workflow.started`
- `workflow.completed`
- `workflow.failed`
- `workflow.stage.started`
- `workflow.stage.progress`
- `workflow.stage.completed`
- `workflow.stage.failed`

**Campaign Events:**
- `campaign.created`
- `campaign.updated`
- `campaign.status.changed`

**Project Events:**
- `project.created`
- `project.updated`
- `project.milestone.reached`

### Viewing Events

#### In Browser Console

```javascript
// Open dashboard, then in browser console:
const realtime = new RealtimeClient();

realtime.on('*', (event) => {
  console.log('Event received:', event.type, event);
});
```

#### Via API

```bash
# Get SSE stats
curl http://localhost:3002/api/stream/stats

# Connect to SSE stream
curl http://localhost:3002/api/stream
```

#### Filtered Stream

```bash
# Only workflow events
curl "http://localhost:3002/api/stream?eventTypes=workflow.started,workflow.completed"
```

## 💻 Development

### Add Charts to Other Pages

1. Include Chart.js and libraries:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
<script src="components/charts.js"></script>
<script src="js/realtime.js"></script>
<link rel="stylesheet" href="css/charts.css">
```

2. Add canvas elements:
```html
<div class="chart-container">
  <div class="chart-title">My Chart</div>
  <div class="chart-wrapper">
    <canvas id="my-chart"></canvas>
  </div>
</div>
```

3. Initialize charts:
```javascript
const chart = createLineChart('my-chart', {
  labels: ['A', 'B', 'C'],
  datasets: [{ label: 'Data', data: [1, 2, 3] }]
});
```

4. Wire up real-time updates:
```javascript
const realtime = new RealtimeClient();

realtime.on('workflow.completed', () => {
  // Fetch new data and update chart
  updateChart(chart, newData);
});
```

### Emit Custom Events

```javascript
const eventBus = require('./events/bus');
const eventTypes = require('./events/types');

// Emit an event (automatically broadcasts to SSE clients)
eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
  executionId: 'exec-123',
  workflowId: 'my-workflow',
  duration: 5000,
  result: { success: true }
});
```

## 📚 Documentation

- **SSE API Reference:** `docs/REALTIME-API.md`
- **Chart.js Guide:** `docs/CHARTS-GUIDE.md`
- **Week 2 Summary:** `docs/WEEK-2-COMPLETION-SUMMARY.md`

## 🐛 Troubleshooting

### Charts Not Showing

1. Check browser console for errors
2. Verify Chart.js loaded: `typeof Chart !== 'undefined'`
3. Check canvas elements exist
4. Clear browser cache

### Real-time Updates Not Working

1. Check connection status indicator
2. Open browser DevTools > Network > EventStream
3. Verify server is running
4. Check SSE stats: `curl http://localhost:3002/api/stream/stats`

### Tests Failing

1. Ensure server is running on port 3002
2. Check `eventsource` package installed
3. Run tests one at a time to isolate issues

## 🎨 Customization

### Change Chart Colors

Edit `ui/components/charts.js`:

```javascript
const colorPalette = [
  '#8B5CF6', // Your custom colors
  '#3B82F6',
  // ...
];
```

### Adjust Update Frequency

In `ui/dashboard.html`:

```javascript
// Change refresh intervals
setInterval(loadDashboard, 30000);  // Dashboard (30s)
setInterval(loadChartData, 60000);  // Charts (60s)

// Change debounce delay
const updateChart = debounce(fn, 1000); // 1 second
```

### Filter Events

```javascript
// Only receive workflow events for specific project
const realtime = new RealtimeClient({
  projectId: 'proj-abc',
  eventTypes: ['workflow.started', 'workflow.completed']
});
```

## ⚡ Performance Tips

1. **Debounce Updates**: Always debounce chart updates (included by default)
2. **Visibility Observer**: Use for off-screen charts (included)
3. **Limit Data Points**: Keep chart data reasonable (<100 points)
4. **Disconnect When Done**: Call `realtime.disconnect()` when leaving page

## 🎉 Next Steps

Try these:
1. Run the demo and watch the dashboard update
2. Execute a real workflow and see live stage progress
3. Create a new campaign and see platform distribution update
4. Check out the test suite to see SSE in action
5. Read the documentation for advanced usage

---

**Enjoy the real-time updates!** 🚀

Questions? See `docs/REALTIME-API.md` and `docs/CHARTS-GUIDE.md`
