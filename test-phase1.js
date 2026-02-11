/**
 * Phase 1 Implementation Tests
 * Tests for workflow registry, event system, project model, and new workflows
 */

const workflows = require('./workflows');
const eventBus = require('./events/bus');
const eventTypes = require('./events/types');
const projects = require('./database/projects');
const executions = require('./database/executions');
const events = require('./database/events');
const asanaProjectManager = require('./agents/asana-project-manager');

console.log('\n🧪 Phase 1 Implementation Tests\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// --- Test 1: Backward Compatibility ---
console.log('\n📦 Test Suite 1: Backward Compatibility');
console.log('-'.repeat(60));

test('workflows.getWorkflow() still works', () => {
  const workflow = workflows.getWorkflow('campaign-launch');
  if (!workflow) throw new Error('getWorkflow returned null');
  if (!workflow.run) throw new Error('workflow missing run function');
});

test('workflows.getAllWorkflows() still works', () => {
  const all = workflows.getAllWorkflows();
  if (!Array.isArray(all)) throw new Error('getAllWorkflows did not return array');
  if (all.length < 5) throw new Error('Expected at least 5 workflows');
});

test('workflows.WORKFLOWS map still accessible', () => {
  if (!workflows.WORKFLOWS) throw new Error('WORKFLOWS map not exported');
  if (!workflows.WORKFLOWS['campaign-launch']) throw new Error('campaign-launch not in WORKFLOWS');
});

asyncTest('workflows.runWorkflow() still works', async () => {
  // Test with a lightweight workflow
  const result = await workflows.runWorkflow('pacing-check', {});
  if (!result) throw new Error('runWorkflow returned null');
  if (!result.summary) throw new Error('Expected summary in result');
});

// --- Test 2: Workflow Registry ---
console.log('\n📋 Test Suite 2: Workflow Registry');
console.log('-'.repeat(60));

test('Registry accessible via getRegistry()', () => {
  const registry = workflows.getRegistry();
  if (!registry) throw new Error('getRegistry returned null');
});

test('Registry has getAllWorkflows()', () => {
  const registry = workflows.getRegistry();
  const all = registry.getAllWorkflows();
  if (!Array.isArray(all)) throw new Error('getAllWorkflows did not return array');
  if (all.length < 7) throw new Error('Expected at least 7 workflows (including new ones)');
});

test('Registry has getByCategory()', () => {
  const registry = workflows.getRegistry();
  const campaignOps = registry.getByCategory('campaign-ops');
  if (!Array.isArray(campaignOps)) throw new Error('getByCategory did not return array');
  if (campaignOps.length < 1) throw new Error('Expected workflows in campaign-ops category');
});

test('Registry has getByTriggerType()', () => {
  const registry = workflows.getRegistry();
  const manual = registry.getByTriggerType('manual');
  if (!Array.isArray(manual)) throw new Error('getByTriggerType did not return array');
  if (manual.length < 1) throw new Error('Expected manual workflows');
});

test('Registry has getCategories()', () => {
  const registry = workflows.getRegistry();
  const categories = registry.getCategories();
  if (!Array.isArray(categories)) throw new Error('getCategories did not return array');
  const catIds = categories.map(c => c.id);
  if (!catIds.includes('campaign-ops')) throw new Error('Missing campaign-ops category');
  if (!catIds.includes('projects')) throw new Error('Missing projects category');
  if (!catIds.includes('reporting')) throw new Error('Missing reporting category');
});

test('Registry stats()', () => {
  const registry = workflows.getRegistry();
  const stats = registry.getStats();
  if (!stats.totalWorkflows) throw new Error('Stats missing totalWorkflows');
  if (!stats.byCategory) throw new Error('Stats missing byCategory');
  if (stats.totalWorkflows < 7) throw new Error('Expected at least 7 registered workflows');
});

test('Workflows have meta objects', () => {
  const registry = workflows.getRegistry();
  const workflow = registry.getWorkflow('campaign-launch');
  if (!workflow) throw new Error('campaign-launch not found');
  if (!workflow.meta) throw new Error('workflow missing meta object');
  if (!workflow.meta.name) throw new Error('meta missing name');
  if (!workflow.meta.category) throw new Error('meta missing category');
  if (!workflow.meta.triggers) throw new Error('meta missing triggers');
});

// --- Test 3: Event System ---
console.log('\n📡 Test Suite 3: Event System');
console.log('-'.repeat(60));

test('Event bus accessible', () => {
  if (!eventBus) throw new Error('eventBus not exported');
  if (typeof eventBus.emit !== 'function') throw new Error('eventBus missing emit method');
});

test('Event types defined', () => {
  if (!eventTypes.WORKFLOW_STARTED) throw new Error('Missing WORKFLOW_STARTED event type');
  if (!eventTypes.WORKFLOW_COMPLETED) throw new Error('Missing WORKFLOW_COMPLETED event type');
  if (!eventTypes.PROJECT_CREATED) throw new Error('Missing PROJECT_CREATED event type');
});

test('Event bus emits events', () => {
  const event = eventBus.emit(eventTypes.WORKFLOW_STARTED, {
    source: 'test',
    workflowId: 'test-workflow'
  });
  if (!event) throw new Error('emit did not return event');
  if (!event.id) throw new Error('event missing id');
  if (!event.timestamp) throw new Error('event missing timestamp');
});

test('Event bus getHistory()', () => {
  const history = eventBus.getHistory({ limit: 10 });
  if (!Array.isArray(history)) throw new Error('getHistory did not return array');
});

test('Event bus getStats()', () => {
  const stats = eventBus.getStats();
  if (!stats.total) throw new Error('stats missing total');
  if (!stats.types) throw new Error('stats missing types');
});

// --- Test 4: Project Model ---
console.log('\n📊 Test Suite 4: Project Model');
console.log('-'.repeat(60));

test('Project model accessible', () => {
  if (!projects) throw new Error('projects module not accessible');
  if (typeof projects.create !== 'function') throw new Error('projects missing create method');
});

test('Create project', () => {
  const project = projects.create({
    name: 'Test Campaign Project',
    type: 'campaign',
    owner: 'test-user',
    budget: 50000
  });
  if (!project) throw new Error('create returned null');
  if (!project.id) throw new Error('project missing id');
  if (project.name !== 'Test Campaign Project') throw new Error('project name mismatch');
});

test('Get project', () => {
  const created = projects.create({
    name: 'Get Test Project',
    type: 'campaign'
  });
  const fetched = projects.get(created.id);
  if (!fetched) throw new Error('get returned null');
  if (fetched.id !== created.id) throw new Error('project id mismatch');
});

test('List projects', () => {
  const list = projects.list();
  if (!Array.isArray(list)) throw new Error('list did not return array');
  if (list.length < 1) throw new Error('Expected at least 1 project');
});

test('Update project', () => {
  const created = projects.create({
    name: 'Update Test Project',
    type: 'campaign',
    status: 'planning'
  });
  const updated = projects.update(created.id, {
    status: 'active',
    budget: 100000
  });
  if (updated.status !== 'active') throw new Error('status not updated');
  if (updated.budget !== 100000) throw new Error('budget not updated');
});

test('Project statistics', () => {
  const stats = projects.getStats();
  if (!stats) throw new Error('getStats returned null');
  if (typeof stats.total !== 'number') throw new Error('stats missing total');
  if (!stats.byType) throw new Error('stats missing byType');
  if (!stats.byStatus) throw new Error('stats missing byStatus');
});

// --- Test 5: Execution Model ---
console.log('\n⚙️  Test Suite 5: Execution Model');
console.log('-'.repeat(60));

test('Execution model accessible', () => {
  if (!executions) throw new Error('executions module not accessible');
  if (typeof executions.create !== 'function') throw new Error('executions missing create method');
});

test('Create execution', () => {
  const execution = executions.create({
    workflowId: 'test-workflow',
    params: { test: true }
  });
  if (!execution) throw new Error('create returned null');
  if (!execution.id) throw new Error('execution missing id');
  if (execution.workflowId !== 'test-workflow') throw new Error('workflowId mismatch');
});

test('Link execution to project', () => {
  const project = projects.create({
    name: 'Execution Link Test',
    type: 'campaign'
  });
  const execution = executions.create({
    projectId: project.id,
    workflowId: 'test-workflow'
  });
  if (execution.projectId !== project.id) throw new Error('projectId not linked');
  
  projects.addExecution(project.id, execution.id);
  const updated = projects.get(project.id);
  if (!updated.executions.includes(execution.id)) throw new Error('execution not added to project');
});

test('Update execution', () => {
  const execution = executions.create({
    workflowId: 'test-workflow',
    status: 'queued'
  });
  const updated = executions.update(execution.id, {
    status: 'completed',
    result: { success: true }
  });
  if (updated.status !== 'completed') throw new Error('status not updated');
});

test('List executions', () => {
  const list = executions.list({ limit: 10 });
  if (!Array.isArray(list)) throw new Error('list did not return array');
});

// --- Test 6: Events Model ---
console.log('\n📰 Test Suite 6: Events Model');
console.log('-'.repeat(60));

test('Events model accessible', () => {
  if (!events) throw new Error('events module not accessible');
  if (typeof events.getRecent !== 'function') throw new Error('events missing getRecent method');
});

test('Get recent events', () => {
  const recent = events.getRecent(10);
  if (!Array.isArray(recent)) throw new Error('getRecent did not return array');
});

test('Query events', () => {
  const queried = events.query({ limit: 5 });
  if (!Array.isArray(queried)) throw new Error('query did not return array');
});

// --- Test 7: AsanaProjectManager Agent ---
console.log('\n🤖 Test Suite 7: AsanaProjectManager Agent');
console.log('-'.repeat(60));

test('AsanaProjectManager agent exists', () => {
  if (!asanaProjectManager) throw new Error('asanaProjectManager not accessible');
  if (!asanaProjectManager.getInfo) throw new Error('agent missing getInfo method');
});

test('Agent has correct capabilities', () => {
  const info = asanaProjectManager.getInfo();
  if (!info.capabilities) throw new Error('agent missing capabilities');
  if (!info.capabilities.includes('parse_prd')) throw new Error('missing parse_prd capability');
  if (!info.capabilities.includes('create_project')) throw new Error('missing create_project capability');
});

asyncTest('Parse PRD', async () => {
  const doc = `
# Q1 Brand Campaign

## Overview
Launch a new brand awareness campaign for Q1.

## Deliverables
- Campaign strategy document
- Creative briefs
- Trafficking setup
- QA and launch

Owner: John Doe
  `;
  
  const parsed = await asanaProjectManager.parsePRD(doc);
  if (!parsed) throw new Error('parsePRD returned null');
  if (!parsed.projectName) throw new Error('projectName not extracted');
  if (!parsed.deliverables || parsed.deliverables.length === 0) throw new Error('deliverables not extracted');
});

asyncTest('Create project from parsed PRD', async () => {
  const parsed = {
    projectName: 'Test Project',
    description: 'Test description',
    sections: [{ name: 'Planning', tasks: [] }],
    deliverables: ['Task 1', 'Task 2']
  };
  
  const result = await asanaProjectManager.createProject(parsed);
  if (!result) throw new Error('createProject returned null');
  if (!result.asanaProjectId) throw new Error('missing asanaProjectId');
});

// --- Test 8: PRD-to-Asana Workflow ---
console.log('\n🔄 Test Suite 8: PRD-to-Asana Workflow');
console.log('-'.repeat(60));

test('PRD-to-Asana workflow registered', () => {
  const workflow = workflows.getWorkflow('prd-to-asana');
  if (!workflow) throw new Error('prd-to-asana workflow not found');
  if (!workflow.run) throw new Error('workflow missing run function');
});

test('PRD-to-Asana has correct metadata', () => {
  const registry = workflows.getRegistry();
  const meta = registry.getWorkflowMeta('prd-to-asana');
  if (!meta) throw new Error('workflow meta not found');
  if (meta.category !== 'projects') throw new Error('wrong category');
  if (!meta.stages || meta.stages.length !== 4) throw new Error('expected 4 stages');
});

asyncTest('Run PRD-to-Asana workflow', async () => {
  const doc = `
# Test Campaign Project

## Overview
This is a test campaign project.

## Deliverables
- Strategy doc
- Creative assets
- Campaign setup

Owner: Test User
  `;
  
  const result = await workflows.runWorkflow('prd-to-asana', {
    documentText: doc,
    projectType: 'campaign'
  });
  
  if (!result) throw new Error('workflow returned null');
  if (result.status !== 'completed') throw new Error(`workflow failed: ${result.error}`);
  if (!result.projectId) throw new Error('workflow did not create project');
  if (!result.asanaProjectId) throw new Error('workflow did not create Asana project');
});

// --- Test 9: Project Status Workflow ---
console.log('\n📊 Test Suite 9: Project Status Workflow');
console.log('-'.repeat(60));

test('Project Status workflow registered', () => {
  const workflow = workflows.getWorkflow('project-status');
  if (!workflow) throw new Error('project-status workflow not found');
});

asyncTest('Run Project Status workflow', async () => {
  // First create a project
  const project = projects.create({
    name: 'Status Test Project',
    type: 'campaign',
    asanaProjectId: 'test-asana-123'
  });
  
  const result = await workflows.runWorkflow('project-status', {
    projectId: project.id
  });
  
  if (!result) throw new Error('workflow returned null');
  if (result.status !== 'completed') throw new Error(`workflow failed: ${result.error}`);
  if (!result.report) throw new Error('workflow did not generate report');
  if (!result.report.summary) throw new Error('report missing summary');
});

// --- Summary ---
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

if (testsFailed === 0) {
  console.log('🎉 All tests passed! Phase 1 implementation is complete.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review errors above.\n');
  process.exit(1);
}
