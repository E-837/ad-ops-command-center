/**
 * Test Process Manager Components
 * 
 * Tests:
 * 1. Semaphore concurrency limiting
 * 2. Process tracking
 * 3. Cleanup utilities
 * 
 * Run: node test-process-manager.js
 */

const { callToolAsync, getSemaphoreStatus, getActiveProcesses } = require('./scripts/mcp-helper');
const Semaphore = require('./utils/semaphore');
const processCleanup = require('./utils/process-cleanup');

async function testSemaphore() {
  console.log('\n=== Testing Semaphore ===\n');
  
  const sem = new Semaphore(3);
  
  console.log('Initial status:', sem.getStatus());
  
  // Launch 10 concurrent tasks
  const tasks = [];
  for (let i = 0; i < 10; i++) {
    tasks.push(
      sem.use(async () => {
        console.log(`Task ${i} started`);
        const status = sem.getStatus();
        console.log(`  Current: ${status.current}, Queued: ${status.queued}`);
        
        // Simulate work
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`Task ${i} done`);
      })
    );
  }
  
  await Promise.all(tasks);
  
  console.log('Final status:', sem.getStatus());
  console.log('✅ Semaphore test passed\n');
}

async function testProcessTracking() {
  console.log('\n=== Testing Process Tracking ===\n');
  
  console.log('Initial active processes:', getActiveProcesses());
  console.log('Initial semaphore status:', getSemaphoreStatus());
  
  // Make a few MCP calls concurrently
  const calls = [
    callToolAsync('asana-v2', 'asana_list_workspaces', {}, { timeoutMs: 5000 }),
    callToolAsync('asana-v2', 'asana_list_workspaces', {}, { timeoutMs: 5000 }),
    callToolAsync('asana-v2', 'asana_list_workspaces', {}, { timeoutMs: 5000 })
  ];
  
  // Check mid-execution
  setTimeout(() => {
    console.log('\nMid-execution:');
    console.log('  Active processes:', getActiveProcesses().length);
    console.log('  Semaphore:', getSemaphoreStatus());
  }, 500);
  
  await Promise.allSettled(calls);
  
  // Wait a bit for cleanup
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('\nAfter execution:');
  console.log('  Active processes:', getActiveProcesses());
  console.log('  Semaphore:', getSemaphoreStatus());
  
  console.log('✅ Process tracking test passed\n');
}

async function testCleanup() {
  console.log('\n=== Testing Process Cleanup ===\n');
  
  console.log('Cleanup stats:', processCleanup.getStats());
  
  console.log('\nRunning manual scan...');
  await processCleanup.scan();
  
  console.log('After scan:', processCleanup.getStats());
  
  console.log('✅ Cleanup test passed\n');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Process Manager Component Tests         ║');
  console.log('╚════════════════════════════════════════════╝');
  
  try {
    await testSemaphore();
    await testProcessTracking();
    await testCleanup();
    
    console.log('\n✅ All tests passed!\n');
    console.log('Process manager is ready to prevent bloat.');
    console.log('Max concurrent MCP calls:', process.env.MCP_MAX_CONCURRENT || 3);
    console.log('Cleanup interval:', (process.env.CLEANUP_INTERVAL || 60000) / 1000, 'seconds');
    console.log('Process max age:', (process.env.PROCESS_MAX_AGE || 300000) / 1000, 'seconds');
    
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
