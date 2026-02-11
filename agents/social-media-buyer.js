/**
 * SocialMediaBuyer Agent
 * Specialized agent for paid social campaign management and audience optimization
 */

const name = 'SocialMediaBuyer';
const role = 'social-media-buyer';
const description = 'Paid social specialist for Meta Ads campaign management, audience targeting, and social media strategy';
const model = 'claude-3-5-sonnet-20241022'; // Social strategy requires creative and analytical thinking

const capabilities = [
  'social_campaign_management',
  'audience_targeting',
  'creative_optimization',
  'funnel_management',
  'lookalike_creation',
  'custom_audience_building',
  'social_commerce',
  'video_ads_optimization',
  'cross_platform_strategy',
  'social_attribution'
];

const tools = [
  'connectors.meta-ads',
  'meta_ads_create_campaign',
  'meta_ads_create_ad_set',
  'meta_ads_create_ad',
  'meta_ads_get_campaigns',
  'meta_ads_get_ad_sets',
  'meta_ads_get_insights',
  'meta_ads_update_status'
];

const systemPrompt = `You are the SocialMediaBuyer agent for Ad Ops Command Center.

Your role is to manage and optimize paid social campaigns:
- Develop comprehensive social media advertising strategies
- Build and optimize custom audiences and lookalikes
- Create full-funnel campaign architectures
- Optimize creative testing and rotation strategies
- Manage cross-platform social advertising (Facebook, Instagram, Messenger, Audience Network)
- Implement advanced targeting including interests, behaviors, and life events
- Optimize for social commerce and conversion tracking
- Monitor social-specific metrics like engagement, reach, and frequency

Key metrics you optimize for:
- Cost per thousand impressions (CPM) efficiency
- Relevance Score and Quality Ranking
- Engagement Rate (likes, comments, shares, saves)
- Click-through Rate (CTR) and unique CTR
- Cost per Click (CPC) optimization
- Conversion rates by funnel stage
- Return on ad spend (ROAS) across social platforms
- Frequency management and audience fatigue prevention
- Video completion rates and engagement

Campaign Objectives:
- OUTCOME_AWARENESS: Brand awareness and reach campaigns
- OUTCOME_TRAFFIC: Drive traffic to website or app
- OUTCOME_ENGAGEMENT: Increase post engagement and social interactions
- OUTCOME_LEADS: Lead generation and email capture
- OUTCOME_APP_PROMOTION: App installs and engagement
- OUTCOME_SALES: E-commerce sales and conversions

Audience Strategy:
- Custom Audiences: Website visitors, customer lists, app users, engagement
- Lookalike Audiences: Based on best customers, converters, high-value users
- Interest Targeting: Detailed interests, behaviors, and life events
- Demographic Targeting: Age, gender, education, relationship status
- Geographic Targeting: Countries, regions, cities, radius-based
- Placement Optimization: Facebook feed, Instagram Stories, Reels, Messenger

Creative Strategy:
- Single Image Ads: High-impact visuals with compelling copy
- Carousel Ads: Multiple products or features showcase
- Video Ads: Engaging storytelling and product demonstrations
- Collection Ads: Immersive mobile shopping experiences
- Dynamic Ads: Automated product retargeting
- Lead Ads: Native lead capture without leaving platform

You provide strategic social media advertising guidance with focus on audience insights, creative performance, and full-funnel optimization.`;

/**
 * Get agent info
 */
function getInfo() {
  return {
    name,
    role,
    description,
    model,
    capabilities,
    tools
  };
}

/**
 * Analyze social campaign performance
 */
function analyzeSocialPerformance(campaigns, insights) {
  const analysis = {
    overview: {},
    audienceInsights: [],
    creativePerformance: [],
    funnelAnalysis: [],
    frequencyOptimization: [],
    recommendations: []
  };

  // Overall performance metrics
  const totals = campaigns.reduce((acc, campaign) => {
    const campaignInsights = campaign.insights || {};
    return {
      spend: acc.spend + parseFloat(campaignInsights.spend || 0),
      impressions: acc.impressions + parseInt(campaignInsights.impressions || 0),
      reach: acc.reach + parseInt(campaignInsights.reach || 0),
      clicks: acc.clicks + parseInt(campaignInsights.clicks || 0),
      conversions: acc.conversions + (campaignInsights.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0)
    };
  }, { spend: 0, impressions: 0, reach: 0, clicks: 0, conversions: 0 });

  const averageFrequency = totals.reach > 0 ? (totals.impressions / totals.reach).toFixed(2) : 0;
  
  analysis.overview = {
    totalSpend: `$${totals.spend.toLocaleString()}`,
    totalReach: totals.reach.toLocaleString(),
    averageFrequency: averageFrequency,
    overallCTR: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%',
    averageCPM: totals.impressions > 0 ? `$${((totals.spend / totals.impressions) * 1000).toFixed(2)}` : '$0.00',
    conversionRate: totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) + '%' : '0%',
    roas: totals.spend > 0 ? (totals.conversions * 300 / totals.spend).toFixed(2) : 'N/A' // Assuming $300 avg order value
  };

  // Audience performance analysis
  campaigns.forEach(campaign => {
    const insights = campaign.insights || {};
    const frequency = parseFloat(insights.frequency || 0);
    const cpm = parseFloat(insights.cpm || 0);
    const ctr = parseFloat(insights.ctr || 0);

    // High frequency alerts (audience fatigue)
    if (frequency > 4.0) {
      analysis.frequencyOptimization.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        frequency: frequency.toFixed(2),
        recommendation: frequency > 6 
          ? 'Critical: Audience fatigue detected. Expand targeting or refresh creative'
          : 'Warning: High frequency. Consider expanding audience or creative rotation'
      });
    }

    // Cost efficiency analysis
    if (cpm > 15.0 && ctr < 1.5) {
      analysis.audienceInsights.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        cpm: `$${cpm.toFixed(2)}`,
        ctr: `${ctr.toFixed(2)}%`,
        issue: 'High CPM with low engagement',
        recommendation: 'Refine audience targeting or improve creative relevance'
      });
    }

    // High-performing audience identification
    if (ctr > 2.5 && cpm < 12.0) {
      analysis.audienceInsights.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        cpm: `$${cpm.toFixed(2)}`,
        ctr: `${ctr.toFixed(2)}%`,
        performance: 'Excellent',
        recommendation: 'Scale this audience with lookalike expansion'
      });
    }

    // Engagement analysis
    const engagement = insights.actions?.reduce((sum, action) => {
      if (['like', 'comment', 'share', 'post_engagement'].includes(action.action_type)) {
        return sum + parseInt(action.value || 0);
      }
      return sum;
    }, 0) || 0;

    const engagementRate = insights.reach > 0 ? (engagement / parseInt(insights.reach)) * 100 : 0;
    
    if (engagementRate > 0) {
      analysis.creativePerformance.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        engagementRate: `${engagementRate.toFixed(2)}%`,
        totalEngagement: engagement.toLocaleString(),
        status: engagementRate > 5 ? 'High' : engagementRate > 2 ? 'Good' : 'Low'
      });
    }
  });

  // Funnel analysis by objective
  const objectivePerformance = campaigns.reduce((acc, campaign) => {
    const objective = campaign.objective;
    if (!acc[objective]) {
      acc[objective] = { campaigns: 0, spend: 0, results: 0 };
    }
    
    acc[objective].campaigns += 1;
    acc[objective].spend += parseFloat(campaign.insights?.spend || 0);
    
    // Count primary results based on objective
    if (objective === 'OUTCOME_AWARENESS') {
      acc[objective].results += parseInt(campaign.insights?.reach || 0);
    } else if (objective === 'OUTCOME_TRAFFIC') {
      acc[objective].results += parseInt(campaign.insights?.clicks || 0);
    } else if (objective === 'OUTCOME_SALES') {
      acc[objective].results += parseInt(campaign.insights?.actions?.find(a => 
        a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0);
    }
    
    return acc;
  }, {});

  analysis.funnelAnalysis = Object.entries(objectivePerformance).map(([objective, data]) => ({
    objective,
    campaigns: data.campaigns,
    spend: `$${data.spend.toFixed(2)}`,
    results: data.results.toLocaleString(),
    efficiency: data.spend > 0 ? (data.results / data.spend).toFixed(2) : '0',
    metric: getObjectiveMetric(objective)
  }));

  return analysis;
}

/**
 * Generate audience targeting recommendations
 */
function generateAudienceStrategy(businessType, targetMarket, campaignObjective) {
  const strategy = {
    primaryAudiences: [],
    testingAudiences: [],
    lookalikes: [],
    exclusions: [],
    retargeting: []
  };

  // Core audience based on business type
  if (businessType === 'saas' || businessType === 'b2b') {
    strategy.primaryAudiences.push({
      name: 'Business Decision Makers',
      targeting: {
        interests: ['Business management', 'Entrepreneurship', 'Small business'],
        behaviors: ['Business travelers', 'Technology early adopters'],
        jobTitles: ['CEO', 'Founder', 'Director', 'Manager'],
        demographics: { age_min: 28, age_max: 55 }
      }
    });

    strategy.primaryAudiences.push({
      name: 'Tech-Savvy Professionals',
      targeting: {
        interests: ['Technology', 'Software', 'Productivity software'],
        behaviors: ['Technology late adopters', 'LinkedIn users'],
        demographics: { age_min: 25, age_max: 50 }
      }
    });
  } else if (businessType === 'ecommerce' || businessType === 'retail') {
    strategy.primaryAudiences.push({
      name: 'Online Shoppers',
      targeting: {
        interests: ['Online shopping', 'Retail shopping'],
        behaviors: ['Online shoppers', 'Engaged shoppers'],
        demographics: { age_min: 21, age_max: 55, genders: [1, 2] }
      }
    });

    strategy.primaryAudiences.push({
      name: 'Brand Enthusiasts',
      targeting: {
        interests: ['Fashion', 'Luxury goods', 'Premium brands'],
        behaviors: ['Premium brand affinity', 'Frequent travelers'],
        demographics: { age_min: 25, age_max: 45 }
      }
    });
  }

  // Testing audiences for expansion
  strategy.testingAudiences = [
    {
      name: 'Competitor Interest',
      targeting: {
        interests: ['Specific competitor brands'],
        note: 'Test competitor audience response'
      }
    },
    {
      name: 'Broader Category',
      targeting: {
        interests: ['Broader industry categories'],
        note: 'Expand beyond core interests'
      }
    }
  ];

  // Lookalike recommendations
  strategy.lookalikes = [
    {
      source: 'Website purchasers (last 90 days)',
      percentage: '1%',
      reason: 'Highest value customer base'
    },
    {
      source: 'High-value email subscribers',
      percentage: '2%',
      reason: 'Engaged audience with known intent'
    },
    {
      source: 'Video viewers (75% completion)',
      percentage: '3%',
      reason: 'Engaged content consumers'
    }
  ];

  // Retargeting ladder
  if (campaignObjective === 'OUTCOME_SALES') {
    strategy.retargeting = [
      {
        audience: 'Website visitors - Last 7 days',
        message: 'Direct response with strong CTA',
        budget: '40% of retargeting budget'
      },
      {
        audience: 'Add to cart - Last 14 days',
        message: 'Incentive-based (discount/urgency)',
        budget: '35% of retargeting budget'
      },
      {
        audience: 'Product viewers - Last 30 days',
        message: 'Social proof and reviews focus',
        budget: '25% of retargeting budget'
      }
    ];
  }

  // Standard exclusions
  strategy.exclusions = [
    'Recent customers (last 30 days)',
    'Current subscribers/users',
    'Employees and internal traffic',
    'Low-value converters (if applicable)'
  ];

  return strategy;
}

/**
 * Create creative testing matrix
 */
function generateCreativeTestingMatrix(campaignObjective, targetAudience, adFormats) {
  const testingMatrix = {
    variables: [],
    combinations: [],
    successMetrics: [],
    testDuration: '7-14 days',
    confidenceLevel: '95%'
  };

  // Define testing variables based on objective
  if (campaignObjective === 'OUTCOME_AWARENESS') {
    testingMatrix.variables = [
      {
        element: 'Headline Style',
        variations: ['Question-based', 'Benefit-focused', 'Urgency-driven']
      },
      {
        element: 'Visual Type',
        variations: ['Product shot', 'Lifestyle image', 'Illustration']
      },
      {
        element: 'Color Scheme',
        variations: ['Brand colors', 'High contrast', 'Trending colors']
      }
    ];
    testingMatrix.successMetrics = ['CPM', 'CTR', 'Engagement Rate', 'Reach'];
  } else if (campaignObjective === 'OUTCOME_SALES') {
    testingMatrix.variables = [
      {
        element: 'Value Proposition',
        variations: ['Price/discount focus', 'Feature benefits', 'Social proof']
      },
      {
        element: 'Call-to-Action',
        variations: ['Shop Now', 'Learn More', 'Get Offer']
      },
      {
        element: 'Creative Format',
        variations: ['Single image', 'Carousel', 'Video']
      }
    ];
    testingMatrix.successMetrics = ['CPC', 'Conversion Rate', 'ROAS', 'Cost per Purchase'];
  }

  // Generate test combinations (limited to manageable number)
  const maxCombinations = 6; // Budget-friendly testing
  testingMatrix.combinations = generateTestCombinations(testingMatrix.variables, maxCombinations);

  return testingMatrix;
}

/**
 * Analyze video ad performance
 */
function analyzeVideoPerformance(videoAds) {
  const analysis = {
    overview: {},
    engagementFunnel: [],
    optimizationTips: []
  };

  if (!videoAds || videoAds.length === 0) {
    return { message: 'No video ad data available' };
  }

  const totals = videoAds.reduce((acc, ad) => {
    const insights = ad.insights || {};
    return {
      views: acc.views + parseInt(insights.video_play_actions?.[0]?.value || 0),
      p25: acc.p25 + parseInt(insights.video_p25_watched_actions?.[0]?.value || 0),
      p50: acc.p50 + parseInt(insights.video_p50_watched_actions?.[0]?.value || 0),
      p75: acc.p75 + parseInt(insights.video_p75_watched_actions?.[0]?.value || 0),
      p100: acc.p100 + parseInt(insights.video_p100_watched_actions?.[0]?.value || 0),
      spend: acc.spend + parseFloat(insights.spend || 0)
    };
  }, { views: 0, p25: 0, p50: 0, p75: 0, p100: 0, spend: 0 });

  analysis.overview = {
    totalViews: totals.views.toLocaleString(),
    completionRate: totals.views > 0 ? ((totals.p100 / totals.views) * 100).toFixed(1) + '%' : '0%',
    avgViewTime: totals.views > 0 ? calculateAverageViewTime(totals) : '0s',
    costPerView: totals.views > 0 ? `$${(totals.spend / totals.views).toFixed(3)}` : '$0.00'
  };

  // Engagement funnel
  analysis.engagementFunnel = [
    { stage: 'Started (0%)', count: totals.views, percentage: '100%' },
    { stage: '25% Watched', count: totals.p25, percentage: totals.views > 0 ? ((totals.p25 / totals.views) * 100).toFixed(1) + '%' : '0%' },
    { stage: '50% Watched', count: totals.p50, percentage: totals.views > 0 ? ((totals.p50 / totals.views) * 100).toFixed(1) + '%' : '0%' },
    { stage: '75% Watched', count: totals.p75, percentage: totals.views > 0 ? ((totals.p75 / totals.views) * 100).toFixed(1) + '%' : '0%' },
    { stage: '100% Watched', count: totals.p100, percentage: totals.views > 0 ? ((totals.p100 / totals.views) * 100).toFixed(1) + '%' : '0%' }
  ];

  // Optimization recommendations
  const p25Rate = totals.views > 0 ? (totals.p25 / totals.views) : 0;
  const p50Rate = totals.views > 0 ? (totals.p50 / totals.views) : 0;
  const completionRate = totals.views > 0 ? (totals.p100 / totals.views) : 0;

  if (p25Rate < 0.7) {
    analysis.optimizationTips.push({
      issue: 'High early drop-off',
      recommendation: 'Improve hook in first 3 seconds - use pattern interrupt or compelling opening'
    });
  }

  if (p50Rate < 0.4) {
    analysis.optimizationTips.push({
      issue: 'Mid-video drop-off',
      recommendation: 'Add engaging elements mid-video - text overlays, scene changes, or tension'
    });
  }

  if (completionRate < 0.15) {
    analysis.optimizationTips.push({
      issue: 'Low completion rate',
      recommendation: 'Consider shortening video or adding stronger CTA earlier'
    });
  }

  return analysis;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();

  // Campaign creation queries
  if (q.includes('create campaign') || q.includes('new campaign')) {
    if (context.campaignDetails) {
      return {
        action: 'create_campaign',
        tool: 'meta_ads_create_campaign',
        params: context.campaignDetails,
        message: 'I can create your social campaign. Please specify the objective and target audience.'
      };
    }
    return {
      message: 'I can help create a social media campaign. What\'s the main objective - awareness, traffic, engagement, leads, or sales?',
      objectives: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_SALES'],
      nextSteps: ['Choose campaign objective', 'Define target audience', 'Set budget and schedule', 'Plan creative assets']
    };
  }

  // Audience strategy queries
  if (q.includes('audience') && (q.includes('strategy') || q.includes('targeting'))) {
    if (context.businessType && context.targetMarket) {
      return generateAudienceStrategy(context.businessType, context.targetMarket, context.campaignObjective);
    }
    return {
      message: 'I can develop an audience targeting strategy. What type of business and target market?',
      action: 'audience_strategy'
    };
  }

  // Performance analysis
  if (q.includes('performance') || q.includes('analyze') || q.includes('insights')) {
    if (context.campaigns) {
      return analyzeSocialPerformance(context.campaigns, context.insights);
    }
    return {
      message: 'I can analyze social campaign performance including audience insights and creative performance.',
      action: 'fetch_campaign_data'
    };
  }

  // Creative testing queries
  if (q.includes('creative') && (q.includes('test') || q.includes('optimize'))) {
    if (context.campaignObjective && context.targetAudience) {
      return generateCreativeTestingMatrix(context.campaignObjective, context.targetAudience, context.adFormats);
    }
    return {
      message: 'I can set up creative testing strategies. What\'s your campaign objective and target audience?',
      action: 'creative_testing'
    };
  }

  // Video performance queries
  if (q.includes('video') && (q.includes('performance') || q.includes('analyze'))) {
    if (context.videoAds) {
      return analyzeVideoPerformance(context.videoAds);
    }
    return {
      message: 'I can analyze video ad performance including completion rates and engagement funnels.',
      action: 'video_analysis'
    };
  }

  // Frequency and audience fatigue
  if (q.includes('frequency') || q.includes('fatigue')) {
    return {
      message: 'I can help optimize frequency and prevent audience fatigue. Key metrics to monitor:',
      metrics: ['Frequency (keep under 4.0)', 'CTR decline over time', 'CPM increases', 'Relevance score drops'],
      solutions: ['Expand audience size', 'Refresh creative', 'Adjust bid strategy', 'Add creative rotation']
    };
  }

  // Lookalike audience creation
  if (q.includes('lookalike') || q.includes('similar audience')) {
    return {
      message: 'I can help create lookalike audiences for scale. Best practices:',
      sources: ['Website purchasers (1%)', 'Email subscribers (2%)', 'High-value customers (1%)', 'Engaged video viewers (3%)'],
      action: 'lookalike_strategy'
    };
  }

  return {
    message: 'I specialize in social media advertising. I can help with campaign creation, audience targeting, creative optimization, and performance analysis.',
    capabilities: capabilities
  };
}

/**
 * Helper functions
 */
function getObjectiveMetric(objective) {
  const metrics = {
    'OUTCOME_AWARENESS': 'Reach per $',
    'OUTCOME_TRAFFIC': 'Clicks per $',
    'OUTCOME_ENGAGEMENT': 'Engagement per $',
    'OUTCOME_LEADS': 'Leads per $',
    'OUTCOME_SALES': 'Purchases per $'
  };
  return metrics[objective] || 'Results per $';
}

function calculateAverageViewTime(totals) {
  // Simplified calculation - assumes uniform distribution
  const weightedTime = (totals.p25 * 0.25) + (totals.p50 * 0.5) + (totals.p75 * 0.75) + (totals.p100 * 1.0);
  const avgPercentage = weightedTime / totals.views;
  return `${(avgPercentage * 30).toFixed(1)}s`; // Assuming 30s average video length
}

function generateTestCombinations(variables, maxCombinations) {
  const combinations = [];
  const variableNames = variables.map(v => v.element);
  
  // Generate simple combinations for testing (not full factorial to keep manageable)
  for (let i = 0; i < Math.min(maxCombinations, 8); i++) {
    const combination = {};
    variables.forEach((variable, index) => {
      const varIndex = (i + index) % variable.variations.length;
      combination[variable.element] = variable.variations[varIndex];
    });
    combinations.push({
      id: `Test_${i + 1}`,
      ...combination
    });
  }
  
  return combinations;
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  getInfo,
  analyzeSocialPerformance,
  generateAudienceStrategy,
  generateCreativeTestingMatrix,
  analyzeVideoPerformance,
  processQuery
};