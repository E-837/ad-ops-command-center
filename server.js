/**
 * Digital Advertising Command - Server
 * Express server with API routes
 */

const express = require('express');
const path = require('path');
const db = require('./database/init');
const campaigns = require('./database/campaigns');
const connectors = require('./connectors');
const agents = require('./agents');
const workflows = require('./workflows');
const domain = require('./domain');
const router = require('./router');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'ui')));

// Initialize database
db.initialize();

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
  res.json(workflows.getAllWorkflows());
});

app.post('/api/workflows/:name/run', async (req, res) => {
  try {
    const result = await workflows.runWorkflow(req.params.name, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

app.get('/campaigns', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'campaigns.html'));
});

app.get('/insights', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'insights.html'));
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
  console.log(`📋 Campaigns:    http://localhost:${PORT}/campaigns`);
  console.log(`💡 Insights:     http://localhost:${PORT}/insights`);
  console.log(`🤖 Agents:       http://localhost:${PORT}/agents`);
  console.log(`💬 Query:        http://localhost:${PORT}/query`);
  console.log(`🏗️  Architecture: http://localhost:${PORT}/architecture`);
  console.log(`🔌 Connectors:   http://localhost:${PORT}/connectors`);
  console.log(`\n📡 API: http://localhost:${PORT}/api/`);
});

server.on('error', (err) => {
  console.error('[ERROR] Server error:', err);
});

module.exports = app;
