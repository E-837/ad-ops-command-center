# React Migration Architecture — Ad Ops Command Center

> Generated 2026-02-14. Opinionated spec for migrating 10 vanilla HTML/JS pages to React.

---

## 1. Technology Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| **Build** | **Vite 6** | Instant HMR, native ESM, trivial config. No SSR needed (internal tool). |
| **Language** | **TypeScript** (strict) | Catches bugs at build time; self-documenting props/API types. |
| **Routing** | **React Router v7** | De facto standard SPA router; nested layouts map perfectly to sidebar+page shell. |
| **State (server)** | **TanStack Query v5** | Automatic cache, refetch, SSE integration, loading/error states for free. |
| **State (client)** | **Zustand** | Tiny, no boilerplate, works outside React tree (SSE handlers). |
| **Styling** | **Tailwind CSS v4 + CSS custom properties** | Keep existing CSS variables (`--bg-gradient`, `--glass-bg`, etc.) in a `theme.css`; use Tailwind utilities everywhere else. No component library—custom glass-morphism components. |
| **Charts** | **Recharts** (wraps D3) | Declarative, composable, dark-theme friendly. Replace Chart.js. |
| **SSE** | **Custom hook + TanStack Query** | `useSSE` hook pumps events into query cache for real-time updates. |
| **Testing** | **Vitest + Testing Library** | Same Vite pipeline; fast, co-located tests. |
| **Linting** | **ESLint flat config + Prettier** | Consistency from day one. |

---

## 2. Directory Structure

```
projects/ad-ops-command/
├── ui-react/                    # ← New React app
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Router + providers
│   │   ├── theme.css            # CSS vars ported from styles.css
│   │   ├── index.css            # Tailwind directives + global resets
│   │   │
│   │   ├── api/                 # API layer (thin wrappers)
│   │   │   ├── client.ts        # Shared fetch with base URL, error handling
│   │   │   ├── campaigns.ts     # getCampaigns, createCampaign, etc.
│   │   │   ├── workflows.ts
│   │   │   ├── projects.ts
│   │   │   ├── agents.ts
│   │   │   ├── connectors.ts
│   │   │   ├── analytics.ts
│   │   │   ├── reports.ts
│   │   │   ├── templates.ts
│   │   │   └── health.ts
│   │   │
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useSSE.ts        # Generic SSE → query cache bridge
│   │   │   ├── useCampaigns.ts  # TanStack Query wrapper
│   │   │   ├── useWorkflows.ts
│   │   │   ├── useProjects.ts
│   │   │   ├── useAgents.ts
│   │   │   ├── useConnectors.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useHealth.ts
│   │   │
│   │   ├── stores/              # Zustand stores (client-only state)
│   │   │   ├── ui.ts            # Sidebar collapsed, theme, modals
│   │   │   └── preferences.ts   # Persisted user prefs (localStorage)
│   │   │
│   │   ├── components/          # Shared/reusable components
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx       # Sidebar + main area wrapper
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── PageHeader.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   ├── data/
│   │   │   │   ├── DataTable.tsx      # Sortable, filterable table
│   │   │   │   ├── MetricCard.tsx     # KPI card with trend
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── charts/
│   │   │   │   ├── SpendChart.tsx
│   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   └── PacingGauge.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── ErrorBanner.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── forms/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── SearchInput.tsx
│   │   │   └── chat/
│   │   │       ├── ChatPanel.tsx      # Reused by Agents + Query pages
│   │   │       ├── ChatMessage.tsx
│   │   │       └── StreamingText.tsx
│   │   │
│   │   ├── pages/               # Route-level components (one per page)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Workflows.tsx
│   │   │   ├── WorkflowDetail.tsx
│   │   │   ├── Campaigns.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Connectors.tsx
│   │   │   ├── Architecture.tsx
│   │   │   ├── Query.tsx
│   │   │   └── Landing.tsx
│   │   │
│   │   ├── types/               # Shared TypeScript types
│   │   │   ├── campaign.ts
│   │   │   ├── workflow.ts
│   │   │   ├── project.ts
│   │   │   ├── agent.ts
│   │   │   ├── connector.ts
│   │   │   └── common.ts        # Pagination, ApiError, etc.
│   │   │
│   │   └── utils/
│   │       ├── cn.ts            # clsx + tailwind-merge helper
│   │       ├── format.ts        # Currency, dates, numbers
│   │       └── constants.ts     # API_BASE, route paths
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .eslintrc.cjs
│
├── ui/                          # Old vanilla (keep until migration complete)
├── server.js                    # Update to proxy /api in dev, serve build in prod
└── package.json                 # Existing backend
```

---

## 3. Component Architecture by Page

### 3.1 Dashboard (`/dashboard`)

```
Dashboard
├── PageHeader (title, refresh button, time range selector)
├── MetricRow (4x MetricCard: active campaigns, total spend, ROAS, alerts)
├── SpendChart (line chart, last 30 days)
├── ProjectSummaryTable (top 5 projects with status)
├── WorkflowActivityFeed (recent executions, SSE-updated)
└── ConnectorStatusBar (health dots for each connector)
```

**Data flow:** `useAnalytics()` → pacing/insights endpoints. `useSSE('/api/stream')` pushes real-time events into query cache via `queryClient.setQueryData`.

### 3.2 Workflows (`/workflows`, `/workflows/:id`)

```
Workflows (list)
├── PageHeader + "New Workflow" button
├── SearchInput + status filter tabs (all/active/paused/failed)
├── DataTable (name, status, last run, next run, actions)
└── Modal → WorkflowForm (create/edit)

WorkflowDetail (/:id)
├── PageHeader (name, status badge, run/pause buttons)
├── StepTimeline (visual step-by-step, highlights current)
├── ExecutionLog (SSE-streamed log lines, auto-scroll)
├── ExecutionHistory (past runs table)
└── WorkflowConfig (JSON/form view of steps)
```

**SSE:** `useSSE('/api/stream')` filters events by `workflow_id`. Execution log renders `StreamingText` component that appends lines as they arrive.

### 3.3 Campaigns (`/campaigns`)

```
Campaigns
├── PageHeader + "New Campaign" button
├── FilterBar (project dropdown, status, platform, date range)
├── DataTable (sortable columns: name, project, platform, budget, spend, status)
│   └── Row actions: edit, pause, duplicate, delete
├── Modal → CampaignForm
└── BulkActionBar (when rows selected)
```

**Patterns:** `useCampaigns({ projectId, status, platform })` with query key including filters. Optimistic updates on status toggle.

### 3.4 Projects (`/projects`)

```
Projects
├── PageHeader + "New Project" button
├── ProjectGrid (card layout)
│   └── ProjectCard (name, client, campaign count, budget, status)
├── Modal → ProjectForm
└── ProjectDetail (drawer or sub-route)
    ├── ProjectInfo
    ├── CampaignList (filtered by project)
    └── WorkflowList (filtered by project)
```

**Shared with Campaigns:** Projects and Campaigns share types; `useCampaigns({ projectId })` reuses the same query hook.

### 3.5 Reports (`/reports`)

```
Reports
├── PageHeader
├── ReportTemplateSelector (saved report configs)
├── ReportBuilder
│   ├── MetricPicker (checkboxes: impressions, clicks, spend, ROAS, etc.)
│   ├── DimensionPicker (campaign, platform, date, project)
│   ├── DateRangePicker
│   └── FilterBar
├── ReportPreview (DataTable + charts)
└── ExportBar (CSV, PDF buttons)
```

**Approach:** Client-side report builder sends params to `/api/analytics/*` endpoints. Results cached in TanStack Query.

### 3.6 Agents (`/agents`)

```
Agents
├── PageHeader
├── AgentList (sidebar-style list of agents with status dots)
├── AgentDetail (selected agent)
│   ├── AgentInfo (capabilities, model, status)
│   ├── ChatPanel (A2A message history, SSE-streamed)
│   │   ├── ChatMessage (role-colored bubbles)
│   │   └── StreamingText (for in-progress responses)
│   └── AgentActions (restart, configure)
```

**Real-time:** `useSSE('/api/stream')` filters for agent message events. New messages appended to chat via `queryClient.setQueryData(['agents', id, 'messages'], ...)`.

### 3.7 Connectors (`/connectors`)

```
Connectors
├── PageHeader + "Refresh All" button
├── ConnectorGrid
│   └── ConnectorCard (platform icon, name, status, last sync, actions)
│       ├── StatusBadge (connected/disconnected/error)
│       └── "Test" / "Refresh" buttons
├── Modal → ConnectorConfig (API keys, settings)
└── SyncLog (recent sync activity)
```

**Refresh pattern:** Mutation `refreshConnector(id)` invalidates `['connectors']` query. Individual test calls `POST /api/connectors/:id/test`.

### 3.8 Architecture (`/architecture`)

```
Architecture
├── PageHeader
├── SystemDiagram (static SVG or simple interactive diagram)
├── ComponentList (accordion sections describing each layer)
└── TechStack (badges/cards for technologies used)
```

**Approach:** Mostly static content. SVG diagram embedded as React component for hover interactions. No API calls needed.

### 3.9 Query (`/query`)

```
Query
├── PageHeader
├── ChatPanel (full-page chat interface)
│   ├── ChatMessage (user + AI messages)
│   ├── StreamingText (AI response streaming)
│   └── QueryInput (textarea + send button)
├── SuggestedQueries (quick-start chips)
└── ResultPanel (structured data if query returns tables/charts)
```

**Streaming:** POST to query endpoint, read SSE/streaming response. `StreamingText` component handles incremental text rendering.

### 3.10 Landing (`/` — index)

```
Landing
├── Hero (title, subtitle, CTA to dashboard)
├── FeatureGrid (6 feature cards with icons)
├── MetricsShowcase (live stats from /api/health)
└── Footer
```

**Note:** No sidebar. Uses a different layout than other pages. React Router layout nesting handles this: Landing uses a bare layout, all other pages use `AppShell`.

---

## 4. Shared Component Specifications

### Layout

| Component | Props | Notes |
|-----------|-------|-------|
| `AppShell` | `children` | Sidebar + content area, handles mobile hamburger |
| `Sidebar` | `collapsed`, `onToggle` | Nav links, active state from `useLocation()` |
| `PageHeader` | `title`, `subtitle?`, `actions?: ReactNode` | Consistent page header |
| `MobileNav` | — | Hamburger + overlay, reads from `useUIStore` |

### Data Display

| Component | Props | Notes |
|-----------|-------|-------|
| `DataTable<T>` | `data: T[]`, `columns: Column<T>[]`, `onSort?`, `onRowClick?`, `selectable?` | Generic typed table with sort, select |
| `MetricCard` | `label`, `value`, `trend?`, `icon?` | Glass-morphism card |
| `StatusBadge` | `status: 'active'\|'paused'\|'error'\|'draft'` | Color-coded pill |
| `EmptyState` | `title`, `description`, `action?: ReactNode` | Friendly empty view |

### Forms

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size`, `loading?` | Glass-style button |
| `Input` | Standard + `label`, `error?` | Dark-themed input |
| `Select` | `options`, `value`, `onChange`, `label` | Custom dropdown |
| `Modal` | `open`, `onClose`, `title`, `children` | Overlay with backdrop blur |
| `SearchInput` | `value`, `onChange`, `placeholder` | With search icon, debounced |

### Feedback

| Component | Props | Notes |
|-----------|-------|-------|
| `Spinner` | `size?` | Simple CSS spinner |
| `Skeleton` | `width?`, `height?`, `rows?` | Pulse animation placeholder |
| `ErrorBanner` | `error: Error`, `onRetry?` | Dismissible error bar |
| `Toast` | — | Managed by Zustand store, renders portal |

### Chat (shared by Agents + Query)

| Component | Props | Notes |
|-----------|-------|-------|
| `ChatPanel` | `messages`, `onSend`, `streaming?`, `placeholder?` | Full chat interface |
| `ChatMessage` | `role`, `content`, `timestamp` | Styled message bubble |
| `StreamingText` | `text`, `complete?` | Typing indicator + incremental render |

---

## 5. State Management Strategy

```
┌─────────────────────────────────────────────┐
│              State Architecture              │
├──────────────┬──────────────────────────────┤
│ Layer        │ Tool          │ What          │
├──────────────┼──────────────┼──────────────┤
│ Server state │ TanStack Query│ Campaigns,    │
│              │               │ workflows,    │
│              │               │ projects,     │
│              │               │ agents,       │
│              │               │ connectors,   │
│              │               │ analytics     │
├──────────────┼──────────────┼──────────────┤
│ Real-time    │ SSE → Query  │ Execution logs,│
│              │ cache updates │ agent messages,│
│              │               │ status changes │
├──────────────┼──────────────┼──────────────┤
│ UI global    │ Zustand      │ Sidebar state, │
│              │ (useUIStore) │ active modals, │
│              │               │ toast queue    │
├──────────────┼──────────────┼──────────────┤
│ Preferences  │ Zustand +    │ Theme, table   │
│              │ localStorage │ density, etc.  │
├──────────────┼──────────────┼──────────────┤
│ UI local     │ useState     │ Form state,    │
│              │              │ filter inputs,  │
│              │              │ selections      │
└──────────────┴──────────────┴──────────────┘
```

### Key Rules
- **Never duplicate server state in Zustand.** If it comes from an API, it lives in TanStack Query.
- **SSE events mutate query cache directly.** No separate real-time store.
- **Zustand stores are tiny.** Two stores max: `useUIStore` and `usePreferencesStore`.

---

## 6. API Integration Pattern

### 6.1 API Client (`api/client.ts`)

```typescript
const API_BASE = '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// Similar for apiPut, apiDelete
```

### 6.2 Query Hooks Pattern

```typescript
// hooks/useCampaigns.ts
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => getCampaigns(filters),
    staleTime: 30_000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
```

### 6.3 SSE Integration

```typescript
// hooks/useSSE.ts
export function useSSE(url: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const es = new EventSource(url);

    es.addEventListener('workflow_update', (e) => {
      const data = JSON.parse(e.data);
      qc.setQueryData(['workflows', data.id], (old) => ({ ...old, ...data }));
    });

    es.addEventListener('agent_message', (e) => {
      const data = JSON.parse(e.data);
      qc.setQueryData(['agents', data.agentId, 'messages'], (old) =>
        [...(old ?? []), data]
      );
    });

    es.addEventListener('execution_log', (e) => {
      const data = JSON.parse(e.data);
      qc.setQueryData(['executions', data.executionId, 'logs'], (old) =>
        [...(old ?? []), data.line]
      );
    });

    return () => es.close();
  }, [url, qc]);
}
```

### 6.4 Endpoint Mapping

| Frontend Hook | HTTP Method | Backend Endpoint |
|---------------|-------------|-----------------|
| `useCampaigns` | GET | `/api/campaigns` |
| `useCreateCampaign` | POST | `/api/campaigns` |
| `useUpdateCampaign` | PUT | `/api/campaigns/:id` |
| `useDeleteCampaign` | DELETE | `/api/campaigns/:id` |
| `useWorkflows` | GET | `/api/workflows` |
| `useWorkflow(id)` | GET | `/api/workflows/:id` |
| `useRunWorkflow` | POST | `/api/workflows/:id/run` |
| `useProjects` | GET | `/api/projects` |
| `useAgents` | GET | `/api/agents` |
| `useConnectors` | GET | `/api/connectors` |
| `useRefreshConnector` | POST | `/api/connectors/:id/refresh` |
| `useAnalytics` | GET | `/api/analytics/*` |
| `usePacing` | GET | `/api/pacing` |
| `useInsights` | GET | `/api/insights` |
| `useHealth` | GET | `/api/health` |
| `useTemplates` | GET | `/api/templates` |
| SSE stream | GET (SSE) | `/api/stream` |

### 6.5 Error Handling

```typescript
// types/common.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// In components, use TanStack Query's error state:
// const { data, error, isLoading } = useCampaigns();
// if (error) return <ErrorBanner error={error} onRetry={refetch} />;
```

---

## 7. Migration Plan

### Phase 0 — Scaffold (Day 1)
- `npm create vite@latest ui-react -- --template react-ts`
- Install deps: `@tanstack/react-query`, `react-router-dom`, `zustand`, `recharts`, `tailwindcss`, `clsx`, `tailwind-merge`
- Port CSS variables from `ui/assets/styles.css` → `src/theme.css`
- Configure Vite proxy: `server.proxy['/api'] = 'http://localhost:3002'`
- Build `AppShell`, `Sidebar`, `PageHeader` — the layout skeleton
- Add router with all 10 routes (stub pages with just `<PageHeader>`)
- **Test:** App renders, sidebar navigates, all routes resolve

### Phase 1 — Landing + Dashboard (Days 2–3)
- `Landing.tsx` — static content + `/api/health` call
- `Dashboard.tsx` — `MetricCard`, charts, activity feed
- Build shared components as needed: `MetricCard`, `Spinner`, `Skeleton`, `ErrorBanner`
- Wire up `useSSE` hook for real-time dashboard updates
- **Test:** Dashboard shows live data, metrics update via SSE
- **Rollback:** Old `ui/` still served in parallel; just change static dir back

### Phase 2 — Campaigns + Projects (Days 4–5)
- `DataTable` component (generic, typed, sortable)
- `Campaigns.tsx` — full CRUD with filters
- `Projects.tsx` — grid + detail drawer
- `Modal`, `Button`, `Input`, `Select` form components
- **Test:** Create/edit/delete campaigns and projects

### Phase 3 — Workflows (Days 6–7)
- `Workflows.tsx` — list with status filters
- `WorkflowDetail.tsx` — step timeline + SSE execution log
- `StreamingText` component for live logs
- **Test:** Run workflow, watch execution stream in real-time

### Phase 4 — Agents + Query (Days 8–9)
- `ChatPanel`, `ChatMessage`, `StreamingText` (shared chat components)
- `Agents.tsx` — agent list + chat interface
- `Query.tsx` — NL query interface with streaming responses
- **Test:** Send agent messages, see real-time responses; query returns streamed results

### Phase 5 — Connectors + Reports + Architecture (Days 10–11)
- `Connectors.tsx` — card grid, test/refresh actions
- `Reports.tsx` — report builder with metric/dimension pickers
- `Architecture.tsx` — static diagram page
- **Test:** Connector refresh works, report builder generates results

### Phase 6 — Polish + Cutover (Days 12–14)
- Responsive design pass (mobile hamburger, table scroll)
- Toast notification system
- Loading skeletons on all pages
- Update `server.js`: production serves `ui-react/dist/`, add SPA fallback
- Run full regression against all API endpoints
- **Cutover:** `npm run build` in `ui-react/`, point server to `ui-react/dist/`
- **Rollback:** Revert `server.js` static dir to `ui/`

### Dependencies
```
Phase 0 (scaffold) → all phases
Phase 1 (shared components) → Phases 2-5 reuse MetricCard, Spinner, etc.
Phase 2 (DataTable, forms) → Phases 3, 5 reuse table and form components
Phase 4 (ChatPanel) → shared between Agents and Query
```

### Testing Strategy
- **Unit:** Vitest for utils, hooks (mock fetch)
- **Component:** Testing Library for interactive components (DataTable sort, Modal open/close)
- **Integration:** Each phase ends with manual smoke test against running backend
- **E2E (optional Phase 6):** Playwright for critical paths (create campaign, run workflow)

---

## 8. Implementation Handoff — Codex Spec

### Styling Guidelines

**Port these CSS variables to `src/theme.css`:**
```css
:root {
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
```

**Tailwind config must extend with these colors:**
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        secondary: '#2196F3',
        warning: '#FF9800',
        danger: '#F44336',
        glass: {
          bg: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.1)',
        },
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      },
    },
  },
};
```

**Glass-morphism pattern (use everywhere):**
```tsx
<div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
```

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3002',
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

### Server.js Update (Phase 6)

Add before the existing static UI routes:
```javascript
// SPA fallback for React app
if (isProduction) {
  const reactBuild = path.join(__dirname, 'ui-react', 'dist');
  app.use(express.static(reactBuild));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(reactBuild, 'index.html'));
  });
}
```

### Router Setup

```tsx
// App.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,  // No AppShell
  },
  {
    element: <AppShell />,  // Sidebar layout
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
```

### Critical Implementation Notes

1. **Sidebar active state:** Use `useLocation()` + `NavLink` with `className` callback. Match existing nav items exactly (same emoji + labels).

2. **DataTable must be generic:** `DataTable<T>` with typed column definitions. Every list page reuses it. Don't build page-specific tables.

3. **SSE connection is singleton:** One `EventSource` connection in `App.tsx` via `useSSE('/api/stream')`. All pages read from query cache—no per-page SSE connections.

4. **Forms use controlled components:** No form libraries (react-hook-form is overkill here). Simple `useState` + controlled inputs.

5. **No `useEffect` for data fetching.** TanStack Query handles everything. `useEffect` only for SSE setup and DOM side effects.

6. **Toast system:** Zustand store with `addToast(message, type)`. Rendered as portal in `App.tsx`. Auto-dismiss after 5s.

7. **Mobile breakpoint:** 768px, matching existing `responsive.css`. Sidebar collapses to overlay.

8. **Font stack:** Keep `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` in Tailwind config.

9. **Chart theme:** All Recharts components use `stroke="#4CAF50"` (primary) and `fill="rgba(76,175,80,0.1)"`. Grid lines `stroke="rgba(255,255,255,0.1)"`. No default Recharts colors.

10. **API base URL:** Always relative (`/api`). Vite proxy handles dev; production serves from same origin.
