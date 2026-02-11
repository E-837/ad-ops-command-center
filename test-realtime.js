/**
 * Real-time SSE Test Suite
 * Tests for Server-Sent Events functionality
 */

const http = require('http');
const EventSource = require('eventsource');
const sseManager = require('./events/sse-manager');
const eventBus = require('./events/bus');
const eventTypes = require('./events/types');

// Test configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const TEST_TIMEOUT = 10000;

// Test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper: Run a test with timeout
 */
async function runTest(name, testFn, timeout = TEST_TIMEOUT) {
  testsRun++;
  console.log(`\n🧪 Test: ${name}`);
  
  try {
    await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
    
    testsPassed++;
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

/**
 * Test 1: SSE Connection Test
 */
async function testConnection() {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${SERVER_URL}/api/stream`);
    let connected = false;
    
    eventSource.onopen = () => {
      connected = true;
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          console.log(`   Connected with client ID: ${data.data.clientId}`);
          eventSource.close();
          resolve();
        }
      } catch (err) {
        eventSource.close();
        reject(err);
      }
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      if (!connected) {
        reject(new Error('Failed to connect to SSE stream'));
      }
    };
  });
}

/**
 * Test 2: Event Broadcast Test
 */
async function testEventBroadcast() {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${SERVER_URL}/api/stream`);
    let receivedConnection = false;
    let receivedEvent = false;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          receivedConnection = true;
          
          // Emit a test event after connection
          setTimeout(() => {
            eventBus.emit(eventTypes.WORKFLOW_STARTED, {
              workflowId: 'test-workflow',
              executionId: 'test-execution-' + Date.now(),
              startedAt: new Date().toISOString()
            });
          }, 100);
        } else if (data.type === 'workflow.started') {
          receivedEvent = true;
          console.log(`   Received event: ${data.type}`);
          console.log(`   Execution ID: ${data.data.executionId}`);
          eventSource.close();
          resolve();
        }
      } catch (err) {
        eventSource.close();
        reject(err);
      }
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      reject(new Error('SSE error during broadcast test'));
    };
    
    setTimeout(() => {
      eventSource.close();
      if (!receivedEvent) {
        reject(new Error('Did not receive broadcasted event'));
      }
    }, 5000);
  });
}

/**
 * Test 3: Filtered Stream Test
 */
async function testFilteredStream() {
  return new Promise((resolve, reject) => {
    const executionId = 'test-execution-filtered-' + Date.now();
    const eventSource = new EventSource(`${SERVER_URL}/api/stream?executionId=${executionId}`);
    let receivedConnection = false;
    let receivedCorrectEvent = false;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          receivedConnection = true;
          console.log(`   Filters applied: ${JSON.stringify(data.data.filters)}`);
          
          // Emit events - one matching, one not matching
          setTimeout(() => {
            eventBus.emit(eventTypes.WORKFLOW_STARTED, {
              workflowId: 'test-workflow',
              executionId: 'wrong-execution-id',
              startedAt: new Date().toISOString()
            });
            
            eventBus.emit(eventTypes.WORKFLOW_STARTED, {
              workflowId: 'test-workflow',
              executionId: executionId,
              startedAt: new Date().toISOString()
            });
          }, 100);
        } else if (data.type === 'workflow.started') {
          if (data.data.executionId === executionId) {
            receivedCorrectEvent = true;
            console.log(`   Received filtered event for: ${executionId}`);
            eventSource.close();
            resolve();
          } else {
            eventSource.close();
            reject(new Error(`Received event for wrong execution ID: ${data.data.executionId}`));
          }
        }
      } catch (err) {
        eventSource.close();
        reject(err);
      }
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      reject(new Error('SSE error during filtered stream test'));
    };
  });
}

/**
 * Test 4: Reconnection Test
 */
async function testReconnection() {
  // This test verifies that client can reconnect after disconnect
  return new Promise((resolve, reject) => {
    let connectionCount = 0;
    
    const connect = () => {
      const eventSource = new EventSource(`${SERVER_URL}/api/stream`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            connectionCount++;
            console.log(`   Connection ${connectionCount} established`);
            
            eventSource.close();
            
            if (connectionCount === 1) {
              // Reconnect after first disconnect
              setTimeout(connect, 500);
            } else {
              // Success after second connection
              resolve();
            }
          }
        } catch (err) {
          eventSource.close();
          reject(err);
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        if (connectionCount === 0) {
          reject(new Error('Failed initial connection'));
        }
      };
    };
    
    connect();
  });
}

/**
 * Test 5: Concurrent Clients Test
 */
async function testConcurrentClients() {
  const clientCount = 10;
  const clients = [];
  
  return new Promise((resolve, reject) => {
    let connectedCount = 0;
    let receivedEventCount = 0;
    
    // Create 10 concurrent clients
    for (let i = 0; i < clientCount; i++) {
      const eventSource = new EventSource(`${SERVER_URL}/api/stream`);
      clients.push(eventSource);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            connectedCount++;
            
            // When all clients connected, emit a test event
            if (connectedCount === clientCount) {
              console.log(`   All ${clientCount} clients connected`);
              setTimeout(() => {
                eventBus.emit(eventTypes.WORKFLOW_COMPLETED, {
                  workflowId: 'concurrent-test',
                  executionId: 'concurrent-exec-' + Date.now(),
                  completedAt: new Date().toISOString()
                });
              }, 100);
            }
          } else if (data.type === 'workflow.completed') {
            receivedEventCount++;
            console.log(`   Client ${receivedEventCount}/${clientCount} received event`);
            
            // When all clients received the event, success
            if (receivedEventCount === clientCount) {
              clients.forEach(c => c.close());
              resolve();
            }
          }
        } catch (err) {
          clients.forEach(c => c.close());
          reject(err);
        }
      };
      
      eventSource.onerror = (error) => {
        clients.forEach(c => c.close());
        reject(new Error(`Client ${i + 1} error`));
      };
    }
    
    setTimeout(() => {
      clients.forEach(c => c.close());
      if (receivedEventCount < clientCount) {
        reject(new Error(`Only ${receivedEventCount}/${clientCount} clients received event`));
      }
    }, 8000);
  });
}

/**
 * Test 6: SSE Stats Endpoint
 */
async function testStatsEndpoint() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/stream/stats`);
      const stats = await response.json();
      
      console.log(`   Active clients: ${stats.activeClients}`);
      console.log(`   Queued events: ${stats.queuedEvents}`);
      
      if (typeof stats.activeClients !== 'number') {
        reject(new Error('Invalid stats response'));
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting SSE Real-time Test Suite\n');
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Test Timeout: ${TEST_TIMEOUT}ms\n`);
  console.log('═'.repeat(60));
  
  // Wait for server to be ready
  console.log('\n⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run tests
  await runTest('SSE Connection Test', testConnection);
  await runTest('Event Broadcast Test', testEventBroadcast);
  await runTest('Filtered Stream Test', testFilteredStream);
  await runTest('Reconnection Test', testReconnection);
  await runTest('Concurrent Clients Test (10 clients)', testConcurrentClients, 15000);
  await runTest('SSE Stats Endpoint Test', testStatsEndpoint);
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`   Total Tests: ${testsRun}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%\n`);
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed\n');
    process.exit(1);
  }
}

// Handle module not found for eventsource (in case it's not installed)
if (typeof EventSource === 'undefined') {
  console.log('\n⚠️  eventsource module not found. Installing...\n');
  console.log('Run: npm install eventsource\n');
  process.exit(1);
}

// Run tests if this is the main module
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testConnection,
  testEventBroadcast,
  testFilteredStream,
  testReconnection,
  testConcurrentClients,
  testStatsEndpoint
};
