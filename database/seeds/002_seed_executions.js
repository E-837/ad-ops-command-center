/**
 * Seed: Sample executions
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('executions').del();
  
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Insert seed entries
  await knex('executions').insert([
    {
      id: 'exec-seed-001',
      projectId: 'proj-seed-001',
      workflowId: 'create-campaign',
      status: 'completed',
      params: JSON.stringify({
        platform: 'meta-ads',
        campaignName: 'Q1 Brand Campaign',
        budget: 50000
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Validate Budget', status: 'completed', agent: 'analyst', startedAt: lastWeek, completedAt: lastWeek, result: { validated: true } },
        { id: 'stage-2', name: 'Create Campaign', status: 'completed', agent: 'social-media-buyer', startedAt: lastWeek, completedAt: lastWeek, result: { campaignId: 'camp-001' } }
      ]),
      result: JSON.stringify({ campaignId: 'camp-001', success: true }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 4500,
      startedAt: lastWeek,
      completedAt: lastWeek,
      createdAt: lastWeek
    },
    {
      id: 'exec-seed-002',
      projectId: 'proj-seed-001',
      workflowId: 'pacing-check',
      status: 'completed',
      params: JSON.stringify({
        campaignId: 'camp-001',
        platform: 'meta-ads'
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Fetch Metrics', status: 'completed', agent: 'analyst', startedAt: yesterday, completedAt: yesterday, result: { spend: 15000, target: 17000 } },
        { id: 'stage-2', name: 'Analyze Pacing', status: 'completed', agent: 'analyst', startedAt: yesterday, completedAt: yesterday, result: { status: 'underpacing', recommendation: 'increase-budget' } }
      ]),
      result: JSON.stringify({ status: 'underpacing', actionNeeded: true }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 2200,
      startedAt: yesterday,
      completedAt: yesterday,
      createdAt: yesterday
    },
    {
      id: 'exec-seed-003',
      projectId: 'proj-seed-002',
      workflowId: 'campaign-optimization',
      status: 'completed',
      params: JSON.stringify({
        campaignId: 'camp-002',
        platform: 'google-ads',
        optimizationType: 'keywords'
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Analyze Performance', status: 'completed', agent: 'analyst', startedAt: lastWeek, completedAt: lastWeek },
        { id: 'stage-2', name: 'Generate Recommendations', status: 'completed', agent: 'programmatic-trader', startedAt: lastWeek, completedAt: lastWeek },
        { id: 'stage-3', name: 'Apply Changes', status: 'completed', agent: 'programmatic-trader', startedAt: lastWeek, completedAt: lastWeek }
      ]),
      result: JSON.stringify({ optimized: true, changesMade: 5 }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 8900,
      startedAt: lastWeek,
      completedAt: lastWeek,
      createdAt: lastWeek
    },
    {
      id: 'exec-seed-004',
      projectId: 'proj-seed-004',
      workflowId: 'dsp-migration',
      status: 'failed',
      params: JSON.stringify({
        sourceSystem: 'TTD',
        targetSystem: 'DV360',
        campaignIds: ['ttd-123', 'ttd-456']
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Export from TTD', status: 'completed', agent: 'programmatic-specialist', startedAt: yesterday, completedAt: yesterday },
        { id: 'stage-2', name: 'Transform Data', status: 'completed', agent: 'programmatic-specialist', startedAt: yesterday, completedAt: yesterday },
        { id: 'stage-3', name: 'Import to DV360', status: 'failed', agent: 'programmatic-specialist', startedAt: yesterday, completedAt: yesterday, error: 'API rate limit exceeded' }
      ]),
      result: null,
      error: 'API rate limit exceeded during import',
      artifacts: JSON.stringify([]),
      duration: 6700,
      startedAt: yesterday,
      completedAt: yesterday,
      createdAt: yesterday
    },
    {
      id: 'exec-seed-005',
      projectId: 'proj-seed-003',
      workflowId: 'create-campaign',
      status: 'running',
      params: JSON.stringify({
        platform: 'pinterest',
        campaignName: 'Product Launch Campaign',
        budget: 30000
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Validate Budget', status: 'completed', agent: 'analyst', startedAt: now, completedAt: now },
        { id: 'stage-2', name: 'Create Campaign', status: 'running', agent: 'social-media-buyer', startedAt: now, completedAt: null }
      ]),
      result: null,
      error: null,
      artifacts: JSON.stringify([]),
      duration: null,
      startedAt: now,
      completedAt: null,
      createdAt: now
    },
    {
      id: 'exec-seed-006',
      projectId: null,
      workflowId: 'health-check',
      status: 'completed',
      params: JSON.stringify({
        checkType: 'system'
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Check Connectors', status: 'completed', agent: 'system', startedAt: yesterday, completedAt: yesterday, result: { allHealthy: true } }
      ]),
      result: JSON.stringify({ status: 'healthy', allSystemsOperational: true }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 1200,
      startedAt: yesterday,
      completedAt: yesterday,
      createdAt: yesterday
    },
    {
      id: 'exec-seed-007',
      projectId: 'proj-seed-001',
      workflowId: 'performance-report',
      status: 'completed',
      params: JSON.stringify({
        campaignId: 'camp-001',
        reportType: 'weekly'
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Fetch Data', status: 'completed', agent: 'analyst', startedAt: lastWeek, completedAt: lastWeek },
        { id: 'stage-2', name: 'Generate Report', status: 'completed', agent: 'analyst', startedAt: lastWeek, completedAt: lastWeek }
      ]),
      result: JSON.stringify({ reportGenerated: true, insights: ['Good CTR', 'Budget on track'] }),
      error: null,
      artifacts: JSON.stringify([{ type: 'report', url: '/reports/weekly-001.pdf', name: 'Weekly Report' }]),
      duration: 3400,
      startedAt: lastWeek,
      completedAt: lastWeek,
      createdAt: lastWeek
    },
    {
      id: 'exec-seed-008',
      projectId: 'proj-seed-002',
      workflowId: 'budget-alert',
      status: 'completed',
      params: JSON.stringify({
        threshold: 90
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Check Budget Usage', status: 'completed', agent: 'analyst', startedAt: yesterday, completedAt: yesterday, result: { usage: 95, alert: true } }
      ]),
      result: JSON.stringify({ alertTriggered: true, usagePercent: 95 }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 800,
      startedAt: yesterday,
      completedAt: yesterday,
      createdAt: yesterday
    },
    {
      id: 'exec-seed-009',
      projectId: null,
      workflowId: 'connector-sync',
      status: 'completed',
      params: JSON.stringify({
        platforms: ['meta-ads', 'google-ads']
      }),
      stages: JSON.stringify([
        { id: 'stage-1', name: 'Sync Meta Ads', status: 'completed', agent: 'system', startedAt: now, completedAt: now },
        { id: 'stage-2', name: 'Sync Google Ads', status: 'completed', agent: 'system', startedAt: now, completedAt: now }
      ]),
      result: JSON.stringify({ synced: true, campaignsSynced: 8 }),
      error: null,
      artifacts: JSON.stringify([]),
      duration: 5600,
      startedAt: now,
      completedAt: now,
      createdAt: now
    },
    {
      id: 'exec-seed-010',
      projectId: 'proj-seed-004',
      workflowId: 'dsp-migration',
      status: 'queued',
      params: JSON.stringify({
        sourceSystem: 'TTD',
        targetSystem: 'DV360',
        campaignIds: ['ttd-789']
      }),
      stages: JSON.stringify([]),
      result: null,
      error: null,
      artifacts: JSON.stringify([]),
      duration: null,
      startedAt: null,
      completedAt: null,
      createdAt: now
    }
  ]);
  
  console.log('✅ Seeded 10 sample executions');
};
