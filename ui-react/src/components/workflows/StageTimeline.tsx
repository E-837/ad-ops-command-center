import type { ExecutionStage } from '../../types/workflow';

const color = (status: string) => {
  if (status === 'completed') return 'bg-green-400';
  if (status === 'failed') return 'bg-red-400';
  if (status === 'running') return 'bg-cyan-400';
  return 'bg-white/30';
};

export function StageTimeline({ stages }: { stages: ExecutionStage[] }) {
  return (
    <div className='glass rounded-xl p-4 border border-white/10'>
      <h3 className='font-semibold mb-3'>Stage Timeline</h3>
      <div className='space-y-3'>
        {stages.map((stage) => (
          <div key={stage.id} className='flex items-start gap-3'>
            <span className={`mt-1 w-3 h-3 rounded-full ${color(stage.status)}`} />
            <div>
              <div className='text-sm font-medium'>{stage.name}</div>
              <div className='text-xs text-white/60'>{stage.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
