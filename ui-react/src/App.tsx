import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
