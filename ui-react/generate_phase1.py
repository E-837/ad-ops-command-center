import os, textwrap
root = r"C:/Users/RossS/.openclaw/workspace/projects/ad-ops-command/ui-react"
files = {
"src/main.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './theme.css';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
""",
"src/App.tsx": """import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Toast } from './components/feedback/Toast';
import { useSSE } from './hooks/useSSE';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Workflows } from './pages/Workflows';
import { WorkflowDetail } from './pages/WorkflowDetail';
import { Campaigns } from './pages/Campaigns';
import { Agents } from './pages/Agents';
import { Connectors } from './pages/Connectors';
import { Reports } from './pages/Reports';
import { Architecture } from './pages/Architecture';
import { Query } from './pages/Query';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <AppShell />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/projects', element: <Projects /> },
      { path: '/workflows', element: <Workflows /> },
      { path: '/workflows/:id', element: <WorkflowDetail /> },
      { path: '/campaigns', element: <Campaigns /> },
      { path: '/agents', element: <Agents /> },
      { path: '/connectors', element: <Connectors /> },
      { path: '/reports', element: <Reports /> },
      { path: '/architecture', element: <Architecture /> },
      { path: '/query', element: <Query /> },
    ],
  },
]);

function SSEBridge() {
  useSSE('/api/stream');
  return null;
}

export function App() {
  return (
    <>
      <SSEBridge />
      <RouterProvider router={router} />
      <Toast />
    </>
  );
}
""",
"src/theme.css": """:root {
  --bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --primary: #4CAF50;
  --secondary: #2196F3;
  --warning: #FF9800;
  --danger: #F44336;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.82);
  --text-muted: rgba(255, 255, 255, 0.68);
}
""",
"src/index.css": """@import \"tailwindcss\";
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg-gradient); color: var(--text-primary); }
.glass { background: var(--glass-bg); backdrop-filter: blur(10px); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); }
a { color: inherit; text-decoration: none; }
""",
"src/utils/cn.ts": """import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
""",
"src/utils/format.ts": """export const fmtCurrency = (v = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
export const fmtPercent = (v = 0) => `${v.toFixed(1)}%`;
""",
"src/utils/constants.ts": "export const API_BASE = '/api';\n",
"src/types/common.ts": """export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export type ApiEnvelope<T> = { success?: boolean; data?: T } & T;
""",
"src/api/client.ts": """import { ApiError } from '../types/common';
const API_BASE = '/api';
async function parse<T>(res: Response): Promise<T> { if (!res.ok) throw new ApiError(res.status, await res.text()); return res.json(); }
export async function apiGet<T>(path: string): Promise<T> { return parse(await fetch(`${API_BASE}${path}`)); }
export async function apiPost<T>(path: string, body: unknown): Promise<T> { return parse(await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); }
""",
"src/api/analytics.ts": """import { apiGet } from './client';
export async function getDashboard() { return apiGet<any>('/dashboard'); }
""",
"src/api/campaigns.ts": "export const getCampaigns = () => Promise.resolve([]);\n",
"src/api/workflows.ts": "export const getWorkflows = () => Promise.resolve([]);\n",
"src/api/projects.ts": "export const getProjects = () => Promise.resolve([]);\n",
"src/api/agents.ts": "export const getAgents = () => Promise.resolve([]);\n",
"src/api/connectors.ts": "export const getConnectors = () => Promise.resolve([]);\n",
"src/api/reports.ts": "export const getReports = () => Promise.resolve([]);\n",
"src/api/templates.ts": "export const getTemplates = () => Promise.resolve([]);\n",
"src/api/health.ts": "import { apiGet } from './client'; export const getHealth = () => apiGet('/health');\n",
"src/hooks/useSSE.ts": """import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
export function useSSE(url: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const es = new EventSource(url);
    es.addEventListener('workflow_update', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      qc.setQueryData(['workflows', data.id], (old: unknown) => ({ ...(old as object || {}), ...data }));
    });
    return () => es.close();
  }, [url, qc]);
}
""",
"src/hooks/useAnalytics.ts": "import { useQuery } from '@tanstack/react-query'; import { getDashboard } from '../api/analytics'; export const useAnalytics = () => useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, refetchInterval: 30000 });\n",
"src/hooks/useCampaigns.ts": "import { useQuery } from '@tanstack/react-query'; import { getCampaigns } from '../api/campaigns'; export const useCampaigns = () => useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns });\n",
"src/hooks/useWorkflows.ts": "import { useQuery } from '@tanstack/react-query'; import { getWorkflows } from '../api/workflows'; export const useWorkflows = () => useQuery({ queryKey: ['workflows'], queryFn: getWorkflows });\n",
"src/hooks/useProjects.ts": "import { useQuery } from '@tanstack/react-query'; import { getProjects } from '../api/projects'; export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: getProjects });\n",
"src/hooks/useAgents.ts": "import { useQuery } from '@tanstack/react-query'; import { getAgents } from '../api/agents'; export const useAgents = () => useQuery({ queryKey: ['agents'], queryFn: getAgents });\n",
"src/hooks/useConnectors.ts": "import { useQuery } from '@tanstack/react-query'; import { getConnectors } from '../api/connectors'; export const useConnectors = () => useQuery({ queryKey: ['connectors'], queryFn: getConnectors });\n",
"src/hooks/useHealth.ts": "import { useQuery } from '@tanstack/react-query'; import { getHealth } from '../api/health'; export const useHealth = () => useQuery({ queryKey: ['health'], queryFn: getHealth });\n",
"src/stores/ui.ts": """import { create } from 'zustand';
type ToastItem = { id: string; message: string; type: 'info' | 'success' | 'error' };
type UIState = { sidebarCollapsed: boolean; toasts: ToastItem[]; toggleSidebar: () => void; addToast: (message: string, type?: ToastItem['type']) => void; removeToast: (id: string) => void; };
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addToast: (message, type = 'info') => set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
""",
"src/stores/preferences.ts": """import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const usePreferencesStore = create<any>()(persist((set) => ({ theme: 'dark', tableDensity: 'comfortable', setDensity: (d: 'compact'|'comfortable') => set({ tableDensity: d }) }), { name: 'adops-preferences' }));
""",
"src/components/layout/AppShell.tsx": "import { Outlet } from 'react-router-dom'; import { Sidebar } from './Sidebar'; export function AppShell() { return <div className='min-h-screen flex'><Sidebar /><main className='flex-1 p-6 md:ml-60'><Outlet /></main></div>; }\n",
"src/components/layout/Sidebar.tsx": """import { NavLink } from 'react-router-dom';
const links = [['/dashboard','📊 Dashboard'],['/projects','📁 Projects'],['/workflows','⚡ Workflows'],['/campaigns','📈 Campaigns'],['/agents','🤖 Agents'],['/connectors','🔌 Connectors'],['/reports','📊 Reports'],['/architecture','🏗️ Architecture'],['/query','💬 Query']] as const;
export function Sidebar(){return <aside className='fixed w-60 h-screen p-5 glass hidden md:block'><h1 className='text-xl mb-6'>🎯 Ad Ops</h1><nav className='space-y-1'>{links.map(([to,label])=><NavLink key={to} to={to} className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive?'bg-white/10 text-white':'text-white/70 hover:bg-white/5'}`}>{label}</NavLink>)}</nav></aside>;}
""",
"src/components/layout/PageHeader.tsx": "import type { ReactNode } from 'react'; export function PageHeader({title,subtitle,actions}:{title:string;subtitle?:string;actions?:ReactNode}){return <header className='mb-6 flex items-start justify-between gap-4'><div><h2 className='text-2xl font-semibold'>{title}</h2>{subtitle&&<p className='text-white/70'>{subtitle}</p>}</div>{actions}</header>;}\n",
"src/components/layout/MobileNav.tsx": "export function MobileNav(){ return null; }\n",
"src/components/data/MetricCard.tsx": "import type { ReactNode } from 'react'; export function MetricCard({label,value,trend,icon}:{label:string;value:string;trend?:string;icon?:ReactNode}){return <div className='glass rounded-xl p-5'><div className='text-2xl'>{icon}</div><div className='text-2xl font-semibold'>{value}</div><div className='text-white/70'>{label}</div>{trend&&<div className='text-sm text-green-400'>{trend}</div>}</div>;}\n",
"src/components/data/DataTable.tsx": "import type { ReactNode } from 'react'; export type Column<T>={key:keyof T;header:string;render?:(row:T)=>ReactNode}; export function DataTable<T extends Record<string, unknown>>({data,columns}:{data:T[];columns:Column<T>[]}){return <table className='w-full text-left'><thead><tr>{columns.map(c=><th key={String(c.key)} className='p-2 text-white/70'>{c.header}</th>)}</tr></thead><tbody>{data.map((r,i)=><tr key={i} className='border-t border-white/10'>{columns.map(c=><td key={String(c.key)} className='p-2'>{c.render?c.render(r):String(r[c.key]??'')}</td>)}</tr>)}</tbody></table>;}\n",
"src/components/data/StatusBadge.tsx": "export function StatusBadge({status}:{status:'active'|'paused'|'error'|'draft'}){const color={active:'bg-green-500/20 text-green-300',paused:'bg-amber-500/20 text-amber-300',error:'bg-red-500/20 text-red-300',draft:'bg-white/10 text-white/70'}[status];return <span className={`px-2 py-1 rounded-full text-xs ${color}`}>{status}</span>;}\n",
"src/components/data/EmptyState.tsx": "import type { ReactNode } from 'react'; export function EmptyState({title,description,action}:{title:string;description:string;action?:ReactNode}){return <div className='glass rounded-xl p-6 text-center'><h3>{title}</h3><p className='text-white/70'>{description}</p>{action}</div>;}\n",
"src/components/charts/SpendChart.tsx": "import { LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer } from 'recharts'; export function SpendChart({data}:{data:Array<{name:string;value:number}>}){return <div className='glass rounded-xl p-4 h-72'><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke='rgba(255,255,255,0.1)'/><XAxis dataKey='name' stroke='rgba(255,255,255,0.6)'/><YAxis stroke='rgba(255,255,255,0.6)'/><Tooltip/><Line type='monotone' dataKey='value' stroke='#4CAF50' fill='rgba(76,175,80,0.1)'/></LineChart></ResponsiveContainer></div>;}\n",
"src/components/charts/PerformanceChart.tsx": "export function PerformanceChart(){ return <div className='glass rounded-xl p-4'>Performance chart placeholder</div>; }\n",
"src/components/charts/PacingGauge.tsx": "export function PacingGauge({value}:{value:number}){return <div className='glass rounded-xl p-4'>Pacing: {value}%</div>;}\n",
"src/components/feedback/Spinner.tsx": "export function Spinner(){return <div className='animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full'/>;}\n",
"src/components/feedback/Skeleton.tsx": "export function Skeleton({height='h-6'}:{height?:string}){return <div className={`animate-pulse bg-white/10 rounded ${height}`} />;}\n",
"src/components/feedback/ErrorBanner.tsx": "export function ErrorBanner({error}:{error:Error}){return <div className='glass rounded-xl p-4 border-red-400/40'>Error: {error.message}</div>;}\n",
"src/components/feedback/Toast.tsx": """import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/ui';
export function Toast() {
  const { toasts, removeToast } = useUIStore();
  useEffect(() => { toasts.forEach((t: any) => setTimeout(() => removeToast(t.id), 5000)); }, [toasts, removeToast]);
  return createPortal(<div className='fixed right-4 top-4 space-y-2'>{toasts.map((t: any)=><div key={t.id} className='glass rounded-lg px-3 py-2'>{t.message}</div>)}</div>, document.body);
}
""",
"src/components/forms/Button.tsx": "import type { ButtonHTMLAttributes } from 'react'; export function Button({className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className={`px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 ${className}`} {...props}/>;}\n",
"src/components/forms/Input.tsx": "import type { InputHTMLAttributes } from 'react'; export function Input(props:InputHTMLAttributes<HTMLInputElement>){return <input className='w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10' {...props}/>;}\n",
"src/components/forms/Select.tsx": "export function Select({options,value,onChange}:{options:string[];value:string;onChange:(v:string)=>void}){return <select value={value} onChange={(e)=>onChange(e.target.value)} className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;}\n",
"src/components/forms/Modal.tsx": "import type { ReactNode } from 'react'; export function Modal({open,title,children}:{open:boolean;title:string;children:ReactNode}){if(!open)return null; return <div className='fixed inset-0 bg-black/40 grid place-items-center'><div className='glass rounded-xl p-4 min-w-96'><h3>{title}</h3>{children}</div></div>;}\n",
"src/components/forms/ConfirmDialog.tsx": "import { Modal } from './Modal'; export function ConfirmDialog({open,title,onConfirm}:{open:boolean;title:string;onConfirm:()=>void}){return <Modal open={open} title={title}><button onClick={onConfirm}>Confirm</button></Modal>;}\n",
"src/components/forms/SearchInput.tsx": "export function SearchInput({value,onChange}:{value:string;onChange:(v:string)=>void}){return <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder='Search' className='px-3 py-2 rounded-lg bg-white/10 border border-white/10'/>;}\n",
"src/components/chat/ChatMessage.tsx": "export function ChatMessage({role,content}:{role:'user'|'assistant';content:string}){return <div className={`p-2 rounded-lg ${role==='user'?'bg-blue-500/20':'bg-white/10'}`}>{content}</div>;}\n",
"src/components/chat/StreamingText.tsx": "export function StreamingText({text}:{text:string}){return <span>{text}</span>;}\n",
"src/components/chat/ChatPanel.tsx": "import { ChatMessage } from './ChatMessage'; export function ChatPanel({messages}:{messages:Array<{role:'user'|'assistant';content:string}>}){return <div className='glass rounded-xl p-4 space-y-2'>{messages.map((m,i)=><ChatMessage key={i} {...m}/>)}</div>;}\n",
"src/pages/Dashboard.tsx": """import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/data/MetricCard';
import { SpendChart } from '../components/charts/SpendChart';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { useAnalytics } from '../hooks/useAnalytics';
import { fmtCurrency } from '../utils/format';

export function Dashboard() {
  const { data, isLoading, error } = useAnalytics();
  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;
  const activeCampaigns = (data?.campaigns || []).filter((c: any) => c.status === 'active').length;
  const totalSpend = (data?.pacing?.pacing || []).reduce((acc: number, p: any) => acc + (p.spent || 0), 0);
  const completed = (data?.executions || []).filter((e: any) => e.status === 'completed').length;
  const rate = (data?.executions?.length || 0) ? (completed / data.executions.length) * 100 : 0;
  return <div>
    <PageHeader title='📊 Dashboard' subtitle='Unified overview of projects, workflows, and campaigns' />
    <div className='grid gap-4 md:grid-cols-4 mb-6'>
      <MetricCard label='Active Campaigns' value={String(activeCampaigns)} />
      <MetricCard label='Total Spend' value={fmtCurrency(totalSpend)} />
      <MetricCard label='Workflow Success Rate' value={`${rate.toFixed(0)}%`} />
      <MetricCard label='Alerts' value={String((data?.pacing?.pacing || []).filter((p: any) => p.pacingPercent < 85 || p.pacingPercent > 115).length)} />
    </div>
    <SpendChart data={(data?.pacing?.pacing || []).slice(0, 8).map((p: any, i: number) => ({ name: p.dsp || `P${i+1}`, value: p.spent || 0 }))} />
  </div>;
}
""",
}
for p in ["Workflows","WorkflowDetail","Campaigns","Projects","Reports","Agents","Connectors","Architecture","Query"]:
  files[f"src/pages/{p}.tsx"] = f"import {{ PageHeader }} from '../components/layout/PageHeader'; export function {p}(){{return <div><PageHeader title='{p}' subtitle='Phase 1 scaffold' /></div>;}}\n"
files["src/pages/Landing.tsx"] = "import { Link } from 'react-router-dom'; export function Landing(){return <main className='min-h-screen grid place-items-center'><div className='glass rounded-xl p-8 text-center'><h1 className='text-3xl mb-2'>Ad Ops Command Center</h1><p className='text-white/70 mb-4'>React migration in progress.</p><Link to='/dashboard' className='px-4 py-2 rounded-lg bg-white/10 inline-block'>Go to Dashboard</Link></div></main>}\n"
extra = {
"tailwind.config.ts": "import type { Config } from 'tailwindcss';\nexport default { content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { primary:'#4CAF50', secondary:'#2196F3', warning:'#FF9800', danger:'#F44336', glass:{ bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.1)' } }, backgroundImage: { 'app-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }, fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'] } } } } satisfies Config;\n",
"postcss.config.js": "export default { plugins: { '@tailwindcss/postcss': {} } }\n",
"vite.config.ts": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins:[react()], server:{ port:5173, proxy:{ '/api':'http://localhost:3002' } }, build:{ outDir:'dist' } });\n",
}
for rel, content in {**files, **extra}.items():
  path = os.path.join(root, rel)
  os.makedirs(os.path.dirname(path), exist_ok=True)
  with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(textwrap.dedent(content))
