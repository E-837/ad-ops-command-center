import { useMemo } from 'react';
import type { GenerateReportRequest, ReportTemplate } from '../../types/report';

type Props = {
  template?: ReportTemplate;
  startDate: string;
  endDate: string;
  onChange: (next: { startDate?: string; endDate?: string }) => void;
  onGenerate: (payload: GenerateReportRequest) => void;
  generating?: boolean;
};

export function ReportBuilder({ template, startDate, endDate, onChange, onGenerate, generating }: Props) {
  const canGenerate = Boolean(template && startDate && endDate);

  const payload = useMemo<GenerateReportRequest | null>(() => {
    if (!template || !startDate || !endDate) return null;
    return {
      templateId: template.id,
      metrics: template.metrics,
      dimensions: template.dimensions,
      startDate,
      endDate,
      name: `${template.name} (${startDate} to ${endDate})`,
    };
  }, [template, startDate, endDate]);

  return (
    <section className='glass rounded-xl border border-white/10 p-4 space-y-3'>
      <h3 className='text-lg font-semibold'>Report Builder</h3>
      {!template ? <p className='text-sm text-white/70'>Select a template to configure this report.</p> : null}
      <div className='grid md:grid-cols-2 gap-3'>
        <label className='text-sm'>
          Start date
          <input className='w-full mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10' type='date' value={startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </label>
        <label className='text-sm'>
          End date
          <input className='w-full mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10' type='date' value={endDate} onChange={(e) => onChange({ endDate: e.target.value })} />
        </label>
      </div>
      <button
        className='px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary disabled:opacity-50'
        disabled={!canGenerate || !payload || generating}
        onClick={() => payload && onGenerate(payload)}
      >
        {generating ? 'Generating...' : 'Generate report'}
      </button>
    </section>
  );
}
