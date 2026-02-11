/**
 * Migration: Create workflows table
 */

exports.up = function(knex) {
  return knex.schema.createTable('workflows', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('category'); // campaign-management, dsp-operations, analytics, etc.
    table.string('version').defaultTo('1.0.0');
    table.json('config'); // workflow configuration (stages, agents, params schema)
    table.boolean('enabled').defaultTo(true);
    table.text('description');
    table.json('metadata'); // tags, author, etc.
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('category');
    table.index('enabled');
    table.index('name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('workflows');
};
