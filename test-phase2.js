/**
 * Phase 2 Test Suite
 * Tests for UI, new workflows, orchestration, and automation
 */

const fs = require('fs');
const path = require('path');
const registry = require('./workflows/registry');
const executor = require('./executor');
const eventBus = require('./events/bus');
const eventTriggers = require('./events/triggers');
const cronJobs = require('./cron-jobs');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

console.log('\n🧪 Phase 2 Test Suite\n');
console.log('=' .repeat(60));

// ===== UI TESTS =====
console.log('\n📱 UI Components\n');

test('Sidebar component exists', () => {
  const sidebarPath = path.join(__dirname, 'ui', 'components', 'sidebar.html');
  if (!fs.existsSync(sidebarPath)) {
    throw new Error('Sidebar component not found');
  }
});

test('Projects page exists', () => {
  const projectsPath = path.join(__dirname, 'ui', 'projects.html');
  if (!fs.existsSync(projectsPath)) {
    throw new Error('Projects page not found');
  }
});

test('Workflows page exists', () => {
  const workflowsPath = path.join(__dirname, 'ui', 'workflows.html');
  if (!fs.existsSync(workflowsPath)) {
    throw new Error('Workflows page not found');
  }
});

test('Workflow detail page exists', () => {
  const detailPath = path.join(__dirname, 'ui', 'workflow-detail.html');
  if (!fs.existsSync(detailPath)) {
    throw new Error('Workflow detail page not found');
  }
});

test('Reports page exists (renamed from insights)', () => {
  const reportsPath = path.join(__dirname, 'ui', 'reports.html');
  if (!fs.existsSync(reportsPath)) {
    throw new Error('Reports page not found');
  }
});

test('Dashboard page exists (redesigned)', () => {
  const dashboardPath = path.join(__dirname, 'ui', 'dashboard.html');
  if (!fs.existsSync(dashboardPath)) {
    throw new Error('Dashboard page not found');
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  if (!content.includes('Active Projects') || !content.includes('Recent Executions')) {
    throw new Error('Dashboard missing new sections');
  }
});

// ===== WORKFLOW REGISTRY TESTS =====
console.log('\n📋 Workflow Registry\n');

test('Creative test workflow registered', () => {
  if (!registry.has('creative-test')) {
    throw new Error('creative-test workflow not registered');
  }
  
  const workflow = registry.getWorkflow('creative-test');
  if (workflow.meta.category !== 'campaign-ops') {
    throw new Error('creative-test has wrong category');
  }
});

test('Monthly report workflow registered', () => {
  if (!registry.has('monthly-report')) {
    throw new Error('monthly-report workflow not registered');
  }
  
  const workflow = registry.getWorkflow('monthly-report');
  if (workflow.meta.category !== 'reporting') {
    throw new Error('monthly-report has wrong category');
  }
  
  if (!workflow.meta.triggers.scheduled) {
    throw new Error('monthly-report missing scheduled trigger');
  }
});

test('Cross-channel report workflow registered', () => {
  if (!registry.has('cross-channel-report')) {
    throw new Error('cross-channel-report workflow not registered');
  }
});

test('Media plan execute workflow registered', () => {
  if (!registry.has('media-plan-execute')) {
    throw new Error('media-plan-execute workflow not registered');
  }
  
  const workflow = registry.getWorkflow('media-plan-execute');
  if (workflow.meta.category !== 'orchestration') {
    throw new Error('media-plan-execute has wrong category');
  }
  
  if (!workflow.meta.isOrchestrator) {
    throw new Error('media-plan-execute should be marked as orchestrator');
  }
});

test('Cross-channel launch workflow registered', () => {
  if (!registry.has('cross-channel-launch')) {
    throw new Error('cross-channel-launch workflow not registered');
  }
  
  const workflow = registry.getWorkflow('cross-channel-launch');
  if (workflow.meta.category !== 'orchestration') {
    throw new Error('cross-channel-launch has wrong category');
  }
});

test('All Phase 2 workflows have proper metadata', () => {
  const phase2Workflows = [
    'creative-test',
    'monthly-report',
    'cross-channel-report',
    'media-plan-execute',
    'cross-channel-launch'
  ];

  for (const workflowId of phase2Workflows) {
    const workflow = registry.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.meta.name) {
      throw new Error(`${workflowId} missing name`);
    }

    if (!workflow.meta.description) {
      throw new Error(`${workflowId} missing description`);
    }

    if (!workflow.meta.stages || workflow.meta.stages.length === 0) {
      throw new Error(`${workflowId} missing stages`);
    }
  }
});

test('Workflow categories populated correctly', () => {
  const categories = registry.getCategories();
  
  const campaignOps = categories.find(c => c.id === 'campaign-ops');
  if (!campaignOps.workflows.includes('creative-test')) {
    throw new Error('creative-test not in campaign-ops category');
  }

  const reporting = categories.find(c => c.id === 'reporting');
  if (!reporting.workflows.includes('monthly-report') || !reporting.workflows.includes('cross-channel-report')) {
    throw new Error('New reporting workflows not in reporting category');
  }

  const orchestration = categories.find(c => c.id === 'orchestration');
  if (!orchestration.workflows.includes('media-plan-execute') || !orchestration.workflows.includes('cross-channel-launch')) {
    throw new Error('Orchestration workflows not in orchestration category');
  }
});

// ===== WORKFLOW EXECUTION TESTS =====
console.log('\n⚡ Workflow Execution (Sandbox Mode)\n');

asyncTest('Creative test workflow executes', async () => {
  const mockContext = {
    updateStage: () => {},
    log: () => {}
  };

  const workflow = registry.getWorkflowModule('creative-test');
  const result = await workflow.run({
    campaignId: 'test-campaign',
    platform: 'google-ads',
    creativeVariants: [
      { name: 'Variant A', headline: 'Test A', description: 'Description A' },
      { name: 'Variant B', headline: 'Test B', description: 'Description B' }
    ],
    testDuration: 7
  }, mockContext);

  if (!result.success) {
    throw new Error('Creative test failed to execute');
  }

  if (!result.winner) {
    throw new Error('Creative test did not determine winner');
  }

  if (!result.recommendation) {
    throw new Error('Creative test did not generate recommendation');
  }
});

asyncTest('Monthly report workflow executes', async () => {
  const mockContext = {
    updateStage: () => {},
    log: () => {}
  };

  const workflow = registry.getWorkflowModule('monthly-report');
  const result = await workflow.run({
    month: '2026-02',
    platforms: ['google-ads', 'meta'],
    includeYoY: true,
    createDocument: false // Skip doc creation in test
  }, mockContext);

  if (!result.success) {
    throw new Error('Monthly report failed to execute');
  }

  if (!result.summary) {
    throw new Error('Monthly report did not generate summary');
  }

  if (!result.metrics) {
    throw new Error('Monthly report did not aggregate metrics');
  }

  if (!result.insights || result.insights.length === 0) {
    throw new Error('Monthly report did not generate insights');
  }
});

asyncTest('Cross-channel report workflow executes', async () => {
  const mockContext = {
    updateStage: () => {},
    log: () => {}
  };

  const workflow = registry.getWorkflowModule('cross-channel-report');
  const result = await workflow.run({
    startDate: '2026-02-01',
    endDate: '2026-02-10',
    platforms: ['google-ads', 'meta', 'dv360'],
    includeCharts: true
  }, mockContext);

  if (!result.success) {
    throw new Error('Cross-channel report failed to execute');
  }

  if (!result.metrics) {
    throw new Error('Cross-channel report did not normalize metrics');
  }

  if (!result.comparison) {
    throw new Error('Cross-channel report did not generate comparison');
  }

  if (!result.recommendations || result.recommendations.length === 0) {
    throw new Error('Cross-channel report did not generate recommendations');
  }

  if (!result.chartData) {
    throw new Error('Cross-channel report did not generate chart data');
  }
});

asyncTest('Media plan execute workflow orchestrates correctly', async () => {
  const mockContext = {
    updateStage: () => {},
    log: () => {}
  };

  const workflow = registry.getWorkflowModule('media-plan-execute');
  
  // Test with structured media plan data
  const mediaPlan = {
    campaignName: 'Test Campaign',
    totalBudget: 100000,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    tactics: [
      { channel: 'search', platform: 'google-ads', budget: 50000 },
      { channel: 'social', platform: 'meta', budget: 50000 }
    ]
  };

  const result = await workflow.run({
    mediaPlanData: mediaPlan,
    projectId: 'test-project',
    autoLaunch: false
  }, mockContext);

  if (!result.executions || result.executions.length === 0) {
    throw new Error('Media plan execute did not launch any workflows');
  }

  if (!result.report) {
    throw new Error('Media plan execute did not generate report');
  }
});

asyncTest('Cross-channel launch workflow distributes budget correctly', async () => {
  const mockContext = {
    updateStage: () => {},
    log: () => {}
  };

  const workflow = registry.getWorkflowModule('cross-channel-launch');
  const result = await workflow.run({
    campaignName: 'Test Multi-Channel Campaign',
    budget: 100000,
    platforms: ['google-ads', 'meta', 'dv360'],
    creative: {
      headline: 'Test Headline',
      description: 'Test Description',
      images: []
    },
    targeting: {
      locations: ['US'],
      demographics: ['25-54']
    },
    budgetStrategy: 'equal'
  }, mockContext);

  if (!result.budgetDistribution) {
    throw new Error('Cross-channel launch did not distribute budget');
  }

  const totalDistributed = Object.values(result.budgetDistribution).reduce((sum, b) => sum + b, 0);
  if (Math.abs(totalDistributed - 100000) > 10) {
    throw new Error('Budget distribution does not match total budget');
  }

  if (!result.launches || result.launches.length !== 3) {
    throw new Error('Cross-channel launch did not launch on all platforms');
  }
});

// ===== EVENT TRIGGERS TESTS =====
console.log('\n🎯 Event-Driven Triggers\n');

test('Event triggers file exists', () => {
  const triggersPath = path.join(__dirname, 'events', 'triggers.js');
  if (!fs.existsSync(triggersPath)) {
    throw new Error('Event triggers file not found');
  }
});

test('Event triggers can be initialized', () => {
  // This should not throw
  eventTriggers.initializeTriggers();
  
  const activeTriggers = eventTriggers.getActiveTriggers();
  if (activeTriggers.length === 0) {
    throw new Error('No triggers registered');
  }
});

test('Event triggers registered for known events', () => {
  const activeTriggers = eventTriggers.getActiveTriggers();
  
  const requiredTriggers = [
    'metric.threshold',
    'plan.created',
    'plan.approved',
    'budget.depleted',
    'campaign.approved'
  ];

  for (const eventType of requiredTriggers) {
    if (!activeTriggers.includes(eventType)) {
      throw new Error(`Event trigger for "${eventType}" not registered`);
    }
  }
});

test('Auto-register workflow event triggers', () => {
  eventTriggers.autoRegisterWorkflowTriggers();
  
  const activeTriggers = eventTriggers.getActiveTriggers();
  
  // media-plan-execute has event triggers
  const workflow = registry.getWorkflow('media-plan-execute');
  if (workflow.meta.triggers.events && workflow.meta.triggers.events.length > 0) {
    for (const eventType of workflow.meta.triggers.events) {
      if (!activeTriggers.includes(eventType)) {
        throw new Error(`Auto-register failed for event "${eventType}"`);
      }
    }
  }
});

// ===== CRON JOB TESTS =====
console.log('\n⏰ Scheduled Triggers (Cron Jobs)\n');

test('Cron jobs file exists', () => {
  const cronPath = path.join(__dirname, 'cron-jobs.js');
  if (!fs.existsSync(cronPath)) {
    throw new Error('Cron jobs file not found');
  }
});

test('Cron jobs can be initialized', () => {
  // This should not throw
  cronJobs.initializeCronJobs();
  
  const activeJobs = cronJobs.getActiveCronJobs();
  if (activeJobs.length === 0) {
    throw new Error('No cron jobs scheduled');
  }
});

test('Cron jobs registered for known schedules', () => {
  const activeJobs = cronJobs.getActiveCronJobs();
  
  const requiredJobs = [
    'daily-pacing-check',
    'weekly-review',
    'monthly-report'
  ];

  for (const jobName of requiredJobs) {
    const job = activeJobs.find(j => j.name === jobName);
    if (!job) {
      throw new Error(`Cron job "${jobName}" not scheduled`);
    }
  }
});

test('Auto-register workflow scheduled triggers', () => {
  cronJobs.autoRegisterWorkflowCrons();
  
  const activeJobs = cronJobs.getActiveCronJobs();
  
  // monthly-report has scheduled trigger
  const workflow = registry.getWorkflow('monthly-report');
  if (workflow.meta.triggers.scheduled) {
    const jobName = `auto-${workflow.meta.id}`;
    const job = activeJobs.find(j => j.name === jobName);
    if (!job) {
      throw new Error(`Auto-register failed for workflow "${workflow.meta.id}"`);
    }
  }
});

// ===== BACKEND FILES TESTS =====
console.log('\n🔧 Backend Files\n');

test('Server.js includes new routes', () => {
  const serverPath = path.join(__dirname, 'server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  if (!content.includes('/projects') || !content.includes('/workflows')) {
    throw new Error('Server missing new UI routes');
  }
  
  if (!content.includes('eventTriggers') || !content.includes('cronJobs')) {
    throw new Error('Server not initializing automation');
  }
});

test('Workflows index includes Phase 2 workflows', () => {
  const indexPath = path.join(__dirname, 'workflows', 'index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  const phase2Workflows = [
    'creative-test',
    'monthly-report',
    'cross-channel-report',
    'media-plan-execute',
    'cross-channel-launch'
  ];

  for (const workflowId of phase2Workflows) {
    if (!content.includes(workflowId)) {
      throw new Error(`Workflow index missing ${workflowId}`);
    }
  }
});

// ===== CLEANUP =====
console.log('\n🧹 Cleanup\n');

test('Cleanup event triggers', () => {
  eventTriggers.cleanup();
  const activeTriggers = eventTriggers.getActiveTriggers();
  if (activeTriggers.length !== 0) {
    throw new Error('Event triggers not cleaned up');
  }
});

test('Cleanup cron jobs', () => {
  cronJobs.cleanup();
  const activeJobs = cronJobs.getActiveCronJobs();
  if (activeJobs.length !== 0) {
    throw new Error('Cron jobs not cleaned up');
  }
});

// ===== RESULTS =====
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results\n');
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
}
