# Phase 3+ Implementation Roadmap

## Timeline Overview (10 weeks)

```
Week  1-2  │ Phase 3A: Database + Real-Time UI ████████████████
Week  3-4  │ Phase 3B: Analytics + Integration  ████████████████
Week  5-6  │ Phase 3C: Pinterest Connector       ████████████████
Week  7-9  │ Phase 3D: Agent Intelligence         ████████████████████████
Week  10   │ Phase 3E: Polish + Documentation      ████████
```

---

## Phase 3A: Foundation Layer (Weeks 1-2)

**Features:** Real Database + Real-Time UI (SSE + Charts)

These are foundational — everything else depends on them.

### Week 1: SQLite Migration

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Install `better-sqlite3` + `knex`, configure connection | `database/knex.js` |
| 2 | Write all migration files (8 tables) | `database/migrations/001-008` |
| 3 | Build repository layer (projects, executions, events) | `database/repos/*.js` |
| 4 | Build remaining repos (campaigns, activity, workflows) | Complete repo layer |
| 5 | JSON→SQLite migration script, run migration, update routes | `scripts/migrate-json-to-sqlite.js` |

### Week 2: Real-Time UI

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | SSE server endpoint + client library | `routes/sse.js`, `ui/components/sse-client.js` |
| 2 | Wire executor → event bus → SSE broadcast | Live workflow progress |
| 3 | Workflow stage progress component | `ui/components/workflow-progress.js` |
| 4 | Add Chart.js, build dashboard charts (spend trend, platform comparison) | Chart-enabled dashboard |
| 5 | Workflow templates system + template picker UI | `workflows/templates.js` |

### Success Criteria
- [ ] All existing JSON data migrated to SQLite
- [ ] All API routes use SQLite repos (JSON files no longer read)
- [ ] Opening workflow detail page shows live stage progress via SSE
- [ ] Dashboard has at least 2 Chart.js visualizations
- [ ] 3+ workflow templates available in UI

### Testing
- Run all existing API calls, verify identical responses
- Start a workflow, confirm SSE events arrive in browser console
- Kill server mid-workflow, restart — confirm execution state persisted in DB

---

## Phase 3B: Analytics + Integration Hub (Weeks 3-4)

**Features:** Analytics Layer + Integration Hub

Can be partially parallelized — analytics is data-focused, integration is event-focused.

### Week 3: Analytics Layer

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Analytics DB tables + aggregator with platform normalizers | `analytics/aggregator.js` |
| 2 | Budget pacer + benchmark calculator | `analytics/budget-pacer.js` |
| 3 | Analytics REST API (6 endpoints) | `/api/analytics/*` |
| 4 | Analytics dashboard page (Chart.js: spend trend, platform bars, pacing gauge) | `ui/analytics.html` |
| 5 | Export functionality (CSV, JSON, Power BI format) + cron sync | `analytics/exporter.js` |

### Week 4: Integration Hub

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Webhook DB table + registration endpoint | `routes/webhooks.js` |
| 2 | Inbound webhook receiver → workflow trigger | Webhook → workflow pipeline |
| 3 | Discord + Slack outbound notifiers | `notifications/discord.js`, `notifications/slack.js` |
| 4 | Notification config UI + event routing | Settings page for notifications |
| 5 | OpenAPI spec + swagger-ui-express | `/api/docs` live documentation |

### Success Criteria
- [ ] Analytics dashboard shows cross-platform metrics with charts
- [ ] Budget pacing shows on-track/over/under for each campaign
- [ ] CSV export downloads correctly formatted file
- [ ] External POST to webhook URL triggers a workflow execution
- [ ] Workflow completion sends Discord/Slack notification
- [ ] `/api/docs` serves interactive API documentation

### Testing
- Verify analytics aggregator normalizes Google/Meta data identically
- POST to webhook with and without valid API key — verify auth works
- Test notification delivery to actual Discord webhook URL
- Export to CSV, open in Excel/Power BI — verify format

---

## Phase 3C: Pinterest Connector (Weeks 5-6)

**Features:** Full Pinterest Ads connector + SocialMediaBuyer integration

### Week 5: Connector Core

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Pinterest connector skeleton + OAuth2 flow + test mode | `connectors/pinterest-ads.js` |
| 2 | Campaign + ad group tools (list, create, update) — 6 tools | Campaign management |
| 3 | Ad + Pin tools (list, create, promote) — 5 tools | Creative management |
| 4 | Audience + targeting tools — 3 tools | Audience management |
| 5 | Analytics + reporting tools — 4 tools | Pinterest reporting |

### Week 6: Integration

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Test data generator (realistic Pinterest campaigns/metrics) | `connectors/test-data/pinterest.js` |
| 2 | Update SocialMediaBuyer agent for Pinterest | Agent routing |
| 3 | Add Pinterest to analytics aggregator + normalizer | Cross-platform analytics |
| 4 | Update cross-channel workflows for 3-platform support | Workflow updates |
| 5 | Pinterest-specific workflows (pin promotion, shopping catalog) | 2 new workflows |

### Success Criteria
- [ ] All 18 Pinterest tools functional in test mode
- [ ] SocialMediaBuyer can create campaigns on Pinterest (test mode)
- [ ] Analytics dashboard shows Pinterest alongside Google/Meta
- [ ] Cross-channel report includes Pinterest data
- [ ] Test data is realistic (proper metric names, ranges)

### Testing
- Run each Pinterest tool in test mode, verify response format
- Execute cross-channel workflow with all 3 platforms
- Verify Pinterest metrics normalize correctly in analytics

---

## Phase 3D: Agent Intelligence (Weeks 7-9)

**Features:** Memory, recommendations, A/B testing, predictive budgets

This is the most complex feature. 3 weeks allows room for iteration.

### Week 7: Memory + Recall

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Agent memory DB tables + service | `agents/memory-service.js` |
| 2 | Memory storage hooks in executor (auto-remember outcomes) | Automatic memory capture |
| 3 | Recall + recommendation engine (query by context/tags) | Recommendation retrieval |
| 4 | Update Trader + Analyst agents to use memory | Agent integration |
| 5 | Memory browser UI (view what agents have learned) | Memory inspection page |

### Week 8: A/B Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | A/B test data model + manager | `agents/ab-test-manager.js` |
| 2 | Statistical testing (z-test, confidence intervals) | Winner detection |
| 3 | Auto-apply winners + create learning from results | Closed-loop testing |
| 4 | A/B test UI (create test, view results, significance) | Test management page |
| 5 | A/B test → notification pipeline (alert on winner found) | Automated alerts |

### Week 9: Predictive + Polish

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Budget predictor (ROAS-weighted allocation) | `agents/budget-predictor.js` |
| 2 | Trend analysis + linear regression for forecasting | Spend/performance forecasts |
| 3 | Budget suggestion UI (visualize current vs recommended allocation) | Budget optimization page |
| 4 | Seed memory with synthetic historical data for demos | Demo data |
| 5 | End-to-end: workflow runs → memory stored → next run uses recommendation | Full loop test |

### Success Criteria
- [ ] Agents store memories after each workflow execution
- [ ] Recommendation engine returns relevant past outcomes for new campaigns
- [ ] A/B test correctly identifies statistical winner at 95% confidence
- [ ] Budget predictor suggests allocations weighted by ROAS performance
- [ ] Memory UI shows agent learnings in readable format

### Testing
- Create 50+ synthetic memories, verify recall relevance
- Run A/B test with known data (variant B 20% better) — confirm correct winner
- Verify budget predictor allocates more to high-ROAS campaigns
- Test with empty memory — graceful degradation (no errors)

---

## Phase 3E: Polish + Documentation (Week 10)

**Features:** Integration testing, UI polish, docs, demo prep

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | End-to-end integration testing (all features together) | Test suite |
| 2 | UI consistency pass (all new pages match glass-morphism theme) | Visual polish |
| 3 | Error handling audit + edge cases | Robustness |
| 4 | Update ARCHITECTURE-V3.md + README | Documentation |
| 5 | Build demo script (walkthrough of all new features) | Demo-ready platform |

### Success Criteria
- [ ] Full workflow: webhook triggers workflow → SSE shows progress → analytics update → notification sent → memory stored
- [ ] All pages visually consistent
- [ ] No unhandled errors in common paths
- [ ] Documentation complete and accurate

---

## Parallel Work Opportunities

```
Week 1-2:  Database ──────────────────▶ (sequential, foundation)
           SSE + Charts ──────────────▶

Week 3-4:  Analytics ─────────────────▶ (parallel: different modules)
           Integration Hub ───────────▶

Week 5-6:  Pinterest (can start Week 4 if analytics finishes early)

Week 7-9:  Memory ────▶ A/B Testing ──▶ Predictions (sequential within)
           But UI work can parallel with backend
```

---

## Milestones

| Milestone | Week | Checkpoint |
|-----------|------|------------|
| 🗄️ Database Live | 1 | SQLite serving all data, JSON files retired |
| 📡 Real-Time Working | 2 | SSE streaming workflow progress to browser |
| 📊 Analytics Dashboard | 3 | Cross-platform charts rendering |
| 🔗 Webhooks Active | 4 | External system can trigger workflow |
| 📌 Pinterest Complete | 6 | 18 tools, test mode, in analytics |
| 🧠 Agents Remember | 7 | Memory service storing + recalling |
| 🧪 A/B Testing Live | 8 | Statistical winner detection working |
| 🎯 Budget Predictions | 9 | ROAS-based allocation suggestions |
| 🚀 Phase 3 Complete | 10 | All features integrated + documented |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| `better-sqlite3` compilation fails on Windows | Blocks Week 1 | Fallback: `sql.js` (WASM-based, no native deps) |
| Pinterest sandbox access delayed | Blocks Week 5 | Build connector with test-mode-only first, add live mode later |
| A/B test stats produce false positives | Misleading results | Conservative confidence threshold (95%), minimum sample sizes |
| Feature creep in Agent Intelligence | Timeline slip | Strict scope — memory + recall + basic recommendations first, ML later |
| Chart.js performance with large datasets | Slow UI | Aggregate server-side, paginate, limit to 90-day windows |

---

## Dependencies (npm additions)

```json
{
  "better-sqlite3": "^11.0.0",
  "knex": "^3.1.0",
  "chart.js": "CDN (no npm)",
  "swagger-ui-express": "^5.0.0",
  "yamljs": "^0.3.0",
  "nodemailer": "^6.9.0"
}
```

Total new dependencies: 4 npm packages + 1 CDN. Minimal footprint.
