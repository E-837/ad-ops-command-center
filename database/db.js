/**
 * Database Connection
 * Singleton Knex instance for database operations
 */

const knex = require('knex');
const knexConfig = require('./knexfile');

// Determine environment
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create knex instance
const db = knex(config);

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await db.raw('SELECT 1');
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Close database connection
 */
async function closeConnection() {
  await db.destroy();
}

/**
 * Get database instance (for direct queries)
 */
function getDb() {
  return db;
}

module.exports = db;
module.exports.testConnection = testConnection;
module.exports.closeConnection = closeConnection;
module.exports.getDb = getDb;
