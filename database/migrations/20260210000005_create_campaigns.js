/**
 * Migration: Create campaigns table
 */

exports.up = function(knex) {
  return knex.schema.createTable('campaigns', (table) => {
    table.string('id').primary();
    table.string('projectId').references('id').inTable('projects').onDelete('CASCADE');
    table.string('platform').notNullable(); // google-ads, meta-ads, pinterest, ttd, dv360
    table.string('externalId'); // platform's campaign ID
    table.string('name').notNullable();
    table.string('status'); // active, paused, completed, etc.
    table.decimal('budget', 15, 2);
    table.string('startDate');
    table.string('endDate');
    table.json('metadata'); // platform-specific campaign data
    table.timestamp('syncedAt'); // last sync from platform
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('projectId');
    table.index('platform');
    table.index('externalId');
    table.index('status');
    table.index(['platform', 'externalId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('campaigns');
};
