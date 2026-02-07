/**
 * Week-over-Week Report Workflow
 * Weekly performance analysis
 */

const connectors = require('../connectors');
const analyst = require('../agents/analyst');

const name = 'WoW Report';
const description = 'Weekly performance comparison and trend analysis';

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    schedule: 'Mondays at 9 AM',
    estimatedDuration: '10 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params = {}) {
  const results = {
    workflowId: `wow-${Date.now()}`,
    timestamp: new Date().toISOString(),
    period: {
      current: getWeekRange(0),
      previous: getWeekRange(-1)
    },
    byDSP: {},
    overall: null,
    insights: []
  };
  
  // Fetch campaigns from all DSPs
  const allCampaigns = await connectors.fetchAllCampaigns({ status: 'live' });
  
  // Generate mock week data (in production, would fetch from performance DB)
  const currentWeek = generateWeekMetrics(allCampaigns.campaigns, 0);
  const previousWeek = generateWeekMetrics(allCampaigns.campaigns, -1);
  
  // Generate overall WoW report
  results.overall = analyst.generateWoWReport(currentWeek, previousWeek);
  
  // Generate by DSP
  for (const dsp of ['ttd', 'dv360', 'amazon-dsp']) {
    const dspCampaigns = allCampaigns.campaigns.filter(c => c.dsp === dsp);
    if (dspCampaigns.length > 0) {
      const currentDSP = generateWeekMetrics(dspCampaigns, 0);
      const previousDSP = generateWeekMetrics(dspCampaigns, -1);
      results.byDSP[dsp] = analyst.generateWoWReport(currentDSP, previousDSP);
    }
  }
  
  // Generate insights
  results.insights = generateInsights(results);
  
  return results;
}

/**
 * Generate week metrics (mock - would be from DB in production)
 */
function generateWeekMetrics(campaigns, weekOffset) {
  const baseMultiplier = weekOffset === 0 ? 1 : 0.9; // 10% growth assumption
  
  let spend = 0, impressions = 0, clicks = 0, conversions = 0;
  
  for (const campaign of campaigns) {
    const weeklyBudget = campaign.budget / 4; // Assume 4-week campaign
    spend += weeklyBudget * baseMultiplier;
    impressions += Math.round(weeklyBudget / 0.015 * 1000 * baseMultiplier); // $15 CPM
    clicks += Math.round(impressions * 0.002); // 0.2% CTR
    conversions += Math.round(clicks * 0.02); // 2% CVR
  }
  
  return {
    period: getWeekRange(weekOffset),
    spend: Math.round(spend),
    impressions: Math.round(impressions),
    clicks: Math.round(clicks),
    conversions: Math.round(conversions),
    cpm: impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : 0,
    ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0,
    cpa: conversions > 0 ? (spend / conversions).toFixed(2) : 0,
    roas: conversions > 0 ? ((conversions * 150) / spend).toFixed(2) : 0 // Assume $150 avg value
  };
}

/**
 * Get week date range
 */
function getWeekRange(weekOffset) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0]
  };
}

/**
 * Generate insights from WoW data
 */
function generateInsights(results) {
  const insights = [];
  const overall = results.overall;
  
  // Spend trend
  if (overall.metrics.spend) {
    const spendChange = parseFloat(overall.metrics.spend.change);
    insights.push({
      type: spendChange > 0 ? 'positive' : 'neutral',
      metric: 'Spend',
      message: `Spend ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}% WoW`
    });
  }
  
  // Efficiency trends
  if (overall.metrics.cpm) {
    const cpmChange = parseFloat(overall.metrics.cpm.change);
    if (cpmChange < -5) {
      insights.push({
        type: 'positive',
        metric: 'CPM',
        message: `CPM efficiency improved by ${Math.abs(cpmChange).toFixed(1)}%`
      });
    } else if (cpmChange > 10) {
      insights.push({
        type: 'concern',
        metric: 'CPM',
        message: `CPM increased by ${cpmChange.toFixed(1)}% - review inventory mix`
      });
    }
  }
  
  // Performance highlights
  if (overall.highlights.length > 0) {
    insights.push({
      type: 'highlight',
      message: `${overall.highlights.length} metrics showing strong improvement`
    });
  }
  
  // DSP comparison
  const dspPerformance = Object.entries(results.byDSP).map(([dsp, data]) => ({
    dsp,
    spendChange: parseFloat(data.metrics.spend?.change || 0)
  }));
  
  if (dspPerformance.length > 1) {
    dspPerformance.sort((a, b) => b.spendChange - a.spendChange);
    insights.push({
      type: 'comparison',
      message: `${dspPerformance[0].dsp.toUpperCase()} showing strongest growth at ${dspPerformance[0].spendChange.toFixed(1)}% WoW`
    });
  }
  
  return insights;
}

module.exports = {
  name,
  description,
  getInfo,
  run
};
