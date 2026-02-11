/**
 * Pinterest Ads Connector Test Suite
 * Tests all 15 tools in sandbox mode
 */

const pinterest = require('./pinterest.js');

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
  console.log(`${colors.yellow}Pinterest Ads Connector Test Suite${colors.reset}\n`);
  
  let passCount = 0;
  let failCount = 0;
  
  try {
    // Test 1: Connector Info
    section('Test 1: Connector Info');
    const connectorInfo = pinterest.getInfo();
    console.log(JSON.stringify(connectorInfo, null, 2));
    if (connectorInfo.name === 'Pinterest Ads' && connectorInfo.toolCount === 15 && connectorInfo.sandbox === true) {
      pass('Connector info loaded correctly');
      passCount++;
    } else {
      fail('Connector info mismatch');
      failCount++;
    }
    
    // Test 2: Connection Test
    section('Test 2: Connection Test');
    const connection = await pinterest.testConnection();
    console.log(JSON.stringify(connection, null, 2));
    if (connection.mode === 'sandbox' && connection.status === 'ok') {
      pass('Connection test passed (sandbox mode)');
      passCount++;
    } else {
      fail('Connection test failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 3: Get Campaigns
    section('Test 3: Get Campaigns');
    const campaigns = await pinterest.handleToolCall('pinterest_get_campaigns', {
      entity_statuses: ['ACTIVE']
    });
    if (campaigns.data && campaigns.data.length === 2 && campaigns.sandbox === true) {
      pass(`Got ${campaigns.data.length} active campaigns`);
      console.log(`  - ${campaigns.data[0].name} (${campaigns.data[0].objective_type})`);
      console.log(`  - ${campaigns.data[1].name} (${campaigns.data[1].objective_type})`);
      passCount++;
    } else {
      fail('Get campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 4: Create Campaign - AWARENESS
    section('Test 4: Create Campaign (AWARENESS)');
    const newCampaignAwareness = await pinterest.handleToolCall('pinterest_create_campaign', {
      name: 'Test Brand Awareness - Q2 2026',
      objective_type: 'AWARENESS',
      status: 'PAUSED',
      daily_spend_cap: 50000000 // $5/day in micro-currency
    });
    if (newCampaignAwareness.data && newCampaignAwareness.data.id && newCampaignAwareness.data.objective_type === 'AWARENESS') {
      pass(`Created AWARENESS campaign: ${newCampaignAwareness.data.id}`);
      console.log(`  Name: ${newCampaignAwareness.data.name}`);
      console.log(`  Status: ${newCampaignAwareness.data.status}`);
      console.log(`  Daily Cap: $${newCampaignAwareness.data.daily_spend_cap / 10000000} (micro-currency)`);
      passCount++;
    } else {
      fail('Create AWARENESS campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 5: Create Campaign - CONVERSIONS
    section('Test 5: Create Campaign (CONVERSIONS)');
    const newCampaignConversions = await pinterest.handleToolCall('pinterest_create_campaign', {
      name: 'Test Conversions - Shopping',
      objective_type: 'CONVERSIONS',
      status: 'PAUSED',
      lifetime_spend_cap: 1000000000, // $100 total
      is_campaign_budget_optimization: true
    });
    if (newCampaignConversions.data && newCampaignConversions.data.id && newCampaignConversions.data.objective_type === 'CONVERSIONS') {
      pass(`Created CONVERSIONS campaign: ${newCampaignConversions.data.id}`);
      console.log(`  CBO: ${newCampaignConversions.data.is_campaign_budget_optimization}`);
      console.log(`  Lifetime Cap: $${newCampaignConversions.data.lifetime_spend_cap / 10000000}`);
      passCount++;
    } else {
      fail('Create CONVERSIONS campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 6: Update Campaign
    section('Test 6: Update Campaign');
    const updatedCampaign = await pinterest.handleToolCall('pinterest_update_campaign', {
      campaign_id: '549755885175001',
      status: 'PAUSED',
      daily_spend_cap: 75000000 // Increase to $7.50/day
    });
    if (updatedCampaign.data && updatedCampaign.success) {
      pass('Updated campaign status and budget');
      console.log(`  New Status: ${updatedCampaign.data.status || 'PAUSED'}`);
      passCount++;
    } else {
      fail('Update campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 7: Get Ad Groups
    section('Test 7: Get Ad Groups');
    const adGroups = await pinterest.handleToolCall('pinterest_get_ad_groups', {
      campaign_ids: ['549755885175001'],
      entity_statuses: ['ACTIVE']
    });
    if (adGroups.data && adGroups.data.length > 0) {
      pass(`Got ${adGroups.data.length} ad group(s) for campaign`);
      console.log(`  - ${adGroups.data[0].name}`);
      console.log(`    Budget: $${adGroups.data[0].budget_in_micro_currency / 10000000}/day`);
      console.log(`    Bid: $${adGroups.data[0].bid_in_micro_currency / 10000000} CPM`);
      passCount++;
    } else {
      fail('Get ad groups failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 8: Create Ad Group - Interest Targeting
    section('Test 8: Create Ad Group (Interest Targeting)');
    const newAdGroupInterest = await pinterest.handleToolCall('pinterest_create_ad_group', {
      campaign_id: '549755885175001',
      name: 'Test Ad Group - Fashion Enthusiasts',
      status: 'PAUSED',
      budget_in_micro_currency: 30000000, // $3/day
      bid_in_micro_currency: 2500000, // $0.25 CPM
      billable_event: 'IMPRESSION',
      targeting_spec: {
        GENDER: ['FEMALE'],
        AGE_BUCKET: ['25-34', '35-44'],
        GEO: ['US', 'CA'],
        INTEREST: ['Fashion', 'Shopping', 'Womens fashion'],
        PLACEMENT: ['ALL']
      }
    });
    if (newAdGroupInterest.data && newAdGroupInterest.data.id && newAdGroupInterest.data.targeting_spec) {
      pass(`Created ad group with interest targeting: ${newAdGroupInterest.data.id}`);
      console.log(`  Interests: ${newAdGroupInterest.data.targeting_spec.INTEREST?.join(', ') || 'N/A'}`);
      console.log(`  Countries: ${newAdGroupInterest.data.targeting_spec.GEO?.join(', ') || 'N/A'}`);
      console.log(`  Budget: $${newAdGroupInterest.data.budget_in_micro_currency / 10000000}/day`);
      passCount++;
    } else {
      fail('Create ad group with interest targeting failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 9: Create Ad Group - Keyword Targeting
    section('Test 9: Create Ad Group (Keyword Targeting)');
    const newAdGroupKeyword = await pinterest.handleToolCall('pinterest_create_ad_group', {
      campaign_id: '549755885175002',
      name: 'Test Ad Group - Home Decor Keywords',
      status: 'PAUSED',
      budget_in_micro_currency: 40000000, // $4/day
      bid_in_micro_currency: 3000000, // $0.30 CPM
      billable_event: 'CLICKTHROUGH',
      targeting_spec: {
        GENDER: ['FEMALE', 'MALE'],
        AGE_BUCKET: ['25-34', '35-44', '45-49'],
        GEO: ['US'],
        KEYWORD: ['home decor', 'living room ideas', 'interior design'],
        INTEREST: ['Home decor', 'Interior design'],
        PLACEMENT: ['SEARCH']
      }
    });
    if (newAdGroupKeyword.data && newAdGroupKeyword.data.id && newAdGroupKeyword.data.targeting_spec) {
      pass(`Created ad group with keyword targeting: ${newAdGroupKeyword.data.id}`);
      console.log(`  Keywords: ${newAdGroupKeyword.data.targeting_spec.KEYWORD?.join(', ') || 'N/A'}`);
      console.log(`  Placement: ${newAdGroupKeyword.data.targeting_spec.PLACEMENT?.join(', ') || 'N/A'}`);
      console.log(`  Billable Event: ${newAdGroupKeyword.data.billable_event}`);
      passCount++;
    } else {
      fail('Create ad group with keyword targeting failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 10: Update Ad Group
    section('Test 10: Update Ad Group');
    const updatedAdGroup = await pinterest.handleToolCall('pinterest_update_ad_group', {
      ad_group_id: '549755885176001',
      budget_in_micro_currency: 35000000, // Increase to $3.50/day
      status: 'ACTIVE'
    });
    if (updatedAdGroup.data && updatedAdGroup.success) {
      pass('Updated ad group budget and status');
      console.log(`  New Budget: $${updatedAdGroup.data.budget_in_micro_currency / 10000000 || '3.50'}/day`);
      passCount++;
    } else {
      fail('Update ad group failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 11: Get Ads
    section('Test 11: Get Ads');
    const ads = await pinterest.handleToolCall('pinterest_get_ads', {
      ad_group_ids: ['549755885176001'],
      entity_statuses: ['ACTIVE']
    });
    if (ads.data && ads.data.length > 0) {
      pass(`Got ${ads.data.length} active ad(s) for ad group`);
      console.log(`  - ${ads.data[0].name || ads.data[0].id}`);
      console.log(`    Creative Type: ${ads.data[0].creative_type}`);
      console.log(`    Pin ID: ${ads.data[0].pin_id}`);
      passCount++;
    } else {
      fail('Get ads failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 12: Create Ad - Regular Pin
    section('Test 12: Create Ad (Regular Pin)');
    const newAdRegular = await pinterest.handleToolCall('pinterest_create_ad', {
      ad_group_id: '549755885176001',
      name: 'Test Ad - Product Pin 1',
      status: 'PAUSED',
      creative_type: 'REGULAR',
      pin_id: '1234567890123456789',
      destination_url: 'https://example.com/products'
    });
    if (newAdRegular.data && newAdRegular.data.id && newAdRegular.data.creative_type === 'REGULAR') {
      pass(`Created REGULAR ad: ${newAdRegular.data.id}`);
      console.log(`  Pin ID: ${newAdRegular.data.pin_id}`);
      console.log(`  Destination: ${newAdRegular.data.destination_url}`);
      passCount++;
    } else {
      fail('Create REGULAR ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 13: Create Ad - Video Pin
    section('Test 13: Create Ad (Video Pin)');
    const newAdVideo = await pinterest.handleToolCall('pinterest_create_ad', {
      ad_group_id: '549755885176002',
      name: 'Test Ad - Product Video',
      status: 'PAUSED',
      creative_type: 'VIDEO',
      pin_id: '1234567890123456792',
      destination_url: 'https://example.com/video-product'
    });
    if (newAdVideo.data && newAdVideo.data.id && newAdVideo.data.creative_type === 'VIDEO') {
      pass(`Created VIDEO ad: ${newAdVideo.data.id}`);
      console.log(`  Creative Type: ${newAdVideo.data.creative_type}`);
      passCount++;
    } else {
      fail('Create VIDEO ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 14: Update Ad
    section('Test 14: Update Ad');
    const updatedAd = await pinterest.handleToolCall('pinterest_update_ad', {
      ad_id: '549755885177001',
      status: 'PAUSED'
    });
    if (updatedAd.data && updatedAd.success) {
      pass('Updated ad status');
      console.log(`  Status: ${updatedAd.data.status || 'PAUSED'}`);
      passCount++;
    } else {
      fail('Update ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 15: Get Audiences
    section('Test 15: Get Audiences');
    const audiences = await pinterest.handleToolCall('pinterest_get_audiences', {
      page_size: 25
    });
    if (audiences.data && audiences.data.length === 3) {
      pass(`Got ${audiences.data.length} audience(s)`);
      audiences.data.forEach(aud => {
        console.log(`  - ${aud.name} (${aud.audience_type})`);
        console.log(`    Size: ${aud.size.toLocaleString()} | Status: ${aud.status}`);
      });
      passCount++;
    } else {
      fail('Get audiences failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 16: Create Audience - Customer List
    section('Test 16: Create Audience (Customer List)');
    const newAudienceCustomer = await pinterest.handleToolCall('pinterest_create_audience', {
      name: 'Test Customer List - Newsletter Subscribers',
      audience_type: 'CUSTOMER_LIST',
      description: 'Uploaded email list from newsletter database',
      rule: {
        country: 'US',
        retention_days: 180
      }
    });
    if (newAudienceCustomer.data && newAudienceCustomer.data.id && newAudienceCustomer.data.audience_type === 'CUSTOMER_LIST') {
      pass(`Created CUSTOMER_LIST audience: ${newAudienceCustomer.data.id}`);
      console.log(`  Name: ${newAudienceCustomer.data.name}`);
      console.log(`  Retention: ${newAudienceCustomer.data.rule?.retention_days || 180} days`);
      passCount++;
    } else {
      fail('Create CUSTOMER_LIST audience failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 17: Create Audience - Visitor (Retargeting)
    section('Test 17: Create Audience (Website Visitors)');
    const newAudienceVisitor = await pinterest.handleToolCall('pinterest_create_audience', {
      name: 'Test Audience - Website Visitors 90 Days',
      audience_type: 'VISITOR',
      description: 'Users who visited our website in the past 90 days',
      rule: {
        country: 'US',
        retention_days: 90,
        event_type: 'pagevisit'
      }
    });
    if (newAudienceVisitor.data && newAudienceVisitor.data.id && newAudienceVisitor.data.audience_type === 'VISITOR') {
      pass(`Created VISITOR audience: ${newAudienceVisitor.data.id}`);
      console.log(`  Event Type: ${newAudienceVisitor.data.rule?.event_type || 'pagevisit'}`);
      console.log(`  Retention: ${newAudienceVisitor.data.rule?.retention_days || 90} days`);
      passCount++;
    } else {
      fail('Create VISITOR audience failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 18: Create Audience - Actalike (Lookalike)
    section('Test 18: Create Audience (Actalike/Lookalike)');
    const newAudienceLookalike = await pinterest.handleToolCall('pinterest_create_audience', {
      name: 'Test Lookalike - Top Customers 1%',
      audience_type: 'ACTALIKE',
      description: '1% lookalike based on purchasers',
      seed_id: '549755885178001',
      rule: {
        country: 'US',
        retention_days: 90
      }
    });
    if (newAudienceLookalike.data && newAudienceLookalike.data.id && newAudienceLookalike.data.audience_type === 'ACTALIKE') {
      pass(`Created ACTALIKE audience: ${newAudienceLookalike.data.id}`);
      console.log(`  Seed Audience: ${newAudienceLookalike.data.seed_id}`);
      passCount++;
    } else {
      fail('Create ACTALIKE audience failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 19: Get Insights - Campaign Level
    section('Test 19: Get Insights (Campaign Level)');
    const campaignInsights = await pinterest.handleToolCall('pinterest_get_insights', {
      level: 'CAMPAIGN',
      start_date: '2026-02-01',
      end_date: '2026-02-10',
      campaign_ids: ['549755885175001', '549755885175002'],
      granularity: 'TOTAL',
      columns: ['IMPRESSION', 'CLICKTHROUGH', 'SPEND_IN_DOLLAR', 'CTR_2', 'ECPM', 'TOTAL_CONVERSIONS']
    });
    if (campaignInsights.data && campaignInsights.data.length >= 2) {
      pass(`Got insights for ${campaignInsights.data.length} campaign(s)`);
      campaignInsights.data.forEach(insight => {
        console.log(`  Campaign ${insight.campaign_id}:`);
        console.log(`    Impressions: ${insight.metrics.IMPRESSION.toLocaleString()}`);
        console.log(`    Clicks: ${insight.metrics.CLICKTHROUGH.toLocaleString()}`);
        console.log(`    Spend: $${insight.metrics.SPEND_IN_DOLLAR}`);
        console.log(`    CTR: ${insight.metrics.CTR_2}%`);
        console.log(`    Conversions: ${insight.metrics.TOTAL_CONVERSIONS}`);
      });
      passCount++;
    } else {
      fail('Get campaign insights failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 20: Get Insights - Ad Group Level
    section('Test 20: Get Insights (Ad Group Level)');
    const adGroupInsights = await pinterest.handleToolCall('pinterest_get_insights', {
      level: 'AD_GROUP',
      start_date: '2026-02-01',
      end_date: '2026-02-10',
      ad_group_ids: ['549755885176001'],
      granularity: 'TOTAL'
    });
    if (adGroupInsights.data && adGroupInsights.data.length > 0) {
      pass(`Got insights for ${adGroupInsights.data.length} ad group(s)`);
      const insight = adGroupInsights.data[0];
      console.log(`  Ad Group ${insight.ad_group_id}:`);
      console.log(`    Impressions: ${insight.metrics.IMPRESSION.toLocaleString()}`);
      console.log(`    Engagement Rate: ${insight.metrics.ENGAGEMENT_RATE}%`);
      console.log(`    Saves: ${insight.metrics.SAVE}`);
      console.log(`    Outbound Clicks: ${insight.metrics.OUTBOUND_CLICK.toLocaleString()}`);
      passCount++;
    } else {
      fail('Get ad group insights failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 21: Get Insights - Ad Level
    section('Test 21: Get Insights (Ad Level)');
    const adInsights = await pinterest.handleToolCall('pinterest_get_insights', {
      level: 'AD',
      start_date: '2026-02-01',
      end_date: '2026-02-10',
      ad_ids: ['549755885177001']
    });
    if (adInsights.data && adInsights.data.length > 0) {
      pass(`Got insights for ${adInsights.data.length} ad(s)`);
      const insight = adInsights.data[0];
      console.log(`  Ad ${insight.ad_id} (Pin ${insight.pin_id}):`);
      console.log(`    Impressions: ${insight.metrics.IMPRESSION.toLocaleString()}`);
      console.log(`    CTR: ${insight.metrics.CTR_2}%`);
      console.log(`    CPA: $${insight.metrics.CPA}`);
      passCount++;
    } else {
      fail('Get ad insights failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 22: Get Ad Accounts
    section('Test 22: Get Ad Accounts');
    const adAccounts = await pinterest.handleToolCall('pinterest_get_ad_accounts', {
      page_size: 25
    });
    if (adAccounts.data && adAccounts.data.length > 0) {
      pass(`Got ${adAccounts.data.length} ad account(s)`);
      adAccounts.data.forEach(account => {
        console.log(`  - ${account.name || account.id}`);
        console.log(`    ID: ${account.id}`);
        console.log(`    Country: ${account.country} | Currency: ${account.currency}`);
      });
      passCount++;
    } else {
      fail('Get ad accounts failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 23: Get Pins
    section('Test 23: Get Pins');
    const pins = await pinterest.handleToolCall('pinterest_get_pins', {
      page_size: 25,
      pin_filter: 'all'
    });
    if (pins.data && pins.data.length === 5) {
      pass(`Got ${pins.data.length} pin(s)`);
      pins.data.slice(0, 3).forEach(pin => {
        console.log(`  - ${pin.title}`);
        console.log(`    ID: ${pin.id}`);
        console.log(`    Link: ${pin.link || 'N/A'}`);
      });
      passCount++;
    } else {
      fail('Get pins failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 24: Create Pin
    section('Test 24: Create Pin');
    const newPin = await pinterest.handleToolCall('pinterest_create_pin', {
      board_id: '549755885179001',
      title: 'Test Pin - Summer Collection',
      description: 'Check out our new summer collection. Perfect for warm weather!',
      link: 'https://example.com/summer-collection',
      media_source: {
        source_type: 'image_url',
        url: 'https://i.pinimg.com/originals/example-summer.jpg'
      },
      alt_text: 'Woman wearing summer dress',
      dominant_color: '#87CEEB'
    });
    if (newPin.data && newPin.data.id && newPin.data.title === 'Test Pin - Summer Collection') {
      pass(`Created pin: ${newPin.data.id}`);
      console.log(`  Title: ${newPin.data.title}`);
      console.log(`  Link: ${newPin.data.link}`);
      console.log(`  Dominant Color: ${newPin.data.dominant_color}`);
      passCount++;
    } else {
      fail('Create pin failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Summary
    section('Test Summary');
    const total = passCount + failCount;
    const passRate = ((passCount / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
    console.log(`Pass Rate: ${passRate}%\n`);
    
    if (failCount === 0) {
      console.log(`${colors.green}🎉 All tests passed! Pinterest connector is working perfectly in sandbox mode.${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠ Some tests failed. Please review the errors above.${colors.reset}\n`);
    }
    
    return { passCount, failCount, total, passRate };
    
  } catch (error) {
    console.error(`${colors.red}Fatal error during tests:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().then(result => {
    process.exit(result.failCount > 0 ? 1 : 0);
  });
}

module.exports = { runTests };
