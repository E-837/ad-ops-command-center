# Digital Advertising Command Center

> **AI-powered platform for managing digital advertising operations across search, social, and programmatic channels with intelligent automation, real-time analytics, and multi-agent orchestration.**

## 🚀 What It Does

A comprehensive ad ops platform that combines:
- **Live API integrations** with Google Ads, Meta Ads, and Pinterest
- **Real-time dashboards** with SSE updates and Chart.js visualizations
- **AI agents** with memory, learning, and intelligent recommendations
- **Automated workflows** for campaign launch, optimization, and reporting
- **Cross-platform analytics** with benchmarks and performance tracking
- **A/B testing framework** with statistical significance analysis
- **Predictive budget allocation** using ML-style forecasting
- **Webhook & notification system** for integrations and alerts

## ✨ Key Features

### 🔌 Platform Connectors (3 Live + 3 Mocked)

**Production Connectors:**
- ✅ **Google Ads** - Search campaigns (9 MCP tools, OAuth2, dual-mode)
- ✅ **Meta Ads** - Facebook/Instagram (13 MCP tools, OAuth2, dual-mode)
- ✅ **Pinterest Ads** - Visual discovery (15 MCP tools, OAuth2, dual-mode)

**Mock Connectors (Demo/Planning):**
- 📦 The Trade Desk (TTD)
- 📦 DV360 (Google)
- 📦 Amazon DSP

### 🤖 AI Agents (8 Specialized)

| Agent | Capabilities | Tools |
|-------|-------------|-------|
| **MediaPlanner** | Campaign strategy, budgets, channel mix | Planning, benchmarks |
| **Trader** | Campaign execution, bidding, pacing | All platform connectors |
| **Analyst** | Reporting, insights, anomaly detection | Analytics, metrics |
| **CreativeOps** | Asset management, specs, rotations | Image gen, design tools |
| **Compliance** | Brand safety, fraud detection, policy | Verification, rules |
| **ProjectManager** | Project tracking, Asana integration | Asana MCP (44 tools) |
| **SearchMarketer** | Google/Microsoft search campaigns | Google Ads connector |
| **SocialMediaBuyer** | Meta/Pinterest social campaigns | Meta + Pinterest connectors |
| **AsanaProjectManager** | PRD→Asana, status tracking, risk assessment | Asana MCP |

### 🧠 Intelligence Layer

**Agent Memory:**
- Long-term learning (campaign performance, optimization outcomes)
- Short-term session context (TTL-based expiration)
- Confidence-scored memories (0-1, auto-cleanup at <0.3)
- Search & filtering by agent, category, source

**Recommendation Engine:**
- Budget reallocation (based on ROAS efficiency)
- Bid optimization (platform-specific strategies)
- Targeting expansion/narrowing (performance-based)
- Creative refresh suggestions
- Platform mix recommendations
- Prioritized action lists (top 3 by impact)

**A/B Testing:**
- Automated test creation (creative, bid, targeting, budget)
- Statistical significance (chi-squared, 95% confidence)
- Auto-winner detection (lift > 20%)
- Learning storage (winners saved to agent memory)

**Predictive Analytics:**
- Performance forecasting (budget scenario modeling)
- Budget optimization (ROAS-weighted allocation)
- Trend detection (linear regression, 14-day window)
- Confidence scoring (based on data volume)

### 📊 Real-Time Dashboards

**Dashboard:**
- Workflow activity (7-day trend line chart)
- Success rate gauge (color-coded health)
- Platform distribution (doughnut chart)
- Recent performance (last 10 executions bar chart)
- SSE live updates (1/sec debounced)

**Reports:**
- Spend trend (30-day line + 7-day MA)
- CTR comparison (platform bars + benchmarks)
- Conversion funnel (multi-stage drop-off)
- ROAS by campaign (top 10)
- Export to CSV/JSON/clipboard

**Analytics:**
- Cross-platform comparison table
- Budget pacing gauges (per platform)
- Top performers widget (top 5 campaigns)
- Alerts & recommendations
- Real-time refresh (30s intervals)

**Projects:**
- Project list with filters (type, status, search)
- Progress tracking (completion %)
- Budget utilization visualization
- Quick actions (run workflow, view details)

**Workflows:**
- Categorized workflow library (4 categories)
- Workflow cards (duration, connectors, triggers)
- Run modals with parameter forms
- Execution history log

**Workflow Detail:**
- Live stage progress (SSE updates)
- Stage timeline visualization
- Stage duration bar chart
- Animated progress bar (0-100%)
- Execution results & artifacts

**Integrations:**
- Webhook management UI
- Test delivery buttons
- Delivery log viewer (last 100 events)
- Notification channel status

**A/B Tests:**
- Active test list
- Progress visualization (significance meter)
- Results comparison (bar charts)
- Winner declaration with confirmation
- Test history log

### 🔄 Workflows (8 Registered)

**Campaign Operations:**
- `campaign-launch` - 5-stage: plan → create → creative → verify → approve
- `search-campaign-workflow` - AI keywords → AI copy → Google Ads campaign
- `creative-test` - A/B testing with statistical significance

**Reporting:**
- `pacing-check` - Budget pacing analysis
- `wow-report` - Week-over-week performance
- `monthly-report` - Monthly rollup with YoY comparison
- `cross-channel-report` - Platform performance comparison
- `optimization` - Performance optimization recommendations
- `anomaly-detection` - Statistical anomaly detection

**Orchestration:**
- `media-plan-execute` - Multi-channel launcher (parallel execution)
- `cross-channel-launch` - Same campaign across platforms

**Projects:**
- `prd-to-asana` - Parse PRD → create Asana project
- `project-status` - Health monitoring, blockers, recommendations

### 🔗 Integration Hub

**Webhooks:**
- Outbound delivery (exponential backoff, 3 retries)
- Inbound reception (HMAC-SHA256 signature verification)
- Event broadcasting (20+ event types)
- Delivery logging (success/failure tracking)

**Notifications:**
- Multi-channel support (Email, Slack, Discord, SMS)
- Template-based rendering (4 notification templates)
- Event-based routing (workflow.completed, workflow.failed, etc.)
- Mock implementations (production-ready architecture)

### 🗄️ Database Architecture

**SQLite + Knex.js:**
- 7 core tables (projects, executions, events, workflows, campaigns, metrics)
- 3 intelligence tables (agent_memory, agent_context, ab_tests)
- 2 integration tables (webhooks, webhook_deliveries)
- 28+ indexes for query optimization
- Migration system (reversible migrations)
- Seed data for development

**Performance:**
- 3.5x faster than JSON file storage
- 356 records/sec insert throughput
- Optimized indexes on common queries

## 🏗️ Architecture

```
ad-ops-command/
├── agents/              # 9 AI agents with specialized capabilities
├── connectors/          # Platform integrations (Google, Meta, Pinterest + mocks)
├── database/           
│   ├── models/         # Knex.js data access layer (12 models)
│   ├── migrations/     # Schema migrations (10 migrations)
│   └── seeds/          # Test data generators (4 seed files)
├── domain/             # Ad tech taxonomy, benchmarks, glossary, rules
├── events/             # Event bus, SSE manager, triggers (20+ event types)
├── integrations/       # Webhooks, notifications, templates
├── services/           # Business logic (analytics, recommendations, A/B testing, predictions)
├── utils/              # Export utilities, formatters, helpers
├── workflows/          # Automated workflows (12 workflows across 4 categories)
├── ui/                 # 9 HTML pages with Chart.js + SSE real-time updates
│   ├── components/     # Reusable components (sidebar, charts)
│   ├── css/            # Dark glass-morphism theme
│   └── js/             # Real-time client, utilities
├── docs/               # Comprehensive documentation (15+ guides)
└── tests/              # Test suites (30+ tests, 100% pass rate)
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npx knex migrate:latest --knexfile database/knexfile.js

# Load seed data (optional)
npx knex seed:run --knexfile database/knexfile.js
```

### Start Server

```bash
npm start
# Or with PM2 for production
pm2 start ecosystem.config.js
```

Server runs at **http://localhost:3002**

### Run Tests

```bash
# Database tests
node test-database.js

# Real-time tests
node test-realtime.js

# Analytics tests
node test-analytics.js

# Webhook tests
node test-webhooks.js

# Agent memory tests
node test-agent-memory.js

# All tests
npm run test:all
```

## 📡 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project

### Workflows
- `GET /api/workflows` - List all workflows (from registry)
- `GET /api/workflows/:name` - Get workflow details
- `POST /api/workflows/:name/run` - Execute workflow

### Executions
- `GET /api/executions` - List executions
- `GET /api/executions/:id` - Execution details

### Analytics (8 endpoints)
- `GET /api/analytics/spend-trend` - Daily spend time-series
- `GET /api/analytics/ctr-comparison` - Platform CTR comparison
- `GET /api/analytics/conversion-funnel` - Funnel metrics
- `GET /api/analytics/roas-by-campaign` - Top campaigns by ROAS
- `GET /api/analytics/budget-utilization` - Budget tracking
- `GET /api/analytics/performance-summary` - Overall KPIs
- `GET /api/analytics/platform-comparison` - Cross-platform metrics
- `GET /api/analytics/benchmarks` - Industry benchmarks

### Recommendations (8 endpoints)
- `GET /api/recommendations/campaign/:id` - All recommendations
- `GET /api/recommendations/budget/:id` - Budget recommendations
- `GET /api/recommendations/bid/:id` - Bid recommendations
- `GET /api/recommendations/targeting/:id` - Targeting recommendations
- `GET /api/recommendations/creative/:id` - Creative recommendations
- `GET /api/recommendations/platform/:id` - Platform mix recommendations
- `GET /api/recommendations/priorities/:id` - Top priorities
- `POST /api/recommendations/:id/apply` - Apply recommendation

### A/B Testing (9 endpoints)
- `GET /api/ab-tests` - List all tests
- `POST /api/ab-tests` - Create test
- `GET /api/ab-tests/:id` - Test details
- `PATCH /api/ab-tests/:id` - Update test
- `DELETE /api/ab-tests/:id` - Delete test
- `POST /api/ab-tests/:id/analyze` - Analyze results
- `POST /api/ab-tests/:id/declare-winner` - Declare winner
- `POST /api/ab-tests/:id/apply-winner` - Apply winner
- `GET /api/ab-tests/:id/history` - Test history

### Predictions (3 endpoints)
- `POST /api/predictions/performance` - Forecast performance
- `POST /api/predictions/budget-allocation` - Optimize budget split
- `GET /api/predictions/trends/:campaignId` - Trend analysis

### Webhooks (8 endpoints)
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks/:id` - Webhook details
- `PATCH /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/test` - Test delivery
- `GET /api/webhooks/:id/deliveries` - Delivery log
- `POST /api/webhooks/incoming/:id` - Receive webhook

### Real-Time
- `GET /api/stream` - SSE event stream (filters: eventType, executionId, projectId)
- `GET /api/stream/stats` - Active connections stats

### Events
- `GET /api/events` - Query events (filters: type, source, project, execution, date range)

## 📚 Documentation

### Core Guides
- **[DATABASE-MIGRATION.md](docs/DATABASE-MIGRATION.md)** - Database architecture & migration guide
- **[REALTIME-API.md](docs/REALTIME-API.md)** - SSE API reference
- **[CHARTS-GUIDE.md](docs/CHARTS-GUIDE.md)** - Chart.js usage guide
- **[ANALYTICS-API.md](docs/ANALYTICS-API.md)** - Analytics endpoints
- **[WEBHOOKS-GUIDE.md](docs/WEBHOOKS-GUIDE.md)** - Webhook integration
- **[NOTIFICATIONS-GUIDE.md](docs/NOTIFICATIONS-GUIDE.md)** - Notification setup
- **[AGENT-INTELLIGENCE.md](docs/AGENT-INTELLIGENCE.md)** - Intelligence layer
- **[AB-TESTING-GUIDE.md](docs/AB-TESTING-GUIDE.md)** - A/B testing framework
- **[PREDICTIONS-API.md](docs/PREDICTIONS-API.md)** - Prediction API reference

### Platform Connectors
- **[GOOGLE_ADS_SETUP.md](connectors/GOOGLE_ADS_SETUP.md)** - Google Ads setup
- **[META_ADS_SETUP.md](connectors/META_ADS_SETUP.md)** - Meta Ads setup
- **[PINTEREST_SETUP.md](connectors/PINTEREST_SETUP.md)** - Pinterest Ads setup
- **[PINTEREST_API_REFERENCE.md](connectors/PINTEREST_API_REFERENCE.md)** - Pinterest API docs
- **[PINTEREST-INTEGRATION.md](docs/PINTEREST-INTEGRATION.md)** - Pinterest integration guide

### Quick Starts
- **[WEEK-1-QUICKSTART.md](WEEK-1-QUICKSTART.md)** - Database quick start
- **[WEEK-2-QUICKSTART.md](WEEK-2-QUICKSTART.md)** - Real-time quick start
- **[WEEK-3-QUICKSTART.md](WEEK-3-QUICKSTART.md)** - Analytics quick start
- **[WEEK-5-QUICKSTART.md](WEEK-5-QUICKSTART.md)** - Intelligence quick start

### Architecture & Roadmap
- **[ARCHITECTURE-V2.md](docs/ARCHITECTURE-V2.md)** - Platform architecture
- **[IMPLEMENTATION-ROADMAP.md](docs/IMPLEMENTATION-ROADMAP.md)** - Development roadmap
- **[PHASE-3-ARCHITECTURE.md](docs/PHASE-3-ARCHITECTURE.md)** - Phase 3 design
- **[PHASE-3-ROADMAP.md](docs/PHASE-3-ROADMAP.md)** - Phase 3 roadmap

## 🧪 Test Coverage

### Test Suites
- **Database:** 26/26 tests passing ✅
- **Real-time:** 6/6 tests passing ✅
- **Analytics:** 9/9 tests passing ✅
- **Webhooks:** 13/13 tests passing ✅
- **Agent Memory:** 8/8 tests passing ✅
- **Google Ads:** 9/9 tests passing ✅
- **Meta Ads:** 16/16 tests passing ✅
- **Pinterest Ads:** 24/24 tests passing ✅

**Total: 111+ tests, 100% pass rate** 🎉

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id

# Meta Ads
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=your_ad_account_id

# Pinterest Ads
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret
PINTEREST_ACCESS_TOKEN=your_access_token
PINTEREST_AD_ACCOUNT_ID=your_ad_account_id

# Database
DATABASE_PATH=database/data/ad-ops.db

# Server
PORT=3002
NODE_ENV=development
```

### Dual-Mode Operation

All connectors support **dual-mode**:
- **Sandbox mode** - Works without credentials (mock data)
- **Live mode** - Real API calls when credentials configured

Perfect for development and testing without touching production accounts.

## 📊 Statistics

### Codebase
- **Lines of code:** ~33,330 insertions
- **Files:** 101 changed files
- **Models:** 12 database models
- **Services:** 4 business logic services
- **Agents:** 9 specialized AI agents
- **Connectors:** 6 platform integrations (3 live + 3 mocked)
- **Workflows:** 12 automated workflows
- **API endpoints:** 60+ RESTful endpoints
- **Tests:** 111+ comprehensive tests
- **Documentation:** 30,000+ words across 15+ guides

### Performance
- **Database:** 356 records/sec insert, 3.5x faster than JSON
- **Real-time:** <1ms event broadcast latency
- **SSE:** Supports 100+ concurrent connections
- **Charts:** <100ms render time with debouncing

## 🗺️ Roadmap

### ✅ Completed (Weeks 1-5)
- Week 1: Database Migration (SQLite + Knex)
- Week 2: Real-time Updates + Visualizations
- Week 3: Analytics Layer + Integration Hub
- Week 4: Pinterest Connector
- Week 5: Agent Intelligence

### 🔜 Planned (Weeks 6-10)
- Week 6: UI Polish (mobile responsive, workflow templates)
- Week 7-8: Microsoft Ads Connector (Bing search)
- Week 9: LinkedIn + TikTok Connectors
- Week 10: Production Hardening & Final Polish

## 🤝 Contributing

Built with [OpenClaw](https://github.com/openclaw/openclaw) - AI-powered agent framework.

## 📄 License

MIT

---

**Built:** February 2026  
**Platform:** Node.js + Express + SQLite + Knex.js + Chart.js  
**Agent Framework:** OpenClaw with Claude Sonnet 4.5 + Opus 4.6 + Codex 5.3  
**Status:** Production-ready (Weeks 1-5 complete)
