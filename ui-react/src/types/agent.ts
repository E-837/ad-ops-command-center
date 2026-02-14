export type AgentStatus = 'active' | 'idle' | 'offline' | 'degraded';

export type Agent = {
  id: string;
  name: string;
  role: string;
  description?: string;
  model?: string;
  capabilities: string[];
  tools: string[];
  status?: AgentStatus;
  health?: number;
  lastActive?: string;
};

export type AgentMessage = {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  queryId?: string;
};

export type AgentQueryResponse = {
  query: string;
  primaryAgent: string;
  collaboratingAgents: string[];
  result: unknown;
  messages: AgentMessage[];
};

export type QueryHistoryItem = {
  id: string;
  query: string;
  createdAt: string;
  response: AgentQueryResponse;
};
