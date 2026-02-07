/**
 * Media Planner Agent
 * Strategy, budgets, channel mix, and campaign planning
 */

const domain = require('../domain');

const name = 'Media Planner';
const role = 'media-planner';
const description = 'Strategic planning agent for media budgets, channel allocation, and campaign strategy';
const model = 'claude-3-5-sonnet-20241022'; // Complex reasoning required

const capabilities = [
  'budget_planning',
  'channel_allocation',
  'campaign_strategy',
  'media_mix',
  'forecasting'
];

const tools = [
  'domain.taxonomy',
  'domain.benchmarks',
  'domain.rules',
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp'
];

const systemPrompt = `You are the Media Planner agent for Ad Ops Command Center.

Your role is to provide strategic guidance on:
- Campaign planning and strategy
- Budget allocation across channels and DSPs
- Media mix optimization
- Audience targeting recommendations
- Campaign timing and flighting

You have deep knowledge of:
- LOBs: Mobile, Wearables, Home, Education, Business
- Channels: Display, OLV, CTV, Audio, Demand Gen
- Funnel stages: Awareness, Consideration, Conversion
- DSPs: TTD, DV360, Amazon DSP

Key rules you follow:
- Demand Gen is only available on DV360
- Respect minimum budget thresholds per DSP
- Consider seasonality and market conditions
- Balance reach vs. efficiency based on funnel stage
- Recommend benchmarks based on channel/funnel/LOB combination

Always provide data-driven recommendations with clear rationale.`;

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
 * Create media plan
 */
function createMediaPlan(params) {
  const {
    objective,
    budget,
    lob,
    markets = ['us'],
    funnelStage = 'awareness',
    duration = 30 // days
  } = params;
  
  // Get benchmarks for this configuration
  const benchmarks = {};
  
  // Recommend channel mix based on funnel stage
  let channelMix;
  
  switch (funnelStage) {
    case 'awareness':
      channelMix = {
        ctv: 0.35,
        olv: 0.30,
        display: 0.20,
        audio: 0.15
      };
      break;
    case 'consideration':
      channelMix = {
        olv: 0.35,
        display: 0.30,
        'demand-gen': 0.20,
        ctv: 0.15
      };
      break;
    case 'conversion':
      channelMix = {
        display: 0.40,
        'demand-gen': 0.35,
        olv: 0.25
      };
      break;
    default:
      channelMix = { display: 0.40, olv: 0.30, ctv: 0.30 };
  }
  
  // Allocate budget
  const channelBudgets = {};
  for (const [channel, pct] of Object.entries(channelMix)) {
    channelBudgets[channel] = {
      budget: Math.round(budget * pct),
      percentage: pct * 100,
      benchmarks: domain.getCPMBenchmark(channel, funnelStage)
    };
  }
  
  // Recommend DSP allocation
  const dspAllocation = {
    dv360: 0.40, // Demand Gen access
    ttd: 0.35,   // Premium inventory
    'amazon-dsp': 0.25 // Retail/purchase intent
  };
  
  // Adjust if Demand Gen is in mix
  if (channelMix['demand-gen']) {
    dspAllocation.dv360 += 0.10;
    dspAllocation.ttd -= 0.05;
    dspAllocation['amazon-dsp'] -= 0.05;
  }
  
  return {
    objective,
    totalBudget: budget,
    duration,
    markets,
    lob,
    funnelStage,
    channelMix: channelBudgets,
    dspAllocation: Object.entries(dspAllocation).map(([dsp, pct]) => ({
      dsp,
      budget: Math.round(budget * pct),
      percentage: pct * 100
    })),
    recommendations: generateRecommendations(lob, funnelStage, budget),
    estimatedMetrics: estimateMetrics(channelBudgets, funnelStage)
  };
}

/**
 * Generate strategic recommendations
 */
function generateRecommendations(lob, funnelStage, budget) {
  const recommendations = [];
  
  // LOB-specific recommendations
  if (lob === 'mobile') {
    recommendations.push('Consider heavy mobile app install targeting for Galaxy S/Z launches');
    recommendations.push('YouTube and CTV recommended for flagship awareness');
  } else if (lob === 'home') {
    recommendations.push('Seasonal timing matters - align with home improvement seasons');
    recommendations.push('CTV/OTT ideal for reaching home decision-makers');
  }
  
  // Funnel recommendations
  if (funnelStage === 'awareness') {
    recommendations.push('Focus on reach and frequency over CTR optimization');
    recommendations.push('Consider brand lift studies to measure impact');
  } else if (funnelStage === 'conversion') {
    recommendations.push('Enable retargeting pools from consideration campaigns');
    recommendations.push('Use CPA bidding with sufficient conversion data');
  }
  
  // Budget recommendations
  if (budget < 50000) {
    recommendations.push('Limited budget - focus on 1-2 high-impact channels');
    recommendations.push('Consider TTD for efficiency at lower spend levels');
  } else if (budget > 500000) {
    recommendations.push('Budget supports multi-channel approach across all DSPs');
    recommendations.push('Consider programmatic guaranteed deals for premium inventory');
  }
  
  return recommendations;
}

/**
 * Estimate campaign metrics
 */
function estimateMetrics(channelBudgets, funnelStage) {
  let totalImpressions = 0;
  let totalClicks = 0;
  
  for (const [channel, data] of Object.entries(channelBudgets)) {
    const cpmBenchmark = domain.getCPMBenchmark(channel, funnelStage);
    const ctrBenchmark = domain.getCTRBenchmark(channel, funnelStage);
    
    if (cpmBenchmark && ctrBenchmark) {
      const impressions = (data.budget / cpmBenchmark.target) * 1000;
      const clicks = impressions * (ctrBenchmark.target / 100);
      
      totalImpressions += impressions;
      totalClicks += clicks;
    }
  }
  
  return {
    estimatedImpressions: Math.round(totalImpressions),
    estimatedClicks: Math.round(totalClicks),
    estimatedCTR: totalImpressions > 0 ? 
      ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : 'N/A',
    confidence: 'medium'
  };
}

/**
 * Analyze channel performance
 */
function analyzeChannelPerformance(metrics) {
  const analysis = [];
  
  for (const [channel, data] of Object.entries(metrics)) {
    const cpmBenchmark = domain.getCPMBenchmark(channel, 'awareness');
    const ctrBenchmark = domain.getCTRBenchmark(channel, 'awareness');
    
    if (cpmBenchmark && data.cpm) {
      const cpmEval = domain.evaluateCPM(data.cpm, channel, 'awareness');
      analysis.push({
        channel,
        metric: 'CPM',
        value: data.cpm,
        benchmark: cpmBenchmark.target,
        status: cpmEval.status
      });
    }
    
    if (ctrBenchmark && data.ctr) {
      const ctrEval = domain.evaluateMetric(data.ctr, ctrBenchmark);
      analysis.push({
        channel,
        metric: 'CTR',
        value: data.ctr,
        benchmark: ctrBenchmark.target,
        status: ctrEval.status
      });
    }
  }
  
  return analysis;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // Budget planning query
  if (q.includes('budget') && (q.includes('plan') || q.includes('allocate'))) {
    const budget = extractBudget(query) || 100000;
    const lob = extractLOB(query) || 'mobile';
    const funnel = extractFunnel(query) || 'awareness';
    
    return createMediaPlan({
      objective: 'Brand awareness',
      budget,
      lob,
      funnelStage: funnel
    });
  }
  
  // Channel recommendation query
  if (q.includes('channel') && (q.includes('recommend') || q.includes('best'))) {
    const funnel = extractFunnel(query) || 'awareness';
    return {
      recommendation: `For ${funnel} campaigns, recommended channel mix:`,
      channels: funnel === 'awareness' 
        ? ['CTV (35%)', 'OLV (30%)', 'Display (20%)', 'Audio (15%)']
        : funnel === 'consideration'
        ? ['OLV (35%)', 'Display (30%)', 'Demand Gen (20%)', 'CTV (15%)']
        : ['Display (40%)', 'Demand Gen (35%)', 'OLV (25%)']
    };
  }
  
  return {
    message: 'I can help with media planning. Try asking about budget allocation, channel recommendations, or campaign strategy.',
    capabilities: capabilities
  };
}

// Helper functions
function extractBudget(query) {
  const match = query.match(/\$?([\d,]+)k?/i);
  if (match) {
    let amount = parseInt(match[1].replace(',', ''));
    if (query.toLowerCase().includes('k')) amount *= 1000;
    return amount;
  }
  return null;
}

function extractLOB(query) {
  const q = query.toLowerCase();
  if (q.includes('mobile') || q.includes('phone') || q.includes('galaxy s')) return 'mobile';
  if (q.includes('wearable') || q.includes('watch')) return 'wearables';
  if (q.includes('home') || q.includes('tv') || q.includes('appliance')) return 'home';
  if (q.includes('education') || q.includes('school')) return 'education';
  if (q.includes('business') || q.includes('b2b') || q.includes('enterprise')) return 'business';
  return null;
}

function extractFunnel(query) {
  const q = query.toLowerCase();
  if (q.includes('awareness') || q.includes('brand')) return 'awareness';
  if (q.includes('consideration') || q.includes('research')) return 'consideration';
  if (q.includes('conversion') || q.includes('purchase') || q.includes('sale')) return 'conversion';
  return null;
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
  createMediaPlan,
  analyzeChannelPerformance,
  processQuery
};
