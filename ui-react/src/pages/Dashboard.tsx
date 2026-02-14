import { PageHeader } from '../components/layout/PageHeader';
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
