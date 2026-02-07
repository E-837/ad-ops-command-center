/**
 * Trader Agent
 * DSP execution, bidding, pacing, and campaign activation
 */

const domain = require('../domain');

const name = 'Trader';
const role = 'trader';
const description = 'Execution agent for DSP operations, bidding strategies, and pacing management';
const model = 'claude-3-5-haiku-20241022'; // Fast execution tasks

const capabilities = [
  'campaign_activation',
  'bid_management',
  'pacing_control',
  'flight_management',
  'budget_reallocation'
];

const tools = [
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp',
  'domain.rules',
  'domain.benchmarks'
];

const systemPrompt = `You are the Trader agent for Ad Ops Command Center.

Your role is to execute and optimize campaigns across DSPs:
- Activate and manage campaigns on TTD, DV360, Amazon DSP
- Monitor and adjust pacing to hit budget targets
- Optimize bids based on performance
- Manage flight dates and budget allocations
- Handle day-to-day tactical adjustments

Key pacing thresholds you monitor:
- Warning: ±10% from target
- Critical: ±20% from target
- Severe: ±30% from target (requires immediate action)

Bidding strategies by funnel:
- Awareness: CPM/vCPM optimization
- Consideration: CPC/CPCV optimization
- Conversion: CPA/ROAS optimization

Always check DSP-specific constraints and budget minimums before making changes.`;

/**
 * Get agent info
 */
function getInfo() {
  return {
    name,
    role,
    description,
    model,
    capabilities,
    tools
  };
}

/**
 * Check pacing across all campaigns
 */
function checkPacing(campaigns) {
  const pacingReport = [];
  
  for (const campaign of campaigns) {
    const daysElapsed = calculateDaysElapsed(campaign.startDate);
    const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
    const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
    
    const pacingCheck = domain.checkPacing(
      campaign.actualSpend,
      expectedSpend,
      daysElapsed,
      totalDays
    );
    
    pacingReport.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      dsp: campaign.dsp,
      budget: campaign.budget,
      actualSpend: campaign.actualSpend,
      expectedSpend: Math.round(expectedSpend),
      remaining: campaign.budget - campaign.actualSpend,
      daysRemaining: totalDays - daysElapsed,
      dailyTarget: Math.round((campaign.budget - campaign.actualSpend) / (totalDays - daysElapsed)),
      ...pacingCheck
    });
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  pacingReport.sort((a, b) => 
    (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  );
  
  return pacingReport;
}

/**
 * Get bid adjustment recommendations
 */
function getBidRecommendations(campaign, metrics) {
  const recommendations = [];
  
  // Check pacing
  const daysElapsed = calculateDaysElapsed(campaign.startDate);
  const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
  const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
  const pacingVariance = ((campaign.actualSpend - expectedSpend) / expectedSpend) * 100;
  
  // Behind pacing - need to increase spend
  if (pacingVariance < -20) {
    recommendations.push({
      action: 'increase_bids',
      amount: '25-30%',
      reason: `Severely behind pacing (${pacingVariance.toFixed(1)}%). Increase bids to accelerate spend.`,
      priority: 'high'
    });
    recommendations.push({
      action: 'expand_targeting',
      reason: 'Consider broadening targeting to increase available inventory.',
      priority: 'medium'
    });
  } else if (pacingVariance < -10) {
    recommendations.push({
      action: 'increase_bids',
      amount: '10-15%',
      reason: `Behind pacing (${pacingVariance.toFixed(1)}%). Modest bid increase recommended.`,
      priority: 'medium'
    });
  }
  
  // Ahead pacing - need to slow down
  if (pacingVariance > 30) {
    recommendations.push({
      action: 'decrease_bids',
      amount: '20-25%',
      reason: `Significantly ahead (${pacingVariance.toFixed(1)}%). Reduce bids to prevent early exhaustion.`,
      priority: 'high'
    });
  } else if (pacingVariance > 15) {
    recommendations.push({
      action: 'decrease_bids',
      amount: '10-15%',
      reason: `Ahead of pacing (${pacingVariance.toFixed(1)}%). Consider modest bid reduction.`,
      priority: 'medium'
    });
  }
  
  // Performance-based recommendations
  if (metrics.ctr) {
    const ctrBenchmark = domain.getCTRBenchmark(campaign.channel, campaign.funnel);
    if (ctrBenchmark && metrics.ctr < ctrBenchmark.min) {
      recommendations.push({
        action: 'review_creative',
        reason: `CTR ${metrics.ctr}% is below benchmark ${ctrBenchmark.min}%. Consider creative refresh.`,
        priority: 'medium'
      });
    }
  }
  
  if (metrics.viewability) {
    const viewabilityCheck = domain.checkViewability(metrics.viewability, campaign.channel);
    if (viewabilityCheck.status !== 'passing') {
      recommendations.push({
        action: 'add_viewability_filter',
        reason: viewabilityCheck.action,
        priority: viewabilityCheck.severity === 'critical' ? 'high' : 'medium'
      });
    }
  }
  
  return recommendations;
}

/**
 * Generate pacing adjustment plan
 */
function createPacingPlan(campaign, targetVariance = 0) {
  const daysElapsed = calculateDaysElapsed(campaign.startDate);
  const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
  const daysRemaining = totalDays - daysElapsed;
  
  const remainingBudget = campaign.budget - campaign.actualSpend;
  const dailyTarget = remainingBudget / daysRemaining;
  
  // Calculate required bid adjustment
  const currentDailySpend = campaign.actualSpend / daysElapsed;
  const requiredIncrease = ((dailyTarget - currentDailySpend) / currentDailySpend) * 100;
  
  return {
    campaign: campaign.name,
    currentDailySpend: Math.round(currentDailySpend),
    requiredDailySpend: Math.round(dailyTarget),
    daysRemaining,
    remainingBudget: Math.round(remainingBudget),
    suggestedBidChange: `${requiredIncrease > 0 ? '+' : ''}${requiredIncrease.toFixed(1)}%`,
    actions: [
      requiredIncrease > 20 ? 'Increase bids significantly' :
      requiredIncrease > 10 ? 'Moderate bid increase' :
      requiredIncrease < -20 ? 'Decrease bids significantly' :
      requiredIncrease < -10 ? 'Moderate bid decrease' :
      'Maintain current bids'
    ],
    estimatedCompletion: requiredIncrease < 30 && requiredIncrease > -30 ? 
      'On track' : 'At risk'
  };
}

/**
 * Validate campaign activation
 */
function validateActivation(campaign) {
  const validation = domain.validateCampaign(campaign);
  
  // Additional trader-specific checks
  const today = new Date();
  const startDate = new Date(campaign.startDate);
  
  if (startDate < today) {
    validation.warnings.push('Campaign start date is in the past');
  }
  
  if (!campaign.creatives || campaign.creatives.length === 0) {
    validation.issues.push('No creatives assigned to campaign');
    validation.valid = false;
  }
  
  if (!campaign.targeting) {
    validation.issues.push('No targeting configured');
    validation.valid = false;
  }
  
  return validation;
}

/**
 * Get DSP-specific settings
 */
function getDSPSettings(dsp) {
  const settings = {
    ttd: {
      name: 'The Trade Desk',
      minBudget: 10000,
      biddingOptions: ['CPM', 'CPC', 'CPA', 'ROAS'],
      features: ['Unified ID 2.0', 'Koa AI', 'Cross-device'],
      apiEndpoint: 'api.thetradedesk.com'
    },
    dv360: {
      name: 'Display & Video 360',
      minBudget: 5000,
      biddingOptions: ['CPM', 'vCPM', 'CPC', 'CPA', 'tCPA'],
      features: ['YouTube', 'Demand Gen', 'Google Audiences'],
      apiEndpoint: 'displayvideo.googleapis.com'
    },
    'amazon-dsp': {
      name: 'Amazon DSP',
      minBudget: 15000,
      biddingOptions: ['CPM', 'CPC'],
      features: ['Amazon Audiences', 'Retail Data', 'Twitch'],
      apiEndpoint: 'advertising-api.amazon.com'
    }
  };
  
  return settings[dsp] || null;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // Pacing query
  if (q.includes('pacing') || q.includes('behind') || q.includes('ahead')) {
    if (context.campaigns) {
      return checkPacing(context.campaigns);
    }
    return {
      message: 'I can check pacing status. Please provide campaign data or I\'ll pull from connected DSPs.',
      action: 'fetch_campaigns'
    };
  }
  
  // Bid adjustment query
  if (q.includes('bid') && (q.includes('adjust') || q.includes('recommend'))) {
    if (context.campaign && context.metrics) {
      return getBidRecommendations(context.campaign, context.metrics);
    }
    return {
      message: 'I can recommend bid adjustments. Please specify which campaign.',
      action: 'select_campaign'
    };
  }
  
  // DSP info query
  if (q.includes('dsp') || q.includes('ttd') || q.includes('dv360') || q.includes('amazon')) {
    const dsp = q.includes('ttd') ? 'ttd' :
                q.includes('dv360') ? 'dv360' :
                q.includes('amazon') ? 'amazon-dsp' : null;
    
    if (dsp) {
      return getDSPSettings(dsp);
    }
    return {
      dsps: ['ttd', 'dv360', 'amazon-dsp'].map(d => getDSPSettings(d))
    };
  }
  
  return {
    message: 'I handle DSP execution and optimization. Try asking about pacing, bid adjustments, or DSP settings.',
    capabilities: capabilities
  };
}

// Helper functions
function calculateDaysElapsed(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function calculateTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  getInfo,
  checkPacing,
  getBidRecommendations,
  createPacingPlan,
  validateActivation,
  getDSPSettings,
  processQuery
};
