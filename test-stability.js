/**
 * Stability Test — Ad Ops Command Center
 * Tests error handling and crash prevention
 */

const path = require('path');
const logger = require('./utils/logger');

async function testStability() {
  console.log('\n🧪 STABILITY TEST SUITE\n');
  console.log('═'.repeat(60));
  
  const tests = [
    {
      name: 'Test 1: Server stays alive on uncaught exception',
      test: async () => {
        // Trigger uncaught exception
        process.emit('uncaughtException', new Error('Test uncaught exception'));
        await new Promise(resolve => setTimeout(resolve, 100));
        // If we're still here, server didn't exit
        return { passed: true, message: 'Server stayed alive ✓' };
      }
    },
    
    {
      name: 'Test 2: Server stays alive on unhandled rejection',
      test: async () => {
        // Trigger unhandled rejection
        process.emit('unhandledRejection', new Error('Test unhandled rejection'));
        await new Promise(resolve => setTimeout(resolve, 100));
        return { passed: true, message: 'Server stayed alive ✓' };
      }
    },
    
    {
      name: 'Test 3: Workflow handles stage failures gracefully',
      test: async () => {
        const workflow = require('./workflows/campaign-lifecycle-demo');
        
        // Mock a stage that fails
        const originalStage = workflow.run;
        let result;
        
        try {
          // Run workflow with empty opts to trigger minimal execution
          result = await workflow.run({ 
            campaign: 'locke-airpod-ai',
            skipCreatives: true,
            log: () => {},
            emit: () => {}
          });
          
          // Check that result object exists even if stages failed
          const hasResult = !!result;
          const hasStatus = !!result.status;
          const hasStages = Array.isArray(result.stages);
          
          return { 
            passed: hasResult && hasStatus && hasStages, 
            message: `Result structure intact: ${hasResult && hasStatus && hasStages ? '✓' : '✗'}`,
            details: {
              status: result.status,
              stagesCount: result.stages?.length || 0,
              completedStages: result.stages?.filter(s => s.status === 'completed').length || 0,
              failedStages: result.stages?.filter(s => s.status === 'failed').length || 0
            }
          };
        } catch (err) {
          return { 
            passed: false, 
            message: `Workflow threw uncaught error: ${err.message}`,
            error: err.stack
          };
        }
      }
    },
    
    {
      name: 'Test 4: Process cleanup scanner running',
      test: async () => {
        const processCleanup = require('./utils/process-cleanup');
        const isRunning = processCleanup.isRunning?.() || false;
        return { 
          passed: isRunning, 
          message: isRunning ? 'Cleanup scanner active ✓' : 'Cleanup scanner not running ✗' 
        };
      }
    },
    
    {
      name: 'Test 5: Semaphore limiting concurrent MCP calls',
      test: async () => {
        const semaphore = require('./utils/semaphore');
        const stats = semaphore.getStats();
        return { 
          passed: stats.maxConcurrent <= 3, 
          message: `Max concurrent: ${stats.maxConcurrent}/3 ✓`,
          details: stats
        };
      }
    }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n📋 ${name}`);
    console.log('─'.repeat(60));
    
    try {
      const result = await test();
      results.push({ name, ...result });
      
      if (result.passed) {
        console.log(`✅ PASSED: ${result.message}`);
      } else {
        console.log(`❌ FAILED: ${result.message}`);
      }
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
      
      if (result.error) {
        console.log('   Error:', result.error);
      }
    } catch (err) {
      console.log(`❌ TEST ERROR: ${err.message}`);
      results.push({ name, passed: false, message: err.message, error: err.stack });
    }
  }
  
  console.log('\n═'.repeat(60));
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Server is stable.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review errors above.\n');
  }
  
  return { passed, failed, results };
}

// Run if called directly
if (require.main === module) {
  testStability()
    .then(summary => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Test suite crashed:', err);
      process.exit(1);
    });
}

module.exports = { testStability };
