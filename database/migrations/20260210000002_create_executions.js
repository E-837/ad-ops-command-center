/**
 * Migration: Create executions table
 */

exports.up = function(knex) {
  return knex.schema.createTable('executions', (table) => {
    table.string('id').primary();
    table.string('projectId').references('id').inTable('projects').onDelete('SET NULL');
    table.string('workflowId').notNullable();
    table.string('status').defaultTo('queued'); // queued, running, completed, failed, cancelled
    table.json('params'); // workflow parameters
    table.json('stages'); // array of stage objects with status
    table.json('result'); // final execution result
    table.text('error'); // error message if failed
    table.json('artifacts'); // array of artifact objects
    table.integer('duration'); // execution duration in milliseconds
    table.timestamp('startedAt');
    table.timestamp('completedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('projectId');
    table.index('workflowId');
    table.index('status');
    table.index('createdAt');
    table.index(['workflowId', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('executions');
};
