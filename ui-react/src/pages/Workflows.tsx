import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { DataTable } from '../components/data/DataTable';
import { WorkflowCard } from '../components/workflows/WorkflowCard';
import { RunWorkflowModal } from '../components/workflows/RunWorkflowModal';
import { useExecutions, useRunWorkflow, useWorkflows } from '../hooks/useWorkflows';
import type { Workflow } from '../types/workflow';

export function Workflows() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<Workflow | undefined>();
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useWorkflows();
  const { data: executions = [] } = useExecutions(25);
  const runMutation = useRunWorkflow(selected?.id || '');

  const byCategory = useMemo(() => {
    const workflows = data?.workflows || [];
    const categories = data?.categories || [];
    return categories.map((cat) => ({
      ...cat,
      items: workflows.filter((w) => w.category === cat.id),
    }));
  }, [data]);

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  const historyRows = executions.map((e) => ({
    id: e.id,
    workflowId: e.workflowId,
    status: e.status,
    createdAt: e.createdAt || '',
  }));

  return (
    <div className='space-y-6'>
      <PageHeader title='Workflows' subtitle='Run and monitor workflow automation' />

      {byCategory.map((category) => (
        <section key={category.id}>
          <h2 className='font-semibold mb-2'>{category.icon} {category.label}</h2>
          <p className='text-sm text-white/60 mb-3'>{category.description}</p>
          <div className='grid md:grid-cols-2 gap-4'>
            {category.items.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onRun={(wf) => {
                  setSelected(wf);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className='font-semibold mb-3'>Recent Executions</h2>
        <div className='glass rounded-xl p-3 border border-white/10'>
          <DataTable
            data={historyRows as Record<string, unknown>[]}
            columns={[
              { key: 'id', header: 'Execution ID' },
              { key: 'workflowId', header: 'Workflow' },
              { key: 'status', header: 'Status' },
              {
                key: 'createdAt',
                header: 'Created',
                render: (row) => new Date(String(row.createdAt || '')).toLocaleString(),
              },
              {
                key: 'workflowId',
                header: 'Action',
                render: (row) => (
                  <button
                    className='text-cyan-300 hover:underline'
                    onClick={() => nav(`/workflows/${String(row.workflowId)}?executionId=${String(row.id)}`)}
                  >
                    View
                  </button>
                ),
              },
            ]}
          />
        </div>
      </section>

      <RunWorkflowModal
        workflow={selected}
        open={open}
        onClose={() => setOpen(false)}
        isSubmitting={runMutation.isPending}
        onSubmit={(payload) => {
          if (!selected?.id) return;
          runMutation.mutate(payload, {
            onSuccess: (res) => {
              setOpen(false);
              nav(`/workflows/${selected.id}?executionId=${res.executionId}`);
            },
          });
        }}
      />
    </div>
  );
}
