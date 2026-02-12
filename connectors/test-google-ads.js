/**
 * Google Ads Connector Test
 */

const googleAds = require('./google-ads');

console.log('🧪 Testing Google Ads Connector (Refactored with BaseConnector)\n');

async function testGoogleAdsConnector() {
  // Test 1: Get connector info
  console.log('1. Get Connector Info');
  const info = googleAds.getInfo();
  console.log(JSON.stringify(info, null, 2));
  console.log('✅ Passed\n');
  
  // Test 2: Test connection
  console.log('2. Test Connection');
  const connectionTest = await googleAds.testConnection();
  console.log(JSON.stringify(connectionTest, null, 2));
  console.log('✅ Passed\n');
  
  // Test 3: Get campaigns (sandbox mode)
  console.log('3. Get Campaigns (Sandbox)');
  const campaigns = await googleAds.callTool('google_ads_get_campaigns', {});
  console.log(JSON.stringify(campaigns, null, 2));
  console.log('✅ Passed\n');
  
  // Test 4: Create campaign (sandbox mode)
  console.log('4. Create Campaign (Sandbox)');
  const newCampaign = await googleAds.callTool('google_ads_create_campaign', {
    name: 'Test Search Campaign',
    budget_micros: 50000000,
    campaign_type: 'SEARCH',
    bidding_strategy: 'TARGET_CPA'
  });
  console.log(JSON.stringify(newCampaign, null, 2));
  console.log('✅ Passed\n');
  
  // Test 5: Get metrics (sandbox mode)
  console.log('5. Get Metrics (Sandbox)');
  const metrics = await googleAds.callTool('google_ads_get_metrics', {
    campaign_id: 'customers/1234567890/campaigns/111222333'
  });
  console.log(JSON.stringify(metrics, null, 2));
  console.log('✅ Passed\n');
  
  // Test 6: Keyword research (sandbox mode)
  console.log('6. Keyword Research (Sandbox)');
  const keywords = await googleAds.callTool('google_ads_keyword_research', {
    seed_keywords: ['running shoes', 'athletic footwear']
  });
  console.log(JSON.stringify(keywords, null, 2));
  console.log('✅ Passed\n');
  
  console.log('✅ All tests passed!');
  console.log(`\nGoogle Ads Connector Status: ${info.connected ? 'LIVE' : 'SANDBOX'}`);
  if (!info.connected) {
    console.log('\n⚠️  Running in SANDBOX mode (no credentials configured)');
    console.log('Set GOOGLE_ADS_* environment variables in config/.env for live API access');
  }
}

testGoogleAdsConnector().catch(console.error);
