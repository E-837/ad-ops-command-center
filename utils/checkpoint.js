/**
 * Workflow checkpoint manager
 * JSON-backed checkpoint storage with atomic writes.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const CHECKPOINT_DIR = path.join(__dirname, '..', 'checkpoints');
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'workflow-checkpoints.json');
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

function ensureStore() {
  if (!fs.existsSync(CHECKPOINT_DIR)) {
    fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    fs.writeFileSync(CHECKPOINT_FILE, '{}', 'utf8');
  }
}

function safeReadStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch (err) {
    logger.error('Failed to read checkpoint store; resetting', { error: err.message });
    return {};
  }
}

function atomicWriteStore(store) {
  ensureStore();
  const tempFile = `${CHECKPOINT_FILE}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempFile, CHECKPOINT_FILE);
}

function cleanupStaleInStore(store) {
  const now = Date.now();
  let changed = false;
  for (const [executionId, checkpoint] of Object.entries(store)) {
    const createdAt = checkpoint?.createdAt ? Date.parse(checkpoint.createdAt) : NaN;
    if (!Number.isFinite(createdAt) || (now - createdAt) > TTL_MS) {
      delete store[executionId];
      changed = true;
    }
  }
  return changed;
}

function normalizeCheckpoint(checkpoint) {
  if (!checkpoint || typeof checkpoint !== 'object') return null;
  const completedStages = Array.isArray(checkpoint.completedStages) ? checkpoint.completedStages : [];
  return {
    executionId: checkpoint.executionId,
    workflowId: checkpoint.workflowId,
    completedStages,
    lastStage: checkpoint.lastStage || null,
    nextStage: checkpoint.nextStage || null,
    artifacts: checkpoint.artifacts || {},
    createdAt: checkpoint.createdAt || new Date().toISOString(),
    updatedAt: checkpoint.updatedAt || new Date().toISOString()
  };
}

function saveCheckpoint(executionId, stageId, data = {}) {
  if (!executionId || !stageId) {
    throw new Error('saveCheckpoint requires executionId and stageId');
  }

  const store = safeReadStore();
  const hadStale = cleanupStaleInStore(store);

  const now = new Date().toISOString();
  const existing = normalizeCheckpoint(store[executionId]) || {
    executionId,
    workflowId: data.workflowId || null,
    completedStages: [],
    lastStage: null,
    nextStage: null,
    artifacts: {},
    createdAt: now,
    updatedAt: now
  };

  const stageEntry = {
    id: stageId,
    name: data.stageName || stageId,
    completedAt: data.completedAt || now,
    artifacts: data.artifacts || {}
  };

  const idx = existing.completedStages.findIndex(s => s.id === stageId);
  if (idx >= 0) existing.completedStages[idx] = stageEntry;
  else existing.completedStages.push(stageEntry);

  existing.executionId = executionId;
  existing.workflowId = data.workflowId || existing.workflowId || null;
  existing.lastStage = stageId;
  existing.nextStage = data.nextStage || null;
  existing.artifacts = {
    ...(existing.artifacts || {}),
    ...(data.allArtifacts || {}),
    ...(data.artifacts || {})
  };
  existing.updatedAt = now;

  store[executionId] = existing;
  atomicWriteStore(store);

  if (hadStale) logger.info('Cleaned stale checkpoints during save');
  return existing;
}

function loadCheckpoint(executionId) {
  if (!executionId) return null;
  const store = safeReadStore();
  const hadStale = cleanupStaleInStore(store);
  if (hadStale) atomicWriteStore(store);

  const checkpoint = normalizeCheckpoint(store[executionId]);
  if (!checkpoint) return null;
  if (!Array.isArray(checkpoint.completedStages)) return null;
  return checkpoint;
}

function clearCheckpoint(executionId) {
  if (!executionId) return false;
  const store = safeReadStore();
  if (!store[executionId]) return false;
  delete store[executionId];
  atomicWriteStore(store);
  return true;
}

module.exports = {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint
};
