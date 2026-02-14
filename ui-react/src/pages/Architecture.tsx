import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';

type ArchitectureComponent = {
  name: string;
  purpose: string;
  route?: string;
  endpoint?: string;
};

const layers: Array<{ title: string; description: string; components: ArchitectureComponent[] }> = [
  {
    title: 'Experience Layer',
    description: 'React + Vite frontend for operators, analysts, and automation engineers.',
    components: [
      { name: 'Landing', purpose: 'Marketing and onboarding entry point', route: '/' },
      { name: 'Dashboard', purpose: 'Live KPI monitoring and pacing overview', route: '/dashboard' },
      { name: 'Workflows / Campaigns / Projects', purpose: 'Execution, planning, and tracking', route: '/workflows' },
      { name: 'Query + Agents', purpose: 'AI-assisted operations and conversational actions', route: '/query' },
    ],
  },
  {
    title: 'API & Orchestration Layer',
    description: 'Node/Express services exposing domain APIs and coordinating automation pipelines.',
    components: [
      { name: 'Workflow APIs', purpose: 'Execution lifecycle and run history', endpoint: '/api/workflows' },
      { name: 'Campaign APIs', purpose: 'Campaign CRUD and optimization actions', endpoint: '/api/campaigns' },
      { name: 'Agents + Query APIs', purpose: 'A2A and streamed query responses', endpoint: '/api/agents, /api/query' },
      { name: 'Connector APIs', purpose: 'External platform sync and health checks', endpoint: '/api/connectors' },
    ],
  },
  {
    title: 'Data & Integration Layer',
    description: 'Persistent storage, analytics aggregation, and third-party connector network.',
    components: [
      { name: 'Database', purpose: 'Campaigns, projects, reports, connector state', endpoint: 'database/*' },
      { name: 'Connector Engine', purpose: 'Meta/Google/TikTok sync + diagnostics', endpoint: 'connectors/*' },
      { name: 'Events + Logs', purpose: 'Observability, audits, and timeline playback', endpoint: 'events/*, logs/*' },
    ],
  },
];

const techStack = [
  ['Frontend', 'React 19, TypeScript, React Router, TanStack Query, Tailwind CSS'],
  ['Backend', 'Node.js, Express, streaming/SSE routes'],
  ['Data', 'JSON/DB-backed domain stores + report aggregation'],
  ['AI + Automation', 'Agents, A2A query flows, workflow orchestration'],
  ['Ops', 'Vite build pipeline, environment-based server routing'],
] as const;

const docs = [
  ['Migration Architecture Spec', '../REACT-MIGRATION-ARCHITECTURE.md'],
  ['Main README', '../README.md'],
  ['Deployment Checklist', '../DEPLOYMENT-CHECKLIST.md'],
  ['Technical Debt', '../TECHNICAL-DEBT.md'],
] as const;

const schemaTables = [
  ['projects', 'Project metadata, ownership, status, budget allocation'],
  ['campaigns', 'Campaign config, pacing targets, performance snapshots'],
  ['workflows', 'Execution definitions, scheduling, input/output contracts'],
  ['workflow_runs', 'Runtime logs, statuses, durations, failure causes'],
  ['connectors', 'Provider credentials, sync cadence, health state'],
  ['reports', 'Saved report definitions and generated output artifacts'],
  ['agents', 'Agent profile, capability set, model/runtime configuration'],
] as const;

function DiagramBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="space-y-1 text-sm text-white/80">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function Architecture() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="🏗️ Platform Architecture"
        subtitle="System overview for Ad Ops Command Center: UI, orchestration services, integrations, and data model"
      />

      <section className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">System Diagram</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <DiagramBox title="1) React Experience" items={['Landing + Product Narrative', 'Operational Modules (10 pages)', 'Realtime updates via SSE']} />
          <DiagramBox title="2) API Orchestration" items={['Express route layer', 'Workflow + agent coordination', 'Connector sync endpoints']} />
          <DiagramBox title="3) Data + External Systems" items={['Domain data stores', 'Reports + analytics', 'Ad platform connectors']} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {layers.map((layer) => (
          <article key={layer.title} className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-1">{layer.title}</h3>
            <p className="text-white/70 text-sm mb-4">{layer.description}</p>
            <div className="space-y-3">
              {layer.components.map((component) => (
                <div key={component.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="font-medium">{component.name}</div>
                  <div className="text-sm text-white/70">{component.purpose}</div>
                  {component.route ? <Link className="text-sm text-cyan-300" to={component.route}>Route: {component.route}</Link> : null}
                  {component.endpoint ? <div className="text-sm text-white/60">Ref: {component.endpoint}</div> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-3">Tech Stack Overview</h3>
          <div className="space-y-2">
            {techStack.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 px-3 py-2">
                <div className="text-sm text-white/60">{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-3">API & Documentation</h3>
          <div className="space-y-2 mb-4">
            {docs.map(([label, href]) => (
              <a key={label} href={href} className="block rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 transition">
                {label}
              </a>
            ))}
          </div>
          <div className="text-sm text-white/60">Primary API prefixes: /api/health, /api/workflows, /api/campaigns, /api/projects, /api/agents, /api/query, /api/reports, /api/connectors.</div>
        </article>
      </section>

      <section className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-3">Database Schema (Conceptual)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60 border-b border-white/10">
              <tr>
                <th className="py-2 pr-3">Table / Collection</th>
                <th className="py-2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {schemaTables.map(([table, description]) => (
                <tr key={table} className="border-b border-white/5">
                  <td className="py-2 pr-3 font-medium">{table}</td>
                  <td className="py-2 text-white/75">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
