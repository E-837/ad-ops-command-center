/**
 * Migration: Create additional indexes for common queries
 */

exports.up = async function(knex) {
  // Composite indexes for common query patterns
  
  // Projects: active projects by platform
  await knex.schema.table('projects', (table) => {
    table.index(['status', 'platform'], 'idx_projects_status_platform');
    table.index(['owner', 'status'], 'idx_projects_owner_status');
  });
  
  // Executions: recent executions by workflow and status
  await knex.schema.table('executions', (table) => {
    table.index(['createdAt', 'status'], 'idx_executions_created_status');
  });
  
  // Events: unprocessed events by type
  await knex.schema.table('events', (table) => {
    table.index(['timestamp', 'type'], 'idx_events_timestamp_type');
  });
  
  // Campaigns: active campaigns by platform
  await knex.schema.table('campaigns', (table) => {
    table.index(['platform', 'status'], 'idx_campaigns_platform_status');
  });
  
  // Metrics: date range queries
  await knex.schema.table('metrics', (table) => {
    table.index(['date', 'campaignId'], 'idx_metrics_date_campaign');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('projects', (table) => {
    table.dropIndex([], 'idx_projects_status_platform');
    table.dropIndex([], 'idx_projects_owner_status');
  });
  
  await knex.schema.table('executions', (table) => {
    table.dropIndex([], 'idx_executions_created_status');
  });
  
  await knex.schema.table('events', (table) => {
    table.dropIndex([], 'idx_events_timestamp_type');
  });
  
  await knex.schema.table('campaigns', (table) => {
    table.dropIndex([], 'idx_campaigns_platform_status');
  });
  
  await knex.schema.table('metrics', (table) => {
    table.dropIndex([], 'idx_metrics_date_campaign');
  });
};
