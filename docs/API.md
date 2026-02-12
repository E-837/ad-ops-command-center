# API Reference

Complete API documentation for the Digital Advertising Command platform.

## Base URL

```
http://localhost:3002/api
```

## Response Format

All API responses follow a standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Error Codes

| Status Code | Error Class | Description |
|------------|-------------|-------------|
| 400 | ValidationError | Invalid request parameters |
| 401 | UnauthorizedError | Authentication required |
| 403 | ForbiddenError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 429 | RateLimitError | Too many requests |
| 500 | AppError | Internal server error |
| 502 | APIError | External API error |

---

## Campaigns

### List Campaigns

```http
GET /api/campaigns
```

**Query Parameters:**
- `platform` (string) - Filter by platform (meta-ads, google-ads, etc.)
- `status` (string) - Filter by status (active, paused, completed)
- `limit` (number) - Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "camp-123",
      "name": "Summer Sale 2024",
      "platform": "meta-ads",
      "status": "active",
      "budget": 5000,
      "spend": 3245.67,
      "impressions": 125340,
      "clicks": 3421,
      "conversions": 87
    }
  ]
}
```

### Get Campaign by ID

```http
GET /api/campaigns/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp-123",
    "name": "Summer Sale 2024",
    "platform": "meta-ads",
    "status": "active",
    "budget": 5000,
    "startDate": "2024-06-01",
    "endDate": "2024-08-31",
    "metadata": { ... }
  }
}
```

### Create Campaign

```http
POST /api/campaigns
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Fall Campaign 2024",
  "platform": "google-ads",
  "budget": 10000,
  "startDate": "2024-09-01",
  "endDate": "2024-11-30"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "camp-456",
    "name": "Fall Campaign 2024",
    "status": "draft",
    "createdAt": "2024-02-12T06:00:00Z"
  },
  "meta": {
    "resourceId": "camp-456",
    "created": true
  }
}
```

### Update Campaign

```http
PATCH /api/campaigns/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "paused",
  "budget": 12000
}
```

---

## Analytics

### Get Campaign Analytics

```http
GET /api/analytics/campaigns/:id
```

**Query Parameters:**
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)
- `metrics` (array) - Metrics to include (spend, impressions, clicks, conversions)

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp-123",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "metrics": {
      "impressions": 1250340,
      "clicks": 34210,
      "spend": 8543.21,
      "conversions": 870,
      "ctr": 2.73,
      "cpc": 0.25,
      "cpa": 9.82,
      "roas": 4.2
    }
  }
}
```

### Get Performance Insights

```http
GET /api/insights
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "anomaly",
        "severity": "high",
        "campaign": "camp-123",
        "metric": "ctr",
        "message": "CTR dropped 45% in last 24 hours",
        "recommendation": "Check ad creative and targeting"
      }
    ]
  }
}
```

---

## Workflows

### List Workflows

```http
GET /api/workflows
```

### Execute Workflow

```http
POST /api/workflows/:id/execute
Content-Type: application/json
```

**Request Body:**
```json
{
  "params": {
    "campaignId": "camp-123",
    "threshold": 0.02
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec-789",
    "workflowId": "wf-optimize",
    "status": "queued",
    "queuedAt": "2024-02-12T06:00:00Z"
  }
}
```

### Get Execution Status

```http
GET /api/executions/:id
```

---

## Connectors

### List Connectors

```http
GET /api/connectors
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectors": [
      {
        "name": "Meta Ads",
        "connected": true,
        "lastSync": "2024-02-12T06:00:00Z",
        "toolCount": 8
      },
      {
        "name": "Google Ads",
        "connected": true,
        "lastSync": "2024-02-12T05:55:00Z",
        "toolCount": 12
      }
    ]
  }
}
```

### Test Connector

```http
GET /api/connectors/:name/test
```

---

## Real-time Events

### Server-Sent Events (SSE)

```http
GET /api/stream
```

**Query Parameters:**
- `eventTypes` (array) - Filter by event types

**Event Format:**
```
event: campaign_updated
data: {"campaignId":"camp-123","status":"active"}

event: metric_threshold
data: {"campaignId":"camp-456","metric":"ctr","value":0.015}
```

---

## Webhooks

### Register Webhook

```http
POST /api/webhooks
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["campaign_created", "workflow_completed"],
  "secret": "your_webhook_secret"
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `pageSize` (number) - Items per page (default: 25, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 2,
      "pageSize": 25,
      "total": 150,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Burst: 20 requests per second
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Authentication (Planned)

Future authentication will use Bearer tokens:

```http
Authorization: Bearer your_api_token
```

---

## Examples

### cURL

```bash
# Get campaigns
curl http://localhost:3002/api/campaigns

# Create campaign
curl -X POST http://localhost:3002/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","platform":"meta-ads","budget":5000}'

# Get analytics
curl "http://localhost:3002/api/analytics/campaigns/camp-123?startDate=2024-01-01&endDate=2024-01-31"
```

### JavaScript (Fetch)

```javascript
// Get campaigns
const campaigns = await fetch('http://localhost:3002/api/campaigns')
  .then(r => r.json());

// Create campaign
const newCampaign = await fetch('http://localhost:3002/api/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Campaign',
    platform: 'meta-ads',
    budget: 5000
  })
}).then(r => r.json());
```

---

For more details, see the [Architecture Documentation](ARCHITECTURE.md).
