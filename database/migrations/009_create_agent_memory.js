/**
 * Migration: Agent Memory System
 * Creates tables for agent long-term memory and session context
 */

exports.up = async function(knex) {
  // Agent Memory - Long-term learnings
  await knex.schema.createTable('agent_memory', (table) => {
    table.increments('id').primary();
    table.string('agentName', 100).notNullable().index();
    table.string('category', 100).notNullable().index();
    table.string('key', 255).notNullable();
    table.json('value').notNullable();
    table.float('confidence').notNullable().defaultTo(0.5); // 0.0 to 1.0
    table.string('source', 255); // e.g., 'campaign_123', 'manual_input'
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Composite index for fast lookups
    table.index(['agentName', 'category', 'key']);
    table.index(['confidence']); // For filtering high-confidence memories
  });

  // Agent Context - Short-term session context
  await knex.schema.createTable('agent_context', (table) => {
    table.increments('id').primary();
    table.string('agentName', 100).notNullable().index();
    table.string('sessionId', 100).notNullable().index();
    table.json('context').notNullable(); // Arbitrary context data
    table.timestamp('expiresAt').notNullable().index();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    // Composite index for session lookups
    table.index(['agentName', 'sessionId']);
  });

  console.log('✅ Created agent_memory and agent_context tables');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('agent_context');
  await knex.schema.dropTableIfExists('agent_memory');
  console.log('✅ Dropped agent_memory and agent_context tables');
};
