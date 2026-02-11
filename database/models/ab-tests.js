/**
 * A/B Tests Model
 * Manages A/B test lifecycle and data
 */

const knex = require('../db');

const ABTests = {
  /**
   * Create a new A/B test
   * @param {object} testData - Test configuration
   * @returns {Promise<object>} Created test
   */
  async create(testData) {
    try {
      const {
        campaignId,
        testType,
        variants,
        startDate = null,
        endDate = null,
        notes = null
      } = testData;

      const [id] = await knex('ab_tests').insert({
        campaignId,
        testType,
        variants: JSON.stringify(variants),
        startDate,
        endDate,
        notes,
        status: 'draft'
      });

      return await this.getById(id);
    } catch (error) {
      console.error('❌ Error creating A/B test:', error);
      throw error;
    }
  },

  /**
   * Get test by ID
   * @param {number} id - Test ID
   * @returns {Promise<object|null>} Test object
   */
  async getById(id) {
    try {
      const test = await knex('ab_tests').where({ id }).first();

      if (test) {
        test.variants = JSON.parse(test.variants);
        if (test.results) test.results = JSON.parse(test.results);
      }

      return test || null;
    } catch (error) {
      console.error(`❌ Error getting test ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get tests by campaign ID
   * @param {number} campaignId - Campaign ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Array of tests
   */
  async getByCampaign(campaignId, status = null) {
    try {
      let query = knex('ab_tests').where({ campaignId });

      if (status) {
        query = query.where({ status });
      }

      const tests = await query.orderBy('createdAt', 'desc');

      return tests.map(t => ({
        ...t,
        variants: JSON.parse(t.variants),
        results: t.results ? JSON.parse(t.results) : null
      }));
    } catch (error) {
      console.error(`❌ Error getting tests for campaign ${campaignId}:`, error);
      throw error;
    }
  },

  /**
   * Start a test
   * @param {number} id - Test ID
   * @returns {Promise<object>} Updated test
   */
  async start(id) {
    try {
      await knex('ab_tests')
        .where({ id })
        .update({
          status: 'running',
          startDate: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

      console.log(`▶️ Started A/B test ${id}`);
      return await this.getById(id);
    } catch (error) {
      console.error(`❌ Error starting test ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update test results
   * @param {number} id - Test ID
   * @param {object} results - Test results
   * @returns {Promise<object>} Updated test
   */
  async updateResults(id, results) {
    try {
      await knex('ab_tests')
        .where({ id })
        .update({
          results: JSON.stringify(results),
          updatedAt: knex.fn.now()
        });

      return await this.getById(id);
    } catch (error) {
      console.error(`❌ Error updating test ${id} results:`, error);
      throw error;
    }
  },

  /**
   * Complete a test and declare winner
   * @param {number} id - Test ID
   * @param {string} winner - Winner variant ID
   * @returns {Promise<object>} Updated test
   */
  async complete(id, winner = null) {
    try {
      await knex('ab_tests')
        .where({ id })
        .update({
          status: 'completed',
          winner,
          endDate: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

      console.log(`🏁 Completed A/B test ${id}, winner: ${winner || 'none'}`);
      return await this.getById(id);
    } catch (error) {
      console.error(`❌ Error completing test ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mark test as applied (winner was implemented)
   * @param {number} id - Test ID
   * @returns {Promise<object>} Updated test
   */
  async markApplied(id) {
    try {
      await knex('ab_tests')
        .where({ id })
        .update({
          applied: true,
          updatedAt: knex.fn.now()
        });

      console.log(`✅ Marked test ${id} as applied`);
      return await this.getById(id);
    } catch (error) {
      console.error(`❌ Error marking test ${id} as applied:`, error);
      throw error;
    }
  },

  /**
   * Cancel a test
   * @param {number} id - Test ID
   * @returns {Promise<object>} Updated test
   */
  async cancel(id) {
    try {
      await knex('ab_tests')
        .where({ id })
        .update({
          status: 'cancelled',
          endDate: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

      console.log(`❌ Cancelled A/B test ${id}`);
      return await this.getById(id);
    } catch (error) {
      console.error(`❌ Error cancelling test ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all running tests
   * @returns {Promise<Array>} Array of running tests
   */
  async getRunning() {
    try {
      const tests = await knex('ab_tests')
        .where({ status: 'running' })
        .orderBy('startDate', 'asc');

      return tests.map(t => ({
        ...t,
        variants: JSON.parse(t.variants),
        results: t.results ? JSON.parse(t.results) : null
      }));
    } catch (error) {
      console.error('❌ Error getting running tests:', error);
      throw error;
    }
  },

  /**
   * Get tests needing analysis (ended but not completed)
   * @returns {Promise<Array>} Array of tests to analyze
   */
  async getNeedingAnalysis() {
    try {
      const tests = await knex('ab_tests')
        .where({ status: 'running' })
        .where('endDate', '<', knex.fn.now())
        .orderBy('endDate', 'asc');

      return tests.map(t => ({
        ...t,
        variants: JSON.parse(t.variants),
        results: t.results ? JSON.parse(t.results) : null
      }));
    } catch (error) {
      console.error('❌ Error getting tests needing analysis:', error);
      throw error;
    }
  },

  /**
   * Delete a test
   * @param {number} id - Test ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      await knex('ab_tests').where({ id }).del();
      console.log(`🗑️ Deleted A/B test ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting test ${id}:`, error);
      throw error;
    }
  }
};

module.exports = ABTests;
