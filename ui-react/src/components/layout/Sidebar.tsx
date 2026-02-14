import { NavLink } from 'react-router-dom';

const links = [
  ['/', '🏠 Home'],
  ['/dashboard', '📊 Dashboard'],
  ['/projects', '📁 Projects'],
  ['/workflows', '⚡ Workflows'],
  ['/campaigns', '📈 Campaigns'],
  ['/agents', '🤖 Agents'],
  ['/connectors', '🔌 Connectors'],
  ['/reports', '📊 Reports'],
  ['/architecture', '🏗️ Architecture'],
  ['/query', '💬 Query'],
] as const;

export function Sidebar() {
  return (
    <aside className="fixed hidden h-screen w-60 p-5 md:block glass">
      <h1 className="mb-2 text-xl">🎯 Ad Ops</h1>
      <p className="mb-6 text-xs text-white/60">Command Center</p>
      <nav className="space-y-1">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
