/**
 * test-performance.js
 * Performance Benchmarking and Load Testing Suite
 * Week 10, Day 43: Production Hardening
 */

const axios = require('axios');
const EventSource = require('eventsource');

const BASE_URL = 'http://localhost:3002';

// Performance Targets
const TARGETS = {
  dbQueryTime: 100,        // ms
  apiResponseTime: 500,    // ms
  chartRenderTime: 100,    // ms
  sseBroadcastLatency: 10, // ms
  memoryGrowth: 50         // MB maximum growth during load test
};

// Test Results
const results = {
  passed: 0,
  failed: 0,
  benchmarks: []
};

// Utilities
async function measureTime(fn) {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMemoryUsage() {
  return process.memoryUsage().heapUsed / 1024 / 1024; // MB
}

async function runBenchmark(name, testFn, target = null) {
  process.stdout.write(`\n⚡ ${name}... `);
  
  try {
    const result = await testFn();
    const passed = target === null || result <= target;
    
    if (passed) {
      console.log(`✅ ${result}ms ${target ? `(target: <${target}ms)` : ''}`);
      results.passed++;
    } else {
      console.log(`❌ ${result}ms (target: <${target}ms) - EXCEEDED`);
      results.failed++;
    }
    
    results.benchmarks.push({
      name,
      result,
      target,
      passed,
      unit: 'ms'
    });
    
    return result;
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    results.failed++;
    results.benchmarks.push({
      name,
      error: error.message,
      passed: false
    });
  }
}

// =======================
// DATABASE PERFORMANCE
// =======================

async function benchmark_db_campaign_query() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/campaigns?limit=50`);
  });
}

async function benchmark_db_execution_query() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/workflows/executions?limit=50`);
  });
}

async function benchmark_db_metrics_query() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/analytics/metrics?limit=100`);
  });
}

async function benchmark_db_complex_join() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/analytics/summary?includeExecution=true&includeCampaigns=true`);
  });
}

async function benchmark_db_insert_performance() {
  return measureTime(async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${BASE_URL}/api/analytics/metrics`, {
          platform: 'google_ads',
          metric: 'test_metric',
          value: Math.random() * 1000
        })
      );
    }
    await Promise.all(promises);
  });
}

// ===================
// API PERFORMANCE
// ===================

async function benchmark_api_health_check() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/health`);
  });
}

async function benchmark_api_analytics_summary() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/analytics/summary`);
  });
}

async function benchmark_api_workflow_list() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/workflows/list`);
  });
}

async function benchmark_api_cross_platform_analytics() {
  return measureTime(async () => {
    await axios.get(`${BASE_URL}/api/analytics/cross-platform`);
  });
}

async function benchmark_api_recommendation_generation() {
  return measureTime(async () => {
    await axios.post(`${BASE_URL}/api/recommendations/generate`, {
      campaignId: 'perf_test_camp',
      metrics: {
        impressions: 10000,
        clicks: 100,
        conversions: 5,
        spend: 500
      }
    });
  });
}

// =======================
// SSE PERFORMANCE
// =======================

async function benchmark_sse_connection_time() {
  return new Promise((resolve) => {
    const start = Date.now();
    const eventSource = new EventSource(`${BASE_URL}/sse`);
    
    eventSource.onopen = () => {
      const duration = Date.now() - start;
      eventSource.close();
      resolve(duration);
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      resolve(999); // Penalty for connection failure
    };
    
    setTimeout(() => {
      eventSource.close();
      resolve(5000); // Timeout penalty
    }, 5000);
  });
}

async function benchmark_sse_broadcast_latency() {
  return new Promise(async (resolve) => {
    const eventSource = new EventSource(`${BASE_URL}/sse`);
    let receivedTime = null;
    
    eventSource.addEventListener('test.event', (event) => {
      receivedTime = Date.now();
      eventSource.close();
    });
    
    // Wait for connection
    await sleep(500);
    
    // Emit event and measure time to receive
    const sentTime = Date.now();
    await axios.post(`${BASE_URL}/api/events/emit`, {
      type: 'test.event',
      data: { timestamp: sentTime }
    });
    
    // Wait for event
    setTimeout(() => {
      if (receivedTime) {
        resolve(receivedTime - sentTime);
      } else {
        eventSource.close();
        resolve(1000); // Timeout penalty
      }
    }, 3000);
  });
}

// ====================
// WORKFLOW PERFORMANCE
// ====================

async function benchmark_workflow_execution_time() {
  const start = Date.now();
  
  const response = await axios.post(`${BASE_URL}/api/workflows/execute`, {
    workflow: 'campaign_launch',
    platform: 'google_ads',
    campaign: {
      name: 'Performance Test Campaign',
      budget: 100
    }
  });
  
  const executionId = response.data.executionId;
  
  // Poll for completion
  let completed = false;
  while (!completed && (Date.now() - start) < 30000) {
    await sleep(500);
    const res = await axios.get(`${BASE_URL}/api/workflows/executions/${executionId}`);
    if (res.data.status === 'completed' || res.data.status === 'failed') {
      completed = true;
    }
  }
  
  return Date.now() - start;
}

// ==================
// LOAD TESTS
// ==================

async function load_test_concurrent_workflows() {
  console.log('\n\n🔥 LOAD TEST: Concurrent Workflow Executions');
  console.log('-'.repeat(60));
  
  const concurrentCount = 10;
  const start = Date.now();
  const initialMemory = getMemoryUsage();
  
  console.log(`📊 Launching ${concurrentCount} concurrent workflows...`);
  
  const promises = [];
  for (let i = 0; i < concurrentCount; i++) {
    promises.push(
      axios.post(`${BASE_URL}/api/workflows/execute`, {
        workflow: 'campaign_launch',
        platform: 'google_ads',
        campaign: {
          name: `Load Test ${i}`,
          budget: 100
        }
      }).catch(err => ({ error: err.message }))
    );
  }
  
  const responses = await Promise.all(promises);
  const successCount = responses.filter(r => !r.error).length;
  const duration = Date.now() - start;
  
  console.log(`✅ Completed: ${successCount}/${concurrentCount} workflows`);
  console.log(`⏱️  Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`📈 Throughput: ${(concurrentCount / (duration / 1000)).toFixed(2)} workflows/sec`);
  
  // Wait for workflows to complete
  console.log('⏳ Waiting for workflows to complete...');
  await sleep(5000);
  
  const finalMemory = getMemoryUsage();
  const memoryGrowth = finalMemory - initialMemory;
  
  console.log(`💾 Memory Usage: ${initialMemory.toFixed(2)}MB → ${finalMemory.toFixed(2)}MB (Δ ${memoryGrowth.toFixed(2)}MB)`);
  
  results.benchmarks.push({
    name: 'Concurrent Workflows',
    concurrentCount,
    successCount,
    duration,
    throughput: (concurrentCount / (duration / 1000)).toFixed(2),
    memoryGrowth: memoryGrowth.toFixed(2),
    passed: successCount === concurrentCount && memoryGrowth < TARGETS.memoryGrowth
  });
}

async function load_test_sse_connections() {
  console.log('\n🔥 LOAD TEST: Multiple SSE Connections');
  console.log('-'.repeat(60));
  
  const connectionCount = 20;
  const connections = [];
  
  console.log(`📊 Opening ${connectionCount} SSE connections...`);
  
  const start = Date.now();
  
  for (let i = 0; i < connectionCount; i++) {
    const es = new EventSource(`${BASE_URL}/sse`);
    connections.push(es);
  }
  
  // Wait for all to connect
  await sleep(2000);
  
  const duration = Date.now() - start;
  console.log(`✅ Connections established: ${connectionCount}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  
  // Test broadcast to all connections
  console.log('📡 Broadcasting test event to all connections...');
  
  let receivedCount = 0;
  const broadcastStart = Date.now();
  
  connections.forEach(es => {
    es.addEventListener('test.broadcast', () => {
      receivedCount++;
    });
  });
  
  await axios.post(`${BASE_URL}/api/events/emit`, {
    type: 'test.broadcast',
    data: { message: 'Load test broadcast' }
  });
  
  await sleep(2000);
  
  const broadcastDuration = Date.now() - broadcastStart;
  
  console.log(`✅ Events received: ${receivedCount}/${connectionCount}`);
  console.log(`⏱️  Broadcast latency: ${broadcastDuration}ms`);
  
  // Clean up
  connections.forEach(es => es.close());
  
  results.benchmarks.push({
    name: 'SSE Connections',
    connectionCount,
    receivedCount,
    broadcastLatency: broadcastDuration,
    passed: receivedCount >= connectionCount * 0.9 // 90% delivery
  });
}

async function load_test_database_volume() {
  console.log('\n🔥 LOAD TEST: Database Volume');
  console.log('-'.repeat(60));
  
  const campaignCount = 100;
  const executionCount = 1000;
  const metricCount = 10000;
  
  console.log(`📊 Creating test data:`);
  console.log(`   - ${campaignCount} campaigns`);
  console.log(`   - ${executionCount} executions`);
  console.log(`   - ${metricCount} metrics`);
  
  const start = Date.now();
  
  // Create campaigns in batches
  console.log('\n📝 Creating campaigns...');
  for (let i = 0; i < campaignCount; i += 10) {
    const promises = [];
    for (let j = 0; j < 10 && (i + j) < campaignCount; j++) {
      promises.push(
        axios.post(`${BASE_URL}/api/campaigns`, {
          name: `Load Test Campaign ${i + j}`,
          platform: 'google_ads',
          budget: Math.random() * 1000,
          status: 'active'
        }).catch(err => null)
      );
    }
    await Promise.all(promises);
    process.stdout.write(`\r   Created: ${Math.min(i + 10, campaignCount)}/${campaignCount}`);
  }
  console.log(' ✅');
  
  // Create executions
  console.log('🔄 Creating executions...');
  for (let i = 0; i < executionCount; i += 50) {
    const promises = [];
    for (let j = 0; j < 50 && (i + j) < executionCount; j++) {
      promises.push(
        axios.post(`${BASE_URL}/api/workflows/executions`, {
          workflow: 'campaign_launch',
          status: ['completed', 'failed', 'running'][Math.floor(Math.random() * 3)],
          startedAt: Date.now() - Math.random() * 86400000
        }).catch(err => null)
      );
    }
    await Promise.all(promises);
    process.stdout.write(`\r   Created: ${Math.min(i + 50, executionCount)}/${executionCount}`);
  }
  console.log(' ✅');
  
  // Create metrics
  console.log('📊 Creating metrics...');
  for (let i = 0; i < metricCount; i += 100) {
    const promises = [];
    for (let j = 0; j < 100 && (i + j) < metricCount; j++) {
      promises.push(
        axios.post(`${BASE_URL}/api/analytics/metrics`, {
          platform: ['google_ads', 'meta_ads', 'pinterest'][Math.floor(Math.random() * 3)],
          metric: ['impressions', 'clicks', 'conversions'][Math.floor(Math.random() * 3)],
          value: Math.random() * 10000
        }).catch(err => null)
      );
    }
    await Promise.all(promises);
    process.stdout.write(`\r   Created: ${Math.min(i + 100, metricCount)}/${metricCount}`);
  }
  console.log(' ✅');
  
  const loadDuration = Date.now() - start;
  console.log(`\n⏱️  Data loading completed in ${(loadDuration / 1000).toFixed(2)}s`);
  
  // Test query performance with loaded data
  console.log('\n🔍 Testing query performance with loaded data...');
  
  const queryStart = Date.now();
  await axios.get(`${BASE_URL}/api/campaigns?limit=100`);
  const campaignQueryTime = Date.now() - queryStart;
  
  const execQueryStart = Date.now();
  await axios.get(`${BASE_URL}/api/workflows/executions?limit=100`);
  const executionQueryTime = Date.now() - execQueryStart;
  
  const analyticsQueryStart = Date.now();
  await axios.get(`${BASE_URL}/api/analytics/summary`);
  const analyticsQueryTime = Date.now() - analyticsQueryStart;
  
  console.log(`   Campaign query: ${campaignQueryTime}ms`);
  console.log(`   Execution query: ${executionQueryTime}ms`);
  console.log(`   Analytics query: ${analyticsQueryTime}ms`);
  
  const allQueriesPass = campaignQueryTime < 200 && executionQueryTime < 200 && analyticsQueryTime < 500;
  
  results.benchmarks.push({
    name: 'Database Volume',
    campaignCount,
    executionCount,
    metricCount,
    loadDuration,
    campaignQueryTime,
    executionQueryTime,
    analyticsQueryTime,
    passed: allQueriesPass
  });
}

// ===================
// STRESS TESTS
// ===================

async function stress_test_rapid_api_calls() {
  console.log('\n🔥 STRESS TEST: Rapid API Calls');
  console.log('-'.repeat(60));
  
  const requestCount = 100;
  const start = Date.now();
  
  console.log(`📊 Sending ${requestCount} rapid requests...`);
  
  const promises = [];
  for (let i = 0; i < requestCount; i++) {
    promises.push(
      axios.get(`${BASE_URL}/api/analytics/summary`).catch(err => ({ error: err.message }))
    );
  }
  
  const responses = await Promise.all(promises);
  const successCount = responses.filter(r => !r.error && r.status === 200).length;
  const duration = Date.now() - start;
  
  console.log(`✅ Successful: ${successCount}/${requestCount}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/sec`);
  
  results.benchmarks.push({
    name: 'Rapid API Calls',
    requestCount,
    successCount,
    duration,
    throughput: (requestCount / (duration / 1000)).toFixed(2),
    passed: successCount >= requestCount * 0.95 // 95% success rate
  });
}

// ====================
// TEST RUNNER
// ====================

async function runAllBenchmarks() {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ AD OPS COMMAND CENTER - PERFORMANCE BENCHMARK SUITE');
  console.log('Week 10, Day 43: Performance Testing');
  console.log('='.repeat(60));
  
  // Check server
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and healthy\n');
  } catch (error) {
    console.error('❌ Server is not accessible. Please start the server first.');
    process.exit(1);
  }
  
  console.log('\n💾 DATABASE PERFORMANCE');
  console.log('-'.repeat(60));
  await runBenchmark('Campaign Query', benchmark_db_campaign_query, TARGETS.dbQueryTime);
  await runBenchmark('Execution Query', benchmark_db_execution_query, TARGETS.dbQueryTime);
  await runBenchmark('Metrics Query', benchmark_db_metrics_query, TARGETS.dbQueryTime);
  await runBenchmark('Complex Join Query', benchmark_db_complex_join, TARGETS.dbQueryTime * 2);
  await runBenchmark('Batch Insert (10 records)', benchmark_db_insert_performance, TARGETS.dbQueryTime * 3);
  
  console.log('\n🌐 API PERFORMANCE');
  console.log('-'.repeat(60));
  await runBenchmark('Health Check', benchmark_api_health_check, 50);
  await runBenchmark('Analytics Summary', benchmark_api_analytics_summary, TARGETS.apiResponseTime);
  await runBenchmark('Workflow List', benchmark_api_workflow_list, TARGETS.apiResponseTime);
  await runBenchmark('Cross-Platform Analytics', benchmark_api_cross_platform_analytics, TARGETS.apiResponseTime);
  await runBenchmark('Recommendation Generation', benchmark_api_recommendation_generation, 1000);
  
  console.log('\n📡 SSE PERFORMANCE');
  console.log('-'.repeat(60));
  await runBenchmark('SSE Connection Time', benchmark_sse_connection_time, 1000);
  await runBenchmark('SSE Broadcast Latency', benchmark_sse_broadcast_latency, TARGETS.sseBroadcastLatency * 10);
  
  console.log('\n⚙️  WORKFLOW PERFORMANCE');
  console.log('-'.repeat(60));
  await runBenchmark('Workflow Execution Time', benchmark_workflow_execution_time, 10000);
  
  // Load tests
  await load_test_concurrent_workflows();
  await load_test_sse_connections();
  await load_test_database_volume();
  
  // Stress tests
  await stress_test_rapid_api_calls();
  
  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    targets: TARGETS,
    summary: {
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    },
    benchmarks: results.benchmarks
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'test-performance-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Detailed report saved to: test-performance-report.json\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  runAllBenchmarks().catch(error => {
    console.error('💥 Performance test crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllBenchmarks };
