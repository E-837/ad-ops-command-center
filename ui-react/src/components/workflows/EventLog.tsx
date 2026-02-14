import { useEffect, useRef } from 'react';
import type { WorkflowExecutionEvent } from '../../types/workflow';

export function EventLog({ events }: { events: WorkflowExecutionEvent[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div className='glass rounded-xl p-4 border border-white/10'>
      <h3 className='font-semibold mb-3'>Event Log</h3>
      <div ref={ref} className='max-h-80 overflow-auto text-xs font-mono space-y-2'>
        {events.map((event, idx) => (
          <div key={`${event.type}-${idx}`} className='border-b border-white/5 pb-2'>
            <span className='text-cyan-300'>{event.type}</span>{' '}
            <span className='text-white/70'>{String(event.detail || event.status || '')}</span>
          </div>
        ))}
        {events.length === 0 && <div className='text-white/50'>Waiting for events...</div>}
      </div>
    </div>
  );
}
