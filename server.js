/**
 * Digital Advertising Command - Server
 * Express server with API routes
 */

const express = require('express');
const path = require('path');
const db = require('./database/init');
const campaigns = require('./database/campaigns');
const projects = require('./database/projects');
const executions = require('./database/executions');
const events = require('./database/events');
const connectors = require('./connectors');
const agents = require('./agents');
const workflows = require('./workflows');
const domain = require('./domain');
const router = require('./router');
const eventTriggers = require('./events/triggers');
const cronJobs = require('./cron-jobs');
const sseManager = require('./events/sse-manager');
const eventBus = require('./events/bus');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'ui')));

// Initialize database
db.initialize();

// Initialize SSE integration with event bus
eventBus.setSSEManager(sseManager);

// --- API: Server-Sent Events (Real-time Updates) ---
app.get('/api/stream', (req, res) => {
  // Parse filters from query params
  const filters = {};
  
  if (req.query.eventTypes) {
    filters.eventTypes = req.query.eventTypes.split(',');
  }
  
  if (req.query.workflowId) {
    filters.workflowId = req.query.workflowId;
  }
  
  if (req.query.executionId) {
    filters.executionId = req.query.executionId;
  }
  
  if (req.query.projectId) {
    filters.projectId = req.query.projectId;
  }
  
  // Add client to SSE manager
  const clientId = sseManager.addClient(res, filters);
  
  // Log connection
  console.log(`[SSE] New client connected: ${clientId}`);
});

// SSE Stats endpoint
app.get('/api/stream/stats', (req, res) => {
  const stats = sseManager.getStats();
  res.json(stats);
});

// --- API: Campaigns ---
app.get('/api/campaigns', async (req, res) => {
  try {
    // First sync from connectors
    const allCampaigns = await connectors.fetchAllCampaigns();
    if (allCampaigns.campaigns.length > 0) {
      campaigns.syncFromConnectors(allCampaigns.campaigns);
    }
    
    // Then return with filters
    const result = campaigns.getAll(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.getById(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

app.post('/api/campaigns', (req, res) => {
  try {
    const campaign = campaigns.create(req.body);
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/campaigns/:id', (req, res) => {
  try {
    const campaign = campaigns.update(req.params.id, req.body);
    res.json(campaign);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// --- API: Pacing ---
app.get('/api/pacing', async (req, res) => {
  try {
    const pacing = await connectors.fetchAllPacing();
    res.json(pacing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Insights ---
app.get('/api/insights', async (req, res) => {
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

// --- API: Query (Natural Language) ---
app.post('/api/query', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    // Route query to appropriate agent
    const agentId = router.routeQuery(query);
    const agent = agents.getAgent(agentId);
    
    if (!agent) {
      return res.status(500).json({ error: 'No agent available' });
    }
    
    // Build context from connectors if needed
    const fullContext = { ...context };
    if (!fullContext.campaigns) {
      const allCampaigns = await connectors.fetchAllCampaigns();
      fullContext.campaigns = allCampaigns.campaigns;
    }
    
    const result = await agent.processQuery(query, fullContext);
    
    res.json({
      agent: agentId,
      agentName: agent.name,
      query,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Agents ---
app.get('/api/agents', (req, res) => {
  res.json(agents.getAllAgents());
});

app.get('/api/agents/:id', (req, res) => {
  const agent = agents.getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent.getInfo());
});

// --- API: Connectors ---
app.get('/api/connectors', (req, res) => {
  res.json(connectors.getAllConnectors());
});

app.get('/api/connectors/status', (req, res) => {
  res.json(connectors.getConnectorStatus());
});

// --- API: Workflows ---
app.get('/api/workflows', (req, res) => {
  // NEW: Return from registry with categorization
  const registry = workflows.getRegistry();
  const categories = registry.getCategories();
  const allWorkflows = registry.getAllWorkflows();
  
  res.json({
    workflows: allWorkflows,
    categories: categories,
    stats: registry.getStats()
  });
});

app.get('/api/workflows/:name', (req, res) => {
  const registry = workflows.getRegistry();
  const workflow = registry.getWorkflow(req.params.name);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json({
    id: workflow.id,
    ...workflow.meta
  });
});

app.post('/api/workflows/:name/run', async (req, res) => {
  try {
    const result = await workflows.runWorkflow(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/workflows/:name/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = executions.getRecentByWorkflow(req.params.name, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Projects ---
app.get('/api/projects', (req, res) => {
  try {
    const filter = {
      type: req.query.type,
      status: req.query.status,
      owner: req.query.owner,
      platform: req.query.platform,
      health: req.query.health,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const projectList = projects.list(filter);
    const stats = projects.getStats();
    
    res.json({
      projects: projectList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const project = projects.create(req.body);
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = projects.get(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Include execution details
    const projectExecutions = executions.list({ projectId: req.params.id });
    
    res.json({
      ...project,
      executionDetails: projectExecutions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/projects/:id', (req, res) => {
  try {
    const project = projects.update(req.params.id, req.body);
    res.json(project);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const result = projects.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id/executions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const projectExecutions = executions.getRecentByProject(req.params.id, limit);
    res.json(projectExecutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Executions ---
app.get('/api/executions', (req, res) => {
  try {
    const filter = {
      projectId: req.query.projectId,
      workflowId: req.query.workflowId,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const executionList = executions.list(filter);
    const stats = executions.getStats();
    
    res.json({
      executions: executionList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/executions/:id', (req, res) => {
  try {
    const execution = executions.get(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/executions/:id/cancel', (req, res) => {
  try {
    const execution = executions.get(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    if (execution.status !== 'queued' && execution.status !== 'running') {
      return res.status(400).json({ error: 'Can only cancel queued or running executions' });
    }
    
    executions.update(req.params.id, {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Events ---
app.get('/api/events', (req, res) => {
  try {
    const filter = {
      type: req.query.type,
      source: req.query.source,
      projectId: req.query.projectId,
      workflowId: req.query.workflowId,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const eventList = events.query(filter);
    const stats = events.getStats();
    
    res.json({
      events: eventList,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Domain ---
app.get('/api/domain/taxonomy', (req, res) => {
  res.json(domain.getFullTaxonomy());
});

app.get('/api/domain/glossary', (req, res) => {
  const { term, category } = req.query;
  
  if (term) {
    const definition = domain.define(term);
    if (!definition) {
      return res.status(404).json({ error: 'Term not found' });
    }
    return res.json(definition);
  }
  
  if (category) {
    return res.json(domain.getTermsByCategory(category));
  }
  
  res.json({
    categories: domain.CATEGORIES,
    termCount: domain.getTermCount ? domain.getTermCount() : Object.keys(domain.glossary).length
  });
});

app.get('/api/domain/benchmarks', (req, res) => {
  const { lob, channel, funnel } = req.query;
  
  if (lob && channel && funnel) {
    return res.json(domain.getCampaignBenchmarks(lob, channel, funnel));
  }
  
  res.json({
    cpm: domain.CPM_BENCHMARKS,
    ctr: domain.CTR_BENCHMARKS,
    cpa: domain.CPA_BENCHMARKS,
    roas: domain.ROAS_BENCHMARKS
  });
});

app.get('/api/domain/rules', (req, res) => {
  res.json(domain.getAllRules());
});

app.get('/api/domain/stats', (req, res) => {
  res.json(domain.getStats());
});

// --- API: Webhooks & Integrations ---
const WebhooksModel = require('./database/models/webhooks');
const webhooks = require('./integrations/webhooks');
const notifications = require('./integrations/notifications');

app.get('/api/webhooks', (req, res) => {
  try {
    const filter = {
      direction: req.query.direction,
      enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined
    };
    const webhookList = WebhooksModel.list(filter);
    res.json(webhookList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhooks', (req, res) => {
  try {
    const webhook = WebhooksModel.create(req.body);
    res.json(webhook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/webhooks/:id', (req, res) => {
  try {
    const webhook = WebhooksModel.get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/webhooks/:id', (req, res) => {
  try {
    const webhook = WebhooksModel.update(req.params.id, req.body);
    res.json(webhook);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/webhooks/:id', (req, res) => {
  try {
    const result = WebhooksModel.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/webhooks/:id/test', async (req, res) => {
  try {
    const webhook = WebhooksModel.get(req.params.id);
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

app.get('/api/webhooks/:id/deliveries', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const deliveries = WebhooksModel.getDeliveries(req.params.id, limit);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhooks/incoming/:id', async (req, res) => {
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

// --- API: Analytics ---
const analytics = require('./services/analytics');
const benchmarks = require('./domain/benchmarks.json');

app.get('/api/analytics/spend-trend', async (req, res) => {
  try {
    const result = await analytics.getSpendTrend(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/ctr-comparison', async (req, res) => {
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

app.get('/api/analytics/conversion-funnel', async (req, res) => {
  try {
    const result = await analytics.getConversionFunnel(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/roas-by-campaign', async (req, res) => {
  try {
    const result = await analytics.getROASByCampaign(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/budget-utilization', async (req, res) => {
  try {
    const result = await analytics.getBudgetUtilization(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/performance-summary', async (req, res) => {
  try {
    const result = await analytics.getPerformanceSummary(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/platform-comparison', async (req, res) => {
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

app.get('/api/analytics/benchmarks', (req, res) => {
  res.json(benchmarks);
});

// --- API: Recommendations ---
const recommendations = require('./services/recommendations');

app.get('/api/recommendations/campaign/:id', async (req, res) => {
  try {
    const result = await recommendations.getAllRecommendations(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/budget/:id', async (req, res) => {
  try {
    const result = await recommendations.getBudgetRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/bid/:id', async (req, res) => {
  try {
    const platform = req.query.platform || 'meta';
    const result = await recommendations.getBidRecommendation(parseInt(req.params.id), platform);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/targeting/:id', async (req, res) => {
  try {
    const result = await recommendations.getTargetingRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/creative/:id', async (req, res) => {
  try {
    const result = await recommendations.getCreativeRecommendation(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/platform', async (req, res) => {
  try {
    const totalBudget = parseFloat(req.query.budget) || 10000;
    const objectives = req.query.objectives ? JSON.parse(req.query.objectives) : {};
    const result = await recommendations.getPlatformRecommendation(totalBudget, objectives);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/priorities/:id', async (req, res) => {
  try {
    const result = await recommendations.getOptimizationPriorities(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recommendations/:id/apply', async (req, res) => {
  try {
    // This would trigger the actual application of recommendation
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Recommendation applied',
      recommendationId: req.params.id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: A/B Testing ---
const abTesting = require('./services/ab-testing');
const { abTests } = require('./database/models');

app.post('/api/ab-tests', async (req, res) => {
  try {
    const { campaignId, testType, variants, duration } = req.body;
    const test = await abTesting.createTest(campaignId, testType, variants, duration);
    res.json(test);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/ab-tests/:id', async (req, res) => {
  try {
    const test = await abTests.getById(parseInt(req.params.id));
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ab-tests/campaign/:campaignId', async (req, res) => {
  try {
    const status = req.query.status || null;
    const tests = await abTests.getByCampaign(parseInt(req.params.campaignId), status);
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ab-tests/:id/status', async (req, res) => {
  try {
    const status = await abTesting.getTestStatus(parseInt(req.params.id));
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ab-tests/:id/analyze', async (req, res) => {
  try {
    const result = await abTesting.analyzeTest(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ab-tests/:id/complete', async (req, res) => {
  try {
    const autoApply = req.body.autoApply || false;
    const result = await abTesting.declareWinner(parseInt(req.params.id), autoApply);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ab-tests/:id/cancel', async (req, res) => {
  try {
    const test = await abTests.cancel(parseInt(req.params.id));
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ab-tests', async (req, res) => {
  try {
    const running = await abTests.getRunning();
    res.json(running);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ab-tests/schedule/:campaignId', async (req, res) => {
  try {
    const tests = await abTesting.scheduleTests(parseInt(req.params.campaignId));
    res.json({ scheduled: tests.length, tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Predictions ---
const predictions = require('./services/predictions');

app.post('/api/predictions/performance', async (req, res) => {
  try {
    const { campaignId, proposedBudget } = req.body;
    const result = await predictions.predictPerformance(campaignId, proposedBudget);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/predictions/budget-allocation', async (req, res) => {
  try {
    const { totalBudget, platforms } = req.body;
    const result = await predictions.optimizeBudgetAllocation(totalBudget, platforms);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/predictions/trends/:campaignId', async (req, res) => {
  try {
    const result = await predictions.getTrendAnalysis(parseInt(req.params.campaignId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Health ---
app.get('/api/health', (req, res) => {
  // Get real connection status
  let connections = {};
  try {
    const apiClient = require('./connectors/api-client');
    connections = apiClient.getConnectionStatus();
  } catch (e) {
    connections = { error: e.message };
  }
  
  res.json({
    status: 'ok',
    name: 'Digital Advertising Command',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.getStats(),
    connections
  });
});

// --- API: Test Connector ---
app.get('/api/connectors/test/:name', async (req, res) => {
  const connectorName = req.params.name;
  
  try {
    const connector = connectors.getConnector(connectorName);
    
    if (!connector) {
      return res.json({ connected: false, error: 'Connector not found' });
    }
    
    // Check if connector has testConnection method
    if (typeof connector.testConnection === 'function') {
      const result = await connector.testConnection();
      return res.json(result);
    }
    
    // For connectors without testConnection, check if they have connected flag
    const info = connector.getInfo ? connector.getInfo() : {};
    
    if (info.connected !== undefined) {
      return res.json({ 
        connected: info.connected, 
        lastSync: connector.lastSync || null,
        name: info.name
      });
    }
    
    // Default: assume ready means connected for mock connectors
    return res.json({ 
      connected: false, 
      mock: true,
      message: 'Connector is in mock mode'
    });
    
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

// --- Static UI routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'dashboard.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'projects.html'));
});

app.get('/workflows', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'workflows.html'));
});

app.get('/workflow-detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'workflow-detail.html'));
});

// --- API: Templates ---
const fs = require('fs');

app.get('/api/templates', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'workflows', 'templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    const templates = files.map(file => {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      return JSON.parse(content);
    });
    
    // Filter by category if provided
    if (req.query.category) {
      const filtered = templates.filter(t => t.category === req.query.category);
      return res.json(filtered);
    }
    
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'workflows', 'templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      const template = JSON.parse(content);
      if (template.id === req.params.id) {
        return res.json(template);
      }
    }
    
    res.status(404).json({ error: 'Template not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates/:id/run', async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'workflows', 'templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    
    let template = null;
    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      const t = JSON.parse(content);
      if (t.id === req.params.id) {
        template = t;
        break;
      }
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const { values } = req.body;
    
    // Merge with defaults
    const input = { ...template.defaults, ...values };
    
    // Execute workflow
    const execution = await workflows.execute(template.workflow, input, {
      projectId: req.body.projectId,
      metadata: {
        templateId: template.id,
        templateName: template.name
      }
    });
    
    res.json({
      executionId: execution.id,
      status: execution.status,
      workflowId: template.workflow
    });
  } catch (err) {
    console.error('Template execution error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const template = req.body;
    
    // Validate template
    if (!template.id || !template.name || !template.workflow) {
      return res.status(400).json({ error: 'Missing required fields: id, name, workflow' });
    }
    
    // Save to custom templates directory
    const customDir = path.join(__dirname, 'workflows', 'templates', 'custom');
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
    
    const filePath = path.join(customDir, `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    // Only allow deleting custom templates
    const customDir = path.join(__dirname, 'workflows', 'templates', 'custom');
    const filePath = path.join(customDir, `${req.params.id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Template deleted' });
    } else {
      res.status(404).json({ error: 'Template not found or cannot be deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/campaigns', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'campaigns.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'reports.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'analytics.html'));
});

app.get('/integrations', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'integrations.html'));
});

// Legacy route redirect
app.get('/insights', (req, res) => {
  res.redirect('/reports');
});

app.get('/agents', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'agents.html'));
});

app.get('/query', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'query.html'));
});

app.get('/architecture', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'architecture.html'));
});

app.get('/connectors', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'connectors.html'));
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[ERROR] Unhandled rejection:', err);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎯 Digital Advertising Command v2.0.0`);
  console.log(`🚀 Server running at http://localhost:${PORT}\n`);
  console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`📁 Projects:     http://localhost:${PORT}/projects`);
  console.log(`⚡ Workflows:    http://localhost:${PORT}/workflows`);
  console.log(`📈 Campaigns:    http://localhost:${PORT}/campaigns`);
  console.log(`📊 Reports:      http://localhost:${PORT}/reports`);
  console.log(`🤖 Agents:       http://localhost:${PORT}/agents`);
  console.log(`🔌 Connectors:   http://localhost:${PORT}/connectors`);
  console.log(`🏗️  Architecture: http://localhost:${PORT}/architecture`);
  console.log(`💬 Query:        http://localhost:${PORT}/query`);
  console.log(`\n📡 API: http://localhost:${PORT}/api/`);
  
  // Initialize event triggers and cron jobs
  console.log('\n🔧 Initializing automation...');
  try {
    eventTriggers.initializeTriggers();
    eventTriggers.autoRegisterWorkflowTriggers();
    cronJobs.initializeCronJobs();
    cronJobs.autoRegisterWorkflowCrons();
    console.log('✅ Automation initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize automation:', error.message);
  }
});

server.on('error', (err) => {
  console.error('[ERROR] Server error:', err);
});

module.exports = app;
