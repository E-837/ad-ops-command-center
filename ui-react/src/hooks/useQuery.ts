import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentKeys, queryAgents, type QueryAgentsOptions } from '../api/agents';
import type { AgentMessage, AgentQueryResponse, QueryHistoryItem } from '../types/agent';

function appendHistory(old: QueryHistoryItem[] | undefined, response: AgentQueryResponse): QueryHistoryItem[] {
  const next: QueryHistoryItem[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: response.query,
      createdAt: new Date().toISOString(),
      response,
    },
    ...(old ?? []),
  ];

  return next.slice(0, 20);
}

function appendMessages(old: AgentMessage[] | undefined, messages: AgentMessage[]): AgentMessage[] {
  const merged = [...(old ?? []), ...messages];
  const uniq = new Map<string, AgentMessage>();
  merged.forEach((msg) => uniq.set(msg.id, msg));
  return [...uniq.values()].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function useQueryAgents() {
  const qc = useQueryClient();

  return useMutation<AgentQueryResponse, Error, { query: string; options?: QueryAgentsOptions }>({
    mutationFn: ({ query, options }) => queryAgents(query, options),
    onSuccess: (response) => {
      qc.setQueryData(agentKeys.history, (old: QueryHistoryItem[] | undefined) => appendHistory(old, response));
      qc.setQueryData([...agentKeys.messages, 200], (old: AgentMessage[] | undefined) => appendMessages(old, response.messages || []));
    },
  });
}
