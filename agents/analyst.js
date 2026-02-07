/**
 * Analyst Agent
 * Reporting, insights, trend analysis, and anomaly detection
 */

const domain = require('../domain');

const name = 'Analyst';
const role = 'analyst';
const description = 'Analytics agent for performance reporting, trend analysis, and insight generation';
const model = 'claude-3-5-sonnet-20241022'; // Complex analysis required

const capabilities = [
  'performance_reporting',
  'trend_analysis',
  'anomaly_detection',
  'wow_comparison',
  'insight_generation',
  'benchmarking'
];

const tools = [
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp',
  'domain.benchmarks',
  'database.performance'
];

const systemPrompt = `You are the Analyst agent for Ad Ops Command Center.

Your role is to provide insights and analysis:
- Generate performance reports (daily, weekly, monthly)
- Detect anomalies in campaign performance
- Identify trends and patterns
- Compare performance week-over-week (WoW)
- Benchmark against industry standards
- Provide actionable recommendations

Key metrics you analyze:
- Spend and pacing
- CPM, CPC, CPA, ROAS
- CTR, VCR, Viewability
- Conversions and conversion rate
- Reach and frequency

You explain findings in clear, business-friendly language and always include actionable next steps.`;

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
 * Generate Week-over-Week report
 */
function generateWoWReport(currentWeek, previousWeek) {
  const metrics = ['spend', 'impressions', 'clicks', 'conversions', 'cpm', 'ctr', 'cpa', 'roas'];
  const report = {
    period: {
      current: currentWeek.period,
      previous: previousWeek.period
    },
    summary: [],
    highlights: [],
    concerns: [],
    metrics: {}
  };
  
  for (const metric of metrics) {
    if (currentWeek[metric] !== undefined && previousWeek[metric] !== undefined) {
      const current = currentWeek[metric];
      const previous = previousWeek[metric];
      const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      
      report.metrics[metric] = {
        current,
        previous,
        change: change.toFixed(1),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      };
      
      // Determine if change is positive or negative for this metric
      const isPositive = isPositiveChange(metric, change);
      
      if (Math.abs(change) >= 10) {
        const item = {
          metric,
          change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
          current,
          previous
        };
        
        if (isPositive) {
          report.highlights.push(item);
        } else {
          report.concerns.push(item);
        }
      }
    }
  }
  
  // Generate summary
  const spendChange = report.metrics.spend?.change || 0;
  const roasChange = report.metrics.roas?.change || 0;
  
  report.summary.push(`Spend ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange)}% WoW`);
  
  if (report.highlights.length > 0) {
    report.summary.push(`${report.highlights.length} positive metric movements`);
  }
  if (report.concerns.length > 0) {
    report.summary.push(`${report.concerns.length} metrics requiring attention`);
  }
  
  return report;
}

/**
 * Detect anomalies in metrics
 */
function detectAnomalies(metrics, historicalData) {
  const anomalies = [];
  
  // Calculate historical averages and std dev
  for (const [metric, currentValue] of Object.entries(metrics)) {
    const historical = historicalData[metric] || [];
    
    if (historical.length < 7) continue; // Need at least a week of data
    
    const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
    const variance = historical.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historical.length;
    const stdDev = Math.sqrt(variance);
    
    // Check if current value is more than 2 standard deviations from mean
    const zScore = (currentValue - avg) / (stdDev || 1);
    
    if (Math.abs(zScore) > 2) {
      anomalies.push({
        metric,
        currentValue,
        historicalAvg: avg.toFixed(2),
        zScore: zScore.toFixed(2),
        severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
        direction: zScore > 0 ? 'spike' : 'drop',
        message: `${metric} is ${Math.abs(zScore).toFixed(1)} standard deviations ${zScore > 0 ? 'above' : 'below'} average`
      });
    }
  }
  
  return anomalies;
}

/**
 * Generate performance insights
 */
function generateInsights(campaigns) {
  const insights = [];
  
  // Aggregate metrics
  const totals = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0
  };
  
  const byDSP = {};
  const byChannel = {};
  const byFunnel = {};
  
  for (const campaign of campaigns) {
    totals.spend += campaign.spend || 0;
    totals.impressions += campaign.impressions || 0;
    totals.clicks += campaign.clicks || 0;
    totals.conversions += campaign.conversions || 0;
    
    // By DSP
    byDSP[campaign.dsp] = byDSP[campaign.dsp] || { spend: 0, conversions: 0 };
    byDSP[campaign.dsp].spend += campaign.spend || 0;
    byDSP[campaign.dsp].conversions += campaign.conversions || 0;
    
    // By Channel
    byChannel[campaign.channel] = byChannel[campaign.channel] || { spend: 0, impressions: 0 };
    byChannel[campaign.channel].spend += campaign.spend || 0;
    byChannel[campaign.channel].impressions += campaign.impressions || 0;
    
    // By Funnel
    byFunnel[campaign.funnel] = byFunnel[campaign.funnel] || { spend: 0, conversions: 0 };
    byFunnel[campaign.funnel].spend += campaign.spend || 0;
    byFunnel[campaign.funnel].conversions += campaign.conversions || 0;
  }
  
  // Calculate overall metrics
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
  
  // Generate insights
  insights.push({
    type: 'summary',
    title: 'Overall Performance',
    content: `Total spend: $${totals.spend.toLocaleString()}. CTR: ${ctr.toFixed(2)}%, CPM: $${cpm.toFixed(2)}, CPA: $${cpa.toFixed(2)}`
  });
  
  // DSP efficiency insight
  const dspEfficiency = Object.entries(byDSP)
    .map(([dsp, data]) => ({
      dsp,
      cpa: data.conversions > 0 ? data.spend / data.conversions : Infinity
    }))
    .sort((a, b) => a.cpa - b.cpa);
  
  if (dspEfficiency.length > 1) {
    const best = dspEfficiency[0];
    const worst = dspEfficiency[dspEfficiency.length - 1];
    
    if (best.cpa < worst.cpa * 0.7) {
      insights.push({
        type: 'optimization',
        title: 'DSP Efficiency Gap',
        content: `${best.dsp} has ${((1 - best.cpa/worst.cpa) * 100).toFixed(0)}% lower CPA than ${worst.dsp}. Consider reallocating budget.`,
        action: `Shift 10-20% budget from ${worst.dsp} to ${best.dsp}`
      });
    }
  }
  
  // Channel performance insight
  for (const [channel, data] of Object.entries(byChannel)) {
    const channelCPM = data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0;
    const benchmark = domain.getCPMBenchmark(channel, 'awareness');
    
    if (benchmark && channelCPM < benchmark.min) {
      insights.push({
        type: 'positive',
        title: `${channel} Efficiency`,
        content: `${channel} CPM of $${channelCPM.toFixed(2)} is below benchmark minimum of $${benchmark.min}. Excellent value.`
      });
    } else if (benchmark && channelCPM > benchmark.max) {
      insights.push({
        type: 'concern',
        title: `${channel} Costs`,
        content: `${channel} CPM of $${channelCPM.toFixed(2)} exceeds benchmark maximum of $${benchmark.max}. Review inventory sources.`,
        action: 'Add bid caps or review targeting for efficiency'
      });
    }
  }
  
  return insights;
}

/**
 * Benchmark campaign against standards
 */
function benchmarkCampaign(campaign, metrics) {
  return domain.generateBenchmarkReport(
    metrics,
    campaign.lob,
    campaign.channel,
    campaign.funnel
  );
}

/**
 * Generate daily summary
 */
function generateDailySummary(data) {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    date: today,
    metrics: {
      totalSpend: data.spend || 0,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      conversions: data.conversions || 0,
      ctr: data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) + '%' : '0%',
      cpm: data.impressions > 0 ? '$' + ((data.spend / data.impressions) * 1000).toFixed(2) : '$0',
      cpa: data.conversions > 0 ? '$' + (data.spend / data.conversions).toFixed(2) : 'N/A'
    },
    topPerformers: data.topCampaigns || [],
    alerts: data.alerts || [],
    recommendations: generateDailyRecommendations(data)
  };
}

/**
 * Generate daily recommendations
 */
function generateDailyRecommendations(data) {
  const recommendations = [];
  
  if (data.pacingBehind && data.pacingBehind.length > 0) {
    recommendations.push({
      priority: 'high',
      action: `${data.pacingBehind.length} campaigns behind pacing - review and adjust bids`
    });
  }
  
  if (data.lowViewability && data.lowViewability.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: `${data.lowViewability.length} campaigns with low viewability - add pre-bid filters`
    });
  }
  
  if (data.endingSoon && data.endingSoon.length > 0) {
    recommendations.push({
      priority: 'high',
      action: `${data.endingSoon.length} campaigns ending this week - prepare wrap reports`
    });
  }
  
  return recommendations;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // WoW report query
  if (q.includes('wow') || q.includes('week over week') || q.includes('weekly')) {
    if (context.currentWeek && context.previousWeek) {
      return generateWoWReport(context.currentWeek, context.previousWeek);
    }
    return {
      message: 'I can generate a week-over-week report. Please provide current and previous week data.',
      action: 'fetch_weekly_data'
    };
  }
  
  // Anomaly query
  if (q.includes('anomal') || q.includes('unusual') || q.includes('spike') || q.includes('drop')) {
    if (context.metrics && context.historical) {
      return detectAnomalies(context.metrics, context.historical);
    }
    return {
      message: 'I can detect anomalies in your metrics. Please provide current metrics and historical data.',
      action: 'fetch_historical'
    };
  }
  
  // Insights query
  if (q.includes('insight') || q.includes('analysis') || q.includes('performance')) {
    if (context.campaigns) {
      return generateInsights(context.campaigns);
    }
    return {
      message: 'I can generate performance insights. Please provide campaign data.',
      action: 'fetch_campaigns'
    };
  }
  
  // Benchmark query
  if (q.includes('benchmark') || q.includes('compare')) {
    if (context.campaign && context.metrics) {
      return benchmarkCampaign(context.campaign, context.metrics);
    }
    return {
      message: 'I can benchmark your campaign against industry standards. Please specify which campaign.',
      action: 'select_campaign'
    };
  }
  
  return {
    message: 'I handle analytics and insights. Try asking about WoW performance, anomalies, benchmarks, or insights.',
    capabilities: capabilities
  };
}

// Helper function
function isPositiveChange(metric, change) {
  // For cost metrics, decrease is positive
  const costMetrics = ['cpm', 'cpc', 'cpa', 'cpv'];
  if (costMetrics.includes(metric)) {
    return change < 0;
  }
  // For performance metrics, increase is positive
  return change > 0;
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
  generateWoWReport,
  detectAnomalies,
  generateInsights,
  benchmarkCampaign,
  generateDailySummary,
  processQuery
};
