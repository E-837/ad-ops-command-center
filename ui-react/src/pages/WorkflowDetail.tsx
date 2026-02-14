import { useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { ExecutionProgress } from '../components/workflows/ExecutionProgress';
import { StageTimeline } from '../components/workflows/StageTimeline';
import { EventLog } from '../components/workflows/EventLog';
import { workflowKeys } from '../api/workflows';
import { useWorkflow, useWorkflowExecution, useWorkflowHistory } from '../hooks/useWorkflows';
import { useWorkflowExecutionSSE } from '../hooks/useSSE';
import type { WorkflowExecutionEvent } from '../types/workflow';

export function WorkflowDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const executionId = params.get('executionId') || undefined;

  const workflowQ = useWorkflow(id);
  const historyQ = useWorkflowHistory(id, 20);

  const selectedExecutionId = useMemo(() => executionId || historyQ.data?.[0]?.id, [executionId, historyQ.data]);
  const executionQ = useWorkflowExecution(id, selectedExecutionId);

  useWorkflowExecutionSSE(id, selectedExecutionId);

  const eventsQ = useQuery({
    queryKey: workflowKeys.executionEvents(id || '', selectedExecutionId || ''),
    queryFn: () => Promise.resolve([] as WorkflowExecutionEvent[]),
    enabled: Boolean(id && selectedExecutionId),
    staleTime: Infinity,
  });

  if (workflowQ.isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (workflowQ.error) return <ErrorBanner error={workflowQ.error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title={`Workflow: ${workflowQ.data?.name || id}`}
        subtitle={workflowQ.data?.description || 'Execution details and live progress'}
      />

      <div className='glass rounded-xl p-4 border border-white/10'>
        <h3 className='font-semibold mb-2'>Execution History</h3>
        <div className='flex flex-wrap gap-2'>
          {(historyQ.data || []).map((h) => (
            <button
              key={h.id}
              onClick={() => setParams({ executionId: h.id })}
              className={`px-3 py-1 rounded-full text-xs ${h.id === selectedExecutionId ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-white/70'}`}
            >
              {h.id.slice(0, 16)}... ({h.status})
            </button>
          ))}
        </div>
      </div>

      <ExecutionProgress execution={executionQ.data} />

      <div className='grid lg:grid-cols-2 gap-4'>
        <StageTimeline stages={executionQ.data?.stages || []} />
        <EventLog events={eventsQ.data || []} />
      </div>

      <div className='glass rounded-xl p-4 border border-white/10'>
        <h3 className='font-semibold mb-2'>Result / Artifacts</h3>
        <pre className='text-xs bg-black/20 rounded p-3 overflow-auto'>
          {JSON.stringify({ result: executionQ.data?.result, artifacts: executionQ.data?.artifacts }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
