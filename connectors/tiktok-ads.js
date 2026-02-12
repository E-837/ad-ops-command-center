/**
 * TikTok Ads Connector (Refactored with BaseConnector)
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
 * Refactored: Now extends BaseConnector for DRY code
 */

const BaseConnector = require('./base-connector');

const API_VERSION = 'v1.3';
const BASE_URL = `https://business-api.tiktok.com/open_api/${API_VERSION}`;

class TikTokAdsConnector extends BaseConnector {
  constructor() {
    super({
      name: 'TikTok Ads',
      shortName: 'TikTok',
      version: '1.0.0',
      oauth: {
        provider: 'tiktok',
        scopes: ['ad_management', 'ad_reporting'],
        apiEndpoint: BASE_URL,
        tokenType: 'long_lived_access_token',
        accountIdKey: 'TIKTOK_ADVERTISER_ID'
      },
      envVars: [
        'TIKTOK_ACCESS_TOKEN',
        'TIKTOK_ADVERTISER_ID'
      ],
      connectionCheck: (creds) => !!(creds.TIKTOK_ACCESS_TOKEN && creds.TIKTOK_ADVERTISER_ID)
    });
    
    // Define platform-specific tools
    this.tools = [
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
            campaign_id: { type: 'string', description: 'Parent campaign ID' },
            adgroup_name: { type: 'string', description: 'Ad group name (max 512 chars)' },
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
            location_ids: { type: 'array', items: { type: 'string' }, description: 'Target location IDs (country codes)' },
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
            languages: { type: 'array', items: { type: 'string' }, description: 'Target language codes' },
            interest_category_ids: { type: 'array', items: { type: 'string' }, description: 'Interest category IDs' },
            budget: { type: 'number', description: 'Daily budget in dollars' },
            bid_type: {
              type: 'string',
              enum: ['BID_TYPE_MAX', 'BID_TYPE_NO_BID'],
              description: 'Bidding type',
              default: 'BID_TYPE_MAX'
            },
            bid_price: { type: 'number', description: 'Bid amount in dollars' },
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
            schedule_start_time: { type: 'string', description: 'Start time (YYYY-MM-DD HH:MM:SS)' },
            schedule_end_time: { type: 'string', description: 'End time (YYYY-MM-DD HH:MM:SS)' },
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
            adgroup_id: { type: 'string', description: 'Ad group ID to update' },
            adgroup_name: { type: 'string', description: 'Updated ad group name' },
            budget: { type: 'number', description: 'Updated daily budget in dollars' },
            bid_price: { type: 'number', description: 'Updated bid amount in dollars' },
            operation_status: {
              type: 'string',
              enum: ['ENABLE', 'DISABLE', 'DELETE'],
              description: 'Updated ad group status'
            },
            schedule_end_time: { type: 'string', description: 'Updated end time (YYYY-MM-DD HH:MM:SS)' }
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
                campaign_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by campaign IDs' },
                adgroup_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by ad group IDs' },
                ad_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by specific ad IDs' },
                primary_status: {
                  type: 'string',
                  enum: ['STATUS_ENABLE', 'STATUS_DISABLE', 'STATUS_DELETE', 'STATUS_ALL'],
                  description: 'Filter by ad status'
                }
              }
            },
            page: { type: 'number', minimum: 1, default: 1 },
            page_size: { type: 'number', minimum: 1, maximum: 100, default: 10 }
          }
        }
      },
      {
        name: 'tiktok_create_ad',
        description: 'Create a TikTok video ad',
        inputSchema: {
          type: 'object',
          properties: {
            adgroup_id: { type: 'string', description: 'Parent ad group ID' },
            ad_name: { type: 'string', description: 'Ad name (max 512 chars)' },
            ad_text: { type: 'string', description: 'Ad copy/text (max 100 chars)' },
            video_id: { type: 'string', description: 'Video creative ID (from uploaded video)' },
            call_to_action: {
              type: 'string',
              enum: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'BOOK_NOW', 'APPLY_NOW', 'WATCH_MORE', 'PLAY_GAME'],
              description: 'Call to action button',
              default: 'LEARN_MORE'
            },
            landing_page_url: { type: 'string', description: 'Destination URL' },
            display_name: { type: 'string', description: 'Brand/advertiser display name (max 40 chars)' },
            identity_type: {
              type: 'string',
              enum: ['BC_ACCOUNT', 'CUSTOMIZED_USER', 'TT_USER'],
              description: 'Identity type for the ad',
              default: 'BC_ACCOUNT'
            },
            spark_ads_eligible: { type: 'boolean', description: 'Enable Spark Ads (boost organic content)', default: false },
            shopping_ads_enabled: { type: 'boolean', description: 'Enable shopping features', default: false },
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
            ad_id: { type: 'string', description: 'Ad ID to update' },
            ad_name: { type: 'string', description: 'Updated ad name' },
            ad_text: { type: 'string', description: 'Updated ad copy' },
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
                video_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by specific video IDs' },
                width: { type: 'number', description: 'Filter by video width' },
                height: { type: 'number', description: 'Filter by video height' },
                ratio: {
                  type: 'array',
                  items: { type: 'string', enum: ['1:1', '9:16', '16:9'] },
                  description: 'Filter by aspect ratio'
                }
              }
            },
            page: { type: 'number', minimum: 1, default: 1 },
            page_size: { type: 'number', minimum: 1, maximum: 100, default: 20 }
          }
        }
      },
      {
        name: 'tiktok_upload_video',
        description: 'Upload a video creative (mock: returns video metadata)',
        inputSchema: {
          type: 'object',
          properties: {
            video_file: { type: 'string', description: 'Video file path or URL' },
            video_signature: { type: 'string', description: 'Video file MD5 hash (for deduplication)' },
            video_name: { type: 'string', description: 'Video name/description' },
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
              items: { type: 'string' },
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
                campaign_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by campaign IDs' },
                adgroup_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by ad group IDs' },
                ad_ids: { type: 'array', items: { type: 'string' }, description: 'Filter by ad IDs' }
              }
            },
            start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            page: { type: 'number', minimum: 1, default: 1 },
            page_size: { type: 'number', minimum: 1, maximum: 1000, default: 100 }
          },
          required: ['data_level', 'start_date', 'end_date']
        }
      }
    ];
    
    // Initialize mock data
    this.initMockData();
  }
  
  /**
   * Initialize mock data for sandbox mode
   */
  initMockData() {
    const advertiserId = this.credentials.TIKTOK_ADVERTISER_ID || '9876543210';
    
    this.MOCK_ADVERTISERS = [
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
    
    this.MOCK_CAMPAIGNS = [
      {
        campaign_id: '1234567890',
        advertiser_id: advertiserId,
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
        advertiser_id: advertiserId,
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
        advertiser_id: advertiserId,
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
    
    this.MOCK_AD_GROUPS = [
      {
        adgroup_id: '1111111111',
        campaign_id: '1234567890',
        advertiser_id: advertiserId,
        adgroup_name: 'Ages 18-24 - Fashion Lovers',
        placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
        placements: ['PLACEMENT_TIKTOK'],
        location_ids: ['6252001'],
        age_groups: ['AGE_18_24'],
        gender: 'GENDER_UNLIMITED',
        languages: ['en'],
        interest_category_ids: ['100001', '100002'],
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
        advertiser_id: advertiserId,
        adgroup_name: 'Ages 25-34 - Beauty Enthusiasts',
        placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
        placements: ['PLACEMENT_TIKTOK'],
        location_ids: ['6252001'],
        age_groups: ['AGE_25_34'],
        gender: 'GENDER_FEMALE',
        languages: ['en'],
        interest_category_ids: ['100003', '100004'],
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
      }
    ];
    
    this.MOCK_ADS = [
      {
        ad_id: '2222222221',
        adgroup_id: '1111111111',
        campaign_id: '1234567890',
        advertiser_id: advertiserId,
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
      }
    ];
    
    this.MOCK_VIDEOS = [
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
      }
    ];
    
    this.MOCK_ANALYTICS = {
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
          likes: 8500,
          comments: 1200,
          shares: 950
        }
      }
    };
  }
  
  /**
   * Platform-specific connection test
   */
  async performConnectionTest() {
    if (!this.isConnected) {
      return {
        mode: 'sandbox',
        message: 'TikTok Ads connector running in sandbox mode (no credentials configured)',
        mock_data: {
          advertisers: this.MOCK_ADVERTISERS.length,
          campaigns: this.MOCK_CAMPAIGNS.length,
          ad_groups: this.MOCK_AD_GROUPS.length,
          ads: this.MOCK_ADS.length,
          videos: this.MOCK_VIDEOS.length
        }
      };
    }
    
    return {
      mode: 'live',
      message: 'Successfully connected to TikTok Ads API',
      advertiser_id: this.credentials.TIKTOK_ADVERTISER_ID
    };
  }
  
  /**
   * Execute live API calls
   */
  async executeLiveCall(toolName, params) {
    const accessToken = this.credentials.TIKTOK_ACCESS_TOKEN;
    const advertiserId = this.credentials.TIKTOK_ADVERTISER_ID;
    
    // Map tool names to API endpoints
    const endpointMap = {
      'tiktok_get_advertisers': '/oauth2/advertiser/get',
      'tiktok_get_campaigns': '/campaign/get',
      'tiktok_create_campaign': '/campaign/create',
      'tiktok_update_campaign': '/campaign/update',
      'tiktok_get_ad_groups': '/adgroup/get',
      'tiktok_create_ad_group': '/adgroup/create',
      'tiktok_update_ad_group': '/adgroup/update',
      'tiktok_get_ads': '/ad/get',
      'tiktok_create_ad': '/ad/create',
      'tiktok_update_ad': '/ad/update',
      'tiktok_get_videos': '/file/video/ad/get',
      'tiktok_upload_video': '/file/video/ad/upload',
      'tiktok_get_reports': '/report/integrated/get'
    };
    
    const endpoint = endpointMap[toolName];
    if (!endpoint) {
      return this.errorResponse(`Unknown tool: ${toolName}`);
    }
    
    const method = toolName.includes('create') || toolName.includes('update') || toolName.includes('upload') || toolName.includes('reports') ? 'POST' : 'GET';
    const url = `${BASE_URL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    if (params && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify({
        advertiser_id: advertiserId,
        ...params
      });
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        return this.errorResponse(`TikTok API error: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.code !== 0) {
        return this.errorResponse(`TikTok API error: ${result.message}`);
      }
      
      return this.successResponse(result.data);
    } catch (error) {
      return this.errorResponse(`API request failed: ${error.message}`);
    }
  }
  
  /**
   * Execute sandbox mock calls
   */
  async executeSandboxCall(toolName, params) {
    const advertiserId = this.credentials.TIKTOK_ADVERTISER_ID || '9876543210';
    
    switch (toolName) {
      case 'tiktok_get_advertisers':
        return this.successResponse({
          list: this.MOCK_ADVERTISERS,
          page_info: { page: 1, page_size: 10, total_number: this.MOCK_ADVERTISERS.length, total_page: 1 }
        });
        
      case 'tiktok_get_campaigns': {
        let campaigns = [...this.MOCK_CAMPAIGNS];
        
        if (params.filtering?.primary_status && params.filtering.primary_status !== 'STATUS_ALL') {
          const statusMap = { 'STATUS_ENABLE': 'ENABLE', 'STATUS_DISABLE': 'DISABLE' };
          const targetStatus = statusMap[params.filtering.primary_status];
          campaigns = campaigns.filter(c => c.status === targetStatus);
        }
        
        if (params.filtering?.objective_type) {
          campaigns = campaigns.filter(c => c.objective_type === params.filtering.objective_type);
        }
        
        return this.successResponse({
          list: campaigns,
          page_info: { page: 1, page_size: 10, total_number: campaigns.length, total_page: 1 }
        });
      }
        
      case 'tiktok_create_campaign': {
        const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
        const now = new Date().toISOString();
        
        return this.successResponse({
          campaign_id: newId,
          advertiser_id: advertiserId,
          campaign_name: params.campaign_name,
          objective_type: params.objective_type,
          status: params.operation_status || 'DISABLE',
          budget_mode: params.budget_mode || 'BUDGET_MODE_DAY',
          budget: params.budget || 0,
          operation_status: params.operation_status || 'DISABLE',
          secondary_status: params.operation_status === 'ENABLE' ? 'CAMPAIGN_STATUS_ACTIVE' : 'CAMPAIGN_STATUS_PAUSED',
          create_time: now,
          modify_time: now,
          is_smart_performance_campaign: false
        });
      }
        
      case 'tiktok_update_campaign': {
        const campaign = this.MOCK_CAMPAIGNS.find(c => c.campaign_id === params.campaign_id) || this.MOCK_CAMPAIGNS[0];
        
        return this.successResponse({
          ...campaign,
          campaign_name: params.campaign_name || campaign.campaign_name,
          budget: params.budget || campaign.budget,
          operation_status: params.operation_status || campaign.operation_status,
          status: params.operation_status || campaign.status,
          modify_time: new Date().toISOString()
        });
      }
        
      case 'tiktok_get_ad_groups': {
        let adgroups = [...this.MOCK_AD_GROUPS];
        
        if (params.filtering?.campaign_ids) {
          adgroups = adgroups.filter(ag => params.filtering.campaign_ids.includes(ag.campaign_id));
        }
        
        return this.successResponse({
          list: adgroups,
          page_info: { page: 1, page_size: 10, total_number: adgroups.length, total_page: 1 }
        });
      }
        
      case 'tiktok_create_ad_group': {
        const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
        const now = new Date().toISOString();
        
        return this.successResponse({
          adgroup_id: newId,
          campaign_id: params.campaign_id,
          advertiser_id: advertiserId,
          adgroup_name: params.adgroup_name,
          placement_type: params.placement_type || 'PLACEMENT_TYPE_AUTOMATIC',
          placements: params.placements || ['PLACEMENT_TIKTOK'],
          location_ids: params.location_ids || [],
          optimization_goal: params.optimization_goal,
          budget: params.budget || 0,
          bid_price: params.bid_price || 0,
          status: params.operation_status || 'DISABLE',
          create_time: now
        });
      }
        
      case 'tiktok_update_ad_group': {
        const adgroup = this.MOCK_AD_GROUPS.find(ag => ag.adgroup_id === params.adgroup_id) || this.MOCK_AD_GROUPS[0];
        
        return this.successResponse({
          ...adgroup,
          adgroup_name: params.adgroup_name || adgroup.adgroup_name,
          budget: params.budget || adgroup.budget,
          bid_price: params.bid_price || adgroup.bid_price,
          modify_time: new Date().toISOString()
        });
      }
        
      case 'tiktok_get_ads': {
        let ads = [...this.MOCK_ADS];
        
        if (params.filtering?.adgroup_ids) {
          ads = ads.filter(ad => params.filtering.adgroup_ids.includes(ad.adgroup_id));
        }
        
        return this.successResponse({
          list: ads,
          page_info: { page: 1, page_size: 10, total_number: ads.length, total_page: 1 }
        });
      }
        
      case 'tiktok_create_ad': {
        const newId = String(Math.floor(Math.random() * 9000000000) + 1000000000);
        const now = new Date().toISOString();
        
        return this.successResponse({
          ad_id: newId,
          adgroup_id: params.adgroup_id,
          ad_name: params.ad_name,
          ad_text: params.ad_text,
          video_id: params.video_id,
          call_to_action: params.call_to_action || 'LEARN_MORE',
          landing_page_url: params.landing_page_url,
          display_name: params.display_name,
          status: params.operation_status || 'DISABLE',
          create_time: now
        });
      }
        
      case 'tiktok_update_ad': {
        const ad = this.MOCK_ADS.find(a => a.ad_id === params.ad_id) || this.MOCK_ADS[0];
        
        return this.successResponse({
          ...ad,
          ad_name: params.ad_name || ad.ad_name,
          ad_text: params.ad_text || ad.ad_text,
          modify_time: new Date().toISOString()
        });
      }
        
      case 'tiktok_get_videos':
        return this.successResponse({
          list: this.MOCK_VIDEOS,
          page_info: { page: 1, page_size: 20, total_number: this.MOCK_VIDEOS.length, total_page: 1 }
        });
        
      case 'tiktok_upload_video': {
        const newId = `v_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        return this.successResponse({
          video_id: newId,
          video_name: params.video_name || 'Uploaded Video',
          ratio: params.aspect_ratio || '9:16',
          duration: params.duration_seconds || 15,
          create_time: now
        });
      }
        
      case 'tiktok_get_reports': {
        const dataLevel = params.data_level || 'AUCTION_CAMPAIGN';
        
        if (dataLevel === 'AUCTION_CAMPAIGN') {
          return this.successResponse({
            list: [this.MOCK_ANALYTICS['1234567890']],
            page_info: { page: 1, page_size: 100, total_number: 1, total_page: 1 }
          });
        }
        
        return this.successResponse({
          list: [],
          page_info: { page: 1, page_size: 100, total_number: 0, total_page: 1 }
        });
      }
        
      default:
        return this.errorResponse(`Unknown tool: ${toolName}`);
    }
  }
  
  /**
   * Override getInfo to include TikTok-specific capabilities
   */
  getInfo() {
    const info = super.getInfo();
    return {
      ...info,
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
}

// Export singleton instance
module.exports = new TikTokAdsConnector();
