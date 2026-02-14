/**
 * Router Agent
 * Delegates queries and coordinates collaborative responses.
 */

const crypto = require('crypto');
const BaseAgent = require('./base-agent');
const communicationBus = require('./communication-bus');

class RouterAgent extends BaseAgent {
  constructor({ agentsRegistry, routeFn, bus = communicationBus } = {}) {
    super({
      id: 'router',
      name: 'Router',
      role: 'router',
      description: 'Delegates queries to the right specialist agent and coordinates collaboration',
      capabilities: ['query_routing', 'multi_agent_orchestration', 'result_aggregation'],
      tools: ['agents.registry', 'agents.communication-bus'],
      bus
    });

    this.agentsRegistry = agentsRegistry;
    this.routeFn = routeFn;
  }

  resolvePrimaryAgent(query) {
    if (typeof this.routeFn === 'function') return this.routeFn(query);
    return 'analyst';
  }

  resolveCollaborators(query, primaryAgentId) {
    const q = (query || '').toLowerCase();
    const collaborators = new Set();

    if (primaryAgentId === 'analyst') {
      if (q.includes('ctr') || q.includes('down') || q.includes('drop') || q.includes('performance')) {
        collaborators.add('trader');
        collaborators.add('creative-ops');
      }
      if (q.includes('brand') || q.includes('safety') || q.includes('compliance')) {
        collaborators.add('compliance');
      }
    }

    if (primaryAgentId === 'media-planner' && (q.includes('policy') || q.includes('safe'))) {
      collaborators.add('compliance');
    }

    return [...collaborators].filter((id) => id !== primaryAgentId);
  }

  getAgent(agentId) {
    return this.agentsRegistry?.getAgent?.(agentId) || null;
  }

  async processQuery(query, context = {}) {
    const queryId = context.queryId || crypto.randomUUID();
    const primaryAgentId = this.resolvePrimaryAgent(query);
    const primaryAgent = this.getAgent(primaryAgentId);

    if (!primaryAgent) {
      throw new Error(`Primary agent not found: ${primaryAgentId}`);
    }

    const collaborative = context.collaborative === true;
    const collaborators = collaborative ? this.resolveCollaborators(query, primaryAgentId) : [];

    this.bus.startSession(queryId, Number(context.maxMessages || 10));

    const messages = [];
    let primaryResult;

    try {
      primaryResult = await primaryAgent.processQuery(query, { ...context, queryId });

      const collaboratorResults = [];
      for (const collaboratorId of collaborators) {
        const collaborator = this.getAgent(collaboratorId);
        if (!collaborator) continue;

        const outbound = this.sendMessage(collaboratorId, {
          queryId,
          type: 'request',
          payload: { query, context: { ...context, queryId, primaryAgent: primaryAgentId } }
        });

        if (outbound?.message) messages.push(outbound.message);

        const result = await collaborator.processQuery(query, { ...context, queryId, primaryAgent: primaryAgentId });
        collaboratorResults.push({ agent: collaboratorId, result });

        const inbound = this.bus.send(collaboratorId, primaryAgentId, {
          queryId,
          type: 'response',
          payload: { collaborator: collaboratorId, result }
        });
        if (inbound?.message) messages.push(inbound.message);
      }

      return {
        query,
        primaryAgent: primaryAgentId,
        collaboratingAgents: collaborators,
        result: this.aggregateResults(primaryResult, collaboratorResults),
        messages
      };
    } finally {
      this.bus.endSession(queryId);
    }
  }

  aggregateResults(primaryResult, collaboratorResults) {
    if (!collaboratorResults?.length) return primaryResult;
    return {
      primary: primaryResult,
      collaborators: collaboratorResults,
      synthesis: 'Collaborative analysis generated from primary and supporting agent outputs.'
    };
  }
}

module.exports = RouterAgent;
