# 🚀 Quick Start: UI Testing Guide

**Last Updated:** February 11, 2026  
**Purpose:** Get the Ad Ops Command Center UI up and running for local testing

---

## ⚡ Fast Track (TL;DR)

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command

# Install dependencies (if not already installed)
npm install

# Start the server
npm start

# Open in browser
# http://localhost:3002
```

**That's it!** The UI will work without any API keys for testing the interface.

---

## 📋 Step-by-Step Instructions

### 1️⃣ **Navigate to Project Directory**

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
```

### 2️⃣ **Install Dependencies** (First Time Only)

```bash
npm install
```

**Dependencies installed:**
- `express` - Web server
- `knex` + `sqlite3` - Database
- `node-cron` - Scheduled tasks
- `uuid` - ID generation

### 3️⃣ **Initialize Database** (First Time Only)

```bash
npm run migrate
```

This creates the SQLite database with all tables.

### 4️⃣ **Start the Server**

**Option A: Standard mode**
```bash
npm start
```

**Option B: Development mode (auto-restart on file changes)**
```bash
npm run dev
```

**Expected output:**
```
🚀 Digital Advertising Command Server
📍 http://localhost:3002
🗄️  Database: ad-ops-command.db
🎯 Mode: development
✅ Server started successfully
```

### 5️⃣ **Open in Browser**

Visit: **http://localhost:3002**

**Available pages:**
- 📈 Dashboard - `/dashboard.html` or `/`
- 📋 Campaigns - `/campaigns.html`
- 💡 Analytics - `/analytics.html`
- 🤖 Agents - `/agents.html`
- 💬 Query - `/query.html`
- 🏗️ Architecture - `/architecture.html`
- 🔌 Connectors - `/connectors.html`
- 🔄 Workflows - `/workflows.html`
- 📊 Reports - `/reports.html`
- 📁 Projects - `/projects.html`
- 🎛️ Integration Hub - `/integrations.html`

---

## 🎨 What You'll See

### **Dashboard (Home)**
- Live system status
- Real-time metrics
- Recent campaign activity
- Quick actions panel
- System health indicators

### **Campaigns**
- All campaigns across platforms
- Filter by platform, status, date
- Performance metrics
- Quick actions (pause, edit, duplicate)

### **Analytics**
- Cross-platform metrics aggregation
- Charts powered by Chart.js
- Real-time updates via SSE
- Date range filtering
- Export capabilities

### **Agents**
- 7 specialized AI agents status
- Agent capabilities and expertise
- Recent agent actions
- Agent performance metrics

### **Workflows**
- 10 pre-built workflow templates
- Workflow execution history
- Real-time progress tracking
- Template customization

### **Connectors**
- 7 platform integrations (Google, Meta, Pinterest, Microsoft, LinkedIn, TikTok, Amazon)
- Connection status
- Sync settings
- API health checks

---

## 🔧 Testing Without API Keys

The UI works in **demo mode** without any connector API keys configured:

✅ **What works:**
- Full UI navigation
- Dashboard displays
- Mock data visualization
- Template previews
- Agent interface
- Workflow templates
- Real-time updates (SSE)
- Database operations
- Local campaign management

❌ **What needs API keys:**
- Live campaign syncing from platforms
- Creating campaigns on real platforms
- Fetching real performance data
- Cross-platform operations

**For UI testing, you don't need API keys!** The platform uses local database and mock data.

---

## 🧪 Running Tests

### **Full Test Suite** (150+ tests)
```bash
npm test
```

### **Database Tests**
```bash
npm run test:db
```

### **Real-time Updates (SSE) Tests**
```bash
npm run test:realtime
```

### **Integration Tests**
```bash
node test-integration.js
```

### **Performance Tests**
```bash
node test-performance.js
```

### **Error Handling Tests**
```bash
node test-error-handling.js
```

---

## 🛠️ Optional: Configure API Keys

If you want to test real platform integrations:

### **1. Copy Environment Template**
```bash
copy config\.env.example .env
```

### **2. Edit `.env` File**
Add your API credentials for any platforms you want to test:

**Google Ads:**
```env
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
GOOGLE_ADS_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

**Meta Ads:**
```env
META_APP_ID=your_app_id
META_APP_SECRET=your_secret
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=act_1234567890
```

**Microsoft Ads:**
```env
MICROSOFT_ADS_CLIENT_ID=your_azure_client_id
MICROSOFT_ADS_CLIENT_SECRET=your_azure_secret
MICROSOFT_ADS_REFRESH_TOKEN=your_refresh_token
MICROSOFT_ADS_DEVELOPER_TOKEN=BBD37VB98
MICROSOFT_ADS_ACCOUNT_ID=123456789
```

**Other Platforms:** See `.env.example` for all available platforms

### **3. Restart Server**
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

---

## 📱 Mobile Testing

The UI is **fully responsive** and mobile-optimized:

### **Test on Mobile Devices:**

**Option 1: Find your local IP**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Option 2: Access from mobile**
On your phone's browser, visit:
```
http://192.168.1.100:3002
```
(Replace with your actual IP)

### **Mobile Features:**
- ✅ Hamburger menu
- ✅ Touch-optimized buttons
- ✅ Responsive tables
- ✅ Swipeable cards
- ✅ Optimized charts

---

## 🎯 Key Features to Test

### **Real-time Updates (SSE)**
1. Open Dashboard in two browser windows side-by-side
2. Create a workflow or campaign in one window
3. Watch it appear instantly in the other window
4. No page refresh needed!

### **Workflows**
1. Go to Workflows page
2. Select a template (e.g., "Cross-Platform Campaign")
3. Click "Execute"
4. Watch real-time progress bar
5. See completion notifications

### **Analytics**
1. Go to Analytics page
2. Select date range
3. Filter by platform
4. Watch charts update
5. Export data as JSON

### **Agents**
1. Go to Agents page
2. See 7 specialized agents
3. View agent expertise
4. Check recent actions

### **Templates**
1. Go to Workflows → Templates tab
2. Preview 10 built-in templates
3. See template structure
4. Test template execution

---

## 🐛 Troubleshooting

### **Port 3002 Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solutions:**

**Option 1: Use different port**
```bash
set PORT=3003
npm start
```
Then visit: http://localhost:3003

**Option 2: Kill existing process**
```bash
netstat -ano | findstr :3002
taskkill /PID <PID_NUMBER> /F
```

### **Database Error**

**Error:**
```
SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
```bash
# Create database directory
mkdir database

# Run migrations
npm run migrate
```

### **Dependencies Not Found**

**Error:**
```
Cannot find module 'express'
```

**Solution:**
```bash
npm install
```

### **Server Won't Start**

**Checklist:**
- [ ] Are you in the correct directory?
- [ ] Did you run `npm install`?
- [ ] Is port 3002 available?
- [ ] Is Node.js v18+ installed? (`node --version`)

---

## 📊 Performance Targets

When testing, the UI should meet these benchmarks:

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response | <500ms | Open DevTools → Network tab |
| Page Load | <2s | First Contentful Paint |
| SSE Latency | <10ms | Real-time update delay |
| Database Query | <100ms | Check server logs |

---

## 🎨 UI Theme

**Dark Glass-morphism Theme:**
- Dark backgrounds with glass effect
- Gradient accents (blue/purple)
- Smooth animations
- Responsive design
- WCAG 2.1 AA accessible

**Typography:**
- Headers: `Geist`, `Poppins`, `Inter`
- Body: System fonts stack

**Colors:**
- Primary: `#4f46e5` (Indigo)
- Secondary: `#06b6d4` (Cyan)
- Accent: `#8b5cf6` (Purple)
- Background: `#0f172a` (Slate)

---

## 📝 Notes

- **No backend required** for UI testing - everything runs locally
- **SQLite database** stores all data in `database/ad-ops-command.db`
- **Server-Sent Events (SSE)** provides real-time updates without polling
- **Template workflows** demonstrate full platform capabilities
- **Mock data** pre-populated for immediate testing

---

## ✅ Testing Checklist

Before reporting issues, verify:

- [ ] Server running (`npm start`)
- [ ] Browser at http://localhost:3002
- [ ] No console errors (F12 → Console tab)
- [ ] Dependencies installed (`npm install`)
- [ ] Database initialized (`npm run migrate`)
- [ ] Correct Node.js version (`node --version` >= 18)

---

## 🚀 Next Steps After UI Testing

Once you've confirmed the UI works:

1. **Run test suites** to verify functionality
2. **Configure API keys** for live platform testing
3. **Deploy to production** using deployment guides
4. **Set up monitoring** per monitoring guide
5. **Review documentation** in `docs/` folder

**Key Documentation:**
- `DEPLOYMENT-GUIDE.md` - Production deployment
- `MONITORING-GUIDE.md` - System monitoring
- `TROUBLESHOOTING.md` - Common issues
- `PRODUCTION-LAUNCH-GUIDE.md` - Complete launch handbook

---

## 💬 Need Help?

If you encounter issues:

1. Check `TROUBLESHOOTING.md` in `docs/` folder
2. Review server console output
3. Check browser console (F12)
4. Verify all prerequisites met
5. Review this guide's troubleshooting section

---

**Ready to test! 🎉**

Start the server with `npm start` and open http://localhost:3002 in your browser!
