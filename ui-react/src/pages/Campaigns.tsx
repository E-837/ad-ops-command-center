import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/data/MetricCard';
import { DataTable, type Column, type SortState } from '../components/data/DataTable';
import { ErrorBanner } from '../components/feedback/ErrorBanner';
import { Skeleton } from '../components/feedback/Skeleton';
import { CampaignFilterBar } from '../components/campaigns/CampaignFilterBar';
import { CampaignBulkActionBar } from '../components/campaigns/CampaignBulkActionBar';
import { NewCampaignModal } from '../components/campaigns/NewCampaignModal';
import { useBulkCampaignAction, useCampaigns, useCreateCampaign } from '../hooks/useCampaigns';
import type { Campaign } from '../types/campaign';
import { fmtCurrency, fmtPercent } from '../utils/format';

type CampaignRow = Record<string, unknown> & Campaign;

function pacingLabel(row: Campaign) {
  if (row.pacingStatus) return row.pacingStatus.replace('_', ' ');
  const budget = row.budget ?? 0;
  const spent = row.spent ?? row.metrics?.spend ?? 0;
  if (!budget) return 'unknown';
  const ratio = spent / budget;
  if (ratio < 0.8) return 'behind';
  if (ratio > 1.1) return 'ahead';
  return 'on track';
}

export function Campaigns() {
  const [dsp, setDsp] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SortState<CampaignRow>>({ key: 'name', direction: 'asc' });
  const [openCreate, setOpenCreate] = useState(false);

  const { data = [], isLoading, error } = useCampaigns({
    dsp: dsp === 'all' ? undefined : dsp,
    status: status === 'all' ? undefined : status,
  });
  const createMutation = useCreateCampaign();
  const bulkActionMutation = useBulkCampaignAction();

  const filtered = useMemo(() => {
    return data.filter((campaign) => {
      if (startDate && campaign.startDate && new Date(campaign.startDate) < new Date(startDate)) return false;
      if (endDate && campaign.endDate && new Date(campaign.endDate) > new Date(endDate)) return false;
      return true;
    });
  }, [data, endDate, startDate]);

  const rows: CampaignRow[] = useMemo(() => filtered.map((campaign) => ({ ...campaign })), [filtered]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const { key, direction } = sortState;
      const av = a[key];
      const bv = b[key];
      const mul = direction === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      return String(av ?? '').localeCompare(String(bv ?? '')) * mul;
    });
  }, [rows, sortState]);

  const columns: Column<CampaignRow>[] = [
    { key: 'name', header: 'Campaign' },
    {
      key: 'dsp',
      header: 'DSP',
      render: (row) => String(row.dsp ?? '').toUpperCase().replace('_', ' '),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <span className='px-2 py-1 rounded-full bg-white/10 text-xs'>{String(row.status)}</span>,
    },
    {
      key: 'spent',
      header: 'Spend',
      render: (row) => fmtCurrency(Number(row.spent ?? row.metrics?.spend ?? 0)),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (row) => fmtCurrency(Number(row.budget ?? row.dailyBudget ?? 0)),
    },
    {
      key: 'pacingStatus',
      header: 'Pacing',
      sortable: false,
      render: (row) => {
        const budget = Number(row.budget ?? 0);
        const spent = Number(row.spent ?? row.metrics?.spend ?? 0);
        const pct = budget > 0 ? (spent / budget) * 100 : Number(row.pacingPercent ?? 0);
        return `${pacingLabel(row)} (${fmtPercent(pct)})`;
      },
    },
  ];

  const totalSpend = filtered.reduce((sum, row) => sum + Number(row.spent ?? row.metrics?.spend ?? 0), 0);
  const totalBudget = filtered.reduce((sum, row) => sum + Number(row.budget ?? row.dailyBudget ?? 0), 0);

  if (isLoading) return <div className='space-y-2'><Skeleton /><Skeleton /></div>;
  if (error) return <ErrorBanner error={error as Error} />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Campaigns'
        subtitle='Manage campaigns across TTD, DV360, Amazon, Google Ads, and Meta'
        actions={<button className='px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20' onClick={() => setOpenCreate(true)}>New Campaign</button>}
      />

      <div className='grid md:grid-cols-3 gap-4'>
        <MetricCard label='Campaigns' value={String(filtered.length)} />
        <MetricCard label='Spend' value={fmtCurrency(totalSpend)} />
        <MetricCard label='Budget' value={fmtCurrency(totalBudget)} />
      </div>

      <CampaignFilterBar
        dsp={dsp}
        status={status}
        startDate={startDate}
        endDate={endDate}
        onChange={(next) => {
          if (next.dsp !== undefined) setDsp(next.dsp);
          if (next.status !== undefined) setStatus(next.status);
          if (next.startDate !== undefined) setStartDate(next.startDate);
          if (next.endDate !== undefined) setEndDate(next.endDate);
        }}
      />

      <CampaignBulkActionBar
        selectedCount={selectedIds.length}
        busy={bulkActionMutation.isPending}
        onAction={(action) => {
          bulkActionMutation.mutate({ ids: selectedIds, action }, {
            onSuccess: () => setSelectedIds([]),
          });
        }}
      />

      <div className='glass rounded-xl p-3 border border-white/10'>
        <DataTable
          data={sortedRows}
          columns={columns}
          rowId={(row) => row.id}
          sortState={sortState}
          onSort={(next) => setSortState(next)}
          selectedIds={selectedIds}
          onToggleRow={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onToggleAll={(ids) => setSelectedIds((prev) => (prev.length === ids.length ? [] : ids))}
        />
      </div>

      <NewCampaignModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        isSaving={createMutation.isPending}
        onCreate={(payload) => {
          createMutation.mutate(payload, { onSuccess: () => setOpenCreate(false) });
        }}
      />
    </div>
  );
}
