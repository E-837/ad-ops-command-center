# 🧪 Test Environments Guide - All Ad Platforms

**Last Updated:** February 11, 2026  
**Purpose:** Configure test/sandbox APIs for all supported ad platforms

---

## 📊 Platform Test API Availability

| Platform | Test API? | Type | Setup Difficulty | Notes |
|----------|-----------|------|------------------|-------|
| **Google Ads** | ✅ Yes | Test Accounts | Medium | Real API with test MCC |
| **Meta Ads** | ✅ Yes | Test Ad Accounts | Easy | Sandbox mode available |
| **Pinterest Ads** | ✅ Yes | Sandbox Mode | Easy | API flag-based |
| **Microsoft Ads** | ✅ Yes | Sandbox Environment | Medium | Separate sandbox endpoint |
| **LinkedIn Ads** | ⚠️ Limited | Development Mode | Hard | Limited test features |
| **TikTok Ads** | ⚠️ Limited | Sandbox | Hard | Approval required |
| **Amazon DSP** | ✅ Yes | Test Environments | Easy | Mocked by design |

**✅ = Full test API available**  
**⚠️ = Limited or restricted test access**

---

## 🚀 Quick Start: Enable All Test Environments

### **Step 1: Copy Test Environment Template**

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
copy config\.env.example config\.env.test
```

### **Step 2: Configure Test Credentials**

Edit `config\.env.test` with your test account credentials (see platform-specific guides below).

### **Step 3: Run Test Verification**

```bash
npm run test:connectors
```

This will verify all connectors work in test mode.

---

## 📋 Platform-Specific Setup Guides

---

## 1️⃣ Google Ads Test Accounts

**Status:** ✅ **FULLY SUPPORTED** - Real API with test accounts

### **How It Works**
Google Ads test accounts are real API accounts with a "Test account" badge. They:
- Use the production API endpoint
- Don't spend real money
- Can create real-looking campaigns
- Have limited impressions/clicks (test data only)

### **Setup Steps**

#### **A. Create Test MCC Account**

1. Go to https://ads.google.com/home/tools/manager-accounts/
2. Click "Create account" **with this exact URL**:
   ```
   https://ads.google.com/home/tools/manager-accounts/?testAccount=true
   ```
   ⚠️ **CRITICAL:** The `?testAccount=true` parameter is **required** or you'll get a production MCC!

3. Fill in account details:
   - Account name: "My Test MCC"
   - Currency: USD
   - Time zone: America/New_York

4. Verify the red **"Test account"** badge appears at the top

#### **B. Create Test Client Account**

1. In your test MCC, click "Accounts" → "+ New account"
2. Choose "Create a new Google Ads account to manage"
3. Fill in:
   - Account name: "Test Client Account"
   - Currency: USD
   - Time zone: America/New_York
4. Link to your test MCC

#### **C. Get Developer Token**

⚠️ **Important:** Developer tokens come from **production MCC**, not test MCC!

1. Go to your **production MCC** (not test MCC)
2. Navigate to Tools & Settings → API Center
3. Copy your developer token (format: `abc123XYZ`)

**Why?** Test MCCs don't have API Center access. The dev token from production MCC works for test accounts too.

#### **D. Set Up OAuth2**

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable Google Ads API
4. Create OAuth2 credentials:
   - Application type: Desktop app
   - Download client secrets JSON

5. Get refresh token using OAuth2 flow:
   ```bash
   # Use OAuth2 playground or run this script
   node scripts/google-ads-oauth.js
   ```

#### **E. Configure Environment**

Add to `config/.env.test`:

```env
# Google Ads Test Account
GOOGLE_ADS_DEVELOPER_TOKEN=D4Bqh9JbV0XVuW3YZwFT0A    # From production MCC
GOOGLE_ADS_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=2980139280                   # Test client account (10 digits, no hyphens)
GOOGLE_ADS_LOGIN_CUSTOMER_ID=4238675619             # Test MCC (10 digits, no hyphens)
```

### **Test It**

```bash
node connectors/test-google-ads.js
```

**Expected:** Creates test campaign, ad groups, keywords - no real money spent!

---

## 2️⃣ Meta Ads (Facebook/Instagram) Test Accounts

**Status:** ✅ **FULLY SUPPORTED** - Sandbox mode with test ad accounts

### **How It Works**
Meta provides test ad accounts that:
- Use real API endpoints
- Don't spend real money
- Generate simulated impressions/clicks
- Support all ad formats

### **Setup Steps**

#### **A. Create Facebook App**

1. Go to https://developers.facebook.com/apps/
2. Click "Create App"
3. Select "Business" type
4. Fill in app details

#### **B. Add Marketing API**

1. In your app dashboard, click "+ Add Product"
2. Select "Marketing API"
3. Go through setup wizard

#### **C. Create Test Ad Account**

1. In Business Manager (https://business.facebook.com/)
2. Go to Business Settings → Ad Accounts
3. Click "Add" → "Create a new ad account"
4. Check **"This is a test ad account"**
5. Configure:
   - Name: "Test Ad Account"
   - Time zone: America/New_York
   - Currency: USD

#### **D. Get Access Token**

**Option 1: Graph API Explorer (Quickest)**
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. Click "Generate Access Token"
4. Grant permissions: `ads_management`, `ads_read`, `business_management`
5. Click "Extend Access Token" for long-lived token (60 days)

**Option 2: OAuth2 Flow (Production)**
```bash
node scripts/meta-ads-oauth.js
```

#### **E. Get Test Ad Account ID**

1. Go to https://business.facebook.com/
2. Navigate to Ad Accounts
3. Click on your test ad account
4. Copy the account ID from URL: `act_1234567890`

#### **F. Configure Environment**

Add to `config/.env.test`:

```env
# Meta Ads Test Account
META_APP_ID=1234567890
META_APP_SECRET=your_app_secret_here
META_ACCESS_TOKEN=your_long_lived_access_token_here
META_AD_ACCOUNT_ID=act_1234567890                  # Test ad account ID
```

### **Test It**

```bash
node connectors/test-meta-ads.js
```

**Expected:** Creates test campaigns with simulated performance data!

---

## 3️⃣ Pinterest Ads Sandbox

**Status:** ✅ **FULLY SUPPORTED** - API sandbox mode

### **How It Works**
Pinterest provides a sandbox environment accessed via API parameter:
- Same endpoints as production
- Add `?sandbox=true` to requests
- Mock data responses
- No real ad serving

### **Setup Steps**

#### **A. Create Pinterest App**

1. Go to https://developers.pinterest.com/apps/
2. Click "Create app"
3. Fill in app details

#### **B. Get Access Token**

**Option 1: Access Token Tool (Quick)**
1. Go to https://developers.pinterest.com/tools/access_token/
2. Select your app
3. Choose scopes: `ads:read`, `ads:write`
4. Generate token (valid 90 days)

**Option 2: OAuth2 Flow**
```bash
node scripts/pinterest-oauth.js
```

#### **C. Create Test Ad Account**

1. Go to https://ads.pinterest.com/
2. Create a new ad account (free, no card required for sandbox)
3. Note your ad account ID (12 digits)

#### **D. Configure Environment**

Add to `config/.env.test`:

```env
# Pinterest Ads Sandbox
PINTEREST_APP_ID=1234567890
PINTEREST_APP_SECRET=your_app_secret_here
PINTEREST_ACCESS_TOKEN=pina_ABC123def456ghi789jkl012
PINTEREST_AD_ACCOUNT_ID=549755885175               # Your ad account ID
PINTEREST_SANDBOX_MODE=true                         # Enable sandbox mode
```

### **Test It**

```bash
node connectors/test-pinterest.js
```

**Expected:** Returns sandbox mock data for all operations!

---

## 4️⃣ Microsoft Ads Sandbox

**Status:** ✅ **FULLY SUPPORTED** - Dedicated sandbox environment

### **How It Works**
Microsoft Advertising provides a separate sandbox environment:
- Different API endpoint: `https://api.sandbox.bingads.microsoft.com/`
- Separate credentials
- Full API functionality
- No real ad serving

### **Setup Steps**

#### **A. Sign Up for Sandbox**

1. Go to https://developers.ads.microsoft.com/
2. Click "Sign up" for sandbox access
3. Create sandbox account (separate from production)

#### **B. Get Sandbox Credentials**

1. Log in to sandbox portal
2. Go to Tools → API Center
3. Copy:
   - Developer token (9 characters)
   - Account ID
   - Customer ID

#### **C. Create Azure App**

1. Go to https://portal.azure.com/
2. Navigate to Azure Active Directory → App registrations
3. Click "+ New registration"
4. Configure:
   - Name: "Microsoft Ads API - Sandbox"
   - Redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
5. Note Application (client) ID
6. Create client secret under Certificates & secrets

#### **D. Get Refresh Token**

```bash
node scripts/microsoft-ads-oauth.js --sandbox
```

Follow the OAuth2 flow and save the refresh token.

#### **E. Configure Environment**

Add to `config/.env.test`:

```env
# Microsoft Ads Sandbox
MICROSOFT_ADS_CLIENT_ID=your_azure_app_client_id_here
MICROSOFT_ADS_CLIENT_SECRET=your_azure_app_client_secret_here
MICROSOFT_ADS_REFRESH_TOKEN=M.R3_BAY.CdGsWd7Jvb...
MICROSOFT_ADS_DEVELOPER_TOKEN=BBD37VB98               # Sandbox dev token
MICROSOFT_ADS_ACCOUNT_ID=123456789                    # Sandbox account ID
MICROSOFT_ADS_CUSTOMER_ID=987654321                   # Sandbox customer ID
MICROSOFT_ADS_SANDBOX_MODE=true                       # Use sandbox endpoint
```

### **Test It**

```bash
node connectors/test-microsoft-ads.js
```

**Expected:** Creates test campaigns in sandbox environment!

---

## 5️⃣ LinkedIn Ads Development Mode

**Status:** ⚠️ **LIMITED** - Development access available but restricted

### **How It Works**
LinkedIn provides limited development access:
- Same production API
- Test with your own account only
- Limited ad serving
- Requires LinkedIn partnership or developer application

### **Setup Steps**

#### **A. Apply for API Access**

1. Go to https://www.linkedin.com/developers/apps
2. Create app
3. Apply for Marketing API access (approval required)

#### **B. Create Test Campaign Grouping**

1. Go to https://www.linkedin.com/campaignmanager
2. Create account (or use existing)
3. Create test campaigns marked as development

#### **C. Get Access Token**

```bash
node scripts/linkedin-oauth.js
```

#### **D. Configure Environment**

Add to `config/.env.test`:

```env
# LinkedIn Ads Development
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_ACCESS_TOKEN=AQXdw...your_access_token_here
LINKEDIN_AD_ACCOUNT_ID=urn:li:sponsoredAccount:123456789
LINKEDIN_DEV_MODE=true
```

### **Test It**

```bash
node connectors/test-linkedin-ads.js
```

**Expected:** Limited functionality, may require approval for full testing.

---

## 6️⃣ TikTok Ads Sandbox

**Status:** ⚠️ **LIMITED** - Sandbox access requires approval

### **How It Works**
TikTok offers sandbox access through:
- Marketing API developer application
- Separate sandbox environment
- Limited to approved developers
- Mock data responses

### **Setup Steps**

#### **A. Apply for Marketing API**

1. Go to https://ads.tiktok.com/marketing_api/
2. Click "Apply"
3. Fill in business details (approval required)
4. Request sandbox access in application

#### **B. Get Sandbox Credentials**

Once approved:
1. Access TikTok for Business portal
2. Create app
3. Get sandbox access token

#### **C. Configure Environment**

Add to `config/.env.test`:

```env
# TikTok Ads Sandbox
TIKTOK_ACCESS_TOKEN=your_sandbox_access_token_here
TIKTOK_ADVERTISER_ID=9876543210
TIKTOK_SANDBOX_MODE=true
```

### **Test It**

```bash
node connectors/test-tiktok-ads.js
```

**Expected:** Requires API approval first.

---

## 7️⃣ Amazon DSP Test Environment

**Status:** ✅ **FULLY SUPPORTED** - Built-in mock mode (connector design)

### **How It Works**
Our Amazon DSP connector uses mock data by default:
- No real API configured yet
- Realistic test data structure
- All CRUD operations work
- Perfect for UI/workflow testing

### **Setup**

**No setup required!** The connector works in mock mode out of the box.

To use real Amazon DSP API (when available):

```env
# Amazon DSP (when real API credentials obtained)
AMAZON_DSP_CLIENT_ID=your_client_id
AMAZON_DSP_CLIENT_SECRET=your_secret
AMAZON_DSP_REFRESH_TOKEN=your_token
AMAZON_DSP_ADVERTISER_ID=ENTITYABCDEFGHIJK
```

### **Test It**

```bash
# Already works with mock data!
node test-integration.js
```

---

## 🧪 Testing All Connectors at Once

### **Run Comprehensive Test Suite**

```bash
# Test all connectors
npm run test:connectors

# Test with specific mode
npm run test:connectors -- --mode=sandbox
```

### **Verify Test Mode Status**

```bash
node scripts/verify-test-environments.js
```

**Expected output:**
```
✅ Google Ads: Test mode configured (test MCC: 423-867-5619)
✅ Meta Ads: Test mode configured (test account: act_1234567890)
✅ Pinterest: Sandbox mode enabled
✅ Microsoft Ads: Sandbox environment configured
⚠️ LinkedIn: Development mode (limited)
⚠️ TikTok: Sandbox pending approval
✅ Amazon DSP: Mock mode (no real API needed)
```

---

## 📊 Test Environment Best Practices

### **1. Separate Test and Production Configs**

```bash
# Production
config/.env

# Test/Sandbox
config/.env.test

# Development
config/.env.dev
```

### **2. Use Environment Switching**

```bash
# Set environment variable
export NODE_ENV=test

# Or in .env
NODE_ENV=test
```

### **3. Mark Test Campaigns Clearly**

Prefix all test campaigns with `[TEST]`:
```javascript
const campaign = {
  name: '[TEST] Q1 2026 Brand Campaign',
  // ...
};
```

### **4. Automated Test Data Cleanup**

```bash
# Clean up old test campaigns
npm run cleanup:test-campaigns
```

### **5. Monitor Test Account Limits**

Some platforms have limits:
- **Google Ads Test:** Max 10 test accounts per MCC
- **Meta Test Accounts:** Rate limits apply
- **LinkedIn Dev Mode:** Limited to 100 campaigns

---

## 🔍 Troubleshooting Test Environments

### **Google Ads: "Invalid customer ID"**

**Problem:** Using production MCC customer ID instead of test MCC  
**Solution:** Ensure `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is your **test MCC** ID (with red badge)

### **Meta: "Invalid access token"**

**Problem:** Access token expired (60 days)  
**Solution:** Regenerate long-lived token in Graph API Explorer

### **Pinterest: "Sandbox not available"**

**Problem:** Missing `?sandbox=true` parameter  
**Solution:** Set `PINTEREST_SANDBOX_MODE=true` in `.env`

### **Microsoft: "Unauthorized"**

**Problem:** Using production credentials with sandbox endpoint  
**Solution:** Ensure using sandbox dev token and sandbox OAuth refresh token

### **All Connectors: "Falling back to mock data"**

**Problem:** No credentials configured  
**Solution:** This is **expected behavior!** Connectors use mock data when credentials aren't set. Configure test credentials to use real test APIs.

---

## 📋 Quick Reference: Test Credentials Needed

| Platform | Required Credentials | Where to Get |
|----------|---------------------|--------------|
| **Google Ads** | Dev token, OAuth2 (client ID/secret/refresh), Customer ID, MCC ID | Google Ads API Center + Cloud Console |
| **Meta Ads** | App ID, App Secret, Access Token, Ad Account ID | Meta for Developers + Business Manager |
| **Pinterest** | App ID, App Secret, Access Token, Ad Account ID | Pinterest Developers |
| **Microsoft Ads** | Client ID, Client Secret, Refresh Token, Dev Token, Account/Customer ID | Azure Portal + Bing Ads Developer Center |
| **LinkedIn** | Client ID, Client Secret, Access Token, Ad Account URN | LinkedIn Developers |
| **TikTok** | Access Token, Advertiser ID | TikTok Marketing API (approval required) |
| **Amazon DSP** | (Mock mode - no credentials needed yet) | - |

---

## ✅ Test Environment Checklist

Before running tests, verify:

- [ ] `.env.test` file created
- [ ] Test credentials configured for desired platforms
- [ ] Test accounts created (Google test MCC, Meta test ad account, etc.)
- [ ] OAuth tokens generated and valid
- [ ] Sandbox mode flags set where applicable
- [ ] Test verification script run (`npm run verify-test-environments`)
- [ ] Initial test passed for each connector

---

## 🚀 Next Steps

1. **Configure test credentials** for platforms you want to test
2. **Run verification script** to check setup
3. **Run connector tests** to verify API access
4. **Try UI workflows** with test accounts
5. **Monitor test data** and cleanup regularly

---

**All connectors support sandbox/test modes!** Even without credentials, they return realistic mock data for testing the UI and workflows. 🎉
