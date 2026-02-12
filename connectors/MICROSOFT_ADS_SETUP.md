# Microsoft Advertising (Bing Ads) Connector Setup Guide

Complete setup instructions for the Microsoft Advertising connector.

## Overview

The Microsoft Advertising connector provides full integration with the Microsoft Advertising API v13 (formerly Bing Ads). It supports:

- **Search Campaigns** - Bing search network advertising
- **Audience Campaigns** - Microsoft Audience Network (native ads)
- **Shopping Campaigns** - Product ads via Microsoft Merchant Center
- **Performance Max** - Multi-channel automated campaigns

## Prerequisites

1. **Microsoft Advertising Account** - ads.microsoft.com
2. **Azure AD Application** - For OAuth2 authentication
3. **Developer Token** - Applied through Microsoft Advertising
4. **Advertiser Account** - Active account with campaigns

## Step 1: Create Microsoft Advertising Account

1. Go to [ads.microsoft.com](https://ads.microsoft.com)
2. Sign in with Microsoft account (or create one)
3. Complete account setup:
   - Business information
   - Billing details
   - Time zone and currency
4. Note your **Account ID** and **Customer ID** from account settings

## Step 2: Register Azure AD Application

Microsoft Advertising uses Azure AD for OAuth2 authentication.

### 2.1: Create Azure AD App

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: "Ad Ops Command - Microsoft Ads"
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Type: Web
     - URI: `http://localhost:3000/oauth/callback` (or your callback URL)
5. Click **Register**

### 2.2: Get Client ID and Secret

1. After creation, note the **Application (client) ID** - this is your `MICROSOFT_ADS_CLIENT_ID`
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add description: "Ad Ops Command"
5. Set expiration: 24 months (maximum)
6. Click **Add**
7. **IMPORTANT**: Copy the secret **Value** immediately - this is your `MICROSOFT_ADS_CLIENT_SECRET`
   - You cannot view it again!

### 2.3: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft APIs** > **Microsoft Advertising API**
4. Select **Delegated permissions**
5. Check: `ads.manage` (full access to advertising accounts)
6. Click **Add permissions**
7. Click **Grant admin consent** (if you're an admin)

### 2.4: Configure Authentication

1. Go to **Authentication**
2. Under **Platform configurations** > **Web**, add redirect URIs:
   - `http://localhost:3000/oauth/callback`
   - `https://your-domain.com/oauth/callback` (production)
3. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
4. Click **Save**

## Step 3: Apply for Developer Token

A developer token is required to access the Microsoft Advertising API.

### 3.1: Request Developer Token

1. Sign in to [developers.ads.microsoft.com](https://developers.ads.microsoft.com)
2. Go to **Account** > **Developer Token**
3. Fill out the application:
   - **Application Name**: Ad Ops Command
   - **Application Description**: Marketing campaign management and automation system
   - **Application URL**: Your website or GitHub repo
   - **Contact Email**: Your email
4. Submit application

### 3.2: Approval Process

- **Test Token**: Usually approved within minutes
  - Limited to **sandbox/test accounts**
  - Perfect for development
- **Production Token**: Requires review (1-3 business days)
  - Access to live accounts
  - Must demonstrate API usage

### 3.3: Get Your Token

1. Once approved, go back to **Developer Token** page
2. Copy your token - this is your `MICROSOFT_ADS_DEVELOPER_TOKEN`
3. Format: `BBD37VB98` (example - 9 characters)

## Step 4: OAuth2 Authorization Flow

You need to get a **refresh token** by completing the OAuth2 flow once.

### 4.1: Generate Authorization URL

Replace these values:
- `YOUR_CLIENT_ID` - From Step 2.2
- `YOUR_REDIRECT_URI` - From Step 2.4 (URL-encoded)

```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=YOUR_CLIENT_ID
  &response_type=code
  &redirect_uri=YOUR_REDIRECT_URI
  &response_mode=query
  &scope=https://ads.microsoft.com/ads.manage offline_access
  &state=12345
```

**Example:**
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=abc123-456def-789ghi&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&response_mode=query&scope=https://ads.microsoft.com/ads.manage%20offline_access&state=12345
```

### 4.2: Authorize Application

1. Open the URL in your browser
2. Sign in with your Microsoft Advertising account
3. Review permissions and click **Accept**
4. You'll be redirected to: `http://localhost:3000/oauth/callback?code=AUTHORIZATION_CODE&state=12345`
5. Copy the **code** parameter value

### 4.3: Exchange Code for Tokens

Use this curl command (replace values):

```bash
curl -X POST https://login.microsoftonline.com/common/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "grant_type=authorization_code" \
  -d "scope=https://ads.microsoft.com/ads.manage offline_access"
```

**Response:**
```json
{
  "token_type": "Bearer",
  "scope": "https://ads.microsoft.com/ads.manage",
  "expires_in": 3600,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "M.R3_BAY.CdGsWd7Jvb..."
}
```

**IMPORTANT**: Save the **refresh_token** - this is your `MICROSOFT_ADS_REFRESH_TOKEN`

The connector will automatically refresh the access token as needed.

## Step 5: Get Account and Customer IDs

You need your Account ID and Customer ID for API calls.

### 5.1: Find Account ID

**Option 1: Web Interface**
1. Sign in to [ads.microsoft.com](https://ads.microsoft.com)
2. Click account name in top right
3. Go to **Accounts & Billing** > **Accounts**
4. Your **Account ID** is listed (format: 9 digits, e.g., `123456789`)

**Option 2: API Call**
After getting your refresh token, you can call the API:

```bash
curl -X GET "https://ads.api.bingads.microsoft.com/Api/Advertiser/v13/CustomerManagement/GetUser" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "DeveloperToken: YOUR_DEVELOPER_TOKEN"
```

### 5.2: Find Customer ID

- **Customer ID** = Your Microsoft Advertising account ID
- Same as Account ID in most cases
- Format: 9 digits (e.g., `987654321`)

If you have multiple customers (agency scenario):
1. Call `GetAccountsInfo` API
2. Find your primary customer ID
3. Use that for all API calls

## Step 6: Configure Environment Variables

Add these to `config/.env`:

```bash
# Microsoft Advertising (Bing Ads) Configuration
MICROSOFT_ADS_CLIENT_ID=your_azure_app_client_id
MICROSOFT_ADS_CLIENT_SECRET=your_azure_app_client_secret
MICROSOFT_ADS_REFRESH_TOKEN=M.R3_BAY.CdGsWd7Jvb...
MICROSOFT_ADS_DEVELOPER_TOKEN=BBD37VB98
MICROSOFT_ADS_ACCOUNT_ID=123456789
MICROSOFT_ADS_CUSTOMER_ID=987654321
```

**Security Notes:**
- ✅ DO: Add `.env` to `.gitignore`
- ✅ DO: Use environment variables in production
- ❌ DON'T: Commit secrets to git
- ❌ DON'T: Share your developer token publicly

## Step 7: Test Connection

### 7.1: Run Connector Tests

```bash
node connectors/test-microsoft-ads.js
```

**Expected Output (Sandbox Mode - No Credentials):**
```
═══════════════════════════════════════════════════════════
Microsoft Advertising Connector Test Suite
Testing in SANDBOX mode (no credentials required)
═══════════════════════════════════════════════════════════

🧪 Testing: Connection Test (Sandbox Mode)
✅ PASS: Connection Test (Sandbox Mode)

🧪 Testing: Get Campaigns
✅ PASS: Get Campaigns

...

═══════════════════════════════════════════════════════════
Test Results Summary
═══════════════════════════════════════════════════════════
✅ Passed: 25
❌ Failed: 0
📊 Total:  25
═══════════════════════════════════════════════════════════
🎉 All tests passed!
```

### 7.2: Test with Live Credentials

After configuring `.env`, run tests again:

```bash
node connectors/test-microsoft-ads.js
```

Should see:
```
🧪 Testing: Connection Test (Sandbox Mode)
   📊 Mode: live
   📋 Message: Successfully connected to Microsoft Advertising API
✅ PASS: Connection Test
```

## Step 8: Microsoft Advertising Sandbox

Microsoft offers a **sandbox environment** for testing without spending real money.

### 8.1: Create Sandbox Account

1. Go to [developers.ads.microsoft.com](https://developers.ads.microsoft.com)
2. Navigate to **Sandbox**
3. Click **Request Sandbox Access**
4. Complete the form

### 8.2: Sandbox Features

- **Free testing** - No real ad spend
- **Test data** - Pre-populated campaigns and keywords
- **Full API access** - All endpoints available
- **Separate credentials** - Different account/customer IDs

### 8.3: Use Sandbox

Set environment variables for sandbox:
```bash
MICROSOFT_ADS_ACCOUNT_ID=your_sandbox_account_id
MICROSOFT_ADS_CUSTOMER_ID=your_sandbox_customer_id
```

API endpoint remains the same - Microsoft routes requests based on credentials.

## Troubleshooting

### Error: "Invalid client"

**Cause**: Wrong client ID or secret

**Fix**:
1. Verify `MICROSOFT_ADS_CLIENT_ID` matches Azure AD app
2. Regenerate secret in Azure portal if needed
3. Update `MICROSOFT_ADS_CLIENT_SECRET`

### Error: "Invalid refresh token"

**Cause**: Refresh token expired or revoked

**Fix**:
1. Refresh tokens expire after **90 days of inactivity**
2. Complete OAuth2 flow again (Step 4)
3. Update `MICROSOFT_ADS_REFRESH_TOKEN`

### Error: "Developer token not approved"

**Cause**: Using production token before approval

**Fix**:
1. Use **test token** during development
2. Wait for production token approval
3. Verify token at [developers.ads.microsoft.com](https://developers.ads.microsoft.com)

### Error: "Account not found"

**Cause**: Wrong account ID or customer ID

**Fix**:
1. Verify IDs at [ads.microsoft.com](https://ads.microsoft.com)
2. Check format: 9 digits (e.g., `123456789`)
3. Ensure account is active (not suspended)

### Error: "Insufficient permissions"

**Cause**: Missing API permissions or consent

**Fix**:
1. Go to Azure AD app > **API permissions**
2. Ensure `ads.manage` is added
3. Click **Grant admin consent**
4. Re-authorize app (Step 4)

### Rate Limiting

Microsoft Advertising API limits:
- **5,000 requests/month** (developer token)
- **1,000,000 requests/month** (production token after approval)

**Best practices:**
- Use bulk operations when possible
- Cache results locally
- Implement exponential backoff
- Monitor usage at [developers.ads.microsoft.com](https://developers.ads.microsoft.com)

## API Reference

See `MICROSOFT_ADS_API_REFERENCE.md` for:
- Complete tool documentation
- Request/response examples
- Parameter reference
- Best practices

## Additional Resources

### Official Documentation
- **API Docs**: https://docs.microsoft.com/en-us/advertising/guides/
- **Reference**: https://docs.microsoft.com/en-us/advertising/campaign-management-service/
- **OAuth Guide**: https://docs.microsoft.com/en-us/advertising/guides/authentication-oauth
- **Developer Portal**: https://developers.ads.microsoft.com

### Code Examples
- **Official SDKs**: https://github.com/BingAds/BingAds-dotNet-SDK
- **REST Examples**: https://docs.microsoft.com/en-us/advertising/guides/get-started

### Support
- **Developer Forum**: https://social.msdn.microsoft.com/Forums/en-US/home?forum=BingAds
- **Support Portal**: https://about.ads.microsoft.com/en-us/resources/help/help-and-how-to
- **Status Page**: https://status.ads.microsoft.com

## Quick Start Checklist

- [ ] Create Microsoft Advertising account
- [ ] Register Azure AD application
- [ ] Get client ID and secret
- [ ] Add API permissions (`ads.manage`)
- [ ] Apply for developer token
- [ ] Complete OAuth2 flow
- [ ] Get refresh token
- [ ] Find account and customer IDs
- [ ] Configure `.env` file
- [ ] Run test suite
- [ ] Verify live connection

## Next Steps

Once configured:

1. **Explore Tools**: Try different MCP tools with test data
2. **Create Campaigns**: Use `microsoft_ads_create_campaign`
3. **Add Keywords**: Build out ad groups with targeted keywords
4. **Performance Reports**: Monitor campaign performance
5. **Integrate Workflows**: Connect to search-marketer agent

Ready to launch Bing search campaigns! 🚀
