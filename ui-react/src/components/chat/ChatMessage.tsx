import type { ReactNode } from 'react';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessageItem = {
  id?: string;
  role: ChatRole;
  content: string;
  meta?: string;
  addon?: ReactNode;
};

export function ChatMessage({ role, content, meta, addon }: ChatMessageItem) {
  const cls = role === 'user'
    ? 'bg-blue-500/20 border-blue-400/30 ml-8'
    : role === 'system'
      ? 'bg-violet-500/15 border-violet-300/30'
      : 'bg-white/10 border-white/15 mr-8';

  return (
    <div className={`p-3 rounded-lg border ${cls}`}>
      {meta && <div className='text-xs text-white/60 mb-1'>{meta}</div>}
      <div className='text-sm whitespace-pre-wrap'>{content}</div>
      {addon ? <div className='mt-2'>{addon}</div> : null}
    </div>
  );
}
