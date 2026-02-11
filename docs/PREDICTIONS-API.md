# Predictions API Reference

API documentation for predictive analytics endpoints.

## Overview

The Predictions API provides:
- **Performance forecasting** - Predict metrics with proposed budget changes
- **Budget optimization** - Optimal allocation across platforms
- **Trend analysis** - Detect metric trends and campaign health

## Endpoints

### POST /api/predictions/performance

Forecast campaign performance with a proposed budget.

**Request:**
```json
{
  "campaignId": 123,
  "proposedBudget": 15000
}
```

**Response:**
```json
{
  "campaignId": 123,
  "proposedBudget": 15000,
  "projectionPeriod": "30 days",
  "predictions": {
    "conversions": 450,
    "revenue": 27000,
    "impressions": 450000,
    "clicks": 13500,
    "roas": 1.8,
    "cpa": 33.33,
    "ctr": 3.0
  },
  "baseline": {
    "dailySpend": 333.33,
    "dailyConversions": 10,
    "dailyRevenue": 600
  },
  "budgetRatio": 1.5,
  "diminishingFactor": 0.85,
  "confidence": 0.8,
  "dataPoints": 30
}
```

**Fields:**
- `predictions` - Forecasted metrics for 30-day period
- `baseline` - Current daily averages
- `budgetRatio` - Proposed budget / current spend
- `diminishingFactor` - Efficiency adjustment for budget increase
- `confidence` - 0.2-0.8 based on data volume
- `dataPoints` - Number of historical days used

**Error Response:**
```json
{
  "error": "Insufficient historical data",
  "confidence": 0
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `500` - Server error

---

### POST /api/predictions/budget-allocation

Optimize budget distribution across platforms.

**Request:**
```json
{
  "totalBudget": 10000,
  "platforms": ["meta", "google", "tiktok", "pinterest"]
}
```

**Response:**
```json
{
  "totalBudget": 10000,
  "allocations": [
    {
      "platform": "meta",
      "recommended": 4500,
      "percentage": "45.0",
      "currentROAS": 3.2,
      "projectedROAS": 2.9,
      "historicalSpend": 3200
    },
    {
      "platform": "google",
      "recommended": 3000,
      "percentage": "30.0",
      "currentROAS": 2.5,
      "projectedROAS": 2.4,
      "historicalSpend": 2100
    },
    {
      "platform": "tiktok",
      "recommended": 1500,
      "percentage": "15.0",
      "currentROAS": 1.8,
      "projectedROAS": 1.7,
      "historicalSpend": 800
    },
    {
      "platform": "pinterest",
      "recommended": 1000,
      "percentage": "10.0",
      "currentROAS": 1.5,
      "projectedROAS": 1.4,
      "historicalSpend": 400
    }
  ],
  "rationale": "Optimized allocation based on historical ROAS and diminishing returns",
  "confidence": 0.75
}
```

**Fields:**
- `allocations` - Recommended budget per platform (sorted by amount)
- `recommended` - Dollar amount to allocate
- `percentage` - Percentage of total budget
- `currentROAS` - Historical ROAS
- `projectedROAS` - Forecasted ROAS with new budget
- `historicalSpend` - Past 30-day spend

**Constraints:**
- Minimum $100 per platform
- Maximum 60% of total per platform
- Allocations sum to total budget (within rounding)

**Default Platforms:**
If no platforms specified, defaults to `['meta', 'google', 'tiktok', 'pinterest']`

**Status Codes:**
- `200` - Success
- `400` - Invalid total budget or platforms
- `500` - Server error

---

### GET /api/predictions/trends/:campaignId

Analyze metric trends for a campaign.

**Request:**
```
GET /api/predictions/trends/123
```

**Response:**
```json
{
  "campaignId": 123,
  "overallHealth": "improving",
  "trends": {
    "spend": {
      "metric": "spend",
      "direction": "increasing",
      "strength": "strong",
      "slope": 12.5,
      "rSquared": 0.82,
      "confidence": 0.82,
      "dataPoints": 14,
      "recentValue": 450,
      "avgValue": 380
    },
    "conversions": {
      "metric": "conversions",
      "direction": "increasing",
      "strength": "moderate",
      "slope": 0.8,
      "rSquared": 0.58,
      "confidence": 0.58,
      "dataPoints": 14,
      "recentValue": 32,
      "avgValue": 28
    },
    "revenue": {
      "metric": "revenue",
      "direction": "stable",
      "strength": "weak",
      "slope": 2.1,
      "rSquared": 0.15,
      "confidence": 0.15,
      "dataPoints": 14,
      "recentValue": 1250,
      "avgValue": 1200
    },
    "ctr": {
      "metric": "ctr",
      "direction": "decreasing",
      "strength": "moderate",
      "slope": -0.05,
      "rSquared": 0.45,
      "confidence": 0.45,
      "dataPoints": 14,
      "recentValue": 2.8,
      "avgValue": 3.2
    },
    "cpc": {
      "metric": "cpc",
      "direction": "stable",
      "strength": "weak",
      "slope": 0.01,
      "rSquared": 0.08,
      "confidence": 0.08,
      "dataPoints": 14,
      "recentValue": 1.52,
      "avgValue": 1.50
    }
  },
  "summary": {
    "increasingMetrics": ["spend", "conversions"],
    "decreasingMetrics": ["ctr"],
    "stableMetrics": ["revenue", "cpc"]
  }
}
```

**Fields:**
- `overallHealth` - 'improving' | 'declining' | 'stable'
- `direction` - 'increasing' | 'decreasing' | 'stable'
- `strength` - 'strong' (R² > 0.7) | 'moderate' (> 0.4) | 'weak' (≤ 0.4)
- `slope` - Rate of change per day
- `rSquared` - Goodness of fit (0-1)
- `confidence` - Same as rSquared
- `dataPoints` - Days of data used (last 14)
- `recentValue` - Most recent day's value
- `avgValue` - Average over period

**Overall Health Logic:**
```javascript
improving: increasingCount > decreasingCount + 1
declining: decreasingCount > increasingCount + 1
stable: otherwise
```

**Minimum Data:**
Requires at least 5 days of historical data. Returns `insufficient_data` if less.

**Status Codes:**
- `200` - Success
- `404` - Campaign not found
- `500` - Server error

---

## Usage Examples

### JavaScript (Node.js)

```javascript
// Performance prediction
const response = await fetch('http://localhost:3002/api/predictions/performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: 123,
    proposedBudget: 15000
  })
});
const forecast = await response.json();
console.log(`Predicted ROAS: ${forecast.predictions.roas}`);

// Budget optimization
const optResponse = await fetch('http://localhost:3002/api/predictions/budget-allocation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    totalBudget: 10000,
    platforms: ['meta', 'google', 'tiktok']
  })
});
const allocation = await optResponse.json();
allocation.allocations.forEach(a => {
  console.log(`${a.platform}: $${a.recommended} (${a.percentage}%)`);
});

// Trend analysis
const trends = await fetch('http://localhost:3002/api/predictions/trends/123')
  .then(r => r.json());
console.log(`Campaign health: ${trends.overallHealth}`);
console.log(`Increasing: ${trends.summary.increasingMetrics.join(', ')}`);
```

### cURL

```bash
# Performance prediction
curl -X POST http://localhost:3002/api/predictions/performance \
  -H "Content-Type: application/json" \
  -d '{"campaignId": 123, "proposedBudget": 15000}'

# Budget optimization
curl -X POST http://localhost:3002/api/predictions/budget-allocation \
  -H "Content-Type: application/json" \
  -d '{"totalBudget": 10000, "platforms": ["meta", "google"]}'

# Trend analysis
curl http://localhost:3002/api/predictions/trends/123
```

### Python

```python
import requests

# Performance prediction
response = requests.post(
    'http://localhost:3002/api/predictions/performance',
    json={'campaignId': 123, 'proposedBudget': 15000}
)
forecast = response.json()
print(f"Predicted ROAS: {forecast['predictions']['roas']}")

# Budget optimization
response = requests.post(
    'http://localhost:3002/api/predictions/budget-allocation',
    json={'totalBudget': 10000, 'platforms': ['meta', 'google', 'tiktok']}
)
allocation = response.json()
for a in allocation['allocations']:
    print(f"{a['platform']}: ${a['recommended']} ({a['percentage']}%)")

# Trend analysis
response = requests.get('http://localhost:3002/api/predictions/trends/123')
trends = response.json()
print(f"Campaign health: {trends['overallHealth']}")
```

## Algorithms

### Performance Prediction

Uses simple linear projection with diminishing returns:

```javascript
// 1. Get historical daily averages (last 30 days)
const avgDailySpend = historicalSpend / days;
const avgDailyConversions = historicalConversions / days;

// 2. Calculate budget ratio
const dailyBudget = proposedBudget / 30;
const budgetRatio = dailyBudget / avgDailySpend;

// 3. Apply diminishing returns
let factor = 1.0;
if (budgetRatio > 1.5) factor = 0.7;
else if (budgetRatio > 1.2) factor = 0.85;

// 4. Project metrics
const predictedConversions = avgDailyConversions * budgetRatio * factor * 30;
const predictedROAS = predictedRevenue / proposedBudget;
```

### Budget Optimization

Allocates budget proportionally to ROAS:

```javascript
// 1. Get historical ROAS per platform
const roas = { meta: 3.2, google: 2.5, tiktok: 1.8 };

// 2. Calculate shares
const totalROAS = Object.values(roas).reduce((a, b) => a + b);
const shares = Object.entries(roas).map(([platform, r]) => ({
  platform,
  share: r / totalROAS
}));

// 3. Allocate with constraints
const allocations = shares.map(s => {
  let amount = totalBudget * s.share;
  amount = Math.max(100, Math.min(amount, totalBudget * 0.6));
  return { platform: s.platform, recommended: amount };
});

// 4. Normalize if needed
const total = allocations.reduce((sum, a) => sum + a.recommended, 0);
if (total > totalBudget) {
  const ratio = totalBudget / total;
  allocations.forEach(a => a.recommended *= ratio);
}
```

### Trend Detection

Uses linear regression on time-series data:

```javascript
// 1. Get daily values (last 14 days)
const values = [28, 30, 29, 32, 31, 33, 35, 34, 36, 38, 37, 39, 40, 41];

// 2. Calculate slope (linear regression)
const n = values.length;
const xValues = Array.from({length: n}, (_, i) => i);
const sumX = xValues.reduce((a, b) => a + b);
const sumY = values.reduce((a, b) => a + b);
const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

// 3. Calculate R-squared (goodness of fit)
const yMean = sumY / n;
const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
const ssResidual = values.reduce((sum, y, i) => {
  const predicted = slope * i + intercept;
  return sum + Math.pow(y - predicted, 2);
}, 0);
const rSquared = 1 - (ssResidual / ssTotal);

// 4. Determine direction
let direction = 'stable';
if (Math.abs(slope) > 0.05) {
  direction = slope > 0 ? 'increasing' : 'decreasing';
}
```

## Confidence Scoring

All predictions include a confidence score (0.0-1.0):

**Performance Predictions:**
- 0.8 (High): 30+ days of historical data
- 0.6 (Medium): 14-29 days
- 0.4 (Low): 7-13 days
- 0.2 (Very Low): < 7 days

**Budget Optimization:**
- 0.85: Rich historical data with consistent ROAS
- 0.75: Good historical data
- 0.65: Limited historical data
- 0.30: No historical data (equal distribution)

**Trend Detection:**
- Confidence = R-squared (goodness of fit)
- Strong trend: R² > 0.7
- Moderate trend: R² > 0.4
- Weak trend: R² ≤ 0.4

## Rate Limits

No rate limits currently enforced. Recommendations:
- Cache predictions for at least 1 hour
- Don't call trend analysis more than once per hour
- Budget optimization can be called on-demand

## Error Handling

All endpoints return standard error format:

```json
{
  "error": "Description of error"
}
```

Common errors:
- `Insufficient historical data` - Need more campaign history
- `Campaign not found` - Invalid campaign ID
- `Invalid request` - Missing required parameters

## Best Practices

1. **Check confidence scores** before using predictions
   - Use predictions with confidence > 0.6 for automated actions
   - Review predictions with confidence < 0.6 manually

2. **Validate predictions** against actual outcomes
   - Track prediction accuracy over time
   - Adjust confidence thresholds based on accuracy

3. **Account for external factors**
   - Predictions don't account for seasonality, market changes
   - Use human judgment for major decisions

4. **Combine with recommendations**
   - Use predictions to validate recommendation expected lifts
   - Cross-reference budget optimization with actual platform performance

5. **Update regularly**
   - Re-run predictions as new data arrives
   - Trend analysis should be checked daily
   - Budget optimization weekly or when performance shifts

---

**See Also:**
- [Agent Intelligence Guide](./AGENT-INTELLIGENCE.md)
- [A/B Testing Guide](./AB-TESTING-GUIDE.md)
- [Recommendations API](#) (coming soon)
