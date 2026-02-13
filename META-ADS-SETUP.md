# Meta Ads API Setup Guide

## Quick Setup (15-20 minutes)

### Step 1: Create a Meta Business App

1. Go to https://developers.facebook.com/apps
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in:
   - App name: "Ad Ops Command" (or your preferred name)
   - Contact email: your email
   - Business account: select or create one
5. Click **"Create App"**
6. **Copy your App ID and App Secret** (you'll need these)

---

### Step 2: Add Marketing API

1. In your app dashboard, find **"Add Products"**
2. Click **"Set Up"** on **"Marketing API"**
3. Grant these permissions:
   - `ads_management` - Create and manage ads
   - `ads_read` - Read ad account data
   - `read_insights` - Access performance metrics
   - `business_management` - Access business resources

---

### Step 3: Get Access Token

**Option A: Quick Test Token (60 days, easiest)**

1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Click **"Generate Access Token"**
4. Grant all requested permissions
5. **Copy the token** (starts with `EAAA...`)
6. Click **"Access Token Tool"** to extend it:
   - https://developers.facebook.com/tools/accesstoken/
   - Click **"Extend Access Token"** → get 60-day token
7. **Copy the long-lived token**

**Option B: System User Token (never expires, recommended for production)**

1. Go to https://business.facebook.com/settings/system-users
2. Click **"Add"** → create system user
3. Assign role: **Admin** (needed for ad management)
4. Click **"Generate New Token"**
5. Select your app
6. Grant permissions: `ads_management`, `ads_read`, `read_insights`, `business_management`
7. **Copy the token** (never expires!)

---

### Step 4: Get Ad Account ID

1. Go to https://adsmanager.facebook.com/adsmanager/
2. Click the account dropdown (top-left)
3. Click **"Settings"**
4. Your **Ad Account ID** is at the top (format: `act_1234567890`)
   - If it shows as `1234567890`, add `act_` prefix → `act_1234567890`

---

### Step 5: Configure Environment Variables

1. Copy the `.env.example` file:
   ```bash
   cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command\config
   copy .env.example .env
   ```

2. Edit `config/.env` and fill in:
   ```env
   # Meta Ads Configuration
   META_APP_ID=123456789012345
   META_APP_SECRET=abc123def456ghi789jkl012mno345pq
   META_ACCESS_TOKEN=EAAA...your_long_lived_token_here
   META_AD_ACCOUNT_ID=act_1234567890
   ```

3. Save the file

---

### Step 6: Test the Connection

Run this from the project directory:

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
node -e "const meta = require('./connectors/meta-ads'); meta.getStatus().then(s => console.log(JSON.stringify(s, null, 2)))"
```

**Expected output:**
```json
{
  "name": "Meta Ads",
  "connected": true,
  "mode": "live",
  "accountId": "***7890"
}
```

If you see `"connected": false`, check your credentials in `.env`.

---

### Step 7: Create a Test Campaign

Via the UI:
1. Start the server: `npm start`
2. Go to http://localhost:3002
3. Navigate to **Workflows** page
4. Find **"Campaign from Brief"** section
5. Paste this test brief:

```
Launch a test AI Audio campaign for AirPod AI. 
Budget is $10 for testing. 
Running Feb 13-14, 2026. 
Target tech enthusiasts on Meta (Facebook + Instagram).
Focus on awareness.
```

6. Click **Submit**
7. Check the results panel for the Meta Ads Manager URL
8. Open the URL → **you should see your campaign in Facebook Ads Manager!**

---

## Troubleshooting

### Error: "Invalid OAuth access token"
- Token expired → regenerate token (Step 3)
- Wrong app → make sure token is from your app

### Error: "Insufficient permissions"
- Missing scopes → go back to Step 2, add all permissions
- User doesn't have access → add your user to the ad account

### Error: "Ad account not found"
- Wrong account ID format → must be `act_XXXXXXXXXX`
- User doesn't have access → grant yourself admin access in Business Settings

### Campaign created but not showing up
- Check campaign status → might be in "Paused" or "Under Review"
- Go to Ads Manager → Campaigns tab → filter "All campaigns"
- Meta may need time to review (1-2 minutes for test accounts)

---

## What Happens Next

Once connected:
- **All Meta campaign creations will be LIVE** (not mock)
- **Campaigns appear in Facebook Ads Manager** within seconds
- **You can manage them** from both the platform and Ads Manager
- **Real spend happens** when campaigns are active (test with small budgets!)

---

## Production Best Practices

1. **Use System User tokens** (never expire)
2. **Set spend caps** in Facebook Business Settings
3. **Use test ad accounts** for development:
   - https://business.facebook.com/settings/ad-accounts
   - Create a test account with $0 spend cap
4. **Monitor spend** - Meta charges real money!
5. **Version control** - never commit `.env` file to git (already in .gitignore)

---

## Resources

- Meta Marketing API docs: https://developers.facebook.com/docs/marketing-apis
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Business Settings: https://business.facebook.com/settings
- Ads Manager: https://adsmanager.facebook.com/adsmanager/
