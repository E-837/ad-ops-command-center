/**
 * Seed: Sample campaigns
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('campaigns').del();
  
  const now = new Date().toISOString();
  
  // Helper to generate dates
  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  
  const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  
  // Insert seed entries
  await knex('campaigns').insert([
    // Meta Ads campaigns
    {
      id: 'camp-meta-001',
      projectId: 'proj-seed-001',
      platform: 'meta-ads',
      externalId: 'fb-123456789',
      name: 'Q1 Brand Awareness - Facebook',
      status: 'active',
      budget: 25000,
      startDate: daysAgo(30),
      endDate: daysFromNow(60),
      metadata: JSON.stringify({
        adAccountId: 'act_123456',
        objective: 'BRAND_AWARENESS',
        bidStrategy: 'LOWEST_COST_WITH_BID_CAP'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-meta-002',
      projectId: 'proj-seed-001',
      platform: 'meta-ads',
      externalId: 'ig-987654321',
      name: 'Q1 Brand Awareness - Instagram',
      status: 'active',
      budget: 25000,
      startDate: daysAgo(30),
      endDate: daysFromNow(60),
      metadata: JSON.stringify({
        adAccountId: 'act_123456',
        objective: 'BRAND_AWARENESS',
        bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
        placements: ['instagram_feed', 'instagram_stories']
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-meta-003',
      projectId: null,
      platform: 'meta-ads',
      externalId: 'fb-555444333',
      name: 'Retargeting - Web Visitors',
      status: 'active',
      budget: 15000,
      startDate: daysAgo(15),
      endDate: daysFromNow(15),
      metadata: JSON.stringify({
        adAccountId: 'act_123456',
        objective: 'CONVERSIONS',
        audienceType: 'custom',
        customAudienceId: 'ca_123'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    
    // Google Ads campaigns
    {
      id: 'camp-google-001',
      projectId: 'proj-seed-002',
      platform: 'google-ads',
      externalId: 'ggl-111222333',
      name: 'Holiday Shopping - Search',
      status: 'completed',
      budget: 50000,
      startDate: daysAgo(90),
      endDate: daysAgo(45),
      metadata: JSON.stringify({
        customerId: '123-456-7890',
        campaignType: 'SEARCH',
        biddingStrategy: 'TARGET_ROAS',
        targetRoas: 4.0
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-google-002',
      projectId: 'proj-seed-002',
      platform: 'google-ads',
      externalId: 'ggl-444555666',
      name: 'Holiday Shopping - Display',
      status: 'completed',
      budget: 50000,
      startDate: daysAgo(90),
      endDate: daysAgo(45),
      metadata: JSON.stringify({
        customerId: '123-456-7890',
        campaignType: 'DISPLAY',
        biddingStrategy: 'TARGET_CPA',
        targetCpa: 25.0
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-google-003',
      projectId: null,
      platform: 'google-ads',
      externalId: 'ggl-777888999',
      name: 'Brand Protection - Search',
      status: 'active',
      budget: 10000,
      startDate: daysAgo(60),
      endDate: daysFromNow(30),
      metadata: JSON.stringify({
        customerId: '123-456-7890',
        campaignType: 'SEARCH',
        biddingStrategy: 'MANUAL_CPC',
        keywords: ['brand name', 'company name']
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    
    // Pinterest campaigns
    {
      id: 'camp-pinterest-001',
      projectId: 'proj-seed-003',
      platform: 'pinterest',
      externalId: 'pin-123abc456',
      name: 'Product Launch - Home Decor',
      status: 'paused',
      budget: 30000,
      startDate: daysFromNow(15),
      endDate: daysFromNow(75),
      metadata: JSON.stringify({
        adAccountId: 'pa_123456789',
        objective: 'AWARENESS',
        targetingType: 'interest',
        interests: ['home decor', 'interior design']
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-pinterest-002',
      projectId: null,
      platform: 'pinterest',
      externalId: 'pin-789def012',
      name: 'Spring Collection - Catalog',
      status: 'active',
      budget: 20000,
      startDate: daysAgo(10),
      endDate: daysFromNow(50),
      metadata: JSON.stringify({
        adAccountId: 'pa_123456789',
        objective: 'CATALOG_SALES',
        catalogId: 'cat_abc123'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    
    // TTD campaigns
    {
      id: 'camp-ttd-001',
      projectId: 'proj-seed-004',
      platform: 'ttd',
      externalId: 'ttd-aaa111bbb',
      name: 'Programmatic Display - Auto',
      status: 'active',
      budget: 75000,
      startDate: daysAgo(20),
      endDate: daysFromNow(40),
      metadata: JSON.stringify({
        advertiserId: 'adv_123',
        flightStart: daysAgo(20),
        flightEnd: daysFromNow(40),
        kpiType: 'CPA',
        kpiGoal: 30.0
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-ttd-002',
      projectId: 'proj-seed-004',
      platform: 'ttd',
      externalId: 'ttd-ccc222ddd',
      name: 'Programmatic Video - Auto',
      status: 'active',
      budget: 50000,
      startDate: daysAgo(20),
      endDate: daysFromNow(40),
      metadata: JSON.stringify({
        advertiserId: 'adv_123',
        flightStart: daysAgo(20),
        flightEnd: daysFromNow(40),
        kpiType: 'CPC',
        kpiGoal: 2.5
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    
    // DV360 campaigns
    {
      id: 'camp-dv360-001',
      projectId: null,
      platform: 'dv360',
      externalId: 'dv-111aaa222',
      name: 'Programmatic - Finance Vertical',
      status: 'active',
      budget: 100000,
      startDate: daysAgo(45),
      endDate: daysFromNow(15),
      metadata: JSON.stringify({
        advertiserId: 'adv_dv_456',
        bidStrategy: 'MAXIMIZE_CONVERSIONS',
        frequencyCap: { exposures: 3, period: 'DAY' }
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-dv360-002',
      projectId: null,
      platform: 'dv360',
      externalId: 'dv-333bbb444',
      name: 'YouTube - Brand Video',
      status: 'paused',
      budget: 40000,
      startDate: daysAgo(10),
      endDate: daysFromNow(20),
      metadata: JSON.stringify({
        advertiserId: 'adv_dv_456',
        bidStrategy: 'TARGET_CPM',
        targetCpm: 15.0,
        inventory: 'youtube_video'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    
    // More campaigns for variety
    {
      id: 'camp-meta-004',
      projectId: null,
      platform: 'meta-ads',
      externalId: 'fb-999888777',
      name: 'Lead Gen - B2B',
      status: 'active',
      budget: 12000,
      startDate: daysAgo(5),
      endDate: daysFromNow(25),
      metadata: JSON.stringify({
        adAccountId: 'act_789012',
        objective: 'LEAD_GENERATION',
        leadFormId: 'form_abc'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-google-004',
      projectId: null,
      platform: 'google-ads',
      externalId: 'ggl-121314151',
      name: 'YouTube - Pre-Roll',
      status: 'active',
      budget: 35000,
      startDate: daysAgo(12),
      endDate: daysFromNow(48),
      metadata: JSON.stringify({
        customerId: '123-456-7890',
        campaignType: 'VIDEO',
        biddingStrategy: 'MAXIMIZE_CONVERSIONS'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-pinterest-003',
      projectId: null,
      platform: 'pinterest',
      externalId: 'pin-555zzz888',
      name: 'Shopping - Fashion',
      status: 'active',
      budget: 18000,
      startDate: daysAgo(8),
      endDate: daysFromNow(22),
      metadata: JSON.stringify({
        adAccountId: 'pa_987654321',
        objective: 'SHOPPING',
        targetingType: 'keyword',
        keywords: ['fashion', 'style', 'clothing']
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    }
  ]);
  
  console.log('✅ Seeded 15 sample campaigns across 5 platforms');
};
