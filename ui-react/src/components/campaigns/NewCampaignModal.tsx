import { useState } from 'react';
import { Modal } from '../forms/Modal';
import { Input } from '../forms/Input';
import { Button } from '../forms/Button';
import type { CreateCampaignRequest } from '../../types/campaign';

type NewCampaignModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateCampaignRequest) => void;
  isSaving?: boolean;
};

export function NewCampaignModal({ open, onClose, onCreate, isSaving }: NewCampaignModalProps) {
  const [name, setName] = useState('');
  const [dsp, setDsp] = useState('ttd');
  const [budget, setBudget] = useState('');

  return (
    <Modal open={open} title='Launch campaign'>
      <div className='space-y-3 mt-3'>
        <Input placeholder='Campaign name' value={name} onChange={(e) => setName(e.target.value)} />
        <select value={dsp} onChange={(e) => setDsp(e.target.value)} className='w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
          <option value='ttd'>TTD</option>
          <option value='dv360'>DV360</option>
          <option value='amazon'>Amazon</option>
          <option value='google_ads'>Google Ads</option>
          <option value='meta'>Meta</option>
        </select>
        <Input type='number' placeholder='Total budget' value={budget} onChange={(e) => setBudget(e.target.value)} />
        <div className='flex gap-2 justify-end'>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            disabled={isSaving || !name.trim()}
            onClick={() => {
              onCreate({
                name: name.trim(),
                dsp,
                budget: budget ? Number(budget) : undefined,
                status: 'draft',
              });
              setName('');
              setBudget('');
            }}
          >
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
