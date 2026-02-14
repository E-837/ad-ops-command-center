# Campaign Lifecycle Async Architecture Design

## Problem Summary

`campaign-lifecycle-demo.js` runs 8 stages sequentially using `spawnSync`-based `callTool()`. Two bottlenecks dominate:
- **Asana**: 13 sequential task creations (4-5 min)
- **Creatives**: 4 sequential image gen + Canva uploads (8-12 min)
- **Total**: 15-30 min → exceeds HTTP timeouts, crashes server

**Target**: 5-8 minutes total runtime.

---

## 1. Async `callToolAsync()` — Replace spawnSync

### New Function Signature

```js
// scripts/mcp-helper.js
const { spawn } = require('child_process');

function callToolAsync(server, tool, args, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const argsJson = JSON.stringify(args);
    const child = spawn(process.execPath, [
      MCPORTER_CLI, 'call', `${server}.${tool}`, '--args', argsJson
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: 'Timeout', output: stdout });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({ success: false, error: stderr || stdout || 'Command failed', output: stdout });
      } else {
        resolve({ success: true, output: stdout });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, error: err.message, output: '' });
    });
  });
}

module.exports = { callTool, callToolAsync };
```

**Backward compatible** — existing `callTool()` stays for any sync callers.

---

## 2. Parallelization Strategy

### Stage Dependency Graph

```
Stage 1: Brief (Google Docs)          ─┐
Stage 2: Media Plan (Google Sheets)    ─┤── Can run in PARALLEL (no dependencies)
Stage 3: Asana Project + Tasks         ─┘
Stage 4: Landing Page (local file)     ── Independent, can parallel with above
Stage 5: Creatives (image gen + Canva) ── Independent, can parallel with above
Stage 6: DSP Activation                ── Needs media plan data (from Stage 2 or CAMPAIGN_DATA — actually uses CAMPAIGN_DATA directly, so independent)
Stage 7: Search Campaign (optional)    ── Independent
Stage 8: Summary Report               ── MUST wait for all above (uses artifacts)
```

### Revised Execution Plan

```
Phase A (parallel):
  ├── Stage 1: Brief           (~30s — 1 MCP call)
  ├── Stage 2: Media Plan      (~30s — 2 MCP calls)
  ├── Stage 3: Asana           (~45s — 1 project + 13 tasks @ concurrency 5)
  ├── Stage 4: Landing Page    (~1s  — local file write)
  ├── Stage 5: Creatives       (~3-4 min — 4 parallel image gen + upload)
  └── Stage 6: DSP Activation  (~1s  — in-memory mocks)

Phase B (after Phase A):
  └── Stage 8: Summary Report  (~30s — 1 MCP call, needs all artifacts)

Optional (parallel with Phase A):
  └── Stage 7: Search Campaign
```

### Concurrency Limits

| MCP Server | Max Concurrent | Rationale |
|------------|---------------|-----------|
| `google-docs` | 3 | Google API rate limits (~60 req/min) |
| `asana-v2` | 5 | Asana API allows 150 req/min, 5 is conservative |
| Image gen (OpenRouter) | 2 | GPU-bound, avoid queueing/throttling |
| Canva | 2 | API rate limits unknown, be safe |

### Asana Task Parallelization

```js
// Create project first (must be sequential)
const projectId = await createAsanaProject(...);

// Then create all 13 tasks with concurrency limit of 5
const results = await pMap(tasks, async (task) => {
  return callToolAsync('asana-v2', 'asana_create_task', {
    project_id: projectId,
    name: task.name,
    notes: task.notes,
    due_on: task.due_on
  });
}, { concurrency: 5 });
```

Use [`p-map`](https://www.npmjs.com/package/p-map) or a simple semaphore for concurrency control.

### Creative Parallelization

```js
// All 4 creatives in parallel (2 concurrent)
const designs = await pMap(CAMPAIGN_DATA.creativeSizes, async (size) => {
  const genResult = await imageGen.generateImageAsync(...);
  if (genResult.success) {
    const uploadResult = await canva.uploadAssetFromFile(...);
    // ...
  }
  const design = await canva.createDesign(...);
  return { ...entry };
}, { concurrency: 2 });
```

---

## 3. Background Job Architecture

The workflow should **not** run inside an HTTP request handler. Instead:

```
POST /api/workflows/campaign-lifecycle-demo
  → Validates input
  → Creates job record (in-memory or SQLite)
  → Returns { jobId, statusUrl: "/api/jobs/{jobId}/events" }
  → Spawns run() in background (not awaited)

GET /api/jobs/{jobId}/events
  → SSE stream (text/event-stream)
  → Client receives real-time progress
```

---

## 4. SSE Event Schema

```typescript
interface WorkflowEvent {
  type: 'stage:start' | 'stage:progress' | 'stage:complete' | 'stage:error' | 'workflow:complete';
  jobId: string;
  timestamp: string;
  stage?: string;        // e.g. "project"
  stageName?: string;    // e.g. "Setup Project Management"
  stageIndex?: number;   // 0-based
  totalStages?: number;
  // For progress events:
  current?: number;      // e.g. 7
  total?: number;        // e.g. 13
  detail?: string;       // e.g. "Created: Creative Production — Display + Video + Audio"
  // For complete events:
  status?: 'completed' | 'failed' | 'partial';
  artifacts?: object;
  error?: string;
}
```

### Example SSE Stream

```
data: {"type":"stage:start","stage":"project","stageName":"Setup Project Management","stageIndex":2,"totalStages":8}

data: {"type":"stage:progress","stage":"project","current":3,"total":13,"detail":"Created: Creative Production — Display + Video + Audio"}

data: {"type":"stage:progress","stage":"project","current":8,"total":13,"detail":"Created: Campaign Setup — Amazon DSP"}

data: {"type":"stage:complete","stage":"project","status":"completed","artifacts":{"asanaProjectId":"123","tasksCreated":13}}

data: {"type":"workflow:complete","status":"completed","artifacts":{...}}
```

### Emitter Integration

```js
async function run(opts = {}) {
  const emit = opts.emit || (() => {}); // SSE emitter function

  // Phase A - parallel
  const phaseA = await Promise.allSettled([
    runStage('brief', generateCampaignBrief, results, emit, CAMPAIGN_DATA),
    runStage('plan', createMediaPlan, results, emit, CAMPAIGN_DATA),
    runStage('project', setupProjectManagement, results, emit, CAMPAIGN_DATA),
    runStage('landing', generateLandingPage, results, emit, CAMPAIGN_DATA),
    runStage('creative', generateCreatives, results, emit, CAMPAIGN_DATA),
    runStage('activate', activateOnDSPs, results, emit, CAMPAIGN_DATA),
  ]);

  // Phase B - needs artifacts
  await runStage('report', generateSummaryReport, results, emit, CAMPAIGN_DATA);

  emit({ type: 'workflow:complete', status: results.status, artifacts: results.artifacts });
}

async function runStage(id, fn, results, emit, data) {
  emit({ type: 'stage:start', stage: id });
  const stage = await fn(results, emit, data);
  emit({ type: 'stage:complete', stage: id, status: stage.status });
  results.stages.push(stage);
  return stage;
}
```

---

## 5. Error Handling Strategy

### Retry Logic

```js
async function callToolWithRetry(server, tool, args, { maxRetries = 2, timeoutMs = 30000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await callToolAsync(server, tool, args, timeoutMs);
    if (result.success) return result;
    if (attempt < maxRetries) {
      await sleep(1000 * (attempt + 1)); // linear backoff: 1s, 2s
    }
  }
  return { success: false, error: `Failed after ${maxRetries + 1} attempts` };
}
```

### Partial Success

- **Asana**: If 11/13 tasks created → stage status = `'completed'` (not `'failed'`). Track `tasksCreated: 11, tasksFailed: 2`.
- **Creatives**: If 3/4 designs created → `'completed'`. Missing creatives noted in report.
- **Brief/Report**: If Google Docs fails → `'failed'` but workflow continues. Generate local markdown fallback.
- **Overall workflow**: Status = `'completed'` if critical stages pass, `'partial'` if non-critical stages fail.

### Critical vs Non-Critical

| Stage | Critical? | Fallback |
|-------|-----------|----------|
| Brief | No | Local markdown file |
| Media Plan | No | Local CSV |
| Asana | No | Log tasks, skip |
| Landing Page | No | Already local |
| Creatives | No | Canva designs without AI images |
| DSP Activation | No | Mock/in-memory |
| Search | No | Skip entirely |
| Report | No | Local markdown |

**No stage is hard-blocking.** Workflow always completes with whatever succeeded.

---

## 6. Estimated Time Improvements

| Stage | Before (Sequential) | After (Parallel) | Notes |
|-------|-------------------|-----------------|-------|
| Brief | 30s | 30s | |
| Media Plan | 30s | 30s | |
| Asana (13 tasks) | 4-5 min | 45-60s | 5 concurrent |
| Landing Page | 1s | 1s | |
| Creatives (4) | 8-12 min | 3-4 min | 2 concurrent |
| DSP Activation | 1s | 1s | |
| Search (optional) | 2-3 min | 2-3 min | |
| Report | 30s | 30s | |
| **TOTAL** | **15-30 min** | **4-5 min** | Stages 1-6 parallel |

**Target met**: 4-5 minutes (down from 15-30).

---

## 7. Implementation Checklist

### Phase 1: Core Async (Est: 2-3 hours)
- [ ] Add `callToolAsync()` to `scripts/mcp-helper.js`
- [ ] Add `callToolWithRetry()` wrapper
- [ ] Install `p-map` (or implement simple semaphore)
- [ ] Unit test `callToolAsync` with mock MCP

### Phase 2: Parallelize Workflow (Est: 3-4 hours)
- [ ] Convert `setupProjectManagement` — parallel task creation with `pMap(tasks, ..., { concurrency: 5 })`
- [ ] Convert `generateCreatives` — parallel image gen + upload with `pMap(sizes, ..., { concurrency: 2 })`
- [ ] Add `emit` parameter to `run()` and all stage functions
- [ ] Replace `log()` calls with `emit()` events + keep log as secondary
- [ ] Restructure `run()` into Phase A (parallel) + Phase B (report)
- [ ] Update `results.artifacts` to be thread-safe (stages write to separate keys, no conflicts)

### Phase 3: Background Job + SSE (Est: 2-3 hours)
- [ ] Create `POST /api/workflows/:id/start` endpoint → returns `{ jobId }`
- [ ] Create `GET /api/jobs/:jobId/events` SSE endpoint
- [ ] In-memory job store: `{ jobId, status, events[], results }`
- [ ] Wire `emit()` to push to SSE clients
- [ ] Add `GET /api/jobs/:jobId` for polling fallback

### Phase 4: Error Handling (Est: 1-2 hours)
- [ ] Add retry logic to all MCP calls (max 2 retries, linear backoff)
- [ ] Add local fallbacks for Google Docs/Sheets failures (write markdown/CSV)
- [ ] Implement partial success logic per stage
- [ ] Add `stage:error` events with meaningful messages

### Phase 5: UI Integration (Est: 2 hours)
- [ ] Frontend SSE listener with reconnect
- [ ] Progress bar per stage
- [ ] Sub-progress for Asana tasks and Creatives (3/13, 2/4)
- [ ] Final summary view with artifact links

---

## 8. Minimal Concurrency Helper (No Dependencies)

If `p-map` is undesirable, use this:

```js
async function pMapSimple(items, fn, { concurrency = 3 } = {}) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
```

---

## Summary

The key insight is that **all 6 production stages are independent** — they all read from `CAMPAIGN_DATA` and write to separate artifact keys. Only the Summary Report needs to wait. Converting to parallel execution with async MCP calls brings runtime from 15-30 min down to ~4-5 min, well within HTTP timeout limits and the 5-8 min target.
