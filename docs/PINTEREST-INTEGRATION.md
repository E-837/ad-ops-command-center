# Pinterest Ads Integration Guide

Complete integration guide for Pinterest Ads in the Ad Ops Command system.

## Overview

The Pinterest Ads connector provides full campaign management capabilities for Pinterest's visual discovery advertising platform. This integration completes the social media advertising trio: **Google Ads (search)**, **Meta Ads (social)**, and **Pinterest Ads (visual discovery)**.

## Key Features

### ✅ Complete API Coverage
- **15 MCP Tools** - Full CRUD operations for campaigns, ad groups, ads, audiences, and pins
- **Dual-Mode Operation** - Sandbox mode with mock data + live mode with real Pinterest API
- **100% Test Coverage** - 24 comprehensive tests, all passing in sandbox mode

### ✅ Production-Ready
- OAuth2 authentication with long-lived tokens (90 days)
- Automatic retry logic with exponential backoff
- Rate limiting handling (10K requests/day, 200/min, 10/sec)
- Complete error handling and validation

### ✅ Agent Integration
- **SocialMediaBuyer Agent** enhanced with Pinterest support
- Pinterest-specific targeting recommendations
- Pin copy generation utilities
- Bid optimization functions
- Cross-platform comparison (Meta vs Pinterest)

## Architecture

```
ad-ops-command/
├── connectors/
│   ├── pinterest.js                  # Main Pinterest connector (1,350+ lines, 15 tools)
│   ├── test-pinterest.js            # Test suite (24 tests)
│   ├── PINTEREST_SETUP.md           # Setup guide
│   └── PINTEREST_API_REFERENCE.md   # API documentation
├── agents/
│   └── social-media-buyer.js        # Updated with Pinterest support
├── config/
│   └── .env.example                 # Pinterest env vars added
└── docs/
    ├── PINTEREST-INTEGRATION.md     # This file
    └── WEEK-4-COMPLETION-SUMMARY.md # Implementation summary
```

## Pinterest Connector Tools

### Campaign Management (3 tools)
1. **pinterest_get_campaigns** - List campaigns with filters
2. **pinterest_create_campaign** - Create new campaign (AWARENESS/CONSIDERATION/CONVERSIONS)
3. **pinterest_update_campaign** - Update campaign status, budget, name

### Ad Group Management (3 tools)
4. **pinterest_get_ad_groups** - List ad groups with targeting
5. **pinterest_create_ad_group** - Create ad group with interest/keyword targeting
6. **pinterest_update_ad_group** - Update ad group budget, bid, status

### Ad Management (3 tools)
7. **pinterest_get_ads** - List ads by campaign/ad group
8. **pinterest_create_ad** - Create ad (REGULAR/VIDEO/CAROUSEL/SHOPPING)
9. **pinterest_update_ad** - Update ad status

### Audience Management (2 tools)
10. **pinterest_get_audiences** - List custom audiences
11. **pinterest_create_audience** - Create VISITOR/CUSTOMER_LIST/ACTALIKE audiences

### Reporting (1 tool)
12. **pinterest_get_insights** - Get metrics at campaign/ad group/ad level

### Account & Pins (3 tools)
13. **pinterest_get_ad_accounts** - List accessible ad accounts
14. **pinterest_get_pins** - List organic pins
15. **pinterest_create_pin** - Create new pin for promotion

## Setup & Configuration

### 1. Pinterest Developer Setup

**Create Pinterest App:**
1. Go to https://developers.pinterest.com/apps/
2. Create new app with required scopes:
   - `ads:read`
   - `ads:write`
   - `user_accounts:read`
   - `boards:read`
   - `pins:read`
   - `pins:write`

**Get Access Token:**
- Option A: Use API Explorer at https://developers.pinterest.com/tools/access_token/
- Option B: Implement full OAuth2 flow (see PINTEREST_SETUP.md)

### 2. Environment Variables

Add to `config/.env`:

```bash
# Pinterest Ads Configuration
PINTEREST_APP_ID=1234567890
PINTEREST_APP_SECRET=your_app_secret_here
PINTEREST_ACCESS_TOKEN=pina_ABC123...XYZ789
PINTEREST_AD_ACCOUNT_ID=549755885175
```

### 3. Test Connection

```bash
cd connectors
node test-pinterest.js
```

Expected: **24/24 tests passing** in sandbox mode.

## SocialMediaBuyer Agent Enhancements

### New Capabilities

```javascript
capabilities: [
  // ... existing Meta capabilities
  'pinterest_visual_discovery',
  'pinterest_shopping_campaigns',
  'pinterest_interest_targeting',
  'pinterest_keyword_targeting',
  'pinterest_creative_best_practices'
]
```

### New Tools

```javascript
tools: [
  // Meta Ads tools (8 tools)
  'meta_ads_*',
  
  // Pinterest Ads tools (15 tools)
  'pinterest_get_campaigns',
  'pinterest_create_campaign',
  'pinterest_update_campaign',
  'pinterest_get_ad_groups',
  'pinterest_create_ad_group',
  'pinterest_update_ad_group',
  'pinterest_get_ads',
  'pinterest_create_ad',
  'pinterest_update_ad',
  'pinterest_get_audiences',
  'pinterest_create_audience',
  'pinterest_get_insights',
  'pinterest_get_pins',
  'pinterest_create_pin',
  'pinterest_get_ad_accounts'
]
```

### New Helper Functions

#### 1. `suggestPinterestTargeting(product, audience, objective)`

Generates Pinterest-specific targeting recommendations based on product category and campaign objective.

**Example:**
```javascript
const targeting = suggestPinterestTargeting(
  'Home Decor',
  'women 25-45',
  'CONSIDERATION'
);

// Returns:
{
  interests: ['Home decor', 'Interior design', 'DIY home projects'],
  keywords: ['home decor ideas', 'living room design', 'bedroom inspiration'],
  demographics: {
    GENDER: ['FEMALE'],
    AGE_BUCKET: ['25-34', '35-44']
  },
  placement: 'ALL',
  reasoning: {
    interests: 'Home decor has high engagement and save rates on Pinterest',
    placement: 'Test both Browse and Search to find optimal placement mix'
  }
}
```

#### 2. `generatePinCopy(product, objective, brand)`

Generates optimized pin titles and descriptions following Pinterest best practices.

**Example:**
```javascript
const copy = generatePinCopy('Summer Dresses', 'CONVERSIONS', 'ACME Fashion');

// Returns:
{
  titles: [
    'Shop Summer Dresses - ACME Fashion',
    'Summer Dresses You Need Right Now',
    'Get Summer Dresses - Fast Shipping'
  ],
  descriptions: [
    'Looking for summer dresses? Find the perfect match...',
    'Discover amazing summer dresses ideas and inspiration...'
  ],
  bestPractices: [
    'Keep titles under 100 characters',
    'Include relevant keywords naturally',
    'Use action verbs: Discover, Shop, Explore'
  ]
}
```

#### 3. `optimizePinterestBid(performance, objective, placement)`

Analyzes performance and recommends bid adjustments.

**Example:**
```javascript
const recommendation = optimizePinterestBid(
  { ECPM: 8.50, CTR_2: 1.2, TOTAL_CONVERSIONS: 45, SPEND_IN_DOLLAR: 120 },
  'CONVERSIONS',
  'SEARCH'
);

// Returns:
{
  currentMetrics: { cpm: '$8.50', ctr: '1.20%', conversions: 45 },
  suggestedBid: '$10.00',
  suggestedBidMicro: 100000000,
  reasoning: 'Good engagement but paying premium CPM...',
  benchmarks: { targetCPM: '$10.00', targetCTR: '2.00%' }
}
```

#### 4. `compareSocialPlatforms(metaData, pinterestData)`

Compares Meta and Pinterest performance to optimize budget allocation.

**Example:**
```javascript
const comparison = compareSocialPlatforms(metaCampaigns, pinterestInsights);

// Returns:
{
  meta: { spend: '$500', cpm: '$12.50', ctr: '1.8%', cpa: '$15.50', conversions: 32 },
  pinterest: { spend: '$300', cpm: '$6.00', ctr: '2.1%', cpa: '$12.00', conversions: 25 },
  budgetAllocation: { meta: '55-60%', pinterest: '40-45%' },
  recommendations: [
    'Pinterest is outperforming on efficiency...',
    'Use Meta for retargeting warm audiences',
    'Use Pinterest for cold traffic acquisition'
  ]
}
```

## Campaign Workflows

### Workflow 1: Launch New Pinterest Campaign

```javascript
// 1. Create campaign
const campaign = await pinterest.handleToolCall('pinterest_create_campaign', {
  name: 'Q2 Fashion Launch',
  objective_type: 'CONVERSIONS',
  daily_spend_cap: 100000000  // $10/day in micro-currency
});

// 2. Get targeting suggestions
const targeting = suggestPinterestTargeting(
  'Fashion Apparel',
  'women 25-44',
  'CONVERSIONS'
);

// 3. Create ad group
const adGroup = await pinterest.handleToolCall('pinterest_create_ad_group', {
  campaign_id: campaign.data.id,
  name: 'Women Fashion - Search Intent',
  budget_in_micro_currency: 100000000,  // $10/day
  bid_in_micro_currency: 30000000,      // $0.30 CPM
  billable_event: 'IMPRESSION',
  targeting_spec: {
    GENDER: targeting.demographics.GENDER,
    AGE_BUCKET: targeting.demographics.AGE_BUCKET,
    GEO: ['US'],
    INTEREST: targeting.interests,
    KEYWORD: targeting.keywords,
    PLACEMENT: ['SEARCH']  // High-intent search placement
  }
});

// 4. Create pin
const pinCopy = generatePinCopy('Fashion Collection', 'CONVERSIONS', 'Your Brand');
const pin = await pinterest.handleToolCall('pinterest_create_pin', {
  board_id: 'your_board_id',
  title: pinCopy.titles[0],
  description: pinCopy.descriptions[0],
  link: 'https://yourstore.com/collection',
  media_source: {
    source_type: 'image_url',
    url: 'https://yourcdn.com/fashion-image.jpg'
  }
});

// 5. Create ad
const ad = await pinterest.handleToolCall('pinterest_create_ad', {
  ad_group_id: adGroup.data.id,
  creative_type: 'REGULAR',
  pin_id: pin.data.id,
  destination_url: 'https://yourstore.com/collection'
});

// 6. Activate when ready
await pinterest.handleToolCall('pinterest_update_campaign', {
  campaign_id: campaign.data.id,
  status: 'ACTIVE'
});
```

### Workflow 2: Build Retargeting Funnel

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

// 2. Create lookalike audience
const lookalike = await pinterest.handleToolCall('pinterest_create_audience', {
  name: 'Lookalike - Purchasers 1%',
  audience_type: 'ACTALIKE',
  seed_id: 'your_purchaser_audience_id',
  rule: {
    country: 'US',
    retention_days: 90
  }
});

// 3. Create retargeting campaign
// (Note: Full audience targeting integration coming soon in Pinterest API)
```

### Workflow 3: Performance Optimization

```javascript
// 1. Get campaign insights
const insights = await pinterest.handleToolCall('pinterest_get_insights', {
  level: 'AD_GROUP',
  start_date: '2026-02-01',
  end_date: '2026-02-28',
  ad_group_ids: ['your_ad_group_id'],
  granularity: 'TOTAL'
});

// 2. Analyze performance and get bid recommendations
const performance = insights.data[0].metrics;
const bidRec = optimizePinterestBid(performance, 'CONVERSIONS', 'SEARCH');

// 3. Update bid if needed
if (bidRec.suggestedBidMicro !== performance.current_bid) {
  await pinterest.handleToolCall('pinterest_update_ad_group', {
    ad_group_id: 'your_ad_group_id',
    bid_in_micro_currency: bidRec.suggestedBidMicro
  });
}

// 4. Compare platforms
const metaCampaigns = await meta.handleToolCall('meta_ads_get_campaigns', {});
const pinterestCampaigns = await pinterest.handleToolCall('pinterest_get_campaigns', {});
const comparison = compareSocialPlatforms(metaCampaigns.data, insights.data);

console.log('Budget Allocation:', comparison.budgetAllocation);
console.log('Recommendations:', comparison.recommendations);
```

## Pinterest Best Practices

### Creative Guidelines

**Image Specs:**
- **Aspect Ratio:** 2:3 vertical (1000×1500px recommended)
- **File Size:** Max 32MB (images), 2GB (videos)
- **Formats:** JPG, PNG (images); MP4, MOV (videos)
- **Text Overlay:** Keep under 20% of image area

**Video Specs:**
- **Duration:** 6-15 seconds (shorter performs better)
- **Format:** Vertical 9:16 or square 1:1
- **Sound:** Optimize for sound-off viewing with text overlays

**Pin Copy:**
- **Title:** 40-60 characters for mobile (max 100)
- **Description:** Informative, keyword-rich, 200-300 characters (max 500)
- **Call-to-Action:** "Save this pin", "Shop now", "Get inspired"

### Targeting Strategy

**Interest Targeting:**
- Start with Pinterest's curated interest categories (450+ options)
- Layer 3-5 related interests for focused targeting
- Avoid over-targeting (audience size under 50K)

**Keyword Targeting:**
- Use Pinterest's keyword planner for search volume
- Target broad match initially, refine to phrase/exact match
- Seasonal keywords perform exceptionally well (plan 45-60 days ahead)

**Placement Strategy:**
- **Browse:** Discovery, inspiration, cold traffic
- **Search:** High-intent, solution-seeking, warm traffic
- **Test both:** Start with ALL, then optimize based on performance

### Budget & Bidding

**Minimum Budgets:**
- Campaign: $1/day ($10M micro-currency)
- Ad Group: $1/day ($10M micro-currency)
- Recommended starting budget: $5-10/day per ad group

**Bid Strategy:**
- Start with automatic bidding to establish baseline
- Move to manual bidding once you have 50+ conversions
- Target CPM benchmarks:
  - Awareness: $3-5 CPM
  - Consideration: $5-8 CPM
  - Conversions: $8-12 CPM

### Performance Benchmarks

**By Objective:**
- **Awareness:** 0.3-0.5% CTR, $3-5 CPM
- **Consideration:** 0.8-1.2% CTR, $5-8 CPM
- **Conversions:** 1.5-2.5% CTR, $8-12 CPM, $10-20 CPA

**By Industry:**
- **E-commerce/Retail:** High performers (2-3% CTR)
- **Home/Decor:** Exceptional engagement (3-5% save rate)
- **Fashion/Beauty:** Strong seasonal spikes
- **Food/Recipe:** Highest save rate (5-8%)

## Micro-Currency Conversion

Pinterest uses micro-currency for all monetary values:

```javascript
// Helper functions
function dollarToMicro(dollars) {
  return Math.round(dollars * 10_000_000);
}

function microToDollar(micro) {
  return micro / 10_000_000;
}

// Examples
dollarToMicro(1);     // 10,000,000
dollarToMicro(10);    // 100,000,000
dollarToMicro(0.25);  // 2,500,000

microToDollar(50_000_000);  // 5.0
```

**Common Values:**
- $1.00 = 10,000,000
- $5.00 = 50,000,000
- $10.00 = 100,000,000
- $0.20 = 2,000,000

## Cross-Platform Strategy

### Meta vs Pinterest: When to Use Each

**Use Meta Ads for:**
- ✅ Retargeting warm audiences (website visitors, cart abandoners)
- ✅ Lower-funnel conversion campaigns
- ✅ Dynamic product ads with catalog
- ✅ Video engagement and storytelling
- ✅ Lookalike audiences based on app users or web traffic

**Use Pinterest Ads for:**
- ✅ Cold traffic acquisition and discovery
- ✅ Seasonal campaigns (plan 45-60 days ahead)
- ✅ Shopping and catalog campaigns
- ✅ DIY, recipes, fashion, home decor, weddings
- ✅ Upper-funnel awareness with long content lifespan

**Budget Split Recommendation:**
- **Direct Response Focus:** 65% Meta, 35% Pinterest
- **Balanced Growth:** 55% Meta, 45% Pinterest
- **Awareness Focus:** 40% Meta, 60% Pinterest

### Creative Adaptation

**Meta Creative:**
- Square (1:1) or vertical (4:5) for feed
- Short-form video (15-30 sec)
- Lifestyle + product mix
- Social proof (user-generated content)

**Pinterest Creative:**
- Vertical (2:3) required
- Shorter video (6-15 sec)
- Inspirational, aspirational imagery
- Text overlays for context

## Troubleshooting

### Common Issues

**Issue:** Campaigns not spending
- ✅ Check bid is competitive (use `optimizePinterestBid`)
- ✅ Verify audience size is adequate (min 1,000 users)
- ✅ Ensure ad is approved (no policy violations)

**Issue:** High CPM, low CTR
- ✅ Improve creative relevance (test new pins)
- ✅ Refine targeting (use keyword targeting for search)
- ✅ Test different placements (Browse vs Search)

**Issue:** Low save rate
- ✅ Make pins more inspirational/aspirational
- ✅ Add clear value proposition in description
- ✅ Test seasonal/trending content

## API Rate Limits

Pinterest enforces the following limits:
- **10,000 requests/day** per access token
- **200 requests/minute**
- **10 requests/second**

The connector automatically handles rate limiting with exponential backoff.

## Resources

**Documentation:**
- [Pinterest Setup Guide](../connectors/PINTEREST_SETUP.md)
- [Pinterest API Reference](../connectors/PINTEREST_API_REFERENCE.md)
- [Official Pinterest API Docs](https://developers.pinterest.com/docs/api/v5/)

**Testing:**
- Run test suite: `node connectors/test-pinterest.js`
- Expected: 24/24 tests passing

**Support:**
- Pinterest Business Help: https://help.pinterest.com/en/business
- Pinterest Developer Community: https://developers.pinterest.com/community/

---

**Integration Status:** ✅ Complete

**Week 4 Deliverables:**
- ✅ Pinterest connector (1,350+ lines, 15 tools)
- ✅ Test suite (24 tests, 100% passing)
- ✅ Setup documentation (PINTEREST_SETUP.md)
- ✅ API reference (PINTEREST_API_REFERENCE.md)
- ✅ SocialMediaBuyer agent updated
- ✅ Integration guide (this document)
- ✅ Environment config updated

**What's Next:**
- Integrate Pinterest into cross-channel launch workflow
- Add Pinterest to campaign dashboards
- Create Pinterest-specific analytics reports
- Build automated bid optimization workflows
