# Week 3 Quick Start Guide

Get up and running with Analytics & Integrations in 5 minutes.

## 📦 Prerequisites

Week 1 + Week 2 must be complete with database initialized.

---

## 🚀 Quick Start

### 1. Run Webhook Migration

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
node -e "const db = require('./database/init'); db.initialize(); const migration = require('./database/migrations/008_create_webhooks'); migration.up(db.getKnex()); console.log('✅ Webhooks table created');"
```

### 2. Start Server

```bash
npm start
```

Or with PM2:
```bash
pm2 start server.js --name ad-ops
```

### 3. Access New Features

Open your browser:

- **Analytics Dashboard:** http://localhost:3002/analytics
- **Reports (Enhanced):** http://localhost:3002/reports
- **Integrations:** http://localhost:3002/integrations

---

## 🧪 Test Everything

### Run Analytics Tests

```bash
node test-analytics.js
```

Expected output:
```
✅ PASSED: Spend trend returned valid data
✅ PASSED: CTR comparison returned valid data
✅ PASSED: Conversion funnel returned valid data
...
📊 Test Summary
✅ Passed: 9
❌ Failed: 0
```

### Run Webhook Tests

```bash
node test-webhooks.js
```

### Run Notification Tests

```bash
node test-notifications.js
```

---

## 📊 Try Analytics

### View Spend Trends

1. Go to http://localhost:3002/reports
2. See 4 live analytics charts
3. Use filters to adjust date range and platforms
4. Click "Export to CSV" to download data

### Platform Comparison

1. Go to http://localhost:3002/analytics
2. View cross-platform performance table
3. Check budget pacing gauges
4. Review top performers and alerts

### API Calls

```bash
# Get spend trend for last 30 days
curl http://localhost:3002/api/analytics/spend-trend?days=30

# Get CTR comparison
curl http://localhost:3002/api/analytics/ctr-comparison?days=30

# Get top 10 campaigns by ROAS
curl http://localhost:3002/api/analytics/roas-by-campaign?limit=10
```

---

## 🔔 Try Webhooks

### Create a Webhook

**Via UI:**
1. Go to http://localhost:3002/integrations
2. Click "Add Webhook"
3. Fill in:
   - Name: "Test Webhook"
   - URL: https://webhook.site/your-unique-url
   - Direction: Outbound
   - Events: `workflow.completed`
4. Click "Save"

**Via API:**
```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/your-unique-url",
    "direction": "outbound",
    "events": ["workflow.completed"]
  }'
```

### Test Webhook

```bash
# Get webhook ID from UI or API response
curl -X POST http://localhost:3002/api/webhooks/{webhook-id}/test
```

Check https://webhook.site to see the test payload!

---

## 📧 Try Notifications

### Send Test Notification

Create a test file: `test-notification-demo.js`

```javascript
const notifications = require('./integrations/notifications');

async function demo() {
  // Send email
  await notifications.sendEmail(
    'your-email@example.com',
    'Test from Ad Ops',
    '<h1>Hello!</h1><p>Analytics system is working.</p>'
  );
  
  // Send Slack (mock)
  await notifications.sendSlack('#campaigns', {
    text: '✅ Weekly report completed',
    attachments: [{
      color: 'good',
      fields: [
        { title: 'ROAS', value: '3.2x', short: true },
        { title: 'Spend', value: '$125,000', short: true }
      ]
    }]
  });
  
  console.log('✅ Notifications sent!');
}

demo();
```

Run it:
```bash
node test-notification-demo.js
```

---

## 🎯 Common Use Cases

### Use Case 1: Daily Performance Report

**Goal:** Send daily report to Slack every morning

**Setup:**
1. Create webhook pointing to Slack
2. Create workflow trigger:
   ```javascript
   cronJobs.registerJob({
     name: 'daily-report',
     schedule: '0 9 * * *', // 9 AM daily
     task: async () => {
       const summary = await analytics.getPerformanceSummary({ days: 1 });
       await notifications.sendSlack('#reports', {
         text: `📊 Daily Report`,
         attachments: [{
           fields: [
             { title: 'Spend', value: `$${summary.data.spend}`, short: true },
             { title: 'Revenue', value: `$${summary.data.revenue}`, short: true },
             { title: 'ROAS', value: `${summary.data.roas.toFixed(2)}x`, short: true }
           ]
         }]
       });
     }
   });
   ```

### Use Case 2: Budget Alert

**Goal:** Alert when campaign budget utilization exceeds 90%

**Setup:**
1. Create workflow that checks budget daily
2. Send notification when threshold met:
   ```javascript
   const utilization = await analytics.getBudgetUtilization({ days: 30 });
   
   for (const platform of utilization.data) {
     if (platform.utilization >= 90) {
       await notifications.sendNotification('campaign.pacing', {
         campaignName: platform.platform,
         budgetUtilization: platform.utilization,
         remaining: platform.remaining
       }, {
         email: ['manager@company.com'],
         slack: ['#budget-alerts']
       });
     }
   }
   ```

### Use Case 3: External Trigger

**Goal:** Trigger workflow from external system

**Setup:**
1. Create inbound webhook
2. Copy webhook ID and secret
3. Send from external system:
   ```bash
   PAYLOAD='{"event":"external.trigger","data":{"action":"run-report"}}'
   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "YOUR_SECRET" | awk '{print $2}')
   
   curl -X POST http://localhost:3002/api/webhooks/incoming/YOUR_WEBHOOK_ID \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Signature: $SIGNATURE" \
     -d "$PAYLOAD"
   ```

---

## 📖 Documentation

- **Analytics API:** `docs/ANALYTICS-API.md`
- **Webhooks Guide:** `docs/WEBHOOKS-GUIDE.md`
- **Notifications Guide:** `docs/NOTIFICATIONS-GUIDE.md`
- **Completion Summary:** `docs/WEEK-3-COMPLETION-SUMMARY.md`

---

## 🔧 Troubleshooting

### Analytics charts not loading

1. Check server is running: `http://localhost:3002/api/health`
2. Open browser console for errors
3. Verify database has metrics data: `node test-database.js`

### Webhook not firing

1. Check webhook is enabled in UI
2. Verify event types match
3. Check delivery log in Integrations page
4. Test with "🧪 Test" button

### Tests failing

1. Ensure database is initialized: `node test-database.js`
2. Run migration: See step 1 above
3. Check Node.js version: `node --version` (should be 14+)

---

## 🎉 You're Ready!

Week 3 features are now live. You have:

✅ Advanced analytics with 8 endpoints  
✅ 4 interactive charts  
✅ Cross-platform dashboards  
✅ Webhook system with signatures  
✅ Multi-channel notifications  
✅ Export capabilities  

Next: Week 4 - AI Agent Integration & Advanced Features

---

**Need help?** Check the documentation or run the test suites for diagnostics.
