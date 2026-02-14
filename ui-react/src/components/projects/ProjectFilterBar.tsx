type ProjectFilterBarProps = {
  type: string;
  status: string;
  onChange: (next: { type?: string; status?: string }) => void;
};

const TYPES = ['all', 'campaign', 'workflow', 'ad-hoc', 'dsp-onboarding', 'infrastructure'];
const STATUSES = ['all', 'planning', 'active', 'paused', 'completed', 'cancelled'];

export function ProjectFilterBar({ type, status, onChange }: ProjectFilterBarProps) {
  return (
    <div className='glass rounded-xl p-4 border border-white/10 grid md:grid-cols-2 gap-3'>
      <select value={type} onChange={(e) => onChange({ type: e.target.value })} className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
        {TYPES.map((option) => (
          <option key={option} value={option}>{option === 'all' ? 'All types' : option}</option>
        ))}
      </select>
      <select value={status} onChange={(e) => onChange({ status: e.target.value })} className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
        {STATUSES.map((option) => (
          <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>
        ))}
      </select>
    </div>
  );
}
