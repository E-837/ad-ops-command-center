/**
 * TikTok Ads Connector
 * Integration with TikTok Marketing API v1.3 for short-form video advertising
 * 
 * Official API: https://business-api.tiktok.com/open_api/v1.3/
 * 
 * Setup Instructions:
 * 1. Create a TikTok Business account at ads.tiktok.com
 * 2. Apply for Marketing API access at ads.tiktok.com/marketing_api
 * 3. Get access token (long-lived)
 * 4. Set environment variables in config/.env:
 *    TIKTOK_ACCESS_TOKEN=your_access_token
 *    TIKTOK_ADVERTISER_ID=your_advertiser_id
 * 
 * Testing in Sandbox:
 * - Without credentials, connector returns realistic mock data
 * - Mock data includes 3 campaigns, 4 ad groups, 5 ads, 3 videos
 * - All CRUD operations work in sandbox mode
 * 
 * Ad Ops Use Cases:
 * - TikTok video advertising (9:16, 1:1, 16:9)
 * - Short-form video campaigns (5-60 seconds)
 * - Gen Z audience targeting
 * - Interest and behavior targeting
 * - Spark Ads (boosting organic content)
 * - TikTok Pixel conversion tracking
 * - Shopping campaigns (TikTok Shop integration)
 */

const fs = require('fs');
const path = require('path');
const BaseConnector = require('./base-connector');

const name = 'TikTok Ads';
const shortName = 'TikTok';
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
let accessToken = env.TIKTOK_ACCESS_TOKEN || null;
const advertiserId = env.TIKTOK_ADVERTISER_ID || null;

const hasTikTokAds = !!(accessToken && advertiserId);

// OAuth configuration
const oauth = {
  provider: 'tiktok',
  scopes: ['ad_management', 'ad_reporting'],
  apiEndpoint: 'https://business-api.tiktok.com/open_api/v1.3',
  connected: hasTikTokAds,
  advertiserId: advertiserId ? `***${advertiserId.slice(-4)}` : null,
  tokenType: 'long_lived_access_token'
};

// API version
const API_VERSION = 'v1.3';
const BASE_URL = `https://business-api.tiktok.com/open_api/${API_VERSION}`;

// Tool definitions for MCP integration
const tools = [
  {
    name: 'tiktok_get_advertisers',
    description: 'List TikTok advertiser accounts accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (1-indexed)',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          description: 'Results per page (default: 10, max: 100)',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      }
    }
  },
  {
    name: 'tiktok_get_campaigns',
    description: 'List TikTok campaigns with metadata',
    inputSchema: {
      type: 'object',
      properties: {
        filtering: {
          type: 'object',
          properties: {
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific campaign IDs'
            },
            primary_status: {
              type: 'string',
              enum: ['STATUS_ENABLE', 'STATUS_DISABLE', 'STATUS_DELETE', 'STATUS_ALL'],
              description: 'Filter by campaign status'
            },
            objective_type: {
              type: 'string',
              enum: ['REACH', 'TRAFFIC', 'APP_INSTALL', 'VIDEO_VIEWS', 'LEAD_GENERATION', 'CONVERSIONS', 'PRODUCT_SALES'],
              description: 'Filter by objective'
            }
          }
        },
        page: {
          type: 'number',
          description: 'Page number (1-indexed)',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          description: 'Results per page (default: 10, max: 100)',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      }
    }
  },
  {
    name: 'tiktok_create_campaign',
    description: 'Create a new TikTok campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_name: {
          type: 'string',
          description: 'Campaign name (max 512 chars)'
        },
        objective_type: {
          type: 'string',
          enum: ['REACH', 'TRAFFIC', 'APP_INSTALL', 'VIDEO_VIEWS', 'LEAD_GENERATION', 'CONVERSIONS', 'PRODUCT_SALES'],
          description: 'Campaign objective'
        },
        budget_mode: {
          type: 'string',
          enum: ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL', 'BUDGET_MODE_INFINITE'],
          description: 'Budget mode',
          default: 'BUDGET_MODE_DAY'
        },
        budget: {
          type: 'number',
          description: 'Budget amount in dollars (daily or total based on budget_mode)'
        },
        split_test_variable: {
          type: 'string',
          enum: ['BIDDING_OPTIMIZATION', 'TARGETING', 'CREATIVE', 'PLACEMENT'],
          description: 'A/B test variable (optional)'
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE'],
          description: 'Initial campaign status',
          default: 'DISABLE'
        }
      },
      required: ['campaign_name', 'objective_type']
    }
  },
  {
    name: 'tiktok_update_campaign',
    description: 'Update an existing TikTok campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID to update'
        },
        campaign_name: {
          type: 'string',
          description: 'Updated campaign name'
        },
        budget: {
          type: 'number',
          description: 'Updated budget in dollars'
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE', 'DELETE'],
          description: 'Updated campaign status'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'tiktok_get_ad_groups',
    description: 'List TikTok ad groups (targeting and budget containers)',
    inputSchema: {
      type: 'object',
      properties: {
        filtering: {
          type: 'object',
          properties: {
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by campaign IDs'
            },
            adgroup_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific ad group IDs'
            },
            primary_status: {
              type: 'string',
              enum: ['STATUS_ENABLE', 'STATUS_DISABLE', 'STATUS_DELETE', 'STATUS_ALL'],
              description: 'Filter by ad group status'
            }
          }
        },
        page: {
          type: 'number',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      }
    }
  },
  {
    name: 'tiktok_create_ad_group',
    description: 'Create a TikTok ad group with targeting and budget',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Parent campaign ID'
        },
        adgroup_name: {
          type: 'string',
          description: 'Ad group name (max 512 chars)'
        },
        placement_type: {
          type: 'string',
          enum: ['PLACEMENT_TYPE_AUTOMATIC', 'PLACEMENT_TYPE_NORMAL'],
          description: 'Automatic or manual placement',
          default: 'PLACEMENT_TYPE_AUTOMATIC'
        },
        placements: {
          type: 'array',
          items: { type: 'string', enum: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE', 'PLACEMENT_GLOBAL_APP_BUNDLE'] },
          description: 'Ad placements (required if placement_type is NORMAL)'
        },
        location_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target location IDs (country codes)'
        },
        age_groups: {
          type: 'array',
          items: { type: 'string', enum: ['AGE_13_17', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_100'] },
          description: 'Target age groups'
        },
        gender: {
          type: 'string',
          enum: ['GENDER_MALE', 'GENDER_FEMALE', 'GENDER_UNLIMITED'],
          description: 'Gender targeting',
          default: 'GENDER_UNLIMITED'
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target language codes'
        },
        interest_category_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Interest category IDs'
        },
        budget: {
          type: 'number',
          description: 'Daily budget in dollars'
        },
        bid_type: {
          type: 'string',
          enum: ['BID_TYPE_MAX', 'BID_TYPE_NO_BID'],
          description: 'Bidding type',
          default: 'BID_TYPE_MAX'
        },
        bid_price: {
          type: 'number',
          description: 'Bid amount in dollars'
        },
        optimization_goal: {
          type: 'string',
          enum: ['REACH', 'CLICK', 'CONVERSION', 'VIDEO_VIEW', 'LEAD_GENERATION', 'VALUE'],
          description: 'Optimization goal'
        },
        pacing: {
          type: 'string',
          enum: ['PACING_MODE_SMOOTH', 'PACING_MODE_FAST'],
          description: 'Budget pacing',
          default: 'PACING_MODE_SMOOTH'
        },
        schedule_type: {
          type: 'string',
          enum: ['SCHEDULE_START_END', 'SCHEDULE_FROM_NOW'],
          description: 'Schedule type',
          default: 'SCHEDULE_FROM_NOW'
        },
        schedule_start_time: {
          type: 'string',
          description: 'Start time (YYYY-MM-DD HH:MM:SS)'
        },
        schedule_end_time: {
          type: 'string',
          description: 'End time (YYYY-MM-DD HH:MM:SS)'
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE'],
          description: 'Initial ad group status',
          default: 'DISABLE'
        }
      },
      required: ['campaign_id', 'adgroup_name', 'location_ids', 'optimization_goal']
    }
  },
  {
    name: 'tiktok_update_ad_group',
    description: 'Update an existing TikTok ad group',
    inputSchema: {
      type: 'object',
      properties: {
        adgroup_id: {
          type: 'string',
          description: 'Ad group ID to update'
        },
        adgroup_name: {
          type: 'string',
          description: 'Updated ad group name'
        },
        budget: {
          type: 'number',
          description: 'Updated daily budget in dollars'
        },
        bid_price: {
          type: 'number',
          description: 'Updated bid amount in dollars'
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE', 'DELETE'],
          description: 'Updated ad group status'
        },
        schedule_end_time: {
          type: 'string',
          description: 'Updated end time (YYYY-MM-DD HH:MM:SS)'
        }
      },
      required: ['adgroup_id']
    }
  },
  {
    name: 'tiktok_get_ads',
    description: 'List TikTok ads',
    inputSchema: {
      type: 'object',
      properties: {
        filtering: {
          type: 'object',
          properties: {
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by campaign IDs'
            },
            adgroup_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by ad group IDs'
            },
            ad_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific ad IDs'
            },
            primary_status: {
              type: 'string',
              enum: ['STATUS_ENABLE', 'STATUS_DISABLE', 'STATUS_DELETE', 'STATUS_ALL'],
              description: 'Filter by ad status'
            }
          }
        },
        page: {
          type: 'number',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      }
    }
  },
  {
    name: 'tiktok_create_ad',
    description: 'Create a TikTok video ad',
    inputSchema: {
      type: 'object',
      properties: {
        adgroup_id: {
          type: 'string',
          description: 'Parent ad group ID'
        },
        ad_name: {
          type: 'string',
          description: 'Ad name (max 512 chars)'
        },
        ad_text: {
          type: 'string',
          description: 'Ad copy/text (max 100 chars)'
        },
        video_id: {
          type: 'string',
          description: 'Video creative ID (from uploaded video)'
        },
        call_to_action: {
          type: 'string',
          enum: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'BOOK_NOW', 'APPLY_NOW', 'WATCH_MORE', 'PLAY_GAME'],
          description: 'Call to action button',
          default: 'LEARN_MORE'
        },
        landing_page_url: {
          type: 'string',
          description: 'Destination URL'
        },
        display_name: {
          type: 'string',
          description: 'Brand/advertiser display name (max 40 chars)'
        },
        identity_type: {
          type: 'string',
          enum: ['BC_ACCOUNT', 'CUSTOMIZED_USER', 'TT_USER'],
          description: 'Identity type for the ad',
          default: 'BC_ACCOUNT'
        },
        spark_ads_eligible: {
          type: 'boolean',
          description: 'Enable Spark Ads (boost organic content)',
          default: false
        },
        shopping_ads_enabled: {
          type: 'boolean',
          description: 'Enable shopping features',
          default: false
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE'],
          description: 'Initial ad status',
          default: 'DISABLE'
        }
      },
      required: ['adgroup_id', 'ad_name', 'ad_text', 'video_id', 'landing_page_url', 'display_name']
    }
  },
  {
    name: 'tiktok_update_ad',
    description: 'Update an existing TikTok ad',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: {
          type: 'string',
          description: 'Ad ID to update'
        },
        ad_name: {
          type: 'string',
          description: 'Updated ad name'
        },
        ad_text: {
          type: 'string',
          description: 'Updated ad copy'
        },
        operation_status: {
          type: 'string',
          enum: ['ENABLE', 'DISABLE', 'DELETE'],
          description: 'Updated ad status'
        }
      },
      required: ['ad_id']
    }
  },
  {
    name: 'tiktok_get_videos',
    description: 'List uploaded video creatives',
    inputSchema: {
      type: 'object',
      properties: {
        filtering: {
          type: 'object',
          properties: {
            video_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific video IDs'
            },
            width: {
              type: 'number',
              description: 'Filter by video width'
            },
            height: {
              type: 'number',
              description: 'Filter by video height'
            },
            ratio: {
              type: 'array',
              items: { type: 'string', enum: ['1:1', '9:16', '16:9'] },
              description: 'Filter by aspect ratio'
            }
          }
        },
        page: {
          type: 'number',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      }
    }
  },
  {
    name: 'tiktok_upload_video',
    description: 'Upload a video creative (mock: returns video metadata)',
    inputSchema: {
      type: 'object',
      properties: {
        video_file: {
          type: 'string',
          description: 'Video file path or URL'
        },
        video_signature: {
          type: 'string',
          description: 'Video file MD5 hash (for deduplication)'
        },
        video_name: {
          type: 'string',
          description: 'Video name/description'
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '9:16', '16:9'],
          description: 'Video aspect ratio',
          default: '9:16'
        },
        duration_seconds: {
          type: 'number',
          description: 'Video duration in seconds (5-60)',
          minimum: 5,
          maximum: 60
        }
      },
      required: ['video_file']
    }
  },
  {
    name: 'tiktok_get_reports',
    description: 'Get performance analytics for campaigns, ad groups, or ads',
    inputSchema: {
      type: 'object',
      properties: {
        report_type: {
          type: 'string',
          enum: ['BASIC', 'AUDIENCE', 'PLAYABLE_MATERIAL', 'INTERACTIVE_MATERIAL'],
          description: 'Report type',
          default: 'BASIC'
        },
        dimensions: {
          type: 'array',
          items: { type: 'string', enum: ['campaign_id', 'adgroup_id', 'ad_id', 'stat_time_day', 'stat_time_hour'] },
          description: 'Report dimensions'
        },
        metrics: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['impressions', 'clicks', 'spend', 'ctr', 'cpc', 'cpm', 'conversions', 'conversion_rate', 'cost_per_conversion', 'video_play_actions', 'video_watched_2s', 'video_watched_6s', 'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100', 'average_video_play', 'likes', 'comments', 'shares', 'follows', 'profile_visits', 'clicks_on_music_disc']
          },
          description: 'Metrics to retrieve'
        },
        data_level: {
          type: 'string',
          enum: ['AUCTION_CAMPAIGN', 'AUCTION_ADGROUP', 'AUCTION_AD'],
          description: 'Data aggregation level',
          default: 'AUCTION_CAMPAIGN'
        },
        filtering: {
          type: 'object',
          properties: {
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by campaign IDs'
            },
            adgroup_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by ad group IDs'
            },
            ad_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by ad IDs'
            }
          }
        },
        start_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        end_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        },
        page: {
          type: 'number',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          default: 100
        }
      },
      required: ['data_level', 'start_date', 'end_date']
    }
  }
];

// Mock data for sandbox mode
const MOCK_ADVERTISERS = [
  {
    advertiser_id: '9876543210',
    advertiser_name: 'Trendy Fashion Co',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    status: 'STATUS_ENABLE',
    create_time: '2025-12-01T00:00:00Z',
    industry: 'Fashion & Apparel',
    balance: 5000.00,
    license_url: 'https://example.com/license.pdf'
  },
  {
    advertiser_id: '9876543211',
    advertiser_name: 'GameDev Studios',
    currency: 'USD',
    timezone: 'America/New_York',
    status: 'STATUS_ENABLE',
    create_time: '2026-01-05T00:00:00Z',
    industry: 'Gaming',
    balance: 12000.00,
    license_url: 'https://example.com/license2.pdf'
  }
];

const MOCK_CAMPAIGNS = [
  {
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    campaign_name: 'Gen Z Product Launch - Spring 2026',
    objective_type: 'CONVERSIONS',
    status: 'ENABLE',
    budget_mode: 'BUDGET_MODE_DAY',
    budget: 100.00,
    operation_status: 'ENABLE',
    secondary_status: 'CAMPAIGN_STATUS_ACTIVE',
    create_time: '2026-02-01T00:00:00Z',
    modify_time: '2026-02-11T12:00:00Z',
    is_smart_performance_campaign: false
  },
  {
    campaign_id: '1234567891',
    advertiser_id: advertiserId || '9876543210',
    campaign_name: 'Video Views Campaign - Viral Content',
    objective_type: 'VIDEO_VIEWS',
    status: 'ENABLE',
    budget_mode: 'BUDGET_MODE_DAY',
    budget: 75.00,
    operation_status: 'ENABLE',
    secondary_status: 'CAMPAIGN_STATUS_ACTIVE',
    create_time: '2026-01-25T00:00:00Z',
    modify_time: '2026-02-10T09:30:00Z',
    is_smart_performance_campaign: false
  },
  {
    campaign_id: '1234567892',
    advertiser_id: advertiserId || '9876543210',
    campaign_name: 'App Install Campaign - Mobile Game',
    objective_type: 'APP_INSTALL',
    status: 'DISABLE',
    budget_mode: 'BUDGET_MODE_TOTAL',
    budget: 2000.00,
    operation_status: 'DISABLE',
    secondary_status: 'CAMPAIGN_STATUS_PAUSED',
    create_time: '2026-01-10T00:00:00Z',
    modify_time: '2026-02-05T14:20:00Z',
    is_smart_performance_campaign: false
  }
];

const MOCK_AD_GROUPS = [
  {
    adgroup_id: '1111111111',
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    adgroup_name: 'Ages 18-24 - Fashion Lovers',
    placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
    placements: ['PLACEMENT_TIKTOK'],
    location_ids: ['6252001'], // United States
    age_groups: ['AGE_18_24'],
    gender: 'GENDER_UNLIMITED',
    languages: ['en'],
    interest_category_ids: ['100001', '100002'], // Fashion, Shopping
    budget: 50.00,
    bid_type: 'BID_TYPE_MAX',
    bid_price: 2.00,
    optimization_goal: 'CONVERSION',
    pacing: 'PACING_MODE_SMOOTH',
    schedule_type: 'SCHEDULE_START_END',
    schedule_start_time: '2026-02-01 00:00:00',
    schedule_end_time: '2026-03-01 23:59:59',
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'ADGROUP_STATUS_ACTIVE',
    create_time: '2026-02-01T00:00:00Z',
    modify_time: '2026-02-11T10:15:00Z'
  },
  {
    adgroup_id: '1111111112',
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    adgroup_name: 'Ages 25-34 - Beauty Enthusiasts',
    placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
    placements: ['PLACEMENT_TIKTOK'],
    location_ids: ['6252001'],
    age_groups: ['AGE_25_34'],
    gender: 'GENDER_FEMALE',
    languages: ['en'],
    interest_category_ids: ['100003', '100004'], // Beauty, Lifestyle
    budget: 50.00,
    bid_type: 'BID_TYPE_MAX',
    bid_price: 2.50,
    optimization_goal: 'CONVERSION',
    pacing: 'PACING_MODE_SMOOTH',
    schedule_type: 'SCHEDULE_FROM_NOW',
    schedule_start_time: null,
    schedule_end_time: null,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'ADGROUP_STATUS_ACTIVE',
    create_time: '2026-02-03T00:00:00Z',
    modify_time: '2026-02-10T16:45:00Z'
  },
  {
    adgroup_id: '1111111113',
    campaign_id: '1234567891',
    advertiser_id: advertiserId || '9876543210',
    adgroup_name: 'Viral Dance Challenge - Broad Audience',
    placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
    placements: ['PLACEMENT_TIKTOK'],
    location_ids: ['6252001', '6251999'], // US, Canada
    age_groups: ['AGE_18_24', 'AGE_25_34'],
    gender: 'GENDER_UNLIMITED',
    languages: ['en'],
    interest_category_ids: ['100010', '100011'], // Entertainment, Music
    budget: 75.00,
    bid_type: 'BID_TYPE_MAX',
    bid_price: 0.50,
    optimization_goal: 'VIDEO_VIEW',
    pacing: 'PACING_MODE_FAST',
    schedule_type: 'SCHEDULE_FROM_NOW',
    schedule_start_time: null,
    schedule_end_time: null,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'ADGROUP_STATUS_ACTIVE',
    create_time: '2026-01-25T00:00:00Z',
    modify_time: '2026-02-09T11:00:00Z'
  },
  {
    adgroup_id: '1111111114',
    campaign_id: '1234567892',
    advertiser_id: advertiserId || '9876543210',
    adgroup_name: 'Mobile Gamers - iOS',
    placement_type: 'PLACEMENT_TYPE_NORMAL',
    placements: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE'],
    location_ids: ['6252001'],
    age_groups: ['AGE_18_24', 'AGE_25_34'],
    gender: 'GENDER_MALE',
    languages: ['en'],
    interest_category_ids: ['100020', '100021'], // Gaming, Technology
    budget: 100.00,
    bid_type: 'BID_TYPE_MAX',
    bid_price: 3.00,
    optimization_goal: 'CLICK',
    pacing: 'PACING_MODE_SMOOTH',
    schedule_type: 'SCHEDULE_FROM_NOW',
    schedule_start_time: null,
    schedule_end_time: null,
    status: 'DISABLE',
    operation_status: 'DISABLE',
    secondary_status: 'ADGROUP_STATUS_PAUSED',
    create_time: '2026-01-10T00:00:00Z',
    modify_time: '2026-02-05T14:20:00Z'
  }
];

const MOCK_ADS = [
  {
    ad_id: '2222222221',
    adgroup_id: '1111111111',
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    ad_name: 'Spring Collection Reveal - Video 1',
    ad_text: 'New spring styles just dropped! 🌸 Shop the collection now. Limited time offer! #SpringFashion',
    video_id: 'v_abc123',
    call_to_action: 'SHOP_NOW',
    landing_page_url: 'https://example.com/spring-collection',
    display_name: 'Trendy Fashion',
    identity_type: 'BC_ACCOUNT',
    spark_ads_eligible: false,
    shopping_ads_enabled: true,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'AD_STATUS_DELIVERING',
    create_time: '2026-02-01T10:00:00Z',
    modify_time: '2026-02-08T14:30:00Z'
  },
  {
    ad_id: '2222222222',
    adgroup_id: '1111111111',
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    ad_name: 'Spring Collection Reveal - Video 2',
    ad_text: 'The wait is over! ✨ Get 20% off your first order. Fresh styles for spring. #FashionTikTok',
    video_id: 'v_abc124',
    call_to_action: 'SHOP_NOW',
    landing_page_url: 'https://example.com/spring-collection?promo=SPRING20',
    display_name: 'Trendy Fashion',
    identity_type: 'BC_ACCOUNT',
    spark_ads_eligible: false,
    shopping_ads_enabled: true,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'AD_STATUS_DELIVERING',
    create_time: '2026-02-02T11:00:00Z',
    modify_time: '2026-02-09T09:15:00Z'
  },
  {
    ad_id: '2222222223',
    adgroup_id: '1111111112',
    campaign_id: '1234567890',
    advertiser_id: advertiserId || '9876543210',
    ad_name: 'Beauty Tutorial - Get Ready With Me',
    ad_text: 'Get ready with me for spring! 💄 Using our new beauty line. Tutorial in bio! #GRWM #BeautyTok',
    video_id: 'v_abc125',
    call_to_action: 'LEARN_MORE',
    landing_page_url: 'https://example.com/beauty-line',
    display_name: 'Trendy Fashion',
    identity_type: 'BC_ACCOUNT',
    spark_ads_eligible: true,
    shopping_ads_enabled: false,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'AD_STATUS_DELIVERING',
    create_time: '2026-02-03T14:00:00Z',
    modify_time: '2026-02-10T16:20:00Z'
  },
  {
    ad_id: '2222222224',
    adgroup_id: '1111111113',
    campaign_id: '1234567891',
    advertiser_id: advertiserId || '9876543210',
    ad_name: 'Viral Dance Challenge Entry',
    ad_text: 'Join the #SpringVibes challenge! 🎉 Show us your best moves. Winner gets featured! 🏆',
    video_id: 'v_abc126',
    call_to_action: 'WATCH_MORE',
    landing_page_url: 'https://example.com/challenge',
    display_name: 'Trendy Fashion',
    identity_type: 'TT_USER',
    spark_ads_eligible: true,
    shopping_ads_enabled: false,
    status: 'ENABLE',
    operation_status: 'ENABLE',
    secondary_status: 'AD_STATUS_DELIVERING',
    create_time: '2026-01-25T16:00:00Z',
    modify_time: '2026-02-07T10:45:00Z'
  },
  {
    ad_id: '2222222225',
    adgroup_id: '1111111114',
    campaign_id: '1234567892',
    advertiser_id: advertiserId || '9876543210',
    ad_name: 'Mobile Game Install Ad',
    ad_text: 'Download now and get 1000 free gems! 💎 Epic battles await. #Gaming #MobileGame',
    video_id: 'v_abc127',
    call_to_action: 'DOWNLOAD',
    landing_page_url: 'https://apps.apple.com/app/epicgame',
    display_name: 'GameDev Studios',
    identity_type: 'BC_ACCOUNT',
    spark_ads_eligible: false,
    shopping_ads_enabled: false,
    status: 'DISABLE',
    operation_status: 'DISABLE',
    secondary_status: 'AD_STATUS_PAUSED',
    create_time: '2026-01-10T12:00:00Z',
    modify_time: '2026-02-05T14:20:00Z'
  }
];

const MOCK_VIDEOS = [
  {
    video_id: 'v_abc123',
    video_name: 'Spring Collection Reveal 1',
    video_cover_url: 'https://cdn.example.com/tiktok/cover1.jpg',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    duration: 15.5,
    file_size: 8450000,
    format: 'mp4',
    create_time: '2026-02-01T09:00:00Z',
    signature: 'abc123def456',
    allowed_placements: ['PLACEMENT_TIKTOK']
  },
  {
    video_id: 'v_abc124',
    video_name: 'Spring Collection Reveal 2',
    video_cover_url: 'https://cdn.example.com/tiktok/cover2.jpg',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    duration: 22.3,
    file_size: 12350000,
    format: 'mp4',
    create_time: '2026-02-02T10:00:00Z',
    signature: 'def456ghi789',
    allowed_placements: ['PLACEMENT_TIKTOK']
  },
  {
    video_id: 'v_abc125',
    video_name: 'Beauty Tutorial GRWM',
    video_cover_url: 'https://cdn.example.com/tiktok/cover3.jpg',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    duration: 45.0,
    file_size: 25600000,
    format: 'mp4',
    create_time: '2026-02-03T13:00:00Z',
    signature: 'ghi789jkl012',
    allowed_placements: ['PLACEMENT_TIKTOK']
  },
  {
    video_id: 'v_abc126',
    video_name: 'Dance Challenge Entry',
    video_cover_url: 'https://cdn.example.com/tiktok/cover4.jpg',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    duration: 18.7,
    file_size: 10200000,
    format: 'mp4',
    create_time: '2026-01-25T15:00:00Z',
    signature: 'jkl012mno345',
    allowed_placements: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE']
  },
  {
    video_id: 'v_abc127',
    video_name: 'Mobile Game Trailer',
    video_cover_url: 'https://cdn.example.com/tiktok/cover5.jpg',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    duration: 30.0,
    file_size: 18900000,
    format: 'mp4',
    create_time: '2026-01-10T11:00:00Z',
    signature: 'mno345pqr678',
    allowed_placements: ['PLACEMENT_TIKTOK', 'PLACEMENT_PANGLE', 'PLACEMENT_GLOBAL_APP_BUNDLE']
  }
];

const MOCK_ANALYTICS = {
  '1234567890': {
    campaign_id: '1234567890',
    campaign_name: 'Gen Z Product Launch - Spring 2026',
    date_range: '2026-02-01 to 2026-02-10',
    metrics: {
      impressions: 250000,
      clicks: 12500,
      spend: 3750.00,
      ctr: 5.0,
      cpc: 0.30,
      cpm: 15.00,
      conversions: 375,
      conversion_rate: 3.0,
      cost_per_conversion: 10.00,
      video_play_actions: 200000,
      video_watched_2s: 175000,
      video_watched_6s: 140000,
      video_views_p25: 160000,
      video_views_p50: 120000,
      video_views_p75: 85000,
      video_views_p100: 50000,
      average_video_play: 12.5,
      likes: 8500,
      comments: 1200,
      shares: 950,
      follows: 420,
      profile_visits: 680
    }
  },
  '1234567891': {
    campaign_id: '1234567891',
    campaign_name: 'Video Views Campaign - Viral Content',
    date_range: '2026-02-01 to 2026-02-10',
    metrics: {
      impressions: 450000,
      clicks: 22500,
      spend: 2250.00,
      ctr: 5.0,
      cpc: 0.10,
      cpm: 5.00,
      conversions: 0,
      conversion_rate: 0,
      cost_per_conversion: 0,
      video_play_actions: 390000,
      video_watched_2s: 360000,
      video_watched_6s: 320000,
      video_views_p25: 350000,
      video_views_p50: 280000,
      video_views_p75: 210000,
      video_views_p100: 112500,
      average_video_play: 14.2,
      likes: 18000,
      comments: 3200,
      shares: 4500,
      follows: 1250,
      profile_visits: 2100
    }
  },
  '1111111111': {
    adgroup_id: '1111111111',
    adgroup_name: 'Ages 18-24 - Fashion Lovers',
    campaign_id: '1234567890',
    date_range: '2026-02-01 to 2026-02-10',
    metrics: {
      impressions: 125000,
      clicks: 6250,
      spend: 1875.00,
      ctr: 5.0,
      cpc: 0.30,
      conversions: 187,
      cost_per_conversion: 10.03,
      video_play_actions: 100000,
      average_video_play: 12.0,
      likes: 4250,
      comments: 600,
      shares: 475
    }
  },
  '2222222221': {
    ad_id: '2222222221',
    ad_name: 'Spring Collection Reveal - Video 1',
    adgroup_id: '1111111111',
    campaign_id: '1234567890',
    date_range: '2026-02-01 to 2026-02-10',
    metrics: {
      impressions: 65000,
      clicks: 3250,
      spend: 975.00,
      ctr: 5.0,
      cpc: 0.30,
      conversions: 97,
      cost_per_conversion: 10.05,
      video_play_actions: 52000,
      video_views_p100: 26000,
      average_video_play: 11.8,
      likes: 2200,
      comments: 310,
      shares: 245
    }
  }
};

// API request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
  // Sandbox mode: return mock data
  if (!hasTikTokAds) {
    return getMockResponse(endpoint, method, data);
  }
  
  // Live mode: make real API call
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify({
      advertiser_id: advertiserId,
      ...data
    });
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('TikTok Ads authentication failed. Access token may be invalid.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TikTok API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`TikTok API error: ${result.message}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('TikTok API request error:', error);
    throw error;
  }
}

// Mock response generator
function getMockResponse(endpoint, method, data) {
  // Advertisers
  if (endpoint.includes('/oauth2/advertiser/get')) {
    return {
      list: MOCK_ADVERTISERS,
      page_info: { page: 1, page_size: 10, total_number: MOCK_ADVERTISERS.length, total_page: 1 }
    };
  }
  
  // Campaigns - List
  if (endpoint.includes('/campaign/get') && method === 'GET') {
    let campaigns = MOCK_CAMPAIGNS;
    
    if (data?.filtering?.primary_status && data.filtering.primary_status !== 'STATUS_ALL') {
      const statusMap = {
        'STATUS_ENABLE': 'ENABLE',
        'STATUS_DISABLE': 'DISABLE'
      };
      const targetStatus = statusMap[data.filtering.primary_status];
      campaigns = campaigns.filter(c => c.status === targetStatus);
    }
    
    if (data?.filtering?.objective_type) {
      campaigns = campaigns.filter(c => c.objective_type === data.filtering.objective_type);
    }
    
    return {
      list: campaigns,
      page_info: { page: 1, page_size: 10, total_number: campaigns.length, total_page: 1 }
    };
  }
  
  // Campaigns - Create
  if (endpoint.includes('/campaign/create') && method === 'POST') {
    const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    const now = new Date().toISOString();
    
    return {
      campaign_id: newId,
      advertiser_id: advertiserId || '9876543210',
      campaign_name: data.campaign_name,
      objective_type: data.objective_type,
      status: data.operation_status || 'DISABLE',
      budget_mode: data.budget_mode || 'BUDGET_MODE_DAY',
      budget: data.budget || 0,
      operation_status: data.operation_status || 'DISABLE',
      secondary_status: data.operation_status === 'ENABLE' ? 'CAMPAIGN_STATUS_ACTIVE' : 'CAMPAIGN_STATUS_PAUSED',
      create_time: now,
      modify_time: now,
      is_smart_performance_campaign: false
    };
  }
  
  // Campaigns - Update
  if (endpoint.includes('/campaign/update') && method === 'POST') {
    const campaign = MOCK_CAMPAIGNS.find(c => c.campaign_id === data.campaign_id) || MOCK_CAMPAIGNS[0];
    
    return {
      ...campaign,
      campaign_name: data.campaign_name || campaign.campaign_name,
      budget: data.budget || campaign.budget,
      operation_status: data.operation_status || campaign.operation_status,
      status: data.operation_status || campaign.status,
      modify_time: new Date().toISOString()
    };
  }
  
  // Ad Groups - List
  if (endpoint.includes('/adgroup/get') && method === 'GET') {
    let adgroups = MOCK_AD_GROUPS;
    
    if (data?.filtering?.campaign_ids) {
      adgroups = adgroups.filter(ag => data.filtering.campaign_ids.includes(ag.campaign_id));
    }
    
    if (data?.filtering?.primary_status && data.filtering.primary_status !== 'STATUS_ALL') {
      const statusMap = {
        'STATUS_ENABLE': 'ENABLE',
        'STATUS_DISABLE': 'DISABLE'
      };
      const targetStatus = statusMap[data.filtering.primary_status];
      adgroups = adgroups.filter(ag => ag.status === targetStatus);
    }
    
    return {
      list: adgroups,
      page_info: { page: 1, page_size: 10, total_number: adgroups.length, total_page: 1 }
    };
  }
  
  // Ad Groups - Create
  if (endpoint.includes('/adgroup/create') && method === 'POST') {
    const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    const now = new Date().toISOString();
    
    return {
      adgroup_id: newId,
      campaign_id: data.campaign_id,
      advertiser_id: advertiserId || '9876543210',
      adgroup_name: data.adgroup_name,
      placement_type: data.placement_type || 'PLACEMENT_TYPE_AUTOMATIC',
      placements: data.placements || ['PLACEMENT_TIKTOK'],
      location_ids: data.location_ids || [],
      age_groups: data.age_groups || [],
      gender: data.gender || 'GENDER_UNLIMITED',
      languages: data.languages || [],
      interest_category_ids: data.interest_category_ids || [],
      budget: data.budget || 0,
      bid_type: data.bid_type || 'BID_TYPE_MAX',
      bid_price: data.bid_price || 0,
      optimization_goal: data.optimization_goal,
      pacing: data.pacing || 'PACING_MODE_SMOOTH',
      schedule_type: data.schedule_type || 'SCHEDULE_FROM_NOW',
      schedule_start_time: data.schedule_start_time || null,
      schedule_end_time: data.schedule_end_time || null,
      status: data.operation_status || 'DISABLE',
      operation_status: data.operation_status || 'DISABLE',
      secondary_status: data.operation_status === 'ENABLE' ? 'ADGROUP_STATUS_ACTIVE' : 'ADGROUP_STATUS_PAUSED',
      create_time: now,
      modify_time: now
    };
  }
  
  // Ad Groups - Update
  if (endpoint.includes('/adgroup/update') && method === 'POST') {
    const adgroup = MOCK_AD_GROUPS.find(ag => ag.adgroup_id === data.adgroup_id) || MOCK_AD_GROUPS[0];
    
    return {
      ...adgroup,
      adgroup_name: data.adgroup_name || adgroup.adgroup_name,
      budget: data.budget || adgroup.budget,
      bid_price: data.bid_price || adgroup.bid_price,
      operation_status: data.operation_status || adgroup.operation_status,
      status: data.operation_status || adgroup.status,
      schedule_end_time: data.schedule_end_time || adgroup.schedule_end_time,
      modify_time: new Date().toISOString()
    };
  }
  
  // Ads - List (must NOT match /file/video/ad/get)
  if (endpoint.includes('/ad/get') && !endpoint.includes('/file/video') && method === 'GET') {
    let ads = MOCK_ADS;
    
    if (data?.filtering?.campaign_ids) {
      ads = ads.filter(ad => data.filtering.campaign_ids.includes(ad.campaign_id));
    }
    
    if (data?.filtering?.adgroup_ids) {
      ads = ads.filter(ad => data.filtering.adgroup_ids.includes(ad.adgroup_id));
    }
    
    if (data?.filtering?.primary_status && data.filtering.primary_status !== 'STATUS_ALL') {
      const statusMap = {
        'STATUS_ENABLE': 'ENABLE',
        'STATUS_DISABLE': 'DISABLE'
      };
      const targetStatus = statusMap[data.filtering.primary_status];
      ads = ads.filter(ad => ad.status === targetStatus);
    }
    
    return {
      list: ads,
      page_info: { page: 1, page_size: 10, total_number: ads.length, total_page: 1 }
    };
  }
  
  // Ads - Create
  if (endpoint.includes('/ad/create') && method === 'POST') {
    const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    const now = new Date().toISOString();
    
    return {
      ad_id: newId,
      adgroup_id: data.adgroup_id,
      campaign_id: MOCK_AD_GROUPS.find(ag => ag.adgroup_id === data.adgroup_id)?.campaign_id || '1234567890',
      advertiser_id: advertiserId || '9876543210',
      ad_name: data.ad_name,
      ad_text: data.ad_text,
      video_id: data.video_id,
      call_to_action: data.call_to_action || 'LEARN_MORE',
      landing_page_url: data.landing_page_url,
      display_name: data.display_name,
      identity_type: data.identity_type || 'BC_ACCOUNT',
      spark_ads_eligible: data.spark_ads_eligible || false,
      shopping_ads_enabled: data.shopping_ads_enabled || false,
      status: data.operation_status || 'DISABLE',
      operation_status: data.operation_status || 'DISABLE',
      secondary_status: data.operation_status === 'ENABLE' ? 'AD_STATUS_DELIVERING' : 'AD_STATUS_PAUSED',
      create_time: now,
      modify_time: now
    };
  }
  
  // Ads - Update
  if (endpoint.includes('/ad/update') && method === 'POST') {
    const ad = MOCK_ADS.find(a => a.ad_id === data.ad_id) || MOCK_ADS[0];
    
    return {
      ...ad,
      ad_name: data.ad_name || ad.ad_name,
      ad_text: data.ad_text || ad.ad_text,
      operation_status: data.operation_status || ad.operation_status,
      status: data.operation_status || ad.status,
      modify_time: new Date().toISOString()
    };
  }
  
  // Videos - List
  if (endpoint.includes('/file/video/ad/get') || endpoint.includes('/file/video/get')) {
    let videos = MOCK_VIDEOS;
    
    if (data?.filtering?.ratio) {
      videos = videos.filter(v => data.filtering.ratio.includes(v.ratio));
    }
    
    return {
      list: videos,
      page_info: { page: 1, page_size: 20, total_number: videos.length, total_page: 1 }
    };
  }
  
  // Videos - Upload
  if (endpoint.includes('/file/video/ad/upload') || endpoint.includes('/file/video/upload')) {
    const newId = `v_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    return {
      video_id: newId,
      video_name: data.video_name || 'Uploaded Video',
      video_cover_url: 'https://cdn.example.com/tiktok/cover_new.jpg',
      width: data.aspect_ratio === '1:1' ? 1080 : 1080,
      height: data.aspect_ratio === '9:16' ? 1920 : (data.aspect_ratio === '1:1' ? 1080 : 607),
      ratio: data.aspect_ratio || '9:16',
      duration: data.duration_seconds || 15,
      file_size: 10000000,
      format: 'mp4',
      create_time: now,
      signature: data.video_signature || Math.random().toString(36).substr(2, 12),
      allowed_placements: ['PLACEMENT_TIKTOK']
    };
  }
  
  // Reports / Analytics
  if (endpoint.includes('/report/integrated/get') || endpoint.includes('/analytics')) {
    const dataLevel = data?.data_level || 'AUCTION_CAMPAIGN';
    
    if (dataLevel === 'AUCTION_CAMPAIGN') {
      if (data?.filtering?.campaign_ids && data.filtering.campaign_ids.length > 0) {
        const campaignId = data.filtering.campaign_ids[0];
        const analytics = MOCK_ANALYTICS[campaignId];
        if (analytics) {
          return {
            list: [analytics],
            page_info: { page: 1, page_size: 100, total_number: 1, total_page: 1 }
          };
        }
      }
      
      // Return all campaign analytics
      return {
        list: [
          MOCK_ANALYTICS['1234567890'],
          MOCK_ANALYTICS['1234567891']
        ],
        page_info: { page: 1, page_size: 100, total_number: 2, total_page: 1 }
      };
    } else if (dataLevel === 'AUCTION_ADGROUP') {
      return {
        list: [MOCK_ANALYTICS['1111111111']],
        page_info: { page: 1, page_size: 100, total_number: 1, total_page: 1 }
      };
    } else if (dataLevel === 'AUCTION_AD') {
      return {
        list: [MOCK_ANALYTICS['2222222221']],
        page_info: { page: 1, page_size: 100, total_number: 1, total_page: 1 }
      };
    }
  }
  
  // Default response
  return {
    message: 'Mock response for sandbox mode',
    endpoint,
    method,
    data
  };
}

// Tool handler
async function handleToolCall(toolName, input) {
  const result = {
    tool: toolName,
    sandbox: !hasTikTokAds,
    timestamp: new Date().toISOString()
  };
  
  try {
    switch (toolName) {
      case 'tiktok_get_advertisers': {
        const response = await apiRequest('/oauth2/advertiser/get', 'GET', input);
        result.data = response.list || response;
        result.count = result.data.length;
        break;
      }
      
      case 'tiktok_get_campaigns': {
        const response = await apiRequest('/campaign/get', 'GET', input);
        result.data = response.list || response;
        result.count = result.data.length;
        break;
      }
      
      case 'tiktok_create_campaign': {
        const response = await apiRequest('/campaign/create', 'POST', input);
        result.data = response;
        result.message = `Created campaign: ${response.campaign_id}`;
        break;
      }
      
      case 'tiktok_update_campaign': {
        const response = await apiRequest('/campaign/update', 'POST', input);
        result.data = response;
        result.message = `Updated campaign: ${input.campaign_id}`;
        break;
      }
      
      case 'tiktok_get_ad_groups': {
        const response = await apiRequest('/adgroup/get', 'GET', input);
        result.data = response.list || response;
        result.count = result.data.length;
        break;
      }
      
      case 'tiktok_create_ad_group': {
        const response = await apiRequest('/adgroup/create', 'POST', input);
        result.data = response;
        result.message = `Created ad group: ${response.adgroup_id}`;
        break;
      }
      
      case 'tiktok_update_ad_group': {
        const response = await apiRequest('/adgroup/update', 'POST', input);
        result.data = response;
        result.message = `Updated ad group: ${input.adgroup_id}`;
        break;
      }
      
      case 'tiktok_get_ads': {
        const response = await apiRequest('/ad/get', 'GET', input);
        result.data = response.list || response;
        result.count = result.data.length;
        break;
      }
      
      case 'tiktok_create_ad': {
        const response = await apiRequest('/ad/create', 'POST', input);
        result.data = response;
        result.message = `Created ad: ${response.ad_id}`;
        break;
      }
      
      case 'tiktok_update_ad': {
        const response = await apiRequest('/ad/update', 'POST', input);
        result.data = response;
        result.message = `Updated ad: ${input.ad_id}`;
        break;
      }
      
      case 'tiktok_get_videos': {
        const response = await apiRequest('/file/video/ad/get', 'GET', input);
        result.data = response.list || response;
        result.count = result.data.length;
        break;
      }
      
      case 'tiktok_upload_video': {
        const response = await apiRequest('/file/video/ad/upload', 'POST', input);
        result.data = response;
        result.message = `Uploaded video: ${response.video_id}`;
        break;
      }
      
      case 'tiktok_get_reports': {
        const response = await apiRequest('/report/integrated/get', 'POST', input);
        result.data = response.list || response;
        result.count = Array.isArray(result.data) ? result.data.length : 1;
        break;
      }
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    result.status = 'success';
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

// Connection test
async function testConnection() {
  if (!hasTikTokAds) {
    return {
      status: 'ok',
      mode: 'sandbox',
      message: 'TikTok Ads connector running in sandbox mode (no credentials configured)',
      mock_data: {
        advertisers: MOCK_ADVERTISERS.length,
        campaigns: MOCK_CAMPAIGNS.length,
        ad_groups: MOCK_AD_GROUPS.length,
        ads: MOCK_ADS.length,
        videos: MOCK_VIDEOS.length
      }
    };
  }
  
  try {
    const response = await apiRequest('/oauth2/advertiser/get', 'GET', {});
    return {
      status: 'ok',
      mode: 'live',
      message: 'Successfully connected to TikTok Ads API',
      advertiser_id: advertiserId,
      advertisers: response.list?.length || 0
    };
  } catch (error) {
    return {
      status: 'error',
      mode: 'live',
      message: 'Failed to connect to TikTok Ads API',
      error: error.message
    };
  }
}

// Get connector info
function getInfo() {
  return {
    name,
    shortName,
    version,
    status,
    lastSync,
    oauth,
    sandbox: !hasTikTokAds,
    toolCount: tools.length,
    capabilities: {
      campaign_management: true,
      ad_group_management: true,
      ad_management: true,
      video_creative_management: true,
      interest_targeting: true,
      age_gender_targeting: true,
      analytics: true,
      vertical_video: true,
      spark_ads: true,
      shopping_ads: true
    }
  };
}

// Get tools
function getTools() {
  return tools;
}

// Update status
function setStatus(newStatus) {
  status = newStatus;
  lastSync = new Date().toISOString();
}

class TikTokAdsConnector extends BaseConnector {
  constructor() {
    super({
      name: 'TikTok Ads',
      shortName: 'TikTok',
      version: '1.0.0',
      oauth: {
        provider: 'tiktok',
        scopes: ['ad_management', 'ad_reporting'],
        apiEndpoint: 'https://business-api.tiktok.com/open_api/v1.3',
        tokenType: 'long_lived_access_token',
        accountIdKey: 'TIKTOK_ADVERTISER_ID'
      },
      envVars: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_ADVERTISER_ID'],
      connectionCheck: (creds) => !!(creds.TIKTOK_ACCESS_TOKEN && creds.TIKTOK_ADVERTISER_ID)
    });
    this.tools = tools;
  }

  async performConnectionTest() { return await testConnection(); }
  async executeLiveCall(toolName, params) { return await handleToolCall(toolName, params); }
  async executeSandboxCall(toolName, params) { return await handleToolCall(toolName, params); }
  async handleToolCall(toolName, params = {}) { return await handleToolCall(toolName, params); }
  getInfo() { return getInfo(); }
  getTools() { return getTools(); }
  async testConnection() { return await testConnection(); }
  setStatus(newStatus) { return setStatus(newStatus); }
}

module.exports = new TikTokAdsConnector();
