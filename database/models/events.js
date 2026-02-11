/**
 * Events Model - Database-backed
 * Replaces database/events.js with Knex queries
 */

const db = require('../db');

/**
 * Create a new event
 */
async function create(eventData) {
  const id = eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  const event = {
    id,
    type: eventData.type,
    source: eventData.source || null,
    payload: JSON.stringify(eventData.payload || {}),
    executionId: eventData.executionId || null,
    projectId: eventData.projectId || null,
    processed: eventData.processed || false,
    timestamp: eventData.timestamp || now
  };
  
  await db('events').insert(event);
  
  return deserializeEvent(event);
}

/**
 * Get an event by ID
 */
async function get(eventId) {
  const event = await db('events')
    .where({ id: eventId })
    .first();
  
  return event ? deserializeEvent(event) : null;
}

/**
 * List all events with optional filtering
 */
async function list(filter = {}) {
  let query = db('events');
  
  // Filter by type
  if (filter.type) {
    query = query.where('type', filter.type);
  }
  
  // Filter by source
  if (filter.source) {
    query = query.where('source', filter.source);
  }
  
  // Filter by executionId
  if (filter.executionId) {
    query = query.where('executionId', filter.executionId);
  }
  
  // Filter by projectId
  if (filter.projectId) {
    query = query.where('projectId', filter.projectId);
  }
  
  // Filter by processed status
  if (filter.processed !== undefined) {
    query = query.where('processed', filter.processed);
  }
  
  // Filter by date range
  if (filter.since) {
    query = query.where('timestamp', '>=', new Date(filter.since).toISOString());
  }
  
  if (filter.until) {
    query = query.where('timestamp', '<=', new Date(filter.until).toISOString());
  }
  
  // Sort by most recent first
  query = query.orderBy('timestamp', 'desc');
  
  // Limit results
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  
  const events = await query;
  return events.map(deserializeEvent);
}

/**
 * Delete an event
 */
async function deleteEvent(eventId) {
  const existing = await get(eventId);
  
  if (!existing) {
    return { success: false, error: 'Event not found' };
  }
  
  await db('events').where({ id: eventId }).del();
  
  return { success: true };
}

/**
 * Get events by type
 */
async function getByType(type, limit = 100) {
  return list({ type, limit });
}

/**
 * Get unprocessed events
 */
async function getUnprocessed(limit = 100) {
  return list({ processed: false, limit });
}

/**
 * Mark event as processed
 */
async function markProcessed(eventId) {
  const existing = await get(eventId);
  
  if (!existing) {
    throw new Error(`Event ${eventId} not found`);
  }
  
  await db('events')
    .where({ id: eventId })
    .update({ processed: true });
  
  return get(eventId);
}

/**
 * Mark multiple events as processed
 */
async function markManyProcessed(eventIds) {
  if (!eventIds || eventIds.length === 0) {
    return { success: true, count: 0 };
  }
  
  const count = await db('events')
    .whereIn('id', eventIds)
    .update({ processed: true });
  
  return { success: true, count };
}

/**
 * Get events by execution
 */
async function getByExecution(executionId, limit = 100) {
  return list({ executionId, limit });
}

/**
 * Get events by project
 */
async function getByProject(projectId, limit = 100) {
  return list({ projectId, limit });
}

/**
 * Get event statistics
 */
async function getStats() {
  const events = await list({ limit: 10000 }); // Get more for stats
  
  return {
    total: events.length,
    byType: events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    bySource: events.reduce((acc, e) => {
      const source = e.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}),
    processed: events.filter(e => e.processed).length,
    unprocessed: events.filter(e => !e.processed).length
  };
}

/**
 * Clean up old processed events (older than specified days)
 */
async function cleanupOldEvents(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const count = await db('events')
    .where('processed', true)
    .where('timestamp', '<', cutoffDate.toISOString())
    .del();
  
  return { success: true, deletedCount: count };
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeEvent(event) {
  return {
    ...event,
    payload: typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload,
    processed: Boolean(event.processed) // SQLite stores as 0/1
  };
}

module.exports = {
  create,
  get,
  list,
  delete: deleteEvent,
  getByType,
  getUnprocessed,
  markProcessed,
  markManyProcessed,
  getByExecution,
  getByProject,
  getStats,
  cleanupOldEvents
};
