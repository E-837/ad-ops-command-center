# 🧪 Test API Quick Reference

**Which platforms can you test with real test APIs?**

---

## ✅ Full Test API Support (Recommended for Testing)

These platforms offer **complete test/sandbox environments** that work like production but don't spend real money:

### 1. **Google Ads** ✅
- **Test Type:** Test Accounts (real API, no spending)
- **Setup Time:** 15 minutes
- **Difficulty:** Medium
- **What You Get:** Full API access, test campaigns, mock impressions
- **How:** Create test MCC with `?testAccount=true` URL parameter
- **Status:** ✅ **READY TO USE** - We already have test account configured!
  - Test MCC: `423-867-5619`
  - Test Client: `298-013-9280`

### 2. **Meta Ads (Facebook/Instagram)** ✅
- **Test Type:** Test Ad Accounts
- **Setup Time:** 10 minutes
- **Difficulty:** Easy
- **What You Get:** Test ad account with simulated performance
- **How:** Create test ad account in Business Manager
- **Status:** Ready to configure

### 3. **Pinterest Ads** ✅
- **Test Type:** Sandbox Mode (API parameter)
- **Setup Time:** 5 minutes
- **Difficulty:** Easy
- **What You Get:** Mock data responses, full API access
- **How:** Add `?sandbox=true` to API calls or set `PINTEREST_SANDBOX_MODE=true`
- **Status:** Ready to configure

### 4. **Microsoft Ads (Bing)** ✅
- **Test Type:** Dedicated Sandbox Environment
- **Setup Time:** 20 minutes
- **Difficulty:** Medium
- **What You Get:** Separate sandbox with full functionality
- **How:** Sign up for sandbox access, use sandbox endpoint
- **Status:** Ready to configure

### 5. **Amazon DSP** ✅
- **Test Type:** Built-in Mock Mode
- **Setup Time:** 0 minutes (already works!)
- **Difficulty:** None
- **What You Get:** Realistic mock data, no API needed
- **How:** Just use it - works out of the box
- **Status:** ✅ **WORKS NOW** - No setup needed!

---

## ⚠️ Limited Test Support (Requires Approval/Partnership)

These platforms have limited test access or require approval:

### 6. **LinkedIn Ads** ⚠️
- **Test Type:** Development Mode
- **Setup Time:** Variable (approval required)
- **Difficulty:** Hard
- **What You Get:** Limited testing with your own account
- **Limitation:** Requires LinkedIn partnership or developer application
- **Status:** Available but restricted

### 7. **TikTok Ads** ⚠️
- **Test Type:** Sandbox (approval required)
- **Setup Time:** Variable (approval process)
- **Difficulty:** Hard
- **What You Get:** Sandbox access after approval
- **Limitation:** Must apply for Marketing API access first
- **Status:** Available after approval

---

## 🎯 Recommended Testing Approach

**For immediate UI testing (no API setup needed):**
```bash
npm start
# All connectors use mock data automatically - works perfectly!
```

**For testing with real APIs:**

**Week 1 Priority (Easiest to set up):**
1. ✅ **Amazon DSP** - Already works (mock mode)
2. ✅ **Google Ads** - Already configured! (test account: 423-867-5619)
3. **Pinterest Ads** - 5 minutes to set up sandbox mode
4. **Meta Ads** - 10 minutes to create test ad account

**Week 2 Priority (More involved):**
5. **Microsoft Ads** - 20 minutes for sandbox setup
6. **LinkedIn Ads** - Apply for developer access (may take days)
7. **TikTok Ads** - Apply for Marketing API (may take weeks)

---

## 📋 What Works Right Now (No Setup)

**Without any API configuration, you can:**

✅ Test the entire UI (all 11 pages)  
✅ Create campaigns (stored locally in SQLite)  
✅ Run workflows (using mock connector data)  
✅ View analytics and reports (mock data)  
✅ Test real-time updates (SSE works locally)  
✅ Execute all 10 workflow templates  
✅ Use all 7 AI agents (with mock platform data)  
✅ Test mobile responsive design  
✅ Run all 150+ test suites  

**The platform is fully functional for development/testing without any API keys!**

---

## 🚀 Quick Setup: Enable Test APIs

**Step 1: Check Current Status**
```bash
npm run verify:tests
```

**Step 2: Configure Test Credentials**

Create `config/.env.test`:
```bash
copy config\.env.example config\.env.test
```

**Step 3: Add Credentials for Platforms You Want to Test**

See `TEST-ENVIRONMENTS-GUIDE.md` for detailed setup for each platform.

**Step 4: Verify Configuration**
```bash
npm run verify:tests
```

**Step 5: Test Individual Connectors**
```bash
npm run test:google-ads
npm run test:meta-ads
npm run test:pinterest
# etc.
```

**Step 6: Test All Connectors**
```bash
npm run test:connectors
```

---

## 💡 Key Insights

### **Mock Data is Production-Quality**
All our connectors have **realistic mock data** that matches real API response structures. This means:
- You can build and test the entire UI without any API keys
- Workflows execute end-to-end using mock data
- Tests validate connector interfaces work correctly
- When you add real credentials, everything "just works"

### **Test APIs = Confidence**
Real test APIs (Google Ads, Meta, etc.) give you:
- Confidence that API integration works
- Ability to test edge cases (rate limits, errors, etc.)
- Realistic performance characteristics
- Validation of OAuth flows

### **You Don't Need All of Them**
For most testing, **1-2 test APIs are enough** to validate:
- Connector architecture works
- OAuth flows function correctly
- Error handling is robust
- UI displays real data properly

Start with **Google Ads** (already configured!) and **Pinterest** (easiest to set up).

---

## 📖 Detailed Guides

- **Full setup instructions:** `TEST-ENVIRONMENTS-GUIDE.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **UI testing:** `QUICK-START-UI-TESTING.md`

---

## ✅ Bottom Line

**TL;DR:**
- ✅ **UI works now** - No API setup needed
- ✅ **Google Ads test API** - Already configured!
- ✅ **4 more platforms** - Easy to set up (5-20 min each)
- ⚠️ **2 platforms** - Require approval (LinkedIn, TikTok)
- 🎯 **Recommendation:** Start with Google Ads (works now!) + Pinterest (5 min setup)

**Everything is ready to test! 🚀**
