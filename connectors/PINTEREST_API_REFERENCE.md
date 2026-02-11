# Pinterest Ads Connector - API Reference

Complete reference for all 15 MCP tools in the Pinterest Ads connector.

## Table of Contents

**Campaign Management**
1. [pinterest_get_campaigns](#pinterest_get_campaigns)
2. [pinterest_create_campaign](#pinterest_create_campaign)
3. [pinterest_update_campaign](#pinterest_update_campaign)

**Ad Group Management**
4. [pinterest_get_ad_groups](#pinterest_get_ad_groups)
5. [pinterest_create_ad_group](#pinterest_create_ad_group)
6. [pinterest_update_ad_group](#pinterest_update_ad_group)

**Ad Management**
7. [pinterest_get_ads](#pinterest_get_ads)
8. [pinterest_create_ad](#pinterest_create_ad)
9. [pinterest_update_ad](#pinterest_update_ad)

**Audience Management**
10. [pinterest_get_audiences](#pinterest_get_audiences)
11. [pinterest_create_audience](#pinterest_create_audience)

**Reporting**
12. [pinterest_get_insights](#pinterest_get_insights)

**Account & Pins**
13. [pinterest_get_ad_accounts](#pinterest_get_ad_accounts)
14. [pinterest_get_pins](#pinterest_get_pins)
15. [pinterest_create_pin](#pinterest_create_pin)

---

## Campaign Management

### pinterest_get_campaigns

List Pinterest campaigns with optional filtering.

**Parameters:**
```javascript
{
  entity_statuses: ['ACTIVE', 'PAUSED', 'ARCHIVED'], // optional
  page_size: 25,                                     // optional, max 100
  order: 'ASCENDING' | 'DESCENDING'                  // optional
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_campaigns', {
  entity_statuses: ['ACTIVE'],
  page_size: 50
});

// Response:
{
  data: [
    {
      id: '549755885175001',
      ad_account_id: '549755885175',
      name: 'Spring Fashion Campaign',
      status: 'ACTIVE',
      objective_type: 'CONSIDERATION',
      created_time: 1704070800,
      updated_time: 1707836400,
      lifetime_spend_cap: 1500000000, // $150 in micro-currency
      daily_spend_cap: 50000000        // $5/day
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_create_campaign

Create a new Pinterest Ads campaign.

**Parameters:**
```javascript
{
  name: string,                                      // required
  objective_type: 'AWARENESS' | 'CONSIDERATION'      // required
                | 'CONVERSIONS',
  status: 'ACTIVE' | 'PAUSED',                       // optional, default: PAUSED
  lifetime_spend_cap: number,                        // optional, micro-currency
  daily_spend_cap: number,                           // optional, micro-currency
  start_time: string,                                // optional, ISO 8601
  end_time: string,                                  // optional, ISO 8601
  is_campaign_budget_optimization: boolean           // optional
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_campaign', {
  name: 'Summer Sale 2026',
  objective_type: 'CONVERSIONS',
  status: 'PAUSED',
  daily_spend_cap: 100000000,  // $10/day
  lifetime_spend_cap: 3000000000, // $300 total
  start_time: '2026-06-01T00:00:00Z',
  end_time: '2026-08-31T23:59:59Z',
  is_campaign_budget_optimization: true
});

// Response:
{
  data: {
    id: '549755885175004',
    name: 'Summer Sale 2026',
    objective_type: 'CONVERSIONS',
    status: 'PAUSED',
    daily_spend_cap: 100000000,
    is_campaign_budget_optimization: true
  },
  sandbox: false
}
```

**Objective Types:**
- **AWARENESS** - Brand awareness, reach
- **CONSIDERATION** - Traffic, engagement, video views, app installs
- **CONVERSIONS** - Sales, catalog sales, conversions

---

### pinterest_update_campaign

Update an existing campaign's settings.

**Parameters:**
```javascript
{
  campaign_id: string,              // required
  name: string,                     // optional
  status: 'ACTIVE' | 'PAUSED'       // optional
        | 'ARCHIVED',
  lifetime_spend_cap: number,       // optional, micro-currency
  daily_spend_cap: number           // optional, micro-currency
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_update_campaign', {
  campaign_id: '549755885175001',
  status: 'ACTIVE',
  daily_spend_cap: 150000000  // Increase to $15/day
});

// Response:
{
  data: {
    id: '549755885175001',
    status: 'ACTIVE',
    daily_spend_cap: 150000000,
    updated_time: 1707922800
  },
  success: true,
  sandbox: false
}
```

---

## Ad Group Management

### pinterest_get_ad_groups

List ad groups with optional filtering.

**Parameters:**
```javascript
{
  campaign_ids: ['campaign_id'],               // optional
  entity_statuses: ['ACTIVE', 'PAUSED'],       // optional
  page_size: 25                                // optional, max 100
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_ad_groups', {
  campaign_ids: ['549755885175001'],
  entity_statuses: ['ACTIVE']
});

// Response:
{
  data: [
    {
      id: '549755885176001',
      campaign_id: '549755885175001',
      name: 'Women 25-45 Fashion Lovers',
      status: 'ACTIVE',
      budget_in_micro_currency: 25000000,  // $2.50/day
      bid_in_micro_currency: 2000000,      // $0.20 CPM
      targeting_spec: {
        GENDER: ['FEMALE'],
        AGE_BUCKET: ['25-34', '35-44'],
        GEO: ['US'],
        INTEREST: ['Fashion', 'Shopping']
      }
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_create_ad_group

Create an ad group with targeting and budget.

**Parameters:**
```javascript
{
  campaign_id: string,                     // required
  name: string,                            // required
  status: 'ACTIVE' | 'PAUSED',             // optional, default: PAUSED
  budget_in_micro_currency: number,        // optional, daily budget
  bid_in_micro_currency: number,           // optional, bid amount
  billable_event: 'CLICKTHROUGH'           // optional
                | 'IMPRESSION'
                | 'VIDEO_V_50_MRC',
  targeting_spec: {                        // optional
    GENDER: ['MALE', 'FEMALE', 'UNISEX'],
    AGE_BUCKET: ['18-24', '25-34', ...],
    GEO: ['US', 'CA', 'GB'],
    INTEREST: ['Fashion', 'Technology'],
    KEYWORD: ['summer dress', 'gadgets'],
    LOCALE: ['en-US', 'es-MX'],
    PLACEMENT: ['BROWSE', 'SEARCH', 'ALL']
  },
  start_time: string,                      // optional, ISO 8601
  end_time: string                         // optional, ISO 8601
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_ad_group', {
  campaign_id: '549755885175001',
  name: 'Fashion - Women 25-44 - US',
  status: 'PAUSED',
  budget_in_micro_currency: 50000000,  // $5/day
  bid_in_micro_currency: 3000000,      // $0.30 CPM
  billable_event: 'IMPRESSION',
  targeting_spec: {
    GENDER: ['FEMALE'],
    AGE_BUCKET: ['25-34', '35-44'],
    GEO: ['US'],
    INTEREST: ['Fashion', 'Womens fashion', 'Shopping'],
    KEYWORD: ['summer dress', 'fashion trends'],
    PLACEMENT: ['ALL']
  }
});

// Response:
{
  data: {
    id: '549755885176005',
    campaign_id: '549755885175001',
    name: 'Fashion - Women 25-44 - US',
    status: 'PAUSED',
    budget_in_micro_currency: 50000000,
    targeting_spec: { ... }
  },
  sandbox: false
}
```

**Age Buckets:**
`'18-24'`, `'25-34'`, `'35-44'`, `'45-49'`, `'50-54'`, `'55-64'`, `'65+'`

**Placements:**
- `BROWSE` - Pinterest home feed
- `SEARCH` - Search results
- `ALL` - Both browse and search

---

### pinterest_update_ad_group

Update ad group settings.

**Parameters:**
```javascript
{
  ad_group_id: string,                  // required
  name: string,                         // optional
  status: 'ACTIVE' | 'PAUSED'           // optional
        | 'ARCHIVED',
  budget_in_micro_currency: number,     // optional
  bid_in_micro_currency: number         // optional
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_update_ad_group', {
  ad_group_id: '549755885176001',
  status: 'ACTIVE',
  budget_in_micro_currency: 75000000  // Increase to $7.50/day
});

// Response:
{
  data: {
    id: '549755885176001',
    status: 'ACTIVE',
    budget_in_micro_currency: 75000000,
    updated_time: 1707922800
  },
  success: true,
  sandbox: false
}
```

---

## Ad Management

### pinterest_get_ads

List ads with optional filtering.

**Parameters:**
```javascript
{
  ad_group_ids: ['ad_group_id'],          // optional
  campaign_ids: ['campaign_id'],          // optional
  entity_statuses: ['ACTIVE', 'PAUSED'],  // optional
  page_size: 25                           // optional, max 100
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_ads', {
  ad_group_ids: ['549755885176001'],
  entity_statuses: ['ACTIVE']
});

// Response:
{
  data: [
    {
      id: '549755885177001',
      ad_group_id: '549755885176001',
      campaign_id: '549755885175001',
      name: 'Spring Dress Collection - Pin 1',
      status: 'ACTIVE',
      creative_type: 'REGULAR',
      pin_id: '1234567890123456789',
      destination_url: 'https://example.com/dresses'
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_create_ad

Create an ad by linking a pin to an ad group.

**Parameters:**
```javascript
{
  ad_group_id: string,                    // required
  creative_type: 'REGULAR' | 'VIDEO'      // required
               | 'SHOPPING' | 'CAROUSEL'
               | 'MAX_VIDEO' | 'SHOP_THE_PIN'
               | 'STORY',
  name: string,                           // optional
  status: 'ACTIVE' | 'PAUSED',            // optional, default: PAUSED
  pin_id: string,                         // required (for existing pins)
  destination_url: string,                // optional
  android_deep_link: string,              // optional
  ios_deep_link: string                   // optional
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_ad', {
  ad_group_id: '549755885176001',
  name: 'Summer Dress Promo - Pin A',
  creative_type: 'REGULAR',
  pin_id: '1234567890123456789',
  destination_url: 'https://example.com/summer-dresses',
  status: 'PAUSED'
});

// Response:
{
  data: {
    id: '549755885177005',
    ad_group_id: '549755885176001',
    name: 'Summer Dress Promo - Pin A',
    creative_type: 'REGULAR',
    pin_id: '1234567890123456789',
    status: 'PAUSED'
  },
  sandbox: false
}
```

**Creative Types:**
- **REGULAR** - Standard pin ad
- **VIDEO** - Video pin ad
- **SHOPPING** - Product pin ad
- **CAROUSEL** - Multi-image carousel
- **MAX_VIDEO** - Video with product tags
- **SHOP_THE_PIN** - Shoppable pin
- **STORY** - Story pin ad

---

### pinterest_update_ad

Update ad status or settings.

**Parameters:**
```javascript
{
  ad_id: string,                          // required
  name: string,                           // optional
  status: 'ACTIVE' | 'PAUSED'             // optional
        | 'ARCHIVED'
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_update_ad', {
  ad_id: '549755885177001',
  status: 'ACTIVE'
});

// Response:
{
  data: {
    id: '549755885177001',
    status: 'ACTIVE',
    updated_time: 1707922800
  },
  success: true,
  sandbox: false
}
```

---

## Audience Management

### pinterest_get_audiences

List custom audiences.

**Parameters:**
```javascript
{
  page_size: 25,                           // optional, max 100
  order: 'ASCENDING' | 'DESCENDING'        // optional
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_audiences', {
  page_size: 50
});

// Response:
{
  data: [
    {
      id: '549755885178001',
      ad_account_id: '549755885175',
      name: 'Website Visitors - Last 30 Days',
      audience_type: 'VISITOR',
      description: 'Users who visited our website',
      size: 15000,
      status: 'READY',
      created_timestamp: 1703847600
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_create_audience

Create a custom or lookalike audience.

**Parameters:**
```javascript
{
  name: string,                            // required
  audience_type: 'CUSTOMER_LIST'           // required
               | 'VISITOR'
               | 'ENGAGEMENT'
               | 'ACTALIKE',
  description: string,                     // optional
  rule: {                                  // optional
    country: string,                       // e.g., 'US'
    retention_days: number,                // e.g., 30, 90, 180
    engagement_type: 'CLICK' | 'SAVE'      // for ENGAGEMENT
                   | 'CLOSEUP' | 'COMMENT',
    event_type: string                     // for VISITOR, e.g., 'pagevisit'
  },
  seed_id: string                          // required for ACTALIKE
}
```

**Example 1: Customer List**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_audience', {
  name: 'Email Subscribers - Q1 2026',
  audience_type: 'CUSTOMER_LIST',
  description: 'Newsletter subscribers from Q1',
  rule: {
    country: 'US',
    retention_days: 180
  }
});

// Response:
{
  data: {
    id: '549755885178004',
    name: 'Email Subscribers - Q1 2026',
    audience_type: 'CUSTOMER_LIST',
    status: 'PROCESSING',
    size: 0
  },
  sandbox: false
}
```

**Example 2: Website Visitors**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_audience', {
  name: 'Product Page Visitors - 90 Days',
  audience_type: 'VISITOR',
  description: 'Users who viewed product pages',
  rule: {
    country: 'US',
    retention_days: 90,
    event_type: 'pagevisit'
  }
});
```

**Example 3: Lookalike Audience**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_audience', {
  name: 'Lookalike - Top Purchasers 1%',
  audience_type: 'ACTALIKE',
  description: '1% lookalike based on purchasers',
  seed_id: '549755885178001',
  rule: {
    country: 'US',
    retention_days: 90
  }
});
```

**Audience Types:**
- **CUSTOMER_LIST** - Uploaded email/phone list
- **VISITOR** - Website/app visitors (requires Pinterest tag)
- **ENGAGEMENT** - Users who engaged with your pins
- **ACTALIKE** - Lookalike audience (requires seed audience)

---

## Reporting

### pinterest_get_insights

Get performance metrics for campaigns, ad groups, or ads.

**Parameters:**
```javascript
{
  level: 'CAMPAIGN' | 'AD_GROUP'           // required
       | 'AD' | 'PIN_PROMOTION',
  start_date: 'YYYY-MM-DD',                // required
  end_date: 'YYYY-MM-DD',                  // required
  granularity: 'TOTAL' | 'DAY'             // optional, default: TOTAL
             | 'HOUR' | 'WEEK' | 'MONTH',
  campaign_ids: ['campaign_id'],           // optional
  ad_group_ids: ['ad_group_id'],           // optional
  ad_ids: ['ad_id'],                       // optional
  columns: [                               // optional
    'IMPRESSION',
    'CLICKTHROUGH',
    'SPEND_IN_DOLLAR',
    'CTR_2',
    'ECPM'
  ]
}
```

**Example 1: Campaign Insights**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_insights', {
  level: 'CAMPAIGN',
  start_date: '2026-02-01',
  end_date: '2026-02-28',
  campaign_ids: ['549755885175001', '549755885175002'],
  granularity: 'TOTAL',
  columns: [
    'IMPRESSION',
    'CLICKTHROUGH',
    'SPEND_IN_DOLLAR',
    'CTR_2',
    'ECPM',
    'ECPC',
    'TOTAL_CONVERSIONS',
    'CPA'
  ]
});

// Response:
{
  data: [
    {
      campaign_id: '549755885175001',
      date_start: '2026-02-01',
      date_end: '2026-02-28',
      metrics: {
        IMPRESSION: 125000,
        CLICKTHROUGH: 2500,
        SPEND_IN_DOLLAR: 42.50,
        CTR_2: 2.0,
        ECPM: 0.34,
        ECPC: 0.017,
        TOTAL_CONVERSIONS: 75,
        CPA: 0.57
      }
    }
  ],
  count: 1,
  sandbox: false
}
```

**Example 2: Daily Breakdown**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_insights', {
  level: 'AD_GROUP',
  start_date: '2026-02-01',
  end_date: '2026-02-07',
  ad_group_ids: ['549755885176001'],
  granularity: 'DAY'
});

// Returns daily metrics for Feb 1-7
```

**Available Metrics:**
- **IMPRESSION** - Total impressions
- **CLICKTHROUGH** - Total clicks
- **SPEND_IN_DOLLAR** - Total spend ($)
- **CTR_2** - Click-through rate (%)
- **ECPM** - Effective CPM ($)
- **ECPC** - Effective CPC ($)
- **ECTR** - Engagement CTR (%)
- **TOTAL_ENGAGEMENT** - Total engagements
- **ENGAGEMENT_RATE** - Engagement rate (%)
- **SAVE** - Total saves
- **OUTBOUND_CLICK** - Outbound clicks
- **TOTAL_CONVERSIONS** - Total conversions
- **CPA** - Cost per acquisition ($)
- **VIDEO_MRC_VIEW** - Video views (50% for 2s)
- **VIDEO_AVG_WATCH_TIME_SECS** - Avg watch time

---

## Account & Pins

### pinterest_get_ad_accounts

List accessible ad accounts.

**Parameters:**
```javascript
{
  page_size: 25                            // optional, max 100
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_ad_accounts', {
  page_size: 10
});

// Response:
{
  data: [
    {
      id: '549755885175',
      name: 'My Business Ad Account',
      owner: {
        username: 'mybusiness'
      },
      country: 'US',
      currency: 'USD'
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_get_pins

List organic pins from user boards.

**Parameters:**
```javascript
{
  page_size: 25,                           // optional, max 100
  pin_filter: 'all' | 'promoted'           // optional
            | 'organic'
}
```

**Example:**
```javascript
const result = await pinterest.handleToolCall('pinterest_get_pins', {
  page_size: 50,
  pin_filter: 'all'
});

// Response:
{
  data: [
    {
      id: '1234567890123456789',
      created_at: '2026-01-15T10:00:00Z',
      title: 'Spring Dress Collection 2026',
      description: 'Discover our latest spring fashion...',
      link: 'https://example.com/spring-dresses',
      board_id: '549755885179001',
      dominant_color: '#FFB6C1',
      media: {
        media_type: 'image',
        images: {
          '600x': { width: 600, height: 900, url: '...' }
        }
      }
    }
  ],
  count: 1,
  sandbox: false
}
```

---

### pinterest_create_pin

Create a new pin for promotion.

**Parameters:**
```javascript
{
  board_id: string,                        // required
  title: string,                           // required, max 100 chars
  description: string,                     // optional, max 500 chars
  link: string,                            // optional, destination URL
  media_source: {                          // required
    source_type: 'image_url'               // required
               | 'image_base64'
               | 'video_url',
    url: string,                           // required for image_url/video_url
    cover_image_url: string                // optional, for videos
  },
  alt_text: string,                        // optional, accessibility
  dominant_color: string                   // optional, hex code
}
```

**Example 1: Image Pin**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_pin', {
  board_id: '549755885179001',
  title: 'Summer Collection 2026',
  description: 'Shop our new summer arrivals. Limited time offer!',
  link: 'https://example.com/summer-collection',
  media_source: {
    source_type: 'image_url',
    url: 'https://example.com/images/summer-collection.jpg'
  },
  alt_text: 'Woman wearing summer dress on beach',
  dominant_color: '#87CEEB'
});

// Response:
{
  data: {
    id: '1234567890123456794',
    title: 'Summer Collection 2026',
    link: 'https://example.com/summer-collection',
    board_id: '549755885179001',
    dominant_color: '#87CEEB',
    created_at: '2026-02-11T10:30:00Z'
  },
  sandbox: false
}
```

**Example 2: Video Pin**
```javascript
const result = await pinterest.handleToolCall('pinterest_create_pin', {
  board_id: '549755885179002',
  title: 'How to Style Our Products',
  description: 'Watch this quick styling tutorial.',
  link: 'https://example.com/videos',
  media_source: {
    source_type: 'video_url',
    url: 'https://example.com/videos/styling-tutorial.mp4',
    cover_image_url: 'https://example.com/images/video-thumb.jpg'
  },
  alt_text: 'Styling tutorial video'
});
```

**Pinterest Image Specs:**
- **Aspect Ratios:** 1:1, 2:3, 9:16 (vertical preferred)
- **File Size:** Max 32MB (images), 2GB (videos)
- **Formats:** JPG, PNG (images); MP4, MOV (videos)
- **Recommended:** 1000×1500px (2:3 ratio)

---

## Micro-Currency Reference

Pinterest uses **micro-currency** for all monetary values:

**Conversion:**
```
Micro-currency = Dollars × 10,000,000

$1.00 = 10,000,000
$10.00 = 100,000,000
$0.25 = 2,500,000
```

**Helper Functions:**
```javascript
function dollarToMicro(dollars) {
  return Math.round(dollars * 10_000_000);
}

function microToDollar(micro) {
  return micro / 10_000_000;
}

// Examples:
dollarToMicro(25);    // 250,000,000
microToDollar(50_000_000);  // 5.0
```

---

## Common Use Cases

### Use Case 1: Launch New Campaign

```javascript
// 1. Create campaign
const campaign = await pinterest.handleToolCall('pinterest_create_campaign', {
  name: 'Fall Fashion Launch',
  objective_type: 'CONVERSIONS',
  daily_spend_cap: 100000000  // $10/day
});

// 2. Create ad group with targeting
const adGroup = await pinterest.handleToolCall('pinterest_create_ad_group', {
  campaign_id: campaign.data.id,
  name: 'Women 25-44 - Fashion Lovers',
  budget_in_micro_currency: 100000000,  // $10/day
  bid_in_micro_currency: 3000000,       // $0.30 CPM
  targeting_spec: {
    GENDER: ['FEMALE'],
    AGE_BUCKET: ['25-34', '35-44'],
    GEO: ['US'],
    INTEREST: ['Fashion', 'Shopping']
  }
});

// 3. Create ad with existing pin
const ad = await pinterest.handleToolCall('pinterest_create_ad', {
  ad_group_id: adGroup.data.id,
  creative_type: 'REGULAR',
  pin_id: 'your_pin_id',
  destination_url: 'https://example.com/fall-collection'
});

// 4. Activate when ready
await pinterest.handleToolCall('pinterest_update_campaign', {
  campaign_id: campaign.data.id,
  status: 'ACTIVE'
});

await pinterest.handleToolCall('pinterest_update_ad_group', {
  ad_group_id: adGroup.data.id,
  status: 'ACTIVE'
});

await pinterest.handleToolCall('pinterest_update_ad', {
  ad_id: ad.data.id,
  status: 'ACTIVE'
});
```

### Use Case 2: Build Retargeting Campaign

```javascript
// 1. Create visitor audience
const audience = await pinterest.handleToolCall('pinterest_create_audience', {
  name: 'Website Visitors - 30 Days',
  audience_type: 'VISITOR',
  rule: {
    country: 'US',
    retention_days: 30,
    event_type: 'pagevisit'
  }
});

// 2. Create campaign
const campaign = await pinterest.handleToolCall('pinterest_create_campaign', {
  name: 'Retargeting - Cart Abandoners',
  objective_type: 'CONVERSIONS',
  daily_spend_cap: 50000000  // $5/day
});

// 3. Create ad group targeting the audience
// (Note: Audience targeting in targeting_spec coming soon in Pinterest API)
const adGroup = await pinterest.handleToolCall('pinterest_create_ad_group', {
  campaign_id: campaign.data.id,
  name: 'Retargeting - Website Visitors',
  budget_in_micro_currency: 50000000,
  bid_in_micro_currency: 4000000  // $0.40 CPM (higher for retargeting)
});
```

### Use Case 3: Performance Reporting

```javascript
// Get last 30 days performance for all campaigns
const insights = await pinterest.handleToolCall('pinterest_get_insights', {
  level: 'CAMPAIGN',
  start_date: '2026-01-12',
  end_date: '2026-02-11',
  granularity: 'TOTAL',
  columns: [
    'IMPRESSION',
    'CLICKTHROUGH',
    'SPEND_IN_DOLLAR',
    'CTR_2',
    'TOTAL_CONVERSIONS',
    'CPA'
  ]
});

// Calculate ROAS
insights.data.forEach(campaign => {
  const spend = campaign.metrics.SPEND_IN_DOLLAR;
  const conversions = campaign.metrics.TOTAL_CONVERSIONS;
  const avgOrderValue = 50; // Your average order value
  const revenue = conversions * avgOrderValue;
  const roas = revenue / spend;
  
  console.log(`Campaign ${campaign.campaign_id}:`);
  console.log(`  Spend: $${spend}`);
  console.log(`  Conversions: ${conversions}`);
  console.log(`  Revenue: $${revenue}`);
  console.log(`  ROAS: ${roas.toFixed(2)}x`);
});
```

---

## Error Handling

All tools return errors in this format:

```javascript
{
  error: 'Error message',
  tool: 'pinterest_create_campaign',
  params: { ... }
}
```

**Common Errors:**
- `"name and objective_type are required"` - Missing required params
- `"Pinterest API error: 401 Unauthorized"` - Invalid access token
- `"Pinterest API error: 404 Not Found"` - Invalid ID
- `"Pinterest API error: 429 Too Many Requests"` - Rate limit (auto-retry)

---

## Additional Resources

- **Pinterest Ads API Docs:** https://developers.pinterest.com/docs/api/v5/
- **Setup Guide:** [PINTEREST_SETUP.md](./PINTEREST_SETUP.md)
- **Test Suite:** Run `node test-pinterest.js` for examples

**Happy pinning! 📌**
