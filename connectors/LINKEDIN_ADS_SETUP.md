# LinkedIn Ads Setup Guide

This guide will help you set up the LinkedIn Ads connector for production use.

## Prerequisites

- LinkedIn Company Page (required for advertising)
- LinkedIn Marketing Developer access
- Credit card for ad spend (minimum $10 daily budget recommended)

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in app details:
   - **App name**: Ad Ops Command (or your company name)
   - **LinkedIn Page**: Select your company page
   - **App logo**: Upload a logo (80x80px minimum)
   - **Legal agreement**: Accept the API Terms of Use
4. Click "Create app"

## Step 2: Configure App Permissions

1. Navigate to the "Products" tab
2. Request access to **Marketing Developer Platform**
   - Click "Request access"
   - Fill out the application form
   - **Wait for approval** (typically 1-3 business days)
3. Once approved, verify these scopes are enabled:
   - `r_ads` - Read advertising accounts and campaigns
   - `rw_ads` - Create and modify ads
   - `r_ads_reporting` - Access campaign analytics
   - `r_organization_social` - Read organization info

## Step 3: Get Your Credentials

### Application Credentials

1. Go to the "Auth" tab
2. Copy your credentials:
   - **Client ID**: `xxxxxxxxxxxxxxxx`
   - **Client Secret**: `yyyyyyyyyyyyyyyy`

### Access Token (OAuth 2.0)

LinkedIn uses OAuth 2.0. You have two options:

#### Option A: Use the Authorization Code Flow (Recommended)

1. **Authorization URL**:
   ```
   https://www.linkedin.com/oauth/v2/authorization?
     response_type=code&
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=r_ads%20rw_ads%20r_ads_reporting%20r_organization_social
   ```

2. **Redirect URI**: Configure in your app settings (Auth tab)
   - For local development: `http://localhost:8080/callback`
   - For production: `https://yourapp.com/auth/linkedin/callback`

3. **Exchange code for access token**:
   ```bash
   curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI"
   ```

4. **Response**:
   ```json
   {
     "access_token": "AQXdw...",
     "expires_in": 5184000,
     "refresh_token": "AQUw...",
     "refresh_token_expires_in": 31536000
   }
   ```

#### Option B: Use Developer Token (Testing Only)

For development/testing, you can use a short-lived access token:

1. Go to [LinkedIn Developers Tools](https://www.linkedin.com/developers/tools)
2. Select your app
3. Generate a test access token (valid for 60 days)
4. **Note**: This is NOT suitable for production

### Find Your Ad Account ID

1. Go to [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager/accounts)
2. Select your ad account
3. The Account ID is in the URL:
   ```
   https://www.linkedin.com/campaignmanager/accounts/123456789/...
                                                    ^^^^^^^^^
                                                    Account ID
   ```
4. Format as URN: `urn:li:sponsoredAccount:123456789`

## Step 4: Configure Environment Variables

Edit `config/.env`:

```bash
# LinkedIn Ads Configuration
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=yyyyyyyyyyyyyyyy
LINKEDIN_ACCESS_TOKEN=AQXdw...
LINKEDIN_AD_ACCOUNT_ID=urn:li:sponsoredAccount:123456789
```

## Step 5: Test Connection

Run the test suite:

```bash
node connectors/test-linkedin-ads.js
```

Expected output:
```
✓ All tests passed! (23/23)
```

Or test a single operation:

```bash
node -e "
  const linkedin = require('./connectors/linkedin-ads.js');
  linkedin.testConnection().then(console.log);
"
```

Expected output:
```json
{
  "status": "ok",
  "mode": "live",
  "message": "Successfully connected to LinkedIn Ads API",
  "account_id": "urn:li:sponsoredAccount:123456789",
  "accounts": 1
}
```

## Step 6: Verify Live Data

Fetch your campaigns:

```bash
node -e "
  const linkedin = require('./connectors/linkedin-ads.js');
  linkedin.handleToolCall('linkedin_get_campaigns', {
    status: ['ACTIVE']
  }).then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
"
```

## Sandbox Mode

Without credentials configured, the connector runs in **sandbox mode**:
- All API calls return realistic mock data
- Safe for testing and development
- No actual API requests or charges

Mock data includes:
- 2 ad accounts
- 3 campaigns (B2B SaaS, Enterprise Software, Recruitment)
- 4 creatives (Sponsored Content, Video, Message Ad, Job Ad)
- Lead gen forms with sample leads
- Realistic analytics data

## Rate Limits

LinkedIn Ads API has the following rate limits:

- **Application-level**: 100,000 calls per day per app
- **Member-level**: 500 calls per day per member per app
- **Burst limit**: 60 calls per minute

The connector handles rate limiting automatically with exponential backoff.

## Best Practices

### 1. Token Management

- **Never commit tokens** to version control
- Use environment variables or secure secret management
- Refresh tokens expire after 1 year - implement refresh flow
- Access tokens expire after 60 days - refresh before expiry

### 2. Campaign Structure

LinkedIn campaigns follow a 3-tier structure:
```
Ad Account
  └── Campaign (objective, budget, schedule)
      └── Creative (content, targeting, bid)
```

### 3. B2B Targeting Tips

- **Job Titles**: Be specific but not too narrow (e.g., "VP of Marketing" vs "Senior Vice President of Digital Marketing Strategy")
- **Company Size**: Target 51+ employees for B2B SaaS
- **Seniorities**: Use DIRECTOR, VP, CXO for decision-makers
- **Industries**: Select 3-5 relevant industries for better reach
- **Test Audience Size**: Aim for 50,000+ estimated reach for stable delivery

### 4. Budget Recommendations

- **Minimum daily budget**: $10 per campaign
- **Minimum bid**: $2 CPC or $5 CPM
- **B2B CPC range**: $5-15 (higher for C-level targeting)
- **Lead Gen Forms**: $20-50 cost per lead is typical

### 5. Creative Best Practices

- **Sponsored Content**: 1200x627px image, max 150 chars description
- **Video Ads**: 1080x1920px (9:16), 3-30 seconds optimal
- **Message Ads**: Personalize with {firstName}, {companyName}
- **Text Ads**: 25 char headline, 75 char description, 50x50px image

## Troubleshooting

### "Invalid access token" Error

**Cause**: Token expired or invalid

**Solution**:
1. Generate a new access token using OAuth flow
2. Update `LINKEDIN_ACCESS_TOKEN` in `.env`
3. Restart your application

### "Insufficient permissions" Error

**Cause**: App doesn't have Marketing Developer Platform access

**Solution**:
1. Go to your app's "Products" tab
2. Check if Marketing Developer Platform is approved
3. If not, request access and wait for approval

### "Invalid URN format" Error

**Cause**: Account ID not in URN format

**Solution**:
- Correct format: `urn:li:sponsoredAccount:123456789`
- Not: `123456789` or `account:123456789`

### "Campaign creation failed" Error

**Cause**: Missing required fields or invalid budget

**Solution**:
- Ensure daily_budget_amount >= 10
- Provide valid start_date (Unix timestamp in milliseconds)
- Check objective_type is valid (see docs)

## Next Steps

1. **Read the API Reference**: See `LINKEDIN_ADS_API_REFERENCE.md` for all available tools
2. **Review Best Practices**: See `docs/LINKEDIN-ADS-INTEGRATION.md`
3. **Try the SocialMediaBuyer Agent**: Automated B2B campaign management

## Support

- **LinkedIn Developer Portal**: https://www.linkedin.com/developers/
- **API Documentation**: https://docs.microsoft.com/en-us/linkedin/marketing/
- **Marketing Developer Community**: https://www.linkedin.com/groups/linkedin-developers
- **LinkedIn Support**: https://www.linkedin.com/help/linkedin/answer/5540

## API Versions

- **Current Version**: v2 (stable)
- **Deprecation Policy**: 12 months notice before breaking changes
- **Version Header**: `LinkedIn-Version: 202402` (YYYYMM format)

This connector uses the latest stable v2 API endpoints.
