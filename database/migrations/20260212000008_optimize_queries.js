/**
 * Migration: Query optimization with additional compound indexes
 * Targets frequent query patterns identified in analytics and reporting
 */

exports.up = async function(knex) {
  console.log('🔧 Adding query optimization indexes...');
  
  // Projects: Time-range queries with status filter
  await knex.schema.table('projects', (table) => {
    table.index(['createdAt', 'status'], 'idx_projects_created_status');
    table.index(['updatedAt', 'status'], 'idx_projects_updated_status');
  });
  
  // Executions: Workflow performance queries
  await knex.schema.table('executions', (table) => {
    table.index(['workflowId', 'status', 'createdAt'], 'idx_executions_workflow_status_date');
    table.index(['projectId', 'status'], 'idx_executions_project_status');
  });
  
  // Campaigns: Recent active campaigns by platform
  await knex.schema.table('campaigns', (table) => {
    table.index(['createdAt', 'status'], 'idx_campaigns_created_status');
    table.index(['syncedAt'], 'idx_campaigns_synced');
  });
  
  // Metrics: Aggregation queries (sum spend by date, etc.)
  await knex.schema.table('metrics', (table) => {
    table.index(['campaignId', 'date', 'spend'], 'idx_metrics_campaign_date_spend');
    table.index(['date', 'spend'], 'idx_metrics_date_spend');
  });
  
  console.log('✅ Query optimization indexes created');
};

exports.down = async function(knex) {
  await knex.schema.table('projects', (table) => {
    table.dropIndex([], 'idx_projects_created_status');
    table.dropIndex([], 'idx_projects_updated_status');
  });
  
  await knex.schema.table('executions', (table) => {
    table.dropIndex([], 'idx_executions_workflow_status_date');
    table.dropIndex([], 'idx_executions_project_status');
  });
  
  await knex.schema.table('campaigns', (table) => {
    table.dropIndex([], 'idx_campaigns_created_status');
    table.dropIndex([], 'idx_campaigns_synced');
  });
  
  await knex.schema.table('metrics', (table) => {
    table.dropIndex([], 'idx_metrics_campaign_date_spend');
    table.dropIndex([], 'idx_metrics_date_spend');
  });
};
