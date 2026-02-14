import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { ReportTemplateLibrary } from '../components/reports/ReportTemplateLibrary';
import { ReportBuilder } from '../components/reports/ReportBuilder';
import { ReportHistoryTable } from '../components/reports/ReportHistoryTable';
import { ScheduledReportsList } from '../components/reports/ScheduledReportsList';
import { useCreateReportSchedule, useGenerateReport, useReports } from '../hooks/useReports';
import type { ReportType } from '../types/report';

function todayMinus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function Reports() {
  const [type, setType] = useState<ReportType | 'all'>('all');
  const [startDate, setStartDate] = useState(todayMinus(30));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const { data, isLoading, error } = useReports({ type, startDate, endDate });
  const generateMutation = useGenerateReport();
  const scheduleMutation = useCreateReportSchedule();

  const templates = data?.templates ?? [];
  const selectedTemplateId = templates[0]?.id ?? '';
  const [templateId, setTemplateId] = useState(selectedTemplateId);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === (templateId || selectedTemplateId)),
    [templates, templateId, selectedTemplateId],
  );

  const filteredHistory = (data?.history ?? []).filter((item) => (type === 'all' ? true : item.type === type));

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader title='Reports' subtitle='Build, schedule, and download reports across campaign and connector data' />

      <div className='glass rounded-xl border border-white/10 p-4 flex flex-wrap gap-3 items-end'>
        <label className='text-sm'>
          Type
          <select className='block mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10' value={type} onChange={(e) => setType(e.target.value as ReportType | 'all')}>
            <option value='all'>All</option>
            <option value='performance'>Performance</option>
            <option value='pacing'>Pacing</option>
            <option value='attribution'>Attribution</option>
            <option value='creative'>Creative</option>
            <option value='executive'>Executive</option>
          </select>
        </label>
      </div>

      <ReportTemplateLibrary templates={templates} selectedId={selectedTemplate?.id ?? ''} onSelect={setTemplateId} />

      <ReportBuilder
        template={selectedTemplate}
        startDate={startDate}
        endDate={endDate}
        onChange={(next) => {
          if (next.startDate !== undefined) setStartDate(next.startDate);
          if (next.endDate !== undefined) setEndDate(next.endDate);
        }}
        generating={generateMutation.isPending}
        onGenerate={(payload) => generateMutation.mutate(payload)}
      />

      <div>
        <button
          className='px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-60'
          disabled={!selectedTemplate || scheduleMutation.isPending}
          onClick={() => {
            if (!selectedTemplate) return;
            scheduleMutation.mutate({ templateId: selectedTemplate.id, frequency: 'weekly', recipients: ['ops@example.com'] });
          }}
        >
          {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule weekly report'}
        </button>
      </div>

      <ScheduledReportsList schedules={data?.scheduled ?? []} />
      <ReportHistoryTable reports={filteredHistory} />
    </div>
  );
}
