import type { AgentMessage } from '../../types/agent';

function extractText(msg: AgentMessage) {
  const payload = msg.payload || {};
  const query = payload.query;
  if (typeof query === 'string') return query;
  const collaborator = payload.collaborator;
  if (typeof collaborator === 'string') return `Response from ${collaborator}`;
  const result = payload.result;
  if (result && typeof result === 'object' && 'message' in result) {
    const text = (result as { message?: unknown }).message;
    if (typeof text === 'string') return text;
  }
  return msg.type;
}

export function AgentThreadView({ messages }: { messages: AgentMessage[] }) {
  return (
    <div className='space-y-2'>
      {messages.map((msg) => (
        <div key={msg.id} className='rounded-lg bg-white/5 border border-white/10 p-3'>
          <div className='text-xs text-white/60'>{msg.from} → {msg.to} • {new Date(msg.timestamp).toLocaleTimeString()}</div>
          <div className='text-sm mt-1'>{extractText(msg)}</div>
        </div>
      ))}
    </div>
  );
}
