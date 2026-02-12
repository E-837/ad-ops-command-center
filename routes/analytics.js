/**
 * Analytics Routes
 * Performance metrics and analytics endpoints
 */

const express = require('express');
const router = express.Router();
const analytics = require('../services/analytics');
const benchmarks = require('../domain/benchmarks.json');
const connectors = require('../connectors');
const agents = require('../agents');

// Pacing metrics
router.get('/pacing', async (req, res) => {
  try {
    const pacing = await connectors.fetchAllPacing();
    res.json(pacing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI-generated insights
router.get('/insights', async (req, res) => {
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

    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spend trend analysis
router.get('/spend-trend', async (req, res) => {
  try {
    const result = await analytics.getSpendTrend(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CTR comparison across platforms
router.get('/ctr-comparison', async (req, res) => {
  try {
    const result = await analytics.getCTRComparison(req.query);

    // Add benchmarks to the response
    const dataWithBenchmarks = result.data.map(platform => ({
      ...platform,
      benchmark: benchmarks[platform.platform]?.ctr || null
    }));

    res.json({
      ...result,
      data: dataWithBenchmarks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conversion funnel analysis
router.get('/conversion-funnel', async (req, res) => {
  try {
    const result = await analytics.getConversionFunnel(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROAS by campaign
router.get('/roas-by-campaign', async (req, res) => {
  try {
    const result = await analytics.getROASByCampaign(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budget utilization metrics
router.get('/budget-utilization', async (req, res) => {
  try {
    const result = await analytics.getBudgetUtilization(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Performance summary dashboard
router.get('/performance-summary', async (req, res) => {
  try {
    const result = await analytics.getPerformanceSummary(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Platform comparison with benchmarks
router.get('/platform-comparison', async (req, res) => {
  try {
    const result = await analytics.getPlatformComparison(req.query);

    // Add benchmarks to platform data
    const platformsWithBenchmarks = result.platforms.map(platform => ({
      ...platform,
      benchmarks: benchmarks[platform.name] || {}
    }));

    res.json({
      ...result,
      platforms: platformsWithBenchmarks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOB breakdown analysis
router.get('/lob-breakdown', async (req, res) => {
  try {
    const result = await analytics.getLOBBreakdown(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Available LOB filter values
router.get('/lob-options', async (req, res) => {
  try {
    const result = await analytics.getLOBBreakdown(req.query);
    const lobs = [...new Set((result.data || []).map((item) => item.lob).filter(Boolean))].sort();
    res.json({ data: lobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Industry benchmarks
router.get('/benchmarks', (req, res) => {
  res.json(benchmarks);
});

module.exports = router;
