import { useQuery } from '@tanstack/react-query';
import { agentKeys, getAgent, getAgentMessages, getAgents } from '../api/agents';

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.all,
    queryFn: getAgents,
    refetchInterval: 10000,
  });
}

export function useAgent(id?: string) {
  return useQuery({
    queryKey: agentKeys.detail(id || ''),
    queryFn: () => getAgent(id as string),
    enabled: Boolean(id),
  });
}

export function useAgentMessages(limit = 100) {
  return useQuery({
    queryKey: [...agentKeys.messages, limit],
    queryFn: () => getAgentMessages(limit),
    refetchInterval: 3000,
  });
}
