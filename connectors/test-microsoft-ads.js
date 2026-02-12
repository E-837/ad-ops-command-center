/**
 * Microsoft Advertising Connector Test Suite
 * Comprehensive tests for all 15 MCP tools in sandbox mode
 * 
 * Run with: node connectors/test-microsoft-ads.js
 * 
 * Tests:
 * - Connection test
 * - Account listing
 * - Campaign CRUD operations
 * - Ad group CRUD operations
 * - Keyword CRUD operations (all match types)
 * - Negative keyword operations
 * - Ad CRUD operations (RSA & Expanded Text)
 * - Extension listing
 * - Performance reporting
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
  console.log('Testing in SANDBOX mode (no credentials required)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test 1: Connection test
  await test('Connection Test (Sandbox Mode)', async () => {
    const result = await microsoftAds.testConnection();
    assert(result.success === true, 'Connection should succeed');
    assert(result.mode === 'sandbox', 'Should be in sandbox mode');
    assert(result.capabilities, 'Should return capabilities');
    assert(result.capabilities.campaigns === true, 'Should support campaigns');
    assert(result.capabilities.keywords === true, 'Should support keywords');
    console.log('   📊 Mode:', result.mode);
    console.log('   📋 Message:', result.message);
  });
  
  // Test 2: Get accounts
  await test('Get Accounts', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_accounts', {});
    assert(result.Accounts, 'Should return accounts array');
    assert(result.Accounts.length > 0, 'Should have at least one account');
    assert(result.Accounts[0].Id, 'Account should have ID');
    assert(result.Accounts[0].Name, 'Account should have name');
    console.log('   📊 Accounts:', result.Accounts.length);
    console.log('   🏢 Account:', result.Accounts[0].Name);
  });
  
  // Test 3: Get campaigns
  await test('Get Campaigns', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_campaigns', {
      include_metrics: false
    });
    assert(result.Campaigns, 'Should return campaigns array');
    assert(result.Campaigns.length > 0, 'Should have mock campaigns');
    assert(result.TotalCount === result.Campaigns.length, 'Total count should match');
    
    const campaign = result.Campaigns[0];
    assert(campaign.Id, 'Campaign should have ID');
    assert(campaign.Name, 'Campaign should have name');
    assert(campaign.CampaignType, 'Campaign should have type');
    assert(campaign.Status, 'Campaign should have status');
    assert(campaign.DailyBudget, 'Campaign should have daily budget');
    
    console.log('   📊 Campaigns:', result.Campaigns.length);
    console.log('   📝 First:', campaign.Name);
    console.log('   💰 Budget:', `$${campaign.DailyBudget}/day`);
  });
  
  // Test 4: Get campaigns with status filter
  await test('Get Campaigns (Filter by Status)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_campaigns', {
      status: ['Active']
    });
    assert(result.Campaigns, 'Should return campaigns');
    result.Campaigns.forEach(c => {
      assert(c.Status === 'Active', 'All campaigns should be Active');
    });
    console.log('   ✅ Active campaigns:', result.Campaigns.length);
  });
  
  // Test 5: Get campaigns with metrics
  await test('Get Campaigns (With Metrics)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_campaigns', {
      include_metrics: true
    });
    assert(result.Campaigns, 'Should return campaigns');
    
    const campaignWithMetrics = result.Campaigns.find(c => c.Performance);
    if (campaignWithMetrics) {
      assert(campaignWithMetrics.Performance.Impressions !== undefined, 'Should have impressions');
      assert(campaignWithMetrics.Performance.Clicks !== undefined, 'Should have clicks');
      assert(campaignWithMetrics.Performance.Spend !== undefined, 'Should have spend');
      console.log('   📊 Impressions:', campaignWithMetrics.Performance.Impressions.toLocaleString());
      console.log('   🖱️  Clicks:', campaignWithMetrics.Performance.Clicks.toLocaleString());
      console.log('   💰 Spend:', `$${campaignWithMetrics.Performance.Spend.toFixed(2)}`);
      console.log('   🎯 ROAS:', `${campaignWithMetrics.Performance.ROAS.toFixed(2)}x`);
    }
  });
  
  // Test 6: Create campaign (Search)
  await test('Create Campaign (Search)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_campaign', {
      name: 'Test Search Campaign',
      campaign_type: 'Search',
      daily_budget: 50.00,
      status: 'Paused',
      start_date: '2026-03-01',
      time_zone: 'PacificTimeUSCanada'
    });
    assert(result.Success === true, 'Campaign creation should succeed');
    assert(result.Campaign, 'Should return campaign object');
    assert(result.Campaign.Id, 'New campaign should have ID');
    assert(result.Campaign.Name === 'Test Search Campaign', 'Campaign should have correct name');
    assert(result.Campaign.CampaignType === 'Search', 'Campaign should be Search type');
    assert(result.Campaign.DailyBudget === 50.00, 'Campaign should have correct budget');
    console.log('   🆕 Created:', result.Campaign.Name);
    console.log('   🆔 ID:', result.Campaign.Id);
  });
  
  // Test 7: Create campaign (Performance Max)
  await test('Create Campaign (Performance Max)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_campaign', {
      name: 'Test Performance Max Campaign',
      campaign_type: 'PerformanceMax',
      daily_budget: 100.00,
      status: 'Paused'
    });
    assert(result.Success === true, 'Campaign creation should succeed');
    assert(result.Campaign.CampaignType === 'PerformanceMax', 'Should be Performance Max');
    console.log('   🆕 Created:', result.Campaign.Name);
    console.log('   🎯 Type:', result.Campaign.CampaignType);
  });
  
  // Test 8: Update campaign
  await test('Update Campaign', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_update_campaign', {
      campaign_id: '1234567890',
      status: 'Active',
      daily_budget: 125.00
    });
    assert(result.Success === true, 'Campaign update should succeed');
    console.log('   ✅ Updated campaign 1234567890');
  });
  
  // Test 9: Get ad groups
  await test('Get Ad Groups', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_ad_groups', {});
    assert(result.AdGroups, 'Should return ad groups array');
    assert(result.AdGroups.length > 0, 'Should have mock ad groups');
    
    const adGroup = result.AdGroups[0];
    assert(adGroup.Id, 'Ad group should have ID');
    assert(adGroup.Name, 'Ad group should have name');
    assert(adGroup.CampaignId, 'Ad group should have campaign ID');
    assert(adGroup.SearchBid, 'Ad group should have bid');
    assert(adGroup.Status, 'Ad group should have status');
    
    console.log('   📊 Ad Groups:', result.AdGroups.length);
    console.log('   📝 First:', adGroup.Name);
    console.log('   💰 Bid:', `$${adGroup.SearchBid.Amount}`);
  });
  
  // Test 10: Create ad group
  await test('Create Ad Group', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_ad_group', {
      campaign_id: '1234567890',
      name: 'Test Ad Group - Exact Match',
      cpc_bid: 2.25,
      status: 'Paused',
      language: 'English',
      network: 'OwnedAndOperatedAndSyndicatedSearch'
    });
    assert(result.Success === true, 'Ad group creation should succeed');
    assert(result.AdGroup, 'Should return ad group object');
    assert(result.AdGroup.Name === 'Test Ad Group - Exact Match', 'Should have correct name');
    assert(result.AdGroup.SearchBid.Amount === 2.25, 'Should have correct bid');
    console.log('   🆕 Created:', result.AdGroup.Name);
    console.log('   🆔 ID:', result.AdGroup.Id);
  });
  
  // Test 11: Update ad group
  await test('Update Ad Group', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_update_ad_group', {
      ad_group_id: '9876543210',
      status: 'Active',
      cpc_bid: 2.75
    });
    assert(result.Success === true, 'Ad group update should succeed');
    console.log('   ✅ Updated ad group 9876543210');
  });
  
  // Test 12: Get keywords
  await test('Get Keywords', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_keywords', {
      include_metrics: true
    });
    assert(result.Keywords, 'Should return keywords array');
    assert(result.Keywords.length > 0, 'Should have mock keywords');
    
    const keyword = result.Keywords[0];
    assert(keyword.Id, 'Keyword should have ID');
    assert(keyword.Text, 'Keyword should have text');
    assert(keyword.MatchType, 'Keyword should have match type');
    assert(keyword.Bid, 'Keyword should have bid');
    assert(keyword.Status, 'Keyword should have status');
    assert(keyword.QualityScore, 'Keyword should have quality score');
    
    console.log('   📊 Keywords:', result.Keywords.length);
    console.log('   🔑 First:', keyword.Text);
    console.log('   🎯 Match Type:', keyword.MatchType);
    console.log('   💰 Bid:', `$${keyword.Bid.Amount}`);
    console.log('   ⭐ Quality Score:', keyword.QualityScore);
  });
  
  // Test 13: Create keyword (Exact match)
  await test('Create Keyword (Exact Match)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_keyword', {
      ad_group_id: '9876543210',
      text: 'premium winter coats',
      match_type: 'Exact',
      bid: 3.00,
      status: 'Active',
      destination_url: 'https://example.com/premium-coats'
    });
    assert(result.Success === true, 'Keyword creation should succeed');
    assert(result.Keyword, 'Should return keyword object');
    assert(result.Keyword.Text === 'premium winter coats', 'Should have correct text');
    assert(result.Keyword.MatchType === 'Exact', 'Should be Exact match');
    assert(result.Keyword.QualityScore >= 1 && result.Keyword.QualityScore <= 10, 'Should have quality score 1-10');
    console.log('   🆕 Created:', result.Keyword.Text);
    console.log('   🎯 Match Type:', result.Keyword.MatchType);
    console.log('   ⭐ Quality Score:', result.Keyword.QualityScore);
  });
  
  // Test 14: Create keyword (Phrase match)
  await test('Create Keyword (Phrase Match)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_keyword', {
      ad_group_id: '9876543210',
      text: 'winter jackets',
      match_type: 'Phrase',
      bid: 2.50
    });
    assert(result.Success === true, 'Keyword creation should succeed');
    assert(result.Keyword.MatchType === 'Phrase', 'Should be Phrase match');
    console.log('   🆕 Created:', result.Keyword.Text);
    console.log('   🎯 Match Type:', result.Keyword.MatchType);
  });
  
  // Test 15: Create keyword (Broad match)
  await test('Create Keyword (Broad Match)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_keyword', {
      ad_group_id: '9876543210',
      text: 'winter clothing',
      match_type: 'Broad',
      bid: 1.75
    });
    assert(result.Success === true, 'Keyword creation should succeed');
    assert(result.Keyword.MatchType === 'Broad', 'Should be Broad match');
    console.log('   🆕 Created:', result.Keyword.Text);
    console.log('   🎯 Match Type:', result.Keyword.MatchType);
  });
  
  // Test 16: Update keyword
  await test('Update Keyword', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_update_keyword', {
      keyword_id: '1111111111',
      status: 'Active',
      bid: 3.25
    });
    assert(result.Success === true, 'Keyword update should succeed');
    console.log('   ✅ Updated keyword 1111111111');
  });
  
  // Test 17: Get negative keywords
  await test('Get Negative Keywords', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_negative_keywords', {
      campaign_id: '1234567890'
    });
    assert(result.NegativeKeywords, 'Should return negative keywords array');
    
    if (result.NegativeKeywords.length > 0) {
      const negative = result.NegativeKeywords[0];
      assert(negative.Text, 'Negative keyword should have text');
      assert(negative.MatchType, 'Negative keyword should have match type');
      console.log('   🚫 Negative Keywords:', result.NegativeKeywords.length);
      console.log('   📝 First:', negative.Text);
    }
  });
  
  // Test 18: Add negative keyword
  await test('Add Negative Keyword', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_add_negative_keyword', {
      campaign_id: '1234567890',
      text: 'discount',
      match_type: 'Phrase'
    });
    assert(result.Success === true, 'Negative keyword creation should succeed');
    assert(result.NegativeKeyword, 'Should return negative keyword object');
    assert(result.NegativeKeyword.Text === 'discount', 'Should have correct text');
    console.log('   🆕 Added negative:', result.NegativeKeyword.Text);
  });
  
  // Test 19: Get ads
  await test('Get Ads', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_ads', {});
    assert(result.Ads, 'Should return ads array');
    assert(result.Ads.length > 0, 'Should have mock ads');
    
    const ad = result.Ads[0];
    assert(ad.Id, 'Ad should have ID');
    assert(ad.Type, 'Ad should have type');
    assert(ad.Headlines, 'Ad should have headlines');
    assert(ad.Descriptions, 'Ad should have descriptions');
    assert(ad.FinalUrls, 'Ad should have final URLs');
    assert(ad.Status, 'Ad should have status');
    
    console.log('   📊 Ads:', result.Ads.length);
    console.log('   📝 First:', ad.Headlines[0].Text);
    console.log('   📰 Type:', ad.Type);
    console.log('   📝 Headlines:', ad.Headlines.length);
    console.log('   📝 Descriptions:', ad.Descriptions.length);
  });
  
  // Test 20: Create Responsive Search Ad
  await test('Create Ad (Responsive Search Ad)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_ad', {
      ad_group_id: '9876543210',
      ad_type: 'ResponsiveSearch',
      headlines: [
        'Premium Winter Coats',
        'Free Shipping Today',
        'Shop Now & Save'
      ],
      descriptions: [
        'Browse our collection of premium winter coats. All sizes in stock.',
        'Quality winter wear at great prices. Limited time offer!'
      ],
      path1: 'winter',
      path2: 'coats',
      final_urls: ['https://example.com/winter-coats'],
      status: 'Paused'
    });
    assert(result.Success === true, 'Ad creation should succeed');
    assert(result.Ad, 'Should return ad object');
    assert(result.Ad.Type === 'ResponsiveSearch', 'Should be RSA');
    assert(result.Ad.Headlines.length === 3, 'Should have 3 headlines');
    assert(result.Ad.Descriptions.length === 2, 'Should have 2 descriptions');
    console.log('   🆕 Created RSA:', result.Ad.Headlines[0].Text);
    console.log('   🆔 ID:', result.Ad.Id);
  });
  
  // Test 21: Create Expanded Text Ad
  await test('Create Ad (Expanded Text Ad)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_create_ad', {
      ad_group_id: '9876543210',
      ad_type: 'ExpandedText',
      headlines: [
        'Winter Clearance Sale',
        'Up To 50% Off',
        'Shop Now'
      ],
      descriptions: [
        'Limited time winter clearance event. Huge savings on coats and jackets.',
        'Quality brands at clearance prices. Free shipping on orders over $50.'
      ],
      path1: 'sale',
      path2: 'winter',
      final_urls: ['https://example.com/sale'],
      status: 'Paused'
    });
    assert(result.Success === true, 'Ad creation should succeed');
    assert(result.Ad.Type === 'ExpandedText', 'Should be Expanded Text Ad');
    console.log('   🆕 Created ETA:', result.Ad.Headlines[0].Text);
  });
  
  // Test 22: Update ad
  await test('Update Ad', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_update_ad', {
      ad_id: '2222222222',
      status: 'Active'
    });
    assert(result.Success === true, 'Ad update should succeed');
    console.log('   ✅ Updated ad 2222222222');
  });
  
  // Test 23: Get extensions
  await test('Get Extensions', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_extensions', {});
    assert(result.Extensions, 'Should return extensions array');
    assert(result.Extensions.length > 0, 'Should have mock extensions');
    
    const extension = result.Extensions[0];
    assert(extension.Id, 'Extension should have ID');
    assert(extension.Type, 'Extension should have type');
    assert(extension.Status, 'Extension should have status');
    
    console.log('   📊 Extensions:', result.Extensions.length);
    console.log('   🔗 First:', extension.Type);
    if (extension.Text) console.log('   📝 Text:', extension.Text);
  });
  
  // Test 24: Get performance report (Campaign level)
  await test('Get Performance Report (Campaign Level)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_performance_report', {
      report_level: 'Campaign',
      date_range: 'Last30Days'
    });
    assert(result.ReportData, 'Should return report data');
    
    if (result.ReportData.length > 0) {
      const row = result.ReportData[0];
      assert(row.CampaignId, 'Report should have campaign ID');
      assert(row.Impressions !== undefined, 'Report should have impressions');
      assert(row.Clicks !== undefined, 'Report should have clicks');
      assert(row.Spend !== undefined, 'Report should have spend');
      console.log('   📊 Campaign:', row.CampaignName);
      console.log('   👁️  Impressions:', row.Impressions.toLocaleString());
      console.log('   🖱️  Clicks:', row.Clicks.toLocaleString());
      console.log('   💰 Spend:', `$${row.Spend.toFixed(2)}`);
      console.log('   🎯 CTR:', `${row.CTR.toFixed(2)}%`);
      console.log('   💵 Avg CPC:', `$${row.AverageCpc.toFixed(2)}`);
      console.log('   🎯 ROAS:', `${row.ROAS.toFixed(2)}x`);
    }
  });
  
  // Test 25: Get performance report (Keyword level)
  await test('Get Performance Report (Keyword Level)', async () => {
    const result = await microsoftAds.handleToolCall('microsoft_ads_get_performance_report', {
      report_level: 'Keyword',
      date_range: 'Last7Days',
      metrics: ['Impressions', 'Clicks', 'CTR', 'AverageCpc', 'QualityScore']
    });
    assert(result.ReportData !== undefined, 'Should return report data');
    console.log('   📊 Report rows:', result.TotalRows || 0);
  });
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Microsoft Ads connector is working perfectly in sandbox mode.');
    console.log('\n📝 Next Steps:');
    console.log('1. Configure MICROSOFT_ADS_* environment variables in config/.env');
    console.log('2. Run tests again to verify live API integration');
    console.log('3. Review MICROSOFT_ADS_SETUP.md for OAuth2 setup instructions');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
