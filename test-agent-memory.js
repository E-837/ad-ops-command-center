/**
 * Agent Memory System Tests
 * Tests for agent memory and context models
 */

const { agentMemory, agentContext } = require('./database/models');

async function runTests() {
  console.log('🧪 Testing Agent Memory System...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Store and recall memory
  try {
    console.log('Test 1: Store and recall memory');
    
    await agentMemory.remember(
      'media-planner',
      'campaign_performance',
      'retail_awareness_q1',
      { platform: 'meta', roas: 3.5, cpa: 25 },
      0.8,
      'campaign_123'
    );

    const recalled = await agentMemory.recall(
      'media-planner',
      'campaign_performance',
      'retail_awareness_q1'
    );

    if (recalled && recalled.value.roas === 3.5) {
      console.log('✅ PASSED: Memory stored and recalled correctly\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Memory recall mismatch\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Search memories with filters
  try {
    console.log('Test 2: Search memories with filters');
    
    await agentMemory.remember('trader', 'optimization_outcomes', 'bid_test_1', 
      { action: 'bid_increase', lift: 15 }, 0.7, 'test_1');
    await agentMemory.remember('trader', 'optimization_outcomes', 'bid_test_2', 
      { action: 'bid_decrease', lift: -5 }, 0.5, 'test_2');
    await agentMemory.remember('trader', 'optimization_outcomes', 'bid_test_3', 
      { action: 'bid_increase', lift: 20 }, 0.9, 'test_3');

    const results = await agentMemory.search('trader', 'optimization_outcomes', {
      minConfidence: 0.6
    });

    if (results.length >= 2 && results[0].confidence >= 0.6) {
      console.log(`✅ PASSED: Found ${results.length} memories with confidence >= 0.6\n`);
      testsPassed++;
    } else {
      console.log('❌ FAILED: Search filter not working correctly\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Update confidence
  try {
    console.log('Test 3: Update memory confidence');
    
    const memory = await agentMemory.recall('trader', 'optimization_outcomes', 'bid_test_2');
    
    await agentMemory.updateConfidence(memory.id, 0.85);
    
    const updated = await agentMemory.recall('trader', 'optimization_outcomes', 'bid_test_2');

    if (updated && updated.confidence === 0.85) {
      console.log('✅ PASSED: Confidence updated correctly\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Confidence update failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Auto-forget low confidence memories
  try {
    console.log('Test 4: Auto-forget low confidence memories');
    
    await agentMemory.remember('analyst', 'anomaly_patterns', 'test_low_conf', 
      { pattern: 'test' }, 0.25, 'test');

    const memory = await agentMemory.recall('analyst', 'anomaly_patterns', 'test_low_conf');
    
    // Try to update to even lower confidence (should trigger forget)
    await agentMemory.updateConfidence(memory.id, 0.2);
    
    const forgotten = await agentMemory.recall('analyst', 'anomaly_patterns', 'test_low_conf');

    if (!forgotten) {
      console.log('✅ PASSED: Low confidence memory auto-forgotten\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Memory should have been forgotten\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Get top memories
  try {
    console.log('Test 5: Get top memories by confidence');
    
    const topMemories = await agentMemory.getTopMemories('trader', 'optimization_outcomes', 3);

    if (topMemories.length > 0 && topMemories[0].confidence >= topMemories[topMemories.length - 1].confidence) {
      console.log(`✅ PASSED: Retrieved ${topMemories.length} top memories, sorted by confidence\n`);
      testsPassed++;
    } else {
      console.log('❌ FAILED: Top memories not sorted correctly\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Set and get agent context
  try {
    console.log('Test 6: Set and get agent context');
    
    await agentContext.setContext(
      'creative-ops',
      'session_001',
      { currentCampaign: 'retail_q1', testingCreative: true },
      3600
    );

    const context = await agentContext.getContext('creative-ops', 'session_001');

    if (context && context.context.currentCampaign === 'retail_q1') {
      console.log('✅ PASSED: Context stored and retrieved correctly\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Context retrieval failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 7: Update context
  try {
    console.log('Test 7: Update context');
    
    await agentContext.updateContext('creative-ops', 'session_001', {
      testingCreative: false,
      creativeApproved: true
    });

    const updated = await agentContext.getContext('creative-ops', 'session_001');

    if (updated && updated.context.creativeApproved === true && updated.context.currentCampaign === 'retail_q1') {
      console.log('✅ PASSED: Context updated and merged correctly\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Context update failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 8: Context expiration
  try {
    console.log('Test 8: Context expiration (TTL)');
    
    // Set context with 1 second TTL
    await agentContext.setContext('test-agent', 'session_ttl', { data: 'test' }, 1);

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    const expired = await agentContext.getContext('test-agent', 'session_ttl');

    if (!expired) {
      console.log('✅ PASSED: Expired context correctly filtered out\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Expired context should not be retrievable\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
