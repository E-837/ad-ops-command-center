import { Button } from '../forms/Button';

type CampaignBulkActionBarProps = {
  selectedCount: number;
  onAction: (action: 'pause' | 'resume' | 'archive') => void;
  busy?: boolean;
};

export function CampaignBulkActionBar({ selectedCount, onAction, busy }: CampaignBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className='glass rounded-xl p-3 border border-white/10 flex flex-wrap items-center gap-2'>
      <span className='text-sm text-white/80'>{selectedCount} selected</span>
      <Button disabled={busy} onClick={() => onAction('pause')}>Pause</Button>
      <Button disabled={busy} onClick={() => onAction('resume')}>Resume</Button>
      <Button disabled={busy} className='bg-red-500/20 hover:bg-red-500/30' onClick={() => onAction('archive')}>Archive</Button>
    </div>
  );
}
