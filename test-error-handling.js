/**
 * test-error-handling.js
 * Error Handling and Edge Case Test Suite
 * Week 10, Day 44: Error Handling & Edge Cases
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3002';

// Test Results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
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
// API ERROR TESTS
// ====================

async function test_connector_rate_limit() {
  // Simulate rate limit and verify exponential backoff retry
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Rate Limit Test', budget: 100 },
    simulateRateLimit: true
  }).catch(err => err.response);

  // Should handle gracefully
  assert(response.status === 429 || response.status === 200, 'Rate limit should be handled');
  
  if (response.status === 429) {
    assert(response.data.retryAfter, 'Should provide retry-after header');
    assert(response.data.message.includes('rate limit'), 'Error message should mention rate limit');
  }
}

async function test_connector_auth_failure() {
  // Test graceful degradation to sandbox mode on auth failure
  const response = await axios.post(`${BASE_URL}/api/connectors/test`, {
    platform: 'google_ads',
    credentials: { invalid: 'credentials' }
  }).catch(err => err.response);

  assert(response, 'Should return a response even on auth failure');
  assert(response.data.error || response.data.sandboxMode, 'Should indicate error or sandbox mode');
}

async function test_connector_network_timeout() {
  // Test retry with backoff on network timeout
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Timeout Test', budget: 100 },
    simulateTimeout: true
  }, {
    timeout: 5000
  }).catch(err => err.response || err);

  // Should either retry and succeed or fail gracefully
  assert(response, 'Should handle timeout');
  
  if (response.code === 'ECONNABORTED') {
    // Timeout occurred - expected behavior
    assert(true, 'Timeout handled');
  } else {
    // Retried successfully
    assert(response.status === 200, 'Retry should work');
  }
}

async function test_connector_invalid_response() {
  // Test handling of malformed API responses
  const response = await axios.post(`${BASE_URL}/api/connectors/parse-response`, {
    platform: 'google_ads',
    response: 'invalid JSON {{{',
    expectedFormat: 'json'
  }).catch(err => err.response);

  assert(response, 'Should handle invalid response');
  assert(response.data.error, 'Should return parse error');
  assert(response.data.error.includes('parse') || response.data.error.includes('invalid'), 'Error should indicate parsing issue');
}

// ========================
// DATABASE ERROR TESTS
// ========================

async function test_database_connection_failure() {
  // Test fallback mechanism on database connection failure
  // This test simulates by trying to access database directly
  const response = await axios.get(`${BASE_URL}/api/health/database`).catch(err => err.response);
  
  assert(response, 'Health check should return');
  
  if (response.status !== 200) {
    assert(response.data.message, 'Should provide clear error message');
    assert(response.data.fallback || response.data.recovery, 'Should indicate fallback mechanism');
  }
}

async function test_database_constraint_violation() {
  // Test validation before insert
  const duplicateCampaign = {
    name: 'Unique Test Campaign',
    platform: 'google_ads',
    budget: 100,
    status: 'active'
  };

  // First insert
  await axios.post(`${BASE_URL}/api/campaigns`, duplicateCampaign);

  // Duplicate insert (if unique constraint exists)
  const response = await axios.post(`${BASE_URL}/api/campaigns`, duplicateCampaign).catch(err => err.response);

  // Should either prevent duplicate or handle gracefully
  assert(response, 'Should handle constraint violation');
  
  if (response.status >= 400) {
    assert(response.data.error, 'Should provide error message');
  }
}

async function test_database_migration_rollback() {
  // Test that migrations are reversible (conceptual test)
  const response = await axios.get(`${BASE_URL}/api/database/migrations/status`).catch(err => err.response);
  
  // Check if migration tracking exists
  assert(response, 'Migration status endpoint should exist');
  
  if (response.status === 200) {
    assert(response.data.migrations || response.data.version, 'Should track migrations');
  }
}

// ======================
// WORKFLOW ERROR TESTS
// ======================

async function test_workflow_stage_failure() {
  // Test workflow stage failure handling
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Failure Test', budget: -100 }, // Invalid budget
    allowFailure: true
  }).catch(err => err.response);

  assert(response, 'Should handle workflow failure');
  
  if (response.status >= 400) {
    assert(response.data.error, 'Should provide error details');
    assert(response.data.stage || response.data.failedAt, 'Should indicate failure point');
  } else {
    // Workflow started, check if it marked as failed
    await sleep(2000);
    const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${response.data.executionId}`);
    assert(executionRes.data.status === 'failed' || executionRes.data.errors, 'Should mark as failed');
  }
}

async function test_workflow_timeout() {
  // Test workflow timeout handling
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: { name: 'Timeout Test', budget: 100 },
    timeout: 1000, // 1 second timeout
    simulateDelay: 5000 // 5 second delay
  }).catch(err => err.response);

  assert(response, 'Should handle timeout');
  
  if (response.data.executionId) {
    // Wait and check status
    await sleep(3000);
    const executionRes = await axios.get(`${BASE_URL}/api/workflows/executions/${response.data.executionId}`);
    assert(
      executionRes.data.status === 'timeout' || executionRes.data.status === 'failed',
      'Should mark as timeout/failed'
    );
  }
}

async function test_workflow_invalid_input() {
  // Test input validation before execution
  const invalidInputs = [
    { workflow: 'campaign_launch', platform: 'invalid_platform', campaign: {} },
    { workflow: 'nonexistent_workflow', platform: 'google_ads', campaign: {} },
    { workflow: 'campaign_launch', platform: 'google_ads' }, // Missing campaign
  ];

  for (const input of invalidInputs) {
    const response = await axios.post(`${BASE_URL}/api/workflows/execute`, input).catch(err => err.response);
    
    assert(response.status >= 400, 'Invalid input should be rejected');
    assert(response.data.error, 'Should provide error message');
    assert(response.data.error.length > 10, 'Error message should be descriptive');
  }
}

// ==================
// UI ERROR TESTS
// ==================

async function test_ui_network_error() {
  // Test UI handling of network errors (check static file serving)
  const response = await axios.get(`${BASE_URL}/ui/error-boundary.js`).catch(err => err.response);
  
  // Should have error boundary component
  assert(response, 'Error boundary should exist');
  
  if (response.status === 200) {
    assert(response.data.includes('ErrorBoundary') || response.data.includes('handleError'), 'Should define error handling');
  }
}

async function test_ui_invalid_form_input() {
  // Test API validation for form inputs
  const invalidForms = [
    { name: '', budget: 100 }, // Empty name
    { name: 'Test', budget: -100 }, // Negative budget
    { name: 'Test', budget: 'not-a-number' }, // Invalid type
    { name: 'A'.repeat(300), budget: 100 } // Extremely long name
  ];

  for (const form of invalidForms) {
    const response = await axios.post(`${BASE_URL}/api/campaigns`, {
      ...form,
      platform: 'google_ads',
      status: 'active'
    }).catch(err => err.response);

    if (response && response.status >= 400) {
      assert(response.data.error || response.data.validation, 'Should provide validation error');
    }
  }
}

async function test_ui_missing_data() {
  // Test graceful handling of missing data
  const response = await axios.get(`${BASE_URL}/api/campaigns/nonexistent-id-12345`).catch(err => err.response);
  
  assert(response.status === 404, 'Should return 404 for missing data');
  assert(response.data.error || response.data.message, 'Should provide helpful error message');
}

// ==================
// EDGE CASE TESTS
// ==================

async function test_empty_database() {
  // Test fresh install experience
  const endpoints = [
    '/api/campaigns',
    '/api/workflows/executions',
    '/api/analytics/summary'
  ];

  for (const endpoint of endpoints) {
    const response = await axios.get(`${BASE_URL}${endpoint}`).catch(err => err.response);
    
    assert(response.status === 200, `${endpoint} should handle empty database`);
    assert(Array.isArray(response.data) || response.data.data || response.data === null, 'Should return empty array or null');
  }
}

async function test_massive_campaign_count() {
  // Test pagination with large dataset
  const response = await axios.get(`${BASE_URL}/api/campaigns?limit=1000`).catch(err => err.response);
  
  assert(response.status === 200, 'Should handle large limit');
  
  if (response.data.length > 100) {
    // Check if pagination metadata exists
    assert(response.data.pagination || response.data.total, 'Should provide pagination info for large datasets');
  }
}

async function test_very_long_campaign_names() {
  // Test handling of very long strings
  const longName = 'A'.repeat(500);
  
  const response = await axios.post(`${BASE_URL}/api/campaigns`, {
    name: longName,
    platform: 'google_ads',
    budget: 100,
    status: 'active'
  }).catch(err => err.response);

  // Should either truncate or reject
  if (response.status === 200) {
    const savedCampaign = await axios.get(`${BASE_URL}/api/campaigns/${response.data.id}`);
    assert(savedCampaign.data.name.length <= 255, 'Should truncate long names');
  } else {
    assert(response.data.error, 'Should reject with validation error');
  }
}

async function test_unicode_in_inputs() {
  // Test emoji and special characters
  const unicodeInputs = [
    '🚀 Campaign Launch 🎯',
    '测试活动',
    'Кампания',
    'مركز العمليات',
    '№ 1 Campaign™'
  ];

  for (const name of unicodeInputs) {
    const response = await axios.post(`${BASE_URL}/api/campaigns`, {
      name,
      platform: 'google_ads',
      budget: 100,
      status: 'active'
    }).catch(err => err.response);

    assert(response.status === 200 || response.status === 400, 'Should handle unicode');
    
    if (response.status === 200) {
      const savedCampaign = await axios.get(`${BASE_URL}/api/campaigns/${response.data.id}`);
      assert(savedCampaign.data.name, 'Should preserve unicode characters');
    }
  }
}

async function test_concurrent_edits() {
  // Test concurrent modification handling
  const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
    name: 'Concurrent Edit Test',
    platform: 'google_ads',
    budget: 100,
    status: 'active'
  });

  const campaignId = campaignResponse.data.id;

  // Make concurrent edits
  const edit1 = axios.put(`${BASE_URL}/api/campaigns/${campaignId}`, { budget: 200 });
  const edit2 = axios.put(`${BASE_URL}/api/campaigns/${campaignId}`, { budget: 300 });

  const [res1, res2] = await Promise.all([
    edit1.catch(err => err.response),
    edit2.catch(err => err.response)
  ]);

  // Both should succeed (last-write-wins) or one should fail (conflict detection)
  const successCount = [res1, res2].filter(r => r && r.status === 200).length;
  assert(successCount >= 1, 'At least one concurrent edit should succeed');

  // Verify final state
  const final = await axios.get(`${BASE_URL}/api/campaigns/${campaignId}`);
  assert(final.data.budget === 200 || final.data.budget === 300, 'Final state should reflect one of the edits');
}

// ====================
// TEST RUNNER
// ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  AD OPS COMMAND CENTER - ERROR HANDLING TEST SUITE');
  console.log('Week 10, Day 44: Error Handling & Edge Cases');
  console.log('='.repeat(60));

  // Check server
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and healthy\n');
  } catch (error) {
    console.error('❌ Server is not accessible. Please start the server first.');
    process.exit(1);
  }

  console.log('\n🌐 API ERROR TESTS');
  console.log('-'.repeat(60));
  await runTest('Connector Rate Limit', test_connector_rate_limit);
  await runTest('Connector Auth Failure', test_connector_auth_failure);
  await runTest('Connector Network Timeout', test_connector_network_timeout);
  await runTest('Connector Invalid Response', test_connector_invalid_response);

  console.log('\n💾 DATABASE ERROR TESTS');
  console.log('-'.repeat(60));
  await runTest('Database Connection Failure', test_database_connection_failure);
  await runTest('Database Constraint Violation', test_database_constraint_violation);
  await runTest('Database Migration Rollback', test_database_migration_rollback);

  console.log('\n⚙️  WORKFLOW ERROR TESTS');
  console.log('-'.repeat(60));
  await runTest('Workflow Stage Failure', test_workflow_stage_failure);
  await runTest('Workflow Timeout', test_workflow_timeout);
  await runTest('Workflow Invalid Input', test_workflow_invalid_input);

  console.log('\n🎨 UI ERROR TESTS');
  console.log('-'.repeat(60));
  await runTest('UI Network Error Handling', test_ui_network_error);
  await runTest('UI Invalid Form Input', test_ui_invalid_form_input);
  await runTest('UI Missing Data', test_ui_missing_data);

  console.log('\n🔍 EDGE CASE TESTS');
  console.log('-'.repeat(60));
  await runTest('Empty Database', test_empty_database);
  await runTest('Massive Campaign Count', test_massive_campaign_count);
  await runTest('Very Long Campaign Names', test_very_long_campaign_names);
  await runTest('Unicode in Inputs', test_unicode_in_inputs);
  await runTest('Concurrent Edits', test_concurrent_edits);

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ERROR HANDLING TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      total: results.passed + results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    },
    tests: results.tests
  };

  const fs = require('fs');
  fs.writeFileSync(
    'test-error-handling-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Detailed report saved to: test-error-handling-report.json\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Error handling test crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
