# 🎯 Meta Ads Test Account Setup - Quick Guide

**Goal:** Create campaigns in Ad Ops Command Center → See them in Meta Ads Manager UI

**Time Needed:** ~10-15 minutes

---

## 📋 What You'll Need

- Facebook account with Business Manager access
- 10-15 minutes
- Browser

---

## 🚀 Step-by-Step Setup

### **Step 1: Create/Access Business Manager** (2 min)

1. Go to https://business.facebook.com/
2. If you don't have Business Manager:
   - Click "Create Account"
   - Fill in business name, your name, business email
   - Click "Submit"
3. If you already have it, just log in

---

### **Step 2: Create Facebook App** (3 min)

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in:
   - **App name:** "Ad Ops Command Center"
   - **Contact email:** Your email
   - **Business Manager account:** Select yours
5. Click **"Create App"**
6. **Save your App ID and App Secret:**
   - Go to Settings → Basic
   - Copy **App ID**
   - Click "Show" next to App Secret and copy it

---

### **Step 3: Add Marketing API to Your App** (1 min)

1. In your app dashboard, scroll to "Add Products"
2. Find **"Marketing API"**
3. Click **"Set Up"**
4. It will be added to your app

---

### **Step 4: Create Test Ad Account** (2 min)

1. Go back to Business Manager: https://business.facebook.com/
2. Click the **menu icon** (☰) → **Business Settings**
3. In left sidebar, under "Accounts", click **"Ad Accounts"**
4. Click **"Add"** → **"Create a new ad account"**
5. Fill in:
   - **Ad account name:** "Test Ad Account - Command Center"
   - **Time zone:** America/New_York
   - **Currency:** USD (US Dollar)
   - ✅ **CHECK THIS BOX:** "This is a test ad account"
6. Click **"Next"** → **"Create Ad Account"**
7. **Copy the Ad Account ID** from the URL (format: `act_1234567890`)

---

### **Step 5: Get Access Token** (3 min)

**Option A: Graph API Explorer (Easiest)**

1. Go to https://developers.facebook.com/tools/explorer/
2. In top right:
   - **Application:** Select your "Ad Ops Command Center" app
   - **User or Page:** Select your user
3. Click **"Generate Access Token"**
4. Grant these permissions when prompted:
   - `ads_management`
   - `ads_read`
   - `business_management`
5. Click **"Get Token"**
6. **IMPORTANT:** Click the (i) icon next to the token
7. Click **"Extend Access Token"** at the bottom
8. Copy the **long-lived token** (valid 60 days)

**Option B: Manual OAuth2 Flow**

```bash
# Navigate to project
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command

# Run OAuth helper (if we create one)
node scripts/meta-ads-oauth.js
```

---

### **Step 6: Configure Environment** (1 min)

1. Open `config/.env` in a text editor
2. Add these lines (replace with your actual values):

```env
# Meta Ads Test Account
META_APP_ID=1234567890                              # From Step 2
META_APP_SECRET=abc123def456ghi789                  # From Step 2
META_ACCESS_TOKEN=EAABsbCS1iHgBO...                 # From Step 5 (long-lived token)
META_AD_ACCOUNT_ID=act_9876543210                  # From Step 4
```

3. Save the file

---

### **Step 7: Test the Integration** (2 min)

```bash
# Test Meta Ads connector
npm run test:meta-ads
```

**Expected output:**
```
✅ Connection successful
✅ Test ad account found: act_9876543210
✅ Can create campaigns via API
✅ Test passed!
```

---

### **Step 8: Create Test Campaign from UI** (1 min)

1. Start the server:
   ```bash
   npm start
   ```

2. Open http://localhost:3002

3. Go to **Campaigns** page

4. Click **"+ New Campaign"**

5. Fill in:
   - **Platform:** Meta Ads
   - **Campaign Name:** "[TEST] My First Command Center Campaign"
   - **Objective:** Brand Awareness
   - **Budget:** $50
   - **Start Date:** Tomorrow

6. Click **"Create Campaign"**

7. **VERIFY IN META ADS MANAGER:**
   - Go to https://business.facebook.com/adsmanager
   - Switch to your test ad account (top left dropdown)
   - You should see your campaign there! 🎉

---

## ✅ Success Checklist

After setup, you should be able to:

- [x] Create campaigns in Ad Ops Command Center
- [x] See them instantly in Meta Ads Manager UI
- [x] Edit campaigns in either place
- [x] Pause/resume campaigns from Command Center
- [x] View campaign metrics (simulated for test accounts)
- [x] Test the full integration loop

---

## 🎯 What You'll Demonstrate

**The cool part:** You can now show:

1. **Create campaign in Command Center** → appears in Meta Ads Manager
2. **Change budget in Command Center** → updates in Meta Ads Manager
3. **Pause campaign in Command Center** → paused in Meta Ads Manager
4. **Edit campaign in Meta Ads Manager** → syncs back to Command Center (on next refresh)

This proves the integration actually works end-to-end! 🚀

---

## 🐛 Troubleshooting

### **"Invalid OAuth access token"**
- Access token expired (they last 60 days)
- Solution: Go back to Graph API Explorer and generate new long-lived token

### **"Insufficient permissions"**
- Missing required scopes
- Solution: In Graph API Explorer, make sure you selected `ads_management`, `ads_read`, and `business_management`

### **"Ad account not found"**
- Wrong ad account ID format
- Solution: Make sure it starts with `act_` (e.g., `act_1234567890`)

### **Campaign created but not visible in Meta**
- Using sandbox mode instead of test account
- Solution: Make sure you created a **test ad account** (not sandbox), and you're using production API endpoint

---

## 📝 Notes

- **Test ad accounts** are free and don't require a payment method
- They generate **simulated performance data** (impressions, clicks, etc.)
- You can create multiple test ad accounts if needed
- Access tokens expire after 60 days - you'll need to refresh
- Test campaigns won't serve real ads or spend real money

---

## 🔗 Helpful Links

- Business Manager: https://business.facebook.com/
- Meta for Developers: https://developers.facebook.com/
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Meta Ads Manager: https://business.facebook.com/adsmanager
- Marketing API Docs: https://developers.facebook.com/docs/marketing-apis

---

**Ready for tomorrow! 🎉**

This will be the perfect demo - showing campaigns created via API appearing in the actual Meta platform UI!
