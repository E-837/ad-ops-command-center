# Microsoft Advertising API Reference

Complete reference for all 15 MCP tools in the Microsoft Ads connector.

## Table of Contents

1. [Account Management](#account-management)
2. [Campaign Operations](#campaign-operations)
3. [Ad Group Operations](#ad-group-operations)
4. [Keyword Operations](#keyword-operations)
5. [Negative Keywords](#negative-keywords)
6. [Ad Operations](#ad-operations)
7. [Extensions](#extensions)
8. [Performance Reporting](#performance-reporting)

---

## Account Management

### microsoft_ads_get_accounts

List all Microsoft Advertising accounts accessible to the authenticated user.

**Parameters:**
```json
{
  "include_metrics": false  // Optional: Include account-level metrics
}
```

**Response:**
```json
{
  "Accounts": [
    {
      "Id": "123456789",
      "Name": "My Advertising Account",
      "Number": "X12345678",
      "AccountLifeCycleStatus": "Active",
      "PauseReason": null,
      "Language": "English",
      "TimeZone": "EasternTimeUSCanada",
      "CurrencyCode": "USD"
    }
  ]
}
```

**Use Cases:**
- List all accounts before campaign operations
- Verify account access and status
- Switch between multiple accounts (agency use)

---

## Campaign Operations

### microsoft_ads_get_campaigns

List campaigns with optional filters and performance metrics.

**Parameters:**
```json
{
  "status": ["Active", "Paused"],     // Optional: Filter by status
  "campaign_type": "Search",          // Optional: Filter by type
  "include_metrics": true             // Optional: Include performance data
}
```

**Campaign Types:**
- `Search` - Bing search network
- `Audience` - Microsoft Audience Network (native ads)
- `Shopping` - Product/catalog ads
- `PerformanceMax` - Multi-channel automated

**Response:**
```json
{
  "Campaigns": [
    {
      "Id": 1234567890,
      "Name": "Winter Sale - Search Campaign",
      "CampaignType": "Search",
      "Status": "Active",
      "BudgetType": "DailyBudgetStandard",
      "DailyBudget": 100.00,
      "TimeZone": "EasternTimeUSCanada",
      "Languages": ["English"],
      "StartDate": "2026-02-01",
      "EndDate": "2026-03-31",
      "CreatedTime": "2026-01-25T10:00:00Z",
      "LastModifiedTime": "2026-02-10T15:30:00Z",
      "Performance": {
        "Impressions": 95000,
        "Clicks": 2375,
        "Spend": 5937.50,
        "CTR": 2.5,
        "AverageCpc": 2.50,
        "Conversions": 119,
        "ConversionRate": 5.0,
        "CostPerConversion": 49.90,
        "Revenue": 23750.00,
        "ROAS": 4.0
      }
    }
  ],
  "TotalCount": 1
}
```

---

### microsoft_ads_create_campaign

Create a new Microsoft Advertising campaign.

**Parameters:**
```json
{
  "name": "Spring Collection 2026",
  "campaign_type": "Search",
  "budget_type": "DailyBudgetStandard",
  "daily_budget": 75.00,
  "status": "Paused",
  "start_date": "2026-03-01",
  "end_date": "2026-04-30",
  "time_zone": "PacificTimeUSCanada",
  "languages": ["English", "Spanish"]
}
```

**Required Fields:**
- `name` - Campaign name (max 128 chars)
- `daily_budget` - Daily spend limit in account currency

**Optional Fields:**
- `campaign_type` - Default: `Search`
- `budget_type` - Default: `DailyBudgetStandard`
- `status` - Default: `Paused` (safer for new campaigns)
- `start_date` - Default: today
- `end_date` - Default: null (no end date)
- `time_zone` - Default: account time zone
- `languages` - Default: `["English"]`

**Budget Types:**
- `DailyBudgetStandard` - Spend evenly throughout the day
- `DailyBudgetAccelerated` - Spend as fast as possible (show ads more)

**Response:**
```json
{
  "Success": true,
  "Campaign": {
    "Id": 1234567893,
    "Name": "Spring Collection 2026",
    "CampaignType": "Search",
    "Status": "Paused",
    "DailyBudget": 75.00,
    "CreatedTime": "2026-02-11T20:15:00Z"
  }
}
```

---

### microsoft_ads_update_campaign

Update an existing campaign (status, budget, name).

**Parameters:**
```json
{
  "campaign_id": "1234567890",
  "name": "Winter Sale - EXTENDED",
  "status": "Active",
  "daily_budget": 150.00,
  "budget_type": "DailyBudgetAccelerated"
}
```

**Required:**
- `campaign_id` - ID of campaign to update

**Optional (update any combination):**
- `name` - New campaign name
- `status` - `Active`, `Paused`, or `Deleted`
- `daily_budget` - New daily budget
- `budget_type` - Change budget delivery method

**Response:**
```json
{
  "Success": true,
  "Message": "Campaign updated successfully"
}
```

**Notes:**
- Deleted campaigns cannot be reactivated
- Budget changes take effect immediately
- Status changes may take 1-2 hours for full propagation

---

## Ad Group Operations

### microsoft_ads_get_ad_groups

List ad groups within campaigns.

**Parameters:**
```json
{
  "campaign_id": "1234567890",      // Optional: Filter by campaign
  "status": ["Active"],             // Optional: Filter by status
  "include_metrics": true           // Optional: Include performance
}
```

**Response:**
```json
{
  "AdGroups": [
    {
      "Id": 9876543210,
      "CampaignId": 1234567890,
      "Name": "Winter Coats - Exact Match",
      "Status": "Active",
      "Language": "English",
      "Network": "OwnedAndOperatedAndSyndicatedSearch",
      "PricingModel": "Cpc",
      "SearchBid": { "Amount": 2.50 },
      "StartDate": "2026-02-01",
      "EndDate": "2026-03-31"
    }
  ],
  "TotalCount": 1
}
```

**Network Options:**
- `OwnedAndOperatedAndSyndicatedSearch` - Bing + partner sites (recommended)
- `OwnedAndOperatedOnly` - Bing.com only
- `SyndicatedSearchOnly` - Partner sites only

---

### microsoft_ads_create_ad_group

Create a new ad group within a campaign.

**Parameters:**
```json
{
  "campaign_id": "1234567890",
  "name": "Premium Coats - Phrase Match",
  "cpc_bid": 3.00,
  "status": "Paused",
  "language": "English",
  "network": "OwnedAndOperatedAndSyndicatedSearch",
  "start_date": "2026-02-15",
  "end_date": "2026-03-31"
}
```

**Required:**
- `campaign_id` - Parent campaign
- `name` - Ad group name (max 128 chars)
- `cpc_bid` - Default CPC bid for keywords

**Optional:**
- `status` - Default: `Paused`
- `language` - Default: `English`
- `network` - Default: `OwnedAndOperatedAndSyndicatedSearch`
- `start_date` - Default: campaign start date
- `end_date` - Default: campaign end date

**Best Practices:**
- Group similar keywords together
- Use specific names (include match type)
- Start with phrase/exact match ad groups
- Set competitive bids based on keyword research

**Response:**
```json
{
  "Success": true,
  "AdGroup": {
    "Id": 9876543214,
    "CampaignId": 1234567890,
    "Name": "Premium Coats - Phrase Match",
    "SearchBid": { "Amount": 3.00 },
    "Status": "Paused"
  }
}
```

---

### microsoft_ads_update_ad_group

Update an existing ad group.

**Parameters:**
```json
{
  "ad_group_id": "9876543210",
  "name": "Winter Coats - Exact Match (High Performers)",
  "status": "Active",
  "cpc_bid": 2.75
}
```

**Required:**
- `ad_group_id` - ID of ad group to update

**Optional:**
- `name` - New ad group name
- `status` - `Active`, `Paused`, or `Deleted`
- `cpc_bid` - New default bid (affects keywords without specific bids)

**Response:**
```json
{
  "Success": true,
  "Message": "Ad group updated successfully"
}
```

---

## Keyword Operations

### microsoft_ads_get_keywords

List keywords with performance data and quality scores.

**Parameters:**
```json
{
  "ad_group_id": "9876543210",     // Optional: Filter by ad group
  "campaign_id": "1234567890",     // Optional: Filter by campaign
  "match_type": "Exact",           // Optional: Filter by match type
  "status": ["Active"],            // Optional: Filter by status
  "include_metrics": true          // Optional: Performance data
}
```

**Match Types:**
- `Exact` - [winter coats] - Exact match only
- `Phrase` - "winter coats" - Phrase and close variations
- `Broad` - winter coats - Broad match (less control)

**Response:**
```json
{
  "Keywords": [
    {
      "Id": 1111111111,
      "AdGroupId": 9876543210,
      "Text": "winter coats",
      "MatchType": "Exact",
      "Bid": { "Amount": 2.50 },
      "Status": "Active",
      "QualityScore": 8,
      "DestinationUrl": "https://example.com/winter-coats"
    }
  ],
  "TotalCount": 1
}
```

**Quality Score:** 1-10 scale
- **10-8**: Excellent - Keyword highly relevant
- **7-5**: Good - Some improvements possible
- **4-1**: Poor - Major relevance issues

---

### microsoft_ads_create_keyword

Add a keyword to an ad group.

**Parameters:**
```json
{
  "ad_group_id": "9876543210",
  "text": "premium winter coats",
  "match_type": "Exact",
  "bid": 3.50,
  "status": "Active",
  "destination_url": "https://example.com/premium-coats"
}
```

**Required:**
- `ad_group_id` - Ad group to add keyword to
- `text` - Keyword text (do NOT include match type symbols)
- `match_type` - `Exact`, `Phrase`, or `Broad`

**Optional:**
- `bid` - Keyword-specific bid (overrides ad group default)
- `status` - Default: `Active`
- `destination_url` - Keyword-specific landing page

**Match Type Examples:**
```javascript
// Correct
{ text: "winter coats", match_type: "Exact" }
{ text: "winter coats", match_type: "Phrase" }
{ text: "winter coats", match_type: "Broad" }

// Wrong - don't include symbols
{ text: "[winter coats]", match_type: "Exact" }  // ❌
{ text: '"winter coats"', match_type: "Phrase" } // ❌
```

**Response:**
```json
{
  "Success": true,
  "Keyword": {
    "Id": 1111111119,
    "AdGroupId": 9876543210,
    "Text": "premium winter coats",
    "MatchType": "Exact",
    "Bid": { "Amount": 3.50 },
    "Status": "Active",
    "QualityScore": 7
  }
}
```

**Best Practices:**
- Start with exact and phrase match
- Use broad match sparingly (high waste potential)
- Set competitive bids for high-intent keywords
- Monitor quality score and optimize landing pages
- Use keyword-specific URLs for better relevance

---

### microsoft_ads_update_keyword

Update keyword bid, status, or destination URL.

**Parameters:**
```json
{
  "keyword_id": "1111111111",
  "status": "Active",
  "bid": 2.75,
  "destination_url": "https://example.com/winter-coats-sale"
}
```

**Required:**
- `keyword_id` - Keyword to update

**Optional:**
- `status` - `Active`, `Paused`, or `Deleted`
- `bid` - New bid amount
- `destination_url` - New landing page

**Response:**
```json
{
  "Success": true,
  "Message": "Keyword updated successfully"
}
```

**Bid Optimization Tips:**
- Increase bids for high QS, low avg position keywords
- Decrease bids for low-converting keywords
- Monitor CPA and adjust accordingly
- Use bid adjustments for devices/locations

---

## Negative Keywords

### microsoft_ads_get_negative_keywords

List negative keywords (exclusions) at campaign or ad group level.

**Parameters:**
```json
{
  "campaign_id": "1234567890",    // Campaign-level negatives
  "ad_group_id": "9876543210"     // OR ad-group-level negatives
}
```

**Response:**
```json
{
  "NegativeKeywords": [
    {
      "Id": 3333333331,
      "CampaignId": 1234567890,
      "Text": "cheap",
      "MatchType": "Exact"
    },
    {
      "Id": 3333333332,
      "CampaignId": 1234567890,
      "Text": "free",
      "MatchType": "Phrase"
    }
  ],
  "TotalCount": 2
}
```

---

### microsoft_ads_add_negative_keyword

Add a negative keyword to exclude unwanted traffic.

**Parameters:**
```json
{
  "campaign_id": "1234567890",     // Campaign-level (OR)
  "ad_group_id": "9876543210",     // Ad-group-level
  "text": "discount",
  "match_type": "Phrase"
}
```

**Required:**
- `text` - Negative keyword text
- `match_type` - `Exact` or `Phrase` (Broad not supported for negatives)
- Either `campaign_id` OR `ad_group_id`

**Common Negative Keywords:**
- **Quality filters**: cheap, free, discount, coupon
- **DIY/used**: used, refurbished, repair, diy
- **Job seekers**: jobs, career, salary, hiring
- **Wrong intent**: reviews, comparison, vs, alternative

**Response:**
```json
{
  "Success": true,
  "NegativeKeyword": {
    "Id": 3333333334,
    "CampaignId": 1234567890,
    "Text": "discount",
    "MatchType": "Phrase"
  }
}
```

**Best Practices:**
- Review search query reports weekly
- Add irrelevant queries as negatives
- Use campaign-level negatives for broad exclusions
- Use ad-group-level for specific targeting

---

## Ad Operations

### microsoft_ads_get_ads

List ads within ad groups.

**Parameters:**
```json
{
  "ad_group_id": "9876543210",     // Optional: Filter by ad group
  "campaign_id": "1234567890",     // Optional: Filter by campaign
  "ad_type": "ResponsiveSearch",   // Optional: Filter by type
  "status": ["Active"],            // Optional: Filter by status
  "include_metrics": true          // Optional: Performance data
}
```

**Ad Types:**
- `ResponsiveSearch` - Responsive Search Ads (RSA) - **Recommended**
- `ExpandedText` - Expanded Text Ads (ETA) - Legacy format

**Response:**
```json
{
  "Ads": [
    {
      "Id": 2222222222,
      "AdGroupId": 9876543210,
      "Type": "ResponsiveSearch",
      "Status": "Active",
      "Headlines": [
        { "Text": "Winter Coats On Sale", "PinningPosition": null },
        { "Text": "Free Shipping Available", "PinningPosition": null },
        { "Text": "Shop Now & Save Up To 40%", "PinningPosition": null }
      ],
      "Descriptions": [
        { "Text": "Browse our collection of warm winter coats. All sizes available with free returns." },
        { "Text": "Premium quality at affordable prices. Limited time winter sale. Order today!" }
      ],
      "Path1": "winter",
      "Path2": "coats",
      "FinalUrls": ["https://example.com/winter-coats"],
      "TrackingTemplate": null
    }
  ],
  "TotalCount": 1
}
```

---

### microsoft_ads_create_ad

Create a new Responsive Search Ad (RSA) or Expanded Text Ad.

**Responsive Search Ad (Recommended):**
```json
{
  "ad_group_id": "9876543210",
  "ad_type": "ResponsiveSearch",
  "headlines": [
    "Winter Coats On Sale",
    "Free Shipping Available",
    "Shop Now & Save",
    "Premium Quality Winter Wear"
  ],
  "descriptions": [
    "Browse our collection of warm winter coats. All sizes available.",
    "Premium quality at affordable prices. Limited time offer!"
  ],
  "path1": "winter",
  "path2": "coats",
  "final_urls": ["https://example.com/winter-coats"],
  "status": "Paused"
}
```

**RSA Requirements:**
- **Headlines**: 3-15 headlines, max 30 characters each
- **Descriptions**: 2-4 descriptions, max 90 characters each
- **Paths**: Optional display paths (max 15 chars each)
- **URLs**: At least one final URL required

**Expanded Text Ad (Legacy):**
```json
{
  "ad_group_id": "9876543210",
  "ad_type": "ExpandedText",
  "headlines": [
    "Winter Clearance Sale",
    "Up To 50% Off",
    "Shop Now"
  ],
  "descriptions": [
    "Limited time winter clearance event. Huge savings on coats.",
    "Quality brands at clearance prices. Free shipping $50+."
  ],
  "path1": "sale",
  "path2": "winter",
  "final_urls": ["https://example.com/sale"],
  "status": "Paused"
}
```

**Response:**
```json
{
  "Success": true,
  "Ad": {
    "Id": 2222222226,
    "AdGroupId": 9876543210,
    "Type": "ResponsiveSearch",
    "Status": "Paused",
    "Headlines": [...],
    "Descriptions": [...]
  }
}
```

**RSA Best Practices:**
- Use 10-15 unique headlines (more = better)
- Include your main keyword in 2-3 headlines
- Add calls-to-action ("Shop Now", "Learn More")
- Use headline pinning sparingly (limits combinations)
- Include offers/benefits in descriptions
- Test different messaging angles

---

### microsoft_ads_update_ad

Update ad status (only status can be changed - create new ad for copy changes).

**Parameters:**
```json
{
  "ad_id": "2222222222",
  "status": "Active"
}
```

**Required:**
- `ad_id` - Ad to update
- `status` - `Active`, `Paused`, or `Deleted`

**Response:**
```json
{
  "Success": true,
  "Message": "Ad updated successfully"
}
```

**Note:** To change ad copy, create a new ad. Microsoft Ads doesn't allow editing ad text after creation.

---

## Extensions

### microsoft_ads_get_extensions

List ad extensions (sitelinks, callouts, structured snippets, etc.).

**Parameters:**
```json
{
  "extension_type": "Sitelink",     // Optional: Filter by type
  "campaign_id": "1234567890",      // Optional: Filter by campaign
  "status": ["Active"]              // Optional: Filter by status
}
```

**Extension Types:**
- `Sitelink` - Additional links below ad
- `Callout` - Short text callouts
- `StructuredSnippet` - Categorized lists
- `Call` - Phone number
- `Location` - Business address
- `Price` - Product pricing
- `App` - Mobile app download
- `Image` - Image extensions

**Response:**
```json
{
  "Extensions": [
    {
      "Id": 4444444441,
      "Type": "Sitelink",
      "Status": "Active",
      "Text": "Winter Sale",
      "Description1": "Up to 40% off",
      "Description2": "Limited time offer",
      "FinalUrls": ["https://example.com/winter-sale"]
    },
    {
      "Id": 4444444443,
      "Type": "Callout",
      "Status": "Active",
      "Text": "24/7 Customer Support"
    }
  ],
  "TotalCount": 2
}
```

**Extension Benefits:**
- **Sitelinks**: Increase ad size, provide direct navigation
- **Callouts**: Highlight key benefits/features
- **Structured Snippets**: Show product/service categories
- **Location**: Drive foot traffic to physical stores
- **Call**: Enable click-to-call on mobile

---

## Performance Reporting

### microsoft_ads_get_performance_report

Get performance metrics for campaigns, ad groups, keywords, or ads.

**Campaign Level Report:**
```json
{
  "report_level": "Campaign",
  "date_range": "Last30Days",
  "campaign_ids": ["1234567890"],
  "metrics": ["Impressions", "Clicks", "Spend", "Conversions", "ROAS"]
}
```

**Keyword Level Report:**
```json
{
  "report_level": "Keyword",
  "date_range": "Custom",
  "start_date": "2026-02-01",
  "end_date": "2026-02-10",
  "metrics": ["Impressions", "Clicks", "CTR", "AverageCpc", "QualityScore"]
}
```

**Report Levels:**
- `Account` - Account-level aggregation
- `Campaign` - Per-campaign performance
- `AdGroup` - Per-ad-group performance
- `Keyword` - Per-keyword performance (most detailed)
- `Ad` - Per-ad performance

**Date Ranges:**
- `Today` - Today's data (partial day)
- `Yesterday` - Previous day
- `Last7Days` - Past week
- `Last14Days` - Past 2 weeks
- `Last30Days` - Past month
- `Last90Days` - Past quarter
- `ThisMonth` - Current month to date
- `LastMonth` - Previous full month
- `Custom` - Specify start_date and end_date

**Available Metrics:**
- `Impressions` - Number of times ad shown
- `Clicks` - Number of clicks
- `Spend` - Total spend in account currency
- `CTR` - Click-through rate (%)
- `AverageCpc` - Average cost per click
- `Conversions` - Total conversions
- `ConversionRate` - Conversion rate (%)
- `CostPerConversion` - Cost per conversion
- `Revenue` - Total revenue (requires conversion tracking)
- `ROAS` - Return on ad spend (Revenue / Spend)
- `QualityScore` - Keyword quality score (1-10)

**Response:**
```json
{
  "ReportData": [
    {
      "CampaignId": 1234567890,
      "CampaignName": "Winter Sale - Search Campaign",
      "Impressions": 95000,
      "Clicks": 2375,
      "Spend": 5937.50,
      "CTR": 2.5,
      "AverageCpc": 2.50,
      "Conversions": 119,
      "ConversionRate": 5.0,
      "CostPerConversion": 49.90,
      "Revenue": 23750.00,
      "ROAS": 4.0
    }
  ],
  "TotalRows": 1
}
```

**Best Practices:**
- Pull reports daily for real-time optimization
- Focus on ROAS for e-commerce campaigns
- Monitor CTR and quality score for relevance
- Track conversions and CPA for lead gen
- Use keyword-level reports to identify winners/losers

---

## Rate Limits

Microsoft Advertising API limits:
- **Developer Token**: 5,000 requests/month
- **Production Token**: 1,000,000 requests/month

The connector automatically handles rate limiting with exponential backoff.

---

## Error Handling

All tools return consistent error responses:

```json
{
  "success": false,
  "error": "Invalid campaign ID: Campaign not found"
}
```

Common errors:
- `Invalid credentials` - Check OAuth tokens
- `Developer token not approved` - Apply for production token
- `Account not found` - Verify account ID
- `Insufficient permissions` - Check API permissions in Azure AD
- `Rate limit exceeded` - Wait and retry
- `Invalid parameter` - Check parameter format/values

---

## Sandbox Mode

Without credentials, the connector operates in sandbox mode:
- Returns realistic mock data
- All operations succeed
- No API calls made
- Perfect for testing and development

Configure environment variables (see MICROSOFT_ADS_SETUP.md) for live API access.

---

## Next Steps

1. **Test Tools**: Run `node connectors/test-microsoft-ads.js`
2. **Create Campaign**: Use `microsoft_ads_create_campaign`
3. **Add Keywords**: Build out ad groups with targeted keywords
4. **Launch Ads**: Create Responsive Search Ads
5. **Monitor Performance**: Pull regular reports
6. **Optimize**: Adjust bids based on performance data

Happy advertising! 🚀
