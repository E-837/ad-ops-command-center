# Analytics API Reference

Complete API documentation for the Analytics Layer.

## Overview

The Analytics API provides comprehensive performance insights across all advertising platforms with advanced filtering, aggregation, and export capabilities.

## Base URL

```
http://localhost:3002/api/analytics
```

## Authentication

Currently no authentication required (local development).

---

## Endpoints

### 1. Spend Trend Analysis

Get daily spend trends across platforms with moving averages.

**Endpoint:** `GET /api/analytics/spend-trend`

**Query Parameters:**
- `days` (integer, optional): Lookback period in days. Default: 30
- `platforms` (string, optional): Comma-separated list of platforms (`google-ads,meta,pinterest`)
- `startDate` (string, optional): Start date (YYYY-MM-DD)
- `endDate` (string, optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "data": [
    {
      "date": "2025-01-15",
      "google-ads": 5000,
      "meta": 3000,
      "pinterest": 1500,
      "total": 9500,
      "movingAverage": 9200
    }
  ],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 2. CTR Comparison by Platform

Compare click-through rates across platforms with industry benchmarks.

**Endpoint:** `GET /api/analytics/ctr-comparison`

**Query Parameters:**
- `days` (integer, optional): Lookback period. Default: 30
- `platforms` (string, optional): Filter platforms

**Response:**
```json
{
  "data": [
    {
      "platform": "google-ads",
      "ctr": 2.5,
      "clicks": 125000,
      "impressions": 5000000,
      "benchmark": 2.0
    }
  ],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 3. Conversion Funnel

Multi-stage conversion funnel with drop-off analysis.

**Endpoint:** `GET /api/analytics/conversion-funnel`

**Query Parameters:**
- `days` (integer, optional): Lookback period
- `platforms` (string, optional): Filter platforms
- `campaignId` (string, optional): Filter by specific campaign

**Response:**
```json
{
  "data": [
    {
      "stage": "Impressions",
      "value": 5000000,
      "dropoff": 0
    },
    {
      "stage": "Clicks",
      "value": 125000,
      "dropoff": 97.5
    },
    {
      "stage": "Conversions",
      "value": 2500,
      "dropoff": 98.0
    },
    {
      "stage": "Revenue",
      "value": 375000,
      "dropoff": 0
    }
  ],
  "overallConversionRate": 0.05,
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 4. ROAS by Campaign

Top-performing campaigns sorted by return on ad spend.

**Endpoint:** `GET /api/analytics/roas-by-campaign`

**Query Parameters:**
- `days` (integer, optional): Lookback period
- `platforms` (string, optional): Filter platforms
- `limit` (integer, optional): Number of results. Default: 10

**Response:**
```json
{
  "data": [
    {
      "campaignId": "camp-123",
      "campaignName": "Q1 Brand Awareness",
      "platform": "google-ads",
      "revenue": 150000,
      "spend": 50000,
      "roas": 3.0
    }
  ],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 5. Budget Utilization

Budget allocation vs actual spend by platform.

**Endpoint:** `GET /api/analytics/budget-utilization`

**Query Parameters:**
- `days` (integer, optional): Lookback period
- `platforms` (string, optional): Filter platforms

**Response:**
```json
{
  "data": [
    {
      "platform": "google-ads",
      "allocated": 100000,
      "spent": 85000,
      "utilization": 85.0,
      "remaining": 15000
    }
  ],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 6. Performance Summary

Overall KPIs aggregated across all platforms.

**Endpoint:** `GET /api/analytics/performance-summary`

**Query Parameters:**
- `days` (integer, optional): Lookback period
- `platforms` (string, optional): Filter platforms

**Response:**
```json
{
  "data": {
    "spend": 125000,
    "impressions": 5000000,
    "clicks": 125000,
    "conversions": 2500,
    "revenue": 375000,
    "ctr": 2.5,
    "cpc": 1.0,
    "cpa": 50.0,
    "roas": 3.0,
    "conversionRate": 2.0
  },
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 7. Platform Comparison

Comprehensive cross-platform performance comparison.

**Endpoint:** `GET /api/analytics/platform-comparison`

**Query Parameters:**
- `days` (integer, optional): Lookback period
- `platforms` (string, optional): Filter platforms

**Response:**
```json
{
  "platforms": [
    {
      "name": "google-ads",
      "spend": 50000,
      "impressions": 2000000,
      "clicks": 50000,
      "conversions": 1000,
      "revenue": 150000,
      "ctr": 2.5,
      "cpc": 1.0,
      "cpa": 50.0,
      "roas": 3.0,
      "benchmarks": {
        "ctr": 2.0,
        "cpc": 1.5,
        "cpa": 75.0,
        "roas": 2.5
      }
    }
  ],
  "totals": {
    "spend": 125000,
    "impressions": 5000000,
    "clicks": 125000,
    "conversions": 2500,
    "revenue": 375000,
    "ctr": 2.5,
    "cpc": 1.0,
    "cpa": 50.0,
    "roas": 3.0
  },
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

---

### 8. Get Benchmarks

Industry benchmarks for performance comparison.

**Endpoint:** `GET /api/analytics/benchmarks`

**Response:**
```json
{
  "google-ads": {
    "ctr": 2.0,
    "cpc": 1.5,
    "cpa": 75.0,
    "roas": 2.5,
    "conversionRate": 3.5
  },
  "meta": {
    "ctr": 1.2,
    "cpc": 0.8,
    "cpa": 60.0,
    "roas": 3.0,
    "conversionRate": 2.8
  }
}
```

---

## Filter Parameters

All analytics endpoints support these common filters:

### Date Range Filters

**Option 1: Days Lookback**
```
?days=30
```

**Option 2: Custom Date Range**
```
?startDate=2025-01-01&endDate=2025-01-31
```

### Platform Filter

Filter by one or more platforms:
```
?platforms=google-ads,meta,pinterest
```

Available platforms:
- `google-ads`
- `meta`
- `pinterest`
- `ttd` (The Trade Desk)
- `dv360` (Display & Video 360)

### Limit

Limit number of results (for top N queries):
```
?limit=10
```

---

## Export Formats

All analytics data can be exported using the client-side export utilities:

**CSV Export:**
```javascript
ExportUtils.exportToCSV(data, 'filename.csv');
```

**JSON Export:**
```javascript
ExportUtils.exportToJSON(data, 'filename.json');
```

**Copy to Clipboard:**
```javascript
await ExportUtils.copyToClipboard(csvData);
```

---

## Error Handling

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid parameters"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database query failed: [details]"
}
```

---

## Examples

### Get Last 7 Days Spend for Google Ads Only

```bash
curl "http://localhost:3002/api/analytics/spend-trend?days=7&platforms=google-ads"
```

### Get Top 5 Campaigns by ROAS for January

```bash
curl "http://localhost:3002/api/analytics/roas-by-campaign?startDate=2025-01-01&endDate=2025-01-31&limit=5"
```

### Get Platform Comparison for Last 90 Days

```bash
curl "http://localhost:3002/api/analytics/platform-comparison?days=90"
```

---

## Notes

- All date/time values are in ISO 8601 format
- Currency values are in USD
- Percentages are returned as decimals (2.5 = 2.5%)
- Moving averages use 7-day windows
- Benchmarks are industry averages and may vary by vertical
