/**
 * TikTok Ads Connector Test Suite
 * Updated for BaseConnector architecture
 * 
 * Run with: node connectors/test-tiktok-ads.js
 */

const tiktokAds = require('./tiktok-ads');

console.log('🧪 Testing TikTok Ads Connector (Refactored with BaseConnector)\n');

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Get connector info
    console.log('1. Get Connector Info');
    const info = tiktokAds.getInfo();
    console.log(`   Tools: ${info.toolCount}`);
    console.log(`   Connected: ${info.connected}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 2: Connection test
    console.log('2. Test Connection');
    const connTest = await tiktokAds.testConnection();
    console.log(`   Mode: ${connTest.mode}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 3: Get campaigns
    console.log('3. Get Campaigns');
    const campaigns = await tiktokAds.callTool('tiktok_get_campaigns', {});
    console.log(`   Campaigns: ${campaigns.data.list.length}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 4: Create campaign
    console.log('4. Create Campaign');
    const newCampaign = await tiktokAds.callTool('tiktok_create_campaign', {
      campaign_name: 'Test Campaign',
      objective_type: 'CONVERSIONS',
      budget: 100.00,
      operation_status: 'DISABLE'
    });
    console.log(`   Created: ${newCampaign.data.campaign_id}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 5: Get ad groups
    console.log('5. Get Ad Groups');
    const adGroups = await tiktokAds.callTool('tiktok_get_ad_groups', {});
    console.log(`   Ad Groups: ${adGroups.data.list.length}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 6: Create ad group
    console.log('6. Create Ad Group');
    const newAdGroup = await tiktokAds.callTool('tiktok_create_ad_group', {
      campaign_id: '1234567890',
      adgroup_name: 'Test Ad Group',
      location_ids: ['6252001'],
      optimization_goal: 'CONVERSION',
      budget: 50.00
    });
    console.log(`   Created: ${newAdGroup.data.adgroup_id}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 7: Get ads
    console.log('7. Get Ads');
    const ads = await tiktokAds.callTool('tiktok_get_ads', {});
    console.log(`   Ads: ${ads.data.list.length}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 8: Create ad
    console.log('8. Create Ad');
    const newAd = await tiktokAds.callTool('tiktok_create_ad', {
      adgroup_id: '1111111111',
      ad_name: 'Test Ad',
      ad_text: 'Check out our product!',
      video_id: 'v_abc123',
      landing_page_url: 'https://example.com',
      display_name: 'Test Brand',
      operation_status: 'DISABLE'
    });
    console.log(`   Created: ${newAd.data.ad_id}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 9: Get videos
    console.log('9. Get Videos');
    const videos = await tiktokAds.callTool('tiktok_get_videos', {});
    console.log(`   Videos: ${videos.data.list.length}`);
    console.log('✅ Passed\n');
    passed++;
    
    // Test 10: Get reports
    console.log('10. Get Reports');
    const reports = await tiktokAds.callTool('tiktok_get_reports', {
      data_level: 'AUCTION_CAMPAIGN',
      start_date: '2026-02-01',
      end_date: '2026-02-10'
    });
    console.log(`   Report rows: ${reports.data.list.length}`);
    console.log('✅ Passed\n');
    passed++;
    
    console.log('═══════════════════════════════════════');
    console.log('✅ All tests passed!');
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log('═══════════════════════════════════════');
    
    if (!info.connected) {
      console.log('\n⚠️  Running in SANDBOX mode (no credentials configured)');
      console.log('Set TIKTOK_* environment variables in config/.env for live API access');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    failed++;
    process.exit(1);
  }
}

runTests().catch(console.error);
