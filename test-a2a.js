/**
 * A2A Collaboration Test
 */

const agents = require('./agents');
const RouterAgent = require('./agents/router');
const bus = require('./agents/communication-bus');

async function run() {
  const routerAgent = new RouterAgent({ agentsRegistry: agents, routeFn: agents.routeQuery, bus });

  const query = 'Why is Meta CTR down 15% this week?';
  const context = {
    collaborative: true,
    maxMessages: 10,
    campaigns: [
      { id: 'c1', name: 'Meta Prospecting', dsp: 'dv360', channel: 'display', funnel: 'consideration', spend: 12000, impressions: 2200000, clicks: 1800, conversions: 72, startDate: '2026-02-01', endDate: '2026-02-28', budget: 50000, actualSpend: 12000, viewability: 61, preBidFiltering: true, blockedCategories: ['adult', 'gambling', 'weapons', 'drugs', 'hate_speech'] }
    ],
    creatives: [
      { id: 'cr1', name: 'Creative A', impressions: 900000, clicks: 450, status: 'active', ctr: 0.05 },
      { id: 'cr2', name: 'Creative B', impressions: 1100000, clicks: 330, status: 'active', ctr: 0.03 }
    ]
  };

  const response = await routerAgent.processQuery(query, context);

  console.log('--- A2A TEST RESULT ---');
  console.log(JSON.stringify({
    query: response.query,
    primaryAgent: response.primaryAgent,
    collaboratingAgents: response.collaboratingAgents,
    messagesCount: response.messages.length,
    sampleMessages: response.messages.slice(0, 4),
    result: response.result
  }, null, 2));

  const persisted = bus.getMessages({ limit: 20 });
  console.log(`\nPersisted messages in database/data/agent-messages.json: ${persisted.length}`);
}

run().catch((err) => {
  console.error('A2A test failed:', err.message);
  process.exit(1);
});
