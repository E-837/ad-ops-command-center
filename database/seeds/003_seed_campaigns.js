/**
 * Seed: AI product line sample campaigns (Locke AI Co.)
 */

exports.seed = async function(knex) {
  await knex('campaigns').del();

  const now = new Date().toISOString();

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

  await knex('campaigns').insert([
    // AI Audio
    {
      id: 'camp-aiaudio-meta-001',
      projectId: 'proj-seed-001',
      platform: 'meta-ads',
      lob: 'ai_audio',
      externalId: 'fb-aiaudio-001',
      name: 'AI Audio - AirPod AI Launch Video',
      status: 'active',
      budget: 72000,
      startDate: daysAgo(32),
      endDate: daysFromNow(58),
      metadata: JSON.stringify({
        type: 'video',
        objective: 'brand_awareness',
        aovRange: [150, 300],
        targetAudience: ['tech enthusiasts', 'early adopters', 'audiophiles'],
        aiFeatureCallouts: ['adaptive ANC', 'real-time voice enhancement', 'context-aware assistant'],
        channelMix: ['video', 'display', 'influencer'],
        positioning: 'premium'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiaudio-google-001',
      projectId: 'proj-seed-001',
      platform: 'google-ads',
      lob: 'ai_audio',
      externalId: 'ggl-aiaudio-001',
      name: 'AI Audio - Noise-Canceling Earbuds Search',
      status: 'active',
      budget: 54000,
      startDate: daysAgo(24),
      endDate: daysFromNow(46),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'online_sales',
        aovRange: [150, 300],
        targetAudience: ['audiophiles', 'commuters', 'mobile professionals'],
        aiFeatureCallouts: ['personalized EQ', 'smart noise isolation', 'adaptive listening modes'],
        channelMix: ['search', 'shopping'],
        positioning: 'premium'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiaudio-tiktok-001',
      projectId: 'proj-seed-001',
      platform: 'tiktok-ads',
      lob: 'ai_audio',
      externalId: 'tt-aiaudio-001',
      name: 'AI Audio - Voice Assistant Earbuds Creator Push',
      status: 'active',
      budget: 43000,
      startDate: daysAgo(15),
      endDate: daysFromNow(40),
      metadata: JSON.stringify({
        type: 'social_video',
        objective: 'awareness',
        aovRange: [150, 300],
        targetAudience: ['gen z tech buyers', 'early adopters', 'music streamers'],
        aiFeatureCallouts: ['hands-free AI agent', 'live translation', 'gesture controls'],
        channelMix: ['video', 'creator partnerships'],
        positioning: 'premium'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },

    // AI Wearables
    {
      id: 'camp-aiwear-meta-001',
      projectId: 'proj-seed-002',
      platform: 'meta-ads',
      lob: 'ai_wearables',
      externalId: 'fb-aiwear-001',
      name: 'AI Wearables - Health Coach Feature Stories',
      status: 'active',
      budget: 68000,
      startDate: daysAgo(29),
      endDate: daysFromNow(52),
      metadata: JSON.stringify({
        type: 'social',
        objective: 'consideration',
        aovRange: [200, 500],
        targetAudience: ['fitness enthusiasts', 'health-conscious consumers', 'professionals'],
        aiFeatureCallouts: ['AI health coaching', 'predictive readiness score', 'adaptive workout plans'],
        channelMix: ['social', 'retargeting'],
        positioning: 'performance + wellness'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiwear-google-001',
      projectId: 'proj-seed-002',
      platform: 'google-ads',
      lob: 'ai_wearables',
      externalId: 'ggl-aiwear-001',
      name: 'AI Wearables - Sleep Optimization Search',
      status: 'active',
      budget: 61000,
      startDate: daysAgo(21),
      endDate: daysFromNow(44),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'conversion',
        aovRange: [200, 500],
        targetAudience: ['biohackers', 'health-conscious consumers', 'busy professionals'],
        aiFeatureCallouts: ['sleep stage intelligence', 'recovery recommendations', 'circadian coaching'],
        channelMix: ['search', 'shopping'],
        positioning: 'health-forward premium'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiwear-pinterest-001',
      projectId: 'proj-seed-002',
      platform: 'pinterest',
      lob: 'ai_wearables',
      externalId: 'pin-aiwear-001',
      name: 'AI Wearables - Smartwatch AI Fitness Plans',
      status: 'active',
      budget: 36000,
      startDate: daysAgo(14),
      endDate: daysFromNow(37),
      metadata: JSON.stringify({
        type: 'discovery',
        objective: 'traffic',
        aovRange: [200, 500],
        targetAudience: ['fitness enthusiasts', 'active lifestyle planners', 'health communities'],
        aiFeatureCallouts: ['dynamic fitness tracking', 'AI plan generator', 'habit streak intelligence'],
        channelMix: ['social discovery', 'visual planning'],
        positioning: 'aspirational performance'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },

    // AI Home
    {
      id: 'camp-aihome-google-001',
      projectId: 'proj-seed-003',
      platform: 'google-ads',
      lob: 'ai_home',
      externalId: 'ggl-aihome-001',
      name: 'AI Home - Smart Display Visual Recognition Search',
      status: 'active',
      budget: 59000,
      startDate: daysAgo(31),
      endDate: daysFromNow(56),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'consideration',
        aovRange: [100, 400],
        targetAudience: ['homeowners', 'tech-forward families', 'smart home upgraders'],
        aiFeatureCallouts: ['on-device visual recognition', 'context-aware routines', 'family profile learning'],
        channelMix: ['search', 'display'],
        positioning: 'connected home ecosystem'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aihome-meta-001',
      projectId: 'proj-seed-003',
      platform: 'meta-ads',
      lob: 'ai_home',
      externalId: 'fb-aihome-001',
      name: 'AI Home - Security Camera Intelligence Demo',
      status: 'active',
      budget: 52000,
      startDate: daysAgo(19),
      endDate: daysFromNow(48),
      metadata: JSON.stringify({
        type: 'video',
        objective: 'lead_generation',
        aovRange: [100, 400],
        targetAudience: ['security-conscious households', 'parents', 'home automation buyers'],
        aiFeatureCallouts: ['person/package detection', 'anomaly alerts', 'smart perimeter zones'],
        channelMix: ['video', 'retargeting'],
        positioning: 'trusted home security'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aihome-microsoft-001',
      projectId: 'proj-seed-003',
      platform: 'microsoft-ads',
      lob: 'ai_home',
      externalId: 'ms-aihome-001',
      name: 'AI Home - Voice Hub for Families',
      status: 'active',
      budget: 34000,
      startDate: daysAgo(12),
      endDate: daysFromNow(33),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'conversion',
        aovRange: [100, 400],
        targetAudience: ['family planners', 'smart home shoppers', 'home office users'],
        aiFeatureCallouts: ['multi-user voice memory', 'routine automation', 'privacy-first controls'],
        channelMix: ['search'],
        positioning: 'family utility + convenience'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },

    // AI Vision
    {
      id: 'camp-aivision-google-001',
      projectId: 'proj-seed-004',
      platform: 'google-ads',
      lob: 'ai_vision',
      externalId: 'ggl-aivision-001',
      name: 'AI Vision - AR Glasses Image Recognition Launch',
      status: 'active',
      budget: 76000,
      startDate: daysAgo(34),
      endDate: daysFromNow(62),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'high_intent_sales',
        aovRange: [300, 800],
        targetAudience: ['tech innovators', 'creative professionals', 'early adopters'],
        aiFeatureCallouts: ['real-time scene labeling', 'hands-free contextual search', 'live object insights'],
        channelMix: ['search', 'performance max'],
        positioning: 'premium innovation tier'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aivision-tiktok-001',
      projectId: 'proj-seed-004',
      platform: 'tiktok-ads',
      lob: 'ai_vision',
      externalId: 'tt-aivision-001',
      name: 'AI Vision - Creator POV Camera Intelligence',
      status: 'active',
      budget: 47000,
      startDate: daysAgo(17),
      endDate: daysFromNow(41),
      metadata: JSON.stringify({
        type: 'social_video',
        objective: 'engagement',
        aovRange: [300, 800],
        targetAudience: ['content creators', 'video professionals', 'early adopter audiences'],
        aiFeatureCallouts: ['AI autofocus framing', 'scene-aware enhancements', 'instant visual search'],
        channelMix: ['creator partnerships', 'video'],
        positioning: 'pro creator premium'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aivision-linkedin-001',
      projectId: 'proj-seed-004',
      platform: 'linkedin-ads',
      lob: 'ai_vision',
      externalId: 'li-aivision-001',
      name: 'AI Vision - Enterprise Field Ops AR Assist',
      status: 'active',
      budget: 41000,
      startDate: daysAgo(11),
      endDate: daysFromNow(35),
      metadata: JSON.stringify({
        type: 'b2b_social',
        objective: 'mql_generation',
        aovRange: [300, 800],
        targetAudience: ['operations leaders', 'enterprise IT', 'field service teams'],
        aiFeatureCallouts: ['workflow overlays', 'visual remote assist', 'compliance capture'],
        channelMix: ['linkedin lead gen'],
        positioning: 'enterprise innovation'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },

    // AI Productivity
    {
      id: 'camp-aiproduct-linkedin-001',
      projectId: 'proj-seed-005',
      platform: 'linkedin-ads',
      lob: 'ai_productivity',
      externalId: 'li-aiproduct-001',
      name: 'AI Productivity - Meeting Copilot for Teams',
      status: 'active',
      budget: 64000,
      startDate: daysAgo(30),
      endDate: daysFromNow(57),
      metadata: JSON.stringify({
        type: 'b2b_social',
        objective: 'trial_signups',
        aovRange: [100, 350],
        targetAudience: ['professionals', 'remote workers', 'operations managers'],
        aiFeatureCallouts: ['auto meeting summaries', 'action-item extraction', 'CRM sync insights'],
        channelMix: ['linkedin', 'lead gen forms'],
        positioning: 'productivity ROI'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiproduct-google-001',
      projectId: 'proj-seed-005',
      platform: 'google-ads',
      lob: 'ai_productivity',
      externalId: 'ggl-aiproduct-001',
      name: 'AI Productivity - Note-Taking Device Free Trial',
      status: 'active',
      budget: 51000,
      startDate: daysAgo(22),
      endDate: daysFromNow(45),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'trial_to_purchase',
        aovRange: [100, 350],
        targetAudience: ['students', 'knowledge workers', 'remote professionals'],
        aiFeatureCallouts: ['voice-to-structured notes', 'smart action tagging', 'cross-device memory'],
        channelMix: ['search', 'free-trial funnels'],
        positioning: 'everyday productivity'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'camp-aiproduct-microsoft-001',
      projectId: 'proj-seed-005',
      platform: 'microsoft-ads',
      lob: 'ai_productivity',
      externalId: 'ms-aiproduct-001',
      name: 'AI Productivity - Translation Earbuds for Global Teams',
      status: 'active',
      budget: 33000,
      startDate: daysAgo(13),
      endDate: daysFromNow(36),
      metadata: JSON.stringify({
        type: 'search',
        objective: 'conversion',
        aovRange: [100, 350],
        targetAudience: ['international travelers', 'multilingual teams', 'consultants'],
        aiFeatureCallouts: ['real-time translation', 'industry glossary tuning', 'meeting transcript export'],
        channelMix: ['search', 'business intent'],
        positioning: 'business-ready utility'
      }),
      syncedAt: now,
      createdAt: now,
      updatedAt: now
    }
  ]);

  console.log('✅ Seeded 15 AI product line campaigns across 5 LOBs');
};