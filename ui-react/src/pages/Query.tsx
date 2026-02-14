import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { ChatPanel } from '../components/chat/ChatPanel';
import { StreamingText } from '../components/chat/StreamingText';
import { AgentThreadView } from '../components/agents/AgentThreadView';
import { useAgentMessages } from '../hooks/useAgents';
import { useQueryAgents } from '../hooks/useQuery';
import { agentKeys } from '../api/agents';
import type { ChatMessageItem } from '../components/chat/ChatMessage';
import type { QueryHistoryItem } from '../types/agent';

function formatResult(result: unknown): string {
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}

export function Query() {
  const [input, setInput] = useState('');
  const [activeQueryId, setActiveQueryId] = useState<string | undefined>();
  const [selectedHistory, setSelectedHistory] = useState<QueryHistoryItem | undefined>();
  const mutation = useQueryAgents();
  const qc = useQueryClient();
  const { data: allMessages = [] } = useAgentMessages(200);

  const history = (qc.getQueryData(agentKeys.history) as QueryHistoryItem[] | undefined) ?? [];

  const activeMessages = useMemo(() => {
    if (!activeQueryId) return [];
    return allMessages.filter((m) => m.queryId === activeQueryId);
  }, [activeQueryId, allMessages]);

  const activeResponse = mutation.data ?? selectedHistory?.response;
  const activeQuery = mutation.variables?.query ?? selectedHistory?.query;

  const chatMessages = useMemo<ChatMessageItem[]>(() => {
    const items: ChatMessageItem[] = [];

    if (activeQuery) {
      items.push({
        role: 'user',
        content: activeQuery,
      });
    }

    if (activeResponse) {
      items.push({
        role: 'system',
        content: `Router selected: ${activeResponse.primaryAgent}`,
      });

      if (activeResponse.collaboratingAgents.length) {
        items.push({
          role: 'system',
          content: `Collaborators: ${activeResponse.collaboratingAgents.join(', ')}`,
          addon: <AgentThreadView messages={activeMessages} />,
        });
      }

      items.push({
        role: 'assistant',
        content: '',
        addon: <StreamingText text={formatResult(activeResponse.result)} />,
      });
    }

    return items;
  }, [activeMessages, activeQuery, activeResponse]);

  return (
    <div className='space-y-6'>
      <PageHeader title='Query' subtitle='Natural language routing + real-time A2A collaboration threads' />

      <section className='glass rounded-xl p-4 border border-white/10'>
        <form
          className='space-y-3'
          onSubmit={(e) => {
            e.preventDefault();
            const query = input.trim();
            if (!query) return;

            setSelectedHistory(undefined);
            mutation.mutate(
              { query, options: { collaborative: true, maxMessages: 20 } },
              {
                onSuccess: (res) => {
                  const queryId = res.messages[0]?.queryId;
                  if (queryId) setActiveQueryId(queryId);
                },
              },
            );
          }}
        >
          <textarea
            className='w-full min-h-28 rounded-lg bg-black/20 border border-white/10 p-3 outline-none focus:border-cyan-300/40'
            placeholder='Ask a question (e.g. Why is Meta CTR down 15% this week?)'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className='flex items-center gap-2'>
            <button className='px-4 py-2 rounded-lg bg-cyan-500/30 border border-cyan-300/30' disabled={mutation.isPending}>
              {mutation.isPending ? 'Running query...' : 'Run Query'}
            </button>
            {mutation.isError && <span className='text-rose-200 text-sm'>{mutation.error.message}</span>}
          </div>
        </form>
      </section>

      <div className='grid xl:grid-cols-[2fr_1fr] gap-4'>
        <ChatPanel title='A2A Collaboration' messages={chatMessages} />

        <section className='glass rounded-xl p-4 border border-white/10'>
          <h3 className='font-semibold mb-3'>Query History</h3>
          <div className='space-y-2 max-h-[32rem] overflow-auto'>
            {history.length === 0 && <p className='text-sm text-white/60'>No prior queries yet.</p>}
            {history.map((item) => (
              <button
                key={item.id}
                className='w-full text-left rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10'
                onClick={() => {
                  setInput(item.query);
                  setSelectedHistory(item);
                  setActiveQueryId(item.response.messages[0]?.queryId);
                }}
              >
                <p className='text-sm line-clamp-2'>{item.query}</p>
                <p className='text-xs text-white/60 mt-1'>{new Date(item.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
