import type { ReportSchedule } from '../../types/report';

export function ScheduledReportsList({ schedules }: { schedules: ReportSchedule[] }) {
  return (
    <section className='glass rounded-xl border border-white/10 p-4'>
      <h3 className='text-lg font-semibold mb-3'>Scheduled Reports</h3>
      <div className='space-y-2'>
        {schedules.map((schedule) => (
          <div key={schedule.id} className='border border-white/10 rounded-lg p-3 text-sm'>
            <p>{schedule.templateName}</p>
            <p className='text-white/60'>
              {schedule.frequency} • Next run {new Date(schedule.nextRunAt).toLocaleString()} • {schedule.active ? 'Active' : 'Paused'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
