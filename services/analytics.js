/**
 * Analytics Service
 * Advanced analytics queries for cross-platform performance insights
 */

const knex = require('../database/db');

/**
 * Parse filter parameters
 */
function parseFilters(filters = {}) {
  const result = {
    days: filters.days || 30,
    platforms: filters.platforms ? filters.platforms.split(',') : null,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    limit: filters.limit || 10,
    campaignId: filters.campaignId || null
  };

  // Calculate date range if not provided
  if (!result.startDate || !result.endDate) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - result.days);
    
    result.endDate = end.toISOString().split('T')[0];
    result.startDate = start.toISOString().split('T')[0];
  }

  return result;
}

/**
 * Get spend trend over time
 * Returns daily spend aggregated by platform
 */
async function getSpendTrend(filters = {}) {
  const { startDate, endDate, platforms } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .select(
        knex.raw('DATE(date) as date'),
        'platform'
      )
      .sum('spend as spend')
      .whereBetween('date', [startDate, endDate])
      .groupBy(knex.raw('DATE(date)'), 'platform')
      .orderBy('date');

    if (platforms) {
      query = query.whereIn('platform', platforms);
    }

    const data = await query;

    // Calculate total and 7-day moving average
    const dateMap = {};
    data.forEach(row => {
      if (!dateMap[row.date]) {
        dateMap[row.date] = { date: row.date, total: 0 };
      }
      dateMap[row.date][row.platform] = row.spend;
      dateMap[row.date].total += row.spend;
    });

    const timeline = Object.values(dateMap);
    
    // Calculate 7-day moving average
    timeline.forEach((day, idx) => {
      if (idx >= 6) {
        const sum = timeline.slice(idx - 6, idx + 1)
          .reduce((acc, d) => acc + d.total, 0);
        day.movingAverage = sum / 7;
      }
    });

    return {
      data: timeline,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching spend trend:', err);
    throw err;
  }
}

/**
 * Get CTR comparison by platform
 * Returns average CTR for each platform with benchmarks
 */
async function getCTRComparison(filters = {}) {
  const { startDate, endDate, platforms } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .select('platform')
      .sum('clicks as totalClicks')
      .sum('impressions as totalImpressions')
      .whereBetween('date', [startDate, endDate])
      .groupBy('platform');

    if (platforms) {
      query = query.whereIn('platform', platforms);
    }

    const data = await query;

    // Calculate CTR
    const results = data.map(row => ({
      platform: row.platform,
      ctr: row.totalImpressions > 0 
        ? (row.totalClicks / row.totalImpressions * 100) 
        : 0,
      clicks: row.totalClicks,
      impressions: row.totalImpressions
    }));

    return {
      data: results,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching CTR comparison:', err);
    throw err;
  }
}

/**
 * Get conversion funnel metrics
 * Returns multi-stage funnel with drop-off percentages
 */
async function getConversionFunnel(filters = {}) {
  const { startDate, endDate, platforms, campaignId } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .sum('impressions as impressions')
      .sum('clicks as clicks')
      .sum('conversions as conversions')
      .sum('revenue as revenue')
      .whereBetween('date', [startDate, endDate]);

    if (platforms) {
      query = query.whereIn('platform', platforms);
    }

    if (campaignId) {
      query = query.where('campaignId', campaignId);
    }

    const result = await query.first();

    const funnel = [
      { 
        stage: 'Impressions', 
        value: result.impressions || 0,
        dropoff: 0
      },
      { 
        stage: 'Clicks', 
        value: result.clicks || 0,
        dropoff: result.impressions > 0 
          ? ((result.impressions - result.clicks) / result.impressions * 100) 
          : 0
      },
      { 
        stage: 'Conversions', 
        value: result.conversions || 0,
        dropoff: result.clicks > 0 
          ? ((result.clicks - result.conversions) / result.clicks * 100) 
          : 0
      },
      { 
        stage: 'Revenue', 
        value: result.revenue || 0,
        dropoff: result.conversions > 0 
          ? ((result.conversions - (result.revenue > 0 ? 1 : 0)) / result.conversions * 100) 
          : 0
      }
    ];

    return {
      data: funnel,
      dateRange: { startDate, endDate },
      overallConversionRate: result.impressions > 0 
        ? (result.conversions / result.impressions * 100) 
        : 0
    };

  } catch (err) {
    console.error('Error fetching conversion funnel:', err);
    throw err;
  }
}

/**
 * Get top campaigns by ROAS
 * Returns campaigns sorted by revenue/spend ratio
 */
async function getROASByCampaign(filters = {}) {
  const { startDate, endDate, platforms, limit } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select('campaigns.id', 'campaigns.name', 'campaigns.platform')
      .sum('metrics.revenue as revenue')
      .sum('metrics.spend as spend')
      .whereBetween('metrics.date', [startDate, endDate])
      .where('metrics.spend', '>', 0)
      .groupBy('campaigns.id', 'campaigns.name', 'campaigns.platform')
      .orderBy(knex.raw('SUM(metrics.revenue) / SUM(metrics.spend)'), 'desc')
      .limit(limit);

    if (platforms) {
      query = query.whereIn('campaigns.platform', platforms);
    }

    const data = await query;

    const results = data.map(row => ({
      campaignId: row.id,
      campaignName: row.name,
      platform: row.platform,
      revenue: row.revenue || 0,
      spend: row.spend || 0,
      roas: row.spend > 0 ? (row.revenue / row.spend) : 0
    }));

    return {
      data: results,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching ROAS by campaign:', err);
    throw err;
  }
}

/**
 * Get budget utilization metrics
 * Returns allocated vs spent by platform/campaign
 */
async function getBudgetUtilization(filters = {}) {
  const { startDate, endDate, platforms } = parseFilters(filters);

  try {
    let query = knex('campaigns')
      .leftJoin('metrics', function() {
        this.on('campaigns.id', '=', 'metrics.campaignId')
          .andOnBetween('metrics.date', [startDate, endDate]);
      })
      .select(
        'campaigns.platform',
        knex.raw('SUM(campaigns.budget) as allocated'),
        knex.raw('SUM(COALESCE(metrics.spend, 0)) as spent')
      )
      .where('campaigns.status', 'active')
      .groupBy('campaigns.platform');

    if (platforms) {
      query = query.whereIn('campaigns.platform', platforms);
    }

    const data = await query;

    const results = data.map(row => ({
      platform: row.platform,
      allocated: row.allocated || 0,
      spent: row.spent || 0,
      utilization: row.allocated > 0 ? (row.spent / row.allocated * 100) : 0,
      remaining: (row.allocated || 0) - (row.spent || 0)
    }));

    return {
      data: results,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching budget utilization:', err);
    throw err;
  }
}

/**
 * Get performance summary
 * Returns overall KPIs across all platforms
 */
async function getPerformanceSummary(filters = {}) {
  const { startDate, endDate, platforms } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .sum('spend as totalSpend')
      .sum('impressions as totalImpressions')
      .sum('clicks as totalClicks')
      .sum('conversions as totalConversions')
      .sum('revenue as totalRevenue')
      .whereBetween('date', [startDate, endDate]);

    if (platforms) {
      query = query.whereIn('platform', platforms);
    }

    const result = await query.first();

    const summary = {
      spend: result.totalSpend || 0,
      impressions: result.totalImpressions || 0,
      clicks: result.totalClicks || 0,
      conversions: result.totalConversions || 0,
      revenue: result.totalRevenue || 0,
      ctr: result.totalImpressions > 0 
        ? (result.totalClicks / result.totalImpressions * 100) 
        : 0,
      cpc: result.totalClicks > 0 
        ? (result.totalSpend / result.totalClicks) 
        : 0,
      cpa: result.totalConversions > 0 
        ? (result.totalSpend / result.totalConversions) 
        : 0,
      roas: result.totalSpend > 0 
        ? (result.totalRevenue / result.totalSpend) 
        : 0,
      conversionRate: result.totalClicks > 0 
        ? (result.totalConversions / result.totalClicks * 100) 
        : 0
    };

    return {
      data: summary,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching performance summary:', err);
    throw err;
  }
}

/**
 * Get platform comparison
 * Returns comprehensive metrics for each platform
 */
async function getPlatformComparison(filters = {}) {
  const { startDate, endDate, platforms } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .select('platform')
      .sum('spend as spend')
      .sum('impressions as impressions')
      .sum('clicks as clicks')
      .sum('conversions as conversions')
      .sum('revenue as revenue')
      .whereBetween('date', [startDate, endDate])
      .groupBy('platform');

    if (platforms) {
      query = query.whereIn('platform', platforms);
    }

    const data = await query;

    const platformData = data.map(row => ({
      name: row.platform,
      spend: row.spend || 0,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      conversions: row.conversions || 0,
      revenue: row.revenue || 0,
      ctr: row.impressions > 0 ? (row.clicks / row.impressions * 100) : 0,
      cpc: row.clicks > 0 ? (row.spend / row.clicks) : 0,
      cpa: row.conversions > 0 ? (row.spend / row.conversions) : 0,
      roas: row.spend > 0 ? (row.revenue / row.spend) : 0
    }));

    // Calculate totals
    const totals = platformData.reduce((acc, platform) => ({
      spend: acc.spend + platform.spend,
      impressions: acc.impressions + platform.impressions,
      clicks: acc.clicks + platform.clicks,
      conversions: acc.conversions + platform.conversions,
      revenue: acc.revenue + platform.revenue
    }), {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    });

    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
    totals.cpc = totals.clicks > 0 ? (totals.spend / totals.clicks) : 0;
    totals.cpa = totals.conversions > 0 ? (totals.spend / totals.conversions) : 0;
    totals.roas = totals.spend > 0 ? (totals.revenue / totals.spend) : 0;

    return {
      platforms: platformData,
      totals,
      dateRange: { startDate, endDate }
    };

  } catch (err) {
    console.error('Error fetching platform comparison:', err);
    throw err;
  }
}

module.exports = {
  getSpendTrend,
  getCTRComparison,
  getConversionFunnel,
  getROASByCampaign,
  getBudgetUtilization,
  getPerformanceSummary,
  getPlatformComparison
};
