# System Architecture

## Overview

The Digital Advertising Command is a full-stack Node.js application that provides AI-powered media operations for managing campaigns across multiple advertising platforms.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (UI)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │Dashboard │ │Campaigns │ │Workflows │ │ Analytics      │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────┘ │
└───────┼───────────┼──────────────┼──────────────────┼────────┘
        │           │              │                  │
        └───────────┴──────────────┴──────────────────┘
                               │
┌───────────────────────────────────────────────────────────────┐
│                     Express Server (3002)                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                      │  │
│  │  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Logger  │ │ Error      │ │ Response │ │ CORS     │  │  │
│  │  │         │ │ Handler    │ │ Helpers  │ │          │  │  │
│  │  └─────────┘ └────────────┘ └──────────┘ └──────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    API Routes Layer                      │  │
│  │ /api/campaigns  /api/analytics  /api/workflows          │  │
│  │ /api/connectors /api/projects   /api/executions         │  │
│  │ /api/webhooks   /api/stream     /api/integrations       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Core Business Logic                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │  │
│  │  │  Workflow   │  │   Event     │  │  Integration   │  │  │
│  │  │  Executor   │  │   System    │  │   Hub          │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼─────────┐  ┌────────▼────────┐  ┌─────────▼────────┐
│   Database      │  │   Connectors    │  │   Event Bus      │
│   (SQLite)      │  │   (7 Platforms) │  │   (SSE + WH)     │
│                 │  │                 │  │                  │
│  • Projects     │  │  • Meta Ads     │  │  • SSE Manager   │
│  • Campaigns    │  │  • Google Ads   │  │  • Webhooks      │
│  • Metrics      │  │  • Microsoft    │  │  • Triggers      │
│  • Executions   │  │  • LinkedIn     │  │                  │
│  • Events       │  │  • TikTok       │  │                  │
│  • Webhooks     │  │  • Pinterest    │  │                  │
│                 │  │  • Amazon DSP   │  │                  │
└─────────────────┘  └─────────────────┘  └──────────────────┘
```

## Component Descriptions

### Frontend Layer

Static HTML/CSS/JavaScript served from `ui/` (dev) or `build/` (prod).

**Pages:**
- Dashboard - Overview of all campaigns and metrics
- Campaigns - Campaign CRUD operations
- Workflows - Workflow execution and monitoring
- Analytics - Performance insights and reports
- Connectors - Platform connection management

### API Layer

Express-based REST API with modular routes.

**Key Routes:**
- `routes/campaigns.js` - Campaign CRUD
- `routes/analytics.js` - Performance metrics
- `routes/workflows.js` - Workflow management
- `routes/connectors.js` - Platform integrations

### Core Business Logic

**Workflow Executor** (`executor.js`)
- Executes multi-step workflows
- Manages execution queue
- Coordinates agent actions
- Emits progress events

**Event System** (`events/`)
- Event bus for publish/subscribe
- SSE (Server-Sent Events) for real-time updates
- Webhook delivery system
- Event-driven workflow triggers

**Integration Hub** (`integrations/`)
- Recommendations engine
- A/B testing framework
- Predictive analytics
- Cross-platform optimization

### Data Layer

**Database** (`database/`)
- SQLite for structured data
- Knex query builder
- Migration system
- Seed data

**Models:**
- Projects - Campaign groupings
- Campaigns - Ad campaigns
- Metrics - Performance data
- Executions - Workflow runs
- Events - System events
- Webhooks - Webhook subscriptions

### Connector Layer

**BaseConnector** (`connectors/base-connector.js`)
- Abstract base class for all connectors
- Handles OAuth, env loading, dual-mode
- Standard response format

**Platform Connectors:**
1. Meta Ads (Facebook, Instagram)
2. Google Ads (Search, Display, YouTube)
3. Microsoft Advertising (Bing)
4. LinkedIn Ads
5. TikTok Ads
6. Pinterest Ads
7. Amazon DSP

## Request Flow

### Campaign Creation

```
User → POST /api/campaigns → Route Handler
  → campaigns.create() → Database Insert
  → Event: campaign_created → Event Bus
  → Webhook Delivery + SSE Broadcast
  → Response to User
```

### Workflow Execution

```
User → POST /api/workflows/:id/execute → Route Handler
  → executor.queueWorkflow() → Queue
  → processQueue() → Execute Stages
    → Stage 1: connector.callTool()
    → Stage 2: agent.process()
    → Stage 3: integration.analyze()
  → Update Database + Emit Events
  → Response to User (executionId)
```

### Real-time Analytics

```
User → GET /api/stream → SSE Connection Established
  → SSE Manager → Store Client
  → Event Occurs → Event Bus → SSE Manager
  → Broadcast to Matching Clients
  → User Receives Event
```

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT,
  owner TEXT,
  startDate TEXT,
  endDate TEXT,
  budget DECIMAL,
  platform TEXT,
  metadata JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  projectId TEXT REFERENCES projects(id),
  platform TEXT NOT NULL,
  externalId TEXT,
  name TEXT NOT NULL,
  status TEXT,
  budget DECIMAL,
  startDate TEXT,
  endDate TEXT,
  metadata JSON,
  syncedAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Metrics Table
```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY,
  campaignId TEXT REFERENCES campaigns(id),
  date TEXT NOT NULL,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  spend DECIMAL,
  revenue DECIMAL,
  ctr DECIMAL,
  cpc DECIMAL,
  cpa DECIMAL,
  roas DECIMAL,
  metadata JSON,
  syncedAt TIMESTAMP,
  UNIQUE(campaignId, date)
);
```

## Design Patterns

### 1. **Connector Pattern (BaseConnector)**

All platform connectors extend BaseConnector for:
- Environment variable loading
- OAuth configuration
- Dual-mode (live/sandbox)
- Standardized responses

### 2. **Event-Driven Architecture**

Events trigger workflows and integrations:
- `campaign_created` → Optimization workflow
- `metric_threshold` → Alert workflow
- `workflow_completed` → Update project status

### 3. **Queue-Based Execution**

Workflows execute via priority queue:
- Priority levels: high, normal, low
- Sequential execution
- Error recovery
- Progress tracking

### 4. **Repository Pattern**

Database operations abstracted:
- `database/campaigns.js` - Campaign repository
- `database/projects.js` - Project repository
- Clean separation of concerns

### 5. **Middleware Chain**

Request processing pipeline:
- Logger → Error Handler → Route Handler → Response

## Error Handling

Centralized error handling with custom error classes:
- `ValidationError` (400)
- `NotFoundError` (404)
- `APIError` (502)
- Global error middleware catches all errors

## Logging

Winston-based structured logging:
- File logs: `logs/combined.log`, `logs/error.log`
- Console output in development
- Request logging middleware
- Contextual metadata

## Performance Optimizations

1. **Database Indexes**
   - Compound indexes on common queries
   - Campaign+status, date+campaignId, etc.

2. **Gzip Compression**
   - All JS assets gzipped (~70% size reduction)
   - Served automatically in production

3. **Efficient Queries**
   - Knex query builder
   - Batched inserts
   - Selective field retrieval

## Security Considerations

1. **Input Validation**
   - ValidationError for bad input
   - Type checking in route handlers

2. **Error Responses**
   - Stack traces only in development
   - Generic error messages in production

3. **Rate Limiting** (Planned)
   - Per-IP rate limits
   - Burst protection

## Scalability

Current architecture supports:
- ~1000 campaigns
- ~100 concurrent workflow executions
- ~1000 SSE connections
- ~10M metric records

For larger scale:
- Switch to PostgreSQL
- Add Redis for queue
- Horizontal scaling with load balancer

---

See also:
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
