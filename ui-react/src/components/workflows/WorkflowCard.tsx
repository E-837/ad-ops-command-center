import { Link } from 'react-router-dom';
import { Button } from '../forms/Button';
import type { Workflow } from '../../types/workflow';

type Props = {
  workflow: Workflow;
  onRun: (workflow: Workflow) => void;
};

export function WorkflowCard({ workflow, onRun }: Props) {
  return (
    <div className='glass rounded-xl p-4 border border-white/10'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='font-semibold text-white'>{workflow.name}</h3>
          <p className='text-sm text-white/70 mt-1'>{workflow.description || 'No description provided.'}</p>
        </div>
        <span className='text-xs px-2 py-1 rounded-full bg-white/10 text-white/70'>{workflow.estimatedDuration || 'n/a'}</span>
      </div>

      <div className='mt-3 text-xs text-white/60'>
        {(workflow.stages || []).length} stages • {(workflow.requiredConnectors || []).length} required connectors
      </div>

      <div className='flex gap-2 mt-4'>
        <Button onClick={() => onRun(workflow)}>Run</Button>
        <Link className='px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10' to={`/workflows/${workflow.id}`}>
          View Details
        </Link>
      </div>
    </div>
  );
}
