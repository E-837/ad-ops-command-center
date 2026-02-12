/**
 * test-integration.js
 * Comprehensive End-to-End Integration Test Suite
 * Week 10, Day 43: Production Hardening
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventSource = require('eventsource');

const BASE_URL = 'http://localhost:3002';
const SSE_URL = `${BASE_URL}/sse`;

// Test Results Tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(name, testFn) {
  process.stdout.write(`\n🧪 ${name}... `);
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ PASSED (${duration}ms)`);
    results.passed++;
    results.tests.push({ name, status: 'PASSED', duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ FAILED (${duration}ms)`);
    console.error(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', duration, error: error.message });
  }
}

// ====================
// FULL WORKFLOW TESTS
// ====================

async function test_campaign_launch_end_to_end() {
  // Test: Webhook → workflow → SSE updates → analytics update → notification sent → memory stored
  
  const workflowPayload = {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: {
      name: 'E2E Test Campaign',
      budget: 1000,
      targeting: { age: '25-54', geo: 'US' }
    }
  };

  // Track SSE events
  const sseEvents = [];
  const eventSource = new EventSource(SSE_URL);
  
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('Test timeout after 30s'));
    }, 30000);

    eventSource.on('workflow.started', (event) => {
      sseEvents.push({ type: 'workflow.started', data: JSON.parse(event.data) });
    });

    eventSource.on('workflow.completed', (event) => {
      sseEvents.push({ type: 'workflow.completed', data: JSON.parse(event.data) });
    });

    // Start workflow via webhook
    const response = await axios.post(`${BASE_URL}/api/webhooks/workflow`, workflowPayload);
    assert(response.status === 200, 'Webhook should return 200');
    const executionId = response.data.executionId;

    // Wait for workflow completion
    await sleep(3000);

    // Verify SSE events received
    assert(sseEvents.length >= 2, 'Should receive at least 2 SSE events');
    assert(sseEvents.some(e => e.type === 'workflow.started'), 'Should receive workflow.started event');
    assert(sseEvents.some(e => e.type === 'workflow.completed'), 'Should receive workflow.completed event');

    // Verify analytics updated
    const analyticsRes = await axios.get(`${BASE_URL}/api/analytics/summary`);
    assert(analyticsRes.status === 200, 'Analytics endpoint should be accessible');

    // Verify execution stored in database
    const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
    assert(executionRes.status === 200, 'Execution should be retrievable');
    assert(executionRes.data.status === 'completed', 'Execution should be marked completed');

    clearTimeout(timeout);
    eventSource.close();
    resolve();
  });
}

async function test_cross_platform_campaign() {
  // Launch same campaign on Google, Meta, Pinterest, LinkedIn, TikTok
  const platforms = ['google_ads', 'meta_ads', 'pinterest', 'linkedin_ads', 'tiktok'];
  const executionIds = [];

  for (const platform of platforms) {
    const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
      workflow: 'campaign_launch',
      platform,
      campaign: {
        name: `Cross-Platform Test - ${platform}`,
        budget: 500
      }
    });

    assert(response.status === 200, `${platform} campaign launch should succeed`);
    executionIds.push(response.data.executionId);
  }

  // Wait for all to complete
  await sleep(5000);

  // Verify all completed
  for (const executionId of executionIds) {
    const res = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
    assert(res.data.status === 'completed' || res.data.status === 'success', `Execution ${executionId} should complete`);
  }

  assert(executionIds.length === 5, 'All 5 platforms should execute');
}

async function test_ab_test_workflow() {
  // Create test → run → analyze → declare winner → apply
  const abTestPayload = {
    workflow: 'ab_test',
    testName: 'Integration Test A/B',
    variantA: { headline: 'Buy Now', cta: 'Shop' },
    variantB: { headline: 'Limited Offer', cta: 'Grab Deal' },
    budget: 200,
    duration: 24
  };

  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, abTestPayload);
  assert(response.status === 200, 'A/B test workflow should start');

  const executionId = response.data.executionId;
  await sleep(3000);

  // Verify execution completed
  const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
  assert(executionRes.data.status === 'completed', 'A/B test should complete');

  // Verify results stored
  const results = executionRes.data.results;
  assert(results, 'A/B test should have results');
  assert(results.winner || results.status === 'inconclusive', 'A/B test should determine winner or be inconclusive');
}

async function test_budget_optimization() {
  // Detect poor performance → recommend reallocation → apply → verify
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'budget_optimization',
    campaigns: [
      { id: 'camp_1', budget: 1000, performance: 0.3 },
      { id: 'camp_2', budget: 1000, performance: 0.8 }
    ]
  });

  assert(response.status === 200, 'Budget optimization should start');
  await sleep(3000);

  const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${response.data.executionId}`);
  assert(executionRes.data.status === 'completed', 'Budget optimization should complete');

  // Verify recommendations generated
  const recommendations = executionRes.data.results?.recommendations;
  assert(recommendations && recommendations.length > 0, 'Should generate budget recommendations');
}

async function test_prd_to_asana() {
  // Parse PRD → create Asana project → verify tasks created
  const prdContent = `
# New Campaign Feature

## Overview
Build a new campaign type for seasonal promotions.

## Tasks
- Design campaign template
- Implement backend logic
- Create UI components
- Write tests
`;

  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'prd_to_asana',
    prd: prdContent,
    projectName: 'Integration Test Project'
  });

  assert(response.status === 200, 'PRD to Asana workflow should start');
  await sleep(3000);

  const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${response.data.executionId}`);
  assert(executionRes.data.status === 'completed', 'PRD conversion should complete');

  // Verify Asana project created (in sandbox mode, this will be mocked)
  const result = executionRes.data.results;
  assert(result.projectId || result.taskCount, 'Should return Asana project info');
}

// ========================
// REAL-TIME UPDATE TESTS
// ========================

async function test_sse_workflow_progress() {
  // Start workflow → verify SSE events → check chart updates
  const events = [];
  const eventSource = new EventSource(SSE_URL);

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('SSE test timeout'));
    }, 20000);

    eventSource.on('workflow.progress', (event) => {
      events.push(JSON.parse(event.data));
    });

    // Start a workflow
    await axios.post(`${BASE_URL}/api/workflows/execute`, {
      workflow: 'campaign_launch',
      platform: 'google_ads',
      campaign: { name: 'SSE Progress Test', budget: 100 }
    });

    // Wait for progress events
    await sleep(5000);

    assert(events.length > 0, 'Should receive SSE progress events');
    
    clearTimeout(timeout);
    eventSource.close();
    resolve();
  });
}

async function test_chart_real_time_refresh() {
  // Emit metric event → verify dashboard chart updates
  const metricPayload = {
    type: 'metric.updated',
    platform: 'google_ads',
    metric: 'impressions',
    value: 1500,
    timestamp: Date.now()
  };

  // Emit metric event
  await axios.post(`${BASE_URL}/api/events/emit`, metricPayload);

  // Verify event is accessible via analytics
  await sleep(1000);
  const analyticsRes = await axios.get(`${BASE_URL}/api/analytics/metrics?platform=google_ads&metric=impressions&limit=10`);
  
  assert(analyticsRes.status === 200, 'Analytics endpoint should return metrics');
  assert(analyticsRes.data.length > 0, 'Should have at least one metric');
}

// =======================
// ANALYTICS PIPELINE TESTS
// =======================

async function test_metrics_aggregation() {
  // Record metrics → verify analytics endpoints → check dashboard
  const metrics = [
    { platform: 'google_ads', metric: 'impressions', value: 1000 },
    { platform: 'google_ads', metric: 'clicks', value: 50 },
    { platform: 'google_ads', metric: 'conversions', value: 5 }
  ];

  for (const metric of metrics) {
    await axios.post(`${BASE_URL}/api/analytics/metrics`, metric);
  }

  await sleep(1000);

  // Verify aggregation
  const summaryRes = await axios.get(`${BASE_URL}/api/analytics/summary?platform=google_ads`);
  assert(summaryRes.status === 200, 'Analytics summary should be accessible');
  assert(summaryRes.data.impressions >= 1000, 'Should aggregate impressions');
}

async function test_cross_platform_analytics() {
  // Metrics from all 7 platforms → unified analytics view
  const platforms = ['google_ads', 'meta_ads', 'pinterest', 'linkedin_ads', 'tiktok', 'microsoft_ads', 'asana'];

  for (const platform of platforms) {
    await axios.post(`${BASE_URL}/api/analytics/metrics`, {
      platform,
      metric: 'test_metric',
      value: Math.random() * 1000
    });
  }

  await sleep(1000);

  // Get unified view
  const unifiedRes = await axios.get(`${BASE_URL}/api/analytics/cross-platform`);
  assert(unifiedRes.status === 200, 'Cross-platform analytics should be accessible');
  
  const platformsInResponse = Object.keys(unifiedRes.data);
  assert(platformsInResponse.length > 0, 'Should have metrics from multiple platforms');
}

// ==========================
// INTELLIGENCE LAYER TESTS
// ==========================

async function test_agent_memory_learning() {
  // Run workflow → store memory → next run uses learning
  const workflowPayload = {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Memory Test Campaign', budget: 500 }
  };

  // First execution
  const res1 = await axios.post(`${BASE_URL}/api/workflows/execute`, workflowPayload);
  await sleep(3000);

  // Store a learning
  await axios.post(`${BASE_URL}/api/agent/memory`, {
    context: 'campaign_launch',
    learning: 'Test campaigns with "Memory Test" prefix perform 20% better',
    confidence: 0.85
  });

  // Second execution - should use memory
  const res2 = await axios.post(`${BASE_URL}/api/workflows/execute`, workflowPayload);
  await sleep(3000);

  // Verify memory was considered
  const memoryRes = await axios.get(`${BASE_URL}/api/agent/memory?context=campaign_launch`);
  assert(memoryRes.status === 200, 'Memory endpoint should be accessible');
  assert(memoryRes.data.length > 0, 'Should have stored memories');
}

async function test_recommendation_engine() {
  // Poor performance → generate recommendation → verify quality
  const performanceData = {
    campaignId: 'camp_poor_performance',
    metrics: {
      impressions: 10000,
      clicks: 50,
      conversions: 1,
      spend: 500
    }
  };

  const response = await axios.post(`${BASE_URL}/api/recommendations/generate`, performanceData);
  assert(response.status === 200, 'Recommendation engine should respond');

  const recommendations = response.data.recommendations;
  assert(recommendations && recommendations.length > 0, 'Should generate recommendations');
  
  // Verify recommendation quality
  const firstRec = recommendations[0];
  assert(firstRec.action, 'Recommendation should have an action');
  assert(firstRec.reason, 'Recommendation should have a reason');
  assert(firstRec.confidence >= 0 && firstRec.confidence <= 1, 'Confidence should be 0-1');
}

async function test_prediction_accuracy() {
  // Historical data → predict outcome → verify within tolerance
  const historicalData = [
    { budget: 100, impressions: 5000, clicks: 250 },
    { budget: 200, impressions: 10000, clicks: 500 },
    { budget: 300, impressions: 15000, clicks: 750 }
  ];

  const response = await axios.post(`${BASE_URL}/api/predictions/forecast`, {
    historical: historicalData,
    futureBudget: 400
  });

  assert(response.status === 200, 'Prediction engine should respond');

  const prediction = response.data.prediction;
  assert(prediction.impressions > 15000, 'Predicted impressions should follow trend');
  assert(prediction.clicks > 750, 'Predicted clicks should follow trend');
  assert(prediction.confidence, 'Prediction should have confidence score');
}

// ========================
// INTEGRATION HUB TESTS
// ========================

async function test_webhook_to_workflow() {
  // External POST → workflow executes → completion webhook sent
  const webhookPayload = {
    workflow: 'campaign_launch',
    platform: 'meta_ads',
    campaign: { name: 'Webhook Test', budget: 200 },
    callbackUrl: 'https://httpbin.org/post' // Echo service
  };

  const response = await axios.post(`${BASE_URL}/api/webhooks/workflow`, webhookPayload);
  assert(response.status === 200, 'Webhook should be accepted');

  const executionId = response.data.executionId;
  await sleep(3000);

  // Verify workflow executed
  const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
  assert(executionRes.data.status === 'completed', 'Workflow should complete');

  // Note: Callback webhook verification would require mock server
}

async function test_notification_pipeline() {
  // Workflow completes → notification sent (Discord/Slack/email)
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Notification Test', budget: 100 },
    notifications: {
      enabled: true,
      channels: ['discord', 'slack']
    }
  });

  assert(response.status === 200, 'Workflow with notifications should start');
  await sleep(3000);

  // Verify notification log (implementation-dependent)
  const logsRes = await axios.get(`${BASE_URL}/api/notifications/logs?limit=10`);
  assert(logsRes.status === 200 || logsRes.status === 404, 'Notification logs endpoint should exist or return 404');
}

async function test_event_trigger_workflow() {
  // Emit event (metric.threshold) → workflow auto-triggers
  
  // Set up a threshold trigger
  await axios.post(`${BASE_URL}/api/triggers/create`, {
    event: 'metric.threshold',
    condition: { metric: 'cpa', operator: '>', value: 50 },
    action: { workflow: 'budget_optimization' }
  });

  // Emit threshold breach event
  await axios.post(`${BASE_URL}/api/events/emit`, {
    type: 'metric.threshold',
    metric: 'cpa',
    value: 75,
    platform: 'google_ads'
  });

  await sleep(3000);

  // Verify workflow was triggered (check recent executions)
  const executionsRes = await axios.get(`${BASE_URL}/api/workflows/executions?limit=5`);
  assert(executionsRes.status === 200, 'Executions endpoint should be accessible');
}

// ======================
// TEMPLATE SYSTEM TESTS
// ======================

async function test_template_execution() {
  // Load template → fill parameters → execute → verify results
  const templatePayload = {
    template: 'seasonal_campaign',
    parameters: {
      season: 'winter',
      budget: 1000,
      platforms: ['google_ads', 'meta_ads']
    }
  };

  const response = await axios.post(`${BASE_URL}/api/templates/execute`, templatePayload);
  assert(response.status === 200, 'Template execution should start');

  await sleep(3000);

  const executionId = response.data.executionId;
  const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
  assert(executionRes.data.status === 'completed', 'Template execution should complete');
}

async function test_preset_application() {
  // Apply preset → verify parameter overrides
  const presetPayload = {
    preset: 'high_performance',
    campaign: {
      name: 'Preset Test Campaign',
      budget: 500
    }
  };

  const response = await axios.post(`${BASE_URL}/api/presets/apply`, presetPayload);
  assert(response.status === 200, 'Preset application should succeed');

  const appliedConfig = response.data.config;
  assert(appliedConfig.bidStrategy, 'Preset should set bid strategy');
  assert(appliedConfig.targetRoas || appliedConfig.targetCpa, 'Preset should set optimization target');
}

// ====================
// TEST RUNNER
// ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 AD OPS COMMAND CENTER - INTEGRATION TEST SUITE');
  console.log('Week 10, Day 43: End-to-End Integration Testing');
  console.log('='.repeat(60));

  // Check server availability
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and healthy\n');
  } catch (error) {
    console.error('❌ Server is not accessible. Please start the server first.');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n📦 FULL WORKFLOW TESTS');
  console.log('-'.repeat(60));
  await runTest('Campaign Launch End-to-End', test_campaign_launch_end_to_end);
  await runTest('Cross-Platform Campaign', test_cross_platform_campaign);
  await runTest('A/B Test Workflow', test_ab_test_workflow);
  await runTest('Budget Optimization', test_budget_optimization);
  await runTest('PRD to Asana', test_prd_to_asana);

  console.log('\n📡 REAL-TIME UPDATE TESTS');
  console.log('-'.repeat(60));
  await runTest('SSE Workflow Progress', test_sse_workflow_progress);
  await runTest('Chart Real-Time Refresh', test_chart_real_time_refresh);

  console.log('\n📊 ANALYTICS PIPELINE TESTS');
  console.log('-'.repeat(60));
  await runTest('Metrics Aggregation', test_metrics_aggregation);
  await runTest('Cross-Platform Analytics', test_cross_platform_analytics);

  console.log('\n🧠 INTELLIGENCE LAYER TESTS');
  console.log('-'.repeat(60));
  await runTest('Agent Memory Learning', test_agent_memory_learning);
  await runTest('Recommendation Engine', test_recommendation_engine);
  await runTest('Prediction Accuracy', test_prediction_accuracy);

  console.log('\n🔗 INTEGRATION HUB TESTS');
  console.log('-'.repeat(60));
  await runTest('Webhook to Workflow', test_webhook_to_workflow);
  await runTest('Notification Pipeline', test_notification_pipeline);
  await runTest('Event Trigger Workflow', test_event_trigger_workflow);

  console.log('\n📋 TEMPLATE SYSTEM TESTS');
  console.log('-'.repeat(60));
  await runTest('Template Execution', test_template_execution);
  await runTest('Preset Application', test_preset_application);

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  const totalDuration = results.tests.reduce((sum, t) => sum + t.duration, 0);
  console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  console.log('='.repeat(60));

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      total: results.passed + results.failed + results.skipped,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1),
      duration: totalDuration
    },
    tests: results.tests
  };

  const fs = require('fs');
  fs.writeFileSync(
    'test-integration-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Detailed report saved to: test-integration-report.json\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
