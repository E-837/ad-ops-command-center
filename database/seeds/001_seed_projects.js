/**
 * Seed: Sample projects
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('projects').del();
  
  const now = new Date().toISOString();
  
  // Insert seed entries
  await knex('projects').insert([
    {
      id: 'proj-seed-001',
      name: 'Q1 2026 Brand Awareness Campaign',
      type: 'campaign',
      status: 'active',
      owner: 'social-media-buyer',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      budget: 50000,
      platform: 'meta-ads',
      metadata: JSON.stringify({
        targetAudience: 'millennials',
        objectives: ['brand awareness', 'engagement']
      }),
      milestones: JSON.stringify([
        { name: 'Campaign Launch', status: 'completed', date: '2026-01-01' },
        { name: 'Mid-campaign Review', status: 'pending', date: '2026-02-15' },
        { name: 'Final Optimization', status: 'pending', date: '2026-03-15' }
      ]),
      artifacts: JSON.stringify([]),
      metrics: JSON.stringify({
        completion: 60,
        health: 'on-track',
        blockers: []
      }),
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-seed-002',
      name: 'Holiday Shopping Campaign - Google',
      type: 'campaign',
      status: 'completed',
      owner: 'programmatic-trader',
      startDate: '2025-11-15',
      endDate: '2025-12-31',
      budget: 100000,
      platform: 'google-ads',
      metadata: JSON.stringify({
        targetAudience: 'shoppers',
        objectives: ['conversions', 'sales']
      }),
      milestones: JSON.stringify([
        { name: 'Campaign Launch', status: 'completed', date: '2025-11-15' },
        { name: 'Black Friday Optimization', status: 'completed', date: '2025-11-24' },
        { name: 'End of Campaign', status: 'completed', date: '2025-12-31' }
      ]),
      artifacts: JSON.stringify([]),
      metrics: JSON.stringify({
        completion: 100,
        health: 'completed',
        blockers: []
      }),
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-seed-003',
      name: 'Pinterest Product Launch',
      type: 'campaign',
      status: 'planning',
      owner: 'social-media-buyer',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      budget: 30000,
      platform: 'pinterest',
      metadata: JSON.stringify({
        targetAudience: 'women 25-45',
        objectives: ['product awareness', 'traffic']
      }),
      milestones: JSON.stringify([
        { name: 'Creative Development', status: 'in-progress', date: '2026-02-15' },
        { name: 'Campaign Launch', status: 'pending', date: '2026-03-01' }
      ]),
      artifacts: JSON.stringify([]),
      metrics: JSON.stringify({
        completion: 25,
        health: 'on-track',
        blockers: []
      }),
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-seed-004',
      name: 'DSP Migration - TTD to DV360',
      type: 'migration',
      status: 'active',
      owner: 'programmatic-specialist',
      startDate: '2026-02-01',
      endDate: '2026-03-15',
      budget: null,
      platform: 'multiple',
      metadata: JSON.stringify({
        sourceSystem: 'TTD',
        targetSystem: 'DV360',
        campaignCount: 12
      }),
      milestones: JSON.stringify([
        { name: 'Planning Complete', status: 'completed', date: '2026-01-31' },
        { name: 'Data Export', status: 'in-progress', date: '2026-02-10' },
        { name: 'Import & Test', status: 'pending', date: '2026-02-20' }
      ]),
      artifacts: JSON.stringify([]),
      metrics: JSON.stringify({
        completion: 40,
        health: 'at-risk',
        blockers: ['API rate limits', 'Data mapping issues']
      }),
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'proj-seed-005',
      name: 'Asana Integration JBP',
      type: 'jbp',
      status: 'paused',
      owner: 'asana-project-manager',
      startDate: '2026-01-15',
      endDate: null,
      budget: null,
      platform: 'asana',
      metadata: JSON.stringify({
        stakeholders: ['Marketing', 'Product', 'Engineering']
      }),
      milestones: JSON.stringify([
        { name: 'Requirements Gathering', status: 'completed', date: '2026-01-20' },
        { name: 'Technical Planning', status: 'paused', date: '2026-02-01' }
      ]),
      artifacts: JSON.stringify([]),
      metrics: JSON.stringify({
        completion: 15,
        health: 'blocked',
        blockers: ['Waiting for stakeholder approval']
      }),
      createdAt: now,
      updatedAt: now
    }
  ]);
  
  console.log('✅ Seeded 5 sample projects');
};
