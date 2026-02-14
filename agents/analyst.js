/** Analyst Agent */

const domain = require('../domain');
const BaseAgent = require('./base-agent');

class AnalystAgent extends BaseAgent {
  constructor() {
    super({
      id: 'analyst', name: 'Analyst', role: 'analyst',
      description: 'Analytics agent for performance reporting, trend analysis, and insight generation',
      model: 'claude-3-5-sonnet-20241022',
      capabilities: ['performance_reporting', 'trend_analysis', 'anomaly_detection', 'wow_comparison', 'insight_generation', 'benchmarking'],
      tools: ['connectors.ttd', 'connectors.dv360', 'connectors.amazon-dsp', 'domain.benchmarks', 'database.performance']
    });
  }

  generateWoWReport(currentWeek, previousWeek) {
    const metrics = ['spend', 'impressions', 'clicks', 'conversions', 'cpm', 'ctr', 'cpa', 'roas'];
    const report = { period: { current: currentWeek.period, previous: previousWeek.period }, summary: [], highlights: [], concerns: [], metrics: {} };
    for (const metric of metrics) {
      if (currentWeek[metric] === undefined || previousWeek[metric] === undefined) continue;
      const current = currentWeek[metric], previous = previousWeek[metric];
      const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      report.metrics[metric] = { current, previous, change: change.toFixed(1), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
      if (Math.abs(change) >= 10) (isPositiveChange(metric, change) ? report.highlights : report.concerns).push({ metric, change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`, current, previous });
    }
    report.summary.push(`Spend ${Number(report.metrics.spend?.change || 0) > 0 ? 'increased' : 'decreased'} by ${Math.abs(Number(report.metrics.spend?.change || 0))}% WoW`);
    return report;
  }

  detectAnomalies(metrics, historicalData) {
    const anomalies = [];
    for (const [metric, currentValue] of Object.entries(metrics)) {
      const historical = historicalData[metric] || [];
      if (historical.length < 7) continue;
      const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
      const variance = historical.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historical.length;
      const zScore = (currentValue - avg) / (Math.sqrt(variance) || 1);
      if (Math.abs(zScore) > 2) anomalies.push({ metric, currentValue, historicalAvg: avg.toFixed(2), zScore: zScore.toFixed(2), severity: Math.abs(zScore) > 3 ? 'critical' : 'warning' });
    }
    return anomalies;
  }

  generateInsights(campaigns) {
    const totals = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    for (const c of campaigns) {
      totals.spend += c.spend || 0; totals.impressions += c.impressions || 0; totals.clicks += c.clicks || 0; totals.conversions += c.conversions || 0;
    }
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    return [{ type: 'summary', title: 'Overall Performance', content: `Total spend: $${totals.spend.toLocaleString()}. CTR: ${ctr.toFixed(2)}%, CPM: $${cpm.toFixed(2)}` }];
  }

  benchmarkCampaign(campaign, metrics) {
    return domain.generateBenchmarkReport(metrics, campaign.lob, campaign.channel, campaign.funnel);
  }

  generateDailySummary(data) {
    return {
      date: new Date().toISOString().split('T')[0],
      metrics: { totalSpend: data.spend || 0, impressions: data.impressions || 0, clicks: data.clicks || 0, conversions: data.conversions || 0 },
      topPerformers: data.topCampaigns || [], alerts: data.alerts || []
    };
  }

  async processQuery(query, context = {}) {
    const q = query.toLowerCase();
    if (q.includes('wow') || q.includes('week over week') || q.includes('weekly')) return context.currentWeek && context.previousWeek ? this.generateWoWReport(context.currentWeek, context.previousWeek) : { message: 'Provide current and previous week data.', action: 'fetch_weekly_data' };
    if (q.includes('anomal') || q.includes('spike') || q.includes('drop')) return context.metrics && context.historical ? this.detectAnomalies(context.metrics, context.historical) : { message: 'Provide current metrics and historical data.', action: 'fetch_historical' };
    if (q.includes('insight') || q.includes('analysis') || q.includes('performance') || q.includes('ctr')) return context.campaigns ? this.generateInsights(context.campaigns) : { message: 'Provide campaign data.', action: 'fetch_campaigns' };
    if (q.includes('benchmark') || q.includes('compare')) return context.campaign && context.metrics ? this.benchmarkCampaign(context.campaign, context.metrics) : { message: 'Specify campaign to benchmark.', action: 'select_campaign' };
    return { message: 'I handle analytics and insights.', capabilities: this.capabilities };
  }
}

function isPositiveChange(metric, change) { return ['cpm', 'cpc', 'cpa', 'cpv'].includes(metric) ? change < 0 : change > 0; }

module.exports = new AnalystAgent();
