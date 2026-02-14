import { useMemo, useState } from 'react';
import { Modal } from '../forms/Modal';
import { Input } from '../forms/Input';
import { Button } from '../forms/Button';
import type { CreateProjectRequest } from '../../types/project';

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProjectRequest) => void;
  isSaving?: boolean;
};

export function CreateProjectModal({ open, onClose, onCreate, isSaving }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('campaign');
  const [owner, setOwner] = useState('');
  const [errors, setErrors] = useState<{ name?: string; owner?: string }>({});

  const isValid = useMemo(() => name.trim().length >= 3 && owner.trim().length > 0, [name, owner]);

  return (
    <Modal open={open} title='Create project'>
      <div className='space-y-3 mt-3'>
        <Input placeholder='Project name (min 3 chars)' value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name ? <p className='text-xs text-red-300'>{errors.name}</p> : null}

        <select value={type} onChange={(e) => setType(e.target.value)} className='w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10'>
          <option value='campaign'>Campaign</option>
          <option value='workflow'>Workflow</option>
          <option value='ad-hoc'>Ad-hoc</option>
          <option value='dsp-onboarding'>DSP Onboarding</option>
          <option value='infrastructure'>Infrastructure</option>
        </select>

        <Input placeholder='Owner' value={owner} onChange={(e) => setOwner(e.target.value)} />
        {errors.owner ? <p className='text-xs text-red-300'>{errors.owner}</p> : null}

        <div className='flex justify-end gap-2'>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            disabled={isSaving}
            onClick={() => {
              const nextErrors: { name?: string; owner?: string } = {};
              if (name.trim().length < 3) nextErrors.name = 'Name must be at least 3 characters';
              if (!owner.trim()) nextErrors.owner = 'Owner is required';
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0 || !isValid) return;

              onCreate({
                name: name.trim(),
                type,
                owner: owner.trim(),
                status: 'planning',
              });
              setName('');
              setOwner('');
              setErrors({});
            }}
          >
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
