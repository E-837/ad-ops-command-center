import { apiGet, apiPost } from './client';
import type { Agent, AgentMessage, AgentQueryResponse } from '../types/agent';

export const agentKeys = {
  all: ['agents'] as const,
  detail: (id: string) => ['agents', id] as const,
  messages: ['agents', 'messages'] as const,
  history: ['agents', 'query-history'] as const,
};

export type QueryAgentsOptions = {
  context?: Record<string, unknown>;
  collaborative?: boolean;
  maxMessages?: number;
};

export async function getAgents(): Promise<Agent[]> {
  return apiGet<Agent[]>('/agents');
}

export async function getAgent(id: string): Promise<Agent> {
  return apiGet<Agent>(`/agents/${id}`);
}

export async function queryAgents(query: string, options: QueryAgentsOptions = {}): Promise<AgentQueryResponse> {
  return apiPost<AgentQueryResponse>('/agents/query', {
    query,
    context: options.context ?? {},
    collaborative: options.collaborative ?? true,
    maxMessages: options.maxMessages ?? 10,
  });
}

export async function getAgentMessages(limit = 100): Promise<AgentMessage[]> {
  const res = await apiGet<AgentMessage[] | { messages: AgentMessage[] }>(`/agents/messages?limit=${limit}`);
  return Array.isArray(res) ? res : (res.messages ?? []);
}
