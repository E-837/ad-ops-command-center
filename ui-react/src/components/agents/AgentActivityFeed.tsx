import type { AgentMessage } from '../../types/agent';
import { AgentAvatar } from './AgentAvatar';

function payloadSummary(msg: AgentMessage) {
  const text = (msg.payload.text || msg.payload.query || msg.payload.collaborator) as string | undefined;
  if (text) return String(text);
  return msg.type;
}

export function AgentActivityFeed({ messages }: { messages: AgentMessage[] }) {
  return (
    <section className='glass rounded-xl p-4 border border-white/10'>
      <h3 className='font-semibold mb-3'>Live A2A Activity</h3>
      <div className='space-y-2 max-h-[28rem] overflow-auto pr-1'>
        {messages.length === 0 && <p className='text-sm text-white/60'>No recent agent messages.</p>}
        {messages.map((msg) => (
          <div key={msg.id} className='rounded-lg border border-white/10 bg-white/5 p-3'>
            <div className='flex items-center gap-2 text-sm'>
              <AgentAvatar name={msg.from} size='sm' />
              <span className='font-medium'>{msg.from}</span>
              <span className='text-white/50'>→</span>
              <AgentAvatar name={msg.to} size='sm' />
              <span className='font-medium'>{msg.to}</span>
              <span className='ml-auto text-xs text-white/50'>{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className='text-sm text-white/75 mt-2'>{payloadSummary(msg)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
