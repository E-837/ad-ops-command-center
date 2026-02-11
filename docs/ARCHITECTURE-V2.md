# Ad Ops Command Center v2 — Platform Architecture

## Executive Summary

Expand from a campaign-operations tool into a **comprehensive digital advertising operations platform** covering campaign ops, ad ops projects, universal project management, and multi-channel orchestration. The architecture introduces a categorized workflow system with event-driven triggers, composable orchestrator patterns, a unified project model, and a redesigned UI with a workflow library and project dashboard.

---

## 1. Workflow System Architecture

### 1.1 Categorized Registry

Replace the flat `WORKFLOWS` map with a categorized registry that supports metadata, triggers, and composition.

```js
// workflows/registry.js
const registry = {
  categories: {
    'campaign-ops': {
      label: 'Campaign Operations',
      icon: '📊',
      workflows: ['campaign-launch', 'pacing-check', 'optimization', 'anomaly-detection', 'creative-test']
    },
    'reporting': {
      label: 'Reporting & Insights',
      icon: '📈',
      workflows: ['wow-report', 'monthly-report', 'cross-channel-report', 'attribution-report']
    },
    'projects': {
      label: 'Ad Ops Projects',
      icon: '📋',
      workflows: ['prd-to-asana', 'project-status', 'dsp-onboarding', 'jbp-workflow', 'rfp-response']
    },
    'orchestration': {
      label: 'Multi-Channel Orchestration',
      icon: '🎯',
      workflows: ['media-plan-execute', 'cross-channel-launch', 'budget-reallocation']
    }
  }
};
```

### 1.2 Workflow Metadata Schema

Every workflow exports a standard metadata object:

```js
module.exports = {
  meta: {
    id: 'prd-to-asana',
    name: 'PRD → Asana Project',
    category: 'projects',
    description: 'Parse a planning document and create a full Asana project with task hierarchy',
    version: '1.0.0',

    // Triggers
    triggers: {
      manual: true,           // user can invoke from UI/chat
      scheduled: null,        // cron expression or null
      events: ['doc.created', 'doc.tagged:prd']  // event triggers
    },

    // Dependencies
    requiredConnectors: ['asana', 'google-docs'],
    optionalConnectors: [],

    // I/O
    inputs: {
      documentUrl: { type: 'string', required: true, description: 'URL or ID of the planning doc' },
      asanaTeamId: { type: 'string', required: false, description: 'Target Asana team' },
      templateId:  { type: 'string', required: false, description: 'Asana project template' }
    },
    outputs: ['asana-project-url', 'task-count', 'timeline-estimate'],

    // Execution
    stages: [
      { id: 'parse',   name: 'Parse Document',    agent: 'analyst' },
      { id: 'plan',    name: 'Structure Project',  agent: 'project-manager' },
      { id: 'create',  name: 'Create in Asana',    agent: 'asana-project-manager' },
      { id: 'verify',  name: 'Verify & Link',      agent: 'asana-project-manager' }
    ],
    estimatedDuration: '5-15 min',

    // Composition
    isOrchestrator: false,
    subWorkflows: []
  },

  async run(params, context) { /* ... */ },
  getInfo() { return this.meta; }
};
```

### 1.3 Event System

A lightweight pub/sub bus that connects workflow outputs to workflow inputs:

```
┌─────────────┐    emit()     ┌──────────────┐   match triggers   ┌──────────────┐
│  Workflow A  │ ──────────── │  Event Bus   │ ─────────────────── │  Workflow B  │
│  (completes) │              │              │                     │  (auto-start)│
└─────────────┘              └──────────────┘                     └──────────────┘
                                    │
                              ┌─────┴──────┐
                              │ Event Store │  (audit trail)
                              └────────────┘
```

**Event types:**
- `workflow.completed` / `workflow.failed` / `workflow.stage.completed`
- `campaign.created` / `campaign.status.changed`
- `project.created` / `project.milestone.reached`
- `metric.threshold` (budget pacing, performance anomaly)
- `schedule.tick` (cron-driven)
- `doc.created` / `doc.tagged`

**Implementation:** `events/bus.js` — Node EventEmitter + persistence to `database/data/events.json`. Each event: `{ id, type, source, payload, timestamp }`. On emit, scan registry for matching `triggers.events`, queue matched workflows via executor.

### 1.4 Orchestrator Pattern

Orchestrator workflows compose sub-workflows:

```js
// workflows/orchestration/media-plan-execute.js
meta: {
  id: 'media-plan-execute',
  isOrchestrator: true,
  subWorkflows: ['campaign-launch', 'pacing-check'],
  stages: [
    { id: 'parse-plan',    name: 'Parse Media Plan',       agent: 'media-planner' },
    { id: 'route',         name: 'Route to Channels',      agent: 'media-planner' },
    { id: 'execute',       name: 'Execute Per-Channel',    type: 'parallel-fan-out',
      subWorkflow: 'campaign-launch', foreachKey: 'channels' },
    { id: 'monitor',       name: 'Setup Monitoring',       type: 'parallel-fan-out',
      subWorkflow: 'pacing-check', foreachKey: 'channels' },
    { id: 'consolidate',   name: 'Consolidate Results',    agent: 'analyst' }
  ]
}
```

The executor handles `type: 'parallel-fan-out'` by spawning sub-workflow executions and awaiting all.

---

## 2. Agent Architecture

### 2.1 Current Agents (unchanged)

| Agent | Domain | Connectors |
|-------|--------|------------|
| MediaPlanner | Budget allocation, channel strategy | Google Ads, Meta Ads |
| Trader | Campaign activation, bidding | All DSPs |
| Analyst | Reporting, insights, anomalies | All (read) |
| CreativeOps | Creative management | Meta Ads, image-gen |
| Compliance | Verification, brand safety | All (read) |
| ProjectManager | Coordination, status | Asana, Google Docs |
| CreativeCoordinator | Creative workflow | Figma, Canva |
| SearchMarketer | Search campaigns | Google Ads |

### 2.2 New: AsanaProjectManager Agent

```js
// agents/asana-project-manager.js
module.exports = {
  id: 'asana-project-manager',
  name: 'Asana Project Manager',
  domain: 'project-management',
  description: 'Manages Asana project lifecycle - creation, task hierarchy, status tracking, reporting',

  capabilities: [
    'create-project', 'create-task-hierarchy', 'update-task-status',
    'generate-standup', 'detect-blockers', 'timeline-health',
    'weekly-summary', 'risk-assessment'
  ],

  tools: ['asana.*'],  // all 44 Asana MCP tools

  // Agent functions
  async createProjectFromPRD(parsedDoc) { /* ... */ },
  async getProjectStatus(projectId) { /* ... */ },
  async generateStandup(projectId) { /* ... */ },
  async detectRisks(projectId) { /* ... */ },
  async generateWeeklySummary(projectId) { /* ... */ }
};
```

### 2.3 Agent-Workflow Interaction

Agents don't know about workflows. Workflows call agents:

```
Workflow Stage → executor looks up stage.agent → calls agent function → returns result
```

The executor resolves agent references, passes context (previous stage outputs, params), and collects results. Agents remain stateless and reusable across any workflow.

### 2.4 Future Agents (Phase 3+)

- **PartnershipManager** — JBP workflows, publisher negotiations
- **MigrationLead** — platform migration project management
- **BillingOps** — invoice reconciliation, discrepancy detection

---

## 3. Data Model

### 3.1 Unified Project Model

```js
// database/data/projects.json
{
  "id": "proj-abc123",
  "type": "campaign" | "ad-ops" | "infrastructure",
  "name": "Q1 Brand Campaign",
  "status": "active" | "planning" | "completed" | "paused",
  "category": "campaign-ops" | "projects" | "reporting",
  "owner": "agent-id or user",
  "created": "2026-02-10T...",
  "updated": "2026-02-10T...",

  // Links
  "workflowExecutions": ["exec-123", "exec-456"],
  "asanaProjectId": "12345",
  "campaigns": ["camp-001"],

  // Tracking
  "milestones": [
    { "name": "Plan Approved", "status": "done", "date": "2026-02-08" },
    { "name": "Live", "status": "pending", "date": null }
  ],
  "artifacts": [
    { "type": "media-plan", "url": "/output/plan-abc.json" },
    { "type": "report", "url": "/output/report-abc.html" }
  ],
  "metrics": {
    "completion": 0.65,
    "health": "on-track" | "at-risk" | "blocked",
    "blockers": []
  }
}
```

### 3.2 Workflow Execution Record

```js
// database/data/executions.json
{
  "id": "exec-123",
  "workflowId": "campaign-launch",
  "projectId": "proj-abc123",
  "status": "running" | "completed" | "failed" | "queued",
  "params": { /* input params */ },
  "stages": [
    { "id": "plan", "status": "completed", "agent": "media-planner",
      "startedAt": "...", "completedAt": "...", "result": { /* ... */ } }
  ],
  "artifacts": [],
  "events": ["evt-001", "evt-002"],
  "startedAt": "...",
  "completedAt": "..."
}
```

### 3.3 Event Record

```js
{
  "id": "evt-001",
  "type": "workflow.stage.completed",
  "source": "exec-123",
  "payload": { "stage": "plan", "workflowId": "campaign-launch" },
  "timestamp": "...",
  "triggeredWorkflows": []  // any workflows auto-triggered by this event
}
```

---

## 4. UI Architecture

### 4.1 Navigation Redesign

```
┌──────────────────────────────────────────────────────┐
│  Ad Ops Command Center                    [?] [⚙]   │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ 📊 Home  │   (content area)                          │
│          │                                           │
│ 🎯 Proj  │                                           │
│          │                                           │
│ 📋 Work  │                                           │
│  flows   │                                           │
│          │                                           │
│ 📡 Camps │                                           │
│          │                                           │
│ 🤖 Agents│                                           │
│          │                                           │
│ 🔌 Conns │                                           │
│          │                                           │
│ 📈 Rpts  │                                           │
│          │                                           │
│ 💬 Query │                                           │
│          │                                           │
│ 🏗 Arch  │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

**Pages (10 → replaces current 8):**

| Page | File | Purpose |
|------|------|---------|
| Home | `dashboard.html` | Unified dashboard — active projects, recent executions, alerts |
| Projects | `projects.html` | **NEW** — all projects (campaigns + ad ops), filterable by type |
| Workflows | `workflows.html` | **NEW** — workflow library by category, run/schedule/view history |
| Campaigns | `campaigns.html` | Campaign-specific view (subset of projects) |
| Agents | `agents.html` | Agent status and capabilities |
| Connectors | `connectors.html` | Connection status, auth management |
| Reports | `reports.html` | **RENAMED** from insights — report library and generation |
| Query | `query.html` | Conversational interface (enhanced) |
| Architecture | `architecture.html` | System diagram |
| Workflow Detail | `workflow-detail.html` | **NEW** — single workflow execution view with stage progress |

### 4.2 Key Screens

**Workflow Library (`workflows.html`):**
```
┌─────────────────────────────────────────────────────────┐
│  Workflow Library                    [+ New] [Search]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▸ Campaign Operations (5)                              │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│    │ Campaign │ │ Pacing   │ │ Optimize │  ...          │
│    │ Launch   │ │ Check    │ │          │              │
│    │ 🟢 Ready │ │ 🟢 Ready │ │ 🟢 Ready │              │
│    │ [Run]    │ │ [Run]    │ │ [Run]    │              │
│    └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
│  ▸ Ad Ops Projects (4)                                  │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│    │ PRD →    │ │ DSP      │ │ JBP      │  ...          │
│    │ Asana    │ │ Onboard  │ │ Workflow │              │
│    │ 🟢 Ready │ │ 🟡 Beta  │ │ 🔴 Draft │              │
│    │ [Run]    │ │ [Run]    │ │ [View]   │              │
│    └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
│  ▸ Reporting & Insights (3)                             │
│  ▸ Multi-Channel Orchestration (2)                      │
│                                                         │
│  ─── Recent Executions ───                              │
│  ✅ Campaign Launch — proj-abc — 2h ago                 │
│  🔄 Pacing Check — proj-def — running (stage 2/3)      │
│  ❌ WoW Report — failed — 5h ago                        │
└─────────────────────────────────────────────────────────┘
```

**Project Dashboard (`projects.html`):**
```
┌─────────────────────────────────────────────────────────┐
│  Projects                [+ New] [Filter▾] [Search]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Summary: 12 active │ 3 at-risk │ 2 blocked │ 8 done   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Q1 Brand Campaign          campaign │ 🟢 on-track│    │
│  │ 65% complete │ 3 active workflows │ Due: Mar 15 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ DSP Migration — TTD→DV360  ad-ops  │ 🟡 at-risk │    │
│  │ 40% complete │ 1 blocker │ Due: Apr 1          │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Amazon JBP 2026            ad-ops  │ 🟢 on-track│    │
│  │ 80% complete │ Asana linked │ Due: Feb 28      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Workflow Execution Detail (`workflow-detail.html`):**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back │ Campaign Launch — exec-123      🔄 Running   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Project: Q1 Brand Campaign                             │
│  Started: 10 min ago │ Est. remaining: 45 min           │
│                                                         │
│  Stages:                                                │
│  ✅ Planning ──── ✅ Creation ──── 🔄 Creative ──── ⬜ Verify ──── ⬜ Approve │
│  │ MediaPlanner │  │ Trader     │  │ CreativeOps│                    │
│  │ 3 min        │  │ 5 min      │  │ running... │                    │
│                                                         │
│  Artifacts:                                             │
│  📄 Media Plan (plan-abc.json)                          │
│  📊 Campaign IDs: google:123, meta:456                  │
│                                                         │
│  Event Log:                                             │
│  10:01 — Stage 'plan' completed                         │
│  10:04 — Stage 'create' completed                       │
│  10:04 — Stage 'creative' started                       │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Enhanced Query Interface

The query page becomes a conversational workflow trigger:

```
User: "Launch a search campaign for our new AI tool with $50k budget"
→ System identifies: campaign-launch workflow, search channel, $50k budget
→ Shows: "I'll run Campaign Launch with these params: [editable form]"
→ User confirms → workflow executes with live progress
```

---

## 5. Data Flows

### 5.1 Brief → Plan → Execute → Report

```
┌────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
│ Brief  │───▸│ MediaPlanner │───▸│ Orchestrator │───▸│ Analyst   │
│ (input)│    │ (plan)       │    │ (fan-out)    │    │ (report)  │
└────────┘    └─────────────┘    └──────┬───────┘    └───────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                   ┌──────────┐  ┌──────────┐  ┌──────────┐
                   │Google Ads│  │ Meta Ads │  │   TTD    │
                   │ (Trader) │  │ (Trader) │  │ (Trader) │
                   └──────────┘  └──────────┘  └──────────┘
```

### 5.2 PRD → Asana Project

```
┌────────┐    ┌─────────┐    ┌────────────┐    ┌───────────────┐
│ Google │───▸│ Analyst │───▸│ Project    │───▸│ AsanaProject  │
│ Doc    │    │ (parse) │    │ Manager    │    │ Manager       │
│ (PRD)  │    │         │    │ (structure)│    │ (create)      │
└────────┘    └─────────┘    └────────────┘    └───────────────┘
                                                       │
                                                       ▼
                                               ┌───────────────┐
                                               │ Asana Project │
                                               │ + Tasks       │
                                               │ + Milestones  │
                                               └───────────────┘
```

---

## 6. Integration Patterns

### 6.1 Connector Interface

All connectors implement:

```js
module.exports = {
  id: 'connector-id',
  type: 'real' | 'mock',
  status: 'connected' | 'disconnected' | 'error',

  // Auth
  async connect(config) {},
  async disconnect() {},
  isConnected() {},

  // Standard interface
  getTools() {},          // returns tool definitions
  async executeTool(toolName, params) {},

  // Health
  async healthCheck() {}
};
```

### 6.2 Adding a New Connector

1. Create `connectors/new-platform.js` implementing the interface above
2. Register in `connectors/index.js`
3. Any workflow referencing it in `requiredConnectors` will automatically validate availability

### 6.3 Adding a New Workflow

1. Create `workflows/<category>/workflow-name.js` with `meta` and `run()`
2. Register in `workflows/registry.js` under the appropriate category
3. UI auto-discovers from registry — no UI changes needed

### 6.4 Adding a New Agent

1. Create `agents/agent-name.js` with `getInfo()` and capability functions
2. Register in `agents/index.js`
3. Reference in workflow stage definitions

---

## 7. Proposed File Structure

```
ad-ops-command/
├── agents/
│   ├── index.js                    # agent registry
│   ├── asana-project-manager.js    # NEW
│   ├── media-planner.js
│   ├── trader.js
│   ├── analyst.js
│   ├── creative-ops.js
│   ├── compliance.js
│   ├── project-manager.js
│   ├── creative-coordinator.js
│   ├── search-marketer.js
│   └── social-media-buyer.js
│
├── connectors/
│   ├── index.js                    # connector registry
│   ├── google-ads.js
│   ├── meta-ads.js
│   ├── asana.js
│   ├── google-docs.js              # rename from generic
│   ├── microsoft-ads.js            # NEW (Phase 2)
│   ├── linkedin-ads.js             # NEW (Phase 3)
│   ├── pinterest-ads.js            # NEW (Phase 3)
│   ├── tiktok-ads.js               # NEW (Phase 3)
│   ├── ttd.js                      # mock
│   ├── dv360.js                    # mock
│   └── amazon-dsp.js               # mock
│
├── workflows/
│   ├── registry.js                 # NEW — categorized registry
│   ├── index.js                    # backward-compat wrapper
│   ├── campaign-ops/
│   │   ├── campaign-launch.js      # moved from root
│   │   ├── pacing-check.js
│   │   ├── optimization.js
│   │   ├── anomaly-detection.js
│   │   ├── creative-test.js        # NEW
│   │   └── search-campaign.js      # moved, registered
│   ├── projects/
│   │   ├── prd-to-asana.js         # NEW
│   │   ├── project-status.js       # NEW
│   │   ├── dsp-onboarding.js       # NEW
│   │   ├── jbp-workflow.js         # NEW
│   │   └── rfp-response.js         # NEW
│   ├── reporting/
│   │   ├── wow-report.js           # moved
│   │   ├── monthly-report.js       # NEW
│   │   ├── cross-channel-report.js # NEW
│   │   └── attribution-report.js   # NEW
│   └── orchestration/
│       ├── media-plan-execute.js   # NEW
│       ├── cross-channel-launch.js # NEW
│       └── budget-reallocation.js  # NEW
│
├── events/
│   ├── bus.js                      # NEW — event emitter + persistence
│   ├── types.js                    # NEW — event type constants
│   └── handlers.js                 # NEW — built-in event handlers
│
├── database/
│   ├── data/
│   │   ├── projects.json           # NEW — unified project store
│   │   ├── executions.json         # NEW — workflow execution history
│   │   ├── events.json             # NEW — event log
│   │   ├── campaigns.json
│   │   ├── workflows.json
│   │   ├── agents.json
│   │   ├── activity.json
│   │   ├── creatives.json
│   │   └── flights.json
│   ├── projects.js                 # NEW — project CRUD
│   ├── executions.js               # NEW — execution CRUD
│   ├── campaigns.js
│   ├── init.js
│   └── schema.sql
│
├── ui/
│   ├── assets/
│   │   ├── app.js                  # enhanced with SPA routing
│   │   └── styles.css              # redesigned with sidebar nav
│   ├── dashboard.html              # redesigned
│   ├── projects.html               # NEW
│   ├── workflows.html              # NEW
│   ├── workflow-detail.html        # NEW
│   ├── campaigns.html              # simplified
│   ├── agents.html
│   ├── connectors.html
│   ├── reports.html                # renamed from insights.html
│   ├── query.html                  # enhanced
│   └── architecture.html
│
├── docs/
│   ├── ARCHITECTURE-V2.md          # this file
│   └── IMPLEMENTATION-ROADMAP.md
│
├── server.js                       # add project + execution + event APIs
├── executor.js                     # enhance with orchestrator support
├── router.js                       # enhance with workflow routing
└── package.json
```

---

## 8. API Additions

### New REST Endpoints

```
# Projects
GET    /api/projects                 — list all projects (filter by type, status)
POST   /api/projects                 — create project
GET    /api/projects/:id             — get project detail
PATCH  /api/projects/:id             — update project
GET    /api/projects/:id/executions  — workflow executions for project

# Workflows
GET    /api/workflows                — list all (grouped by category)
GET    /api/workflows/:id            — workflow metadata
POST   /api/workflows/:id/run        — trigger workflow execution
GET    /api/workflows/:id/history    — past executions

# Executions
GET    /api/executions               — list recent executions
GET    /api/executions/:id           — execution detail with stage status
POST   /api/executions/:id/cancel    — cancel running execution

# Events
GET    /api/events                   — event log (filterable)
POST   /api/events                   — emit custom event
```

---

## 9. Extensibility Summary

| Add a... | Steps |
|----------|-------|
| **Connector** | 1. Create file implementing connector interface → 2. Register in `connectors/index.js` |
| **Agent** | 1. Create file with `getInfo()` + capabilities → 2. Register in `agents/index.js` |
| **Workflow** | 1. Create file with `meta` + `run()` → 2. Register in `workflows/registry.js` under category |
| **Event trigger** | 1. Add event type to `events/types.js` → 2. Add `triggers.events` to target workflow meta |
| **UI page** | 1. Create HTML file → 2. Add to sidebar nav in `styles.css` / `app.js` |

Everything is discoverable from the registry. The UI reads from APIs that read from registries. No hardcoded lists in the frontend.
