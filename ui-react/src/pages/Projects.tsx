import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { ProjectFilterBar } from '../components/projects/ProjectFilterBar';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useCreateProject, useProjects } from '../hooks/useProjects';

function timelineLabel(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) return 'No timeline';
  if (!startDate) return `Until ${new Date(endDate as string).toLocaleDateString()}`;
  if (!endDate) return `Started ${new Date(startDate).toLocaleDateString()}`;
  return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
}

export function Projects() {
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, error } = useProjects({
    type: type === 'all' ? undefined : type,
    status: status === 'all' ? undefined : status,
  });
  const createMutation = useCreateProject();

  const projects = data?.projects ?? [];

  const groupedStats = useMemo(() => {
    const counts = { campaign: 0, workflow: 0, adHoc: 0 };
    projects.forEach((project) => {
      if (project.type === 'campaign') counts.campaign += 1;
      else if (project.type === 'workflow') counts.workflow += 1;
      else counts.adHoc += 1;
    });
    return counts;
  }, [projects]);

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Projects'
        subtitle='Track campaign, workflow, and ad-hoc initiatives'
        actions={<button className='px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20' onClick={() => setOpenCreate(true)}>New Project</button>}
      />

      <div className='grid md:grid-cols-3 gap-4'>
        <div className='glass rounded-xl p-4 border border-white/10'>Campaign projects: {groupedStats.campaign}</div>
        <div className='glass rounded-xl p-4 border border-white/10'>Workflow projects: {groupedStats.workflow}</div>
        <div className='glass rounded-xl p-4 border border-white/10'>Ad-hoc + other: {groupedStats.adHoc}</div>
      </div>

      <ProjectFilterBar
        type={type}
        status={status}
        onChange={(next) => {
          if (next.type !== undefined) setType(next.type);
          if (next.status !== undefined) setStatus(next.status);
        }}
      />

      <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {projects.map((project) => (
          <article key={project.id} className='glass rounded-xl p-4 border border-white/10 space-y-2'>
            <div className='flex items-start justify-between gap-3'>
              <h3 className='font-semibold'>{project.name}</h3>
              <span className='px-2 py-1 rounded-full bg-white/10 text-xs'>{project.status}</span>
            </div>
            <p className='text-sm text-white/70'>Type: {project.type}</p>
            <p className='text-sm text-white/70'>Timeline: {timelineLabel(project.startDate, project.endDate)}</p>
            <p className='text-sm text-white/70'>Health: {project.metrics?.health ?? 'unknown'}</p>
            <div className='text-sm text-white/70'>
              Links:{' '}
              <Link to='/campaigns' className='text-cyan-300 hover:underline'>Campaigns</Link>
              {' · '}
              <Link to='/workflows' className='text-cyan-300 hover:underline'>Workflows</Link>
            </div>
          </article>
        ))}
      </div>

      <CreateProjectModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        isSaving={createMutation.isPending}
        onCreate={(payload) => {
          createMutation.mutate(payload, { onSuccess: () => setOpenCreate(false) });
        }}
      />
    </div>
  );
}
