/**
 * Migration: A/B Testing System
 * Creates table for managing A/B tests
 */

exports.up = async function(knex) {
  await knex.schema.createTable('ab_tests', (table) => {
    table.increments('id').primary();
    table.integer('campaignId').notNullable().index();
    table.enum('testType', [
      'creative',
      'bid',
      'targeting',
      'budget'
    ]).notNullable();
    table.json('variants').notNullable(); // Array of variant configs
    table.enum('status', [
      'draft',
      'running',
      'analyzing',
      'completed',
      'cancelled'
    ]).notNullable().defaultTo('draft').index();
    table.timestamp('startDate');
    table.timestamp('endDate');
    table.json('results'); // Test results and metrics
    table.string('winner', 50); // Variant ID of winner
    table.boolean('applied').defaultTo(false); // Whether winner was applied
    table.text('notes'); // Additional notes
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for common queries
    table.index(['campaignId', 'status']);
    table.index(['status', 'endDate']);
  });

  console.log('✅ Created ab_tests table');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ab_tests');
  console.log('✅ Dropped ab_tests table');
};
