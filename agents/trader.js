/** Trader Agent */

const domain = require('../domain');
const BaseAgent = require('./base-agent');

class TraderAgent extends BaseAgent {
  constructor() {
    super({
      id: 'trader', name: 'Trader', role: 'trader',
      description: 'Execution agent for DSP operations, bidding strategies, and pacing management',
      model: 'gpt-5.3-codex',
      capabilities: ['campaign_activation', 'bid_management', 'pacing_control', 'flight_management', 'budget_reallocation'],
      tools: ['connectors.ttd', 'connectors.dv360', 'connectors.amazon-dsp', 'domain.rules', 'domain.benchmarks']
    });
  }

  checkPacing(campaigns) {
    const pacingReport = [];
    for (const campaign of campaigns) {
      const daysElapsed = calculateDaysElapsed(campaign.startDate);
      const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
      const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
      const pacingCheck = domain.checkPacing(campaign.actualSpend, expectedSpend, daysElapsed, totalDays);
      pacingReport.push({
        campaignId: campaign.id, campaignName: campaign.name, dsp: campaign.dsp, budget: campaign.budget,
        actualSpend: campaign.actualSpend, expectedSpend: Math.round(expectedSpend), remaining: campaign.budget - campaign.actualSpend,
        daysRemaining: totalDays - daysElapsed, dailyTarget: Math.round((campaign.budget - campaign.actualSpend) / Math.max(1, (totalDays - daysElapsed))),
        ...pacingCheck
      });
    }
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return pacingReport.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));
  }

  getBidRecommendations(campaign, metrics) {
    const recs = [];
    const daysElapsed = calculateDaysElapsed(campaign.startDate);
    const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
    const expectedSpend = (campaign.budget / totalDays) * daysElapsed;
    const pacingVariance = ((campaign.actualSpend - expectedSpend) / (expectedSpend || 1)) * 100;
    if (pacingVariance < -20) recs.push({ action: 'increase_bids', amount: '25-30%', reason: `Severely behind pacing (${pacingVariance.toFixed(1)}%).`, priority: 'high' });
    else if (pacingVariance < -10) recs.push({ action: 'increase_bids', amount: '10-15%', reason: `Behind pacing (${pacingVariance.toFixed(1)}%).`, priority: 'medium' });
    if (pacingVariance > 30) recs.push({ action: 'decrease_bids', amount: '20-25%', reason: `Significantly ahead (${pacingVariance.toFixed(1)}%).`, priority: 'high' });
    else if (pacingVariance > 15) recs.push({ action: 'decrease_bids', amount: '10-15%', reason: `Ahead of pacing (${pacingVariance.toFixed(1)}%).`, priority: 'medium' });
    if (metrics.ctr) {
      const ctrBenchmark = domain.getCTRBenchmark(campaign.channel, campaign.funnel);
      if (ctrBenchmark && metrics.ctr < ctrBenchmark.min) recs.push({ action: 'review_creative', reason: `CTR ${metrics.ctr}% below benchmark ${ctrBenchmark.min}%`, priority: 'medium' });
    }
    return recs;
  }

  createPacingPlan(campaign) {
    const daysElapsed = calculateDaysElapsed(campaign.startDate);
    const totalDays = calculateTotalDays(campaign.startDate, campaign.endDate);
    const daysRemaining = totalDays - daysElapsed;
    const remainingBudget = campaign.budget - campaign.actualSpend;
    const dailyTarget = remainingBudget / Math.max(1, daysRemaining);
    const currentDailySpend = campaign.actualSpend / Math.max(1, daysElapsed);
    const requiredIncrease = ((dailyTarget - currentDailySpend) / (currentDailySpend || 1)) * 100;
    return {
      campaign: campaign.name, currentDailySpend: Math.round(currentDailySpend), requiredDailySpend: Math.round(dailyTarget),
      daysRemaining, remainingBudget: Math.round(remainingBudget), suggestedBidChange: `${requiredIncrease > 0 ? '+' : ''}${requiredIncrease.toFixed(1)}%`
    };
  }

  validateActivation(campaign) {
    const validation = domain.validateCampaign(campaign);
    if (!campaign.creatives?.length) { validation.issues.push('No creatives assigned to campaign'); validation.valid = false; }
    if (!campaign.targeting) { validation.issues.push('No targeting configured'); validation.valid = false; }
    return validation;
  }

  getDSPSettings(dsp) {
    return {
      ttd: { name: 'The Trade Desk', minBudget: 10000 },
      dv360: { name: 'Display & Video 360', minBudget: 5000 },
      'amazon-dsp': { name: 'Amazon DSP', minBudget: 15000 }
    }[dsp] || null;
  }

  async processQuery(query, context = {}) {
    const q = query.toLowerCase();
    if (q.includes('pacing') || q.includes('behind') || q.includes('ahead')) return context.campaigns ? this.checkPacing(context.campaigns) : { message: 'I can check pacing status.', action: 'fetch_campaigns' };
    if (q.includes('bid') && (q.includes('adjust') || q.includes('recommend'))) return context.campaign && context.metrics ? this.getBidRecommendations(context.campaign, context.metrics) : { message: 'Please specify campaign for bid recommendations.', action: 'select_campaign' };
    if (q.includes('dsp') || q.includes('ttd') || q.includes('dv360') || q.includes('amazon')) {
      const dsp = q.includes('ttd') ? 'ttd' : q.includes('dv360') ? 'dv360' : q.includes('amazon') ? 'amazon-dsp' : null;
      return dsp ? this.getDSPSettings(dsp) : { dsps: ['ttd', 'dv360', 'amazon-dsp'].map((d) => this.getDSPSettings(d)) };
    }
    return { message: 'I handle DSP execution and optimization.', capabilities: this.capabilities };
  }
}

function calculateDaysElapsed(startDate) { return Math.max(1, Math.floor((Date.now() - new Date(startDate)) / 86400000)); }
function calculateTotalDays(startDate, endDate) { return Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / 86400000)); }

module.exports = new TraderAgent();
