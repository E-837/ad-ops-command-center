/**
 * Recommendations Service Tests
 * Tests for recommendation engine
 */

const recommendations = require('./services/recommendations');
const { campaigns, metrics, agentMemory } = require('./database/models');
const knex = require('./database/db');

async function setupTestData() {
  // Create test campaign
  const campaign = await campaigns.create({
    name: 'Test Campaign',
    status: 'active',
    platform: 'multi',
    budget: 10000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Add test metrics
  await metrics.record({
    campaignId: campaign.id,
    platform: 'meta',
    spend: 500,
    revenue: 2000,
    conversions: 50,
    impressions: 10000,
    clicks: 300,
    ctr: 3.0,
    cpc: 1.67
  });

  await metrics.record({
    campaignId: campaign.id,
    platform: 'google',
    spend: 300,
    revenue: 600,
    conversions: 20,
    impressions: 5000,
    clicks: 150,
    ctr: 3.0,
    cpc: 2.0
  });

  await metrics.record({
    campaignId: campaign.id,
    platform: 'tiktok',
    spend: 200,
    revenue: 200,
    conversions: 10,
    impressions: 8000,
    clicks: 100,
    ctr: 1.25,
    cpc: 2.0
  });

  // Add some historical memories
  await agentMemory.remember('trader', 'optimization_outcomes', 'budget_reallocation_test', {
    action: 'budget_reallocation',
    lift: 18
  }, 0.7, 'test');

  return campaign.id;
}

async function runTests() {
  console.log('🧪 Testing Recommendations Service...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const campaignId = await setupTestData();

  // Test 1: Budget recommendation
  try {
    console.log('Test 1: Get budget recommendation');
    
    const recommendation = await recommendations.getBudgetRecommendation(campaignId);

    if (recommendation && recommendation.action) {
      console.log(`✅ PASSED: Budget recommendation generated (action: ${recommendation.action})`);
      console.log(`   Confidence: ${recommendation.confidence}`);
      if (recommendation.to) {
        console.log(`   Reallocate to: ${recommendation.to.platform} (ROAS: ${recommendation.to.currentROAS.toFixed(2)})`);
      }
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: No budget recommendation generated\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Bid recommendation
  try {
    console.log('Test 2: Get bid recommendation');
    
    const recommendation = await recommendations.getBidRecommendation(campaignId, 'meta');

    if (recommendation && recommendation.action) {
      console.log(`✅ PASSED: Bid recommendation generated (action: ${recommendation.action})`);
      console.log(`   Reason: ${recommendation.reason}`);
      console.log(`   Confidence: ${recommendation.confidence}`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: No bid recommendation generated\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Platform recommendation
  try {
    console.log('Test 3: Get platform mix recommendation');
    
    const recommendation = await recommendations.getPlatformRecommendation(10000, {
      primary: 'conversion'
    });

    if (recommendation && recommendation.allocation) {
      console.log('✅ PASSED: Platform recommendation generated');
      console.log(`   Objective: ${recommendation.objective}`);
      console.log(`   Confidence: ${recommendation.confidence}`);
      console.log('   Allocation:', Object.keys(recommendation.allocation).map(p => 
        `${p}: $${recommendation.allocation[p].amount}`
      ).join(', '));
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: No platform recommendation generated\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Optimization priorities
  try {
    console.log('Test 4: Get optimization priorities');
    
    const priorities = await recommendations.getOptimizationPriorities(campaignId);

    if (Array.isArray(priorities)) {
      console.log(`✅ PASSED: Optimization priorities generated (${priorities.length} recommendations)`);
      priorities.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.type}: ${rec.action} (confidence: ${rec.confidence})`);
      });
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Priorities should be an array\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: All recommendations
  try {
    console.log('Test 5: Get all recommendations for campaign');
    
    const allRecs = await recommendations.getAllRecommendations(campaignId);

    if (allRecs && allRecs.recommendations && allRecs.priorities) {
      console.log('✅ PASSED: All recommendations retrieved');
      console.log(`   Budget: ${allRecs.recommendations.budget.action}`);
      console.log(`   Bid: ${allRecs.recommendations.bid.action}`);
      console.log(`   Targeting: ${allRecs.recommendations.targeting.action}`);
      console.log(`   Creative: ${allRecs.recommendations.creative.action}`);
      console.log(`   Top ${allRecs.priorities.length} priorities identified`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: All recommendations structure invalid\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Recommendation confidence scoring
  try {
    console.log('Test 6: Recommendation confidence scoring');
    
    const budgetRec = await recommendations.getBudgetRecommendation(campaignId);

    if (budgetRec.confidence && budgetRec.confidence >= 0 && budgetRec.confidence <= 1) {
      console.log(`✅ PASSED: Confidence score valid (${budgetRec.confidence})`);
      console.log();
      testsPassed++;
    } else {
      console.log('❌ FAILED: Confidence score should be between 0 and 1\n');
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
