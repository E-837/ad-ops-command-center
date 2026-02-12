/**
 * A/B Testing Service
 * Manages automated A/B tests with statistical significance analysis
 */

const { abTests, agentMemory, metrics } = require('../database/models');
const knex = require('../database/db');
const logger = require('../utils/logger');

const ABTesting = {
  /**
   * Create and start a new A/B test
   * @param {number} campaignId - Campaign ID
   * @param {string} testType - Type of test (creative, bid, targeting, budget)
   * @param {Array} variants - Array of variant configurations
   * @param {number} duration - Test duration in days
   * @returns {Promise<object>} Created test
   */
  async createTest(campaignId, testType, variants, duration = 14) {
    try {
      // Validate inputs
      if (variants.length < 2) {
        throw new Error('At least 2 variants required for A/B test');
      }

      // Set start and end dates
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

      // Create test
      const test = await abTests.create({
        campaignId,
        testType,
        variants: variants.map((v, i) => ({
          id: v.id || `variant_${String.fromCharCode(65 + i)}`, // A, B, C...
          name: v.name || `Variant ${String.fromCharCode(65 + i)}`,
          config: v.config || v,
          metrics: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0,
            revenue: 0
          }
        })),
        startDate,
        endDate,
        notes: `${testType} test with ${variants.length} variants`
      });

      // Start the test immediately
      await abTests.start(test.id);

      logger.info('A/B test started', { testId: test.id, campaignId, testType, variantCount: variants.length });
      return test;
    } catch (error) {
      logger.error('Error creating A/B test', { error: error.message, stack: error.stack, campaignId, testType });
      throw error;
    }
  },

  /**
   * Get test status and progress
   * @param {number} testId - Test ID
   * @returns {Promise<object>} Test status
   */
  async getTestStatus(testId) {
    try {
      const test = await abTests.getById(testId);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      const now = new Date();
      const start = new Date(test.startDate);
      const end = new Date(test.endDate);

      const totalDuration = end - start;
      const elapsed = now - start;
      const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      // Calculate total sample size
      const totalImpressions = test.variants.reduce((sum, v) => 
        sum + (v.metrics?.impressions || 0), 0
      );
      const totalConversions = test.variants.reduce((sum, v) => 
        sum + (v.metrics?.conversions || 0), 0
      );

      // Check if ready for analysis
      const readyForAnalysis = 
        test.status === 'running' && 
        now >= end &&
        totalConversions >= 100; // Minimum sample size

      return {
        ...test,
        progress: progress.toFixed(1),
        daysElapsed: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
        daysRemaining: Math.ceil((end - now) / (24 * 60 * 60 * 1000)),
        totalImpressions,
        totalConversions,
        readyForAnalysis,
        sufficientSample: totalConversions >= 100
      };
    } catch (error) {
      logger.error('Error getting test status', { testId, error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Calculate statistical significance using chi-squared test
   * @param {object} variantA - First variant data
   * @param {object} variantB - Second variant data
   * @returns {object} Significance test results
   */
  calculateSignificance(variantA, variantB) {
    const { impressions: impA, conversions: convA } = variantA.metrics;
    const { impressions: impB, conversions: convB } = variantB.metrics;

    // Conversion rates
    const rateA = impA > 0 ? convA / impA : 0;
    const rateB = impB > 0 ? convB / impB : 0;

    // Pooled conversion rate
    const pooledRate = (convA + convB) / (impA + impB);

    // Expected conversions under null hypothesis
    const expectedA = impA * pooledRate;
    const expectedB = impB * pooledRate;

    // Chi-squared statistic
    const chiSquared = 
      Math.pow(convA - expectedA, 2) / expectedA +
      Math.pow(convB - expectedB, 2) / expectedB +
      Math.pow((impA - convA) - (impA - expectedA), 2) / (impA - expectedA) +
      Math.pow((impB - convB) - (impB - expectedB), 2) / (impB - expectedB); // Fixed: was expectedA

    // Degrees of freedom = 1 for 2x2 contingency table
    // p < 0.05 threshold is chi-squared > 3.841
    const pValue = chiSquared > 3.841 ? 0.04 : 0.1; // Simplified lookup
    const significant = pValue < 0.05;

    // Calculate lift
    const lift = rateB > 0 ? ((rateA - rateB) / rateB) * 100 : 0;

    return {
      significant,
      pValue: pValue.toFixed(4),
      chiSquared: chiSquared.toFixed(2),
      winner: rateA > rateB ? variantA.id : variantB.id,
      loser: rateA > rateB ? variantB.id : variantA.id,
      lift: Math.abs(lift).toFixed(2),
      confidence: significant ? 95 : 0,
      details: {
        variantA: {
          conversionRate: (rateA * 100).toFixed(2) + '%',
          conversions: convA,
          impressions: impA
        },
        variantB: {
          conversionRate: (rateB * 100).toFixed(2) + '%',
          conversions: convB,
          impressions: impB
        }
      }
    };
  },

  /**
   * Analyze test and determine winner
   * @param {number} testId - Test ID
   * @returns {Promise<object>} Analysis results
   */
  async analyzeTest(testId) {
    try {
      const test = await abTests.getById(testId);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      if (test.status !== 'running') {
        throw new Error(`Test ${testId} is not running (status: ${test.status})`);
      }

      const variants = test.variants;

      if (variants.length !== 2) {
        // For multi-variant tests, compare each to control (first variant)
        const control = variants[0];
        const results = variants.slice(1).map(variant => 
          this.calculateSignificance(control, variant)
        );

        // Find best performer
        const winner = results.reduce((best, r, i) => {
          const variant = variants[i + 1];
          const convRate = variant.metrics.conversions / variant.metrics.impressions;
          const bestConvRate = best ? best.conversionRate : 0;
          return convRate > bestConvRate ? { ...r, variant, conversionRate: convRate } : best;
        }, null);

        await abTests.updateResults(testId, { multiVariant: true, results, winner });

        return { multiVariant: true, results, winner };
      }

      // Two-variant test (standard A/B)
      const result = this.calculateSignificance(variants[0], variants[1]);

      // Update test results
      await abTests.updateResults(testId, result);

      return result;
    } catch (error) {
      logger.error('Error analyzing test', { testId, error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Declare winner and complete test
   * @param {number} testId - Test ID
   * @param {boolean} autoApply - Auto-apply winner if significant
   * @returns {Promise<object>} Completion result
   */
  async declareWinner(testId, autoApply = false) {
    try {
      const analysis = await this.analyzeTest(testId);

      if (!analysis.significant) {
        logger.warn('Test results not statistically significant', { testId });
        await abTests.complete(testId, null);
        return {
          ...analysis,
          winner: null,
          applied: false,
          message: 'No significant winner - inconclusive test'
        };
      }

      // Complete test with winner
      await abTests.complete(testId, analysis.winner);

      // Store learning in agent memory
      const test = await abTests.getById(testId);
      await agentMemory.remember(
        'creative-ops',
        'creative_best_practices',
        `${test.testType}_test_${testId}`,
        {
          testType: test.testType,
          winner: analysis.winner,
          lift: parseFloat(analysis.lift),
          confidence: analysis.confidence,
          campaignId: test.campaignId
        },
        0.8,
        `test_${testId}`
      );

      // Auto-apply if enabled and lift > 20%
      let applied = false;
      if (autoApply && parseFloat(analysis.lift) > 20) {
        await abTests.markApplied(testId);
        applied = true;
        logger.info('Auto-applied test winner', { testId, winner: analysis.winner });
      }

      logger.info('Test winner declared', { testId, winner: analysis.winner, lift: analysis.lift });

      return {
        ...analysis,
        applied,
        message: `Winner: ${analysis.winner} with ${analysis.lift}% lift (${analysis.confidence}% confidence)`
      };
    } catch (error) {
      logger.error('Error declaring test winner', { testId, error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Schedule recommended tests for a campaign
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<Array>} Scheduled tests
   */
  async scheduleTests(campaignId) {
    try {
      // Get campaign performance
      const recentMetrics = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-7 days')"))
        .first();

      if (!recentMetrics) {
        logger.warn('No metrics found for campaign', { campaignId });
        return [];
      }

      const scheduledTests = [];

      // Check if creative test is recommended
      if (recentMetrics.ctr && recentMetrics.ctr < 0.02) {
        const creativeTest = await this.createTest(
          campaignId,
          'creative',
          [
            { id: 'control', name: 'Current Creative', config: { current: true } },
            { id: 'variant_a', name: 'New Creative A', config: { new: true } }
          ],
          14
        );
        scheduledTests.push(creativeTest);
      }

      // Check if bid test is recommended
      if (recentMetrics.cpc && recentMetrics.cpc > 2.0) {
        const bidTest = await this.createTest(
          campaignId,
          'bid',
          [
            { id: 'current_bid', name: 'Current Bid', config: { strategy: 'current' } },
            { id: 'lower_bid', name: 'Lower Bid (-15%)', config: { strategy: 'lower', adjustment: -0.15 } }
          ],
          10
        );
        scheduledTests.push(bidTest);
      }

      logger.info('Tests scheduled for campaign', { campaignId, testCount: scheduledTests.length });
      return scheduledTests;
    } catch (error) {
      logger.error('Error scheduling tests', { campaignId, error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Update test metrics (called periodically)
   * @param {number} testId - Test ID
   * @param {string} variantId - Variant ID
   * @param {object} metrics - Metrics update
   * @returns {Promise<object>} Updated test
   */
  async updateTestMetrics(testId, variantId, metrics) {
    try {
      const test = await abTests.getById(testId);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      // Find and update variant
      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found in test ${testId}`);
      }

      // Merge metrics
      variant.metrics = {
        ...variant.metrics,
        ...metrics
      };

      // Update test
      await knex('ab_tests')
        .where({ id: testId })
        .update({
          variants: JSON.stringify(test.variants),
          updatedAt: knex.fn.now()
        });

      return await abTests.getById(testId);
    } catch (error) {
      logger.error('Error updating test metrics', { testId, error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Get active tests needing analysis
   * @returns {Promise<Array>} Tests ready for analysis
   */
  async getTestsNeedingAnalysis() {
    try {
      return await abTests.getNeedingAnalysis();
    } catch (error) {
      logger.error('Error getting tests needing analysis', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};

module.exports = ABTesting;
