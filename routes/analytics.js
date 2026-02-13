/**
 * Analytics Routes
 * Performance metrics and analytics endpoints
 */

const express = require('express');
const router = express.Router();
let analytics;
function getAnalyticsService() {
  if (!analytics) analytics = require('../services/analytics');
  return analytics;
}
const benchmarks = require('../domain/benchmarks.json');
const connectors = require('../connectors');
const agents = require('../agents');
const { success } = require('../utils/response');

// Pacing metrics
router.get('/pacing', async (req, res, next) => {
  try {
    const pacing = await connectors.fetchAllPacing();
    res.json(success(pacing));
  } catch (err) {
    next(err);
  }
});

// AI-generated insights
router.get('/insights', async (req, res, next) => {
  try {
    const allCampaigns = await connectors.fetchAllCampaigns({ status: 'live' });

    // Get metrics for each campaign
    const campaignsWithMetrics = [];
    for (const campaign of allCampaigns.campaigns) {
      try {
        const connector = connectors.getConnector(campaign.dsp);
        const metricsResult = await connector.getMetrics(campaign.id);
        campaignsWithMetrics.push({
          ...campaign,
          ...metricsResult.metrics
        });
      } catch (e) {
        campaignsWithMetrics.push(campaign);
      }
    }

    const analyst = agents.getAgent('analyst');
    const insights = analyst.generateInsights(campaignsWithMetrics);

    res.json(success(insights));
  } catch (err) {
    next(err);
  }
});

// Spend trend analysis
router.get('/spend-trend', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getSpendTrend(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// CTR comparison across platforms
router.get('/ctr-comparison', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getCTRComparison(req.query);

    // Add benchmarks to the response
    const dataWithBenchmarks = result.data.map(platform => ({
      ...platform,
      benchmark: benchmarks[platform.platform]?.ctr || null
    }));

    res.json(success({
      ...result,
      data: dataWithBenchmarks
    }));
  } catch (err) {
    next(err);
  }
});

// Conversion funnel analysis
router.get('/conversion-funnel', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getConversionFunnel(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// ROAS by campaign
router.get('/roas-by-campaign', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getROASByCampaign(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// Budget utilization metrics
router.get('/budget-utilization', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getBudgetUtilization(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// Performance summary dashboard
router.get('/performance-summary', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getPerformanceSummary(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// Platform comparison with benchmarks
router.get('/platform-comparison', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getPlatformComparison(req.query);

    // Add benchmarks to platform data
    const platformsWithBenchmarks = result.platforms.map(platform => ({
      ...platform,
      benchmarks: benchmarks[platform.name] || {}
    }));

    res.json(success({
      ...result,
      platforms: platformsWithBenchmarks
    }));
  } catch (err) {
    next(err);
  }
});

// LOB breakdown analysis
router.get('/lob-breakdown', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getLOBBreakdown(req.query);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// Available LOB filter values
router.get('/lob-options', async (req, res, next) => {
  try {
    const result = await getAnalyticsService().getLOBBreakdown(req.query);
    const lobs = [...new Set((result.data || []).map((item) => item.lob).filter(Boolean))].sort();
    res.json(success(lobs));
  } catch (err) {
    next(err);
  }
});

// Industry benchmarks
router.get('/benchmarks', (req, res) => {
  res.json(success(benchmarks));
});

module.exports = router;

