# Meta Ads Connector - Setup Guide

## Overview

Production-ready Meta Ads (Facebook/Instagram) connector for the Ad Ops Command Center. Supports full campaign management, audience targeting, creative optimization, and performance reporting through the Meta Marketing API v22.0.

**Status:** ✅ Fully implemented with dual-mode operation (live API + sandbox)

## Features

### Campaign Management
- ✅ Create, update, and list campaigns
- ✅ Support for all objectives (OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_APP_PROMOTION, OUTCOME_SALES)
- ✅ Special ad category compliance (CREDIT, EMPLOYMENT, HOUSING, etc.)
- ✅ Multiple bid strategies (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP)

### Ad Set Management
- ✅ Create, update, and list ad sets
- ✅ Advanced targeting: demographics, interests, behaviors, custom audiences
- ✅ Geo-targeting (countries, regions, cities with radius)
- ✅ Placement targeting (Facebook, Instagram, Messenger, Audience Network)
- ✅ Daily or lifetime budgets
- ✅ Optimization goals (REACH, IMPRESSIONS, CLICKS, LINK_CLICKS, OFFSITE_CONVERSIONS, etc.)

### Ad Management
- ✅ Create, update, and list ads
- ✅ Link ads (image/video with CTA)
- ✅ Video ads with engagement tracking
- ✅ Advantage+ creative optimizations
- ✅ Multiple call-to-action types (LEARN_MORE, SHOP_NOW, SIGN_UP, etc.)

### Audiences
- ✅ List custom audiences
- ✅ Create custom audiences (CUSTOM, WEBSITE, ENGAGEMENT, LOOKALIKE)
- ✅ Lookalike audience creation with ratio control

### Reporting & Insights
- ✅ Account, campaign, ad set, and ad-level insights
- ✅ Comprehensive metrics (impressions, clicks, spend, CPM, CPC, CTR, conversions, etc.)
- ✅ Breakdowns by age, gender, placement, device, country, etc.
- ✅ Custom date ranges and presets
- ✅ Time-series reporting with time_increment

### Platform Features
- ✅ Cross-platform advertising (Facebook + Instagram + Audience Network + Messenger)
- ✅ Video performance metrics (25%, 50%, 75%, 100% completion)
- ✅ Social engagement tracking (likes, comments, shares)
- ✅ Conversion tracking (pixel events)

## Quick Start

### 1. Sandbox Mode (No Setup Required)

The connector works out-of-the-box in sandbox mode with realistic mock data:

```javascript
const meta = require('./connectors/meta-ads.js');

// Get campaigns (returns mock data)
const result = await meta.handleToolCall('meta_ads_get_campaigns', {
  effective_status: ['ACTIVE']
});

console.log(result);
// Returns 2 active campaigns with full metrics
```

### 2. Live API Setup

To connect to real Meta Ads accounts:

#### Step 1: Create a Meta Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Business** type
4. Fill in app details (name, contact email)
5. Click **Create App**

#### Step 2: Add Marketing API

1. In your app dashboard, click **Add Product**
2. Find **Marketing API** and click **Set Up**
3. Follow the setup wizard

#### Step 3: Get Credentials

1. **App ID & Secret:**
   - Go to **Settings** → **Basic**
   - Copy **App ID** and **App Secret**

2. **Access Token:**
   - Go to **Tools** → **Graph API Explorer**
   - Select your app from dropdown
   - Add permissions:
     - `ads_management`
     - `ads_read`
     - `read_insights`
   - Click **Generate Access Token**
   - **Important:** Convert to long-lived token (60 days):
     ```bash
     curl -i -X GET "https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
     ```

3. **Ad Account ID:**
   - Go to [Meta Ads Manager](https://business.facebook.com/adsmanager/)
   - Click **Settings** → **Ad Accounts**
   - Copy your ad account ID (format: `act_XXXXXXXXXX`)
   - Or use the connector to list all accounts:
     ```javascript
     await meta.handleToolCall('meta_ads_get_ad_accounts', {});
     ```

#### Step 4: Configure Environment

Edit `config/.env`:

```env
# Meta Ads Configuration
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_ACCESS_TOKEN=your_long_lived_access_token
META_AD_ACCOUNT_ID=act_XXXXXXXXXX
```

#### Step 5: Test Connection

```javascript
const meta = require('./connectors/meta-ads.js');

const test = await meta.testConnection();
console.log(test);
// Should return: { connected: true, account: {...}, lastSync: '...' }
```

## Testing with Meta Test Accounts

Meta provides **test ad accounts** for safe testing without spending real money:

### Create Test Ad Account

1. Go to [Business Settings](https://business.facebook.com/settings/)
2. Navigate to **Data Sources** → **Ad Accounts**
3. Click **Add** → **Create a Test Ad Account**
4. Give it a name (e.g., "Sandbox Testing")
5. Click **Create Test Ad Account**

### Test Account Features

- ✅ Full API access with all features
- ✅ No real ad delivery (safe testing)
- ✅ No billing/charges
- ✅ Realistic data structures
- ⚠️ Some limitations:
  - Cannot run live campaigns
  - Insights may be simulated
  - Cannot access real audiences

### Using Test Account

```javascript
// Use test account ID in your .env
META_AD_ACCOUNT_ID=act_TESTACCOUNTID

// Create test campaigns safely
await meta.handleToolCall('meta_ads_create_campaign', {
  name: 'Test Campaign - DO NOT RUN',
  objective: 'OUTCOME_TRAFFIC',
  status: 'PAUSED'  // Always start PAUSED for safety
});
```

## Tool Reference

### 13 Available Tools

1. **meta_ads_get_campaigns** - List campaigns with metrics
2. **meta_ads_create_campaign** - Create new campaign
3. **meta_ads_update_campaign** - Update campaign settings
4. **meta_ads_get_ad_sets** - List ad sets with targeting
5. **meta_ads_create_ad_set** - Create ad set with targeting
6. **meta_ads_update_ad_set** - Update ad set settings
7. **meta_ads_get_ads** - List ads with creative
8. **meta_ads_create_ad** - Create ad with creative
9. **meta_ads_update_ad** - Update ad settings
10. **meta_ads_get_insights** - Get performance insights
11. **meta_ads_get_audiences** - List custom audiences
12. **meta_ads_create_audience** - Create custom/lookalike audience
13. **meta_ads_get_ad_accounts** - List accessible ad accounts

### Example Usage

#### Get Active Campaigns

```javascript
await meta.handleToolCall('meta_ads_get_campaigns', {
  effective_status: ['ACTIVE'],
  date_preset: 'last_30_days',
  limit: 50
});
```

#### Create Campaign

```javascript
await meta.handleToolCall('meta_ads_create_campaign', {
  name: 'Q1 2026 - Lead Generation',
  objective: 'OUTCOME_LEADS',
  status: 'PAUSED',
  special_ad_categories: [],
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
});
```

#### Create Ad Set with Targeting

```javascript
await meta.handleToolCall('meta_ads_create_ad_set', {
  campaign_id: '120330000000001',
  name: 'US Tech Professionals 25-45',
  daily_budget: 10000,  // $100 in cents
  billing_event: 'IMPRESSIONS',
  optimization_goal: 'LINK_CLICKS',
  targeting: {
    age_min: 25,
    age_max: 45,
    genders: [1, 2],  // All genders
    geo_locations: {
      countries: ['US']
    },
    interests: [
      { id: '6003020834693', name: 'Technology' },
      { id: '6003348108155', name: 'Artificial intelligence' }
    ],
    publisher_platforms: ['facebook', 'instagram']
  },
  status: 'PAUSED'
});
```

#### Create Link Ad

```javascript
await meta.handleToolCall('meta_ads_create_ad', {
  ad_set_id: '120330000000101',
  name: 'Lead Gen - Free Trial Offer',
  creative: {
    object_story_spec: {
      page_id: 'YOUR_FACEBOOK_PAGE_ID',
      link_data: {
        link: 'https://example.com/signup',
        message: 'Transform your workflow with AI. Start your free trial today!',
        name: 'Start Free Trial - No Credit Card Required',
        description: 'Join 10,000+ professionals using AI to save 10+ hours per week.',
        call_to_action: {
          type: 'SIGN_UP'
        },
        image_hash: 'uploaded_image_hash_here'
      }
    }
  },
  status: 'PAUSED'
});
```

#### Get Insights with Breakdowns

```javascript
await meta.handleToolCall('meta_ads_get_insights', {
  level: 'campaign',
  object_id: '120330000000001',
  fields: ['impressions', 'clicks', 'spend', 'cpm', 'cpc', 'ctr', 'actions', 'cost_per_action_type'],
  date_preset: 'last_7_days',
  breakdowns: ['age', 'gender', 'placement'],
  time_increment: '1'  // Daily breakdown
});
```

#### Create Lookalike Audience

```javascript
await meta.handleToolCall('meta_ads_create_audience', {
  name: 'Lookalike - Purchasers 1%',
  subtype: 'LOOKALIKE',
  origin_audience_id: '120330000000201',  // Source audience
  lookalike_spec: {
    type: 'SIMILARITY',
    ratio: 0.01,  // 1%
    country: 'US'
  }
});
```

## Architecture

### Dual-Mode Operation

```javascript
// Automatically detects mode based on credentials
const hasMetaAds = !!(accessToken && adAccountId);

if (hasMetaAds) {
  // Live API mode - makes real requests
  return await apiRequest(`/${adAccountId}/campaigns`, { params });
} else {
  // Sandbox mode - returns mock data
  return handleSandboxToolCall(toolName, params);
}
```

### Error Handling

- ✅ Rate limit detection (HTTP 429, code 80004)
- ✅ Token expiration handling (HTTP 401, code 190)
- ✅ Helpful error messages with actionable guidance
- ✅ Validation of required parameters

### Rate Limiting

Meta enforces rate limits per app and per ad account:
- **Ad Account:** ~200 calls per hour per account (varies by tier)
- **App:** Varies by app usage tier
- **Best Practice:** Batch requests, cache results, respect `retry-after` header

The connector automatically detects rate limits and provides retry guidance.

## Common Issues & Solutions

### Issue: "Invalid OAuth access token"

**Solution:**
- Token expired (60 days for long-lived tokens)
- Refresh your token using the exchange endpoint
- Or generate a new long-lived token

### Issue: "Insufficient permissions"

**Solution:**
- Token missing required permissions
- Regenerate token with `ads_management`, `ads_read`, `read_insights`
- Check app review status if using advanced permissions

### Issue: "Invalid parameter"

**Solution:**
- Check parameter names match Meta API specs exactly
- Ensure required fields are present (e.g., `geo_locations` for targeting)
- Budget values must be strings in cents
- Dates must be ISO 8601 format

### Issue: Rate limit exceeded

**Solution:**
- Wait for `retry-after` seconds before retrying
- Reduce request frequency
- Use batch requests where possible
- Consider upgrading app tier

## API Comparison: Meta vs Google Ads

| Feature | Meta Ads | Google Ads |
|---------|----------|------------|
| **API Type** | REST (JSON) | REST (JSON) |
| **Auth** | Long-lived tokens | OAuth2 refresh tokens |
| **Token Expiry** | 60 days | Automatic refresh |
| **Hierarchy** | Campaign → Ad Set → Ad | Campaign → Ad Group → Ad |
| **Objectives** | 6 outcome-based | Multiple channel-based |
| **Targeting** | Rich social/demo | Intent + keywords |
| **Placements** | FB/IG/AN/Messenger | Search/Display/Video/Shopping |
| **Creative** | Image/Video/Carousel | Text/Image/Responsive |
| **Best For** | Brand awareness, social | Search intent, conversions |

## Production Checklist

Before deploying to production:

- [ ] Set up long-lived access token (60-day expiry)
- [ ] Configure token refresh alerts (e.g., 50 days)
- [ ] Test with Meta test ad account first
- [ ] Set all new campaigns/ad sets to `PAUSED` by default
- [ ] Implement spend caps on ad accounts
- [ ] Monitor rate limits (log API response headers)
- [ ] Set up error alerting (token expiry, rate limits)
- [ ] Document your app's permissions and use case
- [ ] Consider Meta Business Manager for team access
- [ ] Review Meta's advertising policies for your industry

## Resources

- **Meta Marketing API Docs:** https://developers.facebook.com/docs/marketing-apis
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
- **Meta Business Help Center:** https://www.facebook.com/business/help
- **Ad Account Testing:** https://www.facebook.com/business/help/375461009833828
- **Rate Limits:** https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
- **Targeting Specs:** https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-specs

## Support

For issues or questions:
1. Check sandbox mode first (works without credentials)
2. Review Meta's error codes: https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling
3. Use Meta's support channels for API-specific issues
4. File issues in this repo for connector bugs

---

**Connector Version:** 1.0.0  
**API Version:** v22.0  
**Last Updated:** 2026-02-10
