# Campaign Creation A2A Pipeline

**Version:** 1.0.0  
**Category:** Campaign Operations  
**Estimated Duration:** 8-12 minutes

## Overview

Multi-agent collaborative workflow for creating and launching campaigns across multiple DSPs using Agent-to-Agent (A2A) messaging. Each specialized agent performs its role and hands off to the next agent in the pipeline.

## Agent Pipeline

```
Atlas (Orchestrator)
  ↓
MediaPlanner → Creates strategy (channels, budget allocation, KPIs)
  ↓ (hands off strategy)
Analyst → Analyzes historical performance, provides recommendations
  ↓ (hands off strategy + insights)
Trader → Configures DSP campaigns (TTD, DV360, Amazon DSP, Google Ads, Meta)
  ↓ (hands off campaign configs)
CreativeOps → Generates 4 AI creatives via Nanobana connector
  ↓ (hands off everything)
Compliance → Reviews brand safety and legal requirements
  ↓ (hands off approved package)
Trader → Launches campaigns across DSPs
  ↓
Atlas → Generates final summary report
```

## Features

- **A2A Messaging**: Agents communicate via message bus with handoff patterns
- **Real Connectors**: Uses live Google Ads API, Meta sandbox, TTD/DV360/Amazon mock
- **AI Creatives**: Generates creative assets via Nanobana image generation API
- **Compliance Review**: Validates against domain/brand-safety.json rules
- **Multi-DSP Launch**: Supports Google Ads, Meta Ads, TTD, DV360, Amazon DSP
- **Domain Knowledge**: Uses benchmarks.json for industry standards

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `campaignName` | string | ✅ | - | Campaign name |
| `advertiser` | string | ✅ | - | Advertiser name |
| `budget` | number | ✅ | - | Total campaign budget (USD) |
| `startDate` | string | ✅ | - | Start date (YYYY-MM-DD) |
| `endDate` | string | ✅ | - | End date (YYYY-MM-DD) |
| `objective` | string | ❌ | awareness | awareness \| consideration \| conversion |
| `targetAudience` | string | ❌ | - | Target audience description |
| `platforms` | array | ❌ | ['google-ads', 'meta-ads'] | DSP platforms to use |

## Output Structure

```javascript
{
  campaignId: "uuid",
  status: "launched",
  
  platforms: {
    googleAds: { 
      campaignId: "12345", 
      status: "active", 
      budget: 50000 
    },
    metaAds: { 
      campaignId: "67890", 
      status: "active", 
      budget: 50000 
    },
    ttd: { 
      campaignId: "mock-abc123", 
      status: "active", 
      budget: 50000 
    }
  },
  
  creatives: [
    { id: "uuid", url: "https://...", size: "300x250", platform: "all" },
    { id: "uuid", url: "https://...", size: "728x90", platform: "all" },
    { id: "uuid", url: "https://...", size: "1920x1080", platform: "all" },
    { id: "uuid", url: "https://...", size: "160x600", platform: "all" }
  ],
  
  strategy: {
    channels: ["display", "olv", "ctv", "audio"],
    budgetSplit: {
      "google-ads": 50000,
      "meta-ads": 50000,
      "ttd": 50000
    },
    kpis: ["impressions", "reach", "frequency", "cpm", "brand-lift"]
  },
  
  insights: {
    historicalPerformance: {
      campaignsAnalyzed: 22,
      avgPerformance: { ctr: 0.15, cpm: 12.50 }
    },
    recommendations: [
      "Budget supports multi-channel approach...",
      "Prioritize reach and frequency..."
    ]
  },
  
  compliance: {
    approved: true,
    notes: "All requirements met. Campaign approved for launch.",
    issues: 0
  },
  
  launchTime: "2026-02-13T21:45:00.000Z",
  summary: "Campaign successfully launched..."
}
```

## Usage

### Via Node.js

```javascript
const workflow = require('./workflows/campaign-ops/campaign-creation-a2a');

const params = {
  campaignName: 'Brand X Q1 2026 Launch',
  advertiser: 'Brand X',
  budget: 150000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  objective: 'awareness',
  targetAudience: 'Tech-savvy millennials, 25-40, high income',
  platforms: ['google-ads', 'meta-ads', 'ttd']
};

const result = await workflow.run(params);
console.log(result);
```

### Via CLI

```bash
node workflows/campaign-ops/campaign-creation-a2a.js
```

Or run the test script:

```bash
node scripts/test-campaign-creation-a2a.js
```

### Via Workflow Registry

```javascript
const { registry } = require('./workflows');

const result = await registry.getWorkflowModule('campaign-creation-a2a').run({
  campaignName: 'My Campaign',
  advertiser: 'Acme Corp',
  budget: 100000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  platforms: ['google-ads', 'meta-ads']
});
```

## Agent Details

### 1. MediaPlanner

**Model:** Claude Opus 4.6 (strategic planning requires Opus)  
**Role:** Strategic planning, budget allocation, channel mix  
**Tools:** domain.benchmarks, domain.taxonomy

**Responsibilities:**
- Allocate budget across channels based on objective
- Split budget across platforms
- Define KPIs and success metrics
- Provide strategic recommendations
- Calculate expected reach and metrics

**Output:** Strategy document with channels, budgets, KPIs, recommendations

### 2. Analyst

**Model:** Claude Sonnet 4.5  
**Role:** Historical analysis and insights  
**Tools:** database queries, performance metrics

**Responsibilities:**
- Query historical campaign performance
- Analyze channel effectiveness
- Compare to industry benchmarks
- Provide optimization recommendations

**Output:** Insights document with historical data, recommendations

### 3. Trader (First Handoff)

**Model:** Claude Sonnet 4.5  
**Role:** Campaign configuration  
**Tools:** DSP connectors (Google Ads, Meta, TTD, DV360, Amazon DSP)

**Responsibilities:**
- Configure campaigns for each platform
- Set bidding strategies based on objective
- Define targeting parameters
- Prepare campaign settings

**Output:** Campaign configurations for all platforms

### 4. CreativeOps

**Model:** Claude Sonnet 4.5  
**Role:** Creative asset generation  
**Tools:** Nanobana image generation API

**Responsibilities:**
- Generate 4 AI creatives in different sizes
- Create ad specs for each platform
- Optimize creative for objective

**Sizes Generated:**
- 300x250 (Medium Rectangle)
- 728x90 (Leaderboard)
- 1920x1080 (Video/Display)
- 160x600 (Wide Skyscraper)

**Output:** Array of creative assets with URLs

### 5. Compliance

**Model:** Claude Sonnet 4.5  
**Role:** Brand safety and legal review  
**Tools:** domain/brand-safety.json

**Responsibilities:**
- Review campaign strategy
- Validate creatives against brand safety rules
- Check legal compliance
- Approve or reject campaign package

**Output:** Compliance report with approval status

### 6. Trader (Second Handoff)

**Model:** Claude Sonnet 4.5  
**Role:** Campaign launch  
**Tools:** DSP connectors

**Responsibilities:**
- Launch approved campaigns across all platforms
- Track launch success/failures
- Report final status

**Output:** Launch results with campaign IDs

### 7. Atlas

**Model:** Claude Sonnet 4.5  
**Role:** Orchestration and monitoring  

**Responsibilities:**
- Set initial goal and broadcast to agents
- Monitor agent status updates
- Track A2A message flow
- Generate final summary report
- Calculate execution metrics

**Output:** Final workflow summary

## A2A Handoff Pattern

Each agent uses this pattern to hand off work:

```javascript
// Agent sends
await this.send({
  to: 'next-agent',
  type: 'handoff',
  payload: {
    task: 'Description of what to do next',
    strategyDoc,      // From MediaPlanner
    insights,         // From Analyst
    campaignConfigs,  // From Trader
    creatives,        // From CreativeOps
    complianceReport, // From Compliance
    handedOffFrom: 'current-agent',
    nextAgent: 'next-agent'
  }
});

// Agent receives
this.on('handoff', async (message) => {
  const { task, strategyDoc, handedOffFrom } = message.payload;
  
  if (handedOffFrom !== 'expected-agent') return;
  
  // Do work...
  
  // Hand off to next agent
  await this.send({ ... });
});
```

## Logging

Each agent logs its progress:

```
[AgentName] Action description
[AgentName] Result: details
[AgentName] Handing off to NextAgent
```

Example:
```
[MediaPlanner] Creating media strategy for Brand X
[MediaPlanner] Strategy complete: 4 channels, $150K budget
[MediaPlanner] Handing off to Analyst

[Analyst] Received handoff from MediaPlanner
[Analyst] Analyzing historical performance...
[Analyst] Analysis complete: 22 campaigns analyzed
[Analyst] Handing off to Trader
```

## Real Connectors vs Mock

The workflow uses real connectors when available, falls back to mock otherwise:

**Real (Live API):**
- Google Ads API (if credentials configured)
- Nanobana (if API key configured)

**Sandbox:**
- Meta Ads (sandbox mode)

**Mock:**
- TTD
- DV360
- Amazon DSP

To enable real connectors, configure credentials in `config/.env`:

```
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...

NANOBANA_API_KEY=...
```

## Testing

Run the included test:

```bash
node scripts/test-campaign-creation-a2a.js
```

This will:
1. Execute the workflow with test parameters
2. Log all agent activity
3. Show final results
4. Save full output to JSON file in `output/`

Expected output:
```
✅ TEST COMPLETE
Status: success
Duration: 2.1s
Campaign ID: aae6dd84-adca-49db-a610-74afd54bbb70

Platforms Launched:
  - google-ads: campaign-12345 (active) - $50,000
  - meta-ads: campaign-67890 (active) - $50,000
  - ttd: mock-abc123 (active) - $50,000

Creatives Generated: 4
Compliance: APPROVED
A2A Messages Exchanged: 100
```

## Integration

### With Workflow Registry

The workflow is automatically registered in `workflows/index.js`:

```javascript
registry.register('campaign-creation-a2a', campaignCreationA2A);
```

Access via:
```javascript
const { registry } = require('./workflows');
const workflow = registry.getWorkflow('campaign-creation-a2a');
```

### With API

Expose via Express route:

```javascript
app.post('/api/workflows/campaign-creation-a2a/run', async (req, res) => {
  const result = await workflow.run(req.body);
  res.json(result);
});
```

### Metadata

```javascript
const { meta } = require('./workflows/campaign-ops/campaign-creation-a2a');

console.log(meta.name);        // "Campaign Creation A2A Pipeline"
console.log(meta.stages);      // Array of 7 stages
console.log(meta.inputs);      // Input parameter definitions
```

## Performance

**Typical Execution:**
- 2-5 seconds (with mocks)
- 8-12 minutes (with real API calls)

**Bottlenecks:**
- API rate limits (Google Ads, Meta)
- Creative generation (Nanobana)
- Network latency

**Optimization:**
- Agents run async where possible
- Message bus is non-blocking
- Parallel platform launches

## Troubleshooting

**Workflow times out:**
- Check API credentials
- Verify connector availability
- Review A2A message logs

**Campaign launch fails:**
- Check DSP connector status
- Verify budget thresholds
- Review compliance issues

**Compliance rejects:**
- Check brand-safety.json rules
- Review creative content
- Validate budget limits

**No creatives generated:**
- Verify Nanobana API key
- Check image generation logs
- Falls back to mock URLs

## Future Enhancements

- [ ] Real-time progress updates via SSE
- [ ] Pause/resume capability
- [ ] Agent negotiation (budget adjustment)
- [ ] A/B test variant generation
- [ ] Automated optimization suggestions
- [ ] Multi-market support
- [ ] Campaign templates
- [ ] Historical performance ML predictions

## References

- **A2A Pattern:** `projects/mission-control/workflows/daily-briefing-a2a.js`
- **Agent Definitions:** `agents/media-planner.js`, `agents/trader.js`, etc.
- **DSP Connectors:** `connectors/google-ads.js`, `connectors/meta-ads.js`, etc.
- **Domain Knowledge:** `domain/benchmarks.json`, `domain/brand-safety.json`

## Author

Ad Ops Command Center  
Version 1.0.0  
February 2026
