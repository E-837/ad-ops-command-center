# Pinterest Ads Connector Setup Guide

Complete guide to setting up the Pinterest Ads connector for Ad Ops Command.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pinterest Developer Account Setup](#pinterest-developer-account-setup)
3. [OAuth2 Configuration](#oauth2-configuration)
4. [Environment Variables](#environment-variables)
5. [Testing the Connection](#testing-the-connection)
6. [Sandbox vs Live Mode](#sandbox-vs-live-mode)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Prerequisites

- **Pinterest Business Account** - Required for advertising
  - Sign up at: https://business.pinterest.com/
  - Verify your business account
  
- **Pinterest Ad Account** - Required for running ads
  - Create at: https://ads.pinterest.com/
  - Add payment method (even for testing)
  
- **Pinterest Developer Account** - Required for API access
  - Register at: https://developers.pinterest.com/

---

## Pinterest Developer Account Setup

### Step 1: Create a Pinterest App

1. **Go to Pinterest Developers**
   - Visit: https://developers.pinterest.com/apps/
   - Click "Create app"

2. **Fill in App Details**
   ```
   App name: Ad Ops Command Integration
   Description: Campaign management and analytics for Pinterest Ads
   Redirect URI: http://localhost:3000/auth/pinterest/callback
   (or your production URL)
   ```

3. **Select Permissions (Scopes)**
   Required scopes:
   - ✅ `ads:read` - Read advertising data
   - ✅ `ads:write` - Create and manage ads
   - ✅ `user_accounts:read` - Read user account information
   - ✅ `boards:read` - Read board data
   - ✅ `pins:read` - Read pin data
   - ✅ `pins:write` - Create and manage pins

4. **Create the App**
   - After creation, you'll receive:
     - **App ID** (also called Client ID)
     - **App Secret** (also called Client Secret)
   - **⚠️ Save these securely!** You'll need them for OAuth.

### Step 2: Get Ad Account ID

1. **Find Your Ad Account ID**
   - Go to: https://ads.pinterest.com/
   - Click on your account name in top-right
   - Your Ad Account ID is displayed (format: `549755885175`)
   - Or check the URL: `https://ads.pinterest.com/advertisers/[AD_ACCOUNT_ID]/`

---

## OAuth2 Configuration

Pinterest uses OAuth2 for authentication. You have two options:

### Option A: Manual Token Generation (Quickest for Testing)

1. **Use Pinterest API Explorer**
   - Visit: https://developers.pinterest.com/tools/access_token/
   - Select your app
   - Choose required scopes:
     - ads:read
     - ads:write
     - user_accounts:read
     - boards:read
     - pins:read
     - pins:write
   - Click "Get Token"
   - Copy the access token

2. **Token Characteristics**
   - Valid for: **90 days** (long-lived)
   - No refresh needed during validity period
   - Regenerate when expired

3. **Set in Environment Variables**
   ```bash
   PINTEREST_ACCESS_TOKEN=pina_ABC123...XYZ789
   PINTEREST_AD_ACCOUNT_ID=549755885175
   ```

### Option B: Full OAuth2 Flow (Production)

For production deployments, implement the full OAuth2 flow:

1. **Authorization URL**
   ```
   https://www.pinterest.com/oauth/?
     client_id={APP_ID}&
     redirect_uri={REDIRECT_URI}&
     response_type=code&
     scope=ads:read,ads:write,user_accounts:read,boards:read,pins:read,pins:write
   ```

2. **User Authorizes & Returns Code**
   User is redirected to:
   ```
   http://localhost:3000/auth/pinterest/callback?code=ABC123...
   ```

3. **Exchange Code for Token**
   ```bash
   curl -X POST 'https://api.pinterest.com/v5/oauth/token' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'grant_type=authorization_code' \
     -d 'code=ABC123...' \
     -d 'redirect_uri=http://localhost:3000/auth/pinterest/callback' \
     -d 'client_id={APP_ID}' \
     -d 'client_secret={APP_SECRET}'
   ```

4. **Response**
   ```json
   {
     "access_token": "pina_ABC123...XYZ789",
     "token_type": "bearer",
     "expires_in": 7776000,
     "refresh_token": "NOT_USED_IN_V5",
     "scope": "ads:read,ads:write,..."
   }
   ```

5. **Store Access Token**
   Save the `access_token` securely. Pinterest v5 tokens are long-lived (90 days) and don't require refresh.

---

## Environment Variables

### File Location
Create or edit: `config/.env`

### Required Variables

```bash
# Pinterest App Credentials
PINTEREST_APP_ID=1234567890
PINTEREST_APP_SECRET=abc123def456...

# Pinterest Access Token (from OAuth2 flow)
PINTEREST_ACCESS_TOKEN=pina_ABC123...XYZ789

# Pinterest Ad Account ID (format: 549755885175)
PINTEREST_AD_ACCOUNT_ID=549755885175
```

### Optional Variables

```bash
# API Settings (defaults shown)
PINTEREST_API_VERSION=v5
PINTEREST_API_BASE=https://api.pinterest.com/v5

# Rate Limiting
PINTEREST_MAX_RETRIES=3
PINTEREST_RETRY_DELAY=1000
```

### Example `.env` File

```bash
# ============================================
# Pinterest Ads Configuration
# ============================================

# App credentials from developers.pinterest.com/apps
PINTEREST_APP_ID=1234567890
PINTEREST_APP_SECRET=your_app_secret_here

# Access token from OAuth2 flow (valid 90 days)
PINTEREST_ACCESS_TOKEN=pina_ABC123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Ad account ID (find at ads.pinterest.com)
PINTEREST_AD_ACCOUNT_ID=549755885175
```

---

## Testing the Connection

### Run Tests in Sandbox Mode

**Without credentials configured**, the connector runs in **sandbox mode** with realistic mock data:

```bash
cd connectors
node test-pinterest.js
```

**Expected output:**
```
Pinterest Ads Connector Test Suite

━━━ Test 1: Connector Info ━━━
✓ Connector info loaded correctly

━━━ Test 2: Connection Test ━━━
✓ Connection test passed (sandbox mode)

━━━ Test 3: Get Campaigns ━━━
✓ Got 2 active campaigns
  - Spring Fashion Campaign (CONSIDERATION)
  - Home Decor - Q1 2026 (CONVERSIONS)

...

━━━ Test Summary ━━━
Total Tests: 24
Passed: 24
Failed: 0
Pass Rate: 100.0%

🎉 All tests passed! Pinterest connector is working perfectly in sandbox mode.
```

### Test Live Connection

**With credentials configured**, test real API connection:

```bash
node -e "require('./pinterest.js').testConnection().then(r => console.log(JSON.stringify(r, null, 2)))"
```

**Expected output (live mode):**
```json
{
  "connected": true,
  "mode": "live",
  "status": "ok",
  "username": "your_username",
  "account_type": "BUSINESS",
  "profile_image": "https://..."
}
```

### Verify Environment Variables

```bash
node -e "require('./pinterest.js').getInfo()" | grep -A 5 oauth
```

Should show:
```
oauth: {
  provider: 'pinterest',
  connected: true,
  mode: 'live',
  accountId: '***5175'
}
```

---

## Sandbox vs Live Mode

### Sandbox Mode (Default)

**When to use:**
- Testing without API credentials
- Development and prototyping
- Learning the connector API
- CI/CD testing

**Characteristics:**
- No real API calls
- Realistic mock data
- All 15 tools functional
- No rate limits
- Instant responses

**Mock Data Included:**
- 3 campaigns (AWARENESS, CONSIDERATION, CONVERSIONS)
- 4 ad groups (various targeting)
- 4 ads (REGULAR, VIDEO, CAROUSEL)
- 3 audiences (VISITOR, CUSTOMER_LIST, ACTALIKE)
- 5 pins
- Performance insights

### Live Mode

**When to use:**
- Production campaign management
- Real ad account operations
- Actual performance data

**Activation:**
Set all required environment variables:
```bash
PINTEREST_ACCESS_TOKEN=pina_...
PINTEREST_AD_ACCOUNT_ID=549755885175
```

**Characteristics:**
- Real API calls to Pinterest
- Rate limiting enforced (see below)
- Actual billing implications
- Real-time data

---

## Rate Limits & Best Practices

### Pinterest API Rate Limits

**Per-User Limits:**
- **10,000 requests/day** per access token
- **200 requests/minute** per access token
- **10 requests/second** per access token

**Automatic Retry Logic:**
The connector automatically retries on rate limit errors:
- First retry: 1 second delay
- Second retry: 2 seconds delay
- Third retry: 4 seconds delay
- Max retries: 3

### Best Practices

1. **Batch Operations**
   - Request multiple campaigns/ad groups in one call
   - Use filters to reduce data transfer

2. **Cache Insights**
   - Store performance data locally
   - Only fetch updates for changed date ranges

3. **Respect Rate Limits**
   - Implement exponential backoff
   - Monitor response headers for limit info

4. **Optimize Queries**
   - Use `page_size` parameter (default: 25, max: 100)
   - Request only needed fields

---

## Troubleshooting

### Issue: "Invalid Access Token"

**Error:**
```
Pinterest API error: 401 Unauthorized
```

**Solutions:**
1. Verify token is still valid (90-day expiration)
2. Check token has required scopes
3. Regenerate token at developers.pinterest.com/tools/access_token/
4. Ensure no extra spaces in `.env` file

### Issue: "Ad Account Not Found"

**Error:**
```
Pinterest API error: 404 Not Found
```

**Solutions:**
1. Verify `PINTEREST_AD_ACCOUNT_ID` is correct (12-digit number)
2. Check account exists at ads.pinterest.com
3. Ensure access token has permission for this account
4. Confirm account is a **Business** account (not personal)

### Issue: "Insufficient Permissions"

**Error:**
```
Pinterest API error: 403 Forbidden
```

**Solutions:**
1. Regenerate token with all required scopes:
   - ads:read
   - ads:write
   - user_accounts:read
   - boards:read
   - pins:read
   - pins:write
2. Verify app has been granted permissions
3. Check if account owner has authorized your app

### Issue: "Rate Limit Exceeded"

**Error:**
```
Pinterest API error: 429 Too Many Requests
```

**Solutions:**
1. Connector will auto-retry with exponential backoff
2. Reduce request frequency
3. Batch operations where possible
4. Wait 60 seconds and retry

### Issue: "Micro-Currency Confusion"

**Error:**
Budgets/bids showing wrong amounts

**Solution:**
Pinterest uses **micro-currency** (cents × 10,000):
- $1.00 = 10,000,000 micro-currency
- $10.00 = 100,000,000 micro-currency
- $0.25 = 2,500,000 micro-currency

**Helper:**
```javascript
function dollarToMicro(dollars) {
  return dollars * 10_000_000;
}

function microToDollar(micro) {
  return micro / 10_000_000;
}

// Example:
const budget = dollarToMicro(25); // $25 = 250,000,000
```

### Issue: "Campaign Creation Fails"

**Common causes:**
1. Missing required fields (name, objective_type)
2. Invalid objective_type value
3. Budget too low (minimum $1/day = 10,000,000 micro-currency)
4. Invalid date format (use ISO 8601: `2026-03-01T00:00:00Z`)

### Debugging Tips

**Enable verbose logging:**
```javascript
const pinterest = require('./pinterest.js');
pinterest.debugMode = true; // Future enhancement
```

**Test specific tool:**
```javascript
const pinterest = require('./pinterest.js');
pinterest.handleToolCall('pinterest_get_campaigns', {
  entity_statuses: ['ACTIVE']
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Error:', error.message);
});
```

---

## API Reference

For detailed tool documentation, see:
- **[PINTEREST_API_REFERENCE.md](./PINTEREST_API_REFERENCE.md)** - Complete tool reference

### Quick Tool Overview

**Campaign Management:**
- `pinterest_get_campaigns` - List campaigns
- `pinterest_create_campaign` - Create campaign
- `pinterest_update_campaign` - Update campaign

**Ad Group Management:**
- `pinterest_get_ad_groups` - List ad groups
- `pinterest_create_ad_group` - Create ad group with targeting
- `pinterest_update_ad_group` - Update ad group

**Ad Management:**
- `pinterest_get_ads` - List ads
- `pinterest_create_ad` - Create ad
- `pinterest_update_ad` - Update ad

**Audience Management:**
- `pinterest_get_audiences` - List audiences
- `pinterest_create_audience` - Create custom/lookalike audience

**Reporting:**
- `pinterest_get_insights` - Get performance metrics

**Account & Pins:**
- `pinterest_get_ad_accounts` - List ad accounts
- `pinterest_get_pins` - List pins
- `pinterest_create_pin` - Create new pin

---

## Additional Resources

**Official Documentation:**
- Pinterest Ads API v5: https://developers.pinterest.com/docs/api/v5/
- Pinterest Business Help: https://help.pinterest.com/en/business
- Pinterest Ads Manager: https://ads.pinterest.com/

**Pinterest Best Practices:**
- Creative Specs: https://help.pinterest.com/en/business/article/creative-best-practices
- Targeting Guide: https://help.pinterest.com/en/business/article/target-your-ads
- Conversion Tracking: https://help.pinterest.com/en/business/article/track-conversions-with-the-pinterest-tag

**Support:**
- Pinterest Business Support: https://help.pinterest.com/en/business/contact-us
- Developer Community: https://developers.pinterest.com/community/

---

## What's Next?

After setup is complete:

1. **Run full test suite:** `node test-pinterest.js`
2. **Integrate with agents:** Update `agents/social-media-buyer.js`
3. **Try workflows:** Use cross-channel launch workflow
4. **Monitor performance:** Set up analytics dashboards

**Happy advertising! 📌**
