/**
 * LinkedIn Ads Connector Test Suite
 * Tests all 12 tools in sandbox mode
 */

const linkedin = require('./linkedin-ads.js');

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
  console.log(`${colors.yellow}LinkedIn Ads Connector Test Suite${colors.reset}\n`);
  
  let passCount = 0;
  let failCount = 0;
  
  try {
    // Test 1: Connector Info
    section('Test 1: Connector Info');
    const connectorInfo = linkedin.getInfo();
    console.log(JSON.stringify(connectorInfo, null, 2));
    if (connectorInfo.name === 'LinkedIn Ads' && connectorInfo.toolCount === 12 && connectorInfo.sandbox === true) {
      pass('Connector info loaded correctly');
      passCount++;
    } else {
      fail('Connector info mismatch');
      failCount++;
    }
    
    // Test 2: Connection Test
    section('Test 2: Connection Test');
    const connection = await linkedin.testConnection();
    console.log(JSON.stringify(connection, null, 2));
    if (connection.mode === 'sandbox' && connection.status === 'ok') {
      pass('Connection test passed (sandbox mode)');
      passCount++;
    } else {
      fail('Connection test failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 3: Get Ad Accounts
    section('Test 3: Get Ad Accounts');
    const accounts = await linkedin.handleToolCall('linkedin_get_ad_accounts', {});
    if (accounts.data && accounts.data.length === 2 && accounts.sandbox === true) {
      pass(`Got ${accounts.data.length} ad accounts`);
      console.log(`  - ${accounts.data[0].name} (${accounts.data[0].id})`);
      console.log(`  - ${accounts.data[1].name} (${accounts.data[1].id})`);
      passCount++;
    } else {
      fail('Get ad accounts failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 4: Get Campaigns (All)
    section('Test 4: Get Campaigns (All)');
    const allCampaigns = await linkedin.handleToolCall('linkedin_get_campaigns', {});
    if (allCampaigns.data && allCampaigns.data.length === 3 && allCampaigns.sandbox === true) {
      pass(`Got ${allCampaigns.data.length} campaigns`);
      allCampaigns.data.forEach(c => {
        console.log(`  - ${c.name} (${c.status}) - ${c.objectiveType}`);
      });
      passCount++;
    } else {
      fail('Get all campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 5: Get Campaigns (Active Only)
    section('Test 5: Get Campaigns (Active Only)');
    const activeCampaigns = await linkedin.handleToolCall('linkedin_get_campaigns', {
      status: ['ACTIVE']
    });
    if (activeCampaigns.data && activeCampaigns.data.length === 2) {
      pass(`Got ${activeCampaigns.data.length} active campaigns`);
      activeCampaigns.data.forEach(c => {
        console.log(`  - ${c.name} (${c.objectiveType})`);
      });
      passCount++;
    } else {
      fail('Get active campaigns failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 6: Create Campaign - LEAD_GENERATION
    section('Test 6: Create Campaign (LEAD_GENERATION)');
    const newCampaignLeadGen = await linkedin.handleToolCall('linkedin_create_campaign', {
      name: 'Test Lead Gen Campaign - Q2 2026',
      objective_type: 'LEAD_GENERATION',
      daily_budget_amount: 500,
      total_budget_amount: 15000,
      start_date: String(Date.now()),
      status: 'PAUSED'
    });
    if (newCampaignLeadGen.data && newCampaignLeadGen.data.id && newCampaignLeadGen.data.objectiveType === 'LEAD_GENERATION') {
      pass(`Created LEAD_GENERATION campaign: ${newCampaignLeadGen.data.id}`);
      console.log(`  Name: ${newCampaignLeadGen.data.name}`);
      console.log(`  Status: ${newCampaignLeadGen.data.status}`);
      console.log(`  Daily Budget: $${newCampaignLeadGen.data.dailyBudget.amount}`);
      console.log(`  Total Budget: $${newCampaignLeadGen.data.totalBudget.amount}`);
      passCount++;
    } else {
      fail('Create LEAD_GENERATION campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 7: Create Campaign - BRAND_AWARENESS
    section('Test 7: Create Campaign (BRAND_AWARENESS)');
    const newCampaignAwareness = await linkedin.handleToolCall('linkedin_create_campaign', {
      name: 'Test Brand Awareness - Video',
      objective_type: 'BRAND_AWARENESS',
      daily_budget_amount: 300,
      total_budget_amount: 9000,
      start_date: String(Date.now()),
      locale_country: 'US',
      locale_language: 'en_US',
      status: 'PAUSED'
    });
    if (newCampaignAwareness.data && newCampaignAwareness.data.objectiveType === 'BRAND_AWARENESS') {
      pass(`Created BRAND_AWARENESS campaign: ${newCampaignAwareness.data.id}`);
      console.log(`  Name: ${newCampaignAwareness.data.name}`);
      console.log(`  Cost Type: ${newCampaignAwareness.data.costType}`);
      passCount++;
    } else {
      fail('Create BRAND_AWARENESS campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 8: Update Campaign
    section('Test 8: Update Campaign');
    const updatedCampaign = await linkedin.handleToolCall('linkedin_update_campaign', {
      campaign_id: 'urn:li:sponsoredCampaign:123458',
      status: 'ACTIVE',
      daily_budget_amount: 250
    });
    if (updatedCampaign.data && updatedCampaign.data.status === 'ACTIVE') {
      pass(`Updated campaign status to ACTIVE`);
      console.log(`  Campaign: ${updatedCampaign.data.name}`);
      console.log(`  New Budget: $${updatedCampaign.data.dailyBudget.amount}/day`);
      passCount++;
    } else {
      fail('Update campaign failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 9: Get Creatives (All)
    section('Test 9: Get Creatives (All)');
    const allCreatives = await linkedin.handleToolCall('linkedin_get_creatives', {});
    if (allCreatives.data && allCreatives.data.length === 4 && allCreatives.sandbox === true) {
      pass(`Got ${allCreatives.data.length} creatives`);
      allCreatives.data.forEach(c => {
        console.log(`  - ${c.content?.headline || 'Untitled'} (${c.type}) - ${c.status}`);
      });
      passCount++;
    } else {
      fail('Get all creatives failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 10: Get Creatives (By Campaign)
    section('Test 10: Get Creatives (By Campaign)');
    const campaignCreatives = await linkedin.handleToolCall('linkedin_get_creatives', {
      campaign_id: 'urn:li:sponsoredCampaign:123456',
      status: ['ACTIVE']
    });
    if (campaignCreatives.data && campaignCreatives.data.length === 2) {
      pass(`Got ${campaignCreatives.data.length} active creatives for campaign`);
      campaignCreatives.data.forEach(c => {
        console.log(`  - ${c.content.headline}`);
      });
      passCount++;
    } else {
      fail('Get campaign creatives failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 11: Create Sponsored Content (Single Image)
    section('Test 11: Create Sponsored Content (Single Image)');
    const newSponsoredContent = await linkedin.handleToolCall('linkedin_create_sponsored_content', {
      campaign_id: 'urn:li:sponsoredCampaign:123456',
      creative_type: 'SINGLE_IMAGE',
      headline: 'Transform Your B2B Sales Pipeline',
      intro_text: 'Discover how leading companies are closing 50% more deals with AI-powered insights.',
      call_to_action: 'LEARN_MORE',
      landing_page_url: 'https://example.com/demo',
      image_url: 'https://cdn.example.com/hero-image.jpg',
      status: 'PAUSED'
    });
    if (newSponsoredContent.data && newSponsoredContent.data.id && newSponsoredContent.data.type === 'SPONSORED_STATUS_UPDATE') {
      pass(`Created Sponsored Content: ${newSponsoredContent.data.id}`);
      console.log(`  Headline: ${newSponsoredContent.data.content.headline}`);
      console.log(`  CTA: ${newSponsoredContent.data.content.callToAction.labelType}`);
      passCount++;
    } else {
      fail('Create sponsored content failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 12: Create Sponsored Content (Video)
    section('Test 12: Create Sponsored Content (Video)');
    const newVideoAd = await linkedin.handleToolCall('linkedin_create_sponsored_content', {
      campaign_id: 'urn:li:sponsoredCampaign:123457',
      creative_type: 'VIDEO',
      headline: 'See Our Platform in Action',
      intro_text: 'Watch this 60-second demo and see why 10,000+ companies choose our solution.',
      call_to_action: 'VIEW_QUOTE',
      landing_page_url: 'https://example.com/video-demo',
      video_url: 'https://cdn.example.com/demo-video.mp4',
      status: 'PAUSED'
    });
    if (newVideoAd.data && newVideoAd.data.content.media.type === 'VIDEO') {
      pass(`Created Video Ad: ${newVideoAd.data.id}`);
      console.log(`  Headline: ${newVideoAd.data.content.headline}`);
      console.log(`  Media Type: ${newVideoAd.data.content.media.type}`);
      passCount++;
    } else {
      fail('Create video ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 13: Create Message Ad (InMail)
    section('Test 13: Create Message Ad (InMail)');
    const newMessageAd = await linkedin.handleToolCall('linkedin_create_message_ad', {
      campaign_id: 'urn:li:sponsoredCampaign:123456',
      subject: 'Exclusive Invitation: Transform Your Sales Team',
      message_body: 'Hi {firstName},\n\nI wanted to personally invite you to see how we\'ve helped companies like yours increase sales by 40%. Would you be interested in a quick 15-minute demo?\n\nBest regards,\nSarah Johnson',
      sender_name: 'Sarah Johnson',
      call_to_action_text: 'Book Demo',
      call_to_action_url: 'https://example.com/book-demo',
      banner_image_url: 'https://cdn.example.com/inmail-banner.jpg',
      status: 'PAUSED'
    });
    if (newMessageAd.data && newMessageAd.data.type === 'MESSAGE_AD') {
      pass(`Created Message Ad: ${newMessageAd.data.id}`);
      console.log(`  Subject: ${newMessageAd.data.content.subject}`);
      console.log(`  Sender: ${newMessageAd.data.content.sender.name}`);
      console.log(`  CTA: ${newMessageAd.data.content.callToAction.text}`);
      passCount++;
    } else {
      fail('Create message ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 14: Create Text Ad
    section('Test 14: Create Text Ad');
    const newTextAd = await linkedin.handleToolCall('linkedin_create_text_ad', {
      campaign_id: 'urn:li:sponsoredCampaign:123456',
      headline: 'B2B Sales Platform',
      description: 'Close more deals with AI-powered insights. Free trial available.',
      landing_page_url: 'https://example.com/trial',
      image_url: 'https://cdn.example.com/logo-50x50.png',
      status: 'PAUSED'
    });
    if (newTextAd.data && newTextAd.data.type === 'TEXT_AD') {
      pass(`Created Text Ad: ${newTextAd.data.id}`);
      console.log(`  Headline: ${newTextAd.data.content.headline}`);
      console.log(`  Description: ${newTextAd.data.content.description}`);
      passCount++;
    } else {
      fail('Create text ad failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 15: Get Targeting Facets - Job Titles
    section('Test 15: Get Targeting Facets (Job Titles)');
    const jobTitles = await linkedin.handleToolCall('linkedin_get_targeting_facets', {
      facet_type: 'TITLES',
      search: 'engineer'
    });
    if (jobTitles.data && jobTitles.data.length > 0) {
      pass(`Got ${jobTitles.data.length} job title facets`);
      jobTitles.data.slice(0, 5).forEach(t => {
        console.log(`  - ${t.name} (${t.urn})`);
      });
      passCount++;
    } else {
      fail('Get job title facets failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 16: Get Targeting Facets - Industries
    section('Test 16: Get Targeting Facets (Industries)');
    const industries = await linkedin.handleToolCall('linkedin_get_targeting_facets', {
      facet_type: 'INDUSTRIES'
    });
    if (industries.data && industries.data.length === 5) {
      pass(`Got ${industries.data.length} industry facets`);
      industries.data.forEach(i => {
        console.log(`  - ${i.name} (${i.urn})`);
      });
      passCount++;
    } else {
      fail('Get industry facets failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 17: Get Targeting Facets - Seniorities
    section('Test 17: Get Targeting Facets (Seniorities)');
    const seniorities = await linkedin.handleToolCall('linkedin_get_targeting_facets', {
      facet_type: 'SENIORITIES'
    });
    if (seniorities.data && seniorities.data.length === 8) {
      pass(`Got ${seniorities.data.length} seniority levels`);
      seniorities.data.forEach(s => {
        console.log(`  - ${s.name} (${s.level})`);
      });
      passCount++;
    } else {
      fail('Get seniority facets failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 18: Get Audience Count Estimation
    section('Test 18: Get Audience Count Estimation');
    const audienceCounts = await linkedin.handleToolCall('linkedin_get_audience_counts', {
      targeting: {
        job_titles: ['Chief Technology Officer', 'VP of Engineering', 'Director of IT'],
        industries: ['Software', 'Information Technology'],
        seniorities: ['DIRECTOR', 'VP', 'CXO'],
        company_sizes: ['D', 'E', 'F', 'G', 'H', 'I']
      }
    });
    if (audienceCounts.data && audienceCounts.data.estimatedReach > 0) {
      pass(`Got audience count estimation`);
      console.log(`  Estimated Reach: ${audienceCounts.data.estimatedReach.toLocaleString()}`);
      console.log(`  Est. Impressions: ${audienceCounts.data.estimatedImpressions.min.toLocaleString()} - ${audienceCounts.data.estimatedImpressions.max.toLocaleString()}`);
      console.log(`  Est. Clicks: ${audienceCounts.data.estimatedClicks.min.toLocaleString()} - ${audienceCounts.data.estimatedClicks.max.toLocaleString()}`);
      console.log(`  Recommended Budget: $${audienceCounts.data.estimatedDailyBudget.recommended}/day`);
      passCount++;
    } else {
      fail('Get audience count estimation failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 19: Get Lead Gen Forms
    section('Test 19: Get Lead Gen Forms');
    const leadGenForms = await linkedin.handleToolCall('linkedin_get_lead_gen_forms', {
      include_leads: false
    });
    if (leadGenForms.data && leadGenForms.data.length === 2) {
      pass(`Got ${leadGenForms.data.length} lead gen forms`);
      leadGenForms.data.forEach(f => {
        console.log(`  - ${f.name} (${f.totalLeads} leads) - ${f.status}`);
      });
      passCount++;
    } else {
      fail('Get lead gen forms failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 20: Get Lead Gen Form with Leads
    section('Test 20: Get Lead Gen Form with Leads');
    const formWithLeads = await linkedin.handleToolCall('linkedin_get_lead_gen_forms', {
      form_id: 'urn:li:leadGenForm:567890',
      include_leads: true
    });
    if (formWithLeads.data && formWithLeads.data.leads && formWithLeads.data.leads.length === 3) {
      pass(`Got lead gen form with ${formWithLeads.data.leads.length} leads`);
      console.log(`  Form: ${formWithLeads.data.name}`);
      formWithLeads.data.leads.forEach(lead => {
        console.log(`  - ${lead.firstName} ${lead.lastName} (${lead.title}) - ${lead.company}`);
      });
      passCount++;
    } else {
      fail('Get lead gen form with leads failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 21: Get Analytics (Campaign)
    section('Test 21: Get Analytics (Campaign)');
    const campaignAnalytics = await linkedin.handleToolCall('linkedin_get_analytics', {
      entity_type: 'CAMPAIGN',
      entity_id: 'urn:li:sponsoredCampaign:123456',
      date_start: '2026-02-01',
      date_end: '2026-02-10'
    });
    if (campaignAnalytics.data && campaignAnalytics.data.metrics) {
      pass('Got campaign analytics');
      const m = campaignAnalytics.data.metrics;
      console.log(`  Campaign: ${campaignAnalytics.data.entity_name}`);
      console.log(`  Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  Spend: $${m.spend.toFixed(2)}`);
      console.log(`  CTR: ${m.ctr}%`);
      console.log(`  CPC: $${m.cpc.toFixed(2)}`);
      console.log(`  Leads: ${m.leads}`);
      console.log(`  Cost Per Lead: $${m.cost_per_lead.toFixed(2)}`);
      passCount++;
    } else {
      fail('Get campaign analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 22: Get Analytics (Creative)
    section('Test 22: Get Analytics (Creative)');
    const creativeAnalytics = await linkedin.handleToolCall('linkedin_get_analytics', {
      entity_type: 'CREATIVE',
      entity_id: 'urn:li:sponsoredCreative:456789',
      date_start: '2026-02-01',
      date_end: '2026-02-10'
    });
    if (creativeAnalytics.data && creativeAnalytics.data.metrics) {
      pass('Got creative analytics');
      const m = creativeAnalytics.data.metrics;
      console.log(`  Creative: ${creativeAnalytics.data.entity_name}`);
      console.log(`  Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  CTR: ${m.ctr}%`);
      console.log(`  Leads: ${m.leads}`);
      passCount++;
    } else {
      fail('Get creative analytics failed', new Error('Unexpected response'));
      failCount++;
    }
    
    // Test 23: Get Analytics (Account)
    section('Test 23: Get Analytics (Account)');
    const accountAnalytics = await linkedin.handleToolCall('linkedin_get_analytics', {
      entity_type: 'ACCOUNT',
      date_start: '2026-02-01',
      date_end: '2026-02-10'
    });
    if (accountAnalytics.data && accountAnalytics.data.metrics) {
      pass('Got account analytics');
      const m = accountAnalytics.data.metrics;
      console.log(`  Account: ${accountAnalytics.data.entity_name}`);
      console.log(`  Total Impressions: ${m.impressions.toLocaleString()}`);
      console.log(`  Total Clicks: ${m.clicks.toLocaleString()}`);
      console.log(`  Total Spend: $${m.spend.toFixed(2)}`);
      console.log(`  Total Leads: ${m.leads}`);
      console.log(`  Active Campaigns: ${accountAnalytics.data.active_campaigns}`);
      console.log(`  Active Creatives: ${accountAnalytics.data.active_creatives}`);
      passCount++;
    } else {
      fail('Get account analytics failed', new Error('Unexpected response'));
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
