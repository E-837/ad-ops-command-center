import type { WorkflowExecution } from '../../types/workflow';

export function ExecutionProgress({ execution }: { execution?: WorkflowExecution }) {
  if (!execution) return null;

  const total = execution.stages?.length || 0;
  const done = (execution.stages || []).filter((s) => s.status === 'completed').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : execution.status === 'completed' ? 100 : 0;

  return (
    <div className='glass rounded-xl p-4 border border-white/10'>
      <div className='flex justify-between text-sm mb-2'>
        <span>Status: <b>{execution.status}</b></span>
        <span>{progress}%</span>
      </div>
      <div className='h-2 bg-white/10 rounded-full overflow-hidden'>
        <div className='h-full bg-cyan-400 transition-all' style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
