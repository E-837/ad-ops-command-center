/**
 * Migration: Create metrics table
 */

exports.up = function(knex) {
  return knex.schema.createTable('metrics', (table) => {
    table.increments('id').primary();
    table.string('campaignId').references('id').inTable('campaigns').onDelete('CASCADE');
    table.string('date').notNullable(); // YYYY-MM-DD
    table.integer('impressions').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.decimal('spend', 15, 2).defaultTo(0);
    table.decimal('revenue', 15, 2).defaultTo(0);
    table.decimal('ctr', 10, 4); // click-through rate
    table.decimal('cpc', 10, 2); // cost per click
    table.decimal('cpa', 10, 2); // cost per acquisition
    table.decimal('roas', 10, 2); // return on ad spend
    table.json('metadata'); // additional platform-specific metrics
    table.timestamp('syncedAt').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('campaignId');
    table.index('date');
    table.index(['campaignId', 'date']);
    
    // Unique constraint: one record per campaign per day
    table.unique(['campaignId', 'date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('metrics');
};
