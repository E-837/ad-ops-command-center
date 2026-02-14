import { useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { AgentActivityFeed } from '../components/agents/AgentActivityFeed';
import { AgentCard } from '../components/agents/AgentCard';
import { useAgentMessages, useAgents } from '../hooks/useAgents';
import type { Agent } from '../types/agent';

const expectedAgents = [
  'media-planner',
  'trader',
  'analyst',
  'creative-ops',
  'compliance',
  'project-manager',
  'creative-coordinator',
  'asana-project-manager',
] as const;

const fallbackNames: Record<string, string> = {
  'media-planner': 'MediaPlanner',
  trader: 'Trader',
  analyst: 'Analyst',
  'creative-ops': 'CreativeOps',
  compliance: 'Compliance',
  'project-manager': 'ProjectManager',
  'creative-coordinator': 'CreativeCoordinator',
  'asana-project-manager': 'AsanaProjectManager',
};

export function Agents() {
  const { data, isLoading, error } = useAgents();
  const { data: messages = [] } = useAgentMessages(40);

  const agents = useMemo(() => {
    const byId = new Map((data ?? []).map((agent) => [agent.id, agent]));

    return expectedAgents.map((id) => {
      const base = byId.get(id);
      if (base) return { ...base, status: base.status ?? 'active' } satisfies Agent;
      return {
        id,
        name: fallbackNames[id],
        role: id,
        capabilities: [],
        tools: [],
        status: 'offline',
      } satisfies Agent;
    });
  }, [data]);

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader title='Agents' subtitle='Agent health, capabilities, and real-time collaboration activity' />

      <section className='grid xl:grid-cols-3 md:grid-cols-2 gap-4'>
        {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
      </section>

      <AgentActivityFeed messages={[...messages].reverse()} />
    </div>
  );
}
