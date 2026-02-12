/**
 * LinkedIn Ads Connector
 * Integration with LinkedIn Marketing Developer Platform for B2B social advertising
 * 
 * Official API: https://api.linkedin.com/v2/
 * 
 * Setup Instructions:
 * 1. Create a LinkedIn App at developers.linkedin.com
 * 2. Add required permissions: r_ads, rw_ads, r_ads_reporting
 * 3. Complete OAuth2 flow to get access token
 * 4. Set environment variables in config/.env:
 *    LINKEDIN_CLIENT_ID=your_client_id
 *    LINKEDIN_CLIENT_SECRET=your_client_secret
 *    LINKEDIN_ACCESS_TOKEN=your_access_token
 *    LINKEDIN_AD_ACCOUNT_ID=urn:li:sponsoredAccount:123456
 * 
 * Testing in Sandbox:
 * - Without credentials, connector returns realistic mock data
 * - Mock data includes 3 campaigns, 4 creatives, 2 targeting options, analytics
 * - All CRUD operations work in sandbox mode
 * 
 * Ad Ops Use Cases:
 * - B2B lead generation campaigns
 * - Sponsored content (single image, carousel, video)
 * - Message Ads (InMail) for direct outreach
 * - Text Ads for sidebar placements
 * - Job title, company, industry targeting
 * - Lead Gen Forms (native form fills)
 * - Professional audience targeting
 */

const fs = require('fs');
const path = require('path');
const BaseConnector = require('./base-connector');

const name = 'LinkedIn Ads';
const shortName = 'LinkedIn';
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
const clientId = env.LINKEDIN_CLIENT_ID || null;
const clientSecret = env.LINKEDIN_CLIENT_SECRET || null;
let accessToken = env.LINKEDIN_ACCESS_TOKEN || null;
const adAccountId = env.LINKEDIN_AD_ACCOUNT_ID || null;

const hasLinkedInAds = !!(accessToken && adAccountId);

// OAuth configuration
const oauth = {
  provider: 'linkedin',
  scopes: ['r_ads', 'rw_ads', 'r_ads_reporting', 'r_organization_social'],
  apiEndpoint: 'https://api.linkedin.com/v2',
  connected: hasLinkedInAds,
  accountId: adAccountId ? adAccountId.replace(/\d(?=\d{4})/g, '*') : null,
  tokenType: 'oauth2_access_token'
};

// API version
const API_VERSION = 'v2';
const BASE_URL = `https://api.linkedin.com/${API_VERSION}`;

// Tool definitions for MCP integration
const tools = [
  {
    name: 'linkedin_get_ad_accounts',
    description: 'List LinkedIn ad accounts accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search accounts by name'
        }
      }
    }
  },
  {
    name: 'linkedin_get_campaigns',
    description: 'List LinkedIn campaigns with performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELED'] },
          description: 'Filter by campaign status'
        },
        count: {
          type: 'number',
          description: 'Number of campaigns to return (default: 50, max: 100)',
          minimum: 1,
          maximum: 100
        },
        start: {
          type: 'number',
          description: 'Pagination offset',
          minimum: 0
        }
      }
    }
  },
  {
    name: 'linkedin_create_campaign',
    description: 'Create a new LinkedIn campaign',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name'
        },
        objective_type: {
          type: 'string',
          enum: ['BRAND_AWARENESS', 'WEBSITE_VISITS', 'ENGAGEMENT', 'VIDEO_VIEWS', 'LEAD_GENERATION', 'WEBSITE_CONVERSIONS', 'JOB_APPLICANTS'],
          description: 'Campaign objective'
        },
        daily_budget_amount: {
          type: 'number',
          description: 'Daily budget in dollars (e.g., 500 = $500/day)'
        },
        total_budget_amount: {
          type: 'number',
          description: 'Total lifetime budget in dollars'
        },
        start_date: {
          type: 'string',
          description: 'Start date (Unix timestamp in milliseconds)'
        },
        end_date: {
          type: 'string',
          description: 'End date (Unix timestamp in milliseconds, optional)'
        },
        locale_country: {
          type: 'string',
          description: 'Target country code (e.g., US, GB, DE)',
          default: 'US'
        },
        locale_language: {
          type: 'string',
          description: 'Target language code (e.g., en_US, de_DE)',
          default: 'en_US'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial campaign status',
          default: 'PAUSED'
        }
      },
      required: ['name', 'objective_type']
    }
  },
  {
    name: 'linkedin_update_campaign',
    description: 'Update an existing LinkedIn campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign URN (e.g., urn:li:sponsoredCampaign:123456)'
        },
        name: {
          type: 'string',
          description: 'Updated campaign name'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'CANCELED'],
          description: 'Updated campaign status'
        },
        daily_budget_amount: {
          type: 'number',
          description: 'Updated daily budget in dollars'
        },
        total_budget_amount: {
          type: 'number',
          description: 'Updated total budget in dollars'
        },
        end_date: {
          type: 'string',
          description: 'Updated end date (Unix timestamp in milliseconds)'
        }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'linkedin_get_creatives',
    description: 'List LinkedIn ad creatives (Sponsored Content, Message Ads, Text Ads)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Filter by campaign URN'
        },
        status: {
          type: 'array',
          items: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'CANCELED'] },
          description: 'Filter by creative status'
        },
        count: {
          type: 'number',
          description: 'Number of creatives to return (default: 50)',
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'linkedin_create_sponsored_content',
    description: 'Create a Sponsored Content ad (single image, carousel, or video)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign URN'
        },
        creative_type: {
          type: 'string',
          enum: ['SINGLE_IMAGE', 'CAROUSEL', 'VIDEO'],
          description: 'Type of sponsored content',
          default: 'SINGLE_IMAGE'
        },
        headline: {
          type: 'string',
          description: 'Ad headline (max 200 chars)'
        },
        intro_text: {
          type: 'string',
          description: 'Introduction text (max 600 chars)'
        },
        call_to_action: {
          type: 'string',
          enum: ['APPLY', 'DOWNLOAD', 'VIEW_QUOTE', 'LEARN_MORE', 'SIGN_UP', 'SUBSCRIBE', 'REGISTER', 'JOIN', 'ATTEND'],
          description: 'Call to action button type',
          default: 'LEARN_MORE'
        },
        landing_page_url: {
          type: 'string',
          description: 'Destination URL for the ad'
        },
        image_url: {
          type: 'string',
          description: 'Image URL (for SINGLE_IMAGE)'
        },
        video_url: {
          type: 'string',
          description: 'Video URL (for VIDEO)'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial creative status',
          default: 'PAUSED'
        }
      },
      required: ['campaign_id', 'headline', 'landing_page_url']
    }
  },
  {
    name: 'linkedin_create_message_ad',
    description: 'Create a Message Ad (InMail) for direct outreach',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign URN'
        },
        subject: {
          type: 'string',
          description: 'Message subject line (max 60 chars)'
        },
        message_body: {
          type: 'string',
          description: 'Message body text (max 1500 chars)'
        },
        sender_name: {
          type: 'string',
          description: 'Sender name displayed to recipient'
        },
        call_to_action_text: {
          type: 'string',
          description: 'CTA button text (max 20 chars)'
        },
        call_to_action_url: {
          type: 'string',
          description: 'CTA destination URL'
        },
        banner_image_url: {
          type: 'string',
          description: 'Optional banner image URL'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial creative status',
          default: 'PAUSED'
        }
      },
      required: ['campaign_id', 'subject', 'message_body', 'sender_name', 'call_to_action_text', 'call_to_action_url']
    }
  },
  {
    name: 'linkedin_create_text_ad',
    description: 'Create a Text Ad for sidebar placement',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign URN'
        },
        headline: {
          type: 'string',
          description: 'Ad headline (max 25 chars)'
        },
        description: {
          type: 'string',
          description: 'Ad description (max 75 chars)'
        },
        landing_page_url: {
          type: 'string',
          description: 'Destination URL'
        },
        image_url: {
          type: 'string',
          description: 'Small square image URL (50x50 px)'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial creative status',
          default: 'PAUSED'
        }
      },
      required: ['campaign_id', 'headline', 'description', 'landing_page_url', 'image_url']
    }
  },
  {
    name: 'linkedin_get_targeting_facets',
    description: 'List available targeting options (job titles, companies, industries, skills, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        facet_type: {
          type: 'string',
          enum: ['TITLES', 'COMPANIES', 'INDUSTRIES', 'SENIORITIES', 'COMPANY_SIZES', 'SKILLS', 'DEGREES', 'FIELDS_OF_STUDY', 'GROUPS'],
          description: 'Type of targeting facet to retrieve'
        },
        search: {
          type: 'string',
          description: 'Search term to filter facets'
        },
        count: {
          type: 'number',
          description: 'Number of results to return (default: 20)',
          minimum: 1,
          maximum: 100
        }
      },
      required: ['facet_type']
    }
  },
  {
    name: 'linkedin_get_audience_counts',
    description: 'Estimate audience reach for specific targeting criteria',
    inputSchema: {
      type: 'object',
      properties: {
        targeting: {
          type: 'object',
          description: 'Targeting criteria (job titles, companies, industries, etc.)',
          properties: {
            job_titles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Job title URNs or names'
            },
            companies: {
              type: 'array',
              items: { type: 'string' },
              description: 'Company URNs or names'
            },
            industries: {
              type: 'array',
              items: { type: 'string' },
              description: 'Industry URNs or names'
            },
            seniorities: {
              type: 'array',
              items: { type: 'string', enum: ['ENTRY', 'SENIOR', 'MANAGER', 'DIRECTOR', 'VP', 'CXO', 'PARTNER', 'OWNER'] },
              description: 'Seniority levels'
            },
            company_sizes: {
              type: 'array',
              items: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] },
              description: 'Company size buckets (A=self-employed, B=1-10, C=11-50, D=51-200, E=201-500, F=501-1000, G=1001-5000, H=5001-10000, I=10000+)'
            },
            degrees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Degree URNs'
            },
            fields_of_study: {
              type: 'array',
              items: { type: 'string' },
              description: 'Field of study URNs'
            },
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skill URNs'
            },
            age_ranges: {
              type: 'array',
              items: { type: 'string', enum: ['18-24', '25-34', '35-54', '55+'] },
              description: 'Age ranges'
            },
            genders: {
              type: 'array',
              items: { type: 'string', enum: ['MALE', 'FEMALE'] },
              description: 'Gender targeting'
            },
            locations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Location URNs (countries, regions, cities)'
            }
          }
        }
      },
      required: ['targeting']
    }
  },
  {
    name: 'linkedin_get_lead_gen_forms',
    description: 'List Lead Gen Forms and submitted leads',
    inputSchema: {
      type: 'object',
      properties: {
        form_id: {
          type: 'string',
          description: 'Specific form URN to retrieve (optional)'
        },
        include_leads: {
          type: 'boolean',
          description: 'Include lead submissions in response',
          default: false
        },
        count: {
          type: 'number',
          description: 'Number of forms to return (default: 20)',
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: 'linkedin_get_analytics',
    description: 'Get performance analytics for campaigns, creatives, or account',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          enum: ['ACCOUNT', 'CAMPAIGN', 'CREATIVE'],
          description: 'Type of entity to get analytics for',
          default: 'CAMPAIGN'
        },
        entity_id: {
          type: 'string',
          description: 'Entity URN (campaign_id, creative_id, or account_id)'
        },
        date_start: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        date_end: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        },
        metrics: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['impressions', 'clicks', 'spend', 'ctr', 'cpc', 'conversions', 'cost_per_conversion', 'leads', 'cost_per_lead', 'video_views', 'video_completions', 'engagement_rate', 'landing_page_clicks', 'reactions', 'comments', 'shares', 'follows']
          },
          description: 'Specific metrics to retrieve (default: all)'
        },
        time_granularity: {
          type: 'string',
          enum: ['DAILY', 'MONTHLY', 'ALL'],
          description: 'Time granularity for results',
          default: 'ALL'
        }
      }
    }
  }
];

// Mock data for sandbox mode
const MOCK_ACCOUNTS = [
  {
    id: 'urn:li:sponsoredAccount:123456789',
    name: 'Acme B2B Solutions',
    type: 'BUSINESS',
    status: 'ACTIVE',
    currency: 'USD',
    created_time: 1672531200000,
    last_modified_time: 1707750000000,
    reference: 'urn:li:organization:987654321',
    reference_type: 'ORGANIZATION',
    reference_organization_name: 'Acme Corporation',
    total_budget: {
      amount: 100000,
      currencyCode: 'USD'
    },
    serving_statuses: ['RUNNABLE']
  },
  {
    id: 'urn:li:sponsoredAccount:123456790',
    name: 'TechStart Marketing',
    type: 'BUSINESS',
    status: 'ACTIVE',
    currency: 'USD',
    created_time: 1680307200000,
    last_modified_time: 1707663600000,
    reference: 'urn:li:organization:987654322',
    reference_type: 'ORGANIZATION',
    reference_organization_name: 'TechStart Inc',
    total_budget: {
      amount: 50000,
      currencyCode: 'USD'
    },
    serving_statuses: ['RUNNABLE']
  }
];

const MOCK_CAMPAIGNS = [
  {
    id: 'urn:li:sponsoredCampaign:123456',
    name: 'B2B SaaS Lead Gen Campaign - Q1 2026',
    account: adAccountId || 'urn:li:sponsoredAccount:123456789',
    status: 'ACTIVE',
    type: 'TEXT_AD',
    costType: 'CPC',
    objectiveType: 'LEAD_GENERATION',
    dailyBudget: {
      amount: '500',
      currencyCode: 'USD'
    },
    totalBudget: {
      amount: '15000',
      currencyCode: 'USD'
    },
    unitCost: {
      amount: '8.50',
      currencyCode: 'USD'
    },
    runSchedule: {
      start: 1707091200000,
      end: 1709683200000
    },
    locale: {
      country: 'US',
      language: 'en_US'
    },
    targetingCriteria: {
      include: {
        and: [
          {
            or: {
              'urn:li:adTargetingFacet:titles': ['urn:li:title:100', 'urn:li:title:101', 'urn:li:title:102']
            }
          },
          {
            or: {
              'urn:li:adTargetingFacet:industries': ['urn:li:industry:4', 'urn:li:industry:6']
            }
          }
        ]
      }
    },
    created: 1707005600000,
    lastModified: 1707750000000,
    creativeSelection: 'OPTIMIZED',
    format: 'SINGLE_IMAGE',
    audience_expansion_enabled: true
  },
  {
    id: 'urn:li:sponsoredCampaign:123457',
    name: 'Enterprise Software Awareness - Video',
    account: adAccountId || 'urn:li:sponsoredAccount:123456789',
    status: 'ACTIVE',
    type: 'SPONSORED_UPDATES',
    costType: 'CPM',
    objectiveType: 'BRAND_AWARENESS',
    dailyBudget: {
      amount: '300',
      currencyCode: 'USD'
    },
    totalBudget: {
      amount: '9000',
      currencyCode: 'USD'
    },
    unitCost: {
      amount: '12.00',
      currencyCode: 'USD'
    },
    runSchedule: {
      start: 1706486400000,
      end: 1711670400000
    },
    locale: {
      country: 'US',
      language: 'en_US'
    },
    targetingCriteria: {
      include: {
        and: [
          {
            or: {
              'urn:li:adTargetingFacet:seniorities': ['DIRECTOR', 'VP', 'CXO']
            }
          },
          {
            or: {
              'urn:li:adTargetingFacet:companySizes': ['D', 'E', 'F', 'G', 'H', 'I']
            }
          }
        ]
      }
    },
    created: 1706400000000,
    lastModified: 1707663600000,
    creativeSelection: 'OPTIMIZED',
    format: 'VIDEO',
    audience_expansion_enabled: false
  },
  {
    id: 'urn:li:sponsoredCampaign:123458',
    name: 'Recruitment Campaign - Data Engineers',
    account: adAccountId || 'urn:li:sponsoredAccount:123456789',
    status: 'PAUSED',
    type: 'SPONSORED_UPDATES',
    costType: 'CPC',
    objectiveType: 'JOB_APPLICANTS',
    dailyBudget: {
      amount: '200',
      currencyCode: 'USD'
    },
    totalBudget: {
      amount: '6000',
      currencyCode: 'USD'
    },
    unitCost: {
      amount: '5.00',
      currencyCode: 'USD'
    },
    runSchedule: {
      start: 1704067200000,
      end: 1706745600000
    },
    locale: {
      country: 'US',
      language: 'en_US'
    },
    targetingCriteria: {
      include: {
        and: [
          {
            or: {
              'urn:li:adTargetingFacet:titles': ['urn:li:title:200', 'urn:li:title:201']
            }
          },
          {
            or: {
              'urn:li:adTargetingFacet:skills': ['urn:li:skill:1', 'urn:li:skill:2', 'urn:li:skill:3']
            }
          }
        ]
      }
    },
    created: 1703980800000,
    lastModified: 1706745600000,
    creativeSelection: 'OPTIMIZED',
    format: 'SINGLE_IMAGE',
    audience_expansion_enabled: true
  }
];

const MOCK_CREATIVES = [
  {
    id: 'urn:li:sponsoredCreative:456789',
    campaign: 'urn:li:sponsoredCampaign:123456',
    status: 'ACTIVE',
    type: 'SPONSORED_STATUS_UPDATE',
    created: 1707091200000,
    lastModified: 1707577200000,
    intendedStatus: 'ACTIVE',
    servingHoldReasons: [],
    content: {
      reference: 'urn:li:share:7890123456',
      introText: 'Transform your sales pipeline with AI-powered lead scoring. See how top B2B companies are closing 40% more deals. 📈',
      headline: 'AI-Powered Lead Scoring for B2B Sales',
      callToAction: {
        labelType: 'LEARN_MORE',
        landingPage: 'https://example.com/lead-scoring-demo?utm_source=linkedin&utm_campaign=q1_leadgen'
      },
      media: {
        type: 'IMAGE',
        url: 'https://cdn.example.com/linkedin/lead-scoring-hero.jpg',
        landingPage: 'https://example.com/lead-scoring-demo'
      }
    },
    targeting: {
      includedTargetingFacets: {
        jobTitles: ['Chief Technology Officer', 'VP of Engineering', 'Director of Sales'],
        industries: ['Software', 'Information Technology'],
        seniorities: ['DIRECTOR', 'VP', 'CXO']
      }
    }
  },
  {
    id: 'urn:li:sponsoredCreative:456790',
    campaign: 'urn:li:sponsoredCampaign:123456',
    status: 'ACTIVE',
    type: 'SPONSORED_STATUS_UPDATE',
    created: 1707177600000,
    lastModified: 1707663600000,
    intendedStatus: 'ACTIVE',
    servingHoldReasons: [],
    content: {
      reference: 'urn:li:share:7890123457',
      introText: 'Join 5,000+ B2B companies using our platform to automate their entire marketing stack. Free 30-day trial. 🚀',
      headline: 'Marketing Automation for Modern B2B Teams',
      callToAction: {
        labelType: 'SIGN_UP',
        landingPage: 'https://example.com/free-trial?utm_source=linkedin&utm_campaign=q1_leadgen'
      },
      media: {
        type: 'CAROUSEL',
        elements: [
          {
            title: 'Email Automation',
            description: 'Send personalized emails at scale',
            url: 'https://cdn.example.com/linkedin/carousel-1.jpg',
            landingPage: 'https://example.com/features/email'
          },
          {
            title: 'Lead Scoring',
            description: 'Prioritize your best opportunities',
            url: 'https://cdn.example.com/linkedin/carousel-2.jpg',
            landingPage: 'https://example.com/features/scoring'
          },
          {
            title: 'Pipeline Analytics',
            description: 'Forecast revenue with confidence',
            url: 'https://cdn.example.com/linkedin/carousel-3.jpg',
            landingPage: 'https://example.com/features/analytics'
          }
        ]
      }
    },
    targeting: {
      includedTargetingFacets: {
        jobTitles: ['VP of Marketing', 'Director of Marketing', 'Marketing Manager'],
        companySizes: ['51-200', '201-500', '501-1000'],
        seniorities: ['MANAGER', 'DIRECTOR', 'VP']
      }
    }
  },
  {
    id: 'urn:li:sponsoredCreative:456791',
    campaign: 'urn:li:sponsoredCampaign:123457',
    status: 'ACTIVE',
    type: 'VIDEO_AD',
    created: 1706486400000,
    lastModified: 1707577200000,
    intendedStatus: 'ACTIVE',
    servingHoldReasons: [],
    content: {
      reference: 'urn:li:video:8901234567',
      introText: 'Watch how Fortune 500 companies are transforming their data infrastructure. 2-minute case study. 🎥',
      headline: 'Enterprise Data Platform Success Stories',
      callToAction: {
        labelType: 'VIEW_QUOTE',
        landingPage: 'https://example.com/case-studies?utm_source=linkedin&utm_campaign=q1_awareness'
      },
      media: {
        type: 'VIDEO',
        url: 'https://cdn.example.com/linkedin/enterprise-video.mp4',
        thumbnail: 'https://cdn.example.com/linkedin/video-thumb.jpg',
        duration: 120,
        landingPage: 'https://example.com/case-studies'
      }
    },
    targeting: {
      includedTargetingFacets: {
        jobTitles: ['Chief Data Officer', 'VP of Data', 'Director of Analytics'],
        seniorities: ['DIRECTOR', 'VP', 'CXO'],
        companySizes: ['G', 'H', 'I']
      }
    }
  },
  {
    id: 'urn:li:sponsoredCreative:456792',
    campaign: 'urn:li:sponsoredCampaign:123458',
    status: 'PAUSED',
    type: 'JOB_AD',
    created: 1704067200000,
    lastModified: 1706745600000,
    intendedStatus: 'PAUSED',
    servingHoldReasons: ['CAMPAIGN_PAUSED'],
    content: {
      reference: 'urn:li:job:9012345678',
      introText: 'Join our data team and work on cutting-edge ML infrastructure. Remote-friendly, competitive comp. 💻',
      headline: 'Senior Data Engineer - ML Infrastructure',
      callToAction: {
        labelType: 'APPLY',
        landingPage: 'https://careers.example.com/jobs/data-engineer'
      },
      media: {
        type: 'IMAGE',
        url: 'https://cdn.example.com/linkedin/careers-hero.jpg',
        landingPage: 'https://careers.example.com/jobs/data-engineer'
      },
      jobDetails: {
        title: 'Senior Data Engineer',
        company: 'Acme Corporation',
        location: 'San Francisco, CA (Remote)',
        type: 'FULL_TIME',
        salary_range: '$150,000 - $200,000',
        apply_url: 'https://careers.example.com/jobs/data-engineer'
      }
    },
    targeting: {
      includedTargetingFacets: {
        skills: ['Python', 'Apache Spark', 'Kubernetes', 'TensorFlow'],
        jobTitles: ['Data Engineer', 'ML Engineer', 'Software Engineer']
      }
    }
  }
];

const MOCK_TARGETING_FACETS = {
  TITLES: [
    { urn: 'urn:li:title:100', name: 'Chief Technology Officer', localizedName: 'Chief Technology Officer' },
    { urn: 'urn:li:title:101', name: 'VP of Engineering', localizedName: 'VP of Engineering' },
    { urn: 'urn:li:title:102', name: 'Director of IT', localizedName: 'Director of IT' },
    { urn: 'urn:li:title:103', name: 'VP of Marketing', localizedName: 'VP of Marketing' },
    { urn: 'urn:li:title:104', name: 'Director of Marketing', localizedName: 'Director of Marketing' },
    { urn: 'urn:li:title:105', name: 'Chief Data Officer', localizedName: 'Chief Data Officer' },
    { urn: 'urn:li:title:106', name: 'VP of Sales', localizedName: 'VP of Sales' },
    { urn: 'urn:li:title:107', name: 'Director of Sales', localizedName: 'Director of Sales' },
    { urn: 'urn:li:title:200', name: 'Data Engineer', localizedName: 'Data Engineer' },
    { urn: 'urn:li:title:201', name: 'ML Engineer', localizedName: 'ML Engineer' }
  ],
  COMPANIES: [
    { urn: 'urn:li:company:1000', name: 'Microsoft', localizedName: 'Microsoft', industry: 'Software' },
    { urn: 'urn:li:company:1001', name: 'Google', localizedName: 'Google', industry: 'Internet' },
    { urn: 'urn:li:company:1002', name: 'Amazon', localizedName: 'Amazon', industry: 'E-commerce' },
    { urn: 'urn:li:company:1003', name: 'Salesforce', localizedName: 'Salesforce', industry: 'Software' },
    { urn: 'urn:li:company:1004', name: 'Oracle', localizedName: 'Oracle', industry: 'Software' }
  ],
  INDUSTRIES: [
    { urn: 'urn:li:industry:4', name: 'Computer Software', localizedName: 'Computer Software' },
    { urn: 'urn:li:industry:6', name: 'Information Technology and Services', localizedName: 'Information Technology and Services' },
    { urn: 'urn:li:industry:8', name: 'Financial Services', localizedName: 'Financial Services' },
    { urn: 'urn:li:industry:12', name: 'Healthcare', localizedName: 'Healthcare' },
    { urn: 'urn:li:industry:15', name: 'Marketing and Advertising', localizedName: 'Marketing and Advertising' }
  ],
  SKILLS: [
    { urn: 'urn:li:skill:1', name: 'Python', localizedName: 'Python' },
    { urn: 'urn:li:skill:2', name: 'Apache Spark', localizedName: 'Apache Spark' },
    { urn: 'urn:li:skill:3', name: 'Kubernetes', localizedName: 'Kubernetes' },
    { urn: 'urn:li:skill:4', name: 'TensorFlow', localizedName: 'TensorFlow' },
    { urn: 'urn:li:skill:5', name: 'React', localizedName: 'React' }
  ],
  SENIORITIES: [
    { level: 'ENTRY', name: 'Entry Level' },
    { level: 'SENIOR', name: 'Senior' },
    { level: 'MANAGER', name: 'Manager' },
    { level: 'DIRECTOR', name: 'Director' },
    { level: 'VP', name: 'Vice President' },
    { level: 'CXO', name: 'C-Level Executive' },
    { level: 'PARTNER', name: 'Partner' },
    { level: 'OWNER', name: 'Owner' }
  ],
  COMPANY_SIZES: [
    { bucket: 'A', name: 'Self-employed', range: '0' },
    { bucket: 'B', name: '1-10 employees', range: '1-10' },
    { bucket: 'C', name: '11-50 employees', range: '11-50' },
    { bucket: 'D', name: '51-200 employees', range: '51-200' },
    { bucket: 'E', name: '201-500 employees', range: '201-500' },
    { bucket: 'F', name: '501-1,000 employees', range: '501-1000' },
    { bucket: 'G', name: '1,001-5,000 employees', range: '1001-5000' },
    { bucket: 'H', name: '5,001-10,000 employees', range: '5001-10000' },
    { bucket: 'I', name: '10,001+ employees', range: '10000+' }
  ],
  DEGREES: [
    { urn: 'urn:li:degree:100', name: "Bachelor's Degree", localizedName: "Bachelor's Degree" },
    { urn: 'urn:li:degree:101', name: "Master's Degree", localizedName: "Master's Degree" },
    { urn: 'urn:li:degree:102', name: 'MBA', localizedName: 'MBA' },
    { urn: 'urn:li:degree:103', name: 'PhD', localizedName: 'PhD' }
  ],
  FIELDS_OF_STUDY: [
    { urn: 'urn:li:fieldOfStudy:100', name: 'Computer Science', localizedName: 'Computer Science' },
    { urn: 'urn:li:fieldOfStudy:101', name: 'Business Administration', localizedName: 'Business Administration' },
    { urn: 'urn:li:fieldOfStudy:102', name: 'Marketing', localizedName: 'Marketing' },
    { urn: 'urn:li:fieldOfStudy:103', name: 'Engineering', localizedName: 'Engineering' }
  ]
};

const MOCK_LEAD_GEN_FORMS = [
  {
    id: 'urn:li:leadGenForm:567890',
    account: adAccountId || 'urn:li:sponsoredAccount:123456789',
    name: 'SaaS Demo Request Form',
    description: 'Request a personalized demo of our platform',
    locale: {
      country: 'US',
      language: 'en_US'
    },
    headline: 'Get Your Free Demo',
    descriptionText: 'See how we can help your team close more deals.',
    privacyPolicyUrl: 'https://example.com/privacy',
    thankyouPageUrl: 'https://example.com/thank-you',
    status: 'ACTIVE',
    created: 1707005600000,
    lastModified: 1707577200000,
    totalLeads: 180,
    fields: [
      { type: 'FIRST_NAME', required: true },
      { type: 'LAST_NAME', required: true },
      { type: 'EMAIL', required: true },
      { type: 'COMPANY', required: true },
      { type: 'TITLE', required: true },
      { type: 'PHONE', required: false },
      { type: 'CUSTOM', label: 'Company Size', required: true, options: ['1-10', '11-50', '51-200', '201-500', '500+'] }
    ],
    leads: [
      {
        id: 'lead_001',
        formId: 'urn:li:leadGenForm:567890',
        submittedAt: 1707750000000,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Inc',
        title: 'VP of Sales',
        phone: '+1-555-0123',
        customFields: { 'Company Size': '51-200' }
      },
      {
        id: 'lead_002',
        formId: 'urn:li:leadGenForm:567890',
        submittedAt: 1707736400000,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@innovate.io',
        company: 'Innovate Solutions',
        title: 'Director of Marketing',
        phone: '+1-555-0456',
        customFields: { 'Company Size': '201-500' }
      },
      {
        id: 'lead_003',
        formId: 'urn:li:leadGenForm:567890',
        submittedAt: 1707722800000,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'mchen@dataventures.com',
        company: 'DataVentures',
        title: 'Chief Technology Officer',
        phone: null,
        customFields: { 'Company Size': '11-50' }
      }
    ]
  },
  {
    id: 'urn:li:leadGenForm:567891',
    account: adAccountId || 'urn:li:sponsoredAccount:123456789',
    name: 'Whitepaper Download Form',
    description: 'Download our B2B marketing guide',
    locale: {
      country: 'US',
      language: 'en_US'
    },
    headline: 'Download Free Guide',
    descriptionText: 'The Ultimate Guide to B2B Lead Generation in 2026',
    privacyPolicyUrl: 'https://example.com/privacy',
    thankyouPageUrl: 'https://example.com/download-whitepaper',
    status: 'ACTIVE',
    created: 1706400000000,
    lastModified: 1707400000000,
    totalLeads: 342,
    fields: [
      { type: 'FIRST_NAME', required: true },
      { type: 'LAST_NAME', required: true },
      { type: 'EMAIL', required: true },
      { type: 'COMPANY', required: true },
      { type: 'TITLE', required: false }
    ],
    leads: []
  }
];

const MOCK_ANALYTICS = {
  'urn:li:sponsoredCampaign:123456': {
    entity_id: 'urn:li:sponsoredCampaign:123456',
    entity_type: 'CAMPAIGN',
    entity_name: 'B2B SaaS Lead Gen Campaign - Q1 2026',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      impressions: 45000,
      clicks: 900,
      spend: 4500.00,
      ctr: 2.0,
      cpc: 5.00,
      conversions: 85,
      cost_per_conversion: 52.94,
      leads: 180,
      cost_per_lead: 25.00,
      video_views: 0,
      video_completions: 0,
      engagement_rate: 3.2,
      landing_page_clicks: 720,
      reactions: 230,
      comments: 45,
      shares: 32,
      follows: 18
    },
    breakdown: {
      daily: [
        { date: '2026-02-01', impressions: 4200, clicks: 84, spend: 420.00, leads: 17 },
        { date: '2026-02-02', impressions: 4800, clicks: 96, spend: 480.00, leads: 19 },
        { date: '2026-02-03', impressions: 4500, clicks: 90, spend: 450.00, leads: 18 },
        { date: '2026-02-04', impressions: 4300, clicks: 86, spend: 430.00, leads: 16 },
        { date: '2026-02-05', impressions: 4700, clicks: 94, spend: 470.00, leads: 20 },
        { date: '2026-02-06', impressions: 4100, clicks: 82, spend: 410.00, leads: 15 },
        { date: '2026-02-07', impressions: 4400, clicks: 88, spend: 440.00, leads: 17 },
        { date: '2026-02-08', impressions: 4600, clicks: 92, spend: 460.00, leads: 19 },
        { date: '2026-02-09', impressions: 4900, clicks: 98, spend: 490.00, leads: 21 },
        { date: '2026-02-10', impressions: 4500, clicks: 90, spend: 450.00, leads: 18 }
      ]
    }
  },
  'urn:li:sponsoredCampaign:123457': {
    entity_id: 'urn:li:sponsoredCampaign:123457',
    entity_type: 'CAMPAIGN',
    entity_name: 'Enterprise Software Awareness - Video',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      impressions: 125000,
      clicks: 3125,
      spend: 1500.00,
      ctr: 2.5,
      cpc: 0.48,
      conversions: 0,
      cost_per_conversion: 0,
      leads: 0,
      cost_per_lead: 0,
      video_views: 62500,
      video_completions: 15625,
      engagement_rate: 5.8,
      landing_page_clicks: 2500,
      reactions: 1875,
      comments: 312,
      shares: 438,
      follows: 156
    },
    breakdown: {
      daily: [
        { date: '2026-02-01', impressions: 12000, clicks: 300, spend: 144.00, video_views: 6000 },
        { date: '2026-02-02', impressions: 13500, clicks: 337, spend: 162.00, video_views: 6750 },
        { date: '2026-02-03', impressions: 12800, clicks: 320, spend: 153.60, video_views: 6400 },
        { date: '2026-02-04', impressions: 11900, clicks: 297, spend: 142.80, video_views: 5950 },
        { date: '2026-02-05', impressions: 13200, clicks: 330, spend: 158.40, video_views: 6600 },
        { date: '2026-02-06', impressions: 11500, clicks: 287, spend: 138.00, video_views: 5750 },
        { date: '2026-02-07', impressions: 12600, clicks: 315, spend: 151.20, video_views: 6300 },
        { date: '2026-02-08', impressions: 13000, clicks: 325, spend: 156.00, video_views: 6500 },
        { date: '2026-02-09', impressions: 14000, clicks: 350, spend: 168.00, video_views: 7000 },
        { date: '2026-02-10', impressions: 12500, clicks: 312, spend: 150.00, video_views: 6250 }
      ]
    }
  },
  'urn:li:sponsoredCreative:456789': {
    entity_id: 'urn:li:sponsoredCreative:456789',
    entity_type: 'CREATIVE',
    entity_name: 'AI-Powered Lead Scoring for B2B Sales',
    campaign_id: 'urn:li:sponsoredCampaign:123456',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      impressions: 23000,
      clicks: 460,
      spend: 2300.00,
      ctr: 2.0,
      cpc: 5.00,
      conversions: 45,
      cost_per_conversion: 51.11,
      leads: 92,
      cost_per_lead: 25.00,
      video_views: 0,
      video_completions: 0,
      engagement_rate: 3.4,
      landing_page_clicks: 368,
      reactions: 115,
      comments: 23,
      shares: 16,
      follows: 9
    }
  },
  ACCOUNT: {
    entity_id: adAccountId || 'urn:li:sponsoredAccount:123456789',
    entity_type: 'ACCOUNT',
    entity_name: 'Acme B2B Solutions',
    date_start: '2026-02-01',
    date_end: '2026-02-10',
    metrics: {
      impressions: 170000,
      clicks: 4025,
      spend: 6000.00,
      ctr: 2.37,
      cpc: 1.49,
      conversions: 85,
      cost_per_conversion: 70.59,
      leads: 180,
      cost_per_lead: 33.33,
      video_views: 62500,
      video_completions: 15625,
      engagement_rate: 4.8,
      landing_page_clicks: 3220,
      reactions: 2105,
      comments: 357,
      shares: 470,
      follows: 174
    },
    campaigns: 3,
    active_campaigns: 2,
    creatives: 4,
    active_creatives: 3
  }
};

// API request helper
async function apiRequest(method, endpoint, data = null) {
  // Sandbox mode: return mock data
  if (!hasLinkedInAds) {
    return getMockResponse(endpoint, method, data);
  }
  
  // Live mode: make real API call
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202402'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      throw new Error('LinkedIn Ads authentication failed. Access token may be expired.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('LinkedIn API request error:', error);
    throw error;
  }
}

// Mock response generator
function getMockResponse(endpoint, method, data) {
  // Ad Accounts
  if (endpoint.includes('/adAccounts')) {
    return {
      elements: MOCK_ACCOUNTS,
      paging: { count: MOCK_ACCOUNTS.length, start: 0, total: MOCK_ACCOUNTS.length }
    };
  }
  
  // Campaigns - List
  if (endpoint.includes('/adCampaigns') && method === 'GET') {
    const statusFilter = data?.status || [];
    let campaigns = MOCK_CAMPAIGNS;
    
    if (statusFilter.length > 0) {
      campaigns = campaigns.filter(c => statusFilter.includes(c.status));
    }
    
    return {
      elements: campaigns,
      paging: { count: campaigns.length, start: 0, total: campaigns.length }
    };
  }
  
  // Campaigns - Create
  if (endpoint.includes('/adCampaigns') && method === 'POST') {
    const newId = `urn:li:sponsoredCampaign:${Math.floor(Math.random() * 900000) + 100000}`;
    const now = Date.now();
    
    return {
      id: newId,
      name: data.name,
      account: data.account || adAccountId || 'urn:li:sponsoredAccount:123456789',
      status: data.status || 'PAUSED',
      type: 'SPONSORED_UPDATES',
      costType: data.objective_type === 'BRAND_AWARENESS' ? 'CPM' : 'CPC',
      objectiveType: data.objective_type,
      dailyBudget: data.daily_budget_amount ? {
        amount: String(data.daily_budget_amount),
        currencyCode: 'USD'
      } : null,
      totalBudget: data.total_budget_amount ? {
        amount: String(data.total_budget_amount),
        currencyCode: 'USD'
      } : null,
      runSchedule: {
        start: data.start_date ? parseInt(data.start_date) : now,
        end: data.end_date ? parseInt(data.end_date) : null
      },
      locale: {
        country: data.locale_country || 'US',
        language: data.locale_language || 'en_US'
      },
      created: now,
      lastModified: now,
      creativeSelection: 'OPTIMIZED',
      format: 'SINGLE_IMAGE',
      audience_expansion_enabled: true
    };
  }
  
  // Campaigns - Update
  if (endpoint.includes('/adCampaigns') && (method === 'PUT' || method === 'PATCH')) {
    const campaignId = endpoint.match(/urn:li:sponsoredCampaign:\d+/)?.[0];
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId) || MOCK_CAMPAIGNS[0];
    
    return {
      ...campaign,
      name: data.name || campaign.name,
      status: data.status || campaign.status,
      dailyBudget: data.daily_budget_amount ? {
        amount: String(data.daily_budget_amount),
        currencyCode: 'USD'
      } : campaign.dailyBudget,
      totalBudget: data.total_budget_amount ? {
        amount: String(data.total_budget_amount),
        currencyCode: 'USD'
      } : campaign.totalBudget,
      runSchedule: {
        start: campaign.runSchedule.start,
        end: data.end_date ? parseInt(data.end_date) : campaign.runSchedule.end
      },
      lastModified: Date.now()
    };
  }
  
  // Creatives - List
  if (endpoint.includes('/creatives') && method === 'GET') {
    let creatives = MOCK_CREATIVES;
    
    if (data?.campaign_id) {
      creatives = creatives.filter(c => c.campaign === data.campaign_id);
    }
    
    if (data?.status && data.status.length > 0) {
      creatives = creatives.filter(c => data.status.includes(c.status));
    }
    
    return {
      elements: creatives,
      paging: { count: creatives.length, start: 0, total: creatives.length }
    };
  }
  
  // Creatives - Create (Sponsored Content)
  if (endpoint.includes('/creatives') && method === 'POST' && data.creative_type) {
    const newId = `urn:li:sponsoredCreative:${Math.floor(Math.random() * 900000) + 100000}`;
    const now = Date.now();
    
    let content = {
      reference: `urn:li:share:${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      introText: data.intro_text || '',
      headline: data.headline,
      callToAction: {
        labelType: data.call_to_action || 'LEARN_MORE',
        landingPage: data.landing_page_url
      }
    };
    
    if (data.creative_type === 'SINGLE_IMAGE' && data.image_url) {
      content.media = {
        type: 'IMAGE',
        url: data.image_url,
        landingPage: data.landing_page_url
      };
    } else if (data.creative_type === 'VIDEO' && data.video_url) {
      content.media = {
        type: 'VIDEO',
        url: data.video_url,
        thumbnail: data.video_url.replace('.mp4', '_thumb.jpg'),
        duration: 60,
        landingPage: data.landing_page_url
      };
    } else if (data.creative_type === 'CAROUSEL') {
      content.media = {
        type: 'CAROUSEL',
        elements: []
      };
    }
    
    return {
      id: newId,
      campaign: data.campaign_id,
      status: data.status || 'PAUSED',
      type: 'SPONSORED_STATUS_UPDATE',
      created: now,
      lastModified: now,
      intendedStatus: data.status || 'PAUSED',
      servingHoldReasons: data.status === 'ACTIVE' ? [] : ['CREATIVE_PAUSED'],
      content
    };
  }
  
  // Creatives - Create (Message Ad)
  if (endpoint.includes('/adDirectSponsoredContents') && method === 'POST') {
    const newId = `urn:li:sponsoredCreative:${Math.floor(Math.random() * 900000) + 100000}`;
    const now = Date.now();
    
    return {
      id: newId,
      campaign: data.campaign_id,
      status: data.status || 'PAUSED',
      type: 'MESSAGE_AD',
      created: now,
      lastModified: now,
      content: {
        reference: `urn:li:message:${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        subject: data.subject,
        messageBody: data.message_body,
        sender: {
          name: data.sender_name
        },
        callToAction: {
          text: data.call_to_action_text,
          url: data.call_to_action_url
        },
        bannerImage: data.banner_image_url ? {
          url: data.banner_image_url
        } : null
      }
    };
  }
  
  // Creatives - Create (Text Ad)
  if (endpoint.includes('/adCreativesV2') && method === 'POST') {
    const newId = `urn:li:sponsoredCreative:${Math.floor(Math.random() * 900000) + 100000}`;
    const now = Date.now();
    
    return {
      id: newId,
      campaign: data.campaign_id,
      status: data.status || 'PAUSED',
      type: 'TEXT_AD',
      created: now,
      lastModified: now,
      content: {
        headline: data.headline,
        description: data.description,
        landingPage: data.landing_page_url,
        image: {
          url: data.image_url
        }
      }
    };
  }
  
  // Targeting Facets
  if (endpoint.includes('/targeting') || endpoint.includes('/facets')) {
    const facetType = data?.facet_type || 'TITLES';
    const search = data?.search?.toLowerCase() || '';
    
    let facets = MOCK_TARGETING_FACETS[facetType] || MOCK_TARGETING_FACETS.TITLES;
    
    if (search) {
      facets = facets.filter(f => 
        f.name?.toLowerCase().includes(search) || 
        f.localizedName?.toLowerCase().includes(search)
      );
    }
    
    return {
      elements: facets,
      paging: { count: facets.length, start: 0, total: facets.length }
    };
  }
  
  // Audience Count Estimation
  if (endpoint.includes('/audienceCounts') || endpoint.includes('/forecast')) {
    const targeting = data?.targeting || {};
    
    // Estimate based on targeting breadth
    let baseReach = 1000000;
    let reachMultiplier = 1.0;
    
    if (targeting.job_titles?.length > 0) reachMultiplier *= 0.15;
    if (targeting.companies?.length > 0) reachMultiplier *= 0.08;
    if (targeting.industries?.length > 0) reachMultiplier *= 0.25;
    if (targeting.seniorities?.length > 0) reachMultiplier *= 0.3;
    if (targeting.company_sizes?.length > 0) reachMultiplier *= 0.4;
    if (targeting.skills?.length > 0) reachMultiplier *= 0.1;
    
    const estimatedReach = Math.floor(baseReach * reachMultiplier);
    
    return {
      targeting: targeting,
      estimatedReach: estimatedReach,
      estimatedImpressions: {
        min: Math.floor(estimatedReach * 0.02),
        max: Math.floor(estimatedReach * 0.08)
      },
      estimatedClicks: {
        min: Math.floor(estimatedReach * 0.0004),
        max: Math.floor(estimatedReach * 0.002)
      },
      estimatedDailyBudget: {
        min: 50,
        max: 500,
        recommended: 200
      }
    };
  }
  
  // Lead Gen Forms
  if (endpoint.includes('/leadForms')) {
    if (data?.form_id) {
      const form = MOCK_LEAD_GEN_FORMS.find(f => f.id === data.form_id) || MOCK_LEAD_GEN_FORMS[0];
      
      if (data?.include_leads) {
        return form;
      } else {
        const { leads, ...formWithoutLeads } = form;
        return formWithoutLeads;
      }
    }
    
    return {
      elements: MOCK_LEAD_GEN_FORMS.map(f => {
        if (data?.include_leads) {
          return f;
        } else {
          const { leads, ...formWithoutLeads } = f;
          return formWithoutLeads;
        }
      }),
      paging: { count: MOCK_LEAD_GEN_FORMS.length, start: 0, total: MOCK_LEAD_GEN_FORMS.length }
    };
  }
  
  // Analytics
  if (endpoint.includes('/analytics') || endpoint.includes('/insights') || endpoint.includes('/stats')) {
    const entityType = data?.entity_type || 'CAMPAIGN';
    const entityId = data?.entity_id;
    
    if (entityType === 'ACCOUNT' || !entityId) {
      return MOCK_ANALYTICS.ACCOUNT;
    }
    
    const analytics = MOCK_ANALYTICS[entityId];
    if (analytics) {
      return analytics;
    }
    
    // Return first campaign analytics as fallback
    return MOCK_ANALYTICS['urn:li:sponsoredCampaign:123456'];
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
    sandbox: !hasLinkedInAds,
    timestamp: new Date().toISOString()
  };
  
  try {
    switch (toolName) {
      case 'linkedin_get_ad_accounts': {
        const response = await apiRequest('GET', '/adAccounts', input);
        result.data = response.elements || response;
        result.count = result.data.length;
        break;
      }
      
      case 'linkedin_get_campaigns': {
        const response = await apiRequest('GET', '/adCampaigns', input);
        result.data = response.elements || response;
        result.count = result.data.length;
        break;
      }
      
      case 'linkedin_create_campaign': {
        const response = await apiRequest('POST', '/adCampaigns', input);
        result.data = response;
        result.message = `Created campaign: ${response.id}`;
        break;
      }
      
      case 'linkedin_update_campaign': {
        const { campaign_id, ...updateData } = input;
        const response = await apiRequest('PATCH', `/adCampaigns/${campaign_id}`, updateData);
        result.data = response;
        result.message = `Updated campaign: ${campaign_id}`;
        break;
      }
      
      case 'linkedin_get_creatives': {
        const response = await apiRequest('GET', '/creatives', input);
        result.data = response.elements || response;
        result.count = result.data.length;
        break;
      }
      
      case 'linkedin_create_sponsored_content': {
        const response = await apiRequest('POST', '/creatives', input);
        result.data = response;
        result.message = `Created sponsored content: ${response.id}`;
        break;
      }
      
      case 'linkedin_create_message_ad': {
        const response = await apiRequest('POST', '/adDirectSponsoredContents', input);
        result.data = response;
        result.message = `Created message ad: ${response.id}`;
        break;
      }
      
      case 'linkedin_create_text_ad': {
        const response = await apiRequest('POST', '/adCreativesV2', input);
        result.data = response;
        result.message = `Created text ad: ${response.id}`;
        break;
      }
      
      case 'linkedin_get_targeting_facets': {
        const response = await apiRequest('GET', '/targeting/facets', input);
        result.data = response.elements || response;
        result.count = result.data.length;
        result.facet_type = input.facet_type;
        break;
      }
      
      case 'linkedin_get_audience_counts': {
        const response = await apiRequest('POST', '/audienceCounts', input);
        result.data = response;
        break;
      }
      
      case 'linkedin_get_lead_gen_forms': {
        const response = await apiRequest('GET', '/leadForms', input);
        result.data = response.elements || response;
        result.count = Array.isArray(result.data) ? result.data.length : 1;
        break;
      }
      
      case 'linkedin_get_analytics': {
        const response = await apiRequest('GET', '/analytics', input);
        result.data = response;
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
  if (!hasLinkedInAds) {
    return {
      status: 'ok',
      mode: 'sandbox',
      message: 'LinkedIn Ads connector running in sandbox mode (no credentials configured)',
      mock_data: {
        accounts: MOCK_ACCOUNTS.length,
        campaigns: MOCK_CAMPAIGNS.length,
        creatives: MOCK_CREATIVES.length,
        lead_gen_forms: MOCK_LEAD_GEN_FORMS.length
      }
    };
  }
  
  try {
    const response = await apiRequest('GET', '/adAccounts');
    return {
      status: 'ok',
      mode: 'live',
      message: 'Successfully connected to LinkedIn Ads API',
      account_id: adAccountId,
      accounts: response.elements?.length || 0
    };
  } catch (error) {
    return {
      status: 'error',
      mode: 'live',
      message: 'Failed to connect to LinkedIn Ads API',
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
    sandbox: !hasLinkedInAds,
    toolCount: tools.length,
    capabilities: {
      campaign_management: true,
      creative_management: true,
      targeting: true,
      lead_gen_forms: true,
      analytics: true,
      b2b_targeting: true,
      sponsored_content: true,
      message_ads: true,
      text_ads: true
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

class LinkedInAdsConnector extends BaseConnector {
  constructor() {
    super({
      name: 'LinkedIn Ads',
      shortName: 'LinkedIn',
      version: '1.0.0',
      oauth: {
        provider: 'linkedin',
        scopes: ['r_ads', 'rw_ads', 'r_ads_reporting', 'r_organization_social'],
        apiEndpoint: 'https://api.linkedin.com/v2',
        tokenType: 'oauth2_access_token',
        accountIdKey: 'LINKEDIN_AD_ACCOUNT_ID'
      },
      envVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AD_ACCOUNT_ID'],
      connectionCheck: (creds) => !!(creds.LINKEDIN_ACCESS_TOKEN && creds.LINKEDIN_AD_ACCOUNT_ID)
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

module.exports = new LinkedInAdsConnector();
