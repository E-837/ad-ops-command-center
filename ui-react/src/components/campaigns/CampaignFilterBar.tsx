import { Input } from '../forms/Input';

type CampaignFilterBarProps = {
  dsp: string;
  status: string;
  startDate: string;
  endDate: string;
  onChange: (next: { dsp?: string; status?: string; startDate?: string; endDate?: string }) => void;
};

const DSPS = ['all', 'ttd', 'dv360', 'amazon', 'google_ads', 'meta'];
const STATUSES = ['all', 'draft', 'active', 'live', 'paused', 'archived', 'completed'];

export function CampaignFilterBar({ dsp, status, startDate, endDate, onChange }: CampaignFilterBarProps) {
  return (
    <div className='glass rounded-xl p-4 border border-white/10 grid md:grid-cols-4 gap-3'>
      <select value={dsp} onChange={(e) => onChange({ dsp: e.target.value })} className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
        {DSPS.map((option) => (
          <option key={option} value={option}>{option === 'all' ? 'All DSPs' : option.toUpperCase()}</option>
        ))}
      </select>
      <select value={status} onChange={(e) => onChange({ status: e.target.value })} className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
        {STATUSES.map((option) => (
          <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>
        ))}
      </select>
      <Input type='date' value={startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
      <Input type='date' value={endDate} onChange={(e) => onChange({ endDate: e.target.value })} />
    </div>
  );
}
