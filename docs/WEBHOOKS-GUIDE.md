# Webhooks Integration Guide

Complete guide to implementing webhooks for Ad Ops Command.

## Overview

Webhooks enable real-time event-driven integrations between Ad Ops Command and external systems. Supports both inbound (receiving) and outbound (sending) webhooks with HMAC-SHA256 signature verification.

---

## Webhook Types

### Outbound Webhooks

Send events from Ad Ops Command to external systems.

**Use Cases:**
- Notify Slack when workflows complete
- Trigger external automation on campaign events
- Send data to analytics platforms
- Update project management tools

### Inbound Webhooks

Receive events from external systems to trigger workflows.

**Use Cases:**
- Trigger workflows from external schedulers
- Receive alerts from ad platforms
- Process third-party notifications
- Accept manual triggers via HTTP

---

## Setup

### 1. Create an Outbound Webhook

**Via UI:**
1. Navigate to **Integrations** → **Webhooks**
2. Click **+ Add Webhook**
3. Fill in details:
   - **Name:** Descriptive name
   - **URL:** External endpoint URL
   - **Direction:** Outbound
   - **Events:** List of events to listen for (or `*` for all)
   - **Secret:** Auto-generated or custom

**Via API:**
```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Notifications",
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "direction": "outbound",
    "events": ["workflow.completed", "campaign.alert"],
    "enabled": true
  }'
```

### 2. Create an Inbound Webhook

```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "External Trigger",
    "url": "http://localhost:3002/api/webhooks/incoming/YOUR-ID",
    "direction": "inbound",
    "events": ["*"],
    "enabled": true
  }'
```

**Note:** The secret will be auto-generated. Save it for signature verification.

---

## Event Types

### Workflow Events

- `workflow.completed` - Workflow finished successfully
- `workflow.failed` - Workflow failed
- `workflow.started` - Workflow execution began
- `workflow.paused` - Workflow paused
- `workflow.resumed` - Workflow resumed

### Campaign Events

- `campaign.created` - New campaign created
- `campaign.updated` - Campaign modified
- `campaign.alert` - Budget or performance alert
- `campaign.pacing` - Budget pacing warning

### Performance Events

- `performance.anomaly` - Anomaly detected in metrics
- `performance.threshold` - Metric crossed threshold

### Wildcard

- `*` - All events

---

## Payload Structure

### Outbound Webhook Payload

```json
{
  "event": "workflow.completed",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "data": {
    "workflowId": "wow-report",
    "workflowName": "Week-over-Week Report",
    "projectId": "proj-123",
    "projectName": "Google Ads Campaign",
    "executionTime": 45,
    "status": "success",
    "output": {
      "report": "Generated successfully"
    }
  }
}
```

### Inbound Webhook Request

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 signature>
```

**Body:**
```json
{
  "event": "external.trigger",
  "data": {
    "source": "cron-job",
    "action": "run-weekly-report"
  }
}
```

---

## Signature Verification

### Generating Signatures (Outbound)

Ad Ops Command automatically signs all outbound webhook payloads:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhook.secret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

**Sent in header:**
```
X-Webhook-Signature: 5d41402abc4b2a76b9719d911017c592
```

### Verifying Signatures (Inbound)

**Your server receiving webhooks:**

```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Express route example
app.post('/webhook', (req, res) => {
  if (!verifyWebhook(req, process.env.WEBHOOK_SECRET)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  res.json({ received: true });
});
```

---

## Retry Logic

Outbound webhooks automatically retry on failure:

- **Max Attempts:** 3
- **Backoff:** Exponential (1s, 2s, 4s)
- **Success Codes:** 2xx status codes
- **Failure:** Logged in delivery log

**Delivery Log:**
```json
{
  "id": "delivery-123",
  "webhookId": "webhook-456",
  "eventType": "workflow.completed",
  "status": "success",
  "responseData": {
    "attempts": 1,
    "status": 200
  },
  "createdAt": "2025-01-15T14:30:05.000Z"
}
```

---

## Testing Webhooks

### Test via UI

1. Go to **Integrations** → **Webhooks**
2. Click **🧪 Test** button on any webhook
3. A test payload will be sent immediately

### Test via API

```bash
curl -X POST http://localhost:3002/api/webhooks/{webhook-id}/test
```

**Test Payload:**
```json
{
  "event": "test",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "data": {
    "message": "Test webhook delivery"
  }
}
```

---

## Integration Examples

### Example 1: Slack Notifications

**Create Slack Webhook:**
1. Go to https://api.slack.com/messaging/webhooks
2. Create an Incoming Webhook for your workspace
3. Copy the webhook URL

**Configure in Ad Ops:**
```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack - Campaign Alerts",
    "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
    "direction": "outbound",
    "events": ["workflow.completed", "campaign.alert"]
  }'
```

**Slack will receive:**
```json
{
  "event": "workflow.completed",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "data": {
    "workflowName": "Weekly Report",
    "status": "success"
  }
}
```

### Example 2: Trigger Workflow from External Cron

**1. Create Inbound Webhook:**
```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cron Trigger",
    "direction": "inbound",
    "events": ["external.trigger"]
  }'
```

**Save the webhook ID and secret from response.**

**2. Configure Event Trigger:**

Create a workflow trigger that listens to `webhook.external.trigger`:

```javascript
// In events/triggers.js
eventTriggers.registerTrigger({
  event: 'webhook.external.trigger',
  workflowId: 'daily-sync',
  condition: (event) => event.payload.action === 'run-daily-sync'
});
```

**3. Send from External System:**
```bash
curl -X POST http://localhost:3002/api/webhooks/incoming/{webhook-id} \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: {calculated-signature}" \
  -d '{
    "event": "external.trigger",
    "data": {
      "action": "run-daily-sync"
    }
  }'
```

---

## Best Practices

### Security

1. **Always verify signatures** on inbound webhooks
2. **Use HTTPS** in production
3. **Rotate secrets** periodically
4. **Whitelist IPs** if possible
5. **Rate limit** incoming webhooks

### Reliability

1. **Implement idempotency** - Handle duplicate deliveries
2. **Respond quickly** - Return 200 within 5 seconds
3. **Process async** - Queue heavy work for background processing
4. **Log everything** - Track all webhook events

### Performance

1. **Batch notifications** when possible
2. **Use filters** to reduce noise
3. **Monitor delivery logs** for failures
4. **Set appropriate timeouts**

---

## API Reference

### List Webhooks

```
GET /api/webhooks
```

**Query Params:**
- `direction` - Filter by direction (`inbound` or `outbound`)
- `enabled` - Filter by enabled status (`true` or `false`)

### Get Webhook

```
GET /api/webhooks/{id}
```

### Create Webhook

```
POST /api/webhooks
```

**Body:**
```json
{
  "name": "string",
  "url": "string",
  "secret": "string (optional)",
  "direction": "inbound | outbound",
  "events": ["array of event types"],
  "enabled": boolean
}
```

### Update Webhook

```
PATCH /api/webhooks/{id}
```

### Delete Webhook

```
DELETE /api/webhooks/{id}
```

### Get Delivery Log

```
GET /api/webhooks/{id}/deliveries?limit=100
```

### Send Incoming Webhook

```
POST /api/webhooks/incoming/{id}
```

**Headers:**
```
X-Webhook-Signature: <signature>
```

---

## Troubleshooting

### Webhook Not Firing

1. Check webhook is **enabled**
2. Verify **event types** match
3. Check **delivery log** for errors
4. Test with **🧪 Test** button

### Signature Verification Failing

1. Ensure payload is **not modified** before signing
2. Use exact **JSON string** (including spacing)
3. Check **secret** is correct
4. Verify **HMAC-SHA256** algorithm

### Delivery Failures

1. Check **target URL** is accessible
2. Verify **SSL certificate** (if HTTPS)
3. Review **retry logs** in delivery history
4. Check **timeout settings**

---

## Support

For issues or questions:
- Review delivery logs in UI
- Enable debug logging
- Check system health at `/api/health`
