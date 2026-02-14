import { useMemo, useState } from 'react';
import { Modal } from '../forms/Modal';
import { Input } from '../forms/Input';
import { Button } from '../forms/Button';
import type { Workflow, WorkflowInputSchema } from '../../types/workflow';

function parseValue(type: WorkflowInputSchema['type'], raw: string): unknown {
  if (type === 'number') return raw === '' ? undefined : Number(raw);
  if (type === 'boolean') return raw === 'true';
  if (type === 'array' || type === 'object') {
    try {
      return JSON.parse(raw || (type === 'array' ? '[]' : '{}'));
    } catch {
      return raw;
    }
  }
  return raw;
}

export function RunWorkflowModal({
  workflow,
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  workflow?: Workflow;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputs = useMemo(() => workflow?.inputs || {}, [workflow]);

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const payload: Record<string, unknown> = {};

    Object.entries(inputs).forEach(([key, schema]) => {
      const raw = values[key] ?? '';
      if (schema.required && !raw) nextErrors[key] = 'Required';
      payload[key] = parseValue(schema.type, raw);
      if (schema.type === 'number' && raw && Number.isNaN(payload[key])) {
        nextErrors[key] = 'Must be a number';
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(payload);
  };

  return (
    <Modal open={open} title={`Run ${workflow?.name || 'Workflow'}`}>
      <div className='space-y-3 mt-2'>
        {Object.entries(inputs).map(([key, schema]) => (
          <div key={key}>
            <label className='text-xs text-white/70'>{key} {schema.required ? '*' : ''}</label>
            <Input
              placeholder={schema.description || schema.type}
              value={values[key] || ''}
              onChange={(e) => setValues((s) => ({ ...s, [key]: e.target.value }))}
            />
            {errors[key] ? <div className='text-xs text-red-300 mt-1'>{errors[key]}</div> : null}
          </div>
        ))}

        {Object.keys(inputs).length === 0 && <div className='text-sm text-white/70'>This workflow takes no inputs.</div>}

        <div className='flex gap-2 pt-2'>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Running...' : 'Run Workflow'}</Button>
          <Button className='bg-white/5' onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
