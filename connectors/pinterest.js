/**
 * Pinterest Ads Connector
 * Integration with Pinterest Ads API v5 for social commerce campaign management
 * 
 * Official API: https://api.pinterest.com/v5/
 * 
 * Setup Instructions:
 * 1. Create a Pinterest App at developers.pinterest.com/apps
 * 2. Add required scopes: ads:read, ads:write, user_accounts:read, boards:read, pins:read, pins:write
 * 3. Complete OAuth2 flow to get access token (or use developer token for testing)
 * 4. Set environment variables in config/.env:
 *    PINTEREST_APP_ID=your_app_id
 *    PINTEREST_APP_SECRET=your_app_secret
 *    PINTEREST_ACCESS_TOKEN=your_access_token
 *    PINTEREST_AD_ACCOUNT_ID=549755885175
 * 
 * Testing in Sandbox:
 * - Without credentials, connector returns realistic mock data
 * - Mock data includes 3 campaigns, 4 ad groups, 4 ads, 3 audiences, 5 pins
 * - All CRUD operations work in sandbox mode
 * 
 * Ad Ops Use Cases:
 * - Pinterest visual discovery advertising
 * - Shopping & catalog campaigns
 * - Interest and keyword targeting
 * - Pin promotion and sponsored content
 * - E-commerce conversion tracking
 */

const fs = require('fs');
const path = require('path');

const name = 'Pinterest Ads';
const shortName = 'Pinterest';
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
const appId = env.PINTEREST_APP_ID || null;
const appSecret = env.PINTEREST_APP_SECRET || null;
let accessToken = env.PINTEREST_ACCESS_TOKEN || null;
const adAccountId = env.PINTEREST_AD_ACCOUNT_ID || null;

const hasPinterestAds = !!(accessToken && adAccountId);

// OAuth configuration
const oauth = {
  provider: 'pinterest',
  scopes: ['ads:read', 'ads:write', 'user_accounts:read', 'boards:read', 'pins:read', 'pins:write'],
  apiEndpoint: 'https://api.pinterest.com/v5',
  connected: hasPinterestAds,
  accountId: adAccountId ? `***${adAccountId.slice(-4)}` : null,
  tokenType: 'oauth2_access_token'
};

// API version
const API_VERSION = 'v5';
const BASE_URL = `https://api.pinterest.com/${API_VERSION}`;

// Tool definitions for MCP integration
const tools = [
  {
    name: 'pinterest_get_campaigns',
    description: 'List Pinterest campaigns with performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        entity_statuses: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'] },
          description: 'Filter by campaign status'
        },
        page_size: {
          type: 'number',
          description: 'Number of campaigns to return (default: 25, max: 100)',
          minimum: 1,
          maximum: 100
        },
        order: {
          type: 'string',
          enum: ['ASCENDING', 'DESCENDING'],
          description: 'Sort order'
        }
      }
    }
  },
  {
    name: 'pinterest_create_campaign',
    description: 'Create a new Pinterest Ads campaign',
    inputSchema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Campaign name (max 255 chars)' 
        },
        objective_type: {
          type: 'string',
          enum: ['AWARENESS', 'CONSIDERATION', 'CONVERSIONS'],
          description: 'Campaign objective'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial campaign status (default: PAUSED for safety)'
        },
        lifetime_spend_cap: {
          type: 'number',
          description: 'Lifetime budget in micro-currency (e.g., 10000000 = $1.00)'
        },
        daily_spend_cap: {
          type: 'number',
          description: 'Daily budget cap in micro-currency'
        },
        start_time: {
          type: 'string',
          description: 'Campaign start time (ISO 8601 format)'
        },
        end_time: {
          type: 'string',
          description: 'Campaign end time (ISO 8601 format)'
        },
        is_campaign_budget_optimization: {
          type: 'boolean',
          description: 'Enable campaign budget optimization (CBO)'
        }
      },
      required: ['name', 'objective_type']
    }
  },
  {
    name: 'pinterest_update_campaign',
    description: 'Update Pinterest campaign settings',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { 
          type: 'string', 
          description: 'Campaign ID' 
        },
        name: { 
          type: 'string', 
          description: 'New campaign name' 
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
          description: 'New campaign status'
        },
        lifetime_spend_cap: {
          type: 'number',
          description: 'Lifetime budget in micro-currency'
        },
        daily_spend_cap: {
          type: 'number',
          description: 'Daily budget cap in micro-currency'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'pinterest_get_ad_groups',
    description: 'List Pinterest ad groups with targeting and performance',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by campaign IDs (optional)'
        },
        entity_statuses: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'] },
          description: 'Filter by ad group status'
        },
        page_size: {
          type: 'number',
          description: 'Number of ad groups to return (default: 25, max: 100)',
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'pinterest_create_ad_group',
    description: 'Create an ad group with targeting and budget',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { 
          type: 'string', 
          description: 'Parent campaign ID' 
        },
        name: { 
          type: 'string', 
          description: 'Ad group name (max 255 chars)' 
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial status (default: PAUSED)'
        },
        budget_in_micro_currency: {
          type: 'number',
          description: 'Daily budget in micro-currency (e.g., 25000000 = $2.50)'
        },
        bid_in_micro_currency: {
          type: 'number',
          description: 'Bid amount in micro-currency'
        },
        optimization_goal_metadata: {
          type: 'object',
          properties: {
            conversion_tag_v3_goal_metadata: {
              type: 'object',
              properties: {
                attribution_windows: {
                  type: 'object',
                  properties: {
                    click_window_days: { type: 'number', enum: [0, 1, 7, 14, 30, 60] },
                    engagement_window_days: { type: 'number', enum: [0, 1, 7, 14, 30, 60] },
                    view_window_days: { type: 'number', enum: [0, 1, 7, 14, 30, 60] }
                  }
                }
              }
            }
          },
          description: 'Optimization goal settings'
        },
        billable_event: {
          type: 'string',
          enum: ['CLICKTHROUGH', 'IMPRESSION', 'VIDEO_V_50_MRC'],
          description: 'Billing event type'
        },
        targeting_spec: {
          type: 'object',
          properties: {
            GENDER: {
              type: 'array',
              items: { type: 'string', enum: ['MALE', 'FEMALE', 'UNISEX'] },
              description: 'Gender targeting'
            },
            AGE_BUCKET: {
              type: 'array',
              items: { type: 'string', enum: ['18-24', '25-34', '35-44', '45-49', '50-54', '55-64', '65+'] },
              description: 'Age range targeting'
            },
            GEO: {
              type: 'array',
              items: { type: 'string' },
              description: 'Country codes (e.g., ["US", "CA", "GB"])'
            },
            INTEREST: {
              type: 'array',
              items: { type: 'string' },
              description: 'Interest categories'
            },
            KEYWORD: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keyword targeting'
            },
            LOCALE: {
              type: 'array',
              items: { type: 'string' },
              description: 'Language codes (e.g., ["en-US", "es-MX"])'
            },
            LOCATION: {
              type: 'array',
              items: { type: 'string' },
              description: 'Location targeting (cities, regions)'
            },
            PLACEMENT: {
              type: 'array',
              items: { type: 'string', enum: ['BROWSE', 'SEARCH', 'ALL'] },
              description: 'Ad placement (default: ALL)'
            }
          },
          description: 'Targeting specification'
        },
        start_time: {
          type: 'string',
          description: 'Ad group start time (ISO 8601)'
        },
        end_time: {
          type: 'string',
          description: 'Ad group end time (ISO 8601)'
        }
      },
      required: ['campaign_id', 'name']
    }
  },
  {
    name: 'pinterest_update_ad_group',
    description: 'Update Pinterest ad group settings',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: { 
          type: 'string', 
          description: 'Ad group ID' 
        },
        name: { 
          type: 'string', 
          description: 'New ad group name' 
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
          description: 'New status'
        },
        budget_in_micro_currency: {
          type: 'number',
          description: 'New daily budget in micro-currency'
        },
        bid_in_micro_currency: {
          type: 'number',
          description: 'New bid amount in micro-currency'
        }
      },
      required: ['ad_group_id']
    }
  },
  {
    name: 'pinterest_get_ads',
    description: 'List Pinterest ads with creative details',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by ad group IDs (optional)'
        },
        campaign_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by campaign IDs (optional)'
        },
        entity_statuses: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'] },
          description: 'Filter by ad status'
        },
        page_size: {
          type: 'number',
          description: 'Number of ads to return (default: 25, max: 100)',
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'pinterest_create_ad',
    description: 'Create a Pinterest ad by linking a pin to an ad group',
    inputSchema: {
      type: 'object',
      properties: {
        ad_group_id: { 
          type: 'string', 
          description: 'Parent ad group ID' 
        },
        name: {
          type: 'string',
          description: 'Ad name for tracking (optional)'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial ad status (default: PAUSED)'
        },
        creative_type: {
          type: 'string',
          enum: ['REGULAR', 'VIDEO', 'SHOPPING', 'CAROUSEL', 'MAX_VIDEO', 'SHOP_THE_PIN', 'STORY'],
          description: 'Creative type'
        },
        pin_id: {
          type: 'string',
          description: 'Pin ID to promote (required for existing pins)'
        },
        is_pin_deleted: {
          type: 'boolean',
          description: 'Set to true to deactivate ad without deleting'
        },
        destination_url: {
          type: 'string',
          description: 'Destination URL (required for some creative types)'
        },
        android_deep_link: {
          type: 'string',
          description: 'Android app deep link'
        },
        ios_deep_link: {
          type: 'string',
          description: 'iOS app deep link'
        }
      },
      required: ['ad_group_id', 'creative_type']
    }
  },
  {
    name: 'pinterest_update_ad',
    description: 'Update Pinterest ad status or settings',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { 
          type: 'string', 
          description: 'Ad ID' 
        },
        name: {
          type: 'string',
          description: 'New ad name'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
          description: 'New ad status'
        },
        is_removable: {
          type: 'boolean',
          description: 'Whether ad can be deleted'
        }
      },
      required: ['ad_id']
    }
  },
  {
    name: 'pinterest_get_audiences',
    description: 'List custom audiences for targeting',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of audiences to return (default: 25, max: 100)',
          minimum: 1,
          maximum: 100
        },
        order: {
          type: 'string',
          enum: ['ASCENDING', 'DESCENDING'],
          description: 'Sort order'
        }
      }
    }
  },
  {
    name: 'pinterest_create_audience',
    description: 'Create a custom audience for targeting',
    inputSchema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Audience name' 
        },
        audience_type: {
          type: 'string',
          enum: ['CUSTOMER_LIST', 'VISITOR', 'ENGAGEMENT', 'ACTALIKE'],
          description: 'Audience type'
        },
        rule: {
          type: 'object',
          properties: {
            country: {
              type: 'string',
              description: 'Country code (required for customer lists)'
            },
            retention_days: {
              type: 'number',
              description: 'Retention period in days (e.g., 30, 90, 180)'
            },
            engagement_type: {
              type: 'string',
              enum: ['CLICK', 'SAVE', 'CLOSEUP', 'COMMENT'],
              description: 'Engagement type (for ENGAGEMENT audiences)'
            },
            event_type: {
              type: 'string',
              description: 'Pixel event type (for VISITOR audiences)'
            }
          },
          description: 'Audience definition rules'
        },
        description: {
          type: 'string',
          description: 'Audience description'
        },
        seed_id: {
          type: 'string',
          description: 'Source audience ID (for ACTALIKE/lookalike audiences)'
        }
      },
      required: ['name', 'audience_type']
    }
  },
  {
    name: 'pinterest_get_insights',
    description: 'Get performance metrics for campaigns, ad groups, or ads',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['CAMPAIGN', 'AD_GROUP', 'AD', 'PIN_PROMOTION'],
          description: 'Reporting level'
        },
        granularity: {
          type: 'string',
          enum: ['TOTAL', 'DAY', 'HOUR', 'WEEK', 'MONTH'],
          description: 'Time granularity (default: TOTAL)'
        },
        start_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD, required)'
        },
        end_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD, required)'
        },
        campaign_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by campaign IDs'
        },
        ad_group_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by ad group IDs'
        },
        ad_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by ad IDs'
        },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Metrics to retrieve (e.g., IMPRESSION, CLICKTHROUGH, SPEND, CTR_2, ECPM)'
        }
      },
      required: ['level', 'start_date', 'end_date']
    }
  },
  {
    name: 'pinterest_get_ad_accounts',
    description: 'List accessible Pinterest ad accounts',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of accounts to return (default: 25)',
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'pinterest_get_pins',
    description: 'List organic pins from user boards',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of pins to return (default: 25, max: 100)',
          minimum: 1,
          maximum: 100
        },
        pin_filter: {
          type: 'string',
          enum: ['all', 'promoted', 'organic'],
          description: 'Filter pins by type'
        }
      }
    }
  },
  {
    name: 'pinterest_create_pin',
    description: 'Create a new pin for promotion',
    inputSchema: {
      type: 'object',
      properties: {
        board_id: {
          type: 'string',
          description: 'Board ID to save pin to (required)'
        },
        title: {
          type: 'string',
          description: 'Pin title (max 100 characters, required)'
        },
        description: {
          type: 'string',
          description: 'Pin description (max 500 characters)'
        },
        link: {
          type: 'string',
          description: 'Destination URL when pin is clicked'
        },
        media_source: {
          type: 'object',
          properties: {
            source_type: {
              type: 'string',
              enum: ['image_url', 'image_base64', 'video_url'],
              description: 'Media source type'
            },
            url: {
              type: 'string',
              description: 'Image or video URL'
            },
            cover_image_url: {
              type: 'string',
              description: 'Video cover image URL'
            }
          },
          required: ['source_type'],
          description: 'Media source (image or video)'
        },
        alt_text: {
          type: 'string',
          description: 'Alternative text for accessibility'
        },
        dominant_color: {
          type: 'string',
          description: 'Dominant color hex code (e.g., #6E7874)'
        }
      },
      required: ['board_id', 'title', 'media_source']
    }
  }
];

// =============================================================================
// MOCK DATA (Sandbox Mode)
// =============================================================================

const MOCK_CAMPAIGNS = [
  {
    id: '549755885175001',
    ad_account_id: adAccountId || '549755885175',
    name: 'Spring Fashion Campaign',
    status: 'ACTIVE',
    objective_type: 'CONSIDERATION',
    created_time: 1704070800,
    updated_time: 1707836400,
    start_time: 1706745600,
    end_time: 1711929600,
    lifetime_spend_cap: 1500000000, // $150 in micro-currency
    daily_spend_cap: 50000000, // $5/day
    is_campaign_budget_optimization: true,
    is_flexible_daily_budgets: true
  },
  {
    id: '549755885175002',
    ad_account_id: adAccountId || '549755885175',
    name: 'Home Decor - Q1 2026',
    status: 'ACTIVE',
    objective_type: 'CONVERSIONS',
    created_time: 1704243600,
    updated_time: 1707922800,
    start_time: 1704326400,
    end_time: 1712102400,
    lifetime_spend_cap: 3000000000, // $300
    daily_spend_cap: 100000000, // $10/day
    is_campaign_budget_optimization: false,
    is_flexible_daily_budgets: false
  },
  {
    id: '549755885175003',
    ad_account_id: adAccountId || '549755885175',
    name: 'Recipe Content - Awareness',
    status: 'PAUSED',
    objective_type: 'AWARENESS',
    created_time: 1705366800,
    updated_time: 1707664800,
    start_time: 1705453200,
    end_time: 1713225600,
    lifetime_spend_cap: null,
    daily_spend_cap: 30000000, // $3/day
    is_campaign_budget_optimization: true,
    is_flexible_daily_budgets: true
  }
];

const MOCK_AD_GROUPS = [
  {
    id: '549755885176001',
    ad_account_id: adAccountId || '549755885175',
    campaign_id: '549755885175001',
    name: 'Women 25-45 Fashion Lovers',
    status: 'ACTIVE',
    budget_in_micro_currency: 25000000, // $2.50/day
    bid_in_micro_currency: 2000000, // $0.20 CPM
    optimization_goal_metadata: {
      conversion_tag_v3_goal_metadata: {
        attribution_windows: {
          click_window_days: 30,
          engagement_window_days: 30,
          view_window_days: 1
        }
      }
    },
    billable_event: 'IMPRESSION',
    targeting_spec: {
      GENDER: ['FEMALE'],
      AGE_BUCKET: ['25-34', '35-44'],
      GEO: ['US'],
      INTEREST: ['Fashion', 'Womens fashion', 'Shopping'],
      PLACEMENT: ['ALL']
    },
    start_time: 1706745600,
    end_time: null,
    created_time: 1706745600,
    updated_time: 1707922800
  },
  {
    id: '549755885176002',
    ad_account_id: adAccountId || '549755885175',
    campaign_id: '549755885175002',
    name: 'Home Decor Enthusiasts',
    status: 'ACTIVE',
    budget_in_micro_currency: 50000000, // $5/day
    bid_in_micro_currency: 3500000, // $0.35 CPM
    optimization_goal_metadata: {
      conversion_tag_v3_goal_metadata: {
        attribution_windows: {
          click_window_days: 30,
          engagement_window_days: 7,
          view_window_days: 1
        }
      }
    },
    billable_event: 'CLICKTHROUGH',
    targeting_spec: {
      GENDER: ['FEMALE', 'MALE'],
      AGE_BUCKET: ['25-34', '35-44', '45-49'],
      GEO: ['US', 'CA'],
      INTEREST: ['Home decor', 'Interior design', 'DIY'],
      KEYWORD: ['home decor ideas', 'living room design', 'bedroom inspiration'],
      PLACEMENT: ['SEARCH']
    },
    start_time: 1704326400,
    end_time: null,
    created_time: 1704326400,
    updated_time: 1707836400
  },
  {
    id: '549755885176003',
    ad_account_id: adAccountId || '549755885175',
    campaign_id: '549755885175002',
    name: 'Lookalike - Website Purchasers',
    status: 'ACTIVE',
    budget_in_micro_currency: 50000000, // $5/day
    bid_in_micro_currency: 4000000, // $0.40 CPM
    optimization_goal_metadata: {
      conversion_tag_v3_goal_metadata: {
        attribution_windows: {
          click_window_days: 14,
          engagement_window_days: 14,
          view_window_days: 1
        }
      }
    },
    billable_event: 'IMPRESSION',
    targeting_spec: {
      GENDER: ['FEMALE', 'MALE'],
      AGE_BUCKET: ['25-34', '35-44', '45-49', '50-54'],
      GEO: ['US'],
      PLACEMENT: ['ALL']
    },
    start_time: 1705540800,
    end_time: null,
    created_time: 1705540800,
    updated_time: 1707750000
  },
  {
    id: '549755885176004',
    ad_account_id: adAccountId || '549755885175',
    campaign_id: '549755885175003',
    name: 'Recipe Seekers - Broad',
    status: 'PAUSED',
    budget_in_micro_currency: 30000000, // $3/day
    bid_in_micro_currency: 1500000, // $0.15 CPM
    optimization_goal_metadata: null,
    billable_event: 'IMPRESSION',
    targeting_spec: {
      GENDER: ['FEMALE', 'MALE'],
      AGE_BUCKET: ['25-34', '35-44', '45-49', '50-54'],
      GEO: ['US', 'CA', 'GB', 'AU'],
      INTEREST: ['Cooking', 'Recipes', 'Food'],
      KEYWORD: ['easy recipes', 'dinner ideas', 'meal prep'],
      PLACEMENT: ['BROWSE']
    },
    start_time: 1705453200,
    end_time: null,
    created_time: 1705453200,
    updated_time: 1707664800
  }
];

const MOCK_ADS = [
  {
    id: '549755885177001',
    ad_account_id: adAccountId || '549755885175',
    ad_group_id: '549755885176001',
    campaign_id: '549755885175001',
    name: 'Spring Dress Collection - Pin 1',
    status: 'ACTIVE',
    creative_type: 'REGULAR',
    pin_id: '1234567890123456789',
    destination_url: 'https://example.com/spring-dresses',
    is_pin_deleted: false,
    is_removable: true,
    created_time: 1706745600,
    updated_time: 1707836400
  },
  {
    id: '549755885177002',
    ad_account_id: adAccountId || '549755885175',
    ad_group_id: '549755885176001',
    campaign_id: '549755885175001',
    name: 'Spring Accessories - Pin 2',
    status: 'ACTIVE',
    creative_type: 'REGULAR',
    pin_id: '1234567890123456790',
    destination_url: 'https://example.com/spring-accessories',
    is_pin_deleted: false,
    is_removable: true,
    created_time: 1706832000,
    updated_time: 1707922800
  },
  {
    id: '549755885177003',
    ad_account_id: adAccountId || '549755885175',
    ad_group_id: '549755885176002',
    campaign_id: '549755885175002',
    name: 'Living Room Ideas - Carousel',
    status: 'ACTIVE',
    creative_type: 'CAROUSEL',
    pin_id: '1234567890123456791',
    destination_url: 'https://example.com/living-room-decor',
    is_pin_deleted: false,
    is_removable: true,
    created_time: 1704326400,
    updated_time: 1707750000
  },
  {
    id: '549755885177004',
    ad_account_id: adAccountId || '549755885175',
    ad_group_id: '549755885176004',
    campaign_id: '549755885175003',
    name: 'Quick Dinner Recipes - Video',
    status: 'PAUSED',
    creative_type: 'VIDEO',
    pin_id: '1234567890123456792',
    destination_url: 'https://example.com/recipes',
    is_pin_deleted: false,
    is_removable: true,
    created_time: 1705453200,
    updated_time: 1707664800
  }
];

const MOCK_AUDIENCES = [
  {
    id: '549755885178001',
    ad_account_id: adAccountId || '549755885175',
    name: 'Website Visitors - Last 30 Days',
    audience_type: 'VISITOR',
    description: 'Users who visited our website in the past 30 days',
    rule: {
      country: 'US',
      retention_days: 30,
      event_type: 'pagevisit'
    },
    size: 15000,
    status: 'READY',
    created_timestamp: 1703847600,
    updated_timestamp: 1707750000
  },
  {
    id: '549755885178002',
    ad_account_id: adAccountId || '549755885175',
    name: 'Email Subscribers - March 2026',
    audience_type: 'CUSTOMER_LIST',
    description: 'Uploaded customer list from email database',
    rule: {
      country: 'US',
      retention_days: 180
    },
    size: 8500,
    status: 'READY',
    created_timestamp: 1704970800,
    updated_timestamp: 1705057200
  },
  {
    id: '549755885178003',
    ad_account_id: adAccountId || '549755885175',
    name: 'Pin Engagers - Lookalike 1%',
    audience_type: 'ACTALIKE',
    description: '1% lookalike audience based on engaged users',
    rule: {
      country: 'US',
      retention_days: 90
    },
    seed_id: '549755885178001',
    size: 2100000,
    status: 'READY',
    created_timestamp: 1705662000,
    updated_timestamp: 1706266800
  }
];

const MOCK_PINS = [
  {
    id: '1234567890123456789',
    created_at: '2026-01-15T10:00:00Z',
    link: 'https://example.com/spring-dresses',
    title: 'Spring Dress Collection 2026',
    description: 'Discover our latest spring fashion collection. Flowy dresses perfect for any occasion.',
    dominant_color: '#FFB6C1',
    alt_text: 'Woman wearing a floral spring dress',
    board_id: '549755885179001',
    board_section_id: null,
    media: {
      media_type: 'image',
      images: {
        '150x150': { width: 150, height: 150, url: 'https://i.pinimg.com/150x150/example1.jpg' },
        '400x300': { width: 400, height: 300, url: 'https://i.pinimg.com/400x300/example1.jpg' },
        '600x': { width: 600, height: 900, url: 'https://i.pinimg.com/600x/example1.jpg' }
      }
    }
  },
  {
    id: '1234567890123456790',
    created_at: '2026-01-16T14:30:00Z',
    link: 'https://example.com/spring-accessories',
    title: 'Spring Accessories Trends',
    description: 'Complete your look with these must-have spring accessories.',
    dominant_color: '#FFD700',
    alt_text: 'Spring handbags and jewelry',
    board_id: '549755885179001',
    board_section_id: null,
    media: {
      media_type: 'image',
      images: {
        '150x150': { width: 150, height: 150, url: 'https://i.pinimg.com/150x150/example2.jpg' },
        '400x300': { width: 400, height: 300, url: 'https://i.pinimg.com/400x300/example2.jpg' },
        '600x': { width: 600, height: 900, url: 'https://i.pinimg.com/600x/example2.jpg' }
      }
    }
  },
  {
    id: '1234567890123456791',
    created_at: '2026-01-05T09:00:00Z',
    link: 'https://example.com/living-room-decor',
    title: 'Modern Living Room Ideas',
    description: '10 stunning living room designs to transform your space.',
    dominant_color: '#8B4513',
    alt_text: 'Modern living room with neutral tones',
    board_id: '549755885179002',
    board_section_id: null,
    media: {
      media_type: 'image',
      images: {
        '150x150': { width: 150, height: 150, url: 'https://i.pinimg.com/150x150/example3.jpg' },
        '400x300': { width: 400, height: 300, url: 'https://i.pinimg.com/400x300/example3.jpg' },
        '600x': { width: 600, height: 900, url: 'https://i.pinimg.com/600x/example3.jpg' }
      }
    }
  },
  {
    id: '1234567890123456792',
    created_at: '2026-01-20T16:00:00Z',
    link: 'https://example.com/recipes',
    title: '15-Minute Dinner Recipes',
    description: 'Quick and easy dinner recipes for busy weeknights.',
    dominant_color: '#FF6347',
    alt_text: 'Delicious pasta dish on a plate',
    board_id: '549755885179003',
    board_section_id: null,
    media: {
      media_type: 'video',
      videos: {
        video_list: {
          V_720P: {
            width: 720,
            height: 1280,
            duration: 45000,
            thumbnail: 'https://i.pinimg.com/600x/example4_thumb.jpg',
            url: 'https://v.pinimg.com/videos/example4.mp4'
          }
        }
      }
    }
  },
  {
    id: '1234567890123456793',
    created_at: '2026-02-01T11:30:00Z',
    link: 'https://example.com/bedroom-design',
    title: 'Cozy Bedroom Makeover',
    description: 'Create a relaxing bedroom sanctuary with these design tips.',
    dominant_color: '#E6E6FA',
    alt_text: 'Cozy bedroom with soft lighting',
    board_id: '549755885179002',
    board_section_id: null,
    media: {
      media_type: 'image',
      images: {
        '150x150': { width: 150, height: 150, url: 'https://i.pinimg.com/150x150/example5.jpg' },
        '400x300': { width: 400, height: 300, url: 'https://i.pinimg.com/400x300/example5.jpg' },
        '600x': { width: 600, height: 900, url: 'https://i.pinimg.com/600x/example5.jpg' }
      }
    }
  }
];

const MOCK_INSIGHTS = {
  'campaign_549755885175001': {
    campaign_id: '549755885175001',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      IMPRESSION: 125000,
      CLICKTHROUGH: 2500,
      SPEND_IN_DOLLAR: 42.50,
      CTR_2: 2.0,
      ECPM: 0.34,
      ECPC: 0.017,
      TOTAL_ENGAGEMENT: 3800,
      ENGAGEMENT_RATE: 3.04,
      SAVE: 850,
      OUTBOUND_CLICK: 2200,
      TOTAL_CONVERSIONS: 75,
      CPA: 0.57,
      ECTR: 1.76,
      VIDEO_MRC_VIEW: 0,
      VIDEO_AVG_WATCH_TIME_SECS: 0
    }
  },
  'campaign_549755885175002': {
    campaign_id: '549755885175002',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      IMPRESSION: 89000,
      CLICKTHROUGH: 1780,
      SPEND_IN_DOLLAR: 78.25,
      CTR_2: 2.0,
      ECPM: 0.88,
      ECPC: 0.044,
      TOTAL_ENGAGEMENT: 2670,
      ENGAGEMENT_RATE: 3.0,
      SAVE: 445,
      OUTBOUND_CLICK: 1580,
      TOTAL_CONVERSIONS: 138,
      CPA: 0.57,
      ECTR: 1.78,
      VIDEO_MRC_VIEW: 0,
      VIDEO_AVG_WATCH_TIME_SECS: 0
    }
  },
  'ad_group_549755885176001': {
    ad_group_id: '549755885176001',
    campaign_id: '549755885175001',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      IMPRESSION: 125000,
      CLICKTHROUGH: 2500,
      SPEND_IN_DOLLAR: 42.50,
      CTR_2: 2.0,
      ECPM: 0.34,
      ECPC: 0.017,
      TOTAL_ENGAGEMENT: 3800,
      ENGAGEMENT_RATE: 3.04,
      SAVE: 850,
      OUTBOUND_CLICK: 2200,
      TOTAL_CONVERSIONS: 75,
      CPA: 0.57
    }
  },
  'ad_549755885177001': {
    ad_id: '549755885177001',
    ad_group_id: '549755885176001',
    campaign_id: '549755885175001',
    pin_id: '1234567890123456789',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      IMPRESSION: 68000,
      CLICKTHROUGH: 1360,
      SPEND_IN_DOLLAR: 23.12,
      CTR_2: 2.0,
      ECPM: 0.34,
      ECPC: 0.017,
      TOTAL_ENGAGEMENT: 2040,
      ENGAGEMENT_RATE: 3.0,
      SAVE: 475,
      OUTBOUND_CLICK: 1200,
      TOTAL_CONVERSIONS: 42,
      CPA: 0.55
    }
  }
};

// =============================================================================
// API REQUEST HANDLER
// =============================================================================

async function apiRequest(method, endpoint, data = null, options = {}) {
  // Sandbox mode - return mock data
  if (!hasPinterestAds) {
    return getMockData(endpoint, method, data);
  }

  // Real API call (live mode)
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'AdOpsCommand/1.0'
  };

  const fetchOptions = {
    method: method,
    headers: headers
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Pinterest API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.message || errorJson.error_description || errorMessage;
      } catch (e) {
        // Error body not JSON
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    // Rate limiting - implement exponential backoff
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      const retryAfter = options.retryCount ? Math.pow(2, options.retryCount) * 1000 : 1000;
      
      if (!options.retryCount || options.retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return apiRequest(method, endpoint, data, { ...options, retryCount: (options.retryCount || 0) + 1 });
      }
    }
    
    throw error;
  }
}

// =============================================================================
// MOCK DATA GENERATOR
// =============================================================================

function getMockData(endpoint, method, data) {
  // Parse endpoint to determine what mock data to return
  
  // Get campaigns
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/campaigns') && method === 'GET') {
    const statusFilter = data?.entity_statuses;
    let campaigns = [...MOCK_CAMPAIGNS];
    
    if (statusFilter && statusFilter.length > 0) {
      campaigns = campaigns.filter(c => statusFilter.includes(c.status));
    }
    
    return {
      items: campaigns,
      bookmark: null
    };
  }
  
  // Create campaign
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/campaigns') && method === 'POST') {
    const newId = `549755885175${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    return {
      items: [{
        id: newId,
        ad_account_id: adAccountId || '549755885175',
        name: data.name,
        status: data.status || 'PAUSED',
        objective_type: data.objective_type,
        created_time: Math.floor(Date.now() / 1000),
        updated_time: Math.floor(Date.now() / 1000),
        start_time: data.start_time ? Math.floor(new Date(data.start_time).getTime() / 1000) : Math.floor(Date.now() / 1000),
        end_time: data.end_time ? Math.floor(new Date(data.end_time).getTime() / 1000) : null,
        lifetime_spend_cap: data.lifetime_spend_cap || null,
        daily_spend_cap: data.daily_spend_cap || null,
        is_campaign_budget_optimization: data.is_campaign_budget_optimization || false
      }]
    };
  }
  
  // Update campaign
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/campaigns') && method === 'PATCH') {
    return {
      items: [{
        id: data.campaign_id || endpoint.split('/campaigns?')[1]?.split('&')[0],
        ...data,
        updated_time: Math.floor(Date.now() / 1000)
      }]
    };
  }
  
  // Get ad groups
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ad_groups') && method === 'GET') {
    const campaignFilter = data?.campaign_ids;
    const statusFilter = data?.entity_statuses;
    let adGroups = [...MOCK_AD_GROUPS];
    
    if (campaignFilter && campaignFilter.length > 0) {
      adGroups = adGroups.filter(ag => campaignFilter.includes(ag.campaign_id));
    }
    
    if (statusFilter && statusFilter.length > 0) {
      adGroups = adGroups.filter(ag => statusFilter.includes(ag.status));
    }
    
    return {
      items: adGroups,
      bookmark: null
    };
  }
  
  // Create ad group
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ad_groups') && method === 'POST') {
    const newId = `549755885176${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    return {
      items: [{
        id: newId,
        ad_account_id: adAccountId || '549755885175',
        campaign_id: data.campaign_id,
        name: data.name,
        status: data.status || 'PAUSED',
        budget_in_micro_currency: data.budget_in_micro_currency || 25000000,
        bid_in_micro_currency: data.bid_in_micro_currency || 2000000,
        optimization_goal_metadata: data.optimization_goal_metadata || null,
        billable_event: data.billable_event || 'IMPRESSION',
        targeting_spec: data.targeting_spec || {},
        start_time: data.start_time ? Math.floor(new Date(data.start_time).getTime() / 1000) : Math.floor(Date.now() / 1000),
        end_time: data.end_time ? Math.floor(new Date(data.end_time).getTime() / 1000) : null,
        created_time: Math.floor(Date.now() / 1000),
        updated_time: Math.floor(Date.now() / 1000)
      }]
    };
  }
  
  // Update ad group
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ad_groups') && method === 'PATCH') {
    return {
      items: [{
        id: data.ad_group_id || endpoint.split('/ad_groups?')[1]?.split('&')[0],
        ...data,
        updated_time: Math.floor(Date.now() / 1000)
      }]
    };
  }
  
  // Get ads
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ads') && !endpoint.includes('/ad_groups') && method === 'GET') {
    const adGroupFilter = data?.ad_group_ids;
    const campaignFilter = data?.campaign_ids;
    const statusFilter = data?.entity_statuses;
    let ads = [...MOCK_ADS];
    
    if (adGroupFilter && adGroupFilter.length > 0) {
      ads = ads.filter(ad => adGroupFilter.includes(ad.ad_group_id));
    }
    
    if (campaignFilter && campaignFilter.length > 0) {
      ads = ads.filter(ad => campaignFilter.includes(ad.campaign_id));
    }
    
    if (statusFilter && statusFilter.length > 0) {
      ads = ads.filter(ad => statusFilter.includes(ad.status));
    }
    
    return {
      items: ads,
      bookmark: null
    };
  }
  
  // Create ad
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ads') && method === 'POST') {
    const newId = `549755885177${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    return {
      items: [{
        id: newId,
        ad_account_id: adAccountId || '549755885175',
        ad_group_id: data.ad_group_id,
        name: data.name || `Ad ${newId}`,
        status: data.status || 'PAUSED',
        creative_type: data.creative_type,
        pin_id: data.pin_id || `pin_${Math.floor(Math.random() * 1000000000)}`,
        destination_url: data.destination_url || null,
        is_pin_deleted: false,
        is_removable: true,
        created_time: Math.floor(Date.now() / 1000),
        updated_time: Math.floor(Date.now() / 1000)
      }]
    };
  }
  
  // Update ad
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/ads') && method === 'PATCH') {
    return {
      items: [{
        id: data.ad_id || endpoint.split('/ads?')[1]?.split('&')[0],
        ...data,
        updated_time: Math.floor(Date.now() / 1000)
      }]
    };
  }
  
  // Get audiences
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/audiences') && method === 'GET') {
    return {
      items: MOCK_AUDIENCES,
      bookmark: null
    };
  }
  
  // Create audience
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/audiences') && method === 'POST') {
    const newId = `549755885178${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    return {
      id: newId,
      ad_account_id: adAccountId || '549755885175',
      name: data.name,
      audience_type: data.audience_type,
      description: data.description || null,
      rule: data.rule || null,
      seed_id: data.seed_id || null,
      size: 0,
      status: 'PROCESSING',
      created_timestamp: Math.floor(Date.now() / 1000),
      updated_timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  // Get insights (analytics)
  if (endpoint.includes('/ad_accounts/') && endpoint.includes('/analytics') && method === 'GET') {
    const level = data?.level || 'CAMPAIGN';
    const campaignIds = data?.campaign_ids || [];
    const adGroupIds = data?.ad_group_ids || [];
    const adIds = data?.ad_ids || [];
    
    let insights = [];
    
    if (level === 'CAMPAIGN' && campaignIds.length > 0) {
      campaignIds.forEach(cid => {
        if (MOCK_INSIGHTS[`campaign_${cid}`]) {
          insights.push(MOCK_INSIGHTS[`campaign_${cid}`]);
        }
      });
    } else if (level === 'AD_GROUP' && adGroupIds.length > 0) {
      adGroupIds.forEach(agid => {
        if (MOCK_INSIGHTS[`ad_group_${agid}`]) {
          insights.push(MOCK_INSIGHTS[`ad_group_${agid}`]);
        }
      });
    } else if (level === 'AD' && adIds.length > 0) {
      adIds.forEach(aid => {
        if (MOCK_INSIGHTS[`ad_${aid}`]) {
          insights.push(MOCK_INSIGHTS[`ad_${aid}`]);
        }
      });
    } else if (level === 'CAMPAIGN') {
      // Return all campaign insights
      insights = [
        MOCK_INSIGHTS['campaign_549755885175001'],
        MOCK_INSIGHTS['campaign_549755885175002']
      ];
    }
    
    return insights;
  }
  
  // Get ad accounts
  if (endpoint.includes('/ad_accounts') && !endpoint.includes('/campaigns') && !endpoint.includes('/ad_groups') && method === 'GET') {
    return {
      items: [
        {
          id: adAccountId || '549755885175',
          name: 'Demo Ad Account',
          owner: {
            username: 'demo_user'
          },
          country: 'US',
          currency: 'USD'
        }
      ],
      bookmark: null
    };
  }
  
  // Get pins
  if (endpoint.includes('/pins') && method === 'GET') {
    const pinFilter = data?.pin_filter;
    let pins = [...MOCK_PINS];
    
    // Filter logic (simplified for mock)
    if (pinFilter === 'promoted') {
      pins = pins.slice(0, 2); // First 2 are promoted
    } else if (pinFilter === 'organic') {
      pins = pins.slice(2); // Rest are organic
    }
    
    return {
      items: pins,
      bookmark: null
    };
  }
  
  // Create pin
  if (endpoint.includes('/pins') && method === 'POST') {
    const newId = `${Math.floor(Math.random() * 10000000000000000000)}`;
    return {
      id: newId,
      created_at: new Date().toISOString(),
      link: data.link || null,
      title: data.title,
      description: data.description || null,
      dominant_color: data.dominant_color || '#FFFFFF',
      alt_text: data.alt_text || null,
      board_id: data.board_id,
      board_section_id: data.board_section_id || null,
      media: {
        media_type: data.media_source?.source_type === 'video_url' ? 'video' : 'image',
        images: data.media_source?.source_type === 'image_url' ? {
          '600x': { width: 600, height: 900, url: data.media_source.url }
        } : null,
        videos: data.media_source?.source_type === 'video_url' ? {
          video_list: {
            V_720P: { width: 720, height: 1280, url: data.media_source.url }
          }
        } : null
      }
    };
  }
  
  // Default response
  return {
    error: 'Endpoint not mocked',
    endpoint: endpoint,
    method: method
  };
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

async function testConnection() {
  if (!hasPinterestAds) {
    return {
      connected: false,
      mode: 'sandbox',
      status: 'ok',
      message: 'Running in sandbox mode with mock data. Configure PINTEREST_ACCESS_TOKEN and PINTEREST_AD_ACCOUNT_ID to connect to real Pinterest Ads API.'
    };
  }

  try {
    const response = await apiRequest('GET', '/user_account');
    
    return {
      connected: true,
      mode: 'live',
      status: 'ok',
      username: response.username,
      account_type: response.account_type,
      profile_image: response.profile_image
    };
  } catch (error) {
    return {
      connected: false,
      mode: 'live',
      status: 'error',
      error: error.message
    };
  }
}

async function getCampaigns(params = {}) {
  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/campaigns`;
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function createCampaign(params) {
  if (!params.name || !params.objective_type) {
    throw new Error('name and objective_type are required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/campaigns`;
  const payload = {
    name: params.name,
    ad_account_id: adAccountId || '549755885175',
    objective_type: params.objective_type,
    status: params.status || 'PAUSED',
    lifetime_spend_cap: params.lifetime_spend_cap || null,
    daily_spend_cap: params.daily_spend_cap || null,
    start_time: params.start_time || null,
    end_time: params.end_time || null,
    is_campaign_budget_optimization: params.is_campaign_budget_optimization || false
  };

  const result = await apiRequest('POST', endpoint, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    sandbox: !hasPinterestAds
  };
}

async function updateCampaign(params) {
  if (!params.campaign_id) {
    throw new Error('campaign_id is required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/campaigns`;
  const payload = {
    campaign_id: params.campaign_id,
    ...params
  };
  
  delete payload.campaign_id; // Remove from body, it's in query
  
  const queryParams = `campaign_ids=${params.campaign_id}`;
  const result = await apiRequest('PATCH', `${endpoint}?${queryParams}`, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    success: true,
    sandbox: !hasPinterestAds
  };
}

async function getAdGroups(params = {}) {
  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ad_groups`;
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function createAdGroup(params) {
  if (!params.campaign_id || !params.name) {
    throw new Error('campaign_id and name are required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ad_groups`;
  const payload = {
    name: params.name,
    ad_account_id: adAccountId || '549755885175',
    campaign_id: params.campaign_id,
    status: params.status || 'PAUSED',
    budget_in_micro_currency: params.budget_in_micro_currency || null,
    bid_in_micro_currency: params.bid_in_micro_currency || null,
    optimization_goal_metadata: params.optimization_goal_metadata || null,
    billable_event: params.billable_event || 'IMPRESSION',
    targeting_spec: params.targeting_spec || {},
    start_time: params.start_time || null,
    end_time: params.end_time || null
  };

  const result = await apiRequest('POST', endpoint, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    sandbox: !hasPinterestAds
  };
}

async function updateAdGroup(params) {
  if (!params.ad_group_id) {
    throw new Error('ad_group_id is required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ad_groups`;
  const payload = {
    ad_group_id: params.ad_group_id,
    ...params
  };
  
  delete payload.ad_group_id;
  
  const queryParams = `ad_group_ids=${params.ad_group_id}`;
  const result = await apiRequest('PATCH', `${endpoint}?${queryParams}`, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    success: true,
    sandbox: !hasPinterestAds
  };
}

async function getAds(params = {}) {
  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ads`;
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function createAd(params) {
  if (!params.ad_group_id || !params.creative_type) {
    throw new Error('ad_group_id and creative_type are required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ads`;
  const payload = {
    ad_group_id: params.ad_group_id,
    ad_account_id: adAccountId || '549755885175',
    name: params.name || null,
    status: params.status || 'PAUSED',
    creative_type: params.creative_type,
    pin_id: params.pin_id || null,
    destination_url: params.destination_url || null,
    android_deep_link: params.android_deep_link || null,
    ios_deep_link: params.ios_deep_link || null,
    is_pin_deleted: params.is_pin_deleted || false
  };

  const result = await apiRequest('POST', endpoint, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    sandbox: !hasPinterestAds
  };
}

async function updateAd(params) {
  if (!params.ad_id) {
    throw new Error('ad_id is required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/ads`;
  const payload = {
    ad_id: params.ad_id,
    ...params
  };
  
  delete payload.ad_id;
  
  const queryParams = `ad_ids=${params.ad_id}`;
  const result = await apiRequest('PATCH', `${endpoint}?${queryParams}`, payload);
  
  return {
    data: result.items ? result.items[0] : result,
    success: true,
    sandbox: !hasPinterestAds
  };
}

async function getAudiences(params = {}) {
  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/audiences`;
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function createAudience(params) {
  if (!params.name || !params.audience_type) {
    throw new Error('name and audience_type are required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/audiences`;
  const payload = {
    ad_account_id: adAccountId || '549755885175',
    name: params.name,
    audience_type: params.audience_type,
    description: params.description || null,
    rule: params.rule || null,
    seed_id: params.seed_id || null
  };

  const result = await apiRequest('POST', endpoint, payload);
  
  return {
    data: result,
    sandbox: !hasPinterestAds
  };
}

async function getInsights(params) {
  if (!params.level || !params.start_date || !params.end_date) {
    throw new Error('level, start_date, and end_date are required');
  }

  const endpoint = `/ad_accounts/${adAccountId || '549755885175'}/analytics`;
  const queryParams = {
    level: params.level,
    granularity: params.granularity || 'TOTAL',
    start_date: params.start_date,
    end_date: params.end_date,
    campaign_ids: params.campaign_ids || [],
    ad_group_ids: params.ad_group_ids || [],
    ad_ids: params.ad_ids || [],
    columns: params.columns || ['IMPRESSION', 'CLICKTHROUGH', 'SPEND_IN_DOLLAR', 'CTR_2', 'ECPM', 'ECPC']
  };

  const result = await apiRequest('GET', endpoint, queryParams);
  
  return {
    data: Array.isArray(result) ? result : [result],
    count: Array.isArray(result) ? result.length : 1,
    sandbox: !hasPinterestAds
  };
}

async function getAdAccounts(params = {}) {
  const endpoint = '/ad_accounts';
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function getPins(params = {}) {
  const endpoint = '/pins';
  const result = await apiRequest('GET', endpoint, params);
  
  return {
    data: result.items || result,
    count: result.items ? result.items.length : 0,
    sandbox: !hasPinterestAds
  };
}

async function createPin(params) {
  if (!params.board_id || !params.title || !params.media_source) {
    throw new Error('board_id, title, and media_source are required');
  }

  const endpoint = '/pins';
  const payload = {
    board_id: params.board_id,
    title: params.title,
    description: params.description || null,
    link: params.link || null,
    media_source: params.media_source,
    alt_text: params.alt_text || null,
    dominant_color: params.dominant_color || null
  };

  const result = await apiRequest('POST', endpoint, payload);
  
  return {
    data: result,
    sandbox: !hasPinterestAds
  };
}

// =============================================================================
// MCP INTEGRATION
// =============================================================================

async function handleToolCall(toolName, params) {
  try {
    switch (toolName) {
      case 'pinterest_get_campaigns':
        return await getCampaigns(params);
      
      case 'pinterest_create_campaign':
        return await createCampaign(params);
      
      case 'pinterest_update_campaign':
        return await updateCampaign(params);
      
      case 'pinterest_get_ad_groups':
        return await getAdGroups(params);
      
      case 'pinterest_create_ad_group':
        return await createAdGroup(params);
      
      case 'pinterest_update_ad_group':
        return await updateAdGroup(params);
      
      case 'pinterest_get_ads':
        return await getAds(params);
      
      case 'pinterest_create_ad':
        return await createAd(params);
      
      case 'pinterest_update_ad':
        return await updateAd(params);
      
      case 'pinterest_get_audiences':
        return await getAudiences(params);
      
      case 'pinterest_create_audience':
        return await createAudience(params);
      
      case 'pinterest_get_insights':
        return await getInsights(params);
      
      case 'pinterest_get_ad_accounts':
        return await getAdAccounts(params);
      
      case 'pinterest_get_pins':
        return await getPins(params);
      
      case 'pinterest_create_pin':
        return await createPin(params);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return {
      error: error.message,
      tool: toolName,
      params: params
    };
  }
}

function getTools() {
  return tools;
}

function getInfo() {
  return {
    name: name,
    shortName: shortName,
    version: version,
    status: status,
    connected: hasPinterestAds,
    mode: hasPinterestAds ? 'live' : 'sandbox',
    sandbox: !hasPinterestAds,
    oauth: oauth,
    toolCount: tools.length,
    tools: tools.map(t => t.name),
    lastSync: lastSync
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  name,
  shortName,
  version,
  status,
  oauth,
  testConnection,
  handleToolCall,
  getTools,
  getInfo,
  // Direct function exports for internal use
  getCampaigns,
  createCampaign,
  updateCampaign,
  getAdGroups,
  createAdGroup,
  updateAdGroup,
  getAds,
  createAd,
  updateAd,
  getAudiences,
  createAudience,
  getInsights,
  getAdAccounts,
  getPins,
  createPin
};
