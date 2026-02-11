/**
 * Recommendations Service
 * Generates AI-powered recommendations for campaign optimization
 */

const { campaigns, metrics, agentMemory } = require('../database/models');
const knex = require('../database/db');

const Recommendations = {
  /**
   * Get budget reallocation recommendations
   * @param {number} campaignId - Campaign ID
   * @param {object} currentPerformance - Current performance data
   * @returns {Promise<object>} Budget recommendation
   */
  async getBudgetRecommendation(campaignId, currentPerformance = null) {
    try {
      // Get recent performance (last 7 days)
      const recentMetrics = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-7 days')"))
        .select('platform', knex.raw('SUM(spend) as spend'), knex.raw('SUM(revenue) as revenue'), knex.raw('SUM(conversions) as conversions'));

      if (recentMetrics.length === 0) {
        return {
          action: 'none',
          reason: 'Insufficient data',
          confidence: 0
        };
      }

      // Calculate efficiency scores
      const efficiency = recentMetrics.map(m => ({
        platform: m.platform,
        spend: parseFloat(m.spend || 0),
        revenue: parseFloat(m.revenue || 0),
        conversions: parseFloat(m.conversions || 0),
        roas: m.spend > 0 ? (m.revenue / m.spend) : 0,
        cpa: m.conversions > 0 ? (m.spend / m.conversions) : 0
      })).filter(e => e.spend > 0);

      if (efficiency.length === 0) {
        return {
          action: 'none',
          reason: 'No spend data available',
          confidence: 0
        };
      }

      // Find top performer
      const topPlatform = efficiency.sort((a, b) => b.roas - a.roas)[0];

      // Recall past similar reallocations
      const pastReallocations = await agentMemory.search('trader', 'optimization_outcomes', {
        keyPattern: 'budget_reallocation',
        minConfidence: 0.6
      });

      // Find underperformers (ROAS < 50% of top performer)
      const underperformers = efficiency.filter(e => 
        e.roas < topPlatform.roas * 0.5 && e.platform !== topPlatform.platform
      );

      if (underperformers.length === 0) {
        return {
          action: 'none',
          reason: 'All platforms performing well',
          confidence: 0.9
        };
      }

      // Calculate reallocation amount (move 30% of underperformer budgets)
      const totalUnderperformerSpend = underperformers.reduce((sum, e) => sum + e.spend, 0);
      const reallocationAmount = totalUnderperformerSpend * 0.3;

      // Predict lift based on past data
      const avgPastLift = pastReallocations.length > 0
        ? pastReallocations.reduce((sum, m) => sum + (m.value.lift || 0), 0) / pastReallocations.length
        : 15; // Default 15% expected lift

      return {
        action: 'reallocate_budget',
        from: underperformers.map(e => ({
          platform: e.platform,
          currentSpend: e.spend,
          currentROAS: e.roas,
          reductionAmount: (e.spend / totalUnderperformerSpend) * reallocationAmount
        })),
        to: {
          platform: topPlatform.platform,
          currentSpend: topPlatform.spend,
          currentROAS: topPlatform.roas,
          increaseAmount: reallocationAmount
        },
        expectedLift: avgPastLift,
        confidence: Math.min(0.9, 0.6 + (pastReallocations.length * 0.05))
      };
    } catch (error) {
      console.error('❌ Error generating budget recommendation:', error);
      throw error;
    }
  },

  /**
   * Get bid adjustment recommendations
   * @param {number} campaignId - Campaign ID
   * @param {string} platform - Platform name
   * @param {object} metrics - Current metrics
   * @returns {Promise<object>} Bid recommendation
   */
  async getBidRecommendation(campaignId, platform, currentMetrics = null) {
    try {
      // Get recent bid performance
      const recentData = await knex('metrics')
        .where({ campaignId, platform })
        .where('timestamp', '>', knex.raw("datetime('now', '-3 days')"))
        .select(knex.raw('AVG(cpc) as avgCPC'), knex.raw('AVG(ctr) as avgCTR'), knex.raw('AVG(conversionRate) as avgConvRate'));

      if (!recentData[0] || !recentData[0].avgCPC) {
        return {
          action: 'none',
          reason: 'Insufficient bid data',
          confidence: 0
        };
      }

      const { avgCPC, avgCTR, avgConvRate } = recentData[0];

      // Recall past bid optimizations
      const pastBids = await agentMemory.search('trader', 'optimization_outcomes', {
        keyPattern: 'bid_optimization',
        minConfidence: 0.6,
        limit: 10
      });

      // Decision logic
      let recommendation = {
        action: 'maintain',
        currentBid: avgCPC,
        reason: 'Performance stable',
        confidence: 0.7
      };

      // Low CTR + Low Conv Rate = Decrease bid
      if (avgCTR < 0.02 && avgConvRate < 0.03) {
        recommendation = {
          action: 'decrease_bid',
          currentBid: avgCPC,
          suggestedBid: avgCPC * 0.85,
          adjustment: -15,
          reason: 'Low engagement and conversion rate',
          confidence: 0.75
        };
      }
      // High CTR + High Conv Rate = Increase bid
      else if (avgCTR > 0.05 && avgConvRate > 0.08) {
        recommendation = {
          action: 'increase_bid',
          currentBid: avgCPC,
          suggestedBid: avgCPC * 1.15,
          adjustment: 15,
          reason: 'High engagement and conversion rate - capture more volume',
          confidence: 0.8
        };
      }
      // High CTR but Low Conv Rate = Test creative
      else if (avgCTR > 0.05 && avgConvRate < 0.03) {
        recommendation = {
          action: 'test_creative',
          currentBid: avgCPC,
          reason: 'High clicks but low conversions - creative may not match intent',
          confidence: 0.7
        };
      }

      return recommendation;
    } catch (error) {
      console.error('❌ Error generating bid recommendation:', error);
      throw error;
    }
  },

  /**
   * Get targeting recommendations
   * @param {number} campaignId - Campaign ID
   * @param {object} performance - Performance by segment
   * @returns {Promise<object>} Targeting recommendation
   */
  async getTargetingRecommendation(campaignId, performance = null) {
    try {
      // Get campaign details
      const campaign = await campaigns.getById(campaignId);

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      // Get segment performance (if available in metrics)
      const segmentPerf = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-7 days')"))
        .whereNotNull('segment')
        .select('segment', knex.raw('SUM(conversions) as conversions'), knex.raw('SUM(spend) as spend'));

      if (segmentPerf.length === 0) {
        return {
          action: 'none',
          reason: 'No segment data available',
          confidence: 0
        };
      }

      // Calculate CPA by segment
      const segments = segmentPerf.map(s => ({
        segment: s.segment,
        conversions: parseFloat(s.conversions || 0),
        spend: parseFloat(s.spend || 0),
        cpa: s.conversions > 0 ? (s.spend / s.conversions) : 0
      }));

      // Find best and worst performers
      const sortedSegments = segments.sort((a, b) => a.cpa - b.cpa);
      const bestSegment = sortedSegments[0];
      const worstSegment = sortedSegments[sortedSegments.length - 1];

      // Decision: expand to similar segments or narrow targeting
      if (worstSegment.cpa > bestSegment.cpa * 2) {
        return {
          action: 'narrow_targeting',
          exclude: [worstSegment.segment],
          reason: `Segment "${worstSegment.segment}" has 2x higher CPA than best performer`,
          expectedSavings: worstSegment.spend * 0.5,
          confidence: 0.8
        };
      } else if (bestSegment.conversions > 50 && bestSegment.cpa < 30) {
        return {
          action: 'expand_targeting',
          expand: [bestSegment.segment],
          reason: `Segment "${bestSegment.segment}" performing well with room to scale`,
          expectedLift: 20,
          confidence: 0.75
        };
      }

      return {
        action: 'maintain',
        reason: 'Targeting performing adequately',
        confidence: 0.7
      };
    } catch (error) {
      console.error('❌ Error generating targeting recommendation:', error);
      throw error;
    }
  },

  /**
   * Get creative recommendations
   * @param {number} campaignId - Campaign ID
   * @param {object} creativePerformance - Creative performance data
   * @returns {Promise<object>} Creative recommendation
   */
  async getCreativeRecommendation(campaignId, creativePerformance = null) {
    try {
      // Recall past creative tests
      const pastTests = await agentMemory.search('creative-ops', 'creative_best_practices', {
        minConfidence: 0.7,
        limit: 10
      });

      // Get creative performance from metrics (if creativeId is tracked)
      const creativePerf = await knex('metrics')
        .where({ campaignId })
        .where('timestamp', '>', knex.raw("datetime('now', '-7 days')"))
        .whereNotNull('creativeId')
        .select('creativeId', knex.raw('SUM(impressions) as impressions'), knex.raw('AVG(ctr) as ctr'), knex.raw('SUM(conversions) as conversions'));

      if (creativePerf.length === 0) {
        return {
          action: 'test_new_creative',
          reason: 'No creative performance data - recommend starting A/B test',
          confidence: 0.6
        };
      }

      // Identify winning and losing creatives
      const creatives = creativePerf.map(c => ({
        id: c.creativeId,
        impressions: parseFloat(c.impressions || 0),
        ctr: parseFloat(c.ctr || 0),
        conversions: parseFloat(c.conversions || 0),
        convRate: c.impressions > 0 ? (c.conversions / c.impressions) : 0
      }));

      const sorted = creatives.sort((a, b) => b.convRate - a.convRate);
      const winner = sorted[0];
      const loser = sorted[sorted.length - 1];

      if (winner.convRate > loser.convRate * 1.5 && loser.impressions > 1000) {
        return {
          action: 'swap_creative',
          pauseCreative: loser.id,
          promoteCreative: winner.id,
          reason: `Creative ${winner.id} has 50%+ better conversion rate`,
          expectedLift: ((winner.convRate - loser.convRate) / loser.convRate) * 100,
          confidence: 0.85
        };
      }

      // Check if creatives are fatigued (high impressions, declining CTR)
      if (winner.impressions > 100000 && winner.ctr < 0.02) {
        return {
          action: 'refresh_creative',
          reason: 'Creative fatigue detected - high impressions with low CTR',
          confidence: 0.7
        };
      }

      return {
        action: 'continue_testing',
        reason: 'Creative performance acceptable, continue monitoring',
        confidence: 0.6
      };
    } catch (error) {
      console.error('❌ Error generating creative recommendation:', error);
      throw error;
    }
  },

  /**
   * Get platform mix recommendations
   * @param {number} totalBudget - Total budget available
   * @param {object} objectives - Campaign objectives
   * @returns {Promise<object>} Platform recommendation
   */
  async getPlatformRecommendation(totalBudget, objectives = {}) {
    try {
      // Recall historical platform performance
      const platformMemories = await agentMemory.search('media-planner', 'campaign_performance', {
        minConfidence: 0.6,
        limit: 20
      });

      // Default platform mix based on objectives
      const defaultMix = {
        awareness: { meta: 0.4, google: 0.3, tiktok: 0.2, pinterest: 0.1 },
        consideration: { google: 0.4, meta: 0.3, youtube: 0.2, linkedin: 0.1 },
        conversion: { google: 0.5, meta: 0.3, amazon: 0.15, pinterest: 0.05 }
      };

      const objective = objectives.primary || 'conversion';
      const baseMix = defaultMix[objective] || defaultMix.conversion;

      // Adjust based on past performance
      const adjustedMix = { ...baseMix };

      if (platformMemories.length > 0) {
        // Calculate average ROAS by platform from memories
        const platformROAS = {};
        platformMemories.forEach(mem => {
          const platform = mem.value.platform || mem.key.split('_')[0];
          const roas = mem.value.roas || mem.value.outcome?.roas || 0;
          if (!platformROAS[platform]) platformROAS[platform] = [];
          platformROAS[platform].push(roas);
        });

        // Adjust allocation based on ROAS
        Object.keys(platformROAS).forEach(platform => {
          const avgROAS = platformROAS[platform].reduce((a, b) => a + b, 0) / platformROAS[platform].length;
          if (adjustedMix[platform] && avgROAS > 2.0) {
            // Increase allocation for high-performing platforms
            adjustedMix[platform] *= 1.2;
          } else if (adjustedMix[platform] && avgROAS < 0.5) {
            // Decrease allocation for low-performing platforms
            adjustedMix[platform] *= 0.8;
          }
        });

        // Normalize to 1.0
        const total = Object.values(adjustedMix).reduce((a, b) => a + b, 0);
        Object.keys(adjustedMix).forEach(p => {
          adjustedMix[p] /= total;
        });
      }

      // Convert to dollar amounts
      const allocation = {};
      Object.keys(adjustedMix).forEach(platform => {
        allocation[platform] = {
          percentage: (adjustedMix[platform] * 100).toFixed(1),
          amount: Math.round(totalBudget * adjustedMix[platform])
        };
      });

      return {
        objective,
        totalBudget,
        allocation,
        rationale: 'Mix optimized based on objective and historical performance',
        confidence: platformMemories.length > 10 ? 0.85 : 0.65
      };
    } catch (error) {
      console.error('❌ Error generating platform recommendation:', error);
      throw error;
    }
  },

  /**
   * Get top optimization priorities
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<Array>} Top 3 recommended actions
   */
  async getOptimizationPriorities(campaignId) {
    try {
      // Get all recommendation types
      const [budget, bid, targeting, creative] = await Promise.all([
        this.getBudgetRecommendation(campaignId),
        this.getBidRecommendation(campaignId, 'meta'), // Default platform
        this.getTargetingRecommendation(campaignId),
        this.getCreativeRecommendation(campaignId)
      ]);

      // Score and rank recommendations
      const recommendations = [
        { type: 'budget', ...budget, score: budget.confidence * (budget.expectedLift || 10) },
        { type: 'bid', ...bid, score: bid.confidence * 10 },
        { type: 'targeting', ...targeting, score: targeting.confidence * (targeting.expectedLift || 15) },
        { type: 'creative', ...creative, score: creative.confidence * (creative.expectedLift || 20) }
      ].filter(r => r.action !== 'none' && r.action !== 'maintain');

      // Sort by score (highest impact first)
      recommendations.sort((a, b) => b.score - a.score);

      return recommendations.slice(0, 3);
    } catch (error) {
      console.error('❌ Error getting optimization priorities:', error);
      throw error;
    }
  },

  /**
   * Get all recommendations for a campaign
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<object>} All recommendations
   */
  async getAllRecommendations(campaignId) {
    try {
      const [budget, bid, targeting, creative, priorities] = await Promise.all([
        this.getBudgetRecommendation(campaignId),
        this.getBidRecommendation(campaignId, 'meta'),
        this.getTargetingRecommendation(campaignId),
        this.getCreativeRecommendation(campaignId),
        this.getOptimizationPriorities(campaignId)
      ]);

      return {
        campaignId,
        timestamp: new Date().toISOString(),
        recommendations: {
          budget,
          bid,
          targeting,
          creative
        },
        priorities
      };
    } catch (error) {
      console.error('❌ Error getting all recommendations:', error);
      throw error;
    }
  }
};

module.exports = Recommendations;
