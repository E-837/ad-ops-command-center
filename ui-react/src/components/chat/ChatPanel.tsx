import { ChatMessage, type ChatMessageItem } from './ChatMessage';

export function ChatPanel({ title = 'Conversation', messages }: { title?: string; messages: ChatMessageItem[] }) {
  return (
    <section className='glass rounded-xl p-4 border border-white/10'>
      <h3 className='font-semibold mb-3'>{title}</h3>
      <div className='space-y-2 max-h-[32rem] overflow-auto pr-1'>
        {messages.map((message, i) => <ChatMessage key={message.id || i} {...message} />)}
      </div>
    </section>
  );
}
