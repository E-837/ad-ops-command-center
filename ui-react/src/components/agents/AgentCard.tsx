import type { Agent } from '../../types/agent';
import { AgentAvatar } from './AgentAvatar';
import { AgentBadge } from './AgentBadge';

export function AgentCard({ agent }: { agent: Agent }) {
  const health = Math.max(0, Math.min(100, agent.health ?? (agent.status === 'active' ? 96 : 88)));

  return (
    <article className='glass rounded-xl p-4 border border-white/10 space-y-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <AgentAvatar name={agent.name} />
          <div>
            <h3 className='font-semibold leading-tight'>{agent.name}</h3>
            <p className='text-xs text-white/60'>{agent.id}</p>
          </div>
        </div>
        <AgentBadge status={agent.status} />
      </div>

      <p className='text-sm text-white/75 min-h-10'>{agent.description || 'No description available.'}</p>

      <div>
        <p className='text-xs text-white/60 mb-1'>Capabilities</p>
        <div className='flex flex-wrap gap-1'>
          {agent.capabilities.map((cap) => <span key={cap} className='text-xs px-2 py-1 rounded bg-white/10'>{cap}</span>)}
        </div>
      </div>

      <div>
        <p className='text-xs text-white/60 mb-1'>Tools</p>
        <div className='flex flex-wrap gap-1'>
          {agent.tools.map((tool) => <span key={tool} className='text-xs px-2 py-1 rounded bg-cyan-500/15 text-cyan-100'>{tool}</span>)}
        </div>
      </div>

      <div>
        <div className='text-xs text-white/60 mb-1'>Health: {health}%</div>
        <div className='h-1.5 rounded bg-white/10 overflow-hidden'>
          <div className='h-full bg-emerald-400' style={{ width: `${health}%` }} />
        </div>
      </div>
    </article>
  );
}
