/**
 * Migration: Add LOB (Line of Business) field to campaigns
 */

exports.up = async function(knex) {
  const hasLob = await knex.schema.hasColumn('campaigns', 'lob');

  if (!hasLob) {
    await knex.schema.alterTable('campaigns', (table) => {
      table.string('lob').index();
    });
  }
};

exports.down = async function(knex) {
  const hasLob = await knex.schema.hasColumn('campaigns', 'lob');

  if (hasLob) {
    await knex.schema.alterTable('campaigns', (table) => {
      table.dropColumn('lob');
    });
  }
};
