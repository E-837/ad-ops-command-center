/**
 * Test Suite: Analytics API
 * Tests for analytics service and API endpoints
 */

const analytics = require('./services/analytics');

console.log('\n🧪 Testing Analytics System\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Get Spend Trend
  try {
    console.log('Test 1: Get Spend Trend...');
    const result = await analytics.getSpendTrend({ days: 30 });
    
    if (result.data && Array.isArray(result.data) && result.dateRange) {
      console.log('✅ PASSED: Spend trend returned valid data');
      console.log(`   - Data points: ${result.data.length}`);
      console.log(`   - Date range: ${result.dateRange.startDate} to ${result.dateRange.endDate}`);
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Spend trend test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 2: Get CTR Comparison
  try {
    console.log('\nTest 2: Get CTR Comparison...');
    const result = await analytics.getCTRComparison({ days: 30 });
    
    if (result.data && Array.isArray(result.data)) {
      console.log('✅ PASSED: CTR comparison returned valid data');
      console.log(`   - Platforms analyzed: ${result.data.length}`);
      result.data.slice(0, 3).forEach(platform => {
        console.log(`   - ${platform.platform}: ${platform.ctr.toFixed(2)}% CTR`);
      });
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: CTR comparison test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 3: Get Conversion Funnel
  try {
    console.log('\nTest 3: Get Conversion Funnel...');
    const result = await analytics.getConversionFunnel({ days: 30 });
    
    if (result.data && Array.isArray(result.data) && result.data.length === 4) {
      console.log('✅ PASSED: Conversion funnel returned valid data');
      console.log(`   - Funnel stages: ${result.data.length}`);
      result.data.forEach(stage => {
        console.log(`   - ${stage.stage}: ${stage.value.toLocaleString()} (${stage.dropoff.toFixed(1)}% dropoff)`);
      });
      console.log(`   - Overall conversion rate: ${result.overallConversionRate.toFixed(2)}%`);
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Conversion funnel test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 4: Get ROAS by Campaign
  try {
    console.log('\nTest 4: Get ROAS by Campaign...');
    const result = await analytics.getROASByCampaign({ days: 30, limit: 10 });
    
    if (result.data && Array.isArray(result.data)) {
      console.log('✅ PASSED: ROAS by campaign returned valid data');
      console.log(`   - Top campaigns: ${result.data.length}`);
      result.data.slice(0, 5).forEach((campaign, idx) => {
        console.log(`   ${idx + 1}. ${campaign.campaignName}: ${campaign.roas.toFixed(2)}x ROAS`);
      });
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: ROAS by campaign test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 5: Get Budget Utilization
  try {
    console.log('\nTest 5: Get Budget Utilization...');
    const result = await analytics.getBudgetUtilization({ days: 30 });
    
    if (result.data && Array.isArray(result.data)) {
      console.log('✅ PASSED: Budget utilization returned valid data');
      console.log(`   - Platforms: ${result.data.length}`);
      result.data.forEach(platform => {
        console.log(`   - ${platform.platform}: ${platform.utilization.toFixed(1)}% utilized`);
      });
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Budget utilization test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 6: Get Performance Summary
  try {
    console.log('\nTest 6: Get Performance Summary...');
    const result = await analytics.getPerformanceSummary({ days: 30 });
    
    if (result.data && result.data.spend !== undefined) {
      console.log('✅ PASSED: Performance summary returned valid data');
      console.log(`   - Total Spend: $${result.data.spend.toLocaleString()}`);
      console.log(`   - Total Revenue: $${result.data.revenue.toLocaleString()}`);
      console.log(`   - ROAS: ${result.data.roas.toFixed(2)}x`);
      console.log(`   - CTR: ${result.data.ctr.toFixed(2)}%`);
      console.log(`   - Conversions: ${result.data.conversions.toLocaleString()}`);
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Performance summary test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 7: Get Platform Comparison
  try {
    console.log('\nTest 7: Get Platform Comparison...');
    const result = await analytics.getPlatformComparison({ days: 30 });
    
    if (result.platforms && result.totals) {
      console.log('✅ PASSED: Platform comparison returned valid data');
      console.log(`   - Platforms: ${result.platforms.length}`);
      result.platforms.forEach(platform => {
        console.log(`   - ${platform.name}: ROAS ${platform.roas.toFixed(2)}x, CTR ${platform.ctr.toFixed(2)}%`);
      });
      console.log(`   - Totals: $${result.totals.spend.toLocaleString()} spend, $${result.totals.revenue.toLocaleString()} revenue`);
      passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.log('❌ FAILED: Platform comparison test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 8: Filters - Platform Filter
  try {
    console.log('\nTest 8: Platform Filter...');
    const result = await analytics.getSpendTrend({ days: 30, platforms: 'google-ads,meta' });
    
    console.log('✅ PASSED: Platform filter works');
    console.log(`   - Filtered data points: ${result.data.length}`);
    passed++;
  } catch (err) {
    console.log('❌ FAILED: Platform filter test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Test 9: Filters - Date Range
  try {
    console.log('\nTest 9: Custom Date Range...');
    const result = await analytics.getSpendTrend({ 
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    });
    
    console.log('✅ PASSED: Custom date range works');
    console.log(`   - Date range: ${result.dateRange.startDate} to ${result.dateRange.endDate}`);
    passed++;
  } catch (err) {
    console.log('❌ FAILED: Custom date range test');
    console.log(`   Error: ${err.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
