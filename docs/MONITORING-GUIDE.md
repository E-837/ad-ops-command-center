# Monitoring Guide

Comprehensive guide for monitoring the Ad Ops Command Center in production.

## Table of Contents

1. [Overview](#overview)
2. [Key Metrics](#key-metrics)
3. [Monitoring Tools](#monitoring-tools)
4. [Alerting](#alerting)
5. [Dashboards](#dashboards)
6. [Log Analysis](#log-analysis)
7. [Performance Monitoring](#performance-monitoring)
8. [Health Checks](#health-checks)

---

## Overview

Effective monitoring ensures:
- ✅ Early detection of issues
- ✅ Performance optimization
- ✅ Capacity planning
- ✅ SLA compliance
- ✅ User experience quality

---

## Key Metrics

### 1. Application Metrics

#### Server Uptime
- **What:** Time since server start
- **Target:** >99.9% (less than 43 minutes downtime/month)
- **How to monitor:**
  ```bash
  pm2 status
  # OR
  curl http://localhost:3002/health | jq '.uptime'
  ```

#### API Response Times
- **What:** Time to respond to API requests
- **Targets:**
  - p50 (median): <200ms
  - p95: <500ms
  - p99: <1000ms
- **How to monitor:** Access logs, APM tools

#### Database Query Times
- **What:** Time to execute database queries
- **Target:** <100ms for common queries
- **How to monitor:** Enable query logging in knex

#### Workflow Success Rate
- **What:** Percentage of workflows completing successfully
- **Target:** >95%
- **How to monitor:**
  ```bash
  curl http://localhost:3002/api/analytics/workflow-success-rate
  ```

### 2. Infrastructure Metrics

#### Memory Usage
- **What:** RAM consumed by Node.js process
- **Target:** <80% of allocated memory
- **How to monitor:**
  ```bash
  pm2 monit
  # OR
  ps aux | grep node
  ```

#### CPU Usage
- **What:** CPU consumed by application
- **Target:** <70% average
- **How to monitor:**
  ```bash
  top -p $(pgrep -f "node server.js")
  ```

#### Disk Space
- **What:** Available disk space
- **Target:** >20% free
- **Critical:** <10% free
- **How to monitor:**
  ```bash
  df -h
  # Database file size
  du -h database/ad-ops.db
  ```

### 3. SSE Metrics

#### Active Connections
- **What:** Number of open SSE connections
- **Target:** Handle 50+ concurrent connections
- **How to monitor:**
  ```bash
  curl http://localhost:3002/api/sse/stats
  ```

#### Broadcast Latency
- **What:** Time from event emission to client receipt
- **Target:** <50ms
- **How to monitor:** Custom SSE client with timing

### 4. Business Metrics

#### Campaign Volume
- **What:** Number of active campaigns
- **How to monitor:**
  ```bash
  curl http://localhost:3002/api/analytics/campaign-count
  ```

#### Workflow Execution Volume
- **What:** Workflows executed per hour/day
- **How to monitor:**
  ```bash
  curl http://localhost:3002/api/analytics/execution-stats
  ```

#### API Requests per Minute
- **What:** Request rate to API
- **How to monitor:** Access logs, rate limiting stats

### 5. Error Metrics

#### Error Rate
- **What:** Errors per hour
- **Target:** <10 errors/hour
- **Critical:** >50 errors/hour
- **How to monitor:**
  ```bash
  tail -f logs/error.log | grep -c "ERROR"
  ```

#### 4xx/5xx Response Rates
- **What:** Client vs server errors
- **Target:** <5% of total requests
- **How to monitor:** Access logs analysis

---

## Monitoring Tools

### 1. PM2 Dashboard

**Built-in monitoring:**

```bash
# Real-time monitoring
pm2 monit

# List processes
pm2 status

# Logs
pm2 logs

# CPU/Memory over time
pm2 describe ad-ops-command
```

**PM2 Plus (Advanced):**

```bash
# Install PM2 Plus
pm2 install pm2-plus

# Link to web dashboard
pm2 link <secret> <public>
```

Features:
- Real-time metrics
- Custom metrics
- Exception tracking
- Transaction tracing
- Log streaming

### 2. Node.js Built-in Profiling

**Add to server.js:**

```javascript
// Performance monitoring
const perf_hooks = require('perf_hooks');
const { PerformanceObserver, performance } = perf_hooks;

// Monitor async operations
const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    if (entry.duration > 1000) { // Slow operations
      console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
    }
  });
});
obs.observe({ entryTypes: ['measure'] });

// Measure workflow execution
performance.mark('workflow-start');
// ... workflow execution
performance.mark('workflow-end');
performance.measure('workflow-execution', 'workflow-start', 'workflow-end');
```

### 3. Custom Health Endpoint

**Comprehensive health check:**

```javascript
// server.js - Enhanced health endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: require('./package.json').version,
    
    // Database
    database: {
      status: 'unknown',
      responseTime: null
    },
    
    // Memory
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    
    // SSE
    sse: {
      activeConnections: sseManager.getConnectionCount(),
      eventsSent: sseManager.getEventCount()
    },
    
    // Workflow stats
    workflows: {
      executed: await db('workflow_executions').count('id as count').first(),
      failures: await db('workflow_executions').where('status', 'failed').count('id as count').first()
    }
  };
  
  // Test database
  const dbStart = Date.now();
  try {
    await db.raw('SELECT 1');
    health.database.status = 'connected';
    health.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    health.database.status = 'error';
    health.database.error = error.message;
    health.status = 'degraded';
  }
  
  // Check critical thresholds
  if (health.memory.heapUsed > 800) { // >800MB
    health.status = 'warning';
    health.warnings = ['High memory usage'];
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 4. Prometheus + Grafana (Advanced)

**Install Prometheus client:**

```bash
npm install prom-client
```

**Add to server.js:**

```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const workflowExecutions = new promClient.Counter({
  name: 'workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['workflow', 'status'],
  registers: [register]
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Prometheus configuration (prometheus.yml):**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ad-ops-command'
    static_configs:
      - targets: ['localhost:3002']
```

### 5. Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1 // 10% of transactions
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

---

## Alerting

### 1. PM2 Monitoring Alerts

```bash
# Install PM2 notification module
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK

# Configure alerts
pm2 set pm2-slack:events error,restart
```

### 2. Custom Alert Script

**alert.js:**

```javascript
const axios = require('axios');

async function checkHealth() {
  try {
    const response = await axios.get('http://localhost:3002/health');
    const health = response.data;
    
    // Check memory
    if (health.memory.heapUsed > 800) {
      await sendAlert('High Memory Usage', `Memory: ${health.memory.heapUsed}MB`);
    }
    
    // Check database
    if (health.database.status !== 'connected') {
      await sendAlert('Database Connection Failed', health.database.error);
    }
    
    // Check error rate
    const errorCount = await getRecentErrorCount();
    if (errorCount > 50) {
      await sendAlert('High Error Rate', `${errorCount} errors in last hour`);
    }
    
  } catch (error) {
    await sendAlert('Health Check Failed', error.message);
  }
}

async function sendAlert(title, message) {
  // Discord webhook
  await axios.post(process.env.DISCORD_WEBHOOK_URL, {
    embeds: [{
      title: `🚨 ${title}`,
      description: message,
      color: 0xff0000,
      timestamp: new Date()
    }]
  });
  
  // Email
  // await sendEmail({ subject: title, body: message });
}

// Run every 5 minutes
setInterval(checkHealth, 5 * 60 * 1000);
```

**Run as separate process:**

```bash
pm2 start alert.js --name ad-ops-alerts
```

### 3. Alert Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Server down | Critical | Immediate notification |
| Memory >90% | Critical | Notify + auto-restart |
| Error rate >50/hour | High | Notify team |
| Database offline | Critical | Immediate notification |
| Disk space <10% | High | Notify + cleanup |
| Response time >2s | Medium | Log for review |
| Workflow failure rate >10% | Medium | Notify team |

---

## Dashboards

### 1. Simple HTML Dashboard

**Create `monitoring-dashboard.html`:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Ad Ops Monitoring</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3"></script>
  <style>
    body { font-family: sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
    .metric { background: #2a2a2a; padding: 20px; margin: 10px; border-radius: 8px; }
    .value { font-size: 48px; font-weight: bold; }
    .label { font-size: 14px; opacity: 0.7; }
  </style>
</head>
<body>
  <h1>🚀 Ad Ops Command Center - Live Monitoring</h1>
  
  <div class="metrics-grid">
    <div class="metric">
      <div class="label">Uptime</div>
      <div class="value" id="uptime">-</div>
    </div>
    
    <div class="metric">
      <div class="label">Memory Usage</div>
      <div class="value" id="memory">-</div>
    </div>
    
    <div class="metric">
      <div class="label">Active SSE Connections</div>
      <div class="value" id="sse">-</div>
    </div>
    
    <div class="metric">
      <div class="label">Workflow Success Rate</div>
      <div class="value" id="success-rate">-</div>
    </div>
  </div>
  
  <canvas id="response-times"></canvas>
  
  <script>
    async function updateMetrics() {
      const response = await fetch('/health');
      const health = await response.json();
      
      document.getElementById('uptime').textContent = 
        Math.floor(health.uptime / 3600) + 'h';
      
      document.getElementById('memory').textContent = 
        health.memory.heapUsed + ' MB';
      
      document.getElementById('sse').textContent = 
        health.sse.activeConnections;
      
      const total = health.workflows.executed.count;
      const failures = health.workflows.failures.count;
      const rate = ((1 - failures / total) * 100).toFixed(1);
      document.getElementById('success-rate').textContent = rate + '%';
    }
    
    setInterval(updateMetrics, 5000);
    updateMetrics();
  </script>
</body>
</html>
```

### 2. Grafana Dashboard

**Example metrics to visualize:**

1. **System Overview**
   - CPU usage (line chart)
   - Memory usage (area chart)
   - Disk I/O (line chart)

2. **Application Performance**
   - Request rate (line chart)
   - Response times (p50, p95, p99) (line chart)
   - Error rate (line chart)

3. **Business Metrics**
   - Active campaigns (stat)
   - Workflows executed today (stat)
   - SSE connections (gauge)

4. **Database**
   - Query count (counter)
   - Slow queries (table)
   - Database size (stat)

---

## Log Analysis

### Access Logs

```bash
# Top 10 most requested endpoints
awk '{print $7}' logs/access.log | sort | uniq -c | sort -rn | head -10

# Requests per hour
awk '{print $4}' logs/access.log | cut -d: -f2 | sort | uniq -c

# Status code distribution
awk '{print $9}' logs/access.log | sort | uniq -c | sort -rn

# Average response time
awk '{sum+=$10; count++} END {print sum/count}' logs/access.log
```

### Error Logs

```bash
# Count errors by type
grep "ERROR" logs/error.log | awk '{print $5}' | sort | uniq -c | sort -rn

# Find recent errors
tail -n 100 logs/error.log | grep "ERROR"

# Errors in last hour
find logs -name "*.log" -mmin -60 -exec grep "ERROR" {} \;
```

---

## Performance Monitoring

### APM Integration

**New Relic:**
```bash
npm install newrelic
```

**Datadog:**
```bash
npm install dd-trace
```

**Dynatrace:**
```bash
npm install @dynatrace/oneagent
```

---

## Health Checks

### External Monitoring

**UptimeRobot:**
- Monitor: https://adops.yourdomain.com/health
- Interval: Every 5 minutes
- Alert: Email + SMS on downtime

**Pingdom:**
- HTTP check on /health endpoint
- Check response contains `"status":"healthy"`

**Custom Healthcheck Script:**

```bash
#!/bin/bash
# healthcheck.sh

ENDPOINT="http://localhost:3002/health"
RESPONSE=$(curl -s $ENDPOINT)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  echo "⚠️  Health check failed: $RESPONSE"
  # Send alert
  exit 1
else
  echo "✅ System healthy"
  exit 0
fi
```

---

## Recommended Monitoring Stack

### Minimal (Free)
- PM2 monitoring
- Custom health endpoint
- Log rotation
- Basic shell scripts

### Standard (Low cost)
- PM2 Plus ($10/mo)
- UptimeRobot (Free tier)
- Discord/Slack webhooks
- Custom dashboards

### Enterprise (Full featured)
- Prometheus + Grafana
- Sentry error tracking
- Datadog APM
- PagerDuty alerting
- ELK stack (logs)

---

**Remember: Monitor proactively, not reactively!** 📊🔍
