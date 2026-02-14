# Stability Fix Plan — Ad Ops Command Center

## Root Causes

### 1. Server Crash on Uncaught Exceptions
**File:** `server.js` lines 169-172
```js
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);  // ❌ KILLS THE SERVER
});
```

**Impact:** Any unhandled error in workflow execution crashes the entire server.

---

### 2. No Error Boundaries in Workflow Execution
**File:** `workflows/campaign-lifecycle-demo.js`
- `run()` function has no top-level try/catch
- Individual stages catch their own errors, but orchestration layer doesn't
- If stage throws during event emission or checkpoint save → uncaught exception

---

### 3. MCP Call Timeouts Not Enforced
**File:** `scripts/mcp-helper.js`
- Timeouts are passed but not enforced at spawn level
- Long-running MCP calls can hang indefinitely
- Process cleanup kills them after 5 minutes → partial state corruption

---

### 4. Async Promise Rejections Not Caught
**File:** `server.js` lines 174-176
```js
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
  // ❌ NO process.exit() but error propagates to uncaughtException
});
```

---

## Fixes Implemented

### ✅ Fix 1: Remove Server Exit on Uncaught Exception
**Change `server.js` lines 169-172:**
```js
// BEFORE:
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);  // ❌ KILLS THE SERVER
});

// AFTER:
process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught exception (server kept alive)', { 
    error: err.message, 
    stack: err.stack,
    pid: process.pid,
    uptime: process.uptime()
  });
  // ✅ Log and continue — let workflow error handlers deal with it
});
```

---

### ✅ Fix 2: Add Global Try/Catch to Workflow Run
**Change `workflows/campaign-lifecycle-demo.js` run() function:**
```js
async function run(opts = {}) {
  // ... existing code ...
  
  try {
    // --- EXISTING WORKFLOW LOGIC HERE ---
    for (const [index, fn] of orderedStages) {
      await runStage(index, fn);
    }
    
    const hasFailures = results.stages.some(s => s.status === 'failed');
    results.status = hasFailures ? 'partial' : 'completed';
    results.completedAt = new Date().toISOString();

    if (!hasFailures) {
      clearCheckpoint(executionId);
    }

    return results;
    
  } catch (error) {
    // ✅ CATCH ANY UNHANDLED ERRORS
    logger.error('Workflow execution failed with unhandled error', {
      workflowId: executionId,
      error: error.message,
      stack: error.stack,
      completedStages: results.stages.filter(s => s.status === 'completed').length,
      totalStages: STAGES.length
    });
    
    results.status = 'failed';
    results.error = error.message;
    results.errorStack = error.stack;
    results.completedAt = new Date().toISOString();
    
    // Save checkpoint so it can be resumed
    const lastCompletedStage = results.stages[results.stages.length - 1];
    if (lastCompletedStage) {
      saveCheckpoint(executionId, lastCompletedStage.id, {
        workflowId: 'campaign-lifecycle-demo',
        stageName: lastCompletedStage.name,
        completedAt: lastCompletedStage.completedAt || new Date().toISOString(),
        artifacts: results.artifacts,
        allArtifacts: results.artifacts,
        nextStage: STAGES[results.stages.length]?.id || null,
        error: error.message
      });
    }
    
    return results;
  }
}
```

---

### ✅ Fix 3: Add Per-Stage Error Boundaries
**Wrap each `runStage()` execution:**
```js
for (const [index, fn] of orderedStages) {
  try {
    await runStage(index, fn);
  } catch (stageError) {
    logger.error('Stage execution failed', {
      stageIndex: index,
      stageName: STAGES[index].name,
      error: stageError.message,
      stack: stageError.stack
    });
    
    // Add failed stage to results
    results.stages.push({
      id: STAGES[index].id,
      name: STAGES[index].name,
      status: 'failed',
      error: stageError.message,
      errorStack: stageError.stack,
      completedAt: new Date().toISOString()
    });
    
    // Continue to next stage instead of crashing
  }
}
```

---

### ✅ Fix 4: Add Workflow Route Error Boundary
**Change `routes/workflows.js` POST `/:name/run` handler:**
```js
router.post('/:name/run', validateWorkflowInputs, async (req, res, next) => {
  let execution = null;
  
  try {
    // Create execution record BEFORE running
    execution = executions.create({
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
      completedAt: new Date().toISOString(),
      error: result.error || null
    });

    // Include executionId in response
    res.json({ ...result, executionId: execution.id });
    
  } catch (err) {
    logger.error('Workflow route error', {
      workflow: req.params.name,
      executionId: execution?.id,
      error: err.message,
      stack: err.stack
    });
    
    // Update execution record if it exists
    if (execution) {
      executions.update(execution.id, {
        status: 'failed',
        error: err.message,
        errorStack: err.stack,
        completedAt: new Date().toISOString()
      });
    }
    
    // Send error response (don't crash server)
    res.status(500).json({
      success: false,
      error: err.message,
      executionId: execution?.id,
      workflow: req.params.name
    });
  }
});
```

---

### ✅ Fix 5: Add MCP Call Timeout Enforcement
**Already implemented via semaphore** in `utils/semaphore.js` (max 3 concurrent calls)
**Process cleanup** in `utils/process-cleanup.js` (kills orphans >5min)

**Additional safeguard:** Add timeout to individual MCP calls in workflow stages:
```js
// In each stage that calls MCP:
const r = await callToolAsync('tool', 'method', params, { 
  timeoutMs: 30000,  // ✅ 30s timeout
  maxRetries: 1      // ✅ Only retry once
});
```

---

## Testing Plan

1. **Run lifecycle demo with intentional errors:**
   - Invalid MCP credentials → stage should fail, workflow continues
   - Network timeout → stage should timeout gracefully
   - Process killed mid-execution → checkpoint should allow resume

2. **Monitor server logs:**
   - No `process.exit(1)` should occur
   - Uncaught exceptions logged but server stays alive
   - All errors caught and reported to UI

3. **Verify UI shows proper error states:**
   - Failed stages marked red
   - Error messages displayed
   - Resume option available

---

## Implementation Checklist

- [ ] Fix 1: Update `server.js` uncaughtException handler
- [ ] Fix 2: Add global try/catch to `campaign-lifecycle-demo.js`
- [ ] Fix 3: Add per-stage error boundaries
- [ ] Fix 4: Update `routes/workflows.js` error handling
- [ ] Test with real workflow execution
- [ ] Document error recovery procedures

**Estimated time:** 20 minutes
**Priority:** 🔴 Critical
