/**
 * Models Index
 * Unified export for all database models
 */

const projects = require('./projects');
const executions = require('./executions');
const events = require('./events');
const workflows = require('./workflows');
const campaigns = require('./campaigns');
const metrics = require('./metrics');
const webhooks = require('./webhooks');
const agentMemory = require('./agent-memory');
const agentContext = require('./agent-context');
const abTests = require('./ab-tests');

module.exports = {
  projects,
  executions,
  events,
  workflows,
  campaigns,
  metrics,
  webhooks,
  agentMemory,
  agentContext,
  abTests
};
