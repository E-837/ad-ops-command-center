import type { Connector } from '../../types/connector';

type Props = {
  connector: Connector;
  isTesting?: boolean;
  onTest: (id: string) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
};

const STATUS_COLOR: Record<Connector['statusLabel'], string> = {
  'Connected via MCP': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  Connected: 'bg-green-500/20 text-green-300 border-green-400/40',
  'Mock data': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  'Not configured': 'bg-red-500/20 text-red-300 border-red-400/40',
};

function fmtDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

export function ConnectorCard({ connector, isTesting, onTest, onConnect, onDisconnect }: Props) {
  return (
    <article className='glass rounded-xl border border-white/10 p-4 space-y-4'>
      <header className='flex items-start justify-between gap-2'>
        <div>
          <h3 className='font-semibold'>{connector.name}</h3>
          <p className='text-xs text-white/60'>{connector.id}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLOR[connector.statusLabel]}`}>
          {connector.statusLabel}
        </span>
      </header>

      <div className='text-sm text-white/80 grid grid-cols-2 gap-2'>
        <p>Category: {connector.category}</p>
        <p>Tools: {connector.toolCount ?? connector.tools?.length ?? 0}</p>
        <p>Features: {connector.features?.length ?? 0}</p>
        <p>Last sync: {fmtDate(connector.lastSync)}</p>
      </div>

      <div className='flex gap-2'>
        <button className='px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm' onClick={() => onTest(connector.id)}>
          {isTesting ? 'Testing...' : 'Test'}
        </button>
        <button className='px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm' onClick={() => onConnect(connector.id)}>
          Connect
        </button>
        <button className='px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm' onClick={() => onDisconnect(connector.id)}>
          Disconnect
        </button>
      </div>
    </article>
  );
}
