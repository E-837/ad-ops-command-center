/**
 * Migration: Create events table
 */

exports.up = function(knex) {
  return knex.schema.createTable('events', (table) => {
    table.string('id').primary();
    table.string('type').notNullable(); // workflow.started, workflow.completed, metric.update, etc.
    table.string('source'); // component that emitted the event
    table.json('payload'); // event data
    table.string('executionId').references('id').inTable('executions').onDelete('SET NULL');
    table.string('projectId').references('id').inTable('projects').onDelete('SET NULL');
    table.boolean('processed').defaultTo(false); // for event processing tracking
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('type');
    table.index('source');
    table.index('executionId');
    table.index('projectId');
    table.index('processed');
    table.index('timestamp');
    table.index(['type', 'processed']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('events');
};
