/**
 * Predictions Service
 * Forecasts campaign performance and optimizes budget allocation
 */

const { metrics, campaigns } = require('../database/models');
const knex = require('../database/db');
const logger = require('../utils/logger');

const Predictions = {
  /**
   * Calculate prediction confidence based on data volume
   * @param {number} dataPoints - Number of historical data points
   * @returns {number} Confidence score (0.0 to 1.0)
   */
  calculateConfidence(dataPoints) {
    if (dataPoints >= 30) return 0.8; // High confidence
    if (dataPoints >= 14) return 0.6; // Medium confidence
    if (dataPoints >= 7) return 0.4; // Low confidence
    return 0.2; // Very low confidence
  },

  /**
   * Predict campaign performance with proposed budget
   * @param {number} campaignId - Campaign ID
   * @param {number} proposedBudget - Proposed budget amount
   * @returns {Promise<object>} Performance forecast
   */
  async predictPerformance(campaignId, proposedBudget) {
    try {
      // Get historical data (last 30 days)
      const history = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-30 days')"))
        .select(
          knex.raw('AVG(spend) as avgDailySpend'),
          knex.raw('AVG(conversions) as avgDailyConversions'),
          knex.raw('AVG(revenue) as avgDailyRevenue'),
          knex.raw('AVG(impressions) as avgDailyImpressions'),
          knex.raw('AVG(clicks) as avgDailyClicks'),
          knex.raw('COUNT(*) as dataPoints')
        )
        .first();

      if (!history || !history.avgDailySpend) {
        return {
          error: 'Insufficient historical data',
          confidence: 0
        };
      }

      const {
        avgDailySpend,
        avgDailyConversions,
        avgDailyRevenue,
        avgDailyImpressions,
        avgDailyClicks,
        dataPoints
      } = history;

      // Calculate projection period (assume 30 days)
      const projectedDays = 30;
      const dailyBudget = proposedBudget / projectedDays;
      const budgetRatio = dailyBudget / avgDailySpend;

      // Apply diminishing returns for large budget increases
      let diminishingFactor = 1.0;
      if (budgetRatio > 1.5) {
        // 70% efficiency at 1.5x+ budget increase
        diminishingFactor = 0.7;
      } else if (budgetRatio > 1.2) {
        // 85% efficiency at 1.2-1.5x
        diminishingFactor = 0.85;
      }

      // Linear projection with diminishing returns
      const predictedDailyConversions = avgDailyConversions * budgetRatio * diminishingFactor;
      const predictedDailyRevenue = avgDailyRevenue * budgetRatio * diminishingFactor;
      const predictedDailyImpressions = avgDailyImpressions * budgetRatio * diminishingFactor;
      const predictedDailyClicks = avgDailyClicks * budgetRatio * diminishingFactor;

      // Total projections
      const predictedConversions = predictedDailyConversions * projectedDays;
      const predictedRevenue = predictedDailyRevenue * projectedDays;
      const predictedImpressions = predictedDailyImpressions * projectedDays;
      const predictedClicks = predictedDailyClicks * projectedDays;

      // Calculate metrics
      const predictedROAS = proposedBudget > 0 ? predictedRevenue / proposedBudget : 0;
      const predictedCPA = predictedConversions > 0 ? proposedBudget / predictedConversions : 0;
      const predictedCTR = predictedImpressions > 0 ? (predictedClicks / predictedImpressions) * 100 : 0;

      const confidence = this.calculateConfidence(dataPoints);

      return {
        campaignId,
        proposedBudget,
        projectionPeriod: `${projectedDays} days`,
        predictions: {
          conversions: Math.round(predictedConversions),
          revenue: Math.round(predictedRevenue * 100) / 100,
          impressions: Math.round(predictedImpressions),
          clicks: Math.round(predictedClicks),
          roas: Math.round(predictedROAS * 100) / 100,
          cpa: Math.round(predictedCPA * 100) / 100,
          ctr: Math.round(predictedCTR * 100) / 100
        },
        baseline: {
          dailySpend: Math.round(avgDailySpend * 100) / 100,
          dailyConversions: Math.round(avgDailyConversions * 100) / 100,
          dailyRevenue: Math.round(avgDailyRevenue * 100) / 100
        },
        budgetRatio,
        diminishingFactor,
        confidence,
        dataPoints
      };
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Get average ROAS for a platform
   * @param {string} platform - Platform name
   * @param {number} days - Number of days to look back
   * @returns {Promise<number>} Average ROAS
   */
  async getAvgROAS(platform, days = 30) {
    try {
      const result = await knex('metrics')
        .where({ platform })
        .where('timestamp', '>', knex.raw(`datetime('now', '-${days} days')`))
        .select(
          knex.raw('SUM(revenue) as totalRevenue'),
          knex.raw('SUM(spend) as totalSpend')
        )
        .first();

      if (!result || !result.totalSpend || result.totalSpend === 0) {
        return 1.0; // Default ROAS
      }

      return result.totalRevenue / result.totalSpend;
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      return 1.0;
    }
  },

  /**
   * Get current spend for a platform
   * @param {string} platform - Platform name
   * @param {number} days - Number of days to look back
   * @returns {Promise<number>} Total spend
   */
  async getCurrentSpend(platform, days = 30) {
    try {
      const result = await knex('metrics')
        .where({ platform })
        .where('timestamp', '>', knex.raw(`datetime('now', '-${days} days')`))
        .sum('spend as totalSpend')
        .first();

      return result?.totalSpend || 0;
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      return 0;
    }
  },

  /**
   * Predict ROAS for a platform with given budget
   * @param {string} platform - Platform name
   * @param {number} budget - Proposed budget
   * @returns {Promise<number>} Predicted ROAS
   */
  async predictROAS(platform, budget) {
    try {
      const currentSpend = await this.getCurrentSpend(platform, 30);
      const currentROAS = await this.getAvgROAS(platform, 30);

      if (currentSpend === 0) {
        return currentROAS; // No historical data
      }

      const budgetRatio = budget / currentSpend;

      // Apply diminishing returns
      let adjustedROAS = currentROAS;
      if (budgetRatio > 1.5) {
        adjustedROAS *= 0.8; // 20% reduction in efficiency
      } else if (budgetRatio > 1.2) {
        adjustedROAS *= 0.9; // 10% reduction in efficiency
      }

      return adjustedROAS;
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      return 1.0;
    }
  },

  /**
   * Optimize budget allocation across platforms
   * @param {number} totalBudget - Total budget to allocate
   * @param {Array} platforms - Array of platform names
   * @returns {Promise<object>} Optimal allocation
   */
  async optimizeBudgetAllocation(totalBudget, platforms = ['meta', 'google', 'tiktok', 'pinterest']) {
    try {
      // Get historical efficiency for each platform
      const efficiency = await Promise.all(
        platforms.map(async platform => {
          const roas = await this.getAvgROAS(platform, 30);
          const spend = await this.getCurrentSpend(platform, 30);
          return { platform, roas, spend };
        })
      );

      // Calculate total ROAS weight
      const totalROASWeight = efficiency.reduce((sum, e) => sum + e.roas, 0);

      if (totalROASWeight === 0) {
        // Equal distribution if no historical data
        const equalAmount = totalBudget / platforms.length;
        return {
          totalBudget,
          allocations: platforms.map(p => ({
            platform: p,
            recommended: equalAmount,
            percentage: (100 / platforms.length).toFixed(1),
            currentROAS: 1.0,
            projectedROAS: 1.0
          })),
          rationale: 'Equal distribution (no historical data)',
          confidence: 0.3
        };
      }

      // Allocate proportionally to ROAS, with constraints
      const allocations = await Promise.all(
        efficiency.map(async e => {
          const share = e.roas / totalROASWeight;
          let amount = totalBudget * share;

          // Apply constraints
          const minBudget = 100; // Minimum $100 per platform
          const maxBudget = totalBudget * 0.6; // Maximum 60% of total

          amount = Math.max(minBudget, Math.min(amount, maxBudget));

          // Predict ROAS with allocated amount
          const projectedROAS = await this.predictROAS(e.platform, amount);

          return {
            platform: e.platform,
            recommended: Math.round(amount),
            percentage: ((amount / totalBudget) * 100).toFixed(1),
            currentROAS: Math.round(e.roas * 100) / 100,
            projectedROAS: Math.round(projectedROAS * 100) / 100,
            historicalSpend: Math.round(e.spend)
          };
        })
      );

      // Normalize if total exceeds budget (due to minimums)
      const allocatedTotal = allocations.reduce((sum, a) => sum + a.recommended, 0);
      if (allocatedTotal > totalBudget) {
        const ratio = totalBudget / allocatedTotal;
        allocations.forEach(a => {
          a.recommended = Math.round(a.recommended * ratio);
          a.percentage = ((a.recommended / totalBudget) * 100).toFixed(1);
        });
      }

      // Sort by recommended amount (descending)
      allocations.sort((a, b) => b.recommended - a.recommended);

      return {
        totalBudget,
        allocations,
        rationale: 'Optimized allocation based on historical ROAS and diminishing returns',
        confidence: 0.75
      };
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Detect trend for a campaign metric
   * @param {number} campaignId - Campaign ID
   * @param {string} metric - Metric name (spend, conversions, roas, etc.)
   * @returns {Promise<object>} Trend analysis
   */
  async detectTrend(campaignId, metric) {
    try {
      // Get daily metrics for the last 14 days
      const dailyData = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-14 days')"))
        .select(
          knex.raw("DATE(timestamp) as date"),
          knex.raw(`AVG(${metric}) as value`)
        )
        .groupBy(knex.raw('DATE(timestamp)'))
        .orderBy('date', 'asc');

      if (dailyData.length < 5) {
        return {
          metric,
          trend: 'insufficient_data',
          direction: null,
          strength: 0,
          confidence: 0
        };
      }

      // Calculate simple linear regression
      const n = dailyData.length;
      const xValues = dailyData.map((_, i) => i); // 0, 1, 2, ...
      const yValues = dailyData.map(d => parseFloat(d.value || 0));

      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate R-squared for trend strength
      const yMean = sumY / n;
      const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
      const ssResidual = yValues.reduce((sum, y, i) => {
        const predicted = slope * i + intercept;
        return sum + Math.pow(y - predicted, 2);
      }, 0);
      const rSquared = 1 - (ssResidual / ssTotal);

      // Determine direction
      let direction = 'stable';
      if (Math.abs(slope) > 0.05) {
        direction = slope > 0 ? 'increasing' : 'decreasing';
      }

      // Trend strength based on R-squared
      let strength = 'weak';
      if (rSquared > 0.7) strength = 'strong';
      else if (rSquared > 0.4) strength = 'moderate';

      return {
        metric,
        trend: direction,
        direction,
        strength,
        slope: Math.round(slope * 1000) / 1000,
        rSquared: Math.round(rSquared * 100) / 100,
        confidence: Math.min(0.9, rSquared),
        dataPoints: n,
        recentValue: yValues[yValues.length - 1],
        avgValue: Math.round(yMean * 100) / 100
      };
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Get trend analysis for multiple metrics
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<object>} Trends for key metrics
   */
  async getTrendAnalysis(campaignId) {
    try {
      const keyMetrics = ['spend', 'conversions', 'revenue', 'ctr', 'cpc'];

      const trends = await Promise.all(
        keyMetrics.map(metric => this.detectTrend(campaignId, metric))
      );

      // Summarize overall health
      const increasingCount = trends.filter(t => t.direction === 'increasing').length;
      const decreasingCount = trends.filter(t => t.direction === 'decreasing').length;

      let overallHealth = 'stable';
      if (increasingCount > decreasingCount + 1) {
        overallHealth = 'improving';
      } else if (decreasingCount > increasingCount + 1) {
        overallHealth = 'declining';
      }

      return {
        campaignId,
        overallHealth,
        trends: trends.reduce((obj, t) => {
          obj[t.metric] = t;
          return obj;
        }, {}),
        summary: {
          increasingMetrics: trends.filter(t => t.direction === 'increasing').map(t => t.metric),
          decreasingMetrics: trends.filter(t => t.direction === 'decreasing').map(t => t.metric),
          stableMetrics: trends.filter(t => t.direction === 'stable').map(t => t.metric)
        }
      };
    } catch (error) {
      logger.error('Operation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};

module.exports = Predictions;
