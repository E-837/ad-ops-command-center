/**
 * Predictions Service Tests
 * Tests for predictive analytics and budget optimization
 */

const predictions = require('./services/predictions');
const { campaigns, metrics } = require('./database/models');
const knex = require('./database/db');

async function setupTestData() {
  // Create test campaign
  const campaign = await campaigns.create({
    name: 'Prediction Test Campaign',
    status: 'active',
    platform: 'multi',
    budget: 10000,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Add 14 days of historical metrics
  for (let i = 14; i >= 1; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    
    await metrics.record({
      campaignId: campaign.id,
      platform: 'meta',
      spend: 300 + Math.random() * 50,
      revenue: 1200 + Math.random() * 200,
      conversions: 30 + Math.floor(Math.random() * 10),
      impressions: 10000 + Math.floor(Math.random() * 2000),
      clicks: 400 + Math.floor(Math.random() * 50),
      ctr: 4.0,
      cpc: 0.75,
      timestamp: date.toISOString()
    });

    await metrics.record({
      campaignId: campaign.id,
      platform: 'google',
      spend: 200 + Math.random() * 30,
      revenue: 600 + Math.random() * 100,
      conversions: 20 + Math.floor(Math.random() * 5),
      impressions: 8000 + Math.floor(Math.random() * 1000),
      clicks: 300 + Math.floor(Math.random() * 30),
      ctr: 3.75,
      cpc: 0.67,
      timestamp: date.toISOString()
    });
  }

  return campaign.id;
}

async function runTests() {
  console.log('🧪 Testing Predictions Service...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const campaignId = await setupTestData();

  // Test 1: Predict performance
  try {
    console.log('Test 1: Predict campaign performance');
    
    const prediction = await predictions.predictPerformance(campaignId, 15000);

    if (prediction && prediction.predictions) {
      console.log('✅ PASSED: Performance prediction generated');
      console.log(`   Proposed budget: $${prediction.proposedBudget}`);
      console.log(`   Predicted conversions: ${prediction.predictions.conversions}`);
      console.log(`   Predicted ROAS: ${prediction.predictions.roas}`);
      console.log(`   Predicted CPA: $${prediction.predictions.cpa}`);
      console.log(`   Confidence: ${prediction.confidence}`);
      console.log(`   Data points: ${prediction.dataPoints}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Performance prediction failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Diminishing returns calculation
  try {
    console.log('Test 2: Test diminishing returns');
    
    const baseline = await predictions.predictPerformance(campaignId, 10000);
    const increased = await predictions.predictPerformance(campaignId, 20000);

    if (baseline && increased) {
      const baselineROAS = baseline.predictions.roas;
      const increasedROAS = increased.predictions.roas;
      
      if (increasedROAS < baselineROAS) {
        console.log('✅ PASSED: Diminishing returns applied correctly');
        console.log(`   Baseline ROAS (10k): ${baselineROAS.toFixed(2)}`);
        console.log(`   Increased ROAS (20k): ${increasedROAS.toFixed(2)}`);
        console.log();
        testsPassed++;
      } else {
        console.log('❌ FAILED: Diminishing returns not applied\n');
        testsFailed++;
      }
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Optimize budget allocation
  try {
    console.log('Test 3: Optimize budget allocation');
    
    const optimization = await predictions.optimizeBudgetAllocation(10000, ['meta', 'google', 'tiktok']);

    if (optimization && optimization.allocations) {
      const totalAllocated = optimization.allocations.reduce((sum, a) => sum + a.recommended, 0);
      
      if (Math.abs(totalAllocated - 10000) < 100) { // Allow small rounding differences
        console.log('✅ PASSED: Budget allocation optimized');
        console.log(`   Total budget: $${optimization.totalBudget}`);
        optimization.allocations.forEach(a => {
          console.log(`   ${a.platform}: $${a.recommended} (${a.percentage}%) - ROAS: ${a.currentROAS}`);
        });
        console.log(`   Confidence: ${optimization.confidence}`);
        console.log();
        testsPassed++;
      } else {
        console.log(`❌ FAILED: Allocated total (${totalAllocated}) doesn't match budget (10000)\n`);
        testsFailed++;
      }
    } else {
      console.log('❌ FAILED: Budget allocation failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Detect trend
  try {
    console.log('Test 4: Detect metric trend');
    
    const trend = await predictions.detectTrend(campaignId, 'conversions');

    if (trend && trend.direction) {
      console.log('✅ PASSED: Trend detected');
      console.log(`   Metric: ${trend.metric}`);
      console.log(`   Direction: ${trend.direction}`);
      console.log(`   Strength: ${trend.strength}`);
      console.log(`   R-squared: ${trend.rSquared}`);
      console.log(`   Confidence: ${trend.confidence}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Trend detection failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Get trend analysis
  try {
    console.log('Test 5: Get comprehensive trend analysis');
    
    const analysis = await predictions.getTrendAnalysis(campaignId);

    if (analysis && analysis.trends && analysis.summary) {
      console.log('✅ PASSED: Trend analysis completed');
      console.log(`   Overall health: ${analysis.overallHealth}`);
      console.log(`   Increasing: ${analysis.summary.increasingMetrics.join(', ') || 'none'}`);
      console.log(`   Decreasing: ${analysis.summary.decreasingMetrics.join(', ') || 'none'}`);
      console.log(`   Stable: ${analysis.summary.stableMetrics.join(', ') || 'none'}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Trend analysis failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Confidence scoring
  try {
    console.log('Test 6: Confidence scoring based on data volume');
    
    const lowDataConfidence = predictions.calculateConfidence(5);
    const mediumDataConfidence = predictions.calculateConfidence(20);
    const highDataConfidence = predictions.calculateConfidence(35);

    if (lowDataConfidence < mediumDataConfidence && mediumDataConfidence < highDataConfidence) {
      console.log('✅ PASSED: Confidence scoring works correctly');
      console.log(`   5 data points: ${lowDataConfidence}`);
      console.log(`   20 data points: ${mediumDataConfidence}`);
      console.log(`   35 data points: ${highDataConfidence}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Confidence scoring incorrect\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 7: Predict ROAS
  try {
    console.log('Test 7: Predict platform ROAS');
    
    const predictedROAS = await predictions.predictROAS('meta', 5000);

    if (predictedROAS > 0) {
      console.log(`✅ PASSED: ROAS prediction generated (${predictedROAS.toFixed(2)})`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: ROAS prediction invalid\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 8: Budget constraints
  try {
    console.log('Test 8: Budget allocation respects min/max constraints');
    
    const optimization = await predictions.optimizeBudgetAllocation(1000, ['meta', 'google', 'tiktok', 'pinterest']);

    if (optimization && optimization.allocations) {
      const allAboveMin = optimization.allocations.every(a => a.recommended >= 100);
      const noExceedsMax = optimization.allocations.every(a => a.recommended <= 1000 * 0.6);
      
      if (allAboveMin && noExceedsMax) {
        console.log('✅ PASSED: Budget constraints respected');
        console.log('   All allocations >= $100 minimum');
        console.log('   All allocations <= 60% maximum');
        console.log();
        testsPassed++;
      } else {
        console.log('❌ FAILED: Budget constraints violated\n');
        testsFailed++;
      }
    } else {
      console.log('❌ FAILED: Budget allocation failed\n');
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
