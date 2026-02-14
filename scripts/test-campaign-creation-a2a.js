/**
 * Test Script: Campaign Creation A2A Workflow
 * 
 * Tests the multi-agent A2A campaign creation pipeline with:
 * - MediaPlanner strategy creation
 * - Analyst historical analysis
 * - Trader campaign configuration
 * - CreativeOps AI creative generation
 * - Compliance brand safety review
 * - Trader final launch
 * - Atlas orchestration and summary
 */

const path = require('path');

// Set up paths
const workflowPath = path.join(__dirname, '..', 'workflows', 'campaign-ops', 'campaign-creation-a2a.js');
const workflow = require(workflowPath);

console.log('\n' + '='.repeat(80));
console.log('A2A CAMPAIGN CREATION WORKFLOW TEST');
console.log('='.repeat(80));

// Test parameters
const testParams = {
  campaignName: 'Brand X Q1 2026 Awareness Campaign',
  advertiser: 'Brand X Corp',
  budget: 150000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  objective: 'awareness',
  targetAudience: 'Tech-savvy millennials, 25-40, high income, interested in innovation',
  platforms: ['google-ads', 'meta-ads', 'ttd']
};

console.log('\n📋 Test Parameters:');
console.log(JSON.stringify(testParams, null, 2));
console.log('\n' + '='.repeat(80));

// Run workflow
async function runTest() {
  try {
    const result = await workflow.run(testParams);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n📊 Results Summary:');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`Campaign ID: ${result.result?.campaignId || 'N/A'}`);
    
    if (result.result) {
      console.log(`\nPlatforms Launched:`);
      Object.entries(result.result.platforms).forEach(([platform, data]) => {
        console.log(`  - ${platform}: ${data.campaignId} (${data.status}) - $${data.budget.toLocaleString()}`);
      });
      
      console.log(`\nCreatives Generated:`);
      result.result.creatives.forEach((creative, idx) => {
        console.log(`  ${idx + 1}. ${creative.size} - ${creative.url}`);
      });
      
      console.log(`\nCompliance:`);
      console.log(`  Approved: ${result.result.compliance.approved}`);
      console.log(`  Issues: ${result.result.compliance.issues}`);
      console.log(`  Notes: ${result.result.compliance.notes}`);
      
      console.log(`\nStrategy:`);
      console.log(`  Channels: ${result.result.strategy.channels.join(', ')}`);
      console.log(`  KPIs: ${result.result.strategy.kpis.join(', ')}`);
      
      console.log(`\nSummary:`);
      console.log(`  ${result.result.summary}`);
    }
    
    console.log(`\n📨 A2A Messages Exchanged: ${result.messages?.length || 0}`);
    
    // Save full results
    const fs = require('fs');
    const outputPath = path.join(__dirname, '..', 'output', `a2a-campaign-test-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Full results saved to: ${outputPath}`);
    
    console.log('\n' + '='.repeat(80));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
