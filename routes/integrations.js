/**
 * Integration Routes
 * Webhooks, notifications, and external integrations
 */

const express = require('express');
const router = express.Router();
const webhooks = require('../integrations/webhooks');
const notifications = require('../integrations/notifications');

let WebhooksModel;
let recommendations;
let abTesting;
let predictions;
let abTests;

const getWebhooksModel = () => (WebhooksModel ||= require('../database/models/webhooks'));
const getRecommendations = () => (recommendations ||= require('../services/recommendations'));
const getABTesting = () => (abTesting ||= require('../services/ab-testing'));
const getPredictions = () => (predictions ||= require('../services/predictions'));
const getAbTests = () => {
  if (!abTests) ({ abTests } = require('../database/models'));
  return abTests;
};

// --- Webhooks ---
router.get('/webhooks', (req, res) => {
  try {
    const filter = {
      direction: req.query.direction,
      enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined
    };
    const webhookList = getWebhooksModel().list(filter);
    res.json(webhookList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks', (req, res) => {
  try {
    const webhook = getWebhooksModel().create(req.body);
    res.json(webhook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/webhooks/:id', (req, res) => {
  try {
    const webhook = getWebhooksModel().get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/webhooks/:id', (req, res) => {
  try {
    const webhook = getWebhooksModel().update(req.params.id, req.body);
    res.json(webhook);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/webhooks/:id', (req, res) => {
  try {
    const result = getWebhooksModel().delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/webhooks/:id/test', async (req, res) => {
  try {
    const webhook = getWebhooksModel().get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const result = await webhooks.sendToWebhook(webhook.id, 'test', {
      message: 'Test webhook delivery',
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/webhooks/:id/deliveries', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const deliveries = getWebhooksModel().getDeliveries(req.params.id, limit);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks/incoming/:id', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const result = await webhooks.handleIncomingWebhook(req.params.id, req.body, signature);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Recommendations ---
router.get('/recommendations/campaign/:id', async (req, res) => {
  try {
    const result = await getRecommendations().getAllRecommendations(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/budget/:id', async (req, res) => {
  try {
    const result = await getRecommendations().getBudgetRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/bid/:id', async (req, res) => {
  try {
    const platform = req.query.platform || 'meta';
    const result = await getRecommendations().getBidRecommendation(parseInt(req.params.id), platform);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/targeting/:id', async (req, res) => {
  try {
    const result = await getRecommendations().getTargetingRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/creative/:id', async (req, res) => {
  try {
    const result = await getRecommendations().getCreativeRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/platform', async (req, res) => {
  try {
    const totalBudget = parseFloat(req.query.budget) || 10000;
    const objectives = req.query.objectives ? JSON.parse(req.query.objectives) : {};
    const result = await getRecommendations().getPlatformRecommendation(totalBudget, objectives);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/priorities/:id', async (req, res) => {
  try {
    const result = await getRecommendations().getOptimizationPriorities(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/:id/apply', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Recommendation applied',
      recommendationId: req.params.id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- A/B Testing ---
router.post('/ab-tests', async (req, res) => {
  try {
    const { campaignId, testType, variants, duration } = req.body;
    const test = await getABTesting().createTest(campaignId, testType, variants, duration);
    res.json(test);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ab-tests/:id', async (req, res) => {
  try {
    const test = await getAbTests().getById(parseInt(req.params.id));
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ab-tests/campaign/:campaignId', async (req, res) => {
  try {
    const status = req.query.status || null;
    const tests = await getAbTests().getByCampaign(parseInt(req.params.campaignId), status);
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ab-tests/:id/status', async (req, res) => {
  try {
    const status = await getABTesting().getTestStatus(parseInt(req.params.id));
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ab-tests/:id/analyze', async (req, res) => {
  try {
    const result = await getABTesting().analyzeTest(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ab-tests/:id/complete', async (req, res) => {
  try {
    const autoApply = req.body.autoApply || false;
    const result = await getABTesting().declareWinner(parseInt(req.params.id), autoApply);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ab-tests/:id/cancel', async (req, res) => {
  try {
    const test = await getAbTests().cancel(parseInt(req.params.id));
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ab-tests', async (req, res) => {
  try {
    const running = await getAbTests().getRunning();
    res.json(running);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ab-tests/schedule/:campaignId', async (req, res) => {
  try {
    const tests = await getABTesting().scheduleTests(parseInt(req.params.campaignId));
    res.json({ scheduled: tests.length, tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Predictions ---
router.post('/predictions/performance', async (req, res) => {
  try {
    const { campaignId, proposedBudget } = req.body;
    const result = await getPredictions().predictPerformance(campaignId, proposedBudget);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/predictions/budget-allocation', async (req, res) => {
  try {
    const { totalBudget, platforms } = req.body;
    const result = await getPredictions().optimizeBudgetAllocation(totalBudget, platforms);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/predictions/trends/:campaignId', async (req, res) => {
  try {
    const result = await getPredictions().getTrendAnalysis(parseInt(req.params.campaignId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

