/**
 * Agent Routes
 * AI agent management and natural language queries
 */

const express = require('express');
const router = express.Router();
const agents = require('../agents');
const routerModule = require('../router');
const connectors = require('../connectors');

// Get all agents
router.get('/', (req, res) => {
  res.json(agents.getAllAgents());
});

// Get agent by ID
router.get('/:id', (req, res) => {
  const agent = agents.getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent.getInfo());
});

// Process natural language query
router.post('/query', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    // Route query to appropriate agent
    const agentId = routerModule.routeQuery(query);
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

module.exports = router;
