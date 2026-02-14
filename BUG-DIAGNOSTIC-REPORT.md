# Bug Diagnostic Report — Ad Ops Command Center
**Date:** 2026-02-13  
**Severity:** Critical (3 blocking issues)

---

## Issue 1: Agents Page Empty

### Root Cause
**UI/API response format mismatch.**

`routes/agents.js` line 10 returns the array directly:
```js
res.json(agents.getAllAgents());
```

But `ui/agents.html` line 81 expects a wrapper object:
```js
const agents = response.data || [];
```

Since the response is an array (no `.data` property), `response.data` is `undefined`, fallback `[]` is used → empty page.

### Fix
**File:** `ui/agents.html` line 81

```js
// BEFORE:
const agents = response.data || [];

// AFTER:
const agents = Array.isArray(response) ? response : (response.data || []);
```

**Estimated time:** 1 minute  
**Priority:** 🔴 Blocking

---

## Issue 2: Workflow Execution ID Undefined

### Root Cause
**Field name mismatch between workflow return and UI expectation.**

All workflows return `workflowId` (e.g., `wf-brief-1739422800000`):
- `brief-to-campaign.js` line ~run: `workflowId: 'wf-brief-${Date.now()}'`
- `campaign-launch.js`: `workflowId: 'wf-${Date.now()}'`

But `ui/workflows.html` line 447 reads `result.executionId`:
```js
alert(`Workflow started! Execution ID: ${result.executionId}`);
window.location.href = `/workflow-detail.html?executionId=${result.executionId}`;
```

`result.executionId` is `undefined` because the field is `result.workflowId`.

### Fix
**File:** `ui/workflows.html` lines 447-449

```js
// BEFORE:
alert(`Workflow started! Execution ID: ${result.executionId}`);
window.location.href = `/workflow-detail.html?executionId=${result.executionId}`;

// AFTER:
const execId = result.executionId || result.workflowId || result.id;
alert(`Workflow started! Execution ID: ${execId}`);
window.location.href = `/workflow-detail.html?executionId=${execId}`;
```

**Estimated time:** 2 minutes  
**Priority:** 🔴 Blocking

---

## Issue 3: Brief-to-Campaign Silent Failure (200 in 118ms)

### Root Cause
**Multiple compounding issues:**

1. **The workflow runs synchronously and returns immediately** — The `routes/workflows.js` handler calls `await workflows.runWorkflow(name, body)` which calls `brief-to-campaign.run()`. This workflow:
   - Parses the brief (fast — uses local template parser or media-planner fallback if no API key)
   - Calls `launchAcrossDsps()` which calls `campaignLaunch.run()` for each DSP
   - `campaignLaunch.run()` uses **simulated connectors** (no real API calls) → completes instantly

2. **Campaign creation only happens if `launchResult.status === 'completed'`** — If any stage in `campaign-launch.js` fails or returns a different status, `campaignsDb.create()` is never called.

3. **No execution tracking in database** — The workflow route (`routes/workflows.js` line ~POST /:name/run) just returns the workflow result directly. It never creates an execution record in the database, so:
   - No execution ID is persisted
   - Workflow history shows nothing
   - The workflow-detail page can't look it up

### Fix Plan

**A. Add execution tracking to workflow route** (most important)

**File:** `routes/workflows.js` — POST `/:name/run` handler

```js
// BEFORE:
router.post('/:name/run', validateWorkflowInputs, async (req, res, next) => {
  try {
    const result = await workflows.runWorkflow(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// AFTER:
router.post('/:name/run', validateWorkflowInputs, async (req, res, next) => {
  try {
    // Create execution record BEFORE running
    const execution = executions.create({
      workflowName: req.params.name,
      status: 'running',
      input: req.body,
      startedAt: new Date().toISOString()
    });

    const result = await workflows.runWorkflow(req.params.name, req.body);

    // Update execution with result
    executions.update(execution.id, {
      status: result.status || 'completed',
      output: result,
      completedAt: new Date().toISOString()
    });

    // Include executionId in response
    res.json({ ...result, executionId: execution.id });
  } catch (err) {
    next(err);
  }
});
```

**B. Debug why campaigns aren't being created**

Add logging to `brief-to-campaign.js` `launchAcrossDsps()` to see what `campaignLaunch.run()` actually returns — specifically `launchResult.status` and `createStage?.status`.

**Estimated time:** 15 minutes  
**Priority:** 🔴 Blocking

---

## Summary of Fixes

| # | Issue | Root Cause | File(s) | Time |
|---|-------|-----------|---------|------|
| 1 | Agents page empty | UI reads `response.data` but API returns array | `ui/agents.html` | 1 min |
| 2 | Execution ID undefined | Workflows return `workflowId`, UI reads `executionId` | `ui/workflows.html` | 2 min |
| 3 | Brief-to-campaign silent fail | No execution tracking + status check prevents DB create | `routes/workflows.js`, `workflows/brief-to-campaign.js` | 15 min |

### Are These Related?
Issues 2 and 3 are related — both stem from **no execution tracking layer** between the route and workflow engine. Issue 1 is independent (simple API format mismatch).

### Test Validation Steps

1. **Agents:** Load `/agents` → should see 8 agent cards (7 original + asana-project-manager)
2. **Workflows:** Run any workflow → alert should show a real execution ID, redirect should work
3. **Brief-to-campaign:** Submit a brief → check server logs for launch results, verify campaign appears in `/campaigns`
