/**
 * Migration: Create projects table
 */

exports.up = function(knex) {
  return knex.schema.createTable('projects', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('type').defaultTo('campaign'); // campaign, dsp-onboarding, jbp, etc.
    table.string('status').defaultTo('planning'); // planning, active, paused, completed, cancelled
    table.string('owner').defaultTo('system');
    table.string('startDate');
    table.string('endDate');
    table.decimal('budget', 15, 2);
    table.string('platform');
    table.json('metadata');
    table.string('asanaProjectId');
    table.json('milestones'); // array of milestone objects
    table.json('artifacts'); // array of artifact objects
    table.json('metrics'); // completion, health, blockers
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt'); // soft delete support
    
    // Indexes
    table.index('type');
    table.index('status');
    table.index('owner');
    table.index('platform');
    table.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('projects');
};
