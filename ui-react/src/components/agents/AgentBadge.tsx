import type { AgentStatus } from '../../types/agent';

const statusClass: Record<AgentStatus, string> = {
  active: 'bg-emerald-500/25 text-emerald-200 border-emerald-300/30',
  idle: 'bg-slate-500/25 text-slate-200 border-slate-300/30',
  degraded: 'bg-amber-500/25 text-amber-200 border-amber-300/30',
  offline: 'bg-rose-500/25 text-rose-200 border-rose-300/30',
};

export function AgentBadge({ status = 'idle' }: { status?: AgentStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full border text-xs capitalize ${statusClass[status]}`}>
      {status}
    </span>
  );
}
