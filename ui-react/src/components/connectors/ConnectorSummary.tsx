import type { Connector } from '../../types/connector';

export function ConnectorSummary({ connectors }: { connectors: Connector[] }) {
  const total = connectors.length;
  const connected = connectors.filter((c) => c.statusLabel === 'Connected' || c.statusLabel === 'Connected via MCP').length;
  const mock = connectors.filter((c) => c.statusLabel === 'Mock data').length;
  const tools = connectors.reduce((sum, c) => sum + (c.toolCount ?? c.tools?.length ?? 0), 0);

  const stats = [
    { label: 'Total', value: total },
    { label: 'Connected', value: connected },
    { label: 'Mock', value: mock },
    { label: 'Tools', value: tools },
  ];

  return (
    <section className='grid md:grid-cols-4 gap-3'>
      {stats.map((s) => (
        <div key={s.label} className='glass rounded-xl border border-white/10 p-4'>
          <p className='text-2xl font-semibold'>{s.value}</p>
          <p className='text-sm text-white/70'>{s.label}</p>
        </div>
      ))}
    </section>
  );
}
