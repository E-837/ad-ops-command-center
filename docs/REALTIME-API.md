# Real-time API Reference

Server-Sent Events (SSE) API for real-time updates in the Ad Ops Command platform.

## Overview

The real-time API uses Server-Sent Events (SSE) to push updates from the server to connected clients. This enables live dashboard updates, workflow progress tracking, and instant notifications without polling.

## Endpoints

### `GET /api/stream`

Establish an SSE connection to receive real-time events.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `eventTypes` | string | Comma-separated list of event types to filter | `workflow.started,workflow.completed` |
| `workflowId` | string | Filter events for specific workflow | `campaign-optimization` |
| `executionId` | string | Filter events for specific execution | `exec-123456` |
| `projectId` | string | Filter events for specific project | `proj-abc` |

**Response Format:**

SSE stream with `Content-Type: text/event-stream`

**Example Request:**

```javascript
// Connect to SSE stream
const eventSource = new EventSource('/api/stream');

// Listen for messages
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received event:', data.type, data.data);
};

// Handle connection errors
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

**Example with Filters:**

```javascript
const eventSource = new EventSource('/api/stream?executionId=exec-123&eventTypes=stage.started,stage.completed');
```

### `GET /api/stream/stats`

Get SSE connection statistics.

**Response:**

```json
{
  "activeClients": 5,
  "queuedEvents": 2,
  "clients": [
    {
      "id": "client-123",
      "connectedAt": "2026-02-11T04:00:00Z",
      "eventsSent": 42,
      "lastPing": 1707624000000,
      "filters": {
        "executionId": "exec-123"
      }
    }
  ]
}
```

## Event Format

All events follow this structure:

```json
{
  "type": "workflow.started",
  "data": {
    "executionId": "exec-123",
    "workflowId": "campaign-optimization",
    "workflowName": "Campaign Optimization",
    "startedAt": "2026-02-11T04:00:00Z",
    "params": {}
  }
}
```

## Event Types

### Workflow Events

#### `workflow.started`

Emitted when a workflow execution begins.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "workflowName": "Campaign Optimization",
  "projectId": "proj-abc",
  "startedAt": "2026-02-11T04:00:00Z",
  "params": {}
}
```

#### `workflow.completed`

Emitted when a workflow execution completes successfully.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "duration": 15000,
  "result": {},
  "completedAt": "2026-02-11T04:00:15Z"
}
```

#### `workflow.failed`

Emitted when a workflow execution fails.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "error": "Connector timeout",
  "failedAt": "2026-02-11T04:00:10Z"
}
```

### Stage Events

#### `workflow.stage.started`

Emitted when a workflow stage begins.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "stageId": "stage-1",
  "stageName": "Planning",
  "stageIndex": 0,
  "totalStages": 5,
  "startedAt": "2026-02-11T04:00:00Z"
}
```

#### `workflow.stage.progress`

Emitted during stage execution to show progress.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "stageId": "stage-2",
  "stageName": "Data Collection",
  "progress": 45,
  "completed": 9,
  "total": 20
}
```

#### `workflow.stage.completed`

Emitted when a stage completes.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "stageId": "stage-1",
  "stageName": "Planning",
  "status": "completed",
  "duration": 2000,
  "completedAt": "2026-02-11T04:00:02Z"
}
```

#### `workflow.stage.failed`

Emitted when a stage fails.

**Data:**
```json
{
  "executionId": "exec-123",
  "workflowId": "campaign-optimization",
  "stageId": "stage-3",
  "stageName": "Analysis",
  "error": "Data parsing error",
  "duration": 1500,
  "failedAt": "2026-02-11T04:00:05Z"
}
```

### Campaign Events

#### `campaign.created`
#### `campaign.updated`
#### `campaign.status.changed`
#### `campaign.paused`
#### `campaign.resumed`

### Project Events

#### `project.created`
#### `project.updated`
#### `project.status.changed`
#### `project.milestone.reached`
#### `project.risk.detected`

### Metric Events

#### `metric.threshold`
#### `metric.anomaly`
#### `budget.pacing.alert`

## Client Library

Use the `RealtimeClient` JavaScript class for easy SSE integration:

```javascript
// Create client with optional filters
const realtime = new RealtimeClient({
  eventTypes: ['workflow.started', 'workflow.completed'],
  projectId: 'proj-abc'
});

// Listen for specific events
realtime.on('workflow.started', (data) => {
  console.log('Workflow started:', data.workflowId);
});

realtime.on('workflow.completed', (data) => {
  console.log('Workflow completed:', data.executionId);
  updateDashboard();
});

// Listen for all events
realtime.on('*', (event) => {
  console.log('Received event:', event.type);
});

// Connection callbacks
realtime.onConnect(() => {
  console.log('Connected to real-time stream');
});

realtime.onDisconnect(() => {
  console.log('Disconnected, attempting to reconnect...');
});

// Disconnect
realtime.disconnect();
```

## Best Practices

### 1. Use Filters

Filter events on the server side to reduce bandwidth:

```javascript
// ❌ Bad: Receive all events and filter client-side
const realtime = new RealtimeClient();
realtime.on('*', (event) => {
  if (event.data.executionId === currentExecutionId) {
    updateUI(event);
  }
});

// ✅ Good: Filter on server
const realtime = new RealtimeClient({
  executionId: currentExecutionId
});
realtime.on('*', (event) => {
  updateUI(event);
});
```

### 2. Debounce UI Updates

Prevent excessive re-renders:

```javascript
const updateChart = debounce((data) => {
  chart.update(data);
}, 1000); // Update at most once per second

realtime.on('workflow.completed', (data) => {
  updateChart(data);
});
```

### 3. Handle Reconnection

The client automatically reconnects, but update UI accordingly:

```javascript
realtime.onConnect(() => {
  showConnectedIndicator();
  refreshData(); // Re-sync after reconnection
});

realtime.onDisconnect(() => {
  showDisconnectedIndicator();
});
```

### 4. Clean Up

Disconnect when leaving a page:

```javascript
window.addEventListener('beforeunload', () => {
  realtime.disconnect();
});
```

### 5. Graceful Degradation

Fall back to polling if SSE fails:

```javascript
realtime.onDisconnect(() => {
  if (realtime.reconnectAttempts >= realtime.maxReconnectAttempts) {
    // Start polling fallback
    setInterval(() => {
      fetch('/api/executions?limit=10').then(/* ... */);
    }, 5000);
  }
});
```

## Performance

### Server Side

- **Event Batching**: Events are batched and sent max 10/second
- **Queue Management**: Max 50 events queued before forcing flush
- **Connection Cleanup**: Dead connections removed every 60 seconds
- **Keepalive**: Ping sent every 30 seconds to maintain connection

### Client Side

- **Debouncing**: Chart updates debounced to 1/second
- **Visibility Observer**: Only update visible charts
- **Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Polling Fallback**: Automatic fallback if SSE unavailable

## Troubleshooting

### Connection Fails

```javascript
// Check if SSE is supported
if (typeof EventSource === 'undefined') {
  console.error('SSE not supported in this browser');
  // Use polling fallback
}
```

### Events Not Received

1. Check filters - may be too restrictive
2. Verify server is emitting events
3. Check browser DevTools > Network > EventStream
4. Check SSE stats: `GET /api/stream/stats`

### Memory Leaks

Always disconnect when done:

```javascript
// In React
useEffect(() => {
  const realtime = new RealtimeClient();
  // ... setup listeners
  
  return () => {
    realtime.disconnect();
  };
}, []);
```

## Examples

See `demo-realtime.js` for a complete demonstration.

## Security

- **Authentication**: Add auth middleware to `/api/stream` endpoint
- **Rate Limiting**: Limit connections per IP
- **Event Filtering**: Always validate filter parameters
- **Data Sanitization**: Sanitize event data before broadcasting
