/**
 * Optimization Workflow
 * Bid and budget adjustment recommendations
 */

const connectors = require('../connectors');
const trader = require('../agents/trader');
const domain = require('../domain');

const name = 'Optimization';
const description = 'Generate bid and budget adjustment recommendations';

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    schedule: 'Daily at 10 AM',
    estimatedDuration: '10 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params = {}) {
  const results = {
    workflowId: `opt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    recommendations: [],
    summary: {}
  };
  
  // Fetch all live campaigns
  const allCampaigns = await connectors.fetchAllCampaigns({ status: 'live' });
  
  for (const campaign of allCampaigns.campaigns) {
    try {
      // Get metrics
      const connector = connectors.getConnector(campaign.dsp);
      const metricsResult = await connector.getMetrics(campaign.id);
      const metrics = metricsResult.metrics;
      
      // Get pacing
      const pacing = await connector.getPacing();
      const campaignPacing = pacing.find(p => p.campaignId === campaign.id);
      
      // Generate recommendations
      const campaignRecs = generateOptimizationRecs(campaign, metrics, campaignPacing);
      
      if (campaignRecs.length > 0) {
        results.recommendations.push({
          campaign: {
            id: campaign.id,
            name: campaign.name,
            dsp: campaign.dsp
          },
          actions: campaignRecs
        });
      }
    } catch (error) {
      console.error(`Error optimizing ${campaign.id}:`, error.message);
    }
  }
  
  // Generate summary
  results.summary = {
    campaignsAnalyzed: allCampaigns.campaigns.length,
    campaignsWithRecs: results.recommendations.length,
    totalRecommendations: results.recommendations.reduce(
      (sum, r) => sum + r.actions.length, 0
    ),
    byPriority: {
      high: results.recommendations.flatMap(r => r.actions).filter(a => a.priority === 'high').length,
      medium: results.recommendations.flatMap(r => r.actions).filter(a => a.priority === 'medium').length,
      low: results.recommendations.flatMap(r => r.actions).filter(a => a.priority === 'low').length
    }
  };
  
  return results;
}

/**
 * Generate optimization recommendations for a campaign
 */
function generateOptimizationRecs(campaign, metrics, pacing) {
  const recommendations = [];
  
  // Pacing-based recommendations
  if (pacing) {
    const variance = parseFloat(pacing.variance);
    
    if (variance < -20) {
      recommendations.push({
        type: 'bid_increase',
        priority: 'high',
        action: 'Increase bids by 25-30%',
        reason: `Campaign is ${Math.abs(variance).toFixed(0)}% behind pacing`,
        expectedImpact: 'Accelerate spend to meet targets'
      });
      
      recommendations.push({
        type: 'targeting_expansion',
        priority: 'medium',
        action: 'Expand targeting criteria',
        reason: 'Additional inventory needed',
        expectedImpact: '+20-30% available impressions'
      });
    } else if (variance < -10) {
      recommendations.push({
        type: 'bid_increase',
        priority: 'medium',
        action: 'Increase bids by 10-15%',
        reason: `Campaign is ${Math.abs(variance).toFixed(0)}% behind pacing`,
        expectedImpact: 'Moderate spend acceleration'
      });
    } else if (variance > 30) {
      recommendations.push({
        type: 'bid_decrease',
        priority: 'high',
        action: 'Decrease bids by 20-25%',
        reason: `Campaign is ${variance.toFixed(0)}% ahead of pacing`,
        expectedImpact: 'Prevent early budget exhaustion'
      });
    } else if (variance > 15) {
      recommendations.push({
        type: 'bid_decrease',
        priority: 'medium',
        action: 'Decrease bids by 10-15%',
        reason: `Campaign is ${variance.toFixed(0)}% ahead of pacing`,
        expectedImpact: 'Smoother budget delivery'
      });
    }
  }
  
  // Performance-based recommendations
  if (metrics) {
    // CTR optimization
    const ctrBenchmark = domain.getCTRBenchmark(campaign.channel, campaign.funnel || 'awareness');
    if (ctrBenchmark && metrics.ctr) {
      if (metrics.ctr < ctrBenchmark.min) {
        recommendations.push({
          type: 'creative_refresh',
          priority: 'medium',
          action: 'Review and refresh creatives',
          reason: `CTR ${metrics.ctr}% is below benchmark ${ctrBenchmark.min}%`,
          expectedImpact: 'Improved engagement'
        });
      }
    }
    
    // Viewability optimization
    if (metrics.viewability) {
      const viewCheck = domain.checkViewability(metrics.viewability, campaign.channel);
      if (viewCheck.status === 'failing') {
        recommendations.push({
          type: 'viewability_filter',
          priority: 'high',
          action: 'Enable pre-bid viewability filter',
          reason: viewCheck.action,
          expectedImpact: 'Higher quality impressions'
        });
      } else if (viewCheck.status === 'below_target') {
        recommendations.push({
          type: 'inventory_review',
          priority: 'low',
          action: 'Review inventory sources',
          reason: viewCheck.action,
          expectedImpact: 'Marginal viewability improvement'
        });
      }
    }
    
    // VCR optimization for video
    if (metrics.vcr && (campaign.channel === 'olv' || campaign.channel === 'ctv')) {
      const vcrBenchmark = domain.getVCRBenchmark(campaign.channel, '30s');
      if (vcrBenchmark && metrics.vcr < vcrBenchmark.min) {
        recommendations.push({
          type: 'creative_length',
          priority: 'medium',
          action: 'Consider shorter video creative',
          reason: `VCR ${metrics.vcr}% is below benchmark ${vcrBenchmark.min}%`,
          expectedImpact: 'Higher completion rates'
        });
      }
    }
  }
  
  return recommendations;
}

/**
 * Apply optimization (mock)
 */
async function applyOptimization(campaignId, recommendation) {
  const result = {
    campaignId,
    recommendation,
    applied: false,
    timestamp: new Date().toISOString()
  };
  
  // In production, this would actually apply the changes
  result.applied = true;
  result.message = 'Optimization applied successfully';
  
  return result;
}

module.exports = {
  name,
  description,
  getInfo,
  run,
  applyOptimization
};
