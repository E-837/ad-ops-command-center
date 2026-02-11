/**
 * Database Test Suite
 * Comprehensive tests for database migration and functionality
 */

const db = require('./database/db');
const models = require('./database/models');
const { migrate } = require('./database/migrate-from-json');
const fs = require('fs');
const path = require('path');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test runner
 */
async function runTests() {
  console.log('🧪 Starting Database Test Suite\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test 1: Database Connection
    await test('Database Connection', async () => {
      const result = await db.testConnection();
      if (!result.success) {
        throw new Error(result.error);
      }
    });
    
    // Test 2: Projects CRUD
    await test('Projects - Create', async () => {
      const project = await models.projects.create({
        name: 'Test Project',
        type: 'campaign',
        status: 'planning',
        owner: 'test-agent',
        budget: 10000
      });
      if (!project.id || project.name !== 'Test Project') {
        throw new Error('Project creation failed');
      }
      // Store for later tests
      global.testProjectId = project.id;
    });
    
    await test('Projects - Read', async () => {
      const project = await models.projects.get(global.testProjectId);
      if (!project || project.name !== 'Test Project') {
        throw new Error('Project read failed');
      }
    });
    
    await test('Projects - Update', async () => {
      const updated = await models.projects.update(global.testProjectId, {
        status: 'active',
        budget: 15000
      });
      if (updated.status !== 'active' || updated.budget != 15000) {
        throw new Error('Project update failed');
      }
    });
    
    await test('Projects - List with filters', async () => {
      const activeProjects = await models.projects.list({ status: 'active' });
      if (activeProjects.length === 0) {
        throw new Error('List with filters failed');
      }
    });
    
    await test('Projects - Delete (soft)', async () => {
      const result = await models.projects.delete(global.testProjectId);
      if (!result.success) {
        throw new Error('Project delete failed');
      }
      const deleted = await models.projects.get(global.testProjectId);
      if (deleted !== null) {
        throw new Error('Soft delete failed - project still retrievable');
      }
    });
    
    // Test 3: Executions CRUD
    await test('Executions - Create', async () => {
      const execution = await models.executions.create({
        workflowId: 'test-workflow',
        status: 'queued',
        params: { test: true }
      });
      if (!execution.id || execution.workflowId !== 'test-workflow') {
        throw new Error('Execution creation failed');
      }
      global.testExecutionId = execution.id;
    });
    
    await test('Executions - Update with stages', async () => {
      const updated = await models.executions.update(global.testExecutionId, {
        status: 'running',
        stages: [
          { id: 'stage-1', name: 'Test Stage', status: 'running' }
        ]
      });
      if (updated.status !== 'running' || updated.stages.length === 0) {
        throw new Error('Execution update failed');
      }
    });
    
    await test('Executions - Get by workflow', async () => {
      const executions = await models.executions.getRecentByWorkflow('test-workflow', 10);
      if (executions.length === 0) {
        throw new Error('Get by workflow failed');
      }
    });
    
    // Test 4: Events
    await test('Events - Create', async () => {
      const event = await models.events.create({
        type: 'test.event',
        source: 'test-suite',
        payload: { data: 'test' },
        executionId: global.testExecutionId
      });
      if (!event.id || event.type !== 'test.event') {
        throw new Error('Event creation failed');
      }
      global.testEventId = event.id;
    });
    
    await test('Events - Get unprocessed', async () => {
      const unprocessed = await models.events.getUnprocessed();
      if (unprocessed.length === 0) {
        throw new Error('Get unprocessed events failed');
      }
    });
    
    await test('Events - Mark as processed', async () => {
      const processed = await models.events.markProcessed(global.testEventId);
      if (!processed.processed) {
        throw new Error('Mark as processed failed');
      }
    });
    
    // Test 5: Workflows
    await test('Workflows - Register', async () => {
      const workflow = await models.workflows.register({
        id: 'test-workflow',
        name: 'Test Workflow',
        category: 'testing',
        config: { stages: ['stage-1', 'stage-2'] }
      });
      if (!workflow.id || workflow.name !== 'Test Workflow') {
        throw new Error('Workflow registration failed');
      }
    });
    
    await test('Workflows - Get by category', async () => {
      const workflows = await models.workflows.getByCategory('testing');
      if (workflows.length === 0) {
        throw new Error('Get workflows by category failed');
      }
    });
    
    await test('Workflows - Toggle enabled', async () => {
      await models.workflows.setEnabled('test-workflow', false);
      const workflow = await models.workflows.get('test-workflow');
      if (workflow.enabled !== false) {
        throw new Error('Toggle enabled failed');
      }
    });
    
    // Test 6: Campaigns
    await test('Campaigns - Create', async () => {
      const campaign = await models.campaigns.create({
        platform: 'meta-ads',
        externalId: 'test-ext-123',
        name: 'Test Campaign',
        status: 'active',
        budget: 5000
      });
      if (!campaign.id || campaign.name !== 'Test Campaign') {
        throw new Error('Campaign creation failed');
      }
      global.testCampaignId = campaign.id;
    });
    
    await test('Campaigns - Get by platform', async () => {
      const campaigns = await models.campaigns.getByPlatform('meta-ads');
      if (campaigns.length === 0) {
        throw new Error('Get campaigns by platform failed');
      }
    });
    
    await test('Campaigns - Get by external ID', async () => {
      const campaign = await models.campaigns.getByExternalId('meta-ads', 'test-ext-123');
      if (!campaign || campaign.externalId !== 'test-ext-123') {
        throw new Error('Get by external ID failed');
      }
    });
    
    // Test 7: Metrics
    await test('Metrics - Record metrics', async () => {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await models.metrics.recordMetrics(global.testCampaignId, today, {
        impressions: 10000,
        clicks: 250,
        conversions: 10,
        spend: 500,
        revenue: 1000
      });
      if (!metrics || metrics.impressions !== 10000) {
        throw new Error('Record metrics failed');
      }
    });
    
    await test('Metrics - Get metrics for campaign', async () => {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await models.metrics.getMetrics(global.testCampaignId, today, today);
      if (metrics.length === 0) {
        throw new Error('Get metrics failed');
      }
    });
    
    await test('Metrics - Aggregate metrics', async () => {
      const aggregated = await models.metrics.aggregate({
        campaignIds: [global.testCampaignId]
      });
      if (aggregated.totalImpressions !== 10000) {
        throw new Error('Aggregate metrics failed');
      }
    });
    
    // Test 8: Calculated fields
    await test('Metrics - Calculated CTR/CPC/CPA/ROAS', async () => {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await models.metrics.getMetrics(global.testCampaignId, today, today);
      const m = metrics[0];
      
      // CTR should be (250/10000) * 100 = 2.5
      if (Math.abs(m.ctr - 2.5) > 0.01) {
        throw new Error(`CTR calculation wrong: expected ~2.5, got ${m.ctr}`);
      }
      
      // CPC should be 500/250 = 2.0
      if (Math.abs(m.cpc - 2.0) > 0.01) {
        throw new Error(`CPC calculation wrong: expected ~2.0, got ${m.cpc}`);
      }
      
      // CPA should be 500/10 = 50.0
      if (Math.abs(m.cpa - 50.0) > 0.01) {
        throw new Error(`CPA calculation wrong: expected ~50.0, got ${m.cpa}`);
      }
      
      // ROAS should be 1000/500 = 2.0
      if (Math.abs(m.roas - 2.0) > 0.01) {
        throw new Error(`ROAS calculation wrong: expected ~2.0, got ${m.roas}`);
      }
    });
    
    // Test 9: JSON serialization/deserialization
    await test('JSON fields - Metadata preservation', async () => {
      const project = await models.projects.create({
        name: 'JSON Test Project',
        metadata: {
          nested: {
            object: 'value',
            array: [1, 2, 3]
          }
        }
      });
      
      const retrieved = await models.projects.get(project.id);
      if (typeof retrieved.metadata !== 'object' || 
          retrieved.metadata.nested.object !== 'value' ||
          !Array.isArray(retrieved.metadata.nested.array)) {
        throw new Error('JSON deserialization failed');
      }
      
      await models.projects.delete(project.id);
    });
    
    // Test 10: Concurrent operations
    await test('Concurrent operations', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          models.projects.create({
            name: `Concurrent Project ${i}`,
            type: 'campaign'
          })
        );
      }
      
      const projects = await Promise.all(promises);
      if (projects.length !== 5) {
        throw new Error('Concurrent operations failed');
      }
      
      // Cleanup
      for (const p of projects) {
        await models.projects.delete(p.id);
      }
    });
    
    // Test 11: Performance test
    await test('Performance - 1000 record insert', async () => {
      const startTime = Date.now();
      
      const events = [];
      for (let i = 0; i < 1000; i++) {
        events.push({
          type: 'performance.test',
          source: 'test-suite',
          payload: { index: i }
        });
      }
      
      // Insert in batches
      for (let i = 0; i < events.length; i += 100) {
        const batch = events.slice(i, i + 100);
        await Promise.all(batch.map(e => models.events.create(e)));
      }
      
      const duration = Date.now() - startTime;
      console.log(`    ⏱️  Inserted 1000 records in ${duration}ms (${(1000/duration*1000).toFixed(0)} records/sec)`);
      
      if (duration > 10000) { // Should complete in under 10 seconds
        throw new Error('Performance test too slow');
      }
      
      // Cleanup
      await db('events').where('type', 'performance.test').del();
    });
    
    // Test 12: Foreign key relationships
    await test('Foreign keys - Cascade delete', async () => {
      // Create project with campaign
      const project = await models.projects.create({
        name: 'FK Test Project'
      });
      
      const campaign = await models.campaigns.create({
        projectId: project.id,
        platform: 'test',
        name: 'FK Test Campaign',
        externalId: 'fk-test-123'
      });
      
      // Delete project (should cascade to campaigns)
      await db('projects').where('id', project.id).del();
      
      // Campaign should be deleted
      const deletedCampaign = await models.campaigns.get(campaign.id);
      if (deletedCampaign !== null) {
        throw new Error('Cascade delete failed');
      }
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed/(results.passed+results.failed))*100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }
    
    console.log('\n✨ Database tests complete!');
    
    return results;
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    throw error;
  } finally {
    // Close database connection
    await db.destroy();
  }
}

/**
 * Individual test wrapper
 */
async function test(name, fn) {
  process.stdout.write(`🧪 ${name}... `);
  
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, passed: true });
    console.log('✅');
  } catch (error) {
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
    console.log(`❌\n   Error: ${error.message}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(() => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { runTests };
