/**
 * Google Ads Connector
 * Integration with Google Ads API for paid search campaign management
 * 
 * Official API: https://googleads.googleapis.com/v19/
 * 
 * Ad Ops Use Cases:
 * - Search, Display, and Video campaign management
 * - Keyword research and optimization
 * - Responsive Search Ad creation and testing
 * - Bid management and automated bidding
 * - Performance monitoring and reporting
 */

const fs = require('fs');
const path = require('path');

const name = 'Google Ads';
const shortName = 'Google Ads';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
      }
    });
  }
  
  return env;
}

let env = loadEnv();

// Configuration
const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN || null;
const clientId = env.GOOGLE_ADS_CLIENT_ID || null;
const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET || null;
const refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN || null;
const customerId = env.GOOGLE_ADS_CUSTOMER_ID || null;
const loginCustomerId = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || null;

const hasGoogleAds = !!(developerToken && clientId && clientSecret && refreshToken && customerId);

// OAuth configuration
const oauth = {
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/adwords'],
  apiEndpoint: 'https://googleads.googleapis.com/v19',
  connected: hasGoogleAds,
  developerToken: developerToken ? 'D4Bqh9JbV0XVuW3YZwFT0A' : null
};

// Tool definitions for MCP integration
const tools = [
  {
    name: 'google_ads_create_campaign',
    description: 'Create a new Google Ads campaign (Search/Display/Video)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        budget_micros: { type: 'number', description: 'Daily budget in micros (e.g., 50000000 = $50)' },
        campaign_type: { 
          type: 'string', 
          enum: ['SEARCH', 'DISPLAY', 'VIDEO', 'SMART', 'PERFORMANCE_MAX'],
          description: 'Campaign type' 
        },
        bidding_strategy: {
          type: 'string',
          enum: ['TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CLICKS', 'MAXIMIZE_CONVERSIONS', 'MANUAL_CPC'],
          description: 'Bidding strategy'
        },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' }
      },
      required: ['name', 'budget_micros', 'campaign_type']
    }
  },
  {
    name: 'google_ads_create_ad_group',
    description: 'Create an ad group within a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign resource name' },
        name: { type: 'string', description: 'Ad group name' },
        cpc_bid_micros: { type: 'number', description: 'CPC bid in micros' },
        ad_group_type: {
          type: 'string',
          enum: ['SEARCH_STANDARD', 'DISPLAY_STANDARD', 'SHOPPING_PRODUCT_ADS', 'VIDEO_BUMPER'],
          description: 'Ad group type'
        }
      },
      required: ['campaign_id', 'name']
    }
  },
  {
    name: 'google_ads_create_keyword',
    description: 'Add keywords to an ad group',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: { type: 'string', description: 'Ad group resource name' },
        keyword_text: { type: 'string', description: 'Keyword text' },
        match_type: {
          type: 'string',
          enum: ['EXACT', 'PHRASE', 'BROAD'],
          description: 'Keyword match type'
        },
        bid_micros: { type: 'number', description: 'Keyword bid in micros (optional)' }
      },
      required: ['ad_group_id', 'keyword_text', 'match_type']
    }
  },
  {
    name: 'google_ads_create_responsive_search_ad',
    description: 'Create a Responsive Search Ad',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: { type: 'string', description: 'Ad group resource name' },
        headlines: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 15,
          description: 'Headlines (3-15 required)'
        },
        descriptions: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4,
          description: 'Descriptions (2-4 required)'
        },
        final_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Final URLs'
        },
        path1: { type: 'string', description: 'Path 1 (optional)' },
        path2: { type: 'string', description: 'Path 2 (optional)' }
      },
      required: ['ad_group_id', 'headlines', 'descriptions', 'final_urls']
    }
  },
  {
    name: 'google_ads_get_campaigns',
    description: 'List campaigns with performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'],
          description: 'Date range for metrics'
        },
        status_filter: {
          type: 'string',
          enum: ['ENABLED', 'PAUSED', 'REMOVED'],
          description: 'Filter by campaign status'
        }
      }
    }
  },
  {
    name: 'google_ads_get_ad_groups',
    description: 'List ad groups for a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign resource name' },
        date_range: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS'],
          description: 'Date range for metrics'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'google_ads_get_keywords',
    description: 'List keywords for an ad group',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: { type: 'string', description: 'Ad group resource name' },
        date_range: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS'],
          description: 'Date range for metrics'
        }
      },
      required: ['ad_group_id']
    }
  },
  {
    name: 'google_ads_pause_campaign',
    description: 'Pause or enable a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign resource name' },
        action: {
          type: 'string',
          enum: ['PAUSE', 'ENABLE'],
          description: 'Action to take'
        }
      },
      required: ['campaign_id', 'action']
    }
  },
  {
    name: 'google_ads_update_budget',
    description: 'Update campaign budget',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign resource name' },
        budget_micros: { type: 'number', description: 'New daily budget in micros' }
      },
      required: ['campaign_id', 'budget_micros']
    }
  }
];

// Mock data for sandbox mode
const MOCK_CAMPAIGNS = [
  {
    resourceName: 'customers/1234567890/campaigns/111222333',
    id: '111222333',
    name: 'Search - Brand Defense Q1 2026',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    advertisingChannelSubType: 'SEARCH_BRAND',
    campaignBudget: {
      amountMicros: 100000000, // $100
      deliveryMethod: 'STANDARD'
    },
    bidding_strategy: 'TARGET_CPA',
    targetCpa: { targetCpaMicros: 25000000 }, // $25
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    // Performance metrics
    metrics: {
      impressions: 2500000,
      clicks: 125000,
      conversions: 2500,
      costMicros: 87500000000, // $87,500
      ctr: 5.0,
      averageCpc: 700000, // $0.70
      conversionRate: 2.0,
      costPerConversion: 35000000, // $35
      searchImpressionShare: 0.85,
      searchBudgetLostImpressionShare: 0.10,
      searchRankLostImpressionShare: 0.05,
      qualityScore: 8.2
    }
  },
  {
    resourceName: 'customers/1234567890/campaigns/111222334',
    id: '111222334',
    name: 'Search - Product Categories',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    advertisingChannelSubType: 'SEARCH_DYNAMIC_ADS',
    campaignBudget: {
      amountMicros: 250000000, // $250
      deliveryMethod: 'STANDARD'
    },
    bidding_strategy: 'TARGET_ROAS',
    targetRoas: { targetRoas: 4.0 },
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    metrics: {
      impressions: 1800000,
      clicks: 54000,
      conversions: 1080,
      costMicros: 162000000000, // $162,000
      ctr: 3.0,
      averageCpc: 3000000, // $3.00
      conversionRate: 2.0,
      costPerConversion: 150000000, // $150
      valuePerConversion: 600000000, // $600
      searchImpressionShare: 0.72,
      searchBudgetLostImpressionShare: 0.20,
      searchRankLostImpressionShare: 0.08,
      qualityScore: 7.1
    }
  },
  {
    resourceName: 'customers/1234567890/campaigns/111222335',
    id: '111222335',
    name: 'Display - Remarketing Audiences',
    status: 'PAUSED',
    advertisingChannelType: 'DISPLAY',
    campaignBudget: {
      amountMicros: 75000000, // $75
      deliveryMethod: 'ACCELERATED'
    },
    bidding_strategy: 'TARGET_CPA',
    targetCpa: { targetCpaMicros: 45000000 }, // $45
    startDate: '2026-02-01',
    endDate: '2026-05-31',
    metrics: {
      impressions: 5200000,
      clicks: 15600,
      conversions: 312,
      costMicros: 46800000000, // $46,800
      ctr: 0.30,
      averageCpc: 3000000, // $3.00
      conversionRate: 2.0,
      costPerConversion: 150000000, // $150
      viewThroughConversions: 89
    }
  }
];

const MOCK_AD_GROUPS = [
  {
    resourceName: 'customers/1234567890/adGroups/222333444',
    id: '222333444',
    name: 'Brand Keywords',
    campaign: 'customers/1234567890/campaigns/111222333',
    status: 'ENABLED',
    type: 'SEARCH_STANDARD',
    cpcBidMicros: 1500000, // $1.50
    metrics: {
      impressions: 1200000,
      clicks: 72000,
      conversions: 1440,
      costMicros: 50400000000, // $50,400
      ctr: 6.0,
      averageCpc: 700000, // $0.70
      conversionRate: 2.0,
      qualityScore: 8.8
    }
  },
  {
    resourceName: 'customers/1234567890/adGroups/222333445',
    id: '222333445',
    name: 'Product - Premium',
    campaign: 'customers/1234567890/campaigns/111222334',
    status: 'ENABLED',
    type: 'SEARCH_STANDARD',
    cpcBidMicros: 5000000, // $5.00
    metrics: {
      impressions: 900000,
      clicks: 27000,
      conversions: 540,
      costMicros: 81000000000, // $81,000
      ctr: 3.0,
      averageCpc: 3000000, // $3.00
      conversionRate: 2.0,
      qualityScore: 6.9
    }
  }
];

const MOCK_KEYWORDS = [
  {
    resourceName: 'customers/1234567890/adGroupCriteria/333444555',
    criterion: {
      id: '333444555',
      keyword: {
        text: 'locke ai',
        matchType: 'EXACT'
      }
    },
    adGroup: 'customers/1234567890/adGroups/222333444',
    status: 'ENABLED',
    cpcBidMicros: 1200000, // $1.20
    metrics: {
      impressions: 450000,
      clicks: 31500,
      conversions: 630,
      costMicros: 22050000000, // $22,050
      ctr: 7.0,
      averageCpc: 700000, // $0.70
      conversionRate: 2.0,
      qualityScore: 9.2,
      searchTopImpressionShare: 0.95,
      searchAbsoluteTopImpressionShare: 0.88
    }
  },
  {
    resourceName: 'customers/1234567890/adGroupCriteria/333444556',
    criterion: {
      id: '333444556',
      keyword: {
        text: 'locke artificial intelligence',
        matchType: 'PHRASE'
      }
    },
    adGroup: 'customers/1234567890/adGroups/222333444',
    status: 'ENABLED',
    cpcBidMicros: 1500000, // $1.50
    metrics: {
      impressions: 180000,
      clicks: 9000,
      conversions: 180,
      costMicros: 6300000000, // $6,300
      ctr: 5.0,
      averageCpc: 700000, // $0.70
      conversionRate: 2.0,
      qualityScore: 8.1,
      searchTopImpressionShare: 0.82,
      searchAbsoluteTopImpressionShare: 0.71
    }
  }
];

let accessToken = null;

/**
 * Refresh access token using refresh_token
 */
async function refreshAccessToken() {
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing OAuth credentials for Google Ads token refresh');
  }

  console.log('[Google Ads] Refreshing access token...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Ads token refresh failed: ${response.status} - ${err}`);
  }
  
  const data = await response.json();
  accessToken = data.access_token;
  
  console.log('[Google Ads] Token refreshed successfully');
  return accessToken;
}

/**
 * Make authenticated Google Ads API request
 */
async function apiRequest(endpoint, options = {}, retried = false) {
  if (!hasGoogleAds) {
    throw new Error('Google Ads not fully configured - missing OAuth credentials');
  }
  
  if (!accessToken) {
    await refreshAccessToken();
  }
  
  const baseUrl = 'https://googleads.googleapis.com/v19';
  const url = `${baseUrl}${endpoint}`;
  const customerIdClean = customerId.replace(/-/g, '');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': loginCustomerId || customerIdClean,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // Handle token expiration
  if (response.status === 401 && !retried) {
    console.log('[Google Ads] Token expired, refreshing...');
    await refreshAccessToken();
    return apiRequest(endpoint, options, true);
  }
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Ads API error: ${response.status} - ${err}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Get connector info
 */
function getInfo() {
  return {
    name,
    shortName,
    version,
    status,
    lastSync,
    apiEndpoint: oauth.apiEndpoint,
    connected: hasGoogleAds,
    features: ['Search Ads', 'Display Ads', 'Video Ads', 'Smart Bidding', 'Responsive Search Ads', 'Keyword Research'],
    channels: ['search', 'display', 'video', 'shopping', 'performance_max'],
    bidding_strategies: ['TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CLICKS', 'MAXIMIZE_CONVERSIONS', 'MANUAL_CPC'],
    toolCount: tools.length
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  if (!hasGoogleAds) {
    // Sandbox mode - return mock data
    return handleSandboxToolCall(toolName, params);
  }
  
  try {
    switch (toolName) {
      case 'google_ads_create_campaign':
        return await createCampaign(params);
      case 'google_ads_create_ad_group':
        return await createAdGroup(params);
      case 'google_ads_create_keyword':
        return await createKeyword(params);
      case 'google_ads_create_responsive_search_ad':
        return await createResponsiveSearchAd(params);
      case 'google_ads_get_campaigns':
        return await getCampaigns(params);
      case 'google_ads_get_ad_groups':
        return await getAdGroups(params);
      case 'google_ads_get_keywords':
        return await getKeywords(params);
      case 'google_ads_pause_campaign':
        return await pauseCampaign(params);
      case 'google_ads_update_budget':
        return await updateBudget(params);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    status = 'error';
    throw err;
  }
}

/**
 * Handle tool calls in sandbox mode (mock data)
 */
function handleSandboxToolCall(toolName, params) {
  const sandboxResponse = { 
    sandbox: true,
    message: 'Using sandbox mode. Set Google Ads OAuth credentials in config/.env to enable live API.',
    toolName,
    params
  };
  
  switch (toolName) {
    case 'google_ads_create_campaign':
      return {
        ...sandboxResponse,
        campaign: {
          resourceName: `customers/1234567890/campaigns/${Math.floor(Math.random() * 1000000)}`,
          id: Math.floor(Math.random() * 1000000).toString(),
          name: params.name,
          status: 'ENABLED',
          advertisingChannelType: params.campaign_type,
          campaignBudget: {
            amountMicros: params.budget_micros,
            deliveryMethod: 'STANDARD'
          },
          bidding_strategy: params.bidding_strategy,
          startDate: params.start_date,
          endDate: params.end_date
        }
      };
      
    case 'google_ads_get_campaigns':
      return {
        ...sandboxResponse,
        campaigns: MOCK_CAMPAIGNS.filter(c => 
          !params.status_filter || c.status === params.status_filter
        )
      };
      
    case 'google_ads_get_ad_groups':
      return {
        ...sandboxResponse,
        adGroups: MOCK_AD_GROUPS.filter(ag => ag.campaign === params.campaign_id)
      };
      
    case 'google_ads_get_keywords':
      return {
        ...sandboxResponse,
        keywords: MOCK_KEYWORDS.filter(k => k.adGroup === params.ad_group_id)
      };
      
    case 'google_ads_create_ad_group':
      return {
        ...sandboxResponse,
        adGroup: {
          resourceName: `customers/1234567890/adGroups/${Math.floor(Math.random() * 1000000)}`,
          id: Math.floor(Math.random() * 1000000).toString(),
          name: params.name,
          campaign: params.campaign_id,
          status: 'ENABLED',
          type: params.ad_group_type || 'SEARCH_STANDARD',
          cpcBidMicros: params.cpc_bid_micros
        }
      };
      
    case 'google_ads_create_keyword':
      return {
        ...sandboxResponse,
        keyword: {
          resourceName: `customers/1234567890/adGroupCriteria/${Math.floor(Math.random() * 1000000)}`,
          criterion: {
            id: Math.floor(Math.random() * 1000000).toString(),
            keyword: {
              text: params.keyword_text,
              matchType: params.match_type
            }
          },
          adGroup: params.ad_group_id,
          status: 'ENABLED',
          cpcBidMicros: params.bid_micros || 1000000
        }
      };
      
    case 'google_ads_create_responsive_search_ad':
      return {
        ...sandboxResponse,
        ad: {
          resourceName: `customers/1234567890/ads/${Math.floor(Math.random() * 1000000)}`,
          id: Math.floor(Math.random() * 1000000).toString(),
          type: 'RESPONSIVE_SEARCH_AD',
          responsiveSearchAd: {
            headlines: params.headlines.map((text, index) => ({ text, pinnedField: index < 3 ? 'HEADLINE_1' : null })),
            descriptions: params.descriptions.map(text => ({ text })),
            path1: params.path1,
            path2: params.path2
          },
          finalUrls: params.final_urls,
          adGroup: params.ad_group_id,
          status: 'ENABLED'
        }
      };
      
    case 'google_ads_pause_campaign':
      return {
        ...sandboxResponse,
        result: {
          resourceName: params.campaign_id,
          status: params.action === 'PAUSE' ? 'PAUSED' : 'ENABLED',
          message: `Campaign ${params.action.toLowerCase()}d successfully`
        }
      };
      
    case 'google_ads_update_budget':
      return {
        ...sandboxResponse,
        result: {
          resourceName: params.campaign_id,
          campaignBudget: {
            amountMicros: params.budget_micros,
            deliveryMethod: 'STANDARD'
          },
          message: `Budget updated to $${(params.budget_micros / 1000000).toFixed(2)} daily`
        }
      };
      
    default:
      return {
        ...sandboxResponse,
        error: `Tool ${toolName} not implemented in sandbox mode`
      };
  }
}

/**
 * Get bidding strategy field for campaign creation.
 * Returns an object to spread directly onto the campaign resource.
 */
function getBiddingField(strategy, targetValue) {
  switch (strategy) {
    case 'TARGET_CPA':
      return { targetCpa: { targetCpaMicros: String(Math.round((targetValue || 50) * 1000000)) } };
    case 'TARGET_ROAS':
      return { targetRoas: { targetRoas: targetValue || 4.0 } };
    case 'MAXIMIZE_CONVERSIONS':
      return { maximizeConversions: {} };
    case 'MAXIMIZE_CONVERSION_VALUE':
      return { maximizeConversionValue: {} };
    case 'MANUAL_CPC':
      return { manualCpc: { enhancedCpcEnabled: true } };
    default:
      return { manualCpc: {} };
  }
}

/**
 * Create campaign (live API)
 * Step 1: Create CampaignBudget, Step 2: Create Campaign referencing it
 */
async function createCampaign(params) {
  const customerIdClean = customerId.replace(/-/g, '');

  // Step 1: Create campaign budget
  console.log('[Google Ads] Creating campaign budget...');
  const budgetOps = [{
    create: {
      name: `Budget for ${params.name} ${Date.now()}`,
      amountMicros: String(params.budget_micros),
      deliveryMethod: 'STANDARD'
    }
  }];

  const budgetResponse = await apiRequest(`/customers/${customerIdClean}/campaignBudgets:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations: budgetOps })
  });

  const budgetResourceName = budgetResponse.results[0].resourceName;
  console.log(`[Google Ads] Budget created: ${budgetResourceName}`);

  // Step 2: Create campaign referencing the budget
  const biddingField = getBiddingField(params.bidding_strategy, params.target_value);

  // Force manualCpc for test accounts — smart bidding not supported
  const safeBiddingField = { manualCpc: {} };

  const campaignResource = {
    name: params.name,
    advertisingChannelType: params.campaign_type || 'SEARCH',
    status: 'PAUSED',
    campaignBudget: budgetResourceName,
    ...safeBiddingField,
    containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
    networkSettings: {
      targetGoogleSearch: (params.campaign_type || 'SEARCH') === 'SEARCH',
      targetSearchNetwork: (params.campaign_type || 'SEARCH') === 'SEARCH',
      targetContentNetwork: (params.campaign_type || 'SEARCH') === 'DISPLAY',
      targetPartnerSearchNetwork: false
    }
  };

  if (params.start_date) campaignResource.startDate = params.start_date;
  if (params.end_date) campaignResource.endDate = params.end_date;

  const operations = [{ create: campaignResource }];

  const response = await apiRequest(`/customers/${customerIdClean}/campaigns:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });

  return {
    campaign: response.results[0],
    budget: budgetResponse.results[0],
    mutateOperation: 'CREATE'
  };
}

/**
 * Get campaigns (live API)
 */
async function getCampaigns(params = {}) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  // Build GAQL query
  let query = `
    SELECT 
      campaign.id, 
      campaign.name, 
      campaign.status, 
      campaign.advertising_channel_type,
      campaign.start_date,
      campaign.end_date,
      metrics.impressions, 
      metrics.clicks, 
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
  `;
  
  const conditions = [];
  
  if (params.status_filter) {
    conditions.push(`campaign.status = '${params.status_filter}'`);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  if (params.date_range) {
    query += ` DURING ${params.date_range}`;
  }
  
  const response = await apiRequest(`/customers/${customerIdClean}/googleAds:searchStream`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  
  return {
    campaigns: response.results || [],
    query
  };
}

/**
 * Get ad groups (live API)
 */
async function getAdGroups(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  let query = `
    SELECT 
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type,
      ad_group.cpc_bid_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group 
    WHERE ad_group.campaign = '${params.campaign_id}'
  `;
  
  if (params.date_range) {
    query += ` DURING ${params.date_range}`;
  }
  
  const response = await apiRequest(`/customers/${customerIdClean}/googleAds:searchStream`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  
  return {
    adGroups: response.results || [],
    campaignId: params.campaign_id,
    query
  };
}

/**
 * Get keywords (live API)
 */
async function getKeywords(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  let query = `
    SELECT 
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.quality_score
    FROM keyword_view 
    WHERE ad_group_criterion.ad_group = '${params.ad_group_id}'
  `;
  
  if (params.date_range) {
    query += ` DURING ${params.date_range}`;
  }
  
  const response = await apiRequest(`/customers/${customerIdClean}/googleAds:searchStream`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  
  return {
    keywords: response.results || [],
    adGroupId: params.ad_group_id,
    query
  };
}

/**
 * Create ad group (live API) 
 */
async function createAdGroup(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  const operations = [{
    create: {
      name: params.name,
      campaign: params.campaign_id,
      status: 'ENABLED',
      type: params.ad_group_type || 'SEARCH_STANDARD',
      cpcBidMicros: String(params.cpc_bid_micros || 2000000)
    }
  }];
  
  const response = await apiRequest(`/customers/${customerIdClean}/adGroups:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });
  
  return {
    adGroup: response.results[0],
    mutateOperation: 'CREATE'
  };
}

/**
 * Create keyword (live API)
 */
async function createKeyword(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  const operations = [{
    create: {
      adGroup: params.ad_group_id,
      status: 'ENABLED',
      keyword: {
        text: params.keyword_text,
        matchType: params.match_type
      },
      cpcBidMicros: params.bid_micros
    }
  }];
  
  const response = await apiRequest(`/customers/${customerIdClean}/adGroupCriteria:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });
  
  return {
    keyword: response.results[0],
    mutateOperation: 'CREATE'
  };
}

/**
 * Create Responsive Search Ad (live API)
 */
async function createResponsiveSearchAd(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  const headlines = params.headlines.map((text, i) => {
    const entry = { text };
    if (i === 0) entry.pinnedField = 'HEADLINE_1';
    return entry;
  });

  const descriptions = params.descriptions.map(text => ({ text }));

  const adResource = {
    responsiveSearchAd: {
      headlines,
      descriptions
    },
    finalUrls: params.final_urls
  };

  if (params.path1) adResource.responsiveSearchAd.path1 = params.path1;
  if (params.path2) adResource.responsiveSearchAd.path2 = params.path2;

  const operations = [{
    create: {
      adGroup: params.ad_group_id,
      status: 'ENABLED',
      ad: adResource
    }
  }];
  
  const response = await apiRequest(`/customers/${customerIdClean}/adGroupAds:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });
  
  return {
    ad: response.results[0],
    mutateOperation: 'CREATE'
  };
}

/**
 * Pause/enable campaign (live API)
 */
async function pauseCampaign(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  const operations = [{
    update: {
      resourceName: params.campaign_id,
      status: params.action === 'PAUSE' ? 'PAUSED' : 'ENABLED'
    },
    updateMask: 'status'
  }];
  
  const response = await apiRequest(`/customers/${customerIdClean}/campaigns:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });
  
  return {
    result: response.results[0],
    status: params.action === 'PAUSE' ? 'PAUSED' : 'ENABLED',
    mutateOperation: 'UPDATE'
  };
}

/**
 * Update campaign budget (live API)
 */
async function updateBudget(params) {
  const customerIdClean = customerId.replace(/-/g, '');
  
  // First get the campaign budget ID
  const campaignQuery = `SELECT campaign.campaign_budget FROM campaign WHERE campaign.resource_name = '${params.campaign_id}'`;
  const campaignData = await apiRequest(`/customers/${customerIdClean}/googleAds:searchStream`, {
    method: 'POST',
    body: JSON.stringify({ query: campaignQuery })
  });
  
  const budgetResourceName = campaignData.results[0]?.campaign?.campaignBudget;
  
  const operations = [{
    update: {
      resourceName: budgetResourceName,
      amountMicros: params.budget_micros
    },
    updateMask: 'amount_micros'
  }];
  
  const response = await apiRequest(`/customers/${customerIdClean}/campaignBudgets:mutate`, {
    method: 'POST',
    body: JSON.stringify({ operations })
  });
  
  return {
    result: response.results[0],
    newBudget: `$${(params.budget_micros / 1000000).toFixed(2)}`,
    mutateOperation: 'UPDATE'
  };
}

// getBiddingField is defined above createCampaign

/**
 * Test connection
 */
async function testConnection() {
  if (!hasGoogleAds) {
    return { 
      connected: false, 
      error: 'Not configured - missing OAuth credentials',
      sandbox: true
    };
  }
  
  try {
    await getCampaigns({});
    status = 'connected';
    return { connected: true, lastSync: new Date().toISOString() };
  } catch (err) {
    status = 'error';
    return { connected: false, error: err.message };
  }
}

// Export all functions following the pattern from existing connectors
module.exports = {
  name,
  shortName,
  version,
  status,
  lastSync,
  oauth,
  tools,
  hasGoogleAds,
  getInfo,
  handleToolCall,
  testConnection,
  // Individual method exports for direct access
  createCampaign,
  getCampaigns,
  createAdGroup,
  getAdGroups,
  createKeyword,
  getKeywords,
  createResponsiveSearchAd,
  pauseCampaign,
  updateBudget
};