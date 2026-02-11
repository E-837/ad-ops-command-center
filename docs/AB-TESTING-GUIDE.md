# A/B Testing Guide

Comprehensive guide for running automated A/B tests in Ad Ops Command Center.

## Overview

The A/B testing framework enables data-driven experimentation with automated statistical analysis and winner selection.

## Quick Start

```javascript
const abTesting = require('./services/ab-testing');

// 1. Create test
const test = await abTesting.createTest(
  campaignId,
  'creative',
  [
    { id: 'control', name: 'Current Ad', config: { format: 'image' } },
    { id: 'variant_a', name: 'Video Ad', config: { format: 'video' } }
  ],
  14  // days
);

// 2. Let it run and collect data...

// 3. Analyze when ready
const analysis = await abTesting.analyzeTest(test.id);

// 4. Declare winner
const result = await abTesting.declareWinner(test.id, false);
```

## Test Types

### Creative Tests

Test different ad creatives:

```javascript
await abTesting.createTest(campaignId, 'creative', [
  { id: 'control', name: 'Image Ad', config: { type: 'image', size: '1200x628' } },
  { id: 'variant_a', name: 'Video Ad', config: { type: 'video', duration: 15 } },
  { id: 'variant_b', name: 'Carousel', config: { type: 'carousel', cards: 5 } }
], 14);
```

**What to test:**
- Image vs Video
- Different headlines
- CTA variations
- Color schemes
- Product shots vs lifestyle

### Bid Tests

Test bidding strategies:

```javascript
await abTesting.createTest(campaignId, 'bid', [
  { id: 'control', name: 'Current Bid', config: { strategy: 'manual', bid: 2.0 } },
  { id: 'variant_a', name: 'Higher Bid', config: { strategy: 'manual', bid: 2.5 } },
  { id: 'variant_b', name: 'Auto Bid', config: { strategy: 'auto', target: 'roas' } }
], 10);
```

**What to test:**
- Manual vs Automated bidding
- Different bid amounts
- Bid strategies (CPA vs ROAS)
- Pacing strategies

### Targeting Tests

Test audience segments:

```javascript
await abTesting.createTest(campaignId, 'targeting', [
  { id: 'control', name: 'Broad', config: { age: '18-65', interests: ['general'] } },
  { id: 'variant_a', name: 'Narrow', config: { age: '25-45', interests: ['specific'] } }
], 14);
```

**What to test:**
- Age ranges
- Geographic targeting
- Interest categories
- Lookalike audiences
- Retargeting vs prospecting

### Budget Tests

Test budget allocations:

```javascript
await abTesting.createTest(campaignId, 'budget', [
  { id: 'control', name: 'Even Split', config: { meta: 0.5, google: 0.5 } },
  { id: 'variant_a', name: 'Meta Heavy', config: { meta: 0.7, google: 0.3 } }
], 14);
```

**What to test:**
- Platform budget splits
- Daily vs lifetime budgets
- Pacing strategies
- Budget caps

## Test Lifecycle

### 1. Planning Phase

**Define Hypothesis:**
```
"Video ads will generate 20%+ more conversions than image ads 
for our retail audience due to higher engagement."
```

**Set Success Criteria:**
- Primary metric: Conversions
- Secondary metric: CTR, CPA
- Minimum lift: 15%
- Confidence: 95%

**Calculate Required Sample Size:**
- Baseline conversion rate: 3%
- Expected lift: 20%
- Minimum conversions: 100 per variant
- Budget needed: ~$3,000 per variant @ $30 CPA

### 2. Setup Phase

```javascript
const test = await abTesting.createTest(
  campaignId,
  'creative',
  [
    {
      id: 'control',
      name: 'Current Image Ad',
      config: {
        creative_id: 'creative_123',
        type: 'image'
      }
    },
    {
      id: 'video_variant',
      name: 'New Video Ad',
      config: {
        creative_id: 'creative_456',
        type: 'video',
        duration: 15
      }
    }
  ],
  14,  // Duration in days
);

console.log(`Test ${test.id} created and started`);
```

### 3. Running Phase

**Monitor Progress:**
```javascript
const status = await abTesting.getTestStatus(test.id);

console.log(`Progress: ${status.progress}%`);
console.log(`Days remaining: ${status.daysRemaining}`);
console.log(`Total conversions: ${status.totalConversions}`);
console.log(`Ready for analysis: ${status.readyForAnalysis}`);
```

**Update Metrics (if manual tracking):**
```javascript
// Usually updated automatically from ad platform APIs
await abTesting.updateTestMetrics(test.id, 'control', {
  impressions: 50000,
  clicks: 1500,
  conversions: 45,
  spend: 1350,
  revenue: 2700
});

await abTesting.updateTestMetrics(test.id, 'video_variant', {
  impressions: 50000,
  clicks: 2000,
  conversions: 60,
  spend: 1350,
  revenue: 3600
});
```

**Check Interim Results:**
```javascript
// Don't peek too early! Wait for minimum sample size
if (status.sufficientSample) {
  const interim = await abTesting.analyzeTest(test.id);
  console.log(`Current leader: ${interim.winner} (+${interim.lift}% lift)`);
}
```

### 4. Analysis Phase

When test completes and has sufficient data:

```javascript
const analysis = await abTesting.analyzeTest(test.id);

console.log('Test Results:');
console.log(`Winner: ${analysis.winner}`);
console.log(`Lift: ${analysis.lift}%`);
console.log(`P-value: ${analysis.pValue}`);
console.log(`Statistically significant: ${analysis.significant}`);
console.log(`Confidence: ${analysis.confidence}%`);

console.log('\nVariant Performance:');
console.log('Control:', analysis.details.variantA);
console.log('Variant:', analysis.details.variantB);
```

### 5. Decision Phase

```javascript
const result = await abTesting.declareWinner(test.id, autoApply);

if (result.winner) {
  console.log(`🏆 Winner: ${result.winner}`);
  console.log(`📈 Lift: ${result.lift}%`);
  console.log(`✅ Applied: ${result.applied}`);
} else {
  console.log('⚠️ Test inconclusive - no significant winner');
}
```

**Decision Matrix:**

| Significant | Lift | Action |
|-------------|------|--------|
| ✅ Yes | > 20% | Auto-apply winner |
| ✅ Yes | 10-20% | Manual review → Apply |
| ✅ Yes | 5-10% | Consider cost vs benefit |
| ❌ No | Any | Keep control, try new test |

## Statistical Significance

### Chi-Squared Test

We use the chi-squared test for 2x2 contingency tables:

```
        Conversions    Non-conversions
Control     a              b
Variant     c              d
```

**Formula:**
```
χ² = n × (ad - bc)² / [(a+b)(c+d)(a+c)(b+d)]

where n = total observations (a+b+c+d)
```

**Degrees of freedom:** 1 (for 2x2 table)

**Critical value:** 3.841 (for p < 0.05)

If χ² > 3.841, the result is statistically significant.

### Interpreting Results

**P-value:**
- p < 0.01: Highly significant (99% confidence)
- p < 0.05: Significant (95% confidence) ✅ Our threshold
- p < 0.10: Marginally significant (90% confidence)
- p ≥ 0.10: Not significant

**Lift Calculation:**
```
Lift = (Variant Rate - Control Rate) / Control Rate × 100%

Example:
Control: 30/1000 = 3.0% conversion rate
Variant: 36/1000 = 3.6% conversion rate
Lift = (3.6 - 3.0) / 3.0 × 100 = 20%
```

### Sample Size Requirements

**Minimum per variant:**
- 100 conversions (recommended)
- 50 conversions (minimum)
- 1000+ impressions

**Duration:**
- 7-14 days minimum
- Include at least 2 full weeks for day-of-week effects
- Include full purchase cycles if applicable

**Early stopping:**
- Don't stop early even if results look significant
- Risk of false positives increases with peeking
- Wait for planned duration unless clear winner emerges (p < 0.01, lift > 50%)

## Best Practices

### Test Design

✅ **DO:**
- Test one variable at a time
- Use clear, descriptive names
- Define success criteria upfront
- Ensure equal traffic split (50/50)
- Run for full duration planned
- Document hypothesis and learnings

❌ **DON'T:**
- Test multiple changes simultaneously
- Stop test early based on interim results
- Change test config mid-flight
- Compare unequal sample sizes
- Test during atypical periods (holidays, launches)

### Multi-Variant Tests

For 3+ variants, we compare each to control:

```javascript
const test = await abTesting.createTest(campaignId, 'creative', [
  { id: 'control', name: 'Control' },
  { id: 'variant_a', name: 'Variant A' },
  { id: 'variant_b', name: 'Variant B' },
  { id: 'variant_c', name: 'Variant C' }
], 21); // Longer duration for more variants
```

**Analysis:**
- Each variant is compared to control individually
- Winner is variant with highest conversion rate vs control
- Requires larger sample size (split traffic 4 ways)
- Bonferroni correction for multiple comparisons

### Common Pitfalls

**1. Insufficient Sample Size**
- Problem: Declaring winner with < 100 conversions
- Solution: Run longer or increase budget

**2. Peeking Too Often**
- Problem: Checking results daily and stopping early
- Solution: Set duration and wait (use interim checks only for monitoring)

**3. Testing Too Many Things**
- Problem: Changing creative AND targeting AND bid simultaneously
- Solution: Isolate variables - one test per variable

**4. Ignoring Segments**
- Problem: Averaging results across all segments
- Solution: Segment analysis (mobile vs desktop, regions, etc.)

**5. Seasonality Effects**
- Problem: Running test during unusual period (Black Friday, etc.)
- Solution: Avoid atypical periods or account for them in analysis

## API Usage

### Create Test

```bash
POST /api/ab-tests
Content-Type: application/json

{
  "campaignId": 123,
  "testType": "creative",
  "variants": [
    { "id": "control", "name": "Current", "config": {...} },
    { "id": "variant_a", "name": "New", "config": {...} }
  ],
  "duration": 14
}
```

### Get Test Status

```bash
GET /api/ab-tests/456/status

Response:
{
  "id": 456,
  "status": "running",
  "progress": 42.5,
  "daysElapsed": 6,
  "daysRemaining": 8,
  "totalConversions": 75,
  "readyForAnalysis": false,
  "sufficientSample": false
}
```

### Analyze Test

```bash
POST /api/ab-tests/456/analyze

Response:
{
  "significant": true,
  "winner": "variant_a",
  "lift": 18.5,
  "pValue": 0.032,
  "confidence": 95,
  "details": {
    "variantA": {
      "conversionRate": "3.20%",
      "conversions": 32,
      "impressions": 10000
    },
    "variantB": {
      "conversionRate": "3.79%",
      "conversions": 43,
      "impressions": 11350
    }
  }
}
```

### Complete Test

```bash
POST /api/ab-tests/456/complete
Content-Type: application/json

{
  "autoApply": false
}

Response:
{
  "winner": "variant_a",
  "lift": 18.5,
  "applied": false,
  "message": "Winner: variant_a with 18.5% lift (95% confidence)"
}
```

### Get Campaign Tests

```bash
GET /api/ab-tests/campaign/123?status=running

Response:
[
  {
    "id": 456,
    "campaignId": 123,
    "testType": "creative",
    "status": "running",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-02-15T00:00:00Z"
  }
]
```

## Examples

### Example 1: Simple Creative Test

```javascript
// Hypothesis: Video ads outperform images for product demos

const test = await abTesting.createTest(
  campaignId,
  'creative',
  [
    { id: 'control', name: 'Product Image', config: { format: 'image' } },
    { id: 'video', name: '15s Demo Video', config: { format: 'video' } }
  ],
  14
);

// Wait for test to complete...

const result = await abTesting.declareWinner(test.id);
// Result: Video won with 22% lift (p=0.018) ✅

// Store learning
await agentMemory.remember('creative-ops', 'creative_best_practices',
  'product_demo_format',
  { winner: 'video', lift: 22, context: 'product_demos' },
  0.9,
  `test_${test.id}`
);
```

### Example 2: Bid Strategy Test

```javascript
// Hypothesis: Auto-bidding for ROAS beats manual CPC

const test = await abTesting.createTest(
  campaignId,
  'bid',
  [
    { id: 'manual_cpc', name: 'Manual CPC $2.50', config: { strategy: 'manual', cpc: 2.50 } },
    { id: 'auto_roas', name: 'Auto-bid for 3x ROAS', config: { strategy: 'target_roas', roas: 3.0 } }
  ],
  10
);

// Result: Auto-bidding won with 15% better ROAS ✅
```

### Example 3: Audience Targeting Test

```javascript
// Hypothesis: Narrow targeting (25-45) beats broad (18-65)

const test = await abTesting.createTest(
  campaignId,
  'targeting',
  [
    { id: 'broad', name: 'Ages 18-65', config: { ageRange: [18, 65] } },
    { id: 'narrow', name: 'Ages 25-45', config: { ageRange: [25, 45] } }
  ],
  14
);

// Result: Narrow won with 12% lower CPA ✅
```

## Automated Testing

### Schedule Recommended Tests

```javascript
// System identifies opportunities and schedules tests

const tests = await abTesting.scheduleTests(campaignId);
console.log(`Scheduled ${tests.length} tests`);

// Example: Low CTR detected → Schedule creative test
// Example: High CPC detected → Schedule bid test
```

### Cron Job for Analysis

```javascript
// Run hourly to check for completed tests

const needsAnalysis = await abTesting.getTestsNeedingAnalysis();

for (const test of needsAnalysis) {
  const result = await abTesting.declareWinner(test.id, true); // Auto-apply
  
  // Send notification
  await notify(`Test ${test.id} completed: ${result.message}`);
}
```

## Reporting

### Test Summary Report

```javascript
const test = await abTests.getById(testId);
const analysis = await abTesting.analyzeTest(testId);

const report = {
  testName: test.testType,
  duration: `${test.startDate} to ${test.endDate}`,
  hypothesis: test.notes,
  variants: test.variants.map(v => ({
    name: v.name,
    conversions: v.metrics.conversions,
    conversionRate: (v.metrics.conversions / v.metrics.impressions * 100).toFixed(2) + '%',
    cpa: (v.metrics.spend / v.metrics.conversions).toFixed(2),
    roas: (v.metrics.revenue / v.metrics.spend).toFixed(2)
  })),
  winner: analysis.winner,
  lift: analysis.lift + '%',
  confidence: analysis.confidence + '%',
  recommendation: analysis.significant ? 'Apply winner' : 'Continue testing'
};

console.table(report.variants);
```

## Troubleshooting

**Test not reaching significance:**
- Increase sample size (run longer or increase budget)
- Variants may be too similar (test bigger changes)
- High variance in results (segment audience)

**Conflicting test results:**
- Check for external factors (seasonality, promotions)
- Verify equal traffic split
- Look for Simpson's Paradox (segment reversals)

**Low conversion volume:**
- Expand targeting to increase traffic
- Lower bid floor if using manual bidding
- Extend test duration

---

**Pro Tip:** Always document your learnings in agent memory for future reference!

```javascript
await agentMemory.remember('creative-ops', 'creative_best_practices',
  `test_${test.id}_learnings`,
  {
    testType: test.testType,
    winner: analysis.winner,
    lift: analysis.lift,
    audience: 'retail',
    context: 'q1_product_launch'
  },
  0.85,
  `test_${test.id}`
);
```
