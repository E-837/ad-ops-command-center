/**
 * A/B Testing Service Tests
 * Tests for A/B testing framework
 */

const abTesting = require('./services/ab-testing');
const { abTests, campaigns } = require('./database/models');

async function setupTestData() {
  // Create test campaign
  const campaign = await campaigns.create({
    name: 'A/B Test Campaign',
    status: 'active',
    platform: 'meta',
    budget: 5000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  return campaign.id;
}

async function runTests() {
  console.log('🧪 Testing A/B Testing Service...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const campaignId = await setupTestData();

  // Test 1: Create A/B test
  try {
    console.log('Test 1: Create A/B test');
    
    const test = await abTesting.createTest(
      campaignId,
      'creative',
      [
        { id: 'control', name: 'Current Creative', config: { type: 'image' } },
        { id: 'variant_a', name: 'New Video', config: { type: 'video' } }
      ],
      14
    );

    if (test && test.id && test.status === 'running') {
      console.log(`✅ PASSED: A/B test created (ID: ${test.id}, Status: ${test.status})`);
      console.log(`   Test type: ${test.testType}`);
      console.log(`   Variants: ${test.variants.length}`);
      console.log();
      testsPassed++;
      
      // Store test ID for later tests
      global.testId = test.id;
    } else {
      console.log('❌ FAILED: A/B test creation failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Get test status
  try {
    console.log('Test 2: Get test status');
    
    const status = await abTesting.getTestStatus(global.testId);

    if (status && status.progress !== undefined) {
      console.log(`✅ PASSED: Test status retrieved`);
      console.log(`   Progress: ${status.progress}%`);
      console.log(`   Days remaining: ${status.daysRemaining}`);
      console.log(`   Ready for analysis: ${status.readyForAnalysis}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Test status invalid\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Update test metrics
  try {
    console.log('Test 3: Update test metrics');
    
    // Update metrics for control variant
    await abTesting.updateTestMetrics(global.testId, 'control', {
      impressions: 10000,
      clicks: 300,
      conversions: 30,
      spend: 500,
      revenue: 900
    });

    // Update metrics for variant A
    await abTesting.updateTestMetrics(global.testId, 'variant_a', {
      impressions: 10000,
      clicks: 400,
      conversions: 45,
      spend: 500,
      revenue: 1350
    });

    const updated = await abTests.getById(global.testId);

    if (updated.variants[0].metrics.conversions === 30 && updated.variants[1].metrics.conversions === 45) {
      console.log('✅ PASSED: Test metrics updated correctly');
      console.log(`   Control conversions: ${updated.variants[0].metrics.conversions}`);
      console.log(`   Variant A conversions: ${updated.variants[1].metrics.conversions}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Metrics update failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Statistical significance calculation
  try {
    console.log('Test 4: Calculate statistical significance');
    
    const test = await abTests.getById(global.testId);
    const result = abTesting.calculateSignificance(test.variants[0], test.variants[1]);

    if (result && result.winner && result.lift) {
      console.log('✅ PASSED: Significance calculated');
      console.log(`   Winner: ${result.winner}`);
      console.log(`   Lift: ${result.lift}%`);
      console.log(`   P-value: ${result.pValue}`);
      console.log(`   Significant: ${result.significant}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Significance calculation failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Analyze test
  try {
    console.log('Test 5: Analyze test');
    
    const analysis = await abTesting.analyzeTest(global.testId);

    if (analysis && analysis.winner) {
      console.log('✅ PASSED: Test analyzed');
      console.log(`   Winner: ${analysis.winner}`);
      console.log(`   Lift: ${analysis.lift}%`);
      console.log(`   Confidence: ${analysis.confidence}%`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Test analysis failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Complete test with winner
  try {
    console.log('Test 6: Complete test and declare winner');
    
    const result = await abTesting.declareWinner(global.testId, false);

    if (result && result.winner && result.message) {
      console.log('✅ PASSED: Test completed with winner');
      console.log(`   ${result.message}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Test completion failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 7: Get tests by campaign
  try {
    console.log('Test 7: Get tests by campaign');
    
    const tests = await abTests.getByCampaign(campaignId);

    if (tests && tests.length > 0) {
      console.log(`✅ PASSED: Retrieved ${tests.length} test(s) for campaign`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: No tests found for campaign\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 8: Create multi-variant test
  try {
    console.log('Test 8: Create multi-variant test (3 variants)');
    
    const multiTest = await abTesting.createTest(
      campaignId,
      'bid',
      [
        { id: 'control', name: 'Current Bid', config: { bid: 2.0 } },
        { id: 'variant_a', name: 'Higher Bid', config: { bid: 2.5 } },
        { id: 'variant_b', name: 'Lower Bid', config: { bid: 1.5 } }
      ],
      10
    );

    if (multiTest && multiTest.variants.length === 3) {
      console.log(`✅ PASSED: Multi-variant test created (${multiTest.variants.length} variants)`);
      console.log();
      testsPassed++;
      
      // Cancel this test
      await abTests.cancel(multiTest.id);
    } else {
      console.log('❌ FAILED: Multi-variant test creation failed\n');
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
