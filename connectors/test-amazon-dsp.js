/**
 * Amazon DSP Connector Test
 */

const connector = require('./amazon-dsp');

console.log('\x1b[33mAmazon DSP Connector Test Suite\x1b[0m\n');

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  // Test 1: Connector Info
  console.log('\x1b[34m━━━ Test 1: Connector Info ━━━\x1b[0m\n');
  try {
    const info = connector.getInfo();
    console.log(JSON.stringify(info, null, 2));
    if (info.name === 'Amazon DSP' && info.toolCount === 8) {
      console.log('\x1b[32m✓\x1b[0m Connector info correct\n');
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Connector info mismatch\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 2: Get Campaigns
  console.log('\x1b[34m━━━ Test 2: Get Campaigns ━━━\x1b[0m\n');
  try {
    const result = await connector.getCampaigns();
    if (result.success && Array.isArray(result.data)) {
      console.log(`\x1b[32m✓\x1b[0m Found ${result.data.length} campaigns\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Invalid response format\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 3: Get Campaign by ID
  console.log('\x1b[34m━━━ Test 3: Get Campaign by ID ━━━\x1b[0m\n');
  try {
    const result = await connector.getCampaign('amzn-camp-001');
    if (result.success && result.data.id === 'amzn-camp-001') {
      console.log(`\x1b[32m✓\x1b[0m Found campaign: ${result.data.name}\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Campaign not found\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 4: Get Pacing
  console.log('\x1b[34m━━━ Test 4: Get Pacing ━━━\x1b[0m\n');
  try {
    const result = await connector.getPacing();
    if (result.success && Array.isArray(result.data)) {
      console.log(`\x1b[32m✓\x1b[0m Pacing data for ${result.data.length} campaigns\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Invalid pacing data\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 5: Get Metrics
  console.log('\x1b[34m━━━ Test 5: Get Metrics ━━━\x1b[0m\n');
  try {
    const result = await connector.getMetrics('amzn-camp-001');
    if (result.success && result.data.metrics) {
      console.log(`\x1b[32m✓\x1b[0m Metrics retrieved: ${result.data.metrics.impressions} impressions\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Invalid metrics format\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 6: Get Retail Metrics
  console.log('\x1b[34m━━━ Test 6: Get Retail Metrics ━━━\x1b[0m\n');
  try {
    const result = await connector.getRetailMetrics('amzn-camp-001');
    if (result.success && result.data.roas) {
      console.log(`\x1b[32m✓\x1b[0m ROAS: ${result.data.roas}x\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Invalid retail metrics\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 7: Get Audience Segments
  console.log('\x1b[34m━━━ Test 7: Get Audience Segments ━━━\x1b[0m\n');
  try {
    const result = await connector.getAudienceSegments('inMarket');
    if (result.success && Array.isArray(result.data)) {
      console.log(`\x1b[32m✓\x1b[0m Found ${result.data.length} in-market segments\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Invalid audience data\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 8: Create Campaign
  console.log('\x1b[34m━━━ Test 8: Create Campaign ━━━\x1b[0m\n');
  try {
    const result = await connector.createCampaign({
      name: 'Test Campaign',
      advertiserId: 'test-adv',
      budget: 50000,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      channel: 'display',
      funnel: 'awareness',
      lob: 'test'
    });
    if (result.success && result.data.id) {
      console.log(`\x1b[32m✓\x1b[0m Created campaign: ${result.data.id}\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Campaign creation failed\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 9: Update Campaign
  console.log('\x1b[34m━━━ Test 9: Update Campaign ━━━\x1b[0m\n');
  try {
    const result = await connector.updateCampaign('amzn-camp-001', { status: 'paused' });
    if (result.success && result.data.status === 'paused') {
      console.log(`\x1b[32m✓\x1b[0m Campaign updated\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Update failed\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Test 10: Test Connection
  console.log('\x1b[34m━━━ Test 10: Test Connection ━━━\x1b[0m\n');
  try {
    const result = await connector.testConnection();
    if (result.mode === 'sandbox' || result.connected) {
      console.log(`\x1b[32m✓\x1b[0m Connection test passed (mode: ${result.mode})\n`);
      passed++;
    } else {
      console.log('\x1b[31m✗\x1b[0m Connection test failed\n');
      failed++;
    }
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m', err.message, '\n');
    failed++;
  }
  
  // Summary
  console.log('\x1b[34m━━━ Test Summary ━━━\x1b[0m\n');
  console.log(`Total: ${passed + failed} tests`);
  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('\x1b[31m⚠️  Some tests failed. Review errors above.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✨ All tests passed!\x1b[0m\n');
  }
}

runTests().catch(err => {
  console.error('\x1b[31mTest suite error:\x1b[0m', err);
  process.exit(1);
});
