# Microsoft Advertising Integration Guide

Complete guide to using the Microsoft Ads connector in Ad Ops Command.

## Overview

The Microsoft Advertising (formerly Bing Ads) integration provides full campaign management capabilities for the Bing search network and Microsoft Audience Network. When combined with Google Ads, you can reach 95%+ of the search market.

## Why Microsoft Advertising?

### Market Share
- **10-15% of US search market** (higher in specific verticals)
- **33% of desktop searches** in the US
- **Bing powers:** Bing.com, Yahoo, DuckDuckGo, AOL
- **Microsoft properties:** MSN, Outlook.com, Microsoft Edge

### Cost Advantages
- **30-50% lower CPCs** than Google on average
- **Less competition** for most keywords
- **Better value** for test budgets

### Audience Demographics
- **Older:** 35-65 age range (vs 25-45 for Google)
- **More affluent:** Higher household income
- **Desktop-heavy:** 60-70% desktop traffic
- **Professional:** Strong LinkedIn integration for B2B

### When to Use Bing
✅ **Excellent for:**
- B2B/enterprise products (LinkedIn targeting)
- High-ticket items ($500+ average order value)
- Desktop-focused services
- Older demographic targeting
- Testing campaigns with lower budgets

⚠️ **Less effective for:**
- Mobile-first products
- Younger demographics (18-24)
- Very niche/low-volume keywords
- Local "near me" searches

## Integration Features

### 15 MCP Tools
1. **Account Management**
   - `microsoft_ads_get_accounts` - List accounts

2. **Campaign Operations**
   - `microsoft_ads_get_campaigns` - List campaigns
   - `microsoft_ads_create_campaign` - Create campaign
   - `microsoft_ads_update_campaign` - Update campaign

3. **Ad Group Operations**
   - `microsoft_ads_get_ad_groups` - List ad groups
   - `microsoft_ads_create_ad_group` - Create ad group
   - `microsoft_ads_update_ad_group` - Update ad group

4. **Keyword Operations**
   - `microsoft_ads_get_keywords` - List keywords
   - `microsoft_ads_create_keyword` - Add keyword
   - `microsoft_ads_update_keyword` - Update keyword
   - `microsoft_ads_get_negative_keywords` - List negatives
   - `microsoft_ads_add_negative_keyword` - Add negative

5. **Ad Operations**
   - `microsoft_ads_get_ads` - List ads
   - `microsoft_ads_create_ad` - Create RSA/ETA
   - `microsoft_ads_update_ad` - Update ad status

6. **Extensions & Reporting**
   - `microsoft_ads_get_extensions` - List extensions
   - `microsoft_ads_get_performance_report` - Performance data

### Dual-Mode Operation
- **Sandbox Mode:** Works without credentials, returns realistic mock data
- **Live Mode:** Full API integration with Microsoft Advertising

### SearchMarketer Agent Integration
The SearchMarketer agent now supports cross-platform search:
- Google + Bing campaign planning
- Platform-specific keyword optimization
- Budget allocation recommendations
- Cross-platform performance comparison

## Quick Start

### 1. Setup Credentials
Follow `connectors/MICROSOFT_ADS_SETUP.md` for:
- Azure AD app registration
- Developer token application
- OAuth2 authorization flow
- Environment variable configuration

### 2. Test Connection
```bash
node connectors/test-microsoft-ads.js
```

Expected: **25/25 tests passing** (sandbox mode)

### 3. Launch Your First Campaign

#### Option A: Bing-Only Campaign
```javascript
// Use the Bing Search Campaign template
{
  "template": "bing-search-campaign",
  "productName": "Enterprise CRM Software",
  "budget": 75,  // Start with 30-50% of Google budget
  "campaignType": "Search",
  "linkedInTargeting": true  // For B2B
}
```

#### Option B: Cross-Platform Campaign
```javascript
// Use the Cross-Platform Search template
{
  "template": "cross-search-campaign",
  "productName": "Cloud Analytics Platform",
  "totalBudget": 200,
  "budgetAllocation": "standard",  // 80% Google / 20% Bing
  "autoOptimize": true  // Adjust split based on performance
}
```

### 4. Monitor Performance
```javascript
// Get performance report
const report = await handleToolCall('microsoft_ads_get_performance_report', {
  report_level: 'Campaign',
  date_range: 'Last30Days'
});

// Compare with Google
const comparison = compareSearchPlatforms(googleData, bingData);
console.log(comparison.summary);
```

## Best Practices

### Budget Allocation

**Initial Split (No Historical Data):**
- **Standard:** 80% Google / 20% Bing
- **B2B:** 70% Google / 30% Bing
- **E-commerce:** 85% Google / 15% Bing

**After 14+ Days (With Data):**
- Compare ROAS between platforms
- Shift budget to higher-performing platform
- Maintain minimum 10% on each platform for testing

### Keyword Strategy

**Import from Google:**
```javascript
// Adapt Google keywords for Bing
const bingKeywords = adaptKeywordsForBing(googleKeywords);

// Typical adjustments:
// - Reduce bids 30-40%
// - Increase B2B keywords +20%
// - Reduce mobile-focused keywords -20%
```

**Match Types:**
- Start with **Exact** and **Phrase** match
- Use **Broad** cautiously (Bing has less sophisticated matching)
- Add negatives more aggressively than Google

**Bing-Specific Negatives:**
```
Common to add:
- "bing" (avoid traffic searching for the engine)
- "search engine"
- "toolbar"
- "wallpaper" (irrelevant image searches)
```

### Ad Copy

**Google vs Bing Differences:**

**Google (Mobile-First):**
- Shorter, punchier headlines
- Mobile-optimized CTAs
- Emoji-friendly (use sparingly)

**Bing (Desktop-Heavy):**
- Slightly longer, more detailed
- Professional tone (older audience)
- Desktop CTAs ("Schedule Demo", "Download Whitepaper")

**Example:**

**Google RSA:**
```
H1: AI Analytics Platform
H2: Free 14-Day Trial
H3: Start Today
Desc: Get insights in minutes. No credit card required.
```

**Bing RSA:**
```
H1: Enterprise Analytics Platform
H2: Schedule Your Demo Today
H3: Trusted by Fortune 500
Desc: Advanced analytics for data-driven teams. See how we help companies grow with actionable insights.
```

### LinkedIn Profile Targeting (Bing-Only)

**When to Use:**
- B2B products
- High-ticket items ($500+ AOV)
- Professional services
- SaaS/enterprise software

**Targeting Options:**
- **Company:** Target by company name, size, industry
- **Job Function:** Marketing, IT, Finance, etc.
- **Job Title:** CEO, CTO, Manager, Director

**Setup:**
```javascript
{
  "linkedInTargeting": true,
  "linkedInFilters": {
    "industries": ["Technology", "Financial Services"],
    "jobFunctions": ["Information Technology", "Engineering"],
    "companySizes": ["51-200", "201-500", "501-1000", "1001+"]
  }
}
```

### Device Bid Adjustments

**Bing is Desktop-Heavy:**
```javascript
// Recommended bid adjustments
{
  "desktop": "+20%",   // Bing's strongest device
  "mobile": "-20%",    // Lower mobile traffic
  "tablet": "0%"       // Baseline
}
```

## Workflow Templates

### 1. Bing Search Campaign
**File:** `workflows/templates/bing-search-campaign.json`

**Use Case:** Launch Bing-specific search campaign

**Features:**
- Campaign type selection (Search, Audience, Performance Max)
- LinkedIn targeting option
- Google campaign import option
- Preset budgets for B2B, e-commerce, enterprise

### 2. Cross-Platform Search
**File:** `workflows/templates/cross-search-campaign.json`

**Use Case:** Launch coordinated Google + Bing campaigns

**Features:**
- Budget allocation strategy (standard, B2B, e-commerce, custom)
- Platform-specific keyword optimization
- Auto budget reallocation based on performance
- Cross-platform performance tracking

## Performance Benchmarks

### Typical Bing vs Google Metrics

| Metric | Google | Bing | Notes |
|--------|--------|------|-------|
| **CPC** | $2.50 | $1.65 | Bing 34% lower |
| **CTR** | 3.5% | 2.8% | Google higher engagement |
| **Conversion Rate** | 4.0% | 3.8% | Similar quality |
| **CPA** | $62.50 | $43.42 | Bing 30% lower CPA |
| **Quality Score** | 7.2 | 7.8 | Bing often higher |
| **Mobile %** | 55% | 35% | Google more mobile |

### Industry-Specific Performance

**B2B/Enterprise:**
- Bing often **matches or exceeds** Google ROAS
- LinkedIn targeting provides 15-25% higher conversion rate
- Recommendation: **70/30 or 60/40 split** (Google/Bing)

**E-commerce:**
- Google typically outperforms 2:1
- Bing provides incremental reach
- Recommendation: **85/15 split** (Google/Bing)

**Lead Gen:**
- Similar performance on both platforms
- Bing lower CPA due to lower CPCs
- Recommendation: **75/25 split** (Google/Bing)

## Advanced Features

### Microsoft Audience Network (MAN)

**What is it?**
- Native ad placements across Microsoft properties
- MSN, Outlook.com, Microsoft Edge
- Similar to Google Display Network but native-only

**When to Use:**
- High search impression share (80%+)
- Expand beyond search
- Retargeting existing visitors

**Setup:**
```javascript
{
  "campaignType": "Audience",
  "audienceNetwork": true,
  "targeting": {
    "audiences": ["Website Visitors", "Similar Audiences"],
    "interests": ["Technology", "Business"],
    "linkedInProfiles": true
  }
}
```

### Performance Max (Bing)

**Microsoft's automated campaign type:**
- Multi-channel: Search + Audience Network
- AI-optimized bidding and placements
- Requires conversion tracking

**Best for:**
- Accounts with conversion history
- E-commerce with product feeds
- Full-funnel campaigns

### Import from Google Ads

**Automated import:**
```javascript
{
  "importFromGoogle": true,
  "importSettings": {
    "campaigns": ["Campaign 1", "Campaign 2"],
    "adjustBids": -35,  // Reduce bids 35%
    "pauseOnImport": true,  // Review before activating
    "syncSchedule": "weekly"  // Keep in sync with Google
  }
}
```

**Manual adjustments after import:**
1. Review negative keywords (add Bing-specific)
2. Adjust bids down 30-40%
3. Update ad copy for desktop audience
4. Enable LinkedIn targeting if B2B
5. Set device bid adjustments

## Troubleshooting

### Low Impression Volume
**Cause:** Bing has lower search volume than Google

**Solutions:**
- Expand match types (add Phrase to Exact)
- Increase bids by 10-20%
- Expand geo-targeting
- Add Microsoft Audience Network

### High CPC (Unexpected)
**Cause:** Competitive keywords or overly aggressive bidding

**Solutions:**
- Check Google CPC comparison (Bing should be 30-50% lower)
- Review quality score (improve if < 7)
- Test phrase match instead of broad
- Add more negative keywords

### Low Quality Score
**Cause:** Irrelevant keywords or landing page issues

**Solutions:**
- Tighten ad group themes (5-15 keywords per ad group)
- Improve ad relevance (include keyword in headline)
- Optimize landing page for desktop
- Ensure fast page load times

### Conversion Tracking Not Working
**Cause:** UET tag not installed or configured incorrectly

**Solutions:**
1. Install Universal Event Tracking (UET) tag
2. Create conversion goals in Bing UI
3. Test with UET Tag Helper (browser extension)
4. Allow 24-48 hours for data to populate

## Support Resources

### Documentation
- **Setup Guide:** `connectors/MICROSOFT_ADS_SETUP.md`
- **API Reference:** `connectors/MICROSOFT_ADS_API_REFERENCE.md`
- **Platform Comparison:** `docs/SEARCH-PLATFORM-COMPARISON.md`

### Official Resources
- **Microsoft Ads Help:** https://help.ads.microsoft.com
- **Developer Docs:** https://docs.microsoft.com/en-us/advertising/
- **Community Forum:** https://advertise.bingads.microsoft.com/community

### Testing
- **Test Suite:** `node connectors/test-microsoft-ads.js`
- **Sandbox Mode:** Enabled by default (no credentials needed)
- **Live Testing:** Configure credentials in `config/.env`

## Next Steps

1. ✅ **Setup:** Complete Microsoft Ads credentials setup
2. ✅ **Test:** Run connector test suite (25 tests)
3. 🚀 **Launch:** Create first Bing campaign (start with 15-20% of Google budget)
4. 📊 **Monitor:** Track for 14 days minimum
5. 🎯 **Optimize:** Adjust budget allocation based on ROAS
6. 🔄 **Scale:** Gradually increase Bing budget if performing well

**Ready to expand your search reach!** 🔵🔍
