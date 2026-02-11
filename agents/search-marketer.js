/**
 * SearchMarketer Agent
 * Specialized agent for paid search campaign management and optimization
 */

const name = 'SearchMarketer';
const role = 'search-marketer';
const description = 'Paid search specialist for Google Ads campaign management, keyword optimization, and search strategy';
const model = 'claude-3-5-sonnet-20241022'; // Search strategy requires analytical thinking

const capabilities = [
  'search_campaign_management',
  'keyword_research',
  'ad_copy_optimization', 
  'bid_management',
  'quality_score_optimization',
  'search_strategy',
  'rsa_testing',
  'negative_keyword_management',
  'audience_optimization'
];

const tools = [
  'connectors.google-ads',
  'google_ads_create_campaign',
  'google_ads_create_ad_group',
  'google_ads_create_keyword',
  'google_ads_create_responsive_search_ad',
  'google_ads_get_campaigns',
  'google_ads_get_ad_groups',
  'google_ads_get_keywords',
  'google_ads_pause_campaign',
  'google_ads_update_budget'
];

const systemPrompt = `You are the SearchMarketer agent for Ad Ops Command Center.

Your role is to manage and optimize paid search campaigns:
- Develop search campaign strategies and structures
- Conduct keyword research and match type optimization
- Create and test responsive search ads (RSAs)
- Optimize for Quality Score and ad rank
- Manage bidding strategies and budgets
- Monitor search impression share and competitive positioning
- Implement negative keyword strategies
- Optimize audience targeting for search campaigns

Key metrics you optimize for:
- Quality Score (keyword relevance, ad relevance, landing page experience)
- Search impression share (total, top, absolute top)
- Cost-per-click (CPC) efficiency
- Click-through rate (CTR) improvement
- Conversion rate optimization
- Cost-per-acquisition (CPA) management
- Return on ad spend (ROAS)

Search Campaign Types:
- Brand Defense: Protect brand keywords, high impression share
- Generic Keywords: Product/service terms, balanced reach and efficiency
- Competitor: Strategic competitor keyword bidding
- Dynamic Search Ads: Auto-generated ads from website content
- Performance Max: Google's automated campaign type

Bidding Strategies:
- Target CPA: Focus on cost-per-acquisition goals
- Target ROAS: Optimize for return on ad spend
- Maximize Clicks: Drive traffic within budget constraints
- Maximize Conversions: Get most conversions for budget
- Manual CPC: Full control over individual keyword bids

You provide actionable recommendations in search marketing language and always consider the full search funnel from awareness to conversion.`;

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
 * Analyze search campaign performance
 */
function analyzeSearchPerformance(campaigns, keywords) {
  const analysis = {
    overview: {},
    qualityScoreIssues: [],
    impressionShareOpportunities: [],
    keywordOptimizations: [],
    bidRecommendations: [],
    adCopyInsights: []
  };

  // Overall performance metrics
  const totals = campaigns.reduce((acc, campaign) => ({
    spend: acc.spend + (campaign.metrics?.costMicros / 1000000 || 0),
    impressions: acc.impressions + (campaign.metrics?.impressions || 0),
    clicks: acc.clicks + (campaign.metrics?.clicks || 0),
    conversions: acc.conversions + (campaign.metrics?.conversions || 0)
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  analysis.overview = {
    totalSpend: totals.spend.toFixed(2),
    averageCTR: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%',
    averageCPC: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0.00',
    conversionRate: totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) + '%' : '0%',
    costPerConversion: totals.conversions > 0 ? (totals.spend / totals.conversions).toFixed(2) : 'N/A'
  };

  // Quality Score Analysis
  campaigns.forEach(campaign => {
    const avgQualityScore = campaign.metrics?.qualityScore || 0;
    if (avgQualityScore < 7) {
      analysis.qualityScoreIssues.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        qualityScore: avgQualityScore,
        recommendation: avgQualityScore < 5 
          ? 'Critical: Review ad relevance and landing page experience'
          : 'Improve keyword grouping and ad copy relevance'
      });
    }

    // Search Impression Share opportunities
    const searchIS = campaign.metrics?.searchImpressionShare || 0;
    const budgetLostIS = campaign.metrics?.searchBudgetLostImpressionShare || 0;
    const rankLostIS = campaign.metrics?.searchRankLostImpressionShare || 0;

    if (searchIS < 0.8 && budgetLostIS > 0.1) {
      analysis.impressionShareOpportunities.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        currentIS: (searchIS * 100).toFixed(1) + '%',
        budgetLost: (budgetLostIS * 100).toFixed(1) + '%',
        recommendation: 'Increase budget to capture more impression share'
      });
    }

    if (searchIS < 0.8 && rankLostIS > 0.1) {
      analysis.impressionShareOpportunities.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        currentIS: (searchIS * 100).toFixed(1) + '%',
        rankLost: (rankLostIS * 100).toFixed(1) + '%',
        recommendation: 'Increase bids or improve Quality Score to improve ad rank'
      });
    }
  });

  // Keyword-level analysis
  if (keywords && keywords.length > 0) {
    keywords.forEach(keyword => {
      const ctr = keyword.metrics?.ctr || 0;
      const qualityScore = keyword.metrics?.qualityScore || 0;
      const searchTopIS = keyword.metrics?.searchTopImpressionShare || 0;

      // Low performing keywords
      if (ctr < 2.0 && qualityScore < 7) {
        analysis.keywordOptimizations.push({
          keyword: keyword.criterion?.keyword?.text,
          matchType: keyword.criterion?.keyword?.matchType,
          ctr: ctr.toFixed(2) + '%',
          qualityScore,
          recommendation: 'Consider pausing or improving ad relevance for this keyword'
        });
      }

      // High potential keywords with low impression share
      if (ctr > 4.0 && searchTopIS < 0.5) {
        analysis.keywordOptimizations.push({
          keyword: keyword.criterion?.keyword?.text,
          matchType: keyword.criterion?.keyword?.matchType,
          ctr: ctr.toFixed(2) + '%',
          topIS: (searchTopIS * 100).toFixed(1) + '%',
          recommendation: 'Increase bid - high CTR keyword with low top impression share'
        });
      }
    });
  }

  return analysis;
}

/**
 * Generate keyword expansion suggestions
 */
function generateKeywordSuggestions(baseKeywords, campaignObjective) {
  const suggestions = {
    brandProtection: [],
    genericExpansion: [],
    longTail: [],
    negativeKeywords: []
  };

  baseKeywords.forEach(keyword => {
    const baseKeyword = keyword.toLowerCase();

    // Brand protection variants
    if (campaignObjective === 'brand') {
      suggestions.brandProtection.push(
        `"${baseKeyword}"`, // Exact match
        `"${baseKeyword} reviews"`,
        `"${baseKeyword} pricing"`,
        `"${baseKeyword} alternative"`,
        `"${baseKeyword} vs"`
      );
    }

    // Generic expansion
    if (campaignObjective === 'generic') {
      suggestions.genericExpansion.push(
        `+${baseKeyword} +software`, // Modified broad match
        `+${baseKeyword} +tool`,
        `+${baseKeyword} +platform`,
        `"${baseKeyword} solution"`, // Phrase match
        `${baseKeyword}` // Broad match
      );
    }

    // Long tail variations
    suggestions.longTail.push(
      `best ${baseKeyword} for small business`,
      `${baseKeyword} pricing plans`,
      `how to use ${baseKeyword}`,
      `${baseKeyword} free trial`,
      `${baseKeyword} demo`
    );

    // Negative keyword suggestions
    suggestions.negativeKeywords.push(
      'free',
      'cheap',
      'job',
      'jobs',
      'career',
      'salary',
      'course',
      'tutorial',
      'youtube'
    );
  });

  return suggestions;
}

/**
 * Create responsive search ad variations
 */
function generateRSAVariations(product, valueProps, targetAudience) {
  return {
    headlines: [
      // Brand + Product (required)
      `${product} - AI-Powered Solution`,
      `Get ${product} Today`,
      `${product} for ${targetAudience}`,
      
      // Value propositions
      ...valueProps.slice(0, 6).map(prop => prop.length <= 30 ? prop : prop.substring(0, 27) + '...'),
      
      // Call to action focused
      'Start Your Free Trial',
      'Book a Demo Today',
      'Get Started in Minutes',
      
      // Feature/benefit focused
      'Streamline Your Workflow', 
      'Boost Productivity 10x',
      'Automate Repetitive Tasks',
      
      // Social proof/urgency
      'Join 10,000+ Users',
      'Limited Time Offer'
    ].slice(0, 15), // Max 15 headlines

    descriptions: [
      // Primary description with value prop
      `Transform your ${targetAudience.toLowerCase()} workflow with ${product}. Advanced AI automation, intuitive interface, and enterprise-grade security.`,
      
      // Feature-focused
      `Easy setup, powerful automation, and 24/7 support. Try ${product} free for 14 days. No credit card required.`,
      
      // Benefit-focused  
      `Save 10+ hours per week with intelligent automation. Seamless integrations, real-time analytics, and expert support.`,
      
      // Social proof + CTA
      `Trusted by leading companies worldwide. Start your free trial and see why ${product} is the #1 choice for ${targetAudience.toLowerCase()}.`
    ]
  };
}

/**
 * Recommend bidding strategy based on campaign goals
 */
function recommendBiddingStrategy(campaignData, performanceHistory) {
  const recommendations = [];
  
  const {
    objective,
    budget,
    targetCPA,
    targetROAS,
    currentStrategy,
    conversionData
  } = campaignData;

  // Analyze conversion volume for strategy eligibility
  const monthlyConversions = conversionData?.monthlyConversions || 0;
  const conversionRate = conversionData?.conversionRate || 0;

  if (objective === 'brand_awareness' || objective === 'traffic') {
    recommendations.push({
      strategy: 'MAXIMIZE_CLICKS',
      reason: 'Traffic-focused objective - maximize clicks within budget',
      setup: {
        maxCpcLimit: budget * 0.1, // 10% of daily budget
        targetSearchNetwork: true,
        targetDisplayNetwork: false
      }
    });
  } else if (objective === 'conversions' && monthlyConversions >= 30) {
    if (targetCPA) {
      recommendations.push({
        strategy: 'TARGET_CPA',
        reason: 'Sufficient conversion data for CPA optimization',
        setup: {
          targetCpaMicros: targetCPA * 1000000,
          bidCeilingMicros: targetCPA * 3 * 1000000 // 3x target as ceiling
        }
      });
    } else if (targetROAS) {
      recommendations.push({
        strategy: 'TARGET_ROAS',
        reason: 'ROAS target specified with sufficient conversion volume',
        setup: {
          targetRoas: targetROAS,
          bidCeilingMicros: (budget / targetROAS) * 1000000
        }
      });
    } else {
      recommendations.push({
        strategy: 'MAXIMIZE_CONVERSIONS',
        reason: 'Good conversion volume, let Google optimize for max conversions',
        setup: {
          targetCpaMicros: null // Let Google find optimal CPA
        }
      });
    }
  } else if (objective === 'conversions' && monthlyConversions < 30) {
    recommendations.push({
      strategy: 'MAXIMIZE_CLICKS',
      reason: 'Insufficient conversion data - focus on driving traffic first',
      setup: {
        maxCpcLimit: budget * 0.15,
        note: 'Switch to Target CPA after reaching 30+ conversions/month'
      }
    });
  }

  // Portfolio strategy for multiple campaigns
  if (campaignData.campaignCount > 5) {
    recommendations.push({
      strategy: 'PORTFOLIO_BID_STRATEGY',
      reason: 'Multiple campaigns - use shared bidding strategy for efficiency',
      setup: {
        type: targetCPA ? 'TARGET_CPA' : 'TARGET_ROAS',
        targetCpaMicros: targetCPA * 1000000,
        targetRoas: targetROAS
      }
    });
  }

  return recommendations;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();

  // Campaign management queries
  if (q.includes('create campaign') || q.includes('new campaign')) {
    if (context.campaignDetails) {
      return {
        action: 'create_campaign',
        tool: 'google_ads_create_campaign',
        params: context.campaignDetails,
        message: 'I can create your search campaign. Please provide campaign name, budget, and target keywords.'
      };
    }
    return {
      message: 'I can help create a new search campaign. What\'s the campaign objective - brand defense, generic keywords, or competitors?',
      nextSteps: ['Specify campaign name', 'Set daily budget', 'Choose bidding strategy', 'Provide target keywords']
    };
  }

  // Keyword research queries
  if (q.includes('keyword') && (q.includes('research') || q.includes('suggest'))) {
    if (context.baseKeywords) {
      return generateKeywordSuggestions(context.baseKeywords, context.campaignObjective);
    }
    return {
      message: 'I can help with keyword research. What\'s your main product/service and target audience?',
      action: 'keyword_research'
    };
  }

  // Performance analysis
  if (q.includes('performance') || q.includes('optimize') || q.includes('quality score')) {
    if (context.campaigns) {
      return analyzeSearchPerformance(context.campaigns, context.keywords);
    }
    return {
      message: 'I can analyze search campaign performance. Let me fetch your campaign data.',
      action: 'fetch_campaign_data'
    };
  }

  // RSA creation
  if (q.includes('responsive search ad') || q.includes('rsa') || q.includes('ad copy')) {
    if (context.product && context.valueProps) {
      return generateRSAVariations(context.product, context.valueProps, context.targetAudience || 'Business Users');
    }
    return {
      message: 'I can create responsive search ad variations. What\'s your product and key value propositions?',
      action: 'create_rsa'
    };
  }

  // Bidding strategy
  if (q.includes('bid') && (q.includes('strategy') || q.includes('optimize'))) {
    if (context.campaignData) {
      return recommendBiddingStrategy(context.campaignData, context.performanceHistory);
    }
    return {
      message: 'I can recommend bidding strategies. What\'s your campaign objective and current performance?',
      action: 'bidding_strategy'
    };
  }

  // Impression share analysis
  if (q.includes('impression share') || q.includes('search impression')) {
    return {
      message: 'I can analyze search impression share opportunities. This helps identify budget and bid optimization opportunities.',
      metrics: ['Search IS', 'Search Top IS', 'Search Absolute Top IS', 'Budget Lost IS', 'Rank Lost IS'],
      action: 'impression_share_analysis'
    };
  }

  return {
    message: 'I specialize in search marketing. I can help with campaign creation, keyword research, ad copy optimization, bidding strategies, and performance analysis.',
    capabilities: capabilities
  };
}

/**
 * Generate search campaign recommendations
 */
function generateCampaignRecommendations(campaignType, budget, keywords) {
  const recommendations = {
    structure: {},
    bidding: {},
    targeting: {},
    adGroups: []
  };

  // Campaign structure recommendations
  recommendations.structure = {
    campaignType: 'SEARCH',
    networkSettings: {
      googleSearch: true,
      searchPartners: campaignType === 'brand' ? false : true, // Brand campaigns avoid search partners
      displayNetwork: false
    },
    location: 'Based on business locations',
    language: 'Based on target market',
    adSchedule: campaignType === 'brand' ? 'Always on' : 'Business hours + high-converting periods'
  };

  // Bidding recommendations based on campaign type
  if (campaignType === 'brand') {
    recommendations.bidding = {
      strategy: 'TARGET_CPA',
      reason: 'Brand campaigns typically have higher conversion rates',
      targetCPA: budget * 0.05, // Lower CPA expected for brand
      maxCPC: budget * 0.2
    };
  } else if (campaignType === 'generic') {
    recommendations.bidding = {
      strategy: 'MAXIMIZE_CLICKS',
      reason: 'Build traffic and conversion data first, then switch to Target CPA',
      maxCPC: budget * 0.1,
      graduationPlan: 'Switch to Target CPA after 30+ conversions'
    };
  }

  // Ad group recommendations based on keyword themes
  const keywordGroups = groupKeywordsByTheme(keywords);
  recommendations.adGroups = keywordGroups.map(group => ({
    name: group.theme,
    keywords: group.keywords,
    adCopyFocus: group.adCopyTips,
    landingPageFocus: group.landingPageTips
  }));

  return recommendations;
}

/**
 * Group keywords by theme for ad group structure
 */
function groupKeywordsByTheme(keywords) {
  // Simplified keyword grouping logic
  const groups = [];
  
  keywords.forEach(keyword => {
    const kw = keyword.toLowerCase();
    
    if (kw.includes('pricing') || kw.includes('cost') || kw.includes('price')) {
      addToGroup(groups, 'Pricing', keyword, {
        adCopyTips: 'Highlight transparent pricing, free trial, ROI',
        landingPageTips: 'Direct to pricing page with calculator'
      });
    } else if (kw.includes('review') || kw.includes('comparison') || kw.includes('vs')) {
      addToGroup(groups, 'Reviews & Comparisons', keyword, {
        adCopyTips: 'Use social proof, ratings, competitive advantages',
        landingPageTips: 'Comparison page or testimonial-heavy page'
      });
    } else if (kw.includes('demo') || kw.includes('trial') || kw.includes('free')) {
      addToGroup(groups, 'Demo & Trial', keyword, {
        adCopyTips: 'Emphasize no commitment, instant access, value preview',
        landingPageTips: 'Demo request or trial signup page'
      });
    } else {
      addToGroup(groups, 'Core Product', keyword, {
        adCopyTips: 'Focus on main value props and differentiators',
        landingPageTips: 'Homepage or main product page'
      });
    }
  });

  return groups;
}

function addToGroup(groups, theme, keyword, tips) {
  let group = groups.find(g => g.theme === theme);
  if (!group) {
    group = { theme, keywords: [], ...tips };
    groups.push(group);
  }
  group.keywords.push(keyword);
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
  analyzeSearchPerformance,
  generateKeywordSuggestions,
  generateRSAVariations,
  recommendBiddingStrategy,
  generateCampaignRecommendations,
  processQuery
};