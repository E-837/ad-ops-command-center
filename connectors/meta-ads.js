/**
 * Meta Ads Connector
 * Integration with Meta Marketing API for paid social campaign management
 * 
 * Official API: https://graph.facebook.com/v22.0/
 * 
 * Setup Instructions:
 * 1. Create a Meta Business App at developers.facebook.com
 * 2. Add Marketing API permissions (ads_management, ads_read, read_insights)
 * 3. Get a long-lived User Access Token or System User Token
 * 4. Set environment variables in config/.env:
 *    META_APP_ID=your_app_id
 *    META_APP_SECRET=your_app_secret
 *    META_ACCESS_TOKEN=your_access_token
 *    META_AD_ACCOUNT_ID=act_XXXXXXXXXX
 * 
 * Testing in Sandbox:
 * - Without credentials, connector returns realistic mock data
 * - Use Meta's Test Ad Account for safe testing: business.facebook.com/settings/ad-accounts
 * - Test tokens expire after 60 days - use long-lived tokens for production
 * 
 * Ad Ops Use Cases:
 * - Facebook & Instagram campaign management
 * - Advanced audience targeting and lookalikes
 * - Creative testing and optimization
 * - Social commerce and conversion tracking
 * - Cross-platform social advertising
 */

const fs = require('fs');
const path = require('path');

const name = 'Meta Ads';
const shortName = 'Meta';
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
const appId = env.META_APP_ID || null;
const appSecret = env.META_APP_SECRET || null;
let accessToken = env.META_ACCESS_TOKEN || null;
const adAccountId = env.META_AD_ACCOUNT_ID || null;

const hasMetaAds = !!(accessToken && adAccountId);

// OAuth configuration
const oauth = {
  provider: 'meta',
  scopes: ['ads_management', 'ads_read', 'read_insights'],
  apiEndpoint: 'https://graph.facebook.com/v22.0',
  connected: hasMetaAds,
  accountId: adAccountId ? `***${adAccountId.slice(-4)}` : null,
  tokenType: 'long_lived_user_token'
};

// API version
const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Tool definitions for MCP integration
const tools = [
  {
    name: 'meta_ads_get_campaigns',
    description: 'List campaigns with performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campaign fields to retrieve (default: id,name,status,objective,daily_budget)'
        },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'lifetime'],
          description: 'Date range preset for insights'
        },
        effective_status: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] },
          description: 'Filter by campaign status'
        },
        limit: {
          type: 'number',
          description: 'Number of campaigns to return (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'meta_ads_create_campaign',
    description: 'Create a new Meta Ads campaign (Facebook/Instagram)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        objective: {
          type: 'string',
          enum: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES'],
          description: 'Campaign objective'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial campaign status (default: PAUSED for safety)'
        },
        special_ad_categories: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['CREDIT', 'EMPLOYMENT', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS', 'ONLINE_GAMBLING_AND_GAMING', 'NONE']
          },
          description: 'Special ad categories if applicable (required by law for certain industries)'
        },
        bid_strategy: {
          type: 'string',
          enum: ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'],
          description: 'Campaign bid strategy'
        }
      },
      required: ['name', 'objective']
    }
  },
  {
    name: 'meta_ads_update_campaign',
    description: 'Update campaign settings (name, status, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        name: { type: 'string', description: 'New campaign name' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'New campaign status'
        },
        daily_budget: {
          type: 'number',
          description: 'Daily budget in cents (e.g., 10000 = $100)'
        },
        lifetime_budget: {
          type: 'number',
          description: 'Lifetime budget in cents'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'meta_ads_get_ad_sets',
    description: 'List ad sets with targeting and performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { 
          type: 'string', 
          description: 'Campaign ID (optional - if not provided, gets all ad sets for account)' 
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ad set fields to retrieve'
        },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Date range preset for insights'
        },
        limit: {
          type: 'number',
          description: 'Number of ad sets to return (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'meta_ads_create_ad_set',
    description: 'Create an ad set with targeting and budget',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Parent campaign ID' },
        name: { type: 'string', description: 'Ad set name' },
        daily_budget: { 
          type: 'number', 
          description: 'Daily budget in cents (e.g., 5000 = $50). Use either daily_budget or lifetime_budget, not both.' 
        },
        lifetime_budget: {
          type: 'number',
          description: 'Lifetime budget in cents (requires start_time and end_time)'
        },
        bid_amount: { 
          type: 'number', 
          description: 'Bid amount in cents (optional, for bid cap strategy)' 
        },
        billing_event: {
          type: 'string',
          enum: ['IMPRESSIONS', 'CLICKS', 'APP_INSTALLS', 'OFFER_CLAIMS', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'VIDEO_VIEWS', 'THRUPLAY'],
          description: 'Billing event'
        },
        optimization_goal: {
          type: 'string', 
          enum: ['REACH', 'IMPRESSIONS', 'CLICKS', 'APP_INSTALLS', 'LINK_CLICKS', 'OFFSITE_CONVERSIONS', 'CONVERSATIONS', 'LEAD_GENERATION', 'QUALITY_LEAD', 'VALUE', 'THRUPLAY'],
          description: 'Optimization goal'
        },
        targeting: {
          type: 'object',
          properties: {
            age_min: { type: 'number', minimum: 13, description: 'Minimum age (13-65)' },
            age_max: { type: 'number', maximum: 65, description: 'Maximum age (13-65)' },
            genders: {
              type: 'array',
              items: { type: 'number', enum: [1, 2] },
              description: 'Gender targeting: 1=male, 2=female (omit for all genders)'
            },
            geo_locations: {
              type: 'object',
              properties: {
                countries: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Country codes (e.g., ["US", "CA", "GB"])'
                },
                cities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', description: 'City key from targeting search' },
                      radius: { type: 'number', description: 'Radius around city' },
                      distance_unit: { type: 'string', enum: ['mile', 'kilometer'] }
                    }
                  }
                },
                regions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', description: 'Region key' }
                    }
                  }
                }
              },
              description: 'Geographic targeting (at least countries required)'
            },
            interests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Interest ID from targeting search' },
                  name: { type: 'string', description: 'Interest name (optional)' }
                }
              },
              description: 'Interest targeting'
            },
            behaviors: {
              type: 'array',
              items: {
                type: 'object', 
                properties: {
                  id: { type: 'string', description: 'Behavior ID from targeting search' },
                  name: { type: 'string', description: 'Behavior name (optional)' }
                }
              },
              description: 'Behavior targeting'
            },
            custom_audiences: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom audience IDs to target'
            },
            excluded_custom_audiences: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom audience IDs to exclude'
            },
            device_platforms: {
              type: 'array',
              items: { type: 'string', enum: ['mobile', 'desktop'] },
              description: 'Device platform targeting'
            },
            publisher_platforms: {
              type: 'array', 
              items: { type: 'string', enum: ['facebook', 'instagram', 'messenger', 'audience_network'] },
              description: 'Publisher platform targeting'
            }
          },
          required: ['geo_locations'],
          description: 'Targeting specification'
        },
        start_time: { 
          type: 'string', 
          description: 'Start time (ISO 8601 format, e.g., 2026-02-15T08:00:00+0000)' 
        },
        end_time: { 
          type: 'string', 
          description: 'End time (ISO 8601 format, required if using lifetime_budget)' 
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial ad set status (default: PAUSED)'
        }
      },
      required: ['campaign_id', 'name', 'billing_event', 'optimization_goal', 'targeting']
    }
  },
  {
    name: 'meta_ads_update_ad_set',
    description: 'Update ad set settings (budget, targeting, status, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: { type: 'string', description: 'Ad set ID' },
        name: { type: 'string', description: 'New ad set name' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'New ad set status'
        },
        daily_budget: {
          type: 'number',
          description: 'New daily budget in cents'
        },
        bid_amount: {
          type: 'number',
          description: 'New bid amount in cents'
        }
      },
      required: ['ad_set_id']
    }
  },
  {
    name: 'meta_ads_get_ads',
    description: 'List ads with creative and performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: { 
          type: 'string', 
          description: 'Ad set ID (optional - if not provided, gets all ads for account)' 
        },
        campaign_id: {
          type: 'string',
          description: 'Campaign ID (optional - filter ads by campaign)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ad fields to retrieve'
        },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Date range preset for insights'
        },
        limit: {
          type: 'number',
          description: 'Number of ads to return (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'meta_ads_create_ad',
    description: 'Create an ad with creative (image, video, or carousel)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: { type: 'string', description: 'Parent ad set ID' },
        name: { type: 'string', description: 'Ad name' },
        creative: {
          type: 'object',
          properties: {
            object_story_spec: {
              type: 'object',
              properties: {
                page_id: { type: 'string', description: 'Facebook Page ID' },
                link_data: {
                  type: 'object',
                  properties: {
                    link: { type: 'string', description: 'Landing page URL' },
                    message: { type: 'string', description: 'Ad text/copy (primary text)' },
                    name: { type: 'string', description: 'Headline' },
                    description: { type: 'string', description: 'Description text' },
                    call_to_action: {
                      type: 'object',
                      properties: {
                        type: { 
                          type: 'string',
                          enum: ['LEARN_MORE', 'SHOP_NOW', 'BOOK_TRAVEL', 'DOWNLOAD', 'SIGN_UP', 'WATCH_MORE', 'CONTACT_US', 'GET_QUOTE', 'APPLY_NOW', 'SEE_MENU', 'BUY_NOW', 'INSTALL_APP', 'SUBSCRIBE', 'NO_BUTTON'],
                          description: 'Call-to-action button type'
                        }
                      },
                      required: ['type']
                    },
                    image_hash: { 
                      type: 'string', 
                      description: 'Uploaded image hash (from image upload API)' 
                    },
                    video_id: { 
                      type: 'string', 
                      description: 'Video asset ID (from video upload API)' 
                    }
                  },
                  required: ['link', 'message'],
                  description: 'Link ad creative data'
                },
                video_data: {
                  type: 'object',
                  properties: {
                    video_id: { type: 'string', description: 'Video asset ID' },
                    message: { type: 'string', description: 'Video ad text/copy' },
                    title: { type: 'string', description: 'Video title' },
                    call_to_action: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        value: {
                          type: 'object',
                          properties: {
                            link: { type: 'string' }
                          }
                        }
                      }
                    }
                  },
                  required: ['video_id'],
                  description: 'Video ad creative data'
                }
              },
              required: ['page_id'],
              description: 'Object story specification for creative'
            },
            degrees_of_freedom_spec: {
              type: 'object',
              properties: {
                creative_features_spec: {
                  type: 'object',
                  properties: {
                    standard_enhancements: {
                      type: 'object',
                      properties: {
                        enroll_status: { 
                          type: 'string', 
                          enum: ['OPT_IN', 'OPT_OUT'],
                          description: 'Enable Meta\'s Advantage+ creative optimizations'
                        }
                      }
                    }
                  }
                }
              },
              description: 'Creative optimization settings'
            }
          },
          required: ['object_story_spec'],
          description: 'Ad creative specification'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial ad status (default: PAUSED)'
        }
      },
      required: ['ad_set_id', 'name', 'creative']
    }
  },
  {
    name: 'meta_ads_update_ad',
    description: 'Update ad settings (name, status, creative)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { type: 'string', description: 'Ad ID' },
        name: { type: 'string', description: 'New ad name' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'New ad status'
        }
      },
      required: ['ad_id']
    }
  },
  {
    name: 'meta_ads_get_insights',
    description: 'Get performance insights and metrics with breakdowns',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['account', 'campaign', 'adset', 'ad'],
          description: 'Reporting level'
        },
        object_id: { 
          type: 'string', 
          description: 'ID of the object to get insights for (campaign/adset/ad ID, not needed for account level)' 
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Insight fields to retrieve (e.g., impressions, clicks, spend, cpm, cpc, ctr, conversions, actions)'
        },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'lifetime'],
          description: 'Date range preset'
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            until: { type: 'string', description: 'End date (YYYY-MM-DD)' }
          },
          description: 'Custom date range (alternative to date_preset)'
        },
        breakdowns: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['age', 'gender', 'country', 'region', 'placement', 'device_platform', 'publisher_platform', 'impression_device', 'product_id', 'hourly_stats_aggregated_by_advertiser_time_zone', 'hourly_stats_aggregated_by_audience_time_zone']
          },
          description: 'Breakdown dimensions for insights'
        },
        time_increment: {
          type: 'string',
          description: 'Time increment for data (e.g., "1" for daily, "7" for weekly, "monthly", "all_days")'
        }
      },
      required: ['level']
    }
  },
  {
    name: 'meta_ads_get_audiences',
    description: 'List custom audiences for targeting',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Audience fields to retrieve (e.g., id, name, approximate_count, subtype, delivery_status)'
        },
        limit: {
          type: 'number',
          description: 'Number of audiences to return (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'meta_ads_create_audience',
    description: 'Create a custom audience for targeting',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Audience name' },
        subtype: {
          type: 'string',
          enum: ['CUSTOM', 'WEBSITE', 'APP', 'OFFLINE_CONVERSION', 'CLAIM', 'PARTNER', 'MANAGED', 'VIDEO', 'LOOKALIKE', 'ENGAGEMENT', 'DATA_SET', 'BAG_OF_ACCOUNTS', 'STUDY_RULE_AUDIENCE', 'PLACEMENT', 'MULTICOUNTRY_COMBINATION'],
          description: 'Audience subtype (CUSTOM for customer list, WEBSITE for pixel, LOOKALIKE for lookalike)'
        },
        description: {
          type: 'string',
          description: 'Audience description'
        },
        customer_file_source: {
          type: 'string',
          enum: ['USER_PROVIDED_ONLY', 'PARTNER_PROVIDED_ONLY', 'BOTH_USER_AND_PARTNER_PROVIDED'],
          description: 'For CUSTOM audiences - source of customer data'
        },
        origin_audience_id: {
          type: 'string',
          description: 'For LOOKALIKE audiences - source audience ID'
        },
        lookalike_spec: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['SIMILARITY', 'REACH'],
              description: 'Lookalike type'
            },
            ratio: {
              type: 'number',
              minimum: 0.01,
              maximum: 0.20,
              description: 'Lookalike ratio (0.01 = 1% to 0.20 = 20%)'
            },
            country: {
              type: 'string',
              description: 'Target country code for lookalike'
            }
          },
          description: 'Lookalike specification (for LOOKALIKE audiences)'
        }
      },
      required: ['name', 'subtype']
    }
  },
  {
    name: 'meta_ads_get_ad_accounts',
    description: 'List accessible ad accounts',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ad account fields to retrieve (e.g., id, name, account_status, currency, timezone_name, spend_cap)'
        }
      }
    }
  }
];

// Mock data for sandbox mode (realistic Meta campaign structure)
const MOCK_CAMPAIGNS = [
  {
    id: '120330000000001',
    account_id: adAccountId || 'act_120330000000000',
    name: 'Q1 2026 - Brand Awareness',
    objective: 'OUTCOME_AWARENESS',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    created_time: '2026-01-15T10:00:00+0000',
    updated_time: '2026-02-08T14:30:00+0000',
    start_time: '2026-01-15T08:00:00+0000',
    stop_time: '2026-03-31T23:59:59+0000',
    special_ad_categories: [],
    daily_budget: '15000',
    lifetime_budget: null,
    insights: {
      impressions: '4200000',
      reach: '1800000',
      frequency: '2.33',
      clicks: '84000',
      cpm: '8.57', 
      cpc: '0.43',
      ctr: '2.00',
      spend: '36000.00',
      social_spend: '14400.00',
      unique_clicks: '78000',
      cost_per_unique_click: '0.46',
      actions: [
        { action_type: 'like', value: '3200' },
        { action_type: 'comment', value: '890' },
        { action_type: 'share', value: '450' },
        { action_type: 'post_engagement', value: '4540' },
        { action_type: 'page_engagement', value: '5200' }
      ],
      video_views: '420000',
      video_avg_time_watched_actions: [
        { action_type: 'video_view', value: '12.4' }
      ]
    }
  },
  {
    id: '120330000000002', 
    account_id: adAccountId || 'act_120330000000000',
    name: 'Retargeting - Website Visitors',
    objective: 'OUTCOME_SALES',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    created_time: '2026-01-20T14:00:00+0000',
    updated_time: '2026-02-09T09:15:00+0000',
    start_time: '2026-01-20T08:00:00+0000',
    stop_time: '2026-04-20T23:59:59+0000',
    special_ad_categories: [],
    daily_budget: '25000',
    lifetime_budget: null,
    insights: {
      impressions: '680000',
      reach: '125000',
      frequency: '5.44',
      clicks: '20400',
      cpm: '22.06',
      cpc: '0.74',
      ctr: '3.00',
      spend: '15000.00',
      unique_clicks: '17800',
      cost_per_unique_click: '0.84',
      actions: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '450' },
        { action_type: 'offsite_conversion.fb_pixel_add_to_cart', value: '1800' },
        { action_type: 'offsite_conversion.fb_pixel_initiate_checkout', value: '675' },
        { action_type: 'link_click', value: '18200' }
      ],
      action_values: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '135000.00' }
      ],
      cost_per_action_type: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '33.33' }
      ],
      conversion_rate_ranking: 'ABOVE_AVERAGE',
      engagement_rate_ranking: 'AVERAGE',
      quality_ranking: 'ABOVE_AVERAGE'
    }
  },
  {
    id: '120330000000003',
    account_id: adAccountId || 'act_120330000000000', 
    name: 'Lead Generation - AI Tools',
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED',
    effective_status: 'PAUSED',
    created_time: '2026-02-01T11:30:00+0000',
    updated_time: '2026-02-08T16:45:00+0000',
    start_time: '2026-02-01T08:00:00+0000',
    stop_time: '2026-05-01T23:59:59+0000',
    special_ad_categories: [],
    daily_budget: '12000',
    lifetime_budget: null,
    insights: {
      impressions: '890000',
      reach: '315000',
      frequency: '2.83',
      clicks: '26700',
      cpm: '5.62',
      cpc: '0.19',
      ctr: '3.00',
      spend: '5000.00',
      unique_clicks: '24500',
      cost_per_unique_click: '0.20',
      actions: [
        { action_type: 'lead', value: '1250' },
        { action_type: 'offsite_conversion.fb_pixel_lead', value: '890' },
        { action_type: 'link_click', value: '25200' }
      ],
      cost_per_action_type: [
        { action_type: 'lead', value: '4.00' },
        { action_type: 'offsite_conversion.fb_pixel_lead', value: '5.62' }
      ],
      conversion_rate_ranking: 'ABOVE_AVERAGE',
      engagement_rate_ranking: 'ABOVE_AVERAGE', 
      quality_ranking: 'ABOVE_AVERAGE'
    }
  }
];

const MOCK_AD_SETS = [
  {
    id: '120330000000101',
    account_id: adAccountId || 'act_120330000000000',
    campaign_id: '120330000000001',
    name: 'Tech Enthusiasts 25-45',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    configured_status: 'ACTIVE',
    created_time: '2026-01-15T10:30:00+0000',
    updated_time: '2026-02-08T14:30:00+0000',
    daily_budget: '7500',
    lifetime_budget: null,
    bid_amount: '250',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'IMPRESSIONS',
    targeting: {
      age_min: 25,
      age_max: 45,
      genders: [1, 2],
      geo_locations: {
        countries: ['US', 'CA', 'GB', 'AU']
      },
      interests: [
        { id: '6003020834693', name: 'Technology' },
        { id: '6003348108155', name: 'Artificial intelligence' },
        { id: '6003195797498', name: 'Software' }
      ],
      device_platforms: ['mobile', 'desktop'],
      publisher_platforms: ['facebook', 'instagram']
    },
    insights: {
      impressions: '2100000',
      reach: '900000',
      frequency: '2.33',
      clicks: '42000',
      cpm: '8.57',
      cpc: '0.43',
      ctr: '2.00',
      spend: '18000.00',
      actions: [
        { action_type: 'like', value: '1600' },
        { action_type: 'post_engagement', value: '2270' }
      ]
    }
  },
  {
    id: '120330000000102', 
    account_id: adAccountId || 'act_120330000000000',
    campaign_id: '120330000000002',
    name: 'Website Visitors - Last 30 Days',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    configured_status: 'ACTIVE',
    created_time: '2026-01-20T14:30:00+0000',
    updated_time: '2026-02-09T09:15:00+0000',
    daily_budget: '25000',
    lifetime_budget: null,
    bid_amount: '500',
    billing_event: 'CLICKS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    targeting: {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      custom_audiences: ['120330000000201'],
      geo_locations: {
        countries: ['US']
      },
      device_platforms: ['mobile', 'desktop'],
      publisher_platforms: ['facebook', 'instagram', 'audience_network']
    },
    insights: {
      impressions: '680000',
      reach: '125000',
      frequency: '5.44',
      clicks: '20400',
      cpm: '22.06',
      cpc: '0.74',
      ctr: '3.00',
      spend: '15000.00',
      actions: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '450' },
        { action_type: 'link_click', value: '18200' }
      ],
      cost_per_action_type: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '33.33' }
      ]
    }
  }
];

const MOCK_ADS = [
  {
    id: '120330000000301',
    account_id: adAccountId || 'act_120330000000000',
    campaign_id: '120330000000001',
    adset_id: '120330000000101',
    name: 'Locke AI - Brand Video',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    configured_status: 'ACTIVE',
    created_time: '2026-01-15T11:00:00+0000',
    updated_time: '2026-02-08T14:30:00+0000',
    creative: {
      id: '120330000000401',
      object_story_spec: {
        page_id: '120330000000501',
        video_data: {
          video_id: '120330000000601',
          message: 'Meet Locke AI - Your intelligent assistant for streamlined workflows. Experience the future of productivity.',
          call_to_action: {
            type: 'LEARN_MORE',
            value: {
              link: 'https://locke.ai/demo'
            }
          }
        }
      }
    },
    insights: {
      impressions: '1050000',
      reach: '450000',
      frequency: '2.33',
      clicks: '21000',
      cpm: '8.57',
      cpc: '0.43', 
      ctr: '2.00',
      spend: '9000.00',
      actions: [
        { action_type: 'video_view', value: '315000' },
        { action_type: 'like', value: '800' },
        { action_type: 'link_click', value: '18900' }
      ],
      video_play_actions: [
        { action_type: 'video_view', value: '315000' }
      ],
      video_p25_watched_actions: [
        { action_type: 'video_view', value: '252000' }
      ],
      video_p50_watched_actions: [
        { action_type: 'video_view', value: '189000' }
      ],
      video_p75_watched_actions: [
        { action_type: 'video_view', value: '94500' }
      ],
      video_p100_watched_actions: [
        { action_type: 'video_view', value: '31500' }
      ]
    }
  },
  {
    id: '120330000000302',
    account_id: adAccountId || 'act_120330000000000',
    campaign_id: '120330000000002', 
    adset_id: '120330000000102',
    name: 'Retargeting - Special Offer',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    configured_status: 'ACTIVE', 
    created_time: '2026-01-20T15:00:00+0000',
    updated_time: '2026-02-09T09:15:00+0000',
    creative: {
      id: '120330000000402',
      object_story_spec: {
        page_id: '120330000000501',
        link_data: {
          link: 'https://locke.ai/offer',
          message: 'Don\'t miss out! Get 30% off Locke AI Pro. Limited time offer for returning visitors.',
          name: '30% Off Locke AI Pro - Limited Time',
          description: 'Transform your workflow with intelligent automation. Exclusive discount for website visitors.',
          call_to_action: {
            type: 'SHOP_NOW'
          },
          image_hash: 'abcdef123456789'
        }
      }
    },
    insights: {
      impressions: '340000',
      reach: '62500',
      frequency: '5.44',
      clicks: '10200',
      cpm: '22.06',
      cpc: '0.74',
      ctr: '3.00',
      spend: '7500.00',
      actions: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '225' },
        { action_type: 'offsite_conversion.fb_pixel_add_to_cart', value: '900' },
        { action_type: 'link_click', value: '9100' }
      ],
      action_values: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '67500.00' }
      ],
      cost_per_action_type: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '33.33' }
      ]
    }
  }
];

const MOCK_AUDIENCES = [
  {
    id: '120330000000201',
    account_id: adAccountId || 'act_120330000000000',
    name: 'Website Visitors - 30 Days',
    subtype: 'WEBSITE',
    description: 'People who visited our website in the last 30 days',
    approximate_count: 125000,
    delivery_status: {
      code: 200,
      description: 'This audience is ready for use'
    },
    operation_status: {
      code: 200,
      description: 'Normal'
    },
    time_created: '2026-01-10T09:00:00+0000',
    time_updated: '2026-02-10T14:30:00+0000'
  },
  {
    id: '120330000000202',
    account_id: adAccountId || 'act_120330000000000',
    name: 'Engaged with Posts - 90 Days',
    subtype: 'ENGAGEMENT',
    description: 'People who engaged with our Facebook/Instagram posts',
    approximate_count: 48000,
    delivery_status: {
      code: 200,
      description: 'This audience is ready for use'
    },
    time_created: '2026-01-05T10:30:00+0000',
    time_updated: '2026-02-10T14:30:00+0000'
  },
  {
    id: '120330000000203',
    account_id: adAccountId || 'act_120330000000000',
    name: 'Lookalike - Website Visitors 1%',
    subtype: 'LOOKALIKE',
    description: '1% lookalike based on website visitors',
    approximate_count: 2100000,
    lookalike_spec: {
      type: 'SIMILARITY',
      ratio: 0.01,
      country: 'US',
      origin_audience_id: '120330000000201'
    },
    delivery_status: {
      code: 200,
      description: 'This audience is ready for use'
    },
    time_created: '2026-01-25T11:00:00+0000',
    time_updated: '2026-02-10T14:30:00+0000'
  }
];

/**
 * Make authenticated Meta API request
 */
async function apiRequest(endpoint, options = {}, retried = false) {
  if (!hasMetaAds) {
    throw new Error('Meta Ads not configured - missing access token or ad account ID. Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in config/.env');
  }
  
  const url = `${BASE_URL}${endpoint}`;
  const params = new URLSearchParams(options.params || {});
  params.append('access_token', accessToken);
  
  const fullUrl = `${url}?${params.toString()}`;
  
  console.log(`[Meta Ads] ${options.method || 'GET'} ${endpoint}`);
  
  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  // Handle rate limiting
  if (response.status === 429 || response.status === 80004) {
    const retryAfter = response.headers.get('retry-after') || '60';
    console.log(`[Meta Ads] Rate limited. Retry after ${retryAfter}s`);
    throw new Error(`Meta API rate limit exceeded. Retry after ${retryAfter} seconds.`);
  }
  
  // Handle token expiration
  if (response.status === 401 || response.status === 190) {
    console.log('[Meta Ads] Access token expired or invalid');
    throw new Error('Meta access token expired or invalid. Please refresh your token.');
  }
  
  if (!response.ok) {
    const err = await response.text();
    let errorMsg;
    try {
      const errorData = JSON.parse(err);
      errorMsg = errorData.error?.message || err;
      
      // Provide helpful error messages for common issues
      if (errorMsg.includes('Insufficient permission')) {
        errorMsg += ' - Ensure your access token has ads_management and ads_read permissions.';
      } else if (errorMsg.includes('Invalid parameter')) {
        errorMsg += ' - Check your request parameters match Meta API specifications.';
      }
    } catch (e) {
      errorMsg = err;
    }
    throw new Error(`Meta API error (${response.status}): ${errorMsg}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Refresh long-lived access token (Meta tokens last 60 days)
 * This exchanges a short-lived token for a long-lived one, or extends a long-lived token
 */
async function refreshAccessToken() {
  if (!appId || !appSecret) {
    throw new Error('Missing META_APP_ID or META_APP_SECRET for token refresh');
  }
  
  console.log('[Meta Ads] Refreshing access token...');
  
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: accessToken
  });
  
  const response = await fetch(`${BASE_URL}/oauth/access_token?${params.toString()}`);
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Meta token refresh failed: ${response.status} - ${err}`);
  }
  
  const data = await response.json();
  accessToken = data.access_token;
  
  console.log('[Meta Ads] Token refreshed successfully. New token expires in:', data.expires_in, 'seconds');
  console.log('[Meta Ads] Update META_ACCESS_TOKEN in config/.env with the new token');
  
  return accessToken;
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
    connected: hasMetaAds,
    features: ['Facebook Ads', 'Instagram Ads', 'Audience Network', 'Messenger Ads', 'Custom Audiences', 'Lookalike Audiences', 'Dynamic Ads', 'Video Ads', 'Carousel Ads'],
    objectives: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES'],
    placements: ['facebook', 'instagram', 'messenger', 'audience_network'],
    toolCount: tools.length,
    sandbox: !hasMetaAds
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  if (!hasMetaAds) {
    // Sandbox mode - return mock data
    return handleSandboxToolCall(toolName, params);
  }
  
  try {
    switch (toolName) {
      case 'meta_ads_get_campaigns':
        return await getCampaigns(params);
      case 'meta_ads_create_campaign':
        return await createCampaign(params);
      case 'meta_ads_update_campaign':
        return await updateCampaign(params);
      case 'meta_ads_get_ad_sets':
        return await getAdSets(params);
      case 'meta_ads_create_ad_set':
        return await createAdSet(params);
      case 'meta_ads_update_ad_set':
        return await updateAdSet(params);
      case 'meta_ads_get_ads':
        return await getAds(params);
      case 'meta_ads_create_ad':
        return await createAd(params);
      case 'meta_ads_update_ad':
        return await updateAd(params);
      case 'meta_ads_get_insights':
        return await getInsights(params);
      case 'meta_ads_get_audiences':
        return await getAudiences(params);
      case 'meta_ads_create_audience':
        return await createAudience(params);
      case 'meta_ads_get_ad_accounts':
        return await getAdAccounts(params);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    status = 'error';
    console.error(`[Meta Ads] Error in ${toolName}:`, err.message);
    throw err;
  }
}

/**
 * Handle tool calls in sandbox mode (mock data)
 */
function handleSandboxToolCall(toolName, params) {
  const sandboxResponse = { 
    sandbox: true,
    message: 'Using sandbox mode. Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in config/.env to enable live API.',
    toolName,
    params
  };
  
  switch (toolName) {
    case 'meta_ads_get_campaigns':
      let campaigns = [...MOCK_CAMPAIGNS];
      if (params.effective_status) {
        campaigns = campaigns.filter(c => params.effective_status.includes(c.effective_status));
      }
      return {
        ...sandboxResponse,
        data: campaigns,
        summary: {
          total: campaigns.length,
          active: campaigns.filter(c => c.effective_status === 'ACTIVE').length,
          paused: campaigns.filter(c => c.effective_status === 'PAUSED').length
        }
      };
      
    case 'meta_ads_create_campaign':
      return {
        ...sandboxResponse,
        data: {
          id: `1203300000000${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
          account_id: adAccountId || 'act_120330000000000',
          name: params.name,
          objective: params.objective,
          status: params.status || 'PAUSED',
          effective_status: params.status || 'PAUSED',
          configured_status: params.status || 'PAUSED',
          created_time: new Date().toISOString(),
          updated_time: new Date().toISOString(),
          special_ad_categories: params.special_ad_categories || [],
          bid_strategy: params.bid_strategy || 'LOWEST_COST_WITHOUT_CAP'
        }
      };
      
    case 'meta_ads_update_campaign':
      return {
        ...sandboxResponse,
        data: {
          id: params.campaign_id,
          success: true,
          updated_fields: Object.keys(params).filter(k => k !== 'campaign_id')
        }
      };
      
    case 'meta_ads_get_ad_sets':
      let adSets = [...MOCK_AD_SETS];
      if (params.campaign_id) {
        adSets = adSets.filter(as => as.campaign_id === params.campaign_id);
      }
      return {
        ...sandboxResponse,
        data: adSets,
        campaign_id: params.campaign_id
      };
      
    case 'meta_ads_create_ad_set':
      return {
        ...sandboxResponse,
        data: {
          id: `1203300000001${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
          account_id: adAccountId || 'act_120330000000000',
          campaign_id: params.campaign_id,
          name: params.name,
          status: params.status || 'PAUSED',
          effective_status: params.status || 'PAUSED',
          configured_status: params.status || 'PAUSED',
          created_time: new Date().toISOString(),
          updated_time: new Date().toISOString(),
          daily_budget: params.daily_budget?.toString(),
          lifetime_budget: params.lifetime_budget?.toString() || null,
          bid_amount: params.bid_amount?.toString(),
          billing_event: params.billing_event,
          optimization_goal: params.optimization_goal,
          targeting: params.targeting,
          start_time: params.start_time,
          end_time: params.end_time
        }
      };
      
    case 'meta_ads_update_ad_set':
      return {
        ...sandboxResponse,
        data: {
          id: params.ad_set_id,
          success: true,
          updated_fields: Object.keys(params).filter(k => k !== 'ad_set_id')
        }
      };
      
    case 'meta_ads_get_ads':
      let ads = [...MOCK_ADS];
      if (params.ad_set_id) {
        ads = ads.filter(a => a.adset_id === params.ad_set_id);
      } else if (params.campaign_id) {
        ads = ads.filter(a => a.campaign_id === params.campaign_id);
      }
      return {
        ...sandboxResponse,
        data: ads
      };
      
    case 'meta_ads_create_ad':
      return {
        ...sandboxResponse,
        data: {
          id: `1203300000003${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
          account_id: adAccountId || 'act_120330000000000',
          adset_id: params.ad_set_id,
          name: params.name,
          status: params.status || 'PAUSED',
          effective_status: params.status || 'PAUSED',
          configured_status: params.status || 'PAUSED',
          created_time: new Date().toISOString(),
          updated_time: new Date().toISOString(),
          creative: {
            id: `1203300000004${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
            ...params.creative
          }
        }
      };
      
    case 'meta_ads_update_ad':
      return {
        ...sandboxResponse,
        data: {
          id: params.ad_id,
          success: true,
          updated_fields: Object.keys(params).filter(k => k !== 'ad_id')
        }
      };
      
    case 'meta_ads_get_insights':
      // Return insights based on level and object_id
      if (params.level === 'account') {
        return {
          ...sandboxResponse,
          data: [{
            account_id: adAccountId || 'act_120330000000000',
            date_start: '2026-02-01',
            date_stop: '2026-02-10',
            impressions: '5770000',
            reach: '2240000',
            frequency: '2.58',
            clicks: '131100',
            cpm: '11.44',
            cpc: '0.46',
            ctr: '2.27',
            spend: '66000.00',
            actions: [
              { action_type: 'like', value: '5040' },
              { action_type: 'comment', value: '890' },
              { action_type: 'share', value: '450' },
              { action_type: 'offsite_conversion.fb_pixel_purchase', value: '675' },
              { action_type: 'lead', value: '1250' }
            ],
            video_views: '735000',
            cost_per_action_type: [
              { action_type: 'offsite_conversion.fb_pixel_purchase', value: '35.56' },
              { action_type: 'lead', value: '4.00' }
            ]
          }]
        };
      } else if (params.level === 'campaign' && params.object_id) {
        const campaign = MOCK_CAMPAIGNS.find(c => c.id === params.object_id);
        return {
          ...sandboxResponse,
          data: campaign ? [{ ...campaign.insights, campaign_id: params.object_id }] : [],
          campaign_id: params.object_id
        };
      } else if (params.level === 'adset' && params.object_id) {
        const adSet = MOCK_AD_SETS.find(as => as.id === params.object_id);
        return {
          ...sandboxResponse,
          data: adSet ? [{ ...adSet.insights, adset_id: params.object_id }] : [],
          adset_id: params.object_id
        };
      } else if (params.level === 'ad' && params.object_id) {
        const ad = MOCK_ADS.find(a => a.id === params.object_id);
        return {
          ...sandboxResponse,
          data: ad ? [{ ...ad.insights, ad_id: params.object_id }] : [],
          ad_id: params.object_id
        };
      }
      return {
        ...sandboxResponse,
        data: [],
        error: `No insights found for ${params.level} ${params.object_id || '(account)'}`
      };
      
    case 'meta_ads_get_audiences':
      return {
        ...sandboxResponse,
        data: MOCK_AUDIENCES
      };
      
    case 'meta_ads_create_audience':
      return {
        ...sandboxResponse,
        data: {
          id: `1203300000002${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
          account_id: adAccountId || 'act_120330000000000',
          name: params.name,
          subtype: params.subtype,
          description: params.description || '',
          approximate_count: 0,
          delivery_status: {
            code: 200,
            description: 'This audience is being created'
          },
          time_created: new Date().toISOString(),
          time_updated: new Date().toISOString()
        }
      };
      
    case 'meta_ads_get_ad_accounts':
      return {
        ...sandboxResponse,
        data: [{
          id: adAccountId || 'act_120330000000000',
          account_id: (adAccountId || 'act_120330000000000').replace('act_', ''),
          name: 'Sandbox Ad Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/Los_Angeles',
          timezone_offset_hours_utc: -8,
          spend_cap: null
        }]
      };
      
    default:
      return {
        ...sandboxResponse,
        error: `Tool ${toolName} not implemented in sandbox mode`
      };
  }
}

/**
 * Get campaigns (live API)
 */
async function getCampaigns(params = {}) {
  const fields = params.fields || ['id', 'name', 'status', 'effective_status', 'objective', 'daily_budget', 'lifetime_budget', 'created_time', 'updated_time'];
  const limit = params.limit || 25;
  
  const apiParams = {
    fields: fields.join(','),
    limit: limit.toString()
  };
  
  if (params.effective_status && params.effective_status.length > 0) {
    apiParams.filtering = JSON.stringify([{
      field: 'effective_status',
      operator: 'IN',
      value: params.effective_status
    }]);
  }
  
  const response = await apiRequest(`/${adAccountId}/campaigns`, { params: apiParams });
  
  return {
    data: response.data || [],
    paging: response.paging,
    summary: response.summary
  };
}

/**
 * Create campaign (live API)
 */
async function createCampaign(params) {
  const campaignData = {
    name: params.name,
    objective: params.objective,
    status: params.status || 'PAUSED',
    special_ad_categories: params.special_ad_categories || []
  };
  
  if (params.bid_strategy) {
    campaignData.bid_strategy = params.bid_strategy;
  }
  
  const response = await apiRequest(`/${adAccountId}/campaigns`, {
    method: 'POST',
    body: campaignData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Update campaign (live API)
 */
async function updateCampaign(params) {
  const { campaign_id, ...updateData } = params;
  
  const response = await apiRequest(`/${campaign_id}`, {
    method: 'POST',
    body: updateData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Get ad sets (live API)
 */
async function getAdSets(params = {}) {
  const fields = params.fields || ['id', 'name', 'status', 'effective_status', 'campaign_id', 'daily_budget', 'lifetime_budget', 'bid_amount', 'billing_event', 'optimization_goal', 'targeting', 'created_time', 'updated_time'];
  const limit = params.limit || 25;
  
  const endpoint = params.campaign_id ? `/${params.campaign_id}/adsets` : `/${adAccountId}/adsets`;
  
  const apiParams = {
    fields: fields.join(','),
    limit: limit.toString()
  };
  
  const response = await apiRequest(endpoint, { params: apiParams });
  
  return {
    data: response.data || [],
    paging: response.paging,
    campaign_id: params.campaign_id
  };
}

/**
 * Create ad set (live API)
 */
async function createAdSet(params) {
  const adSetData = {
    name: params.name,
    campaign_id: params.campaign_id,
    billing_event: params.billing_event,
    optimization_goal: params.optimization_goal,
    targeting: params.targeting,
    status: params.status || 'PAUSED'
  };
  
  // Budget - either daily or lifetime
  if (params.daily_budget) {
    adSetData.daily_budget = params.daily_budget.toString();
  } else if (params.lifetime_budget) {
    adSetData.lifetime_budget = params.lifetime_budget.toString();
    if (!params.end_time) {
      throw new Error('end_time is required when using lifetime_budget');
    }
  } else {
    throw new Error('Either daily_budget or lifetime_budget is required');
  }
  
  if (params.bid_amount) {
    adSetData.bid_amount = params.bid_amount.toString();
  }
  
  if (params.start_time) {
    adSetData.start_time = params.start_time;
  }
  
  if (params.end_time) {
    adSetData.end_time = params.end_time;
  }
  
  const response = await apiRequest(`/${adAccountId}/adsets`, {
    method: 'POST',
    body: adSetData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Update ad set (live API)
 */
async function updateAdSet(params) {
  const { ad_set_id, ...updateData } = params;
  
  // Convert numbers to strings for Meta API
  if (updateData.daily_budget) {
    updateData.daily_budget = updateData.daily_budget.toString();
  }
  if (updateData.bid_amount) {
    updateData.bid_amount = updateData.bid_amount.toString();
  }
  
  const response = await apiRequest(`/${ad_set_id}`, {
    method: 'POST',
    body: updateData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Get ads (live API)
 */
async function getAds(params = {}) {
  const fields = params.fields || ['id', 'name', 'status', 'effective_status', 'adset_id', 'campaign_id', 'creative', 'created_time', 'updated_time'];
  const limit = params.limit || 25;
  
  let endpoint;
  if (params.ad_set_id) {
    endpoint = `/${params.ad_set_id}/ads`;
  } else if (params.campaign_id) {
    endpoint = `/${params.campaign_id}/ads`;
  } else {
    endpoint = `/${adAccountId}/ads`;
  }
  
  const apiParams = {
    fields: fields.join(','),
    limit: limit.toString()
  };
  
  const response = await apiRequest(endpoint, { params: apiParams });
  
  return {
    data: response.data || [],
    paging: response.paging
  };
}

/**
 * Create ad (live API)
 */
async function createAd(params) {
  const adData = {
    name: params.name,
    adset_id: params.ad_set_id,
    creative: params.creative,
    status: params.status || 'PAUSED'
  };
  
  const response = await apiRequest(`/${adAccountId}/ads`, {
    method: 'POST',
    body: adData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Update ad (live API)
 */
async function updateAd(params) {
  const { ad_id, ...updateData } = params;
  
  const response = await apiRequest(`/${ad_id}`, {
    method: 'POST',
    body: updateData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Get insights (live API)
 */
async function getInsights(params) {
  const fields = params.fields || ['impressions', 'clicks', 'spend', 'cpm', 'cpc', 'ctr', 'reach', 'frequency', 'actions', 'cost_per_action_type'];
  
  let endpoint;
  if (params.level === 'account') {
    endpoint = `/${adAccountId}/insights`;
  } else if (params.object_id) {
    endpoint = `/${params.object_id}/insights`;
  } else {
    throw new Error('object_id is required for campaign/adset/ad level insights');
  }
  
  const apiParams = {
    fields: fields.join(','),
    level: params.level
  };
  
  if (params.date_preset) {
    apiParams.date_preset = params.date_preset;
  } else if (params.time_range) {
    apiParams.time_range = JSON.stringify(params.time_range);
  }
  
  if (params.breakdowns && params.breakdowns.length > 0) {
    apiParams.breakdowns = params.breakdowns.join(',');
  }
  
  if (params.time_increment) {
    apiParams.time_increment = params.time_increment;
  }
  
  const response = await apiRequest(endpoint, { params: apiParams });
  
  return {
    data: response.data || [],
    paging: response.paging
  };
}

/**
 * Get custom audiences (live API)
 */
async function getAudiences(params = {}) {
  const fields = params.fields || ['id', 'name', 'subtype', 'description', 'approximate_count', 'delivery_status', 'operation_status', 'time_created', 'time_updated'];
  const limit = params.limit || 25;
  
  const apiParams = {
    fields: fields.join(','),
    limit: limit.toString()
  };
  
  const response = await apiRequest(`/${adAccountId}/customaudiences`, { params: apiParams });
  
  return {
    data: response.data || [],
    paging: response.paging
  };
}

/**
 * Create custom audience (live API)
 */
async function createAudience(params) {
  const audienceData = {
    name: params.name,
    subtype: params.subtype
  };
  
  if (params.description) {
    audienceData.description = params.description;
  }
  
  if (params.customer_file_source) {
    audienceData.customer_file_source = params.customer_file_source;
  }
  
  if (params.subtype === 'LOOKALIKE' && params.origin_audience_id && params.lookalike_spec) {
    audienceData.origin_audience_id = params.origin_audience_id;
    audienceData.lookalike_spec = params.lookalike_spec;
  }
  
  const response = await apiRequest(`/${adAccountId}/customaudiences`, {
    method: 'POST',
    body: audienceData
  });
  
  return {
    data: response,
    success: true
  };
}

/**
 * Get ad accounts (live API)
 */
async function getAdAccounts(params = {}) {
  const fields = params.fields || ['id', 'account_id', 'name', 'account_status', 'currency', 'timezone_name', 'spend_cap'];
  
  // Get accounts for the user who owns the access token
  const response = await apiRequest('/me/adaccounts', {
    params: {
      fields: fields.join(',')
    }
  });
  
  return {
    data: response.data || [],
    paging: response.paging
  };
}

/**
 * Test connection
 */
async function testConnection() {
  if (!hasMetaAds) {
    return { 
      connected: false, 
      error: 'Not configured - missing access token or ad account ID',
      sandbox: true,
      message: 'Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in config/.env'
    };
  }
  
  try {
    // Test by fetching ad account info
    const response = await apiRequest(`/${adAccountId}`, {
      params: {
        fields: 'id,name,account_status,currency'
      }
    });
    
    status = 'connected';
    return { 
      connected: true, 
      account: response,
      lastSync: new Date().toISOString() 
    };
  } catch (err) {
    status = 'error';
    return { 
      connected: false, 
      error: err.message 
    };
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
  hasMetaAds,
  getInfo,
  handleToolCall,
  testConnection,
  // Individual method exports for direct access
  getCampaigns,
  createCampaign,
  updateCampaign,
  getAdSets,
  createAdSet,
  updateAdSet,
  getAds,
  createAd,
  updateAd,
  getInsights,
  getAudiences,
  createAudience,
  getAdAccounts,
  refreshAccessToken
};
