# Implementation Roadmap

## Phase 1: Foundation (Weeks 1-3)
**Goal:** New workflow system + project model without breaking existing functionality.

### Week 1: Workflow Registry & Event System
- [ ] Create `workflows/registry.js` with categorized structure
- [ ] Define workflow metadata schema (meta object standard)
- [ ] Migrate existing 5 workflows to new meta format (keep backward compat via `index.js` wrapper)
- [ ] Register `search-campaign-workflow.js` properly
- [ ] Create `events/bus.js` — EventEmitter + JSON persistence
- [ ] Create `events/types.js` — event type constants
- [ ] Add event emission to executor.js (workflow.completed, workflow.failed, etc.)

### Week 2: Project Model & Data Layer
- [ ] Create `database/data/projects.json` + `database/projects.js` (CRUD)
- [ ] Create `database/data/executions.json` + `database/executions.js`
- [ ] Create `database/data/events.json`
- [ ] Link workflow executions to projects
- [ ] Add REST APIs: `/api/projects`, `/api/workflows` (new), `/api/executions`, `/api/events`
- [ ] Enhance executor.js with orchestrator pattern (parallel fan-out)

### Week 3: AsanaProjectManager Agent + PRD-to-Asana Workflow
- [ ] Create `agents/asana-project-manager.js`
- [ ] Create `workflows/projects/prd-to-asana.js`
- [ ] Create `workflows/projects/project-status.js`
- [ ] Move existing workflows into subdirectories (`campaign-ops/`, `reporting/`)
- [ ] Test end-to-end: doc → parse → Asana project

**Deliverable:** Working categorized workflow system, project tracking, first non-campaign workflow.

---

## Phase 2: UI Redesign + New Workflows (Weeks 4-6)
**Goal:** New UI with workflow library, project dashboard, and additional workflows.

### Week 4: UI — Sidebar Nav, Projects, Workflow Library
- [ ] Redesign navigation → sidebar layout
- [ ] Build `projects.html` — project list with filters, status badges
- [ ] Build `workflows.html` — categorized workflow library with run buttons
- [ ] Build `workflow-detail.html` — execution progress with stage visualization
- [ ] Rename `insights.html` → `reports.html`
- [ ] Redesign `dashboard.html` — unified view (projects + executions + alerts)

### Week 5: New Campaign Ops Workflows
- [ ] `workflows/campaign-ops/creative-test.js` — A/B creative testing
- [ ] `workflows/reporting/monthly-report.js` — monthly rollup
- [ ] `workflows/reporting/cross-channel-report.js`
- [ ] Enhance query.html — conversational workflow triggers (detect intent → show workflow + pre-filled params → confirm → execute)

### Week 6: Orchestration Workflows
- [ ] `workflows/orchestration/media-plan-execute.js` — media plan → parallel channel launches
- [ ] `workflows/orchestration/cross-channel-launch.js`
- [ ] Event-driven triggers: wire up `metric.threshold` → `anomaly-detection`
- [ ] Scheduled triggers: pacing-check on cron

**Deliverable:** Full UI redesign, 5+ new workflows, orchestration working.

---

## Phase 3: Connector Expansion + Advanced Projects (Weeks 7-10)
**Goal:** More platforms, more project types, intelligence features.

### Week 7-8: Microsoft Ads Connector
- [ ] `connectors/microsoft-ads.js` — real connector (they have sandbox access)
- [ ] Extend SearchMarketer agent for Microsoft Ads
- [ ] Cross-channel search workflow (Google + Microsoft in parallel)

### Week 9: Ad Ops Project Workflows
- [ ] `workflows/projects/dsp-onboarding.js`
- [ ] `workflows/projects/jbp-workflow.js`
- [ ] `workflows/projects/rfp-response.js`
- [ ] `workflows/orchestration/budget-reallocation.js`

### Week 10: Project Intelligence
- [ ] Risk detection in AsanaProjectManager (overdue tasks, dependency chains)
- [ ] Timeline health scoring
- [ ] Auto-generated standups and weekly summaries
- [ ] Blocker detection and escalation events

**Deliverable:** 3rd real ad platform, full project management suite, intelligence features.

---

## Phase 4: Polish & Scale (Weeks 11-14)
**Goal:** Additional connectors, templates, and production hardening.

- [ ] LinkedIn Ads connector (has Marketing API sandbox)
- [ ] Pinterest Ads connector
- [ ] TikTok Ads connector
- [ ] Workflow templates system (preset configs for common scenarios)
- [ ] Attribution report workflow
- [ ] Error handling, retry logic, execution timeouts
- [ ] Performance: pagination for large project/execution lists
- [ ] Documentation and onboarding guide

---

## Dependencies

```
Phase 1 ──────────────▸ Phase 2 ──────────────▸ Phase 3
  registry + events        UI + new workflows      connectors + intelligence
  project model            orchestration           advanced projects
  asana agent              query enhancement
                                                 Phase 4
                                                   polish + more connectors
```

## Risk Mitigation
- **Backward compatibility:** `workflows/index.js` wraps new registry, existing API unchanged
- **Incremental UI:** New pages added alongside old ones; switch navigation last
- **Mock-first:** New workflows work with mocks before real connectors
- **Feature flags:** Event triggers can be disabled per-workflow via `triggers.events: []`
