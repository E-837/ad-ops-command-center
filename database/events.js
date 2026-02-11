/**
 * Events Data Model
 * Query interface for event bus history
 */

const eventBus = require('../events/bus');

/**
 * Get events by project
 */
function getByProject(projectId, limit = 100) {
  return eventBus.getByProject(projectId, limit);
}

/**
 * Get events by workflow
 */
function getByWorkflow(workflowId, limit = 100) {
  return eventBus.getByWorkflow(workflowId, limit);
}

/**
 * Get events by type
 */
function getByType(type, limit = 100) {
  return eventBus.getByType(type, limit);
}

/**
 * Get recent events
 */
function getRecent(count = 50) {
  return eventBus.getRecent(count);
}

/**
 * Get events with filter
 */
function query(filter = {}) {
  return eventBus.getHistory(filter);
}

/**
 * Get event statistics
 */
function getStats() {
  return eventBus.getStats();
}

module.exports = {
  getByProject,
  getByWorkflow,
  getByType,
  getRecent,
  query,
  getStats
};
