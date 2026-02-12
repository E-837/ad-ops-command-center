/**
 * Microsoft Advertising (Bing Ads) Connector
 * Integration with Microsoft Advertising API v13 for search advertising
 * 
 * Official API: https://ads.api.bingads.microsoft.com/Api/Advertiser/v13
 * 
 * Setup Instructions:
 * 1. Create a Microsoft Advertising account at ads.microsoft.com
 * 2. Register an Azure AD app at portal.azure.com
 * 3. Apply for a developer token at developers.ads.microsoft.com
 * 4. Complete OAuth2 flow to get refresh token
 * 5. Set environment variables in config/.env:
 *    MICROSOFT_ADS_CLIENT_ID=your_client_id
 *    MICROSOFT_ADS_CLIENT_SECRET=your_client_secret
 *    MICROSOFT_ADS_REFRESH_TOKEN=your_refresh_token
 *    MICROSOFT_ADS_DEVELOPER_TOKEN=your_developer_token
 *    MICROSOFT_ADS_ACCOUNT_ID=your_account_id
 *    MICROSOFT_ADS_CUSTOMER_ID=your_customer_id
 * 
 * Testing in Sandbox:
 * - Without credentials, connector returns realistic mock data
 * - Mock data includes 3 campaigns, 4 ad groups, 8 keywords, 4 ads
 * - All CRUD operations work in sandbox mode
 * 
 * Ad Ops Use Cases:
 * - Bing search campaign management
 * - Keyword research and bidding
 * - Responsive Search Ad (RSA) creation
 * - Shopping campaigns (Microsoft Merchant Center)
 * - Performance Max campaigns (multi-channel)
 * - Audience Network campaigns (native ads)
 */

const fs = require('fs');
const path = require('path');

const name = 'Microsoft Advertising';
const shortName = 'Microsoft Ads';
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
const clientId = env.MICROSOFT_ADS_CLIENT_ID || null;
const clientSecret = env.MICROSOFT_ADS_CLIENT_SECRET || null;
let refreshToken = env.MICROSOFT_ADS_REFRESH_TOKEN || null;
const developerToken = env.MICROSOFT_ADS_DEVELOPER_TOKEN || null;
const accountId = env.MICROSOFT_ADS_ACCOUNT_ID || null;
const customerId = env.MICROSOFT_ADS_CUSTOMER_ID || null;

const hasMicrosoftAds = !!(refreshToken && accountId && developerToken);

// OAuth configuration
const oauth = {
  provider: 'microsoft',
  scopes: ['https://ads.microsoft.com/ads.manage'],
  apiEndpoint: 'https://ads.api.bingads.microsoft.com/Api/Advertiser/v13',
  connected: hasMicrosoftAds,
  accountId: accountId ? `***${accountId.slice(-4)}` : null,
  customerId: customerId ? `***${customerId.slice(-4)}` : null
};

// API version
const API_VERSION = 'v13';
const BASE_URL = `https://ads.api.bingads.microsoft.com/Api/Advertiser/${API_VERSION}`;
const OAUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Access token cache
let accessTokenCache = null;
let tokenExpiresAt = 0;

// Tool definitions for MCP integration
const tools = [
  {
    name: 'microsoft_ads_get_accounts',
    description: 'List Microsoft Advertising accounts accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {
        include_metrics: {
          type: 'boolean',
          description: 'Include performance metrics for each account'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_get_campaigns',
    description: 'List Microsoft Ads campaigns with optional filters and metrics',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'array',
          items: { type: 'string', enum: ['Active', 'Paused', 'Deleted', 'Suspended'] },
          description: 'Filter by campaign status'
        },
        campaign_type: {
          type: 'string',
          enum: ['Search', 'Audience', 'Shopping', 'PerformanceMax'],
          description: 'Filter by campaign type'
        },
        include_metrics: {
          type: 'boolean',
          description: 'Include performance metrics (impressions, clicks, spend, etc.)'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_create_campaign',
    description: 'Create a new Microsoft Advertising campaign',
    inputSchema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Campaign name (max 128 characters)' 
        },
        campaign_type: {
          type: 'string',
          enum: ['Search', 'Audience', 'Shopping', 'PerformanceMax'],
          description: 'Campaign type (default: Search)'
        },
        budget_type: {
          type: 'string',
          enum: ['DailyBudgetStandard', 'DailyBudgetAccelerated'],
          description: 'Budget delivery method (default: DailyBudgetStandard)'
        },
        daily_budget: {
          type: 'number',
          description: 'Daily budget in account currency (e.g., 100.00 for $100/day)'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused'],
          description: 'Initial campaign status (default: Paused for safety)'
        },
        start_date: {
          type: 'string',
          description: 'Campaign start date (YYYY-MM-DD format)'
        },
        end_date: {
          type: 'string',
          description: 'Campaign end date (YYYY-MM-DD format, optional)'
        },
        time_zone: {
          type: 'string',
          description: 'Time zone (e.g., "EasternTimeUSCanada", "PacificTimeUSCanada")'
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target languages (e.g., ["English", "Spanish"])'
        }
      },
      required: ['name', 'daily_budget']
    }
  },
  {
    name: 'microsoft_ads_update_campaign',
    description: 'Update an existing Microsoft Ads campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID to update'
        },
        name: {
          type: 'string',
          description: 'New campaign name'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused', 'Deleted'],
          description: 'Update campaign status'
        },
        daily_budget: {
          type: 'number',
          description: 'New daily budget'
        },
        budget_type: {
          type: 'string',
          enum: ['DailyBudgetStandard', 'DailyBudgetAccelerated'],
          description: 'Update budget type'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'microsoft_ads_get_ad_groups',
    description: 'List ad groups within campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Filter by campaign ID'
        },
        status: {
          type: 'array',
          items: { type: 'string', enum: ['Active', 'Paused', 'Deleted'] },
          description: 'Filter by ad group status'
        },
        include_metrics: {
          type: 'boolean',
          description: 'Include performance metrics'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_create_ad_group',
    description: 'Create a new ad group within a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Parent campaign ID'
        },
        name: {
          type: 'string',
          description: 'Ad group name (max 128 characters)'
        },
        cpc_bid: {
          type: 'number',
          description: 'Default CPC bid in account currency (e.g., 2.50 for $2.50)'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused'],
          description: 'Initial ad group status (default: Paused)'
        },
        language: {
          type: 'string',
          description: 'Target language (default: English)'
        },
        network: {
          type: 'string',
          enum: ['OwnedAndOperatedAndSyndicatedSearch', 'OwnedAndOperatedOnly', 'SyndicatedSearchOnly'],
          description: 'Ad distribution network'
        },
        start_date: {
          type: 'string',
          description: 'Ad group start date (YYYY-MM-DD)'
        },
        end_date: {
          type: 'string',
          description: 'Ad group end date (YYYY-MM-DD, optional)'
        }
      },
      required: ['campaign_id', 'name', 'cpc_bid']
    }
  },
  {
    name: 'microsoft_ads_update_ad_group',
    description: 'Update an existing ad group',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: {
          type: 'string',
          description: 'Ad group ID to update'
        },
        name: {
          type: 'string',
          description: 'New ad group name'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused', 'Deleted'],
          description: 'Update ad group status'
        },
        cpc_bid: {
          type: 'number',
          description: 'New default CPC bid'
        }
      },
      required: ['ad_group_id']
    }
  },
  {
    name: 'microsoft_ads_get_keywords',
    description: 'List keywords in ad groups with performance data',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: {
          type: 'string',
          description: 'Filter by ad group ID'
        },
        campaign_id: {
          type: 'string',
          description: 'Filter by campaign ID'
        },
        match_type: {
          type: 'string',
          enum: ['Exact', 'Phrase', 'Broad'],
          description: 'Filter by match type'
        },
        status: {
          type: 'array',
          items: { type: 'string', enum: ['Active', 'Paused', 'Deleted'] },
          description: 'Filter by keyword status'
        },
        include_metrics: {
          type: 'boolean',
          description: 'Include performance metrics and quality score'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_create_keyword',
    description: 'Add a keyword to an ad group',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: {
          type: 'string',
          description: 'Ad group ID to add keyword to'
        },
        text: {
          type: 'string',
          description: 'Keyword text (do not include match type symbols)'
        },
        match_type: {
          type: 'string',
          enum: ['Exact', 'Phrase', 'Broad'],
          description: 'Match type (Exact=[keyword], Phrase="keyword", Broad=keyword)'
        },
        bid: {
          type: 'number',
          description: 'Keyword-specific bid override (optional, uses ad group default if not set)'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused'],
          description: 'Initial keyword status (default: Active)'
        },
        destination_url: {
          type: 'string',
          description: 'Keyword-specific landing page URL (optional)'
        }
      },
      required: ['ad_group_id', 'text', 'match_type']
    }
  },
  {
    name: 'microsoft_ads_update_keyword',
    description: 'Update an existing keyword (bid, status, URL)',
    inputSchema: {
      type: 'object',
      properties: {
        keyword_id: {
          type: 'string',
          description: 'Keyword ID to update'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused', 'Deleted'],
          description: 'Update keyword status'
        },
        bid: {
          type: 'number',
          description: 'New bid amount'
        },
        destination_url: {
          type: 'string',
          description: 'New destination URL'
        }
      },
      required: ['keyword_id']
    }
  },
  {
    name: 'microsoft_ads_get_negative_keywords',
    description: 'List negative keywords (exclusions) at campaign or ad group level',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID for campaign-level negatives'
        },
        ad_group_id: {
          type: 'string',
          description: 'Ad group ID for ad-group-level negatives'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_add_negative_keyword',
    description: 'Add a negative keyword to exclude unwanted traffic',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID (for campaign-level negative)'
        },
        ad_group_id: {
          type: 'string',
          description: 'Ad group ID (for ad-group-level negative)'
        },
        text: {
          type: 'string',
          description: 'Negative keyword text'
        },
        match_type: {
          type: 'string',
          enum: ['Exact', 'Phrase'],
          description: 'Match type (negative keywords do not support Broad)'
        }
      },
      required: ['text', 'match_type']
    }
  },
  {
    name: 'microsoft_ads_get_ads',
    description: 'List ads within ad groups',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: {
          type: 'string',
          description: 'Filter by ad group ID'
        },
        campaign_id: {
          type: 'string',
          description: 'Filter by campaign ID'
        },
        ad_type: {
          type: 'string',
          enum: ['ResponsiveSearch', 'ExpandedText'],
          description: 'Filter by ad type'
        },
        status: {
          type: 'array',
          items: { type: 'string', enum: ['Active', 'Paused', 'Deleted'] },
          description: 'Filter by ad status'
        },
        include_metrics: {
          type: 'boolean',
          description: 'Include ad performance metrics'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_create_ad',
    description: 'Create a new Responsive Search Ad (RSA) or Expanded Text Ad',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: {
          type: 'string',
          description: 'Ad group ID to create ad in'
        },
        ad_type: {
          type: 'string',
          enum: ['ResponsiveSearch', 'ExpandedText'],
          description: 'Ad type (default: ResponsiveSearch)'
        },
        headlines: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ad headlines (RSA: 3-15, max 30 chars each; Expanded Text: 3, max 30 chars)'
        },
        descriptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ad descriptions (RSA: 2-4, max 90 chars each; Expanded Text: 2, max 90 chars)'
        },
        path1: {
          type: 'string',
          description: 'Display path 1 (optional, max 15 chars, e.g., "winter")'
        },
        path2: {
          type: 'string',
          description: 'Display path 2 (optional, max 15 chars, e.g., "coats")'
        },
        final_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Landing page URLs (at least one required)'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused'],
          description: 'Initial ad status (default: Paused)'
        }
      },
      required: ['ad_group_id', 'headlines', 'descriptions', 'final_urls']
    }
  },
  {
    name: 'microsoft_ads_update_ad',
    description: 'Update an existing ad (status only - use create new ad to change copy)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: {
          type: 'string',
          description: 'Ad ID to update'
        },
        status: {
          type: 'string',
          enum: ['Active', 'Paused', 'Deleted'],
          description: 'Update ad status'
        }
      },
      required: ['ad_id', 'status']
    }
  },
  {
    name: 'microsoft_ads_get_extensions',
    description: 'List ad extensions (sitelinks, callouts, structured snippets, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        extension_type: {
          type: 'string',
          enum: ['Sitelink', 'Callout', 'StructuredSnippet', 'Call', 'Location', 'Price', 'App', 'Image'],
          description: 'Filter by extension type'
        },
        campaign_id: {
          type: 'string',
          description: 'Filter by campaign association'
        },
        status: {
          type: 'array',
          items: { type: 'string', enum: ['Active', 'Paused', 'Deleted'] },
          description: 'Filter by extension status'
        }
      }
    }
  },
  {
    name: 'microsoft_ads_get_performance_report',
    description: 'Get performance metrics for campaigns, ad groups, keywords, or ads',
    inputSchema: {
      type: 'object',
      properties: {
        report_level: {
          type: 'string',
          enum: ['Account', 'Campaign', 'AdGroup', 'Keyword', 'Ad'],
          description: 'Report aggregation level'
        },
        date_range: {
          type: 'string',
          enum: ['Today', 'Yesterday', 'Last7Days', 'Last14Days', 'Last30Days', 'Last90Days', 'ThisMonth', 'LastMonth', 'Custom'],
          description: 'Date range for report'
        },
        start_date: {
          type: 'string',
          description: 'Start date for custom range (YYYY-MM-DD)'
        },
        end_date: {
          type: 'string',
          description: 'End date for custom range (YYYY-MM-DD)'
        },
        campaign_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific campaign IDs'
        },
        metrics: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['Impressions', 'Clicks', 'Spend', 'CTR', 'AverageCpc', 'Conversions', 'ConversionRate', 'CostPerConversion', 'Revenue', 'ROAS', 'QualityScore']
          },
          description: 'Metrics to include (default: all)'
        }
      },
      required: ['report_level']
    }
  }
];

// Mock data for sandbox mode
const MOCK_CAMPAIGNS = [
  {
    Id: 1234567890,
    Name: 'Winter Sale - Search Campaign',
    CampaignType: 'Search',
    Status: 'Active',
    BudgetType: 'DailyBudgetStandard',
    DailyBudget: 100.00,
    TimeZone: 'EasternTimeUSCanada',
    Languages: ['English'],
    StartDate: '2026-02-01',
    EndDate: '2026-03-31',
    CreatedTime: '2026-01-25T10:00:00Z',
    LastModifiedTime: '2026-02-10T15:30:00Z'
  },
  {
    Id: 1234567891,
    Name: 'Spring Collection - Audience Network',
    CampaignType: 'Audience',
    Status: 'Active',
    BudgetType: 'DailyBudgetStandard',
    DailyBudget: 75.00,
    TimeZone: 'PacificTimeUSCanada',
    Languages: ['English', 'Spanish'],
    StartDate: '2026-03-01',
    EndDate: null,
    CreatedTime: '2026-02-01T09:00:00Z',
    LastModifiedTime: '2026-02-08T11:20:00Z'
  },
  {
    Id: 1234567892,
    Name: 'Holiday Shopping - Performance Max',
    CampaignType: 'PerformanceMax',
    Status: 'Paused',
    BudgetType: 'DailyBudgetStandard',
    DailyBudget: 150.00,
    TimeZone: 'EasternTimeUSCanada',
    Languages: ['English'],
    StartDate: '2026-03-15',
    EndDate: '2026-04-15',
    CreatedTime: '2026-01-20T14:00:00Z',
    LastModifiedTime: '2026-02-05T16:45:00Z'
  }
];

const MOCK_AD_GROUPS = [
  {
    Id: 9876543210,
    CampaignId: 1234567890,
    Name: 'Winter Coats - Exact Match',
    Status: 'Active',
    Language: 'English',
    Network: 'OwnedAndOperatedAndSyndicatedSearch',
    PricingModel: 'Cpc',
    SearchBid: { Amount: 2.50 },
    StartDate: '2026-02-01',
    EndDate: '2026-03-31'
  },
  {
    Id: 9876543211,
    CampaignId: 1234567890,
    Name: 'Winter Accessories - Phrase Match',
    Status: 'Active',
    Language: 'English',
    Network: 'OwnedAndOperatedAndSyndicatedSearch',
    PricingModel: 'Cpc',
    SearchBid: { Amount: 1.75 },
    StartDate: '2026-02-01',
    EndDate: '2026-03-31'
  },
  {
    Id: 9876543212,
    CampaignId: 1234567891,
    Name: 'Spring Fashion - Audience Targeting',
    Status: 'Active',
    Language: 'English',
    Network: 'OwnedAndOperatedOnly',
    PricingModel: 'Cpm',
    SearchBid: { Amount: 5.00 },
    StartDate: '2026-03-01',
    EndDate: null
  },
  {
    Id: 9876543213,
    CampaignId: 1234567892,
    Name: 'Holiday Products - Auto-Optimized',
    Status: 'Paused',
    Language: 'English',
    Network: 'OwnedAndOperatedAndSyndicatedSearch',
    PricingModel: 'Cpc',
    SearchBid: { Amount: 3.25 },
    StartDate: '2026-03-15',
    EndDate: '2026-04-15'
  }
];

const MOCK_KEYWORDS = [
  {
    Id: 1111111111,
    AdGroupId: 9876543210,
    Text: 'winter coats',
    MatchType: 'Exact',
    Bid: { Amount: 2.50 },
    Status: 'Active',
    QualityScore: 8,
    DestinationUrl: 'https://example.com/winter-coats'
  },
  {
    Id: 1111111112,
    AdGroupId: 9876543210,
    Text: 'warm winter jackets',
    MatchType: 'Exact',
    Bid: { Amount: 2.75 },
    Status: 'Active',
    QualityScore: 7,
    DestinationUrl: 'https://example.com/winter-jackets'
  },
  {
    Id: 1111111113,
    AdGroupId: 9876543211,
    Text: 'winter scarves',
    MatchType: 'Phrase',
    Bid: { Amount: 1.75 },
    Status: 'Active',
    QualityScore: 9,
    DestinationUrl: 'https://example.com/winter-accessories'
  },
  {
    Id: 1111111114,
    AdGroupId: 9876543211,
    Text: 'winter gloves',
    MatchType: 'Phrase',
    Bid: { Amount: 1.60 },
    Status: 'Active',
    QualityScore: 8,
    DestinationUrl: 'https://example.com/winter-gloves'
  },
  {
    Id: 1111111115,
    AdGroupId: 9876543210,
    Text: 'winter clothing',
    MatchType: 'Broad',
    Bid: { Amount: 2.00 },
    Status: 'Active',
    QualityScore: 6,
    DestinationUrl: 'https://example.com/winter'
  },
  {
    Id: 1111111116,
    AdGroupId: 9876543211,
    Text: 'winter hats',
    MatchType: 'Phrase',
    Bid: { Amount: 1.50 },
    Status: 'Paused',
    QualityScore: 7,
    DestinationUrl: 'https://example.com/winter-hats'
  },
  {
    Id: 1111111117,
    AdGroupId: 9876543212,
    Text: 'spring dresses',
    MatchType: 'Exact',
    Bid: { Amount: 3.50 },
    Status: 'Active',
    QualityScore: 9,
    DestinationUrl: 'https://example.com/spring-dresses'
  },
  {
    Id: 1111111118,
    AdGroupId: 9876543213,
    Text: 'holiday gifts',
    MatchType: 'Broad',
    Bid: { Amount: 3.25 },
    Status: 'Paused',
    QualityScore: 5,
    DestinationUrl: 'https://example.com/gifts'
  }
];

const MOCK_NEGATIVE_KEYWORDS = [
  {
    Id: 3333333331,
    CampaignId: 1234567890,
    Text: 'cheap',
    MatchType: 'Exact'
  },
  {
    Id: 3333333332,
    CampaignId: 1234567890,
    Text: 'free',
    MatchType: 'Phrase'
  },
  {
    Id: 3333333333,
    AdGroupId: 9876543210,
    Text: 'used',
    MatchType: 'Exact'
  }
];

const MOCK_ADS = [
  {
    Id: 2222222222,
    AdGroupId: 9876543210,
    Type: 'ResponsiveSearch',
    Status: 'Active',
    Headlines: [
      { Text: 'Winter Coats On Sale', PinningPosition: null },
      { Text: 'Free Shipping Available', PinningPosition: null },
      { Text: 'Shop Now & Save Up To 40%', PinningPosition: null },
      { Text: 'Premium Quality Winter Wear', PinningPosition: null }
    ],
    Descriptions: [
      { Text: 'Browse our collection of warm winter coats. All sizes available with free returns.' },
      { Text: 'Premium quality at affordable prices. Limited time winter sale. Order today!' }
    ],
    Path1: 'winter',
    Path2: 'coats',
    FinalUrls: ['https://example.com/winter-coats'],
    TrackingTemplate: null
  },
  {
    Id: 2222222223,
    AdGroupId: 9876543211,
    Type: 'ResponsiveSearch',
    Status: 'Active',
    Headlines: [
      { Text: 'Winter Accessories Sale', PinningPosition: null },
      { Text: 'Scarves, Gloves & More', PinningPosition: null },
      { Text: 'Stay Warm This Winter', PinningPosition: null }
    ],
    Descriptions: [
      { Text: 'Complete your winter outfit with our premium accessories. Fast shipping.' },
      { Text: 'Quality winter scarves, gloves, and hats. Shop the collection now.' }
    ],
    Path1: 'winter',
    Path2: 'accessories',
    FinalUrls: ['https://example.com/winter-accessories'],
    TrackingTemplate: null
  },
  {
    Id: 2222222224,
    AdGroupId: 9876543212,
    Type: 'ResponsiveSearch',
    Status: 'Active',
    Headlines: [
      { Text: 'Spring Fashion 2026', PinningPosition: null },
      { Text: 'New Arrivals Daily', PinningPosition: null },
      { Text: 'Trending Styles', PinningPosition: null }
    ],
    Descriptions: [
      { Text: 'Discover the latest spring fashion trends. Free shipping on orders over $50.' },
      { Text: 'Shop our new spring collection. Dresses, tops, and more. Save today!' }
    ],
    Path1: 'spring',
    Path2: 'collection',
    FinalUrls: ['https://example.com/spring'],
    TrackingTemplate: null
  },
  {
    Id: 2222222225,
    AdGroupId: 9876543213,
    Type: 'ExpandedText',
    Status: 'Paused',
    Headlines: [
      { Text: 'Holiday Gift Ideas', PinningPosition: null },
      { Text: 'Perfect Gifts For Everyone', PinningPosition: null },
      { Text: 'Shop Now', PinningPosition: null }
    ],
    Descriptions: [
      { Text: 'Find the perfect gift for family and friends. Wide selection available.' },
      { Text: 'Quality gifts at great prices. Free gift wrapping on all orders.' }
    ],
    Path1: 'holiday',
    Path2: 'gifts',
    FinalUrls: ['https://example.com/gifts'],
    TrackingTemplate: null
  }
];

const MOCK_EXTENSIONS = [
  {
    Id: 4444444441,
    Type: 'Sitelink',
    Status: 'Active',
    Text: 'Winter Sale',
    Description1: 'Up to 40% off',
    Description2: 'Limited time offer',
    FinalUrls: ['https://example.com/winter-sale']
  },
  {
    Id: 4444444442,
    Type: 'Sitelink',
    Status: 'Active',
    Text: 'Free Shipping',
    Description1: 'On orders over $50',
    Description2: 'Fast delivery',
    FinalUrls: ['https://example.com/shipping']
  },
  {
    Id: 4444444443,
    Type: 'Callout',
    Status: 'Active',
    Text: '24/7 Customer Support'
  },
  {
    Id: 4444444444,
    Type: 'Callout',
    Status: 'Active',
    Text: 'Free Returns'
  },
  {
    Id: 4444444445,
    Type: 'StructuredSnippet',
    Status: 'Active',
    Header: 'Styles',
    Values: ['Classic', 'Modern', 'Trendy', 'Casual']
  }
];

const MOCK_PERFORMANCE = {
  campaign: {
    1234567890: {
      Impressions: 95000,
      Clicks: 2375,
      Spend: 5937.50,
      CTR: 2.5,
      AverageCpc: 2.50,
      Conversions: 119,
      ConversionRate: 5.0,
      CostPerConversion: 49.90,
      Revenue: 23750.00,
      ROAS: 4.0
    },
    1234567891: {
      Impressions: 120000,
      Clicks: 1800,
      Spend: 3750.00,
      CTR: 1.5,
      AverageCpc: 2.08,
      Conversions: 72,
      ConversionRate: 4.0,
      CostPerConversion: 52.08,
      Revenue: 14400.00,
      ROAS: 3.84
    },
    1234567892: {
      Impressions: 50000,
      Clicks: 750,
      Spend: 2437.50,
      CTR: 1.5,
      AverageCpc: 3.25,
      Conversions: 30,
      ConversionRate: 4.0,
      CostPerConversion: 81.25,
      Revenue: 6000.00,
      ROAS: 2.46
    }
  }
};

// OAuth2 token refresh
async function refreshAccessToken() {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Microsoft Ads OAuth credentials not configured');
  }
  
  try {
    const response = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://ads.microsoft.com/ads.manage'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }
    
    const data = await response.json();
    accessTokenCache = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    
    return accessTokenCache;
  } catch (error) {
    throw new Error(`Failed to refresh Microsoft Ads access token: ${error.message}`);
  }
}

// Get valid access token
async function getAccessToken() {
  if (accessTokenCache && Date.now() < tokenExpiresAt - 60000) {
    return accessTokenCache;
  }
  
  return await refreshAccessToken();
}

// API request helper
async function apiRequest(endpoint, method = 'GET', body = null) {
  if (!hasMicrosoftAds) {
    return getMockData(endpoint, method, body);
  }
  
  try {
    const token = await getAccessToken();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'DeveloperToken': developerToken,
      'Content-Type': 'application/json'
    };
    
    if (customerId) {
      headers['CustomerId'] = customerId;
    }
    
    if (accountId) {
      headers['AccountId'] = accountId;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Ads API error: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

// Mock data generator
function getMockData(endpoint, method, body) {
  // Parse endpoint to determine what mock data to return
  if (endpoint.includes('/accounts') || method === 'GET' && !endpoint.includes('/')) {
    return {
      Accounts: [
        {
          Id: accountId || '123456789',
          Name: 'Test Advertiser Account',
          Number: 'X12345678',
          AccountLifeCycleStatus: 'Active',
          PauseReason: null,
          Language: 'English',
          TimeZone: 'EasternTimeUSCanada',
          CurrencyCode: 'USD'
        }
      ]
    };
  }
  
  if (endpoint.includes('/campaigns')) {
    if (method === 'GET') {
      let campaigns = [...MOCK_CAMPAIGNS];
      
      // Apply filters from body
      if (body && body.status) {
        campaigns = campaigns.filter(c => body.status.includes(c.Status));
      }
      
      if (body && body.campaign_type) {
        campaigns = campaigns.filter(c => c.CampaignType === body.campaign_type);
      }
      
      // Add metrics if requested
      if (body && body.include_metrics) {
        campaigns = campaigns.map(c => ({
          ...c,
          Performance: MOCK_PERFORMANCE.campaign[c.Id] || {}
        }));
      }
      
      return { Campaigns: campaigns, TotalCount: campaigns.length };
    }
    
    if (method === 'POST') {
      const newCampaign = {
        Id: Math.floor(Math.random() * 1000000000) + 1000000000,
        Name: body.name,
        CampaignType: body.campaign_type || 'Search',
        Status: body.status || 'Paused',
        BudgetType: body.budget_type || 'DailyBudgetStandard',
        DailyBudget: body.daily_budget,
        TimeZone: body.time_zone || 'EasternTimeUSCanada',
        Languages: body.languages || ['English'],
        StartDate: body.start_date || new Date().toISOString().split('T')[0],
        EndDate: body.end_date || null,
        CreatedTime: new Date().toISOString(),
        LastModifiedTime: new Date().toISOString()
      };
      
      return { Campaign: newCampaign, Success: true };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      return { Success: true, Message: 'Campaign updated successfully' };
    }
  }
  
  if (endpoint.includes('/adgroups')) {
    if (method === 'GET') {
      let adGroups = [...MOCK_AD_GROUPS];
      
      if (body && body.campaign_id) {
        adGroups = adGroups.filter(ag => ag.CampaignId.toString() === body.campaign_id);
      }
      
      if (body && body.status) {
        adGroups = adGroups.filter(ag => body.status.includes(ag.Status));
      }
      
      return { AdGroups: adGroups, TotalCount: adGroups.length };
    }
    
    if (method === 'POST') {
      const newAdGroup = {
        Id: Math.floor(Math.random() * 1000000000) + 9000000000,
        CampaignId: parseInt(body.campaign_id),
        Name: body.name,
        Status: body.status || 'Paused',
        Language: body.language || 'English',
        Network: body.network || 'OwnedAndOperatedAndSyndicatedSearch',
        PricingModel: 'Cpc',
        SearchBid: { Amount: body.cpc_bid },
        StartDate: body.start_date || new Date().toISOString().split('T')[0],
        EndDate: body.end_date || null
      };
      
      return { AdGroup: newAdGroup, Success: true };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      return { Success: true, Message: 'Ad group updated successfully' };
    }
  }
  
  if (endpoint.includes('/keywords')) {
    if (method === 'GET') {
      let keywords = [...MOCK_KEYWORDS];
      
      if (body && body.ad_group_id) {
        keywords = keywords.filter(k => k.AdGroupId.toString() === body.ad_group_id);
      }
      
      if (body && body.match_type) {
        keywords = keywords.filter(k => k.MatchType === body.match_type);
      }
      
      if (body && body.status) {
        keywords = keywords.filter(k => body.status.includes(k.Status));
      }
      
      return { Keywords: keywords, TotalCount: keywords.length };
    }
    
    if (method === 'POST') {
      const newKeyword = {
        Id: Math.floor(Math.random() * 1000000000) + 1000000000,
        AdGroupId: parseInt(body.ad_group_id),
        Text: body.text,
        MatchType: body.match_type,
        Bid: { Amount: body.bid || 1.00 },
        Status: body.status || 'Active',
        QualityScore: Math.floor(Math.random() * 4) + 6, // Random 6-10
        DestinationUrl: body.destination_url || null
      };
      
      return { Keyword: newKeyword, Success: true };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      return { Success: true, Message: 'Keyword updated successfully' };
    }
  }
  
  if (endpoint.includes('/negativekeywords')) {
    if (method === 'GET') {
      let negatives = [...MOCK_NEGATIVE_KEYWORDS];
      
      if (body && body.campaign_id) {
        negatives = negatives.filter(nk => nk.CampaignId && nk.CampaignId.toString() === body.campaign_id);
      }
      
      if (body && body.ad_group_id) {
        negatives = negatives.filter(nk => nk.AdGroupId && nk.AdGroupId.toString() === body.ad_group_id);
      }
      
      return { NegativeKeywords: negatives, TotalCount: negatives.length };
    }
    
    if (method === 'POST') {
      const newNegative = {
        Id: Math.floor(Math.random() * 1000000000) + 3000000000,
        CampaignId: body.campaign_id ? parseInt(body.campaign_id) : undefined,
        AdGroupId: body.ad_group_id ? parseInt(body.ad_group_id) : undefined,
        Text: body.text,
        MatchType: body.match_type
      };
      
      return { NegativeKeyword: newNegative, Success: true };
    }
  }
  
  if (endpoint.includes('/ads')) {
    if (method === 'GET') {
      let ads = [...MOCK_ADS];
      
      if (body && body.ad_group_id) {
        ads = ads.filter(a => a.AdGroupId.toString() === body.ad_group_id);
      }
      
      if (body && body.ad_type) {
        ads = ads.filter(a => a.Type === body.ad_type);
      }
      
      if (body && body.status) {
        ads = ads.filter(a => body.status.includes(a.Status));
      }
      
      return { Ads: ads, TotalCount: ads.length };
    }
    
    if (method === 'POST') {
      const newAd = {
        Id: Math.floor(Math.random() * 1000000000) + 2000000000,
        AdGroupId: parseInt(body.ad_group_id),
        Type: body.ad_type || 'ResponsiveSearch',
        Status: body.status || 'Paused',
        Headlines: body.headlines.map(h => ({ Text: h, PinningPosition: null })),
        Descriptions: body.descriptions.map(d => ({ Text: d })),
        Path1: body.path1 || null,
        Path2: body.path2 || null,
        FinalUrls: body.final_urls,
        TrackingTemplate: null
      };
      
      return { Ad: newAd, Success: true };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      return { Success: true, Message: 'Ad updated successfully' };
    }
  }
  
  if (endpoint.includes('/extensions')) {
    return { Extensions: MOCK_EXTENSIONS, TotalCount: MOCK_EXTENSIONS.length };
  }
  
  if (endpoint.includes('/reports') || endpoint.includes('/performance')) {
    const reportLevel = body?.report_level || 'Campaign';
    const data = [];
    
    if (reportLevel === 'Campaign') {
      MOCK_CAMPAIGNS.forEach(campaign => {
        const perf = MOCK_PERFORMANCE.campaign[campaign.Id];
        if (perf) {
          data.push({
            CampaignId: campaign.Id,
            CampaignName: campaign.Name,
            ...perf
          });
        }
      });
    }
    
    return { ReportData: data, TotalRows: data.length };
  }
  
  return { Success: true, Message: 'Mock response' };
}

// Test connection
async function testConnection() {
  try {
    if (!hasMicrosoftAds) {
      return {
        success: true,
        mode: 'sandbox',
        message: 'Running in sandbox mode with mock data. Configure MICROSOFT_ADS_* environment variables for live API access.',
        capabilities: {
          campaigns: true,
          adGroups: true,
          keywords: true,
          ads: true,
          extensions: true,
          reporting: true
        }
      };
    }
    
    // Test with GetUser or GetAccounts operation
    const result = await apiRequest('/accounts', 'GET');
    
    return {
      success: true,
      mode: 'live',
      message: 'Successfully connected to Microsoft Advertising API',
      account: {
        id: accountId,
        customer_id: customerId
      },
      capabilities: {
        campaigns: true,
        adGroups: true,
        keywords: true,
        ads: true,
        extensions: true,
        reporting: true
      }
    };
  } catch (error) {
    return {
      success: false,
      mode: 'error',
      message: error.message
    };
  }
}

// Tool handler
async function handleToolCall(toolName, parameters) {
  try {
    switch (toolName) {
      case 'microsoft_ads_get_accounts':
        return await apiRequest('/accounts', 'GET', parameters);
        
      case 'microsoft_ads_get_campaigns':
        return await apiRequest('/campaigns', 'GET', parameters);
        
      case 'microsoft_ads_create_campaign':
        return await apiRequest('/campaigns', 'POST', parameters);
        
      case 'microsoft_ads_update_campaign':
        return await apiRequest(`/campaigns/${parameters.campaign_id}`, 'PUT', parameters);
        
      case 'microsoft_ads_get_ad_groups':
        return await apiRequest('/adgroups', 'GET', parameters);
        
      case 'microsoft_ads_create_ad_group':
        return await apiRequest('/adgroups', 'POST', parameters);
        
      case 'microsoft_ads_update_ad_group':
        return await apiRequest(`/adgroups/${parameters.ad_group_id}`, 'PUT', parameters);
        
      case 'microsoft_ads_get_keywords':
        return await apiRequest('/keywords', 'GET', parameters);
        
      case 'microsoft_ads_create_keyword':
        return await apiRequest('/keywords', 'POST', parameters);
        
      case 'microsoft_ads_update_keyword':
        return await apiRequest(`/keywords/${parameters.keyword_id}`, 'PUT', parameters);
        
      case 'microsoft_ads_get_negative_keywords':
        return await apiRequest('/negativekeywords', 'GET', parameters);
        
      case 'microsoft_ads_add_negative_keyword':
        return await apiRequest('/negativekeywords', 'POST', parameters);
        
      case 'microsoft_ads_get_ads':
        return await apiRequest('/ads', 'GET', parameters);
        
      case 'microsoft_ads_create_ad':
        return await apiRequest('/ads', 'POST', parameters);
        
      case 'microsoft_ads_update_ad':
        return await apiRequest(`/ads/${parameters.ad_id}`, 'PUT', parameters);
        
      case 'microsoft_ads_get_extensions':
        return await apiRequest('/extensions', 'GET', parameters);
        
      case 'microsoft_ads_get_performance_report':
        return await apiRequest('/reports/performance', 'POST', parameters);
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export
module.exports = {
  name,
  shortName,
  version,
  status,
  oauth,
  tools,
  testConnection,
  handleToolCall,
  getTools: () => tools
};
