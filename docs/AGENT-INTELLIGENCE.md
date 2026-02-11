# Agent Intelligence Layer

Week 5 implementation of Phase 3: Agent memory, recommendations, A/B testing, and predictions.

## Overview

The intelligence layer enables agents to learn from experience, make data-driven recommendations, run automated experiments, and predict campaign performance.

## Components

### 1. Agent Memory System

**Purpose:** Long-term and short-term memory for agents to store learnings and context.

#### Agent Memory (Long-term)

Stores persistent learnings that improve over time:

```javascript
const { agentMemory } = require('./database/models');

// Store a learning
await agentMemory.remember(
  'media-planner',          // Agent name
  'campaign_performance',    // Category
  'retail_awareness_q1',     // Key
  { platform: 'meta', roas: 3.5, cpa: 25 }, // Value
  0.8,                       // Confidence (0-1)
  'campaign_123'             // Source
);

// Recall a specific memory
const memory = await agentMemory.recall('media-planner', 'campaign_performance', 'retail_awareness_q1');

// Search memories with filters
const topLearnings = await agentMemory.search('trader', 'optimization_outcomes', {
  minConfidence: 0.7,
  limit: 10
});

// Update confidence based on new data
await agentMemory.updateConfidence(memoryId, 0.9);

// Forget outdated/low-confidence memories
await agentMemory.forget(memoryId);
```

**Memory Categories:**
- `campaign_performance` - Campaign outcomes and metrics
- `targeting_insights` - Audience targeting learnings
- `creative_best_practices` - Creative performance patterns
- `optimization_outcomes` - Results of optimization actions
- `user_preferences` - User-specific preferences

**Confidence Scoring:**
- Start at 0.5 (neutral)
- Increase by 0.1 per successful outcome
- Decrease by 0.2 per failure
- Auto-forget if drops below 0.3

#### Agent Context (Short-term)

Stores temporary session context with TTL:

```javascript
const { agentContext } = require('./database/models');

// Set context (expires in 1 hour)
await agentContext.setContext(
  'creative-ops',
  'session_001',
  { currentCampaign: 'retail_q1', testingCreative: true },
  3600  // TTL in seconds
);

// Get context (returns null if expired)
const context = await agentContext.getContext('creative-ops', 'session_001');

// Update context (merge new data)
await agentContext.updateContext('creative-ops', 'session_001', {
  testingCreative: false,
  creativeApproved: true
});

// Clean up expired contexts (cron job)
await agentContext.clearExpired();
```

### 2. Recommendation Engine

**Purpose:** Generate AI-powered recommendations for campaign optimization.

#### Available Recommendations

**Budget Reallocation:**
```javascript
const recommendations = require('./services/recommendations');

const budgetRec = await recommendations.getBudgetRecommendation(campaignId);
// Returns: { action, from, to, expectedLift, confidence }
```

Analyzes platform performance and suggests moving budget from underperformers to top performers.

**Bid Adjustments:**
```javascript
const bidRec = await recommendations.getBidRecommendation(campaignId, 'meta');
// Returns: { action, currentBid, suggestedBid, adjustment, reason, confidence }
```

Evaluates CTR and conversion rates to recommend bid increases/decreases.

**Targeting Changes:**
```javascript
const targetingRec = await recommendations.getTargetingRecommendation(campaignId);
// Returns: { action, exclude/expand, reason, expectedSavings/expectedLift, confidence }
```

Identifies high/low-performing segments for targeting adjustments.

**Creative Swaps:**
```javascript
const creativeRec = await recommendations.getCreativeRecommendation(campaignId);
// Returns: { action, pauseCreative, promoteCreative, reason, expectedLift, confidence }
```

Detects winning/losing creatives and fatigue patterns.

**Platform Mix:**
```javascript
const platformRec = await recommendations.getPlatformRecommendation(10000, {
  primary: 'conversion'
});
// Returns: { objective, totalBudget, allocation, rationale, confidence }
```

Suggests optimal budget distribution across platforms based on objectives.

**Optimization Priorities:**
```javascript
const priorities = await recommendations.getOptimizationPriorities(campaignId);
// Returns: Array of top 3 recommended actions sorted by impact
```

Ranks all recommendations by expected impact.

#### Using Recommendations

**In Agent Code:**
```javascript
async function optimizeCampaign(campaignId) {
  // Get priorities
  const priorities = await recommendations.getOptimizationPriorities(campaignId);
  
  // Apply top recommendation
  const topRec = priorities[0];
  
  if (topRec.confidence > 0.7 && topRec.expectedLift > 15) {
    // Execute recommendation
    await applyRecommendation(topRec);
    
    // Store outcome in memory
    await agentMemory.remember(
      'trader',
      'optimization_outcomes',
      `${topRec.type}_${campaignId}`,
      { action: topRec.action, actualLift: /* measure */ },
      0.8,
      `campaign_${campaignId}`
    );
  }
}
```

**Via API:**
```bash
# Get all recommendations
GET /api/recommendations/campaign/:id

# Get specific recommendation
GET /api/recommendations/budget/:id
GET /api/recommendations/bid/:id?platform=meta
GET /api/recommendations/targeting/:id
GET /api/recommendations/creative/:id

# Apply recommendation
POST /api/recommendations/:id/apply
```

### 3. A/B Testing Framework

**Purpose:** Automated experiment management with statistical significance testing.

#### Test Types

- **Creative** - Test ad variants
- **Bid** - Test bid strategies
- **Targeting** - Test audience segments
- **Budget** - Test budget allocations

#### Running A/B Tests

**Create and Start Test:**
```javascript
const abTesting = require('./services/ab-testing');

const test = await abTesting.createTest(
  campaignId,
  'creative',
  [
    { id: 'control', name: 'Current Creative', config: { type: 'image' } },
    { id: 'variant_a', name: 'New Video', config: { type: 'video' } }
  ],
  14  // Duration in days
);
// Test starts immediately
```

**Update Metrics:**
```javascript
await abTesting.updateTestMetrics(testId, 'control', {
  impressions: 10000,
  clicks: 300,
  conversions: 30,
  spend: 500,
  revenue: 900
});
```

**Check Status:**
```javascript
const status = await abTesting.getTestStatus(testId);
// Returns: { progress, daysRemaining, readyForAnalysis, sufficientSample }
```

**Analyze Results:**
```javascript
const analysis = await abTesting.analyzeTest(testId);
// Returns: { significant, winner, lift, pValue, confidence }
```

**Declare Winner:**
```javascript
const result = await abTesting.declareWinner(testId, autoApply = false);
// Completes test and optionally applies winner
```

#### Statistical Significance

Uses chi-squared test with:
- Minimum sample: 100 conversions per variant
- Confidence level: 95% (p < 0.05)
- Test duration: 7-14 days minimum

**Chi-squared Formula:**
```javascript
χ² = Σ[(Observed - Expected)² / Expected]
```

**P-value threshold:** < 0.05 for significance

#### Auto-Apply Winners

Set `autoApply: true` when declaring winners to automatically implement results if:
- Test is statistically significant (p < 0.05)
- Lift > 20%

#### Via API

```bash
# Create test
POST /api/ab-tests
{
  "campaignId": 1,
  "testType": "creative",
  "variants": [...],
  "duration": 14
}

# Get test status
GET /api/ab-tests/:id/status

# Analyze test
POST /api/ab-tests/:id/analyze

# Complete and declare winner
POST /api/ab-tests/:id/complete
{ "autoApply": false }

# Cancel test
POST /api/ab-tests/:id/cancel
```

### 4. Predictive Analytics

**Purpose:** Forecast campaign performance and optimize budget allocation.

#### Performance Prediction

Forecasts metrics based on proposed budget changes:

```javascript
const predictions = require('./services/predictions');

const forecast = await predictions.predictPerformance(campaignId, 15000);
// Returns: {
//   predictions: { conversions, revenue, roas, cpa, ctr },
//   baseline: { dailySpend, dailyConversions, dailyRevenue },
//   budgetRatio, diminishingFactor, confidence, dataPoints
// }
```

**Diminishing Returns:**
- 1.0x efficiency at baseline
- 0.85x efficiency at 1.2-1.5x budget
- 0.7x efficiency at 1.5x+ budget

#### Budget Optimization

Distributes budget across platforms for maximum ROAS:

```javascript
const optimization = await predictions.optimizeBudgetAllocation(
  10000,
  ['meta', 'google', 'tiktok', 'pinterest']
);
// Returns: {
//   allocations: [
//     { platform, recommended, percentage, currentROAS, projectedROAS }
//   ],
//   rationale, confidence
// }
```

**Constraints:**
- Minimum: $100 per platform
- Maximum: 60% of total budget per platform

#### Trend Detection

Identifies metric trends using linear regression:

```javascript
const trend = await predictions.detectTrend(campaignId, 'conversions');
// Returns: {
//   direction: 'increasing' | 'decreasing' | 'stable',
//   strength: 'weak' | 'moderate' | 'strong',
//   slope, rSquared, confidence
// }

// Get all trends
const analysis = await predictions.getTrendAnalysis(campaignId);
// Returns: { overallHealth, trends, summary }
```

**Trend Strength (R-squared):**
- Strong: R² > 0.7
- Moderate: R² > 0.4
- Weak: R² ≤ 0.4

#### Confidence Scoring

Based on historical data volume:
- **High (0.8):** 30+ days of data
- **Medium (0.6):** 14-29 days of data
- **Low (0.4):** 7-13 days of data
- **Very Low (0.2):** < 7 days of data

#### Via API

```bash
# Predict performance
POST /api/predictions/performance
{
  "campaignId": 1,
  "proposedBudget": 15000
}

# Optimize budget allocation
POST /api/predictions/budget-allocation
{
  "totalBudget": 10000,
  "platforms": ["meta", "google", "tiktok"]
}

# Get trend analysis
GET /api/predictions/trends/:campaignId
```

## Integration with Agents

### MediaPlanner Agent

```javascript
// Recall past campaign performance
const pastCampaigns = await agentMemory.search('media-planner', 'campaign_performance', {
  lob: brief.lob,
  minConfidence: 0.7
});

// Get platform recommendations
const platformRec = await recommendations.getPlatformRecommendation(
  budget,
  { primary: objective }
);

// Store plan outcome
await agentMemory.remember('media-planner', 'campaign_performance', 
  `${brief.lob}_${objective}`,
  { tactics, budget, outcome: 'success' },
  0.8,
  `campaign_${campaignId}`
);
```

### Trader Agent

```javascript
// Recall successful bid strategies
const bidStrategies = await agentMemory.search('trader', 'optimization_outcomes', {
  keyPattern: 'bid_optimization',
  minConfidence: 0.6
});

// Get budget recommendation
const budgetRec = await recommendations.getBudgetRecommendation(campaignId);

// Apply and track
if (budgetRec.confidence > 0.75) {
  await reallocateBudget(budgetRec);
  
  // Store outcome
  await agentMemory.remember('trader', 'optimization_outcomes',
    `budget_reallocation_${campaignId}`,
    { ...budgetRec, actualLift: /* measure */ },
    0.8,
    `campaign_${campaignId}`
  );
}
```

### CreativeOps Agent

```javascript
// Schedule A/B test
const test = await abTesting.createTest(
  campaignId,
  'creative',
  variants,
  14
);

// Store test results in memory
const result = await abTesting.declareWinner(test.id);
if (result.winner) {
  await agentMemory.remember('creative-ops', 'creative_best_practices',
    `${testType}_winner_${test.id}`,
    { winner: result.winner, lift: result.lift },
    0.85,
    `test_${test.id}`
  );
}
```

### Analyst Agent

```javascript
// Detect anomalies using trends
const trends = await predictions.getTrendAnalysis(campaignId);

if (trends.overallHealth === 'declining') {
  // Get recommendations
  const priorities = await recommendations.getOptimizationPriorities(campaignId);
  
  // Alert and suggest actions
  await alertDecline(campaignId, priorities);
}

// Store patterns
await agentMemory.remember('analyst', 'anomaly_patterns',
  `decline_pattern_${campaignId}`,
  { trends, actions: priorities },
  0.7,
  `campaign_${campaignId}`
);
```

## Cron Jobs

### Memory Cleanup (Daily)

```javascript
const { agentMemory, agentContext } = require('./database/models');

// Clean up low-confidence memories
await agentMemory.cleanup({
  minConfidence: 0.3,
  olderThanDays: 90
});

// Clear expired contexts
await agentContext.clearExpired();
```

### A/B Test Analysis (Hourly)

```javascript
const abTesting = require('./services/ab-testing');

// Get tests needing analysis
const tests = await abTesting.getTestsNeedingAnalysis();

for (const test of tests) {
  const result = await abTesting.declareWinner(test.id, true); // Auto-apply
  console.log(`✅ Test ${test.id} completed: ${result.message}`);
}
```

## Best Practices

### Memory Management

1. **Start with medium confidence (0.5-0.6)** for new learnings
2. **Increase confidence gradually** based on successful outcomes
3. **Regularly clean up** old/low-confidence memories
4. **Use specific keys** for easy recall later
5. **Store source references** to trace back to original data

### Recommendations

1. **Check confidence scores** before applying (> 0.7 for automatic)
2. **Apply top priorities first** (use `getOptimizationPriorities`)
3. **Track actual outcomes** vs predictions
4. **Feed results back** into agent memory
5. **Set approval thresholds** for high-impact changes

### A/B Testing

1. **Run tests for minimum 7-14 days**
2. **Wait for 100+ conversions** per variant before declaring winner
3. **Test one variable at a time** (isolate effects)
4. **Document test hypotheses** in notes field
5. **Store winners in memory** for future reference

### Predictions

1. **Require minimum 14 days** of historical data
2. **Account for seasonality** in trends
3. **Apply diminishing returns** for large budget changes
4. **Use confidence scores** to qualify predictions
5. **Validate predictions** against actual outcomes

## Monitoring

### Memory Stats

```javascript
const memoryCount = await agentMemory.getAllMemories('trader');
console.log(`Agent has ${memoryCount.length} memories`);

const highConfidence = memoryCount.filter(m => m.confidence > 0.7);
console.log(`${highConfidence.length} high-confidence learnings`);
```

### Test Performance

```javascript
const allTests = await abTests.getRunning();
console.log(`${allTests.length} tests currently running`);

const readyForAnalysis = allTests.filter(t => t.readyForAnalysis);
console.log(`${readyForAnalysis.length} tests ready for analysis`);
```

### Prediction Accuracy

Track prediction vs actual:
```javascript
// After campaign completes
const actual = await metrics.getByCampaign(campaignId);
const predicted = /* stored prediction */;

const accuracy = 1 - Math.abs(actual.roas - predicted.roas) / actual.roas;
console.log(`Prediction accuracy: ${(accuracy * 100).toFixed(1)}%`);
```

## Troubleshooting

**Low recommendation confidence:**
- Need more historical data (run campaigns for 14+ days)
- Inconsistent performance (high variance in metrics)
- Solution: Wait for more data or use lower confidence threshold

**A/B test inconclusive:**
- Insufficient sample size (< 100 conversions)
- Variants too similar (< 5% difference)
- Solution: Run test longer or increase budget for more volume

**Prediction errors:**
- Insufficient historical data (< 7 days)
- External factors (seasonality, market changes)
- Solution: Use lower confidence threshold and validate with expert review

## Future Enhancements

- [ ] Multi-armed bandit optimization
- [ ] Bayesian confidence intervals
- [ ] Cross-campaign learning transfer
- [ ] Automated hypothesis generation
- [ ] Real-time prediction updates
- [ ] Agent collaboration memory
- [ ] Explainable AI for recommendations

---

**Week 5 Complete** | Phase 3: Agent Intelligence ✅
