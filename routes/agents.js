/**
 * Agent Routes
 * AI agent management and natural language queries
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const agents = require('../agents');
const connectors = require('../connectors');
const RouterAgent = require('../agents/router');

const routerAgent = new RouterAgent({
  agentsRegistry: agents,
  routeFn: agents.routeQuery
});

// Get all agents
router.get('/', (req, res) => {
  res.json(agents.getAllAgents());
});

// Get persisted agent messages
router.get('/messages', (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const file = path.join(process.cwd(), 'database', 'data', 'agent-messages.json');
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    const messages = Array.isArray(parsed) ? parsed : [];

    return res.json(messages.slice(-Math.max(0, limit)));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get agent by ID
router.get('/:id', (req, res) => {
  const agent = agents.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  return res.json(agent.getInfo());
});

// POST /api/agents/query
router.post('/query', async (req, res) => {
  try {
    const { query, context = {}, collaborative = false, maxMessages = 10 } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query required' });
    }

    const fullContext = { ...context, collaborative, maxMessages };

    if (!fullContext.campaigns) {
      try {
        const allCampaigns = await connectors.fetchAllCampaigns();
        fullContext.campaigns = allCampaigns?.campaigns || [];
      } catch {
        fullContext.campaigns = [];
      }
    }

    const routed = await routerAgent.processQuery(query, fullContext);

    return res.json({
      query: routed.query,
      primaryAgent: routed.primaryAgent,
      collaboratingAgents: routed.collaboratingAgents || [],
      result: routed.result,
      messages: routed.messages || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
