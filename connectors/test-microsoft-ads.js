/**
 * Microsoft Advertising Connector Test Suite
 * Updated for BaseConnector architecture
 * 
 * Run with: node connectors/test-microsoft-ads.js
 */

const microsoftAds = require('./microsoft-ads');

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const results = [];

// Test helper
async function test(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
    results.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Main test suite
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Microsoft Advertising Connector Test Suite');
  console.log('Testing with BaseConnector architecture (SANDBOX mode)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test 1: Get connector info
  await test('Get Connector Info', async () => {
    const info = microsoftAds.getInfo();
    assert(info.name === 'Microsoft Advertising', 'Should have correct name');
    assert(info.shortName === 'Microsoft Ads', 'Should have short name');
    assert(info.toolCount === 17, 'Should have 17 tools');
    assert(info.connected !== undefined, 'Should have connection status');
    console.log('   📊 Tools:', info.toolCount);
    console.log('   🔌 Connected:', info.connected);
  });
  
  // Test 2: Connection test
  await test('Connection Test (Sandbox Mode)', async () => {
    const result = await microsoftAds.testConnection();
    assert(result.connected === false, 'Should not be connected (sandbox)');
    assert(result.mode === 'sandbox', 'Should be in sandbox mode');
    console.log('   📊 Mode:', result.mode);
    console.log('   📋 Message:', result.message);
  });
  
  // Test 3: Get campaigns
  await test('Get Campaigns', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_campaigns', {});
    assert(result.success === true, 'Should succeed');
    assert(result.data.Campaigns, 'Should return campaigns array');
    assert(result.data.Campaigns.length > 0, 'Should have mock campaigns');
    assert(result.metadata.mode === 'sandbox', 'Should indicate sandbox mode');
    
    const campaign = result.data.Campaigns[0];
    assert(campaign.Id, 'Campaign should have ID');
    assert(campaign.Name, 'Campaign should have name');
    assert(campaign.CampaignType, 'Campaign should have type');
    
    console.log('   📊 Campaigns:', result.data.Campaigns.length);
    console.log('   📝 First:', campaign.Name);
    console.log('   💰 Budget:', `$${campaign.DailyBudget}/day`);
  });
  
  // Test 4: Get campaigns with status filter
  await test('Get Campaigns (Filter by Status)', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_campaigns', {
      status: ['Active']
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.Campaigns.length > 0, 'Should return active campaigns');
    assert(result.data.Campaigns.every(c => c.Status === 'Active'), 'All should be Active');
    console.log('   📊 Active Campaigns:', result.data.Campaigns.length);
  });
  
  // Test 5: Create campaign
  await test('Create Campaign (Search)', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_create_campaign', {
      name: 'Test Search Campaign',
      campaign_type: 'Search',
      daily_budget: 100.00,
      status: 'Paused'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.Campaign, 'Should return campaign object');
    assert(result.data.Campaign.Id, 'Campaign should have ID');
    assert(result.data.Campaign.Name === 'Test Search Campaign', 'Name should match');
    console.log('   📝 Created:', result.data.Campaign.Name);
    console.log('   🆔 ID:', result.data.Campaign.Id);
  });
  
  // Test 6: Get ad groups
  await test('Get Ad Groups', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_ad_groups', {});
    assert(result.success === true, 'Should succeed');
    assert(result.data.AdGroups, 'Should return ad groups array');
    assert(result.data.AdGroups.length > 0, 'Should have mock ad groups');
    
    const adGroup = result.data.AdGroups[0];
    assert(adGroup.Id, 'Ad group should have ID');
    assert(adGroup.Name, 'Ad group should have name');
    
    console.log('   📊 Ad Groups:', result.data.AdGroups.length);
    console.log('   📝 First:', adGroup.Name);
  });
  
  // Test 7: Create ad group
  await test('Create Ad Group', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_create_ad_group', {
      campaign_id: '1234567890',
      name: 'Test Ad Group',
      cpc_bid: 2.50,
      status: 'Paused'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.AdGroup, 'Should return ad group object');
    assert(result.data.AdGroup.Name === 'Test Ad Group', 'Name should match');
    console.log('   📝 Created:', result.data.AdGroup.Name);
    console.log('   💰 CPC Bid:', `$${result.data.AdGroup.SearchBid.Amount}`);
  });
  
  // Test 8: Get keywords
  await test('Get Keywords', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_keywords', {});
    assert(result.success === true, 'Should succeed');
    assert(result.data.Keywords, 'Should return keywords array');
    assert(result.data.Keywords.length > 0, 'Should have mock keywords');
    
    const keyword = result.data.Keywords[0];
    assert(keyword.Text, 'Keyword should have text');
    assert(keyword.MatchType, 'Keyword should have match type');
    assert(keyword.QualityScore, 'Keyword should have quality score');
    
    console.log('   📊 Keywords:', result.data.Keywords.length);
    console.log('   🔑 First:', `"${keyword.Text}" (${keyword.MatchType})`);
    console.log('   ⭐ Quality Score:', keyword.QualityScore);
  });
  
  // Test 9: Create keyword
  await test('Create Keyword (Exact Match)', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_create_keyword', {
      ad_group_id: '9876543210',
      text: 'running shoes',
      match_type: 'Exact',
      bid: 3.00
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.Keyword, 'Should return keyword object');
    assert(result.data.Keyword.Text === 'running shoes', 'Text should match');
    assert(result.data.Keyword.MatchType === 'Exact', 'Match type should be Exact');
    console.log('   🔑 Created:', `"${result.data.Keyword.Text}" (${result.data.Keyword.MatchType})`);
    console.log('   💰 Bid:', `$${result.data.Keyword.Bid.Amount}`);
  });
  
  // Test 10: Get negative keywords
  await test('Get Negative Keywords', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_negative_keywords', {
      campaign_id: '1234567890'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.NegativeKeywords, 'Should return negative keywords array');
    console.log('   📊 Negative Keywords:', result.data.NegativeKeywords.length);
  });
  
  // Test 11: Add negative keyword
  await test('Add Negative Keyword', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_add_negative_keyword', {
      campaign_id: '1234567890',
      text: 'free',
      match_type: 'Phrase'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.NegativeKeyword, 'Should return negative keyword object');
    assert(result.data.NegativeKeyword.Text === 'free', 'Text should match');
    console.log('   🚫 Added:', `"${result.data.NegativeKeyword.Text}" (${result.data.NegativeKeyword.MatchType})`);
  });
  
  // Test 12: Get ads
  await test('Get Ads', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_ads', {});
    assert(result.success === true, 'Should succeed');
    assert(result.data.Ads, 'Should return ads array');
    assert(result.data.Ads.length > 0, 'Should have mock ads');
    
    const ad = result.data.Ads[0];
    assert(ad.Type, 'Ad should have type');
    assert(ad.Headlines, 'Ad should have headlines');
    assert(ad.Descriptions, 'Ad should have descriptions');
    
    console.log('   📊 Ads:', result.data.Ads.length);
    console.log('   📝 First:', ad.Headlines[0].Text);
    console.log('   📄 Type:', ad.Type);
  });
  
  // Test 13: Create ad (Responsive Search Ad)
  await test('Create Ad (Responsive Search Ad)', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_create_ad', {
      ad_group_id: '9876543210',
      ad_type: 'ResponsiveSearch',
      headlines: [
        'Buy Running Shoes',
        'Free Shipping Available',
        'Shop Top Brands'
      ],
      descriptions: [
        'Discover our collection of premium running shoes with fast shipping.',
        'Quality athletic footwear at competitive prices. Order today!'
      ],
      final_urls: ['https://example.com/running-shoes'],
      status: 'Paused'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.Ad, 'Should return ad object');
    assert(result.data.Ad.Type === 'ResponsiveSearch', 'Type should be ResponsiveSearch');
    assert(result.data.Ad.Headlines.length === 3, 'Should have 3 headlines');
    console.log('   📝 Created:', result.data.Ad.Headlines[0].Text);
    console.log('   📄 Type:', result.data.Ad.Type);
  });
  
  // Test 14: Get extensions
  await test('Get Extensions', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_extensions', {});
    assert(result.success === true, 'Should succeed');
    assert(result.data.Extensions, 'Should return extensions array');
    assert(result.data.Extensions.length > 0, 'Should have mock extensions');
    
    const ext = result.data.Extensions[0];
    assert(ext.Type, 'Extension should have type');
    
    console.log('   📊 Extensions:', result.data.Extensions.length);
    console.log('   📝 First:', ext.Text || ext.Header);
    console.log('   🔖 Type:', ext.Type);
  });
  
  // Test 15: Get performance report
  await test('Get Performance Report (Campaign Level)', async () => {
    const result = await microsoftAds.callTool('microsoft_ads_get_performance_report', {
      report_level: 'Campaign',
      date_range: 'Last30Days'
    });
    assert(result.success === true, 'Should succeed');
    assert(result.data.ReportData, 'Should return report data');
    console.log('   📊 Report Rows:', result.data.ReportData.length);
    
    if (result.data.ReportData.length > 0) {
      const row = result.data.ReportData[0];
      console.log('   📈 First Campaign:', row.CampaignName);
      console.log('   💰 Spend:', `$${row.Spend}`);
      console.log('   🎯 ROAS:', row.ROAS);
    }
  });
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (testsFailed > 0) {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    
    const info = microsoftAds.getInfo();
    console.log(`\nMicrosoft Ads Connector Status: ${info.connected ? 'LIVE' : 'SANDBOX'}`);
    if (!info.connected) {
      console.log('\n⚠️  Running in SANDBOX mode (no credentials configured)');
      console.log('Set MICROSOFT_ADS_* environment variables in config/.env for live API access');
    }
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
