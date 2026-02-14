import type { GeneratedReport } from '../../types/report';

export function ReportHistoryTable({ reports }: { reports: GeneratedReport[] }) {
  return (
    <section className='glass rounded-xl border border-white/10 p-4'>
      <h3 className='text-lg font-semibold mb-3'>Report History</h3>
      <div className='space-y-2'>
        {reports.map((report) => (
          <div key={report.id} className='flex items-center justify-between border border-white/10 rounded-lg p-3 text-sm'>
            <div>
              <p>{report.name}</p>
              <p className='text-white/60'>{new Date(report.createdAt).toLocaleString()} • {report.type}</p>
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-white/70'>{report.status}</span>
              {report.downloadUrl ? <a className='text-secondary hover:underline' href={report.downloadUrl} target='_blank' rel='noreferrer'>Download</a> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
