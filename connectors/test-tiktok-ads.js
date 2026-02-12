/**
 * TikTok Ads Connector Test Suite
 * Tests all 13 tools in sandbox mode
 */

const tiktok = require('./tiktok-ads.js');

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function pass(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function fail(msg, error) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
  if (error) console.error(`  Error: ${error.message}`);
}

function section(msg) {
  console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

async function runTests() {
  console.log(`${colors.yellow}TikTok Ads Connector Test Suite${colors.reset}\n`);
  
  let passCount = 0;
  let failCount = 0;
  
  try {
    // Test 1: Connector Info
    section('Test 1: Connector Info');
    const connectorInfo = tiktok.getInfo();
    console.log(JSON.stringify(connectorInfo, null, 2));
    if (connectorInfo.name === 'TikTok Ads' && connectorInfo.toolCount === 13 && connectorInfo.sandbox === true) {
      pass('Connector info loaded correctly');
      passCount++;
    } else {
      fail('Connector info mismatch');
      failCount++;
    }
    
    // Test 2: Connection Test
    section('Test 2: Connection Test');
    const connection = await tiktok.testConnection();
    console.log(JSON.stringify(connection, null, 2));
    if (connection.mode === 'sandbox' && connection.status === 'ok') {
      pass('Connection test passed (sandbox mode)');
      passCount++;
    } else {
      fail('Connection test failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 3: Get Advertisers
    section('Test 3: Get Advertisers');
    const advertisers = await tiktok.handleToolCall('tiktok_get_advertisers', {});
    if (advertisers.data && advertisers.data.length === 2 && advertisers.sandbox === true) {
      pass(`Got ${advertisers.data.length} advertiser accounts`);
      console.log(`  - ${advertisers.data[0].advertiser_name} (${advertisers.data[0].advertiser_id})`);
      console.log(`  - ${advertisers.data[1].advertiser_name} (${advertisers.data[1].advertiser_id})`);
      passCount++;
    } else {
      fail('Get advertisers failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 4: Get Campaigns (All)
    section('Test 4: Get Campaigns (All)');
    const allCampaigns = await tiktok.handleToolCall('tiktok_get_campaigns', {});
    if (allCampaigns.data && allCampaigns.data.length === 3 && allCampaigns.sandbox === true) {
      pass(`Got ${allCampaigns.data.length} campaigns`);
      allCampaigns.data.forEach(c => {
        console.log(`  - ${c.campaign_name} (${c.status}) - ${c.objective_type}`);
      });
      passCount++;
    } else {
      fail('Get all campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 5: Get Campaigns (Active Only)
    section('Test 5: Get Campaigns (Active Only)');
    const activeCampaigns = await tiktok.handleToolCall('tiktok_get_campaigns', {
      filtering: {
        primary_status: 'STATUS_ENABLE'
      }
    });
    if (activeCampaigns.data && activeCampaigns.data.length === 2) {
      pass(`Got ${activeCampaigns.data.length} active campaigns`);
      activeCampaigns.data.forEach(c => {
        console.log(`  - ${c.campaign_name} (${c.objective_type})`);
      });
      passCount++;
    } else {
      fail('Get active campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 6: Create Campaign - CONVERSIONS
    section('Test 6: Create Campaign (CONVERSIONS)');
    const newCampaignConversions = await tiktok.handleToolCall('tiktok_create_campaign', {
      campaign_name: 'Test Conversions Campaign - Q2 2026',
      objective_type: 'CONVERSIONS',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 100.00,
      operation_status: 'DISABLE'
    });
    if (newCampaignConversions.data && newCampaignConversions.data.campaign_id && newCampaignConversions.data.objective_type === 'CONVERSIONS') {
      pass(`Created CONVERSIONS campaign: ${newCampaignConversions.data.campaign_id}`);
      console.log(`  Name: ${newCampaignConversions.data.campaign_name}`);
      console.log(`  Status: ${newCampaignConversions.data.status}`);
      console.log(`  Budget: $${newCampaignConversions.data.budget}/day`);
      passCount++;
    } else {
      fail('Create CONVERSIONS campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 7: Create Campaign - VIDEO_VIEWS
    section('Test 7: Create Campaign (VIDEO_VIEWS)');
    const newCampaignVideoViews = await tiktok.handleToolCall('tiktok_create_campaign', {
      campaign_name: 'Test Video Views Campaign',
      objective_type: 'VIDEO_VIEWS',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 75.00,
      operation_status: 'DISABLE'
    });
    if (newCampaignVideoViews.data && newCampaignVideoViews.data.objective_type === 'VIDEO_VIEWS') {
      pass(`Created VIDEO_VIEWS campaign: ${newCampaignVideoViews.data.campaign_id}`);
      console.log(`  Name: ${newCampaignVideoViews.data.campaign_name}`);
      console.log(`  Budget: $${newCampaignVideoViews.data.budget}/day`);
      passCount++;
    } else {
      fail('Create VIDEO_VIEWS campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 8: Update Campaign
    section('Test 8: Update Campaign');
    const updatedCampaign = await tiktok.handleToolCall('tiktok_update_campaign', {
      campaign_id: '1234567892',
      operation_status: 'ENABLE',
      budget: 150.00
    });
    if (updatedCampaign.data && updatedCampaign.data.status === 'ENABLE') {
      pass(`Updated campaign status to ENABLE`);
      console.log(`  Campaign: ${updatedCampaign.data.campaign_name}`);
      console.log(`  New Budget: $${updatedCampaign.data.budget}/day`);
      passCount++;
    } else {
      fail('Update campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 9: Get Ad Groups (All)
    section('Test 9: Get Ad Groups (All)');
    const allAdGroups = await tiktok.handleToolCall('tiktok_get_ad_groups', {});
    if (allAdGroups.data && allAdGroups.data.length === 4 && allAdGroups.sandbox === true) {
      pass(`Got ${allAdGroups.data.length} ad groups`);
      allAdGroups.data.forEach(ag => {
        console.log(`  - ${ag.adgroup_name} (${ag.status}) - $${ag.budget}/day`);
      });
      passCount++;
    } else {
      fail('Get all ad groups failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 10: Get Ad Groups (By Campaign)
    section('Test 10: Get Ad Groups (By Campaign)');
    const campaignAdGroups = await tiktok.handleToolCall('tiktok_get_ad_groups', {
      filtering: {
        campaign_ids: ['1234567890'],
        primary_status: 'STATUS_ENABLE'
      }
    });
    if (campaignAdGroups.data && campaignAdGroups.data.length === 2) {
      pass(`Got ${campaignAdGroups.data.length} active ad groups for campaign`);
      campaignAdGroups.data.forEach(ag => {
        console.log(`  - ${ag.adgroup_name} (Ages: ${ag.age_groups.join(', ')})`);
      });
      passCount++;
    } else {
      fail('Get campaign ad groups failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 11: Create Ad Group
    section('Test 11: Create Ad Group');
    const newAdGroup = await tiktok.handleToolCall('tiktok_create_ad_group', {
      campaign_id: '1234567890',
      adgroup_name: 'Test Ad Group - Ages 18-34',
      placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
      location_ids: ['6252001'],
      age_groups: ['AGE_18_24', 'AGE_25_34'],
      gender: 'GENDER_UNLIMITED',
      interest_category_ids: ['100001', '100002'],
      budget: 60.00,
      bid_type: 'BID_TYPE_MAX',
      bid_price: 2.00,
      optimization_goal: 'CONVERSION',
      pacing: 'PACING_MODE_SMOOTH',
      schedule_type: 'SCHEDULE_FROM_NOW',
      operation_status: 'DISABLE'
    });
    if (newAdGroup.data && newAdGroup.data.adgroup_id && newAdGroup.data.optimization_goal === 'CONVERSION') {
      pass(`Created ad group: ${newAdGroup.data.adgroup_id}`);
      console.log(`  Name: ${newAdGroup.data.adgroup_name}`);
      console.log(`  Budget: $${newAdGroup.data.budget}/day`);
      console.log(`  Bid: $${newAdGroup.data.bid_price}`);
      console.log(`  Ages: ${newAdGroup.data.age_groups.join(', ')}`);
      passCount++;
    } else {
      fail('Create ad group failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 12: Update Ad Group
    section('Test 12: Update Ad Group');
    const updatedAdGroup = await tiktok.handleToolCall('tiktok_update_ad_group', {
      adgroup_id: '1111111114',
      operation_status: 'ENABLE',
      budget: 120.00,
      bid_price: 3.50
    });
    if (updatedAdGroup.data && updatedAdGroup.data.status === 'ENABLE') {
      pass(`Updated ad group status to ENABLE`);
      console.log(`  Ad Group: ${updatedAdGroup.data.adgroup_name}`);
      console.log(`  New Budget: $${updatedAdGroup.data.budget}/day`);
      console.log(`  New Bid: $${updatedAdGroup.data.bid_price}`);
      passCount++;
    } else {
      fail('Update ad group failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 13: Get Ads (All)
    section('Test 13: Get Ads (All)');
    const allAds = await tiktok.handleToolCall('tiktok_get_ads', {});
    if (allAds.data && allAds.data.length === 5 && allAds.sandbox === true) {
      pass(`Got ${allAds.data.length} ads`);
      allAds.data.forEach(ad => {
        console.log(`  - ${ad.ad_name} (${ad.status}) - CTA: ${ad.call_to_action}`);
      });
      passCount++;
    } else {
      fail('Get all ads failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 14: Get Ads (By Ad Group)
    section('Test 14: Get Ads (By Ad Group)');
    const adGroupAds = await tiktok.handleToolCall('tiktok_get_ads', {
      filtering: {
        adgroup_ids: ['1111111111'],
        primary_status: 'STATUS_ENABLE'
      }
    });
    if (adGroupAds.data && adGroupAds.data.length === 2) {
      pass(`Got ${adGroupAds.data.length} active ads for ad group`);
      adGroupAds.data.forEach(ad => {
        console.log(`  - ${ad.ad_name}`);
        console.log(`    Text: ${ad.ad_text.substring(0, 60)}...`);
      });
      passCount++;
    } else {
      fail('Get ad group ads failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 15: Create Ad
    section('Test 15: Create Ad');
    const newAd = await tiktok.handleToolCall('tiktok_create_ad', {
      adgroup_id: '1111111111',
      ad_name: 'Test Video Ad - Spring Launch',
      ad_text: 'New styles just dropped! 🔥 Shop now and get 25% off. Limited time! #SpringSale',
      video_id: 'v_abc123',
      call_to_action: 'SHOP_NOW',
      landing_page_url: 'https://example.com/spring-sale',
      display_name: 'Trendy Fashion',
      identity_type: 'BC_ACCOUNT',
      spark_ads_eligible: false,
      shopping_ads_enabled: true,
      operation_status: 'DISABLE'
    });
    if (newAd.data && newAd.data.ad_id && newAd.data.call_to_action === 'SHOP_NOW') {
      pass(`Created ad: ${newAd.data.ad_id}`);
      console.log(`  Name: ${newAd.data.ad_name}`);
      console.log(`  Text: ${newAd.data.ad_text.substring(0, 60)}...`);
      console.log(`  CTA: ${newAd.data.call_to_action}`);
      console.log(`  Shopping Ads: ${newAd.data.shopping_ads_enabled ? 'Enabled' : 'Disabled'}`);
      passCount++;
    } else {
      fail('Create ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 16: Update Ad
    section('Test 16: Update Ad');
    const updatedAd = await tiktok.handleToolCall('tiktok_update_ad', {
      ad_id: '2222222225',
      operation_status: 'ENABLE',
      ad_text: 'Download now and get 2000 free gems! 💎 Epic battles await you. #Gaming'
    });
    if (updatedAd.data && updatedAd.data.status === 'ENABLE') {
      pass(`Updated ad status to ENABLE`);
      console.log(`  Ad: ${updatedAd.data.ad_name}`);
      console.log(`  New Text: ${updatedAd.data.ad_text.substring(0, 60)}...`);
      passCount++;
    } else {
      fail('Update ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 17: Get Videos (All)
    section('Test 17: Get Videos (All)');
    const allVideos = await tiktok.handleToolCall('tiktok_get_videos', {});
    if (allVideos.data && allVideos.data.length === 5 && allVideos.sandbox === true) {
      pass(`Got ${allVideos.data.length} video creatives`);
      allVideos.data.forEach(v => {
        console.log(`  - ${v.video_name} (${v.ratio}) - ${v.duration}s`);
      });
      passCount++;
    } else {
      fail('Get all videos failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 18: Get Videos (9:16 Vertical)
    section('Test 18: Get Videos (9:16 Vertical Only)');
    const verticalVideos = await tiktok.handleToolCall('tiktok_get_videos', {
      filtering: {
        ratio: ['9:16']
      }
    });
    if (verticalVideos.data && verticalVideos.data.length === 4) {
      pass(`Got ${verticalVideos.data.length} vertical (9:16) videos`);
      verticalVideos.data.forEach(v => {
        console.log(`  - ${v.video_name} (${v.width}x${v.height})`);
      });
      passCount++;
    } else {
      fail('Get vertical videos failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 19: Upload Video
    section('Test 19: Upload Video');
    const uploadedVideo = await tiktok.handleToolCall('tiktok_upload_video', {
      video_file: 'https://example.com/videos/new-ad.mp4',
      video_name: 'Summer Collection Teaser',
      aspect_ratio: '9:16',
      duration_seconds: 20
    });
    if (uploadedVideo.data && uploadedVideo.data.video_id && uploadedVideo.data.ratio === '9:16') {
      pass(`Uploaded video: ${uploadedVideo.data.video_id}`);
      console.log(`  Name: ${uploadedVideo.data.video_name}`);
      console.log(`  Ratio: ${uploadedVideo.data.ratio}`);
      console.log(`  Duration: ${uploadedVideo.data.duration}s`);
      console.log(`  Resolution: ${uploadedVideo.data.width}x${uploadedVideo.data.height}`);
      passCount++;
    } else {
      fail('Upload video failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 20: Get Reports (Campaign Level)
    section('Test 20: Get Reports (Campaign Level)');
    const campaignReports = await tiktok.handleToolCall('tiktok_get_reports', {
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id'],
      filtering: {
        campaign_ids: ['1234567890']
      },
      start_date: '2026-02-01',
      end_date: '2026-02-10'
    });
    if (campaignReports.data && campaignReports.data.length > 0) {
      pass('Got campaign analytics');
      const report = Array.isArray(campaignReports.data) ? campaignReports.data[0] : campaignReports.data;
      const m = report.metrics;
      console.log(`  Campaign: ${report.campaign_name}`);
      console.log(`  Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  Spend: $${m.spend.toFixed(2)}`);
      console.log(`  CTR: ${m.ctr}%`);
      console.log(`  CPC: $${m.cpc.toFixed(2)}`);
      console.log(`  Video Views (100%): ${m.video_views_p100.toLocaleString()}`);
      console.log(`  Conversions: ${m.conversions}`);
      passCount++;
    } else {
      fail('Get campaign analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 21: Get Reports (Ad Group Level)
    section('Test 21: Get Reports (Ad Group Level)');
    const adGroupReports = await tiktok.handleToolCall('tiktok_get_reports', {
      report_type: 'BASIC',
      data_level: 'AUCTION_ADGROUP',
      dimensions: ['adgroup_id'],
      start_date: '2026-02-01',
      end_date: '2026-02-10'
    });
    if (adGroupReports.data && adGroupReports.data.length > 0) {
      pass('Got ad group analytics');
      const report = Array.isArray(adGroupReports.data) ? adGroupReports.data[0] : adGroupReports.data;
      const m = report.metrics;
      console.log(`  Ad Group: ${report.adgroup_name}`);
      console.log(`  Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  Spend: $${m.spend.toFixed(2)}`);
      console.log(`  Conversions: ${m.conversions}`);
      passCount++;
    } else {
      fail('Get ad group analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 22: Get Reports (Ad Level)
    section('Test 22: Get Reports (Ad Level)');
    const adReports = await tiktok.handleToolCall('tiktok_get_reports', {
      report_type: 'BASIC',
      data_level: 'AUCTION_AD',
      dimensions: ['ad_id'],
      start_date: '2026-02-01',
      end_date: '2026-02-10'
    });
    if (adReports.data && adReports.data.length > 0) {
      pass('Got ad analytics');
      const report = Array.isArray(adReports.data) ? adReports.data[0] : adReports.data;
      const m = report.metrics;
      console.log(`  Ad: ${report.ad_name}`);
      console.log(`  Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  Video Views (100%): ${m.video_views_p100.toLocaleString()}`);
      console.log(`  Likes: ${m.likes.toLocaleString()}`);
      console.log(`  Shares: ${m.shares.toLocaleString()}`);
      passCount++;
    } else {
      fail('Get ad analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 23: Get Reports (All Campaigns)
    section('Test 23: Get Reports (All Campaigns Summary)');
    const allCampaignsReport = await tiktok.handleToolCall('tiktok_get_reports', {
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id'],
      start_date: '2026-02-01',
      end_date: '2026-02-10'
    });
    if (allCampaignsReport.data && allCampaignsReport.data.length === 2) {
      pass(`Got analytics for ${allCampaignsReport.data.length} campaigns`);
      allCampaignsReport.data.forEach(report => {
        const m = report.metrics;
        console.log(`  - ${report.campaign_name}`);
        console.log(`    Spend: $${m.spend.toFixed(2)} | Conversions: ${m.conversions} | Video Views: ${m.video_views_p100.toLocaleString()}`);
      });
      passCount++;
    } else {
      fail('Get all campaigns analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during tests:${colors.reset}`, error);
    failCount++;
  }
  
  // Summary
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`\n${colors.yellow}Test Results:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`  Total: ${passCount + failCount}`);
  
  if (failCount === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
