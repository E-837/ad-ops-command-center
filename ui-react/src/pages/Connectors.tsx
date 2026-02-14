import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { ConnectorCard } from '../components/connectors/ConnectorCard';
import { ConnectorSummary } from '../components/connectors/ConnectorSummary';
import {
  useConnectConnector,
  useConnectors,
  useConnectorStatus,
  useDisconnectConnector,
  useRefreshMcp,
  useTestConnector,
} from '../hooks/useConnectors';

const DSP_IDS = new Set(['ttd', 'dv360', 'amazon-dsp', 'google-ads', 'meta-ads']);

export function Connectors() {
  const { data: connectors = [], isLoading, error } = useConnectors();
  const { data: statuses = [] } = useConnectorStatus();
  const refreshMutation = useRefreshMcp();
  const testMutation = useTestConnector();
  const connectMutation = useConnectConnector();
  const disconnectMutation = useDisconnectConnector();
  const [lastTestById, setLastTestById] = useState<Record<string, string>>({});

  const merged = useMemo(() => {
    const statusMap = new Map(statuses.map((s) => [s.id, s]));
    return connectors.map((connector) => {
      const status = statusMap.get(connector.id);
      return status
        ? { ...connector, statusLabel: status.statusLabel, lastSync: status.lastSync, connected: status.connected }
        : connector;
    });
  }, [connectors, statuses]);

  const dsp = merged.filter((c) => DSP_IDS.has(c.id));
  const productivity = merged.filter((c) => !DSP_IDS.has(c.id));

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Connectors'
        subtitle='DSP and productivity connector health, MCP status, and connection actions'
        actions={
          <button className='px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary disabled:opacity-60' onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
            {refreshMutation.isPending ? 'Refreshing...' : 'Refresh All'}
          </button>
        }
      />

      <ConnectorSummary connectors={merged} />

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>DSP Connectors</h2>
        <div className='grid lg:grid-cols-2 gap-3'>
          {dsp.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              isTesting={testMutation.isPending && testMutation.variables === connector.id}
              onTest={(id) => testMutation.mutate(id, { onSuccess: (result) => setLastTestById((prev) => ({ ...prev, [id]: result.connected || result.success ? 'ok' : result.error ?? 'failed' })) })}
              onConnect={(id) => connectMutation.mutate(id)}
              onDisconnect={(id) => disconnectMutation.mutate(id)}
            />
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Productivity Connectors</h2>
        <div className='grid lg:grid-cols-2 gap-3'>
          {productivity.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              isTesting={testMutation.isPending && testMutation.variables === connector.id}
              onTest={(id) => testMutation.mutate(id, { onSuccess: (result) => setLastTestById((prev) => ({ ...prev, [id]: result.connected || result.success ? 'ok' : result.error ?? 'failed' })) })}
              onConnect={(id) => connectMutation.mutate(id)}
              onDisconnect={(id) => disconnectMutation.mutate(id)}
            />
          ))}
        </div>
      </section>

      {Object.keys(lastTestById).length > 0 ? (
        <div className='text-xs text-white/60'>Last test results: {JSON.stringify(lastTestById)}</div>
      ) : null}
    </div>
  );
}
