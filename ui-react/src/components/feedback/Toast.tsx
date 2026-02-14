import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/ui';
export function Toast() {
  const { toasts, removeToast } = useUIStore();
  useEffect(() => { toasts.forEach((t: any) => setTimeout(() => removeToast(t.id), 5000)); }, [toasts, removeToast]);
  return createPortal(<div className='fixed right-4 top-4 space-y-2'>{toasts.map((t: any)=><div key={t.id} className='glass rounded-lg px-3 py-2'>{t.message}</div>)}</div>, document.body);
}
