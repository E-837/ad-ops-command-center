# Notifications Setup Guide

Configure multi-channel notifications for Ad Ops Command.

## Overview

The notification system supports delivery across multiple channels:
- 📧 **Email** (via SendGrid/SMTP)
- 💬 **Slack** (via Incoming Webhooks)
- 🎮 **Discord** (via Webhooks)
- 📱 **SMS** (via Twilio)

---

## Quick Start

### Send a Notification

```javascript
const notifications = require('./integrations/notifications');

await notifications.sendNotification(
  'workflow.completed',
  {
    workflowName: 'Weekly Report',
    executionTime: '45',
    projectName: 'Google Ads',
    completedAt: new Date().toISOString()
  },
  {
    email: ['user@example.com'],
    slack: ['#campaigns']
  }
);
```

---

## Supported Channels

### Email

**Configuration (Production):**

Set environment variables:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@adops.com
```

**Mock Mode (Development):**

Email notifications are logged to console by default.

**Send Email:**
```javascript
await notifications.sendEmail(
  'user@example.com',
  'Campaign Alert',
  '<h1>Budget Warning</h1><p>Campaign approaching budget limit.</p>'
);
```

---

### Slack

**Setup:**
1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook to workspace
4. Copy Webhook URL

**Configuration:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX
```

**Send Slack Message:**
```javascript
await notifications.sendSlack('#campaigns', {
  text: '✅ Workflow Completed',
  attachments: [{
    color: 'good',
    fields: [
      { title: 'Workflow', value: 'Weekly Report', short: true },
      { title: 'Duration', value: '45s', short: true }
    ]
  }]
});
```

---

### Discord

**Setup:**
1. Go to Server Settings → Integrations → Webhooks
2. Create webhook
3. Copy Webhook URL

**Send Discord Message:**
```javascript
await notifications.sendDiscord('https://discord.com/api/webhooks/...', {
  embeds: [{
    title: '🎯 Campaign Alert',
    description: 'Budget utilization at 95%',
    color: 0xFF9800,
    fields: [
      { name: 'Campaign', value: 'Q1 Brand Awareness', inline: true },
      { name: 'Budget Used', value: '95%', inline: true }
    ],
    timestamp: new Date().toISOString()
  }]
});
```

---

### SMS

**Setup (Twilio):**
```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

**Send SMS:**
```javascript
await notifications.sendSMS('+1234567890', '⚠️ Campaign budget alert');
```

---

## Notification Templates

Templates are HTML files located in `integrations/templates/`.

### Available Templates

1. **workflow-completed.html** - Workflow success notification
2. **workflow-failed.html** - Workflow failure alert
3. **campaign-pacing-alert.html** - Budget pacing warning
4. **anomaly-detected.html** - Performance anomaly notification

### Using Templates

```javascript
const body = notifications.renderTemplate('workflow-completed', {
  workflowName: 'Daily Sync',
  executionTime: '32',
  projectName: 'Meta Campaigns',
  completedAt: '2025-01-15T14:30:00Z',
  output: 'Report generated successfully'
});

await notifications.sendEmail('user@example.com', 'Workflow Complete', body);
```

### Template Variables

**workflow-completed:**
- `{{workflowName}}`
- `{{executionTime}}`
- `{{projectName}}`
- `{{completedAt}}`
- `{{output}}`

**workflow-failed:**
- `{{workflowName}}`
- `{{error}}`
- `{{projectName}}`
- `{{failedAt}}`

**campaign-pacing-alert:**
- `{{campaignName}}`
- `{{platform}}`
- `{{budgetUtilization}}`
- `{{budget}}`
- `{{spent}}`
- `{{remaining}}`
- `{{recommendation}}`

**anomaly-detected:**
- `{{campaignName}}`
- `{{anomalyType}}`
- `{{detectedAt}}`
- `{{description}}`
- `{{metricName}}`
- `{{currentValue}}`
- `{{expectedValue}}`
- `{{deviation}}`
- `{{action}}`

---

## Event-Based Notifications

### Automatic Workflow Notifications

Notifications are automatically triggered on workflow events via the event bus:

```javascript
// Automatically sends when workflow completes
eventBus.emit('workflow.completed', {
  workflowName: 'Daily Report',
  projectId: 'proj-123',
  executionTime: 45,
  status: 'success'
});
```

### Configure Per-Project Notifications

**Via Database:**

Update `projects` table:
```javascript
projects.update('proj-123', {
  notificationChannels: ['email', 'slack'],
  notificationRecipients: {
    email: ['manager@example.com', 'team@example.com'],
    slack: ['#campaigns', '#alerts']
  }
});
```

**When workflow runs**, notifications will be sent to configured recipients.

---

## Custom Notifications

### Create Custom Template

**1. Create HTML template:**

`integrations/templates/custom-alert.html`
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .alert { background: #fff3e0; padding: 20px; border-left: 4px solid #FF9800; }
  </style>
</head>
<body>
  <div class="alert">
    <h2>{{title}}</h2>
    <p>{{message}}</p>
  </div>
</body>
</html>
```

**2. Send notification:**
```javascript
const body = notifications.renderTemplate('custom-alert', {
  title: 'Custom Alert',
  message: 'This is a custom notification'
});

await notifications.sendEmail('user@example.com', 'Custom Alert', body);
```

---

## Multi-Channel Broadcasting

Send to multiple channels simultaneously:

```javascript
await notifications.sendNotification(
  'campaign.pacing',
  {
    campaignName: 'Q1 Brand',
    budgetUtilization: 95,
    recommendation: 'Pause non-essential keywords'
  },
  {
    email: ['manager@example.com'],
    slack: ['#budget-alerts'],
    discord: ['https://discord.com/api/webhooks/...'],
    sms: ['+1234567890']
  }
);
```

**Returns:**
```javascript
[
  { success: true, channel: 'email', recipient: 'manager@example.com' },
  { success: true, channel: 'slack', recipient: '#budget-alerts' },
  { success: true, channel: 'discord', recipient: 'https://discord.com/...' },
  { success: true, channel: 'sms', recipient: '+1234567890' }
]
```

---

## Best Practices

### 1. Rate Limiting

Avoid notification spam:
```javascript
// Batch multiple alerts
const alerts = [];
// ... collect alerts ...
if (alerts.length > 0) {
  await notifications.sendNotification('daily.summary', { alerts });
}
```

### 2. Prioritization

Use different channels for different priorities:
- **Critical:** Email + SMS + Slack
- **Warning:** Email + Slack
- **Info:** Slack only

### 3. Quiet Hours

Respect user preferences:
```javascript
const hour = new Date().getHours();
if (hour >= 9 && hour <= 17) {
  // Business hours - send notifications
}
```

### 4. Unsubscribe

Always include unsubscribe links in emails:
```html
<a href="{{unsubscribeUrl}}">Unsubscribe</a>
```

---

## Testing

### Test Individual Channels

```javascript
// Test email
await notifications.sendEmail('test@example.com', 'Test', 'Test message');

// Test Slack
await notifications.sendSlack('#test', { text: 'Test message' });

// Test Discord
await notifications.sendDiscord(webhookUrl, { content: 'Test message' });

// Test SMS
await notifications.sendSMS('+1234567890', 'Test message');
```

### Run Test Suite

```bash
node test-notifications.js
```

---

## Production Setup

### Email (SendGrid)

1. Create SendGrid account: https://sendgrid.com
2. Get API key
3. Set environment variables:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

4. Update code:
```javascript
// In integrations/notifications.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html
  };
  
  await sgMail.send(msg);
  return { success: true, channel: 'email', recipient: to };
}
```

### SMS (Twilio)

1. Create Twilio account: https://twilio.com
2. Get credentials
3. Set environment variables:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_FROM_NUMBER=+1234567890
```

4. Update code:
```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(to, message) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to
  });
  return { success: true, channel: 'sms', recipient: to };
}
```

---

## Troubleshooting

### Email Not Sending

1. Check **EMAIL_PROVIDER** environment variable
2. Verify **API key** is valid
3. Check **spam folder**
4. Review **SendGrid logs**

### Slack Message Not Appearing

1. Verify **webhook URL** is correct
2. Check **channel permissions**
3. Test webhook with **curl**:
```bash
curl -X POST https://hooks.slack.com/services/... \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}'
```

### SMS Not Delivered

1. Verify **phone number format** (+1234567890)
2. Check **Twilio account balance**
3. Review **Twilio logs**
4. Ensure number is **verified** (sandbox mode)

---

## Support

For issues:
- Review notification logs
- Test individual channels
- Check environment variables
- Verify API credentials
