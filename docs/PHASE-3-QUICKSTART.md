# Phase 3 Quick Start Guide

## TL;DR: Build Order

```
1. SQLite Database     (Week 1)    ← START HERE. Everything depends on this.
2. SSE + Charts        (Week 2)    ← Immediate visual payoff
3. Analytics Layer     (Week 3)    ← Your Power BI skills shine here
4. Integration Hub     (Week 4)    ← Webhooks + notifications
5. Pinterest Connector (Week 5-6)  ← Third platform = cross-channel story
6. Agent Intelligence  (Week 7-9)  ← The "AI" showcase
7. Polish + Docs       (Week 10)   ← Ship it
```

---

## Why This Order?

### Start with Database (not the sexy choice, but the right one)

Every other feature needs proper storage:
- Analytics needs indexed queries across thousands of metric rows
- Agent memory needs structured storage with search
- Webhooks need persistent config
- A/B tests need reliable state tracking

JSON files can't do concurrent reads/writes safely, can't index, can't JOIN. Kill this debt first — it's 5 days of work that unblocks 8 weeks of features.

**Bonus:** You already know SQL. Knex query builder will feel natural coming from Power BI/SQL background.

### Then SSE + Charts (the "wow" moment)

After database migration (invisible backend work), you need something visual. SSE gives you real-time workflow progress — dramatic improvement over polling. Chart.js gives you instant dashboards. This is the "Phase 3 is real" proof point.

### Analytics before Pinterest (data > connectors)

You have Google Ads + Meta Ads data already. Build the cross-platform analytics layer with what you have. When Pinterest arrives in Week 5, it slots right into an existing analytics framework instead of being bolted on.

### Agent Intelligence last (most complex, most impressive)

This is the crown jewel — AI agents that learn and recommend. But it needs:
- Database (for memory storage) ✅ Week 1
- Analytics (for metrics to learn from) ✅ Week 3
- Pinterest (richer cross-platform data) ✅ Week 6

Building it last means all the data infrastructure is ready.

---

## Day 1: Literally What to Do

### 1. Install dependencies
```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
npm install better-sqlite3 knex
```

### 2. Create Knex config
```js
// knexfile.js (project root)
module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: './database/ad-ops.db' },
    useNullAsDefault: true,
    migrations: { directory: './database/migrations' }
  }
};
```

### 3. Create first migration
```bash
npx knex migrate:make create_projects
```

### 4. Write the schema (see PHASE-3-ARCHITECTURE.md for full SQL)

### 5. Run it
```bash
npx knex migrate:latest
```

You now have a SQLite database. The rest follows.

---

## Quick Wins (things that feel great fast)

| Win | Effort | Impact |
|-----|--------|--------|
| SSE workflow progress | 1 day | "It's alive!" feeling in the UI |
| Chart.js spend trend | 2 hours | Dashboard goes from text to visual |
| Discord webhook notification | 2 hours | Workflow finishes → Discord ping |
| Workflow templates | 3 hours | One-click workflow execution |
| Budget pacing gauge | 4 hours | Visual over/under pacing indicator |

---

## Foundation vs Feature Work

```
FOUNDATION (boring but critical)     FEATURES (fun and visible)
─────────────────────────────────    ──────────────────────────────
SQLite migration                     Chart.js dashboards
Repository pattern                   SSE live updates
Analytics aggregator                 Pinterest connector
Webhook infrastructure               A/B test UI
Agent memory service                 Budget prediction viz
OpenAPI spec                         Notification alerts
```

**Rule of thumb:** Spend mornings on foundation, afternoons on features. You get the dopamine hit of visible progress daily while building solid infrastructure underneath.

---

## Design Decisions (Recommendations)

| Decision | Recommendation | Why |
|----------|---------------|-----|
| Database | **SQLite** via better-sqlite3 | No server needed, file-based like current JSON, fast, your data fits easily. Move to Postgres later only if you need multi-user/networked access. |
| ORM | **Knex.js** (query builder) | Not a full ORM — you write SQL-like queries, not class hierarchies. Perfect for someone who knows SQL. |
| Real-time | **SSE** (not WebSocket) | One-way server→client is all you need. Zero extra dependencies. WebSocket is overkill. |
| Charts | **Chart.js** (CDN) | No build step, good docs, covers all chart types you need. D3 is too low-level, Recharts needs React. |
| Agent memory | **SQLite tables** (not vector DB) | Tag-based search + SQL queries are sufficient. Vector DB (Pinecone, etc.) is overkill until you have 100K+ memories. |
| Notifications | **Webhook-based** (Discord/Slack) | Free, no API keys needed, works in 10 lines of code. Email via nodemailer as optional add-on. |
| API docs | **swagger-ui-express** | Industry standard, interactive, auto-generates from spec. |
| Pinterest pattern | **Exact clone** of Meta Ads connector | Same dual-mode (test/live), same auth pattern, same tool structure. Consistency > cleverness. |

---

## What NOT to Build (Yet)

- ❌ Full ML pipeline (simple regression > TensorFlow for now)
- ❌ Vector database for agent memory (SQL tags are fine at this scale)
- ❌ React/Vue migration (vanilla JS works, don't rewrite the frontend)
- ❌ Postgres (SQLite handles this workload easily)
- ❌ Custom charting library (Chart.js covers 95% of needs)
- ❌ Email notifications (Discord/Slack webhooks are free and instant)
- ❌ Notion/Jira connectors (focus on ad platforms, not project tools)

These are all valid Phase 4+ items once the core is solid.

---

## Success Metrics (How to Know Phase 3 Worked)

1. **Database:** Zero JSON files in the read path. All data in SQLite.
2. **Real-time:** Watch a workflow execute live in the browser. No refresh needed.
3. **Analytics:** One dashboard showing Google + Meta + Pinterest side-by-side with actual charts.
4. **Integration:** Trigger a workflow from Postman via webhook. Get a Slack/Discord ping when it finishes.
5. **Pinterest:** Run `cross-channel-report` with 3 platforms. All metrics normalize correctly.
6. **Intelligence:** Run the same workflow twice. Second time, agent references what it learned from the first.
7. **End-to-end:** External webhook → workflow executes → live progress in UI → analytics update → notification sent → agent memory stored. One continuous pipeline.
