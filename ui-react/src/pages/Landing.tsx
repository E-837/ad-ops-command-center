import { Link } from 'react-router-dom';
import { useHealth } from '../hooks/useHealth';

const primaryLinks = [
  ['/dashboard', 'View Dashboard'],
  ['/workflows', 'Open Workflows'],
  ['/campaigns', 'Manage Campaigns'],
  ['/query', 'Try AI Query'],
] as const;

const featureCards = [
  ['⚡ Workflow Automation', 'Design and execute repeatable ad ops pipelines with visibility into every run.'],
  ['📈 Campaign Intelligence', 'Track pacing, spend, and performance to prevent budget drift.'],
  ['🤖 Agent-Powered Ops', 'Use AI agents and A2A flows to accelerate decisions and execution.'],
  ['🔌 Unified Connectors', 'Integrate ad platforms and data sources through one operations layer.'],
  ['📊 Reporting Hub', 'Generate reports quickly with reusable filters and output templates.'],
  ['🏗️ Transparent Architecture', 'See exactly how modules, APIs, and storage layers fit together.'],
] as const;

const quickStart = [
  ['1', 'Go to Dashboard for live platform status'],
  ['2', 'Create or open a Project to scope campaign work'],
  ['3', 'Launch a Workflow and monitor execution in real time'],
  ['4', 'Use Query/Agents for operational analysis and automation'],
] as const;

export function Landing() {
  const { data } = useHealth();
  const healthData = (data ?? {}) as Record<string, unknown>;

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="glass rounded-2xl p-8 md:p-10">
          <p className="text-sm uppercase tracking-widest text-cyan-300 mb-3">Ad Ops Command Center</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Operate campaigns, workflows, and AI agents from one control plane.</h1>
          <p className="text-white/75 max-w-3xl mb-6">
            A modern ad operations platform for orchestration, monitoring, and intelligent optimization across projects, connectors, and reporting.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link to="/dashboard" className="rounded-lg bg-white text-slate-900 px-4 py-2 font-semibold hover:bg-white/90 transition">Get Started</Link>
            <Link to="/architecture" className="rounded-lg border border-white/25 px-4 py-2 hover:bg-white/5 transition">View Architecture</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {primaryLinks.map(([to, label]) => (
              <Link key={to} to={to} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/5 transition">
                {label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="glass rounded-xl p-5">
            <div className="text-sm text-white/60">Status</div>
            <div className="text-2xl font-semibold mt-1">{String(healthData.status ?? 'unknown')}</div>
          </article>
          <article className="glass rounded-xl p-5">
            <div className="text-sm text-white/60">Environment</div>
            <div className="text-2xl font-semibold mt-1">{String(healthData.environment ?? 'dev')}</div>
          </article>
          <article className="glass rounded-xl p-5">
            <div className="text-sm text-white/60">Service</div>
            <div className="text-2xl font-semibold mt-1">{String(healthData.service ?? 'ad-ops')}</div>
          </article>
        </section>

        <section className="glass rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Feature Highlights</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(([title, description]) => (
              <article key={title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/70">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="glass rounded-xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
            <div className="space-y-3">
              {quickStart.map(([step, text]) => (
                <div key={step} className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-sm">{step}</span>
                  <span className="text-white/80">{text}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">Explore Modules</h2>
            <div className="space-y-2 text-sm">
              {['/projects', '/agents', '/connectors', '/reports', '/query'].map((route) => (
                <Link key={route} to={route} className="block rounded-md border border-white/10 px-3 py-2 hover:bg-white/5">{route}</Link>
              ))}
            </div>
          </article>
        </section>

        <footer className="text-center text-sm text-white/50 py-2">Ad Ops Command Center • React UI Migration Complete</footer>
      </div>
    </main>
  );
}
