/** Media Planner Agent */

const domain = require('../domain');
const BaseAgent = require('./base-agent');

class MediaPlannerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'media-planner',
      name: 'Media Planner',
      role: 'media-planner',
      description: 'Strategic planning agent for media budgets, channel allocation, and campaign strategy',
      model: 'claude-opus-4-6',
      capabilities: ['budget_planning', 'channel_allocation', 'campaign_strategy', 'media_mix', 'forecasting'],
      tools: ['domain.taxonomy', 'domain.benchmarks', 'domain.rules', 'connectors.ttd', 'connectors.dv360', 'connectors.amazon-dsp']
    });
  }

  createMediaPlan(params) {
    const { objective, budget, lob, markets = ['us'], funnelStage = 'awareness', duration = 30 } = params;
    let channelMix;

    switch (funnelStage) {
      case 'awareness': channelMix = { ctv: 0.35, olv: 0.30, display: 0.20, audio: 0.15 }; break;
      case 'consideration': channelMix = { olv: 0.35, display: 0.30, 'demand-gen': 0.20, ctv: 0.15 }; break;
      case 'conversion': channelMix = { display: 0.40, 'demand-gen': 0.35, olv: 0.25 }; break;
      default: channelMix = { display: 0.40, olv: 0.30, ctv: 0.30 };
    }

    const channelBudgets = {};
    for (const [channel, pct] of Object.entries(channelMix)) {
      channelBudgets[channel] = {
        budget: Math.round(budget * pct),
        percentage: pct * 100,
        benchmarks: domain.getCPMBenchmark(channel, funnelStage)
      };
    }

    const dspAllocation = { dv360: 0.40, ttd: 0.35, 'amazon-dsp': 0.25 };
    if (channelMix['demand-gen']) {
      dspAllocation.dv360 += 0.10;
      dspAllocation.ttd -= 0.05;
      dspAllocation['amazon-dsp'] -= 0.05;
    }

    return {
      objective, totalBudget: budget, duration, markets, lob, funnelStage,
      channelMix: channelBudgets,
      dspAllocation: Object.entries(dspAllocation).map(([dsp, pct]) => ({ dsp, budget: Math.round(budget * pct), percentage: pct * 100 })),
      recommendations: this.generateRecommendations(lob, funnelStage, budget),
      estimatedMetrics: this.estimateMetrics(channelBudgets, funnelStage)
    };
  }

  generateRecommendations(lob, funnelStage, budget) {
    const recommendations = [];
    if (lob === 'mobile') recommendations.push('Consider heavy mobile app install targeting for Galaxy S/Z launches');
    if (lob === 'home') recommendations.push('Seasonal timing matters - align with home improvement seasons');
    if (funnelStage === 'awareness') recommendations.push('Focus on reach and frequency over CTR optimization');
    if (funnelStage === 'conversion') recommendations.push('Enable retargeting pools from consideration campaigns');
    if (budget < 50000) recommendations.push('Limited budget - focus on 1-2 high-impact channels');
    if (budget > 500000) recommendations.push('Budget supports multi-channel approach across all DSPs');
    return recommendations;
  }

  estimateMetrics(channelBudgets, funnelStage) {
    let totalImpressions = 0, totalClicks = 0;
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
      estimatedCTR: totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : 'N/A',
      confidence: 'medium'
    };
  }

  analyzeChannelPerformance(metrics) {
    const analysis = [];
    for (const [channel, data] of Object.entries(metrics)) {
      const cpmBenchmark = domain.getCPMBenchmark(channel, 'awareness');
      const ctrBenchmark = domain.getCTRBenchmark(channel, 'awareness');
      if (cpmBenchmark && data.cpm) analysis.push({ channel, metric: 'CPM', value: data.cpm, benchmark: cpmBenchmark.target, status: domain.evaluateCPM(data.cpm, channel, 'awareness').status });
      if (ctrBenchmark && data.ctr) analysis.push({ channel, metric: 'CTR', value: data.ctr, benchmark: ctrBenchmark.target, status: domain.evaluateMetric(data.ctr, ctrBenchmark).status });
    }
    return analysis;
  }

  async processQuery(query, context = {}) {
    const q = query.toLowerCase();
    if (q.includes('budget') && (q.includes('plan') || q.includes('allocate'))) {
      const budget = extractBudget(query) || 100000;
      return this.createMediaPlan({ objective: 'Brand awareness', budget, lob: extractLOB(query) || 'mobile', funnelStage: extractFunnel(query) || 'awareness' });
    }
    if (q.includes('channel') && (q.includes('recommend') || q.includes('best'))) {
      const funnel = extractFunnel(query) || 'awareness';
      return { recommendation: `For ${funnel} campaigns, recommended channel mix:`, channels: funnel === 'awareness' ? ['CTV (35%)', 'OLV (30%)', 'Display (20%)', 'Audio (15%)'] : funnel === 'consideration' ? ['OLV (35%)', 'Display (30%)', 'Demand Gen (20%)', 'CTV (15%)'] : ['Display (40%)', 'Demand Gen (35%)', 'OLV (25%)'] };
    }
    return { message: 'I can help with media planning. Try asking about budget allocation, channel recommendations, or campaign strategy.', capabilities: this.capabilities };
  }
}

function extractBudget(query) { const m = query.match(/\$?([\d,]+)k?/i); if (!m) return null; let amount = parseInt(m[1].replace(',', ''), 10); if (query.toLowerCase().includes('k')) amount *= 1000; return amount; }
function extractLOB(query) { const q = query.toLowerCase(); if (q.includes('mobile')) return 'mobile'; if (q.includes('wearable') || q.includes('watch')) return 'wearables'; if (q.includes('home')) return 'home'; if (q.includes('education')) return 'education'; if (q.includes('business') || q.includes('enterprise')) return 'business'; return null; }
function extractFunnel(query) { const q = query.toLowerCase(); if (q.includes('awareness') || q.includes('brand')) return 'awareness'; if (q.includes('consideration')) return 'consideration'; if (q.includes('conversion') || q.includes('purchase')) return 'conversion'; return null; }

module.exports = new MediaPlannerAgent();
