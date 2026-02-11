/**
 * Meta Ads Connector Test Suite
 * Tests all 13 tools in sandbox mode
 */

const meta = require('./meta-ads.js');

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function runTests() {
  console.log(`${colors.yellow}Meta Ads Connector Test Suite${colors.reset}\n`);
  
  let passCount = 0;
  let failCount = 0;
  
  try {
    // Test 1: Connector Info
    section('Test 1: Connector Info');
    const info = meta.getInfo();
    console.log(JSON.stringify(info, null, 2));
    if (info.name === 'Meta Ads' && info.toolCount === 13 && info.sandbox === true) {
      pass('Connector info loaded correctly');
      passCount++;
    } else {
      fail('Connector info mismatch');
      failCount++;
    }
    
    // Test 2: Get Campaigns
    section('Test 2: Get Campaigns');
    const campaigns = await meta.handleToolCall('meta_ads_get_campaigns', {
      effective_status: ['ACTIVE']
    });
    if (campaigns.data && campaigns.data.length === 2 && campaigns.sandbox === true) {
      pass(`Got ${campaigns.data.length} active campaigns`);
      console.log(`  - ${campaigns.data[0].name} (${campaigns.data[0].objective})`);
      console.log(`  - ${campaigns.data[1].name} (${campaigns.data[1].objective})`);
      passCount++;
    } else {
      fail('Get campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 3: Create Campaign
    section('Test 3: Create Campaign');
    const newCampaign = await meta.handleToolCall('meta_ads_create_campaign', {
      name: 'Test Campaign - Q2 2026',
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED'
    });
    if (newCampaign.data && newCampaign.data.id && newCampaign.data.name === 'Test Campaign - Q2 2026') {
      pass(`Created campaign: ${newCampaign.data.id}`);
      console.log(`  Status: ${newCampaign.data.status}`);
      console.log(`  Objective: ${newCampaign.data.objective}`);
      passCount++;
    } else {
      fail('Create campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 4: Update Campaign
    section('Test 4: Update Campaign');
    const updatedCampaign = await meta.handleToolCall('meta_ads_update_campaign', {
      campaign_id: '120330000000001',
      status: 'ACTIVE'
    });
    if (updatedCampaign.data && updatedCampaign.data.success) {
      pass('Updated campaign status');
      passCount++;
    } else {
      fail('Update campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 5: Get Ad Sets
    section('Test 5: Get Ad Sets');
    const adSets = await meta.handleToolCall('meta_ads_get_ad_sets', {
      campaign_id: '120330000000001'
    });
    if (adSets.data && adSets.data.length > 0) {
      pass(`Got ${adSets.data.length} ad set(s) for campaign`);
      console.log(`  - ${adSets.data[0].name} (${adSets.data[0].optimization_goal})`);
      passCount++;
    } else {
      fail('Get ad sets failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 6: Create Ad Set
    section('Test 6: Create Ad Set');
    const newAdSet = await meta.handleToolCall('meta_ads_create_ad_set', {
      campaign_id: '120330000000001',
      name: 'Test Ad Set - Tech Enthusiasts',
      daily_budget: 5000,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      targeting: {
        age_min: 25,
        age_max: 45,
        genders: [1, 2],
        geo_locations: {
          countries: ['US', 'CA']
        },
        interests: [
          { id: '6003020834693', name: 'Technology' }
        ],
        publisher_platforms: ['facebook', 'instagram']
      }
    });
    if (newAdSet.data && newAdSet.data.id && newAdSet.data.targeting) {
      pass(`Created ad set: ${newAdSet.data.id}`);
      console.log(`  Budget: $${newAdSet.data.daily_budget / 100}/day`);
      console.log(`  Countries: ${newAdSet.data.targeting.geo_locations.countries.join(', ')}`);
      passCount++;
    } else {
      fail('Create ad set failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 7: Update Ad Set
    section('Test 7: Update Ad Set');
    const updatedAdSet = await meta.handleToolCall('meta_ads_update_ad_set', {
      ad_set_id: '120330000000101',
      daily_budget: 10000,
      status: 'ACTIVE'
    });
    if (updatedAdSet.data && updatedAdSet.data.success) {
      pass('Updated ad set');
      passCount++;
    } else {
      fail('Update ad set failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 8: Get Ads
    section('Test 8: Get Ads');
    const ads = await meta.handleToolCall('meta_ads_get_ads', {
      ad_set_id: '120330000000101'
    });
    if (ads.data && ads.data.length > 0) {
      pass(`Got ${ads.data.length} ad(s) for ad set`);
      console.log(`  - ${ads.data[0].name}`);
      passCount++;
    } else {
      fail('Get ads failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 9: Create Ad
    section('Test 9: Create Ad');
    const newAd = await meta.handleToolCall('meta_ads_create_ad', {
      ad_set_id: '120330000000101',
      name: 'Test Ad - Free Trial Offer',
      creative: {
        object_story_spec: {
          page_id: '123456789',
          link_data: {
            link: 'https://example.com/trial',
            message: 'Start your free trial today!',
            name: 'Free Trial - No Credit Card',
            description: 'Transform your workflow with AI.',
            call_to_action: {
              type: 'SIGN_UP'
            },
            image_hash: 'test_image_hash'
          }
        }
      },
      status: 'PAUSED'
    });
    if (newAd.data && newAd.data.id && newAd.data.creative) {
      pass(`Created ad: ${newAd.data.id}`);
      console.log(`  Creative type: Link ad`);
      passCount++;
    } else {
      fail('Create ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 10: Update Ad
    section('Test 10: Update Ad');
    const updatedAd = await meta.handleToolCall('meta_ads_update_ad', {
      ad_id: '120330000000301',
      status: 'ACTIVE'
    });
    if (updatedAd.data && updatedAd.data.success) {
      pass('Updated ad');
      passCount++;
    } else {
      fail('Update ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 11: Get Insights (Account Level)
    section('Test 11: Get Insights - Account Level');
    const accountInsights = await meta.handleToolCall('meta_ads_get_insights', {
      level: 'account',
      date_preset: 'last_7_days'
    });
    if (accountInsights.data && accountInsights.data.length > 0 && accountInsights.data[0].impressions) {
      pass('Got account insights');
      console.log(`  Impressions: ${accountInsights.data[0].impressions}`);
      console.log(`  Spend: $${accountInsights.data[0].spend}`);
      console.log(`  CPM: $${accountInsights.data[0].cpm}`);
      passCount++;
    } else {
      fail('Get account insights failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 12: Get Insights (Campaign Level)
    section('Test 12: Get Insights - Campaign Level');
    const campaignInsights = await meta.handleToolCall('meta_ads_get_insights', {
      level: 'campaign',
      object_id: '120330000000001',
      date_preset: 'last_30_days'
    });
    if (campaignInsights.data && campaignInsights.data.length > 0) {
      pass('Got campaign insights');
      console.log(`  Campaign ID: ${campaignInsights.campaign_id}`);
      console.log(`  CTR: ${campaignInsights.data[0].ctr}%`);
      passCount++;
    } else {
      fail('Get campaign insights failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 13: Get Audiences
    section('Test 13: Get Audiences');
    const audiences = await meta.handleToolCall('meta_ads_get_audiences', {});
    if (audiences.data && audiences.data.length === 3) {
      pass(`Got ${audiences.data.length} custom audiences`);
      audiences.data.forEach(aud => {
        console.log(`  - ${aud.name} (${aud.subtype}) - ${aud.approximate_count.toLocaleString()} people`);
      });
      passCount++;
    } else {
      fail('Get audiences failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 14: Create Audience
    section('Test 14: Create Audience');
    const newAudience = await meta.handleToolCall('meta_ads_create_audience', {
      name: 'Test Lookalike - High Value Customers',
      subtype: 'LOOKALIKE',
      origin_audience_id: '120330000000201',
      lookalike_spec: {
        type: 'SIMILARITY',
        ratio: 0.01,
        country: 'US'
      }
    });
    if (newAudience.data && newAudience.data.id && newAudience.data.subtype === 'LOOKALIKE') {
      pass(`Created lookalike audience: ${newAudience.data.id}`);
      passCount++;
    } else {
      fail('Create audience failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 15: Get Ad Accounts
    section('Test 15: Get Ad Accounts');
    const adAccounts = await meta.handleToolCall('meta_ads_get_ad_accounts', {});
    if (adAccounts.data && adAccounts.data.length > 0) {
      pass(`Got ${adAccounts.data.length} ad account(s)`);
      console.log(`  - ${adAccounts.data[0].name} (${adAccounts.data[0].id})`);
      console.log(`  - Currency: ${adAccounts.data[0].currency}`);
      passCount++;
    } else {
      fail('Get ad accounts failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 16: Test Connection
    section('Test 16: Test Connection');
    const connectionTest = await meta.testConnection();
    if (connectionTest.sandbox === true && connectionTest.connected === false) {
      pass('Connection test returns sandbox mode correctly');
      passCount++;
    } else {
      fail('Connection test failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Summary
    section('Test Summary');
    const total = passCount + failCount;
    const percentage = ((passCount / total) * 100).toFixed(1);
    
    console.log(`Total: ${total} tests`);
    console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
    console.log(`Success Rate: ${percentage}%\n`);
    
    if (failCount === 0) {
      console.log(`${colors.green}🎉 All tests passed! Meta Ads connector is ready.${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}⚠️  Some tests failed. Review errors above.${colors.reset}\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runTests();
