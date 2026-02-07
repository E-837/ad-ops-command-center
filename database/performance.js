/**
 * Performance Database
 * Metrics storage and analytics
 */

const { load, save } = require('./init');

const STORE_NAME = 'performance';

/**
 * Record daily metrics
 */
function recordDailyMetrics(campaignId, date, metrics) {
  const performance = load(STORE_NAME, {});
  
  if (!performance[campaignId]) {
    performance[campaignId] = { daily: {} };
  }
  
  performance[campaignId].daily[date] = {
    ...metrics,
    recordedAt: new Date().toISOString()
  };
  
  save(STORE_NAME, performance);
  return true;
}

/**
 * Get metrics for date range
 */
function getMetrics(campaignId, startDate, endDate) {
  const performance = load(STORE_NAME, {});
  const campaignPerf = performance[campaignId];
  
  if (!campaignPerf || !campaignPerf.daily) {
    return [];
  }
  
  const results = [];
  for (const [date, metrics] of Object.entries(campaignPerf.daily)) {
    if ((!startDate || date >= startDate) && (!endDate || date <= endDate)) {
      results.push({ date, ...metrics });
    }
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get aggregated metrics
 */
function getAggregatedMetrics(campaignId, startDate, endDate) {
  const dailyMetrics = getMetrics(campaignId, startDate, endDate);
  
  if (dailyMetrics.length === 0) {
    return null;
  }
  
  const aggregated = {
    days: dailyMetrics.length,
    startDate: dailyMetrics[0].date,
    endDate: dailyMetrics[dailyMetrics.length - 1].date,
    totals: {},
    averages: {}
  };
  
  // Sum numeric fields
  const numericFields = ['spend', 'impressions', 'clicks', 'conversions'];
  for (const field of numericFields) {
    aggregated.totals[field] = dailyMetrics.reduce(
      (sum, m) => sum + (m[field] || 0), 0
    );
  }
  
  // Calculate derived metrics
  if (aggregated.totals.impressions > 0) {
    aggregated.averages.ctr = 
      (aggregated.totals.clicks / aggregated.totals.impressions) * 100;
    aggregated.averages.cpm = 
      (aggregated.totals.spend / aggregated.totals.impressions) * 1000;
  }
  
  if (aggregated.totals.conversions > 0) {
    aggregated.averages.cpa = 
      aggregated.totals.spend / aggregated.totals.conversions;
  }
  
  return aggregated;
}

/**
 * Get week-over-week comparison
 */
function getWoWComparison(campaignId) {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
  
  const thisWeek = getAggregatedMetrics(
    campaignId,
    startOfThisWeek.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );
  
  const lastWeek = getAggregatedMetrics(
    campaignId,
    startOfLastWeek.toISOString().split('T')[0],
    endOfLastWeek.toISOString().split('T')[0]
  );
  
  if (!thisWeek || !lastWeek) {
    return null;
  }
  
  const comparison = {
    thisWeek,
    lastWeek,
    changes: {}
  };
  
  // Calculate percentage changes
  for (const [key, current] of Object.entries(thisWeek.totals)) {
    const previous = lastWeek.totals[key];
    if (previous && previous !== 0) {
      comparison.changes[key] = ((current - previous) / previous) * 100;
    }
  }
  
  for (const [key, current] of Object.entries(thisWeek.averages)) {
    const previous = lastWeek.averages[key];
    if (previous && previous !== 0) {
      comparison.changes[key] = ((current - previous) / previous) * 100;
    }
  }
  
  return comparison;
}

/**
 * Get trend data for charting
 */
function getTrend(campaignId, metric, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const dailyMetrics = getMetrics(
    campaignId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
  
  return dailyMetrics.map(m => ({
    date: m.date,
    value: m[metric] || 0
  }));
}

/**
 * Get all-campaign summary
 */
function getAllCampaignsSummary(startDate, endDate) {
  const performance = load(STORE_NAME, {});
  const summary = {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    campaignCount: 0
  };
  
  for (const [campaignId, data] of Object.entries(performance)) {
    const agg = getAggregatedMetrics(campaignId, startDate, endDate);
    if (agg) {
      summary.totalSpend += agg.totals.spend || 0;
      summary.totalImpressions += agg.totals.impressions || 0;
      summary.totalClicks += agg.totals.clicks || 0;
      summary.totalConversions += agg.totals.conversions || 0;
      summary.campaignCount++;
    }
  }
  
  // Calculate averages
  if (summary.totalImpressions > 0) {
    summary.avgCTR = (summary.totalClicks / summary.totalImpressions) * 100;
    summary.avgCPM = (summary.totalSpend / summary.totalImpressions) * 1000;
  }
  
  if (summary.totalConversions > 0) {
    summary.avgCPA = summary.totalSpend / summary.totalConversions;
  }
  
  return summary;
}

module.exports = {
  recordDailyMetrics,
  getMetrics,
  getAggregatedMetrics,
  getWoWComparison,
  getTrend,
  getAllCampaignsSummary
};
