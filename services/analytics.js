/**
 * Analytics Service
 * Advanced analytics queries for cross-platform performance insights
 */

const knex = require('../database/db');
const logger = require('../utils/logger');

function parseFilters(filters = {}) {
  const result = {
    days: Number(filters.days) || 30,
    platforms: filters.platforms ? filters.platforms.split(',') : null,
    lobs: filters.lobs ? filters.lobs.split(',') : (filters.lob ? [filters.lob] : null),
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    limit: Number(filters.limit) || 10,
    campaignId: filters.campaignId || null
  };

  if (!result.startDate || !result.endDate) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - result.days);

    result.endDate = end.toISOString().split('T')[0];
    result.startDate = start.toISOString().split('T')[0];
  }

  return result;
}

function applyCampaignFilters(query, { platforms, lobs }) {
  if (platforms) query.whereIn('campaigns.platform', platforms);
  if (lobs) query.whereIn('campaigns.lob', lobs);
  return query;
}

async function getSpendTrend(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select(
        knex.raw('DATE(metrics.date) as date'),
        'campaigns.platform as platform'
      )
      .sum('metrics.spend as spend')
      .whereBetween('metrics.date', [startDate, endDate])
      .groupBy(knex.raw('DATE(metrics.date)'), 'campaigns.platform')
      .orderBy('date');

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;
    const dateMap = {};

    data.forEach((row) => {
      if (!dateMap[row.date]) dateMap[row.date] = { date: row.date, total: 0 };
      dateMap[row.date][row.platform] = row.spend;
      dateMap[row.date].total += row.spend;
    });

    const timeline = Object.values(dateMap);
    timeline.forEach((day, idx) => {
      if (idx >= 6) {
        const sum = timeline.slice(idx - 6, idx + 1).reduce((acc, d) => acc + d.total, 0);
        day.movingAverage = sum / 7;
      }
    });

    return { data: timeline, dateRange: { startDate, endDate } };
  } catch (err) {
    logger.error('Error fetching spend trend', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getCTRComparison(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select('campaigns.platform as platform')
      .sum('metrics.clicks as totalClicks')
      .sum('metrics.impressions as totalImpressions')
      .whereBetween('metrics.date', [startDate, endDate])
      .groupBy('campaigns.platform');

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;

    return {
      data: data.map((row) => ({
        platform: row.platform,
        ctr: row.totalImpressions > 0 ? (row.totalClicks / row.totalImpressions * 100) : 0,
        clicks: row.totalClicks,
        impressions: row.totalImpressions
      })),
      dateRange: { startDate, endDate }
    };
  } catch (err) {
    logger.error('Error fetching CTR comparison', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getConversionFunnel(filters = {}) {
  const { startDate, endDate, platforms, lobs, campaignId } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .sum('metrics.impressions as impressions')
      .sum('metrics.clicks as clicks')
      .sum('metrics.conversions as conversions')
      .sum('metrics.revenue as revenue')
      .whereBetween('metrics.date', [startDate, endDate]);

    query = applyCampaignFilters(query, { platforms, lobs });
    if (campaignId) query.where('metrics.campaignId', campaignId);

    const result = await query.first();

    const funnel = [
      { stage: 'Impressions', value: result.impressions || 0, dropoff: 0 },
      {
        stage: 'Clicks',
        value: result.clicks || 0,
        dropoff: result.impressions > 0 ? ((result.impressions - result.clicks) / result.impressions * 100) : 0
      },
      {
        stage: 'Conversions',
        value: result.conversions || 0,
        dropoff: result.clicks > 0 ? ((result.clicks - result.conversions) / result.clicks * 100) : 0
      },
      {
        stage: 'Revenue',
        value: result.revenue || 0,
        dropoff: result.conversions > 0 ? ((result.conversions - (result.revenue > 0 ? 1 : 0)) / result.conversions * 100) : 0
      }
    ];

    return {
      data: funnel,
      dateRange: { startDate, endDate },
      overallConversionRate: result.impressions > 0 ? (result.conversions / result.impressions * 100) : 0
    };
  } catch (err) {
    logger.error('Error fetching conversion funnel', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getROASByCampaign(filters = {}) {
  const { startDate, endDate, platforms, lobs, limit } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select('campaigns.id', 'campaigns.name', 'campaigns.platform', 'campaigns.lob')
      .sum('metrics.revenue as revenue')
      .sum('metrics.spend as spend')
      .whereBetween('metrics.date', [startDate, endDate])
      .where('metrics.spend', '>', 0)
      .groupBy('campaigns.id', 'campaigns.name', 'campaigns.platform', 'campaigns.lob')
      .orderBy(knex.raw('SUM(metrics.revenue) / SUM(metrics.spend)'), 'desc')
      .limit(limit);

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;

    return {
      data: data.map((row) => ({
        campaignId: row.id,
        campaignName: row.name,
        platform: row.platform,
        lob: row.lob,
        revenue: row.revenue || 0,
        spend: row.spend || 0,
        roas: row.spend > 0 ? (row.revenue / row.spend) : 0
      })),
      dateRange: { startDate, endDate }
    };
  } catch (err) {
    logger.error('Error fetching ROAS by campaign', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getBudgetUtilization(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('campaigns')
      .leftJoin('metrics', function() {
        this.on('campaigns.id', '=', 'metrics.campaignId').andOnBetween('metrics.date', [startDate, endDate]);
      })
      .select(
        'campaigns.platform',
        knex.raw('SUM(campaigns.budget) as allocated'),
        knex.raw('SUM(COALESCE(metrics.spend, 0)) as spent')
      )
      .where('campaigns.status', 'active')
      .groupBy('campaigns.platform');

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;

    return {
      data: data.map((row) => ({
        platform: row.platform,
        allocated: row.allocated || 0,
        spent: row.spent || 0,
        utilization: row.allocated > 0 ? (row.spent / row.allocated * 100) : 0,
        remaining: (row.allocated || 0) - (row.spent || 0)
      })),
      dateRange: { startDate, endDate }
    };
  } catch (err) {
    logger.error('Error fetching budget utilization', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getPerformanceSummary(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .sum('metrics.spend as totalSpend')
      .sum('metrics.impressions as totalImpressions')
      .sum('metrics.clicks as totalClicks')
      .sum('metrics.conversions as totalConversions')
      .sum('metrics.revenue as totalRevenue')
      .whereBetween('metrics.date', [startDate, endDate]);

    query = applyCampaignFilters(query, { platforms, lobs });

    const result = await query.first();

    const summary = {
      spend: result.totalSpend || 0,
      impressions: result.totalImpressions || 0,
      clicks: result.totalClicks || 0,
      conversions: result.totalConversions || 0,
      revenue: result.totalRevenue || 0,
      ctr: result.totalImpressions > 0 ? (result.totalClicks / result.totalImpressions * 100) : 0,
      cpc: result.totalClicks > 0 ? (result.totalSpend / result.totalClicks) : 0,
      cpa: result.totalConversions > 0 ? (result.totalSpend / result.totalConversions) : 0,
      roas: result.totalSpend > 0 ? (result.totalRevenue / result.totalSpend) : 0,
      conversionRate: result.totalClicks > 0 ? (result.totalConversions / result.totalClicks * 100) : 0
    };

    return { data: summary, dateRange: { startDate, endDate } };
  } catch (err) {
    logger.error('Error fetching performance summary', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getPlatformComparison(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select('campaigns.platform as platform')
      .sum('metrics.spend as spend')
      .sum('metrics.impressions as impressions')
      .sum('metrics.clicks as clicks')
      .sum('metrics.conversions as conversions')
      .sum('metrics.revenue as revenue')
      .whereBetween('metrics.date', [startDate, endDate])
      .groupBy('campaigns.platform');

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;

    const platformData = data.map((row) => ({
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

    const totals = platformData.reduce((acc, p) => ({
      spend: acc.spend + p.spend,
      impressions: acc.impressions + p.impressions,
      clicks: acc.clicks + p.clicks,
      conversions: acc.conversions + p.conversions,
      revenue: acc.revenue + p.revenue
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
    totals.cpc = totals.clicks > 0 ? (totals.spend / totals.clicks) : 0;
    totals.cpa = totals.conversions > 0 ? (totals.spend / totals.conversions) : 0;
    totals.roas = totals.spend > 0 ? (totals.revenue / totals.spend) : 0;

    return { platforms: platformData, totals, dateRange: { startDate, endDate } };
  } catch (err) {
    logger.error('Error fetching platform comparison', { error: err.message, stack: err.stack });
    throw err;
  }
}

async function getLOBBreakdown(filters = {}) {
  const { startDate, endDate, platforms, lobs } = parseFilters(filters);

  try {
    let query = knex('metrics')
      .join('campaigns', 'metrics.campaignId', 'campaigns.id')
      .select('campaigns.lob')
      .sum('metrics.spend as spend')
      .sum('metrics.impressions as impressions')
      .sum('metrics.clicks as clicks')
      .sum('metrics.conversions as conversions')
      .sum('metrics.revenue as revenue')
      .whereBetween('metrics.date', [startDate, endDate])
      .whereNotNull('campaigns.lob')
      .groupBy('campaigns.lob');

    query = applyCampaignFilters(query, { platforms, lobs });

    const data = await query;

    return {
      data: data.map((row) => ({
        lob: row.lob,
        spend: row.spend || 0,
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        conversions: row.conversions || 0,
        revenue: row.revenue || 0,
        ctr: row.impressions > 0 ? (row.clicks / row.impressions * 100) : 0,
        cpc: row.clicks > 0 ? (row.spend / row.clicks) : 0,
        cpa: row.conversions > 0 ? (row.spend / row.conversions) : 0,
        roas: row.spend > 0 ? (row.revenue / row.spend) : 0
      })),
      dateRange: { startDate, endDate }
    };
  } catch (err) {
    logger.error('Error fetching LOB breakdown', { error: err.message, stack: err.stack });
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
  getPlatformComparison,
  getLOBBreakdown
};
