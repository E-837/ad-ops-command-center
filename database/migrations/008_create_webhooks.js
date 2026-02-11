/**
 * Migration: Create Webhooks Tables
 * Tables for webhook registry and delivery logs
 */

module.exports = {
  up: (knex) => {
    // Webhooks registry table
    knex.raw(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'outbound',
        events TEXT NOT NULL DEFAULT '[]',
        enabled INTEGER NOT NULL DEFAULT 1,
        metadata TEXT DEFAULT '{}',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `).then(() => {});
    
    // Webhook deliveries log table
    knex.raw(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhookId TEXT NOT NULL,
        eventType TEXT NOT NULL,
        status TEXT NOT NULL,
        responseData TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (webhookId) REFERENCES webhooks(id) ON DELETE CASCADE
      )
    `).then(() => {});
    
    // Create indexes
    knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_webhooks_direction ON webhooks(direction)
    `).then(() => {});
    
    knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled)
    `).then(() => {});
    
    knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhookId)
    `).then(() => {});
    
    knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(createdAt)
    `).then(() => {});
    
    console.log('✅ Migration 008: Created webhooks tables');
  },
  
  down: (knex) => {
    knex.raw('DROP TABLE IF EXISTS webhook_deliveries').then(() => {});
    knex.raw('DROP TABLE IF EXISTS webhooks').then(() => {});
    console.log('✅ Migration 008: Dropped webhooks tables');
  }
};
