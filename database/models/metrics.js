/**
 * Metrics Model - NEW
 * Time-series campaign metrics
 */

const db = require('../db');

/**
 * Record metrics for a campaign on a specific date
 */
async function recordMetrics(campaignId, date, metricsData) {
  // Check if metrics already exist for this campaign/date
  const existing = await getMetrics(campaignId, date, date);
  
  const metrics = {
    campaignId,
    date,
    impressions: metricsData.impressions || 0,
    clicks: metricsData.clicks || 0,
    conversions: metricsData.conversions || 0,
    spend: metricsData.spend || 0,
    revenue: metricsData.revenue || 0,
    metadata: JSON.stringify(metricsData.metadata || {}),
    syncedAt: new Date().toISOString()
  };
  
  // Calculate derived metrics
  if (metrics.impressions > 0) {
    metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
  }
  if (metrics.clicks > 0) {
    metrics.cpc = metrics.spend / metrics.clicks;
  }
  if (metrics.conversions > 0) {
    metrics.cpa = metrics.spend / metrics.conversions;
  }
  if (metrics.spend > 0) {
    metrics.roas = metrics.revenue / metrics.spend;
  }
  
  if (existing.length > 0) {
    // Update existing record
    await db('metrics')
      .where({ campaignId, date })
      .update(metrics);
  } else {
    // Insert new record
    await db('metrics').insert(metrics);
  }
  
  const result = await getMetrics(campaignId, date, date);
  return result[0];
}

/**
 * Bulk record metrics (for multiple days)
 */
async function recordBulkMetrics(campaignId, metricsArray) {
  const results = [];
  
  for (const item of metricsArray) {
    const result = await recordMetrics(campaignId, item.date, item);
    results.push(result);
  }
  
  return results;
}

/**
 * Get metrics for a campaign in a date range
 */
async function getMetrics(campaignId, startDate, endDate) {
  let query = db('metrics')
    .where({ campaignId })
    .orderBy('date', 'asc');
  
  if (startDate) {
    query = query.where('date', '>=', startDate);
  }
  
  if (endDate) {
    query = query.where('date', '<=', endDate);
  }
  
  const metrics = await query;
  return metrics.map(deserializeMetrics);
}

/**
 * Get latest metrics for a campaign
 */
async function getLatest(campaignId, limit = 30) {
  const metrics = await db('metrics')
    .where({ campaignId })
    .orderBy('date', 'desc')
    .limit(limit);
  
  return metrics.map(deserializeMetrics).reverse(); // Return in chronological order
}

/**
 * Aggregate metrics across multiple campaigns
 */
async function aggregate(filter = {}) {
  let query = db('metrics');
  
  // Filter by campaign IDs
  if (filter.campaignIds && filter.campaignIds.length > 0) {
    query = query.whereIn('campaignId', filter.campaignIds);
  }
  
  // Filter by date range
  if (filter.startDate) {
    query = query.where('date', '>=', filter.startDate);
  }
  
  if (filter.endDate) {
    query = query.where('date', '<=', filter.endDate);
  }
  
  const metrics = await query;
  
  if (metrics.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgCpa: 0,
      avgRoas: 0,
      recordCount: 0
    };
  }
  
  const totals = metrics.reduce((acc, m) => {
    acc.impressions += m.impressions || 0;
    acc.clicks += m.clicks || 0;
    acc.conversions += m.conversions || 0;
    acc.spend += parseFloat(m.spend) || 0;
    acc.revenue += parseFloat(m.revenue) || 0;
    return acc;
  }, {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    revenue: 0
  });
  
  return {
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalConversions: totals.conversions,
    totalSpend: totals.spend,
    totalRevenue: totals.revenue,
    avgCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    avgCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    avgCpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    avgRoas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    recordCount: metrics.length
  };
}

/**
 * Aggregate by platform
 */
async function aggregateByPlatform(filter = {}) {
  // First get campaigns grouped by platform
  let campaignsQuery = db('campaigns').select('platform', 'id');
  
  if (filter.platform) {
    campaignsQuery = campaignsQuery.where('platform', filter.platform);
  }
  
  const campaigns = await campaignsQuery;
  
  // Group campaigns by platform
  const campaignsByPlatform = campaigns.reduce((acc, c) => {
    if (!acc[c.platform]) acc[c.platform] = [];
    acc[c.platform].push(c.id);
    return acc;
  }, {});
  
  // Aggregate metrics for each platform
  const results = {};
  
  for (const [platform, campaignIds] of Object.entries(campaignsByPlatform)) {
    results[platform] = await aggregate({
      ...filter,
      campaignIds
    });
  }
  
  return results;
}

/**
 * Get top performing campaigns by metric
 */
async function getTopPerformers(metric = 'roas', limit = 10, filter = {}) {
  let query = db('metrics')
    .select('campaignId')
    .avg(`${metric} as avgMetric`)
    .groupBy('campaignId')
    .orderBy('avgMetric', 'desc')
    .limit(limit);
  
  if (filter.startDate) {
    query = query.where('date', '>=', filter.startDate);
  }
  
  if (filter.endDate) {
    query = query.where('date', '<=', filter.endDate);
  }
  
  const results = await query;
  
  // Enrich with campaign details
  const enriched = await Promise.all(
    results.map(async (r) => {
      const campaign = await db('campaigns').where('id', r.campaignId).first();
      return {
        campaignId: r.campaignId,
        campaignName: campaign?.name,
        platform: campaign?.platform,
        avgMetric: parseFloat(r.avgMetric),
        metric
      };
    })
  );
  
  return enriched;
}

/**
 * Delete metrics for a campaign
 */
async function deleteMetrics(campaignId) {
  const count = await db('metrics')
    .where({ campaignId })
    .del();
  
  return { success: true, deletedCount: count };
}

/**
 * Delete old metrics (cleanup)
 */
async function cleanupOldMetrics(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const count = await db('metrics')
    .where('date', '<', cutoffStr)
    .del();
  
  return { success: true, deletedCount: count };
}

/**
 * Helper: Deserialize JSON fields
 */
function deserializeMetrics(metrics) {
  return {
    ...metrics,
    metadata: typeof metrics.metadata === 'string' ? JSON.parse(metrics.metadata) : metrics.metadata
  };
}

module.exports = {
  recordMetrics,
  recordBulkMetrics,
  getMetrics,
  getLatest,
  aggregate,
  aggregateByPlatform,
  getTopPerformers,
  delete: deleteMetrics,
  cleanupOldMetrics
};
