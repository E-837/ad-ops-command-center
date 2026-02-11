# Phase 3+ Architecture — Ad Ops Command Center

## Overview

Six major features expanding the platform from a workflow automation tool into a full-stack ad operations intelligence platform. Each feature is designed to layer onto the existing Express + vanilla JS stack without rewrites.

---

## 1. Real Database (Foundation)

### Architecture Overview

Replace JSON file storage with **SQLite** (via `better-sqlite3`) using **Knex.js** as query builder. SQLite is the right call here — no server to manage, file-based (like current JSON), supports concurrent reads, and handles the workload of a solo/small-team tool.

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐
│  Express Routes │────▶│  Knex.js QB  │────▶│  SQLite File   │
│  (unchanged)    │     │  (database/) │     │  ad-ops.db     │
└─────────────────┘     └──────────────┘     └────────────────┘
```

### Key Components

**`database/knex.js`** — Connection singleton:
```js
const knex = require('knex')({
  client: 'better-sqlite3',
  connection: { filename: './database/ad-ops.db' },
  useNullAsDefault: true
});
module.exports = knex;
```

**`database/migrations/`** — Knex migration files:
```
001_create_projects.js
002_create_workflows.js
003_create_executions.js
004_create_events.js
005_create_campaigns.js
006_create_activity.js
007_create_agent_memory.js   // for Phase 3 Agent Intelligence
008_create_analytics.js      // for Phase 3 Analytics Layer
```

**`database/repos/`** — Repository pattern replacing current JSON CRUD:
```js
// database/repos/projects.js
const db = require('../knex');

module.exports = {
  async getAll(filters = {}) {
    let q = db('projects').select('*');
    if (filters.status) q = q.where('status', filters.status);
    if (filters.category) q = q.where('category', filters.category);
    return q.orderBy('updated_at', 'desc');
  },
  async getById(id) { return db('projects').where({ id }).first(); },
  async create(project) { return db('projects').insert(project).returning('*'); },
  async update(id, data) { return db('projects').where({ id }).update({ ...data, updated_at: new Date().toISOString() }); },
  async delete(id) { return db('projects').where({ id }).del(); }
};
```

### Data Model (Schema)

```sql
-- Core tables (replacing JSON files)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  category TEXT,
  config JSON,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  project_id TEXT,
  status TEXT DEFAULT 'pending',  -- pending, running, completed, failed
  params JSON,
  result JSON,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT,
  data JSON,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,  -- google-ads, meta-ads, pinterest
  external_id TEXT,
  name TEXT,
  status TEXT,
  budget REAL,
  metrics JSON,
  synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT,
  metadata JSON,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_activity_type ON activity(type);
```

### Migration Strategy (JSON → SQLite)

**`scripts/migrate-json-to-sqlite.js`**:
1. Run Knex migrations to create schema
2. Read each `database/data/*.json` file
3. Transform and insert into corresponding tables
4. Verify row counts match
5. Rename `database/data/` → `database/data-backup/`

```js
// Adapter pattern for backward compatibility during migration
class DatabaseAdapter {
  constructor(useDb = process.env.USE_SQLITE !== 'false') {
    this.useDb = useDb;
  }
  async getProjects(filters) {
    if (this.useDb) return require('./repos/projects').getAll(filters);
    return require('./projects').getAll(filters); // old JSON method
  }
}
```

### Dependencies
- `better-sqlite3` (native SQLite binding, fast)
- `knex` (query builder + migrations)

### Complexity: ~1.5 weeks
- Schema design + migrations: 2 days
- Repository layer (6 repos): 3 days
- JSON migration script: 1 day
- Route updates + testing: 2 days

### Risks
- `better-sqlite3` needs native compilation (node-gyp) — usually fine on Windows with build tools
- JSON blobs in SQLite columns are queryable but not indexed — fine for config/params, not for high-frequency queries

---

## 2. Real-Time UI Updates (SSE)

### Architecture Overview

Use **Server-Sent Events (SSE)** — simpler than WebSocket, one-way server→client is exactly what we need for workflow progress. No extra dependencies.

```
┌──────────┐  POST /api/workflows/run  ┌──────────┐  eventBus.emit()  ┌──────────┐
│  Browser  │ ──────────────────────── │  Express  │ ────────────────── │ Executor │
│           │ ◀──────────────────────  │  Server   │                   │          │
│           │  GET /api/sse/stream     │           │                   │          │
└──────────┘  (SSE connection)         └──────────┘                   └──────────┘
```

### Key Components

**`routes/sse.js`** — SSE endpoint:
```js
const clients = new Set();

router.get('/api/sse/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const client = { id: Date.now(), res };
  clients.add(client);
  
  req.on('close', () => clients.delete(client));
});

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => c.res.write(msg));
}

module.exports = { router, broadcast };
```

**`ui/components/sse-client.js`** — Frontend listener:
```js
class LiveUpdates {
  constructor() {
    this.source = new EventSource('/api/sse/stream');
    this.handlers = {};
  }
  
  on(event, handler) {
    this.handlers[event] = handler;
    this.source.addEventListener(event, (e) => handler(JSON.parse(e.data)));
  }
  
  connect() {
    this.on('workflow.stage', (data) => this.updateStageUI(data));
    this.on('workflow.completed', (data) => this.showCompletion(data));
    this.on('workflow.failed', (data) => this.showError(data));
    this.on('metric.update', (data) => this.refreshChart(data));
  }
}
```

**Integration with existing event bus:**
```js
// In events/bus.js — add SSE broadcast
const { broadcast } = require('../routes/sse');

eventBus.on('*', (event, data) => {
  broadcast(event, data);
});
```

### SSE Event Types
| Event | Payload | UI Action |
|-------|---------|-----------|
| `workflow.started` | `{ executionId, workflowId, stages }` | Show progress bar |
| `workflow.stage` | `{ executionId, stageId, status, result }` | Update stage indicator |
| `workflow.completed` | `{ executionId, result, duration }` | Show success + results |
| `workflow.failed` | `{ executionId, error, failedStage }` | Show error state |
| `metric.update` | `{ campaignId, metrics }` | Refresh dashboard charts |
| `activity.new` | `{ type, message }` | Append to activity feed |

### Additional UI Polish

**Charts** — Use **Chart.js** (simple, well-documented, no build step needed):
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```
- Line charts for performance trends
- Doughnut charts for budget allocation
- Bar charts for platform comparison

**Workflow Templates:**
```js
// workflows/templates.js
const templates = {
  'quick-pacing-check': {
    workflowId: 'pacing-check',
    name: 'Daily Pacing Check',
    description: 'Check pacing for all active campaigns',
    prefilledParams: { platforms: ['google-ads', 'meta-ads'], lookbackDays: 7 }
  },
  // ...
};
```

**Stage Progress Component:**
```js
// ui/components/workflow-progress.js
function renderStageProgress(stages, currentStage) {
  return stages.map((s, i) => `
    <div class="stage ${s.status}">
      <div class="stage-icon">${s.status === 'completed' ? '✅' : s.status === 'running' ? '⏳' : '⬜'}</div>
      <div class="stage-name">${s.name}</div>
      ${s.result ? `<div class="stage-result">${s.result}</div>` : ''}
    </div>
  `).join('');
}
```

### Dependencies
- None for SSE (native browser + Node)
- Chart.js (CDN, ~65KB gzipped)

### Complexity: ~1 week
- SSE server + client: 2 days
- Executor integration: 1 day
- Chart.js dashboards: 2 days
- Workflow templates: 1 day

### Risks
- SSE max connections per domain (6 in older browsers) — not an issue for single-user tool
- Need heartbeat ping to keep connection alive behind proxies

---

## 3. Pinterest Connector

### Architecture Overview

Follow the exact pattern of `connectors/meta-ads.js` and `connectors/google-ads.js`. Pinterest has a well-documented REST API with OAuth2 and sandbox/test mode.

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  SocialMediaBuyer │────▶│  pinterest-ads.js   │────▶│  Pinterest API   │
│  Agent            │     │  (MCP connector)     │     │  (v5, REST)      │
└──────────────────┘     └─────────────────────┘     └──────────────────┘
```

### Pinterest API v5 Endpoints Needed

| Tool | Endpoint | Method |
|------|----------|--------|
| `pinterest_list_ad_accounts` | `/ad_accounts` | GET |
| `pinterest_get_ad_account` | `/ad_accounts/{id}` | GET |
| `pinterest_list_campaigns` | `/ad_accounts/{id}/campaigns` | GET |
| `pinterest_create_campaign` | `/ad_accounts/{id}/campaigns` | POST |
| `pinterest_update_campaign` | `/ad_accounts/{id}/campaigns` | PATCH |
| `pinterest_list_ad_groups` | `/ad_accounts/{id}/ad_groups` | GET |
| `pinterest_create_ad_group` | `/ad_accounts/{id}/ad_groups` | POST |
| `pinterest_list_ads` | `/ad_accounts/{id}/ads` | GET |
| `pinterest_create_ad` | `/ad_accounts/{id}/ads` | POST |
| `pinterest_list_pins` | `/pins` | GET |
| `pinterest_create_pin` | `/pins` | POST |
| `pinterest_get_analytics` | `/ad_accounts/{id}/analytics` | GET |
| `pinterest_get_campaign_analytics` | `/ad_accounts/{id}/campaigns/analytics` | GET |
| `pinterest_list_audiences` | `/ad_accounts/{id}/audiences` | GET |
| `pinterest_create_audience` | `/ad_accounts/{id}/audiences` | POST |
| `pinterest_get_targeting` | `/ad_accounts/{id}/targeting_analytics` | GET |
| `pinterest_list_boards` | `/boards` | GET |
| `pinterest_get_delivery_metrics` | `/ad_accounts/{id}/reports` | POST |

**~18 tools** (vs ~15 for Meta, ~12 for Google Ads)

### Key Components

**`connectors/pinterest-ads.js`:**
```js
const ApiClient = require('./api-client');

class PinterestAdsConnector {
  constructor(config = {}) {
    this.mode = config.mode || 'test';  // 'test' | 'live'
    this.client = new ApiClient({
      baseUrl: 'https://api.pinterest.com/v5',
      auth: { type: 'oauth2', token: config.accessToken }
    });
    this.testData = require('./test-data/pinterest');
  }

  async listCampaigns(adAccountId, params = {}) {
    if (this.mode === 'test') return this.testData.campaigns;
    return this.client.get(`/ad_accounts/${adAccountId}/campaigns`, params);
  }

  async getAnalytics(adAccountId, params) {
    if (this.mode === 'test') return this.testData.analytics;
    return this.client.get(`/ad_accounts/${adAccountId}/analytics`, {
      start_date: params.startDate,
      end_date: params.endDate,
      columns: params.metrics || ['SPEND', 'IMPRESSION', 'CLICKTHROUGH', 'PIN_CLICK_RATE'],
      granularity: params.granularity || 'DAY'
    });
  }
  // ... ~18 methods total
}
```

**`connectors/test-data/pinterest.js`** — Realistic test data for sandbox mode.

### Pinterest-Specific Challenges
- **Pin-based creative model** — Ads are promoted Pins, different from Meta/Google creative structure
- **Audience model** — Act-alike audiences (Pinterest's version of lookalikes), interest targeting uses Pinterest's taxonomy
- **Reporting columns** — Different metric names (PIN_CLICK vs CLICK, OUTBOUND_CLICK, etc.)
- **Rate limits** — 1000 requests/min for most endpoints, 300 for write operations
- **OAuth2 scopes** — `ads:read`, `ads:write`, `pins:read`, `pins:write`, `boards:read`

### Agent Integration

Update `agents/social-media-buyer.js`:
```js
// Add Pinterest to platform routing
getPlatformConnector(platform) {
  switch(platform) {
    case 'meta': return this.connectors.meta;
    case 'pinterest': return this.connectors.pinterest;  // NEW
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}
```

### Dependencies
- Pinterest Business API access (free sandbox account at developers.pinterest.com)
- No additional npm packages (uses existing `api-client.js`)

### Complexity: ~2 weeks
- Connector + 18 tools: 5 days
- Test data generator: 2 days
- SocialMediaBuyer integration: 2 days
- Workflow updates (cross-channel): 1 day

### Risks
- Pinterest sandbox has limited test data — may need more comprehensive mock data
- Pin creation requires image URLs — need to handle image hosting for test scenarios

---

## 4. Analytics Layer

### Architecture Overview

A dedicated analytics service that aggregates data from all platform connectors into a unified model, with Chart.js visualizations and export capabilities.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Google Ads   │  │  Meta Ads   │  │  Pinterest  │
│ Connector    │  │ Connector   │  │  Connector  │
└──────┬───────┘  └──────┬──────┘  └──────┬──────┘
       │                 │                │
       ▼                 ▼                ▼
┌──────────────────────────────────────────────────┐
│              Analytics Aggregator                 │
│  (normalize metrics → unified schema → store)    │
└──────────────────────────┬───────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────┐      ┌──────────────────────┐
│  SQLite Tables   │      │  REST API Endpoints   │
│  (analytics_*)   │      │  /api/analytics/*     │
└──────────────────┘      └──────────────────────┘
              │                         │
              ▼                         ▼
┌──────────────────┐      ┌──────────────────────┐
│  Scheduled Sync  │      │  Dashboard UI        │
│  (cron jobs)     │      │  (Chart.js)          │
└──────────────────┘      └──────────────────────┘
```

### Unified Metrics Schema

```sql
CREATE TABLE analytics_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,        -- google-ads, meta-ads, pinterest
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  date TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  conversions REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  ctr REAL,                      -- computed: clicks/impressions
  cpc REAL,                      -- computed: spend/clicks
  cpa REAL,                      -- computed: spend/conversions
  roas REAL,                     -- computed: revenue/spend
  platform_metrics JSON,         -- platform-specific extras
  synced_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE analytics_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT,
  metric TEXT NOT NULL,          -- ctr, cpc, cpa, roas
  baseline_value REAL,
  period TEXT,                   -- weekly, monthly
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE analytics_budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  daily_budget REAL,
  monthly_budget REAL,
  spent_to_date REAL,
  pacing_target REAL,           -- where spend should be at this point
  days_remaining INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_analytics_platform_date ON analytics_metrics(platform, date);
CREATE INDEX idx_analytics_campaign ON analytics_metrics(campaign_id, date);
```

### Key Components

**`analytics/aggregator.js`** — Normalize cross-platform data:
```js
class AnalyticsAggregator {
  normalizeMetrics(platform, rawData) {
    const normalizers = {
      'google-ads': (d) => ({
        impressions: d.metrics.impressions,
        clicks: d.metrics.clicks,
        spend: d.metrics.cost_micros / 1_000_000,
        conversions: d.metrics.conversions,
        revenue: d.metrics.conversion_value
      }),
      'meta-ads': (d) => ({
        impressions: parseInt(d.impressions),
        clicks: parseInt(d.clicks),
        spend: parseFloat(d.spend),
        conversions: parseFloat(d.actions?.find(a => a.action_type === 'purchase')?.value || 0),
        revenue: parseFloat(d.action_values?.find(a => a.action_type === 'purchase')?.value || 0)
      }),
      'pinterest': (d) => ({
        impressions: d.IMPRESSION,
        clicks: d.PIN_CLICK,
        spend: d.SPEND / 1_000_000,  // Pinterest reports in microcurrency
        conversions: d.CHECKOUT,
        revenue: d.CHECKOUT_VALUE
      })
    };
    return normalizers[platform](rawData);
  }
}
```

**`analytics/budget-pacer.js`** — Budget pacing calculations:
```js
class BudgetPacer {
  calculatePacing(campaign) {
    const daysElapsed = daysBetween(campaign.startDate, today());
    const totalDays = daysBetween(campaign.startDate, campaign.endDate);
    const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
    const pacingRatio = campaign.spentToDate / expectedSpend;
    
    return {
      status: pacingRatio > 1.1 ? 'overpacing' : pacingRatio < 0.9 ? 'underpacing' : 'on-track',
      pacingRatio,
      expectedSpend,
      actualSpend: campaign.spentToDate,
      projectedTotal: (campaign.spentToDate / daysElapsed) * totalDays,
      recommendation: this.getRecommendation(pacingRatio)
    };
  }
}
```

### API Endpoints

```
GET  /api/analytics/overview              -- Cross-platform summary
GET  /api/analytics/campaigns             -- All campaigns, all platforms
GET  /api/analytics/campaigns/:id/trend   -- Time-series for one campaign
GET  /api/analytics/compare               -- Side-by-side platform comparison
GET  /api/analytics/pacing                -- Budget pacing for all campaigns
GET  /api/analytics/benchmarks            -- Performance vs baselines
POST /api/analytics/export                -- Export data (CSV, JSON)
POST /api/analytics/sync                  -- Trigger manual data sync
```

### Export Formats

```js
// analytics/exporter.js
class AnalyticsExporter {
  toCSV(data) { /* standard CSV */ }
  toJSON(data) { /* structured JSON */ }
  toPowerBI(data) {
    // Power BI compatible JSON with proper schema hints
    return {
      '@odata.context': 'analytics',
      value: data.map(row => ({
        ...row,
        date: new Date(row.date).toISOString(),  // Power BI date format
        spend: parseFloat(row.spend),              // Explicit numeric
      }))
    };
  }
}
```

### Dashboard UI

New page: `ui/analytics.html` with:
- **Overview cards**: Total spend, impressions, clicks, ROAS across all platforms
- **Platform comparison chart**: Side-by-side bar chart (Chart.js)
- **Spend trend line**: Daily spend by platform over time
- **Pacing gauge**: Visual budget pacing indicator per campaign
- **Top/bottom performers**: Sortable table with sparklines

### Dependencies
- Chart.js (already needed for UI Polish)
- Depends on Real Database (Feature #1) being in place

### Complexity: ~2 weeks
- Aggregator + normalizers: 3 days
- Budget pacer: 2 days
- API endpoints: 2 days
- Dashboard UI (charts): 3 days
- Export functionality: 1 day
- Cron sync jobs: 1 day

### Risks
- Data freshness — API rate limits affect sync frequency
- Metric normalization edge cases across platforms
- Chart.js performance with large datasets (paginate/aggregate)

---

## 5. Agent Intelligence

### Architecture Overview

Add persistent memory and learning capabilities to agents. Uses SQLite tables (from Feature #1) plus optional vector similarity for pattern matching.

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Agent      │────▶│  Agent Memory    │────▶│  SQLite Tables  │
│  (stateless) │     │  Service         │     │  agent_memory   │
│              │◀────│  (retrieval +    │     │  agent_learnings│
│              │     │   storage)       │     │  ab_tests       │
└──────────────┘     └──────────────────┘     └─────────────────┘
```

### Data Model

```sql
CREATE TABLE agent_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,         -- 'trader', 'analyst', etc.
  memory_type TEXT NOT NULL,      -- 'campaign_outcome', 'optimization', 'preference'
  context JSON NOT NULL,          -- what was the situation
  action JSON NOT NULL,           -- what was done
  outcome JSON NOT NULL,          -- what happened
  score REAL,                     -- success rating (-1 to 1)
  tags TEXT,                      -- comma-separated for simple search
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE agent_learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  pattern TEXT NOT NULL,           -- "high_cpc_search_campaigns"
  insight TEXT NOT NULL,           -- "Reducing bids by 15% on weekends improved ROAS by 22%"
  confidence REAL DEFAULT 0.5,    -- 0 to 1, increases with more supporting evidence
  evidence_count INTEGER DEFAULT 1,
  last_validated TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ab_tests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  variant_a JSON NOT NULL,         -- { bidStrategy: 'manual', bid: 2.50 }
  variant_b JSON NOT NULL,         -- { bidStrategy: 'manual', bid: 3.00 }
  metric TEXT NOT NULL,            -- 'cpa', 'roas', 'ctr'
  status TEXT DEFAULT 'running',   -- running, completed, inconclusive
  results JSON,                    -- { winner: 'B', confidence: 0.95, lift: 12.3 }
  min_sample_size INTEGER DEFAULT 1000,
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX idx_memory_agent ON agent_memory(agent_id, memory_type);
CREATE INDEX idx_learnings_agent ON agent_learnings(agent_id);
CREATE INDEX idx_abtests_status ON ab_tests(status);
```

### Key Components

**`agents/memory-service.js`:**
```js
class AgentMemoryService {
  async remember(agentId, { type, context, action, outcome, score, tags }) {
    await db('agent_memory').insert({
      id: uuid(), agent_id: agentId, memory_type: type,
      context: JSON.stringify(context),
      action: JSON.stringify(action),
      outcome: JSON.stringify(outcome),
      score, tags: tags.join(',')
    });
    await this.updateLearnings(agentId, type, context, outcome, score);
  }

  async recall(agentId, { type, tags, limit = 10 }) {
    let q = db('agent_memory').where('agent_id', agentId);
    if (type) q = q.where('memory_type', type);
    if (tags) q = q.where('tags', 'like', `%${tags}%`);
    return q.orderBy('score', 'desc').limit(limit);
  }

  async getRecommendations(agentId, context) {
    // Find similar past situations with positive outcomes
    const memories = await this.recall(agentId, {
      type: context.type,
      tags: context.platform
    });
    const learnings = await db('agent_learnings')
      .where('agent_id', agentId)
      .where('confidence', '>', 0.6)
      .orderBy('confidence', 'desc');
    
    return { relevantMemories: memories, applicableLearnings: learnings };
  }
}
```

**`agents/ab-test-manager.js`:**
```js
class ABTestManager {
  async evaluateTest(testId) {
    const test = await db('ab_tests').where('id', testId).first();
    const metricsA = await this.getMetrics(test.campaign_id, test.variant_a);
    const metricsB = await this.getMetrics(test.campaign_id, test.variant_b);
    
    // Simple z-test for proportions (CTR) or t-test for means (CPA)
    const { significant, pValue, winner, lift } = this.statisticalTest(metricsA, metricsB, test.metric);
    
    if (significant && metricsA.sampleSize >= test.min_sample_size) {
      await db('ab_tests').where('id', testId).update({
        status: 'completed',
        results: JSON.stringify({ winner, confidence: 1 - pValue, lift }),
        completed_at: new Date().toISOString()
      });
      
      // Store as learning
      await this.memoryService.remember(test.agent_id || 'trader', {
        type: 'ab_test_result',
        context: { campaign: test.campaign_id, platform: test.platform },
        action: { variantA: test.variant_a, variantB: test.variant_b },
        outcome: { winner, lift, metric: test.metric },
        score: lift > 0 ? Math.min(lift / 100, 1) : 0,
        tags: [test.platform, test.metric, 'ab_test']
      });
    }
  }
  
  statisticalTest(a, b, metric) {
    // Z-test for proportions
    const p1 = a[metric], p2 = b[metric];
    const n1 = a.sampleSize, n2 = b.sampleSize;
    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2));
    const z = (p1 - p2) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    return {
      significant: pValue < 0.05,
      pValue,
      winner: p1 > p2 ? 'A' : 'B',
      lift: ((Math.max(p1, p2) - Math.min(p1, p2)) / Math.min(p1, p2)) * 100
    };
  }
}
```

**Predictive Budget Allocation** — Simple regression rather than full ML:
```js
// agents/budget-predictor.js
class BudgetPredictor {
  async suggestAllocation(totalBudget, campaigns) {
    // Score each campaign based on historical performance
    const scores = await Promise.all(campaigns.map(async (c) => {
      const history = await db('analytics_metrics')
        .where('campaign_id', c.id)
        .orderBy('date', 'desc')
        .limit(30);
      
      const avgRoas = history.reduce((s, r) => s + r.roas, 0) / history.length;
      const trend = this.calculateTrend(history.map(h => h.roas));  // linear regression slope
      const volatility = this.standardDeviation(history.map(h => h.roas));
      
      // Score = weighted combination of ROAS, trend, and stability
      return {
        campaignId: c.id,
        score: (avgRoas * 0.5) + (trend * 0.3) + ((1 / (1 + volatility)) * 0.2),
        avgRoas, trend, volatility
      };
    }));
    
    // Allocate proportionally to scores (with min floor)
    const totalScore = scores.reduce((s, c) => s + Math.max(c.score, 0.1), 0);
    return scores.map(c => ({
      ...c,
      suggestedBudget: (Math.max(c.score, 0.1) / totalScore) * totalBudget,
      rationale: `ROAS: ${c.avgRoas.toFixed(2)}, Trend: ${c.trend > 0 ? '↑' : '↓'}`
    }));
  }
}
```

### Dependencies
- Depends on Real Database (Feature #1)
- Depends on Analytics Layer (Feature #4) for historical metrics
- No external ML libraries — uses simple statistical methods

### Complexity: ~2.5 weeks
- Memory service + DB schema: 3 days
- Recommendation engine: 3 days
- A/B test manager with stats: 3 days
- Budget predictor: 2 days
- Agent integration (update all 8 agents): 2 days
- UI for memory/recommendations: 2 days

### Risks
- Statistical significance requires real data volume — test mode will need synthetic datasets
- "Learning" without large datasets can produce overconfident recommendations — need confidence thresholds
- Avoid over-engineering: simple heuristics often beat ML at this scale

---

## 6. Integration Hub

### Architecture Overview

Inbound webhooks (external systems trigger workflows) + outbound notifications (workflow events push to Slack/Discord/email) + API documentation.

```
                    INBOUND                                    OUTBOUND
┌──────────────┐   POST /api/webhooks/:id   ┌─────────┐   eventBus.on()   ┌──────────────┐
│ External     │ ──────────────────────────▶ │ Webhook │ ◀──────────────── │ Workflow     │
│ Systems      │                             │ Router  │                   │ Executor     │
│ (Zapier,     │   API Key auth              │         │                   │              │
│  n8n, etc.)  │                             │         │ ────────────────▶ │              │
└──────────────┘                             └─────────┘                   └──────────────┘
                                                                                │
                                                                    ┌───────────┴──────────┐
                                                                    ▼                      ▼
                                                          ┌──────────────┐      ┌──────────────┐
                                                          │ Slack/Discord│      │  Email       │
                                                          │ Notifier     │      │  (nodemailer)│
                                                          └──────────────┘      └──────────────┘
```

### Key Components

**Inbound Webhooks — `routes/webhooks.js`:**
```js
const db = require('../database/knex');

// Register a webhook
router.post('/api/webhooks', async (req, res) => {
  const webhook = {
    id: uuid(),
    name: req.body.name,
    workflow_id: req.body.workflowId,
    params_mapping: JSON.stringify(req.body.paramsMapping || {}),
    api_key: generateApiKey(),
    active: true,
    created_at: new Date().toISOString()
  };
  await db('webhooks').insert(webhook);
  res.json({ ...webhook, endpoint: `/api/webhooks/${webhook.id}` });
});

// Receive webhook call
router.post('/api/webhooks/:id', async (req, res) => {
  const webhook = await db('webhooks').where('id', req.params.id).where('active', true).first();
  if (!webhook) return res.status(404).json({ error: 'Webhook not found' });
  
  // Verify API key
  if (req.headers['x-api-key'] !== webhook.api_key) return res.status(401).json({ error: 'Invalid API key' });
  
  // Map incoming payload to workflow params
  const params = mapParams(req.body, JSON.parse(webhook.params_mapping));
  
  // Trigger workflow
  const execution = await executor.run(webhook.workflow_id, params);
  res.json({ executionId: execution.id, status: 'triggered' });
});
```

**Outbound Notifications — `notifications/`:**
```js
// notifications/discord.js
class DiscordNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }
  
  async send({ title, message, color, fields }) {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title, description: message,
          color: color || 0x00ff00,
          fields: fields?.map(f => ({ name: f.label, value: f.value, inline: true })),
          timestamp: new Date().toISOString()
        }]
      })
    });
  }
}

// notifications/slack.js
class SlackNotifier {
  constructor(webhookUrl) { this.webhookUrl = webhookUrl; }
  
  async send({ title, message, fields }) {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: title } },
          { type: 'section', text: { type: 'mrkdwn', text: message } },
          ...(fields || []).map(f => ({
            type: 'section',
            fields: [{ type: 'mrkdwn', text: `*${f.label}*\n${f.value}` }]
          }))
        ]
      })
    });
  }
}

// notifications/index.js — Route events to notifiers
class NotificationRouter {
  constructor(config) {
    this.notifiers = [];
    if (config.discord?.webhookUrl) this.notifiers.push(new DiscordNotifier(config.discord.webhookUrl));
    if (config.slack?.webhookUrl) this.notifiers.push(new SlackNotifier(config.slack.webhookUrl));
  }
  
  async notify(event, data) {
    const message = this.formatEvent(event, data);
    await Promise.allSettled(this.notifiers.map(n => n.send(message)));
  }
}
```

**Event → Notification wiring:**
```js
// In server.js or events/bus.js
const notificationRouter = new NotificationRouter(config.notifications);

eventBus.on('workflow.completed', (data) => {
  notificationRouter.notify('workflow.completed', {
    title: `✅ Workflow Complete: ${data.workflowName}`,
    message: `Finished in ${data.duration}`,
    fields: [
      { label: 'Workflow', value: data.workflowName },
      { label: 'Duration', value: data.duration },
      { label: 'Result', value: data.summary || 'Success' }
    ]
  });
});
```

### Data Model

```sql
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  params_mapping JSON,
  api_key TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  last_triggered TEXT,
  trigger_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notification_configs (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,       -- 'slack', 'discord', 'email'
  config JSON NOT NULL,        -- { webhookUrl: '...', channel: '#alerts' }
  events TEXT,                 -- comma-separated event types to listen for
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### API Documentation

Generate with **Swagger/OpenAPI** spec file:
```js
// docs/openapi.yaml — served at /api/docs
// Use swagger-ui-express to serve interactive docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### Dependencies
- `swagger-ui-express` + `yamljs` (API docs)
- `nodemailer` (optional, for email notifications)
- Discord/Slack webhook URLs (free, no API keys needed)

### Complexity: ~1.5 weeks
- Inbound webhooks: 3 days
- Outbound notifiers (Slack + Discord): 2 days
- Notification config UI: 2 days
- API documentation: 1 day
- Email notifications (optional): 1 day

### Risks
- Webhook security — API key auth is sufficient but consider rate limiting
- Notification fatigue — need configurable event filters
- Slack/Discord webhook URLs are secrets — need env var or config management

---

## Cross-Cutting Concerns

### Configuration Management
Move from scattered config to unified `config/settings.js`:
```js
module.exports = {
  database: { type: 'sqlite', path: './database/ad-ops.db' },
  connectors: {
    googleAds: { mode: 'test' },
    metaAds: { mode: 'test' },
    pinterest: { mode: 'test' }
  },
  notifications: {
    discord: { webhookUrl: process.env.DISCORD_WEBHOOK },
    slack: { webhookUrl: process.env.SLACK_WEBHOOK }
  },
  analytics: { syncInterval: '0 */6 * * *' },  // every 6 hours
  sse: { heartbeatInterval: 30000 }
};
```

### Error Handling
Standardize across all new features:
```js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

### Testing Strategy
- Unit tests for repos, aggregator, memory service
- Integration tests for API endpoints
- Test data generators for each connector
- Use `better-sqlite3`'s in-memory mode for test DB
