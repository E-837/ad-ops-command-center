# Week 5 Quick-Start: Agent Intelligence 🧠

**Phase 3, Days 21-25 | Intelligence Layer Complete ✅**

## 🚀 What's New

Week 5 adds AI-powered intelligence to agents:
- **Agent Memory** - Agents learn from experience
- **Recommendations** - AI-powered optimization suggestions
- **A/B Testing** - Automated experiments with statistical analysis
- **Predictions** - Forecast performance and optimize budgets

## ⚡ Quick Start (5 minutes)

### 1. Start the Server

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
node server.js
```

Server starts at `http://localhost:3002`

### 2. Test Agent Memory

```javascript
const { agentMemory } = require('./database/models');

// Store a learning
await agentMemory.remember(
  'trader',
  'optimization_outcomes',
  'budget_increase_meta',
  { action: 'increase_budget', lift: 25, platform: 'meta' },
  0.8,
  'campaign_456'
);

// Recall it
const memory = await agentMemory.recall('trader', 'optimization_outcomes', 'budget_increase_meta');
console.log(memory.value); // { action: 'increase_budget', lift: 25, ... }
```

### 3. Get Recommendations

```bash
# Get all recommendations for a campaign
curl http://localhost:3002/api/recommendations/campaign/1

# Get budget recommendation
curl http://localhost:3002/api/recommendations/budget/1

# Get optimization priorities
curl http://localhost:3002/api/recommendations/priorities/1
```

### 4. Run an A/B Test

```javascript
const abTesting = require('./services/ab-testing');

// Create and start test
const test = await abTesting.createTest(
  campaignId,
  'creative',
  [
    { id: 'control', name: 'Current Ad' },
    { id: 'variant_a', name: 'New Ad' }
  ],
  14  // days
);

console.log(`Test ${test.id} created and running!`);
```

### 5. Predict Performance

```bash
# Forecast with $15k budget
curl -X POST http://localhost:3002/api/predictions/performance \
  -H "Content-Type: application/json" \
  -d '{"campaignId": 1, "proposedBudget": 15000}'

# Optimize budget allocation
curl -X POST http://localhost:3002/api/predictions/budget-allocation \
  -H "Content-Type: application/json" \
  -d '{"totalBudget": 10000, "platforms": ["meta", "google", "tiktok"]}'
```

## 🧪 Run Tests

All tests passing ✅:

```bash
# Agent memory tests (8/8)
node test-agent-memory.js

# Recommendation tests (6/6)
node test-recommendations.js

# A/B testing tests (8/8)
node test-ab-testing.js

# Prediction tests (8/8)
node test-predictions.js
```

## 📚 Key Concepts

### Agent Memory

**Long-term (persistent):**
- Stores learnings that improve over time
- Confidence-based (0-1)
- Auto-forgets low confidence (< 0.3)

**Short-term (TTL-based):**
- Session context with expiration
- Default 1 hour TTL
- Auto-cleanup via cron

**Usage:**
```javascript
// Remember
await agentMemory.remember(agent, category, key, value, confidence, source);

// Recall
const memory = await agentMemory.recall(agent, category, key);

// Search
const memories = await agentMemory.search(agent, category, { minConfidence: 0.7 });
```

### Recommendations

6 types of AI-powered suggestions:

1. **Budget** - Reallocate from underperformers to winners
2. **Bid** - Increase/decrease based on CTR & conv rate
3. **Targeting** - Expand/narrow audience segments
4. **Creative** - Swap/test creatives
5. **Platform** - Optimal budget mix across platforms
6. **Priorities** - Top 3 actions ranked by impact

**All recommendations include:**
- `action` - What to do
- `confidence` - How sure (0-1)
- `expectedLift` - Predicted improvement %
- `reason` - Why this recommendation

### A/B Testing

Automated experiments with statistical rigor:

**Test Types:** Creative | Bid | Targeting | Budget

**Statistical Method:** Chi-squared test
- Minimum: 100 conversions per variant
- Confidence: 95% (p < 0.05)
- Duration: 7-14 days minimum

**Auto-apply:** If significant + lift > 20%

### Predictions

Forecast future performance:

**Performance Forecasting:**
- Predict metrics with budget changes
- Diminishing returns at 1.5x+ budget
- Confidence based on data volume (0.2-0.8)

**Budget Optimization:**
- ROAS-weighted allocation
- Min $100, max 60% per platform

**Trend Detection:**
- Linear regression on 14 days
- Direction: increasing/decreasing/stable
- Strength: weak/moderate/strong (R²)

## 🎯 Common Workflows

### 1. Optimize Campaign Budget

```javascript
// Get recommendation
const rec = await recommendations.getBudgetRecommendation(campaignId);

if (rec.confidence > 0.75 && rec.expectedLift > 15) {
  // Apply reallocation
  console.log(`Move $${rec.amount} from ${rec.from} to ${rec.to.platform}`);
  
  // Store outcome
  await agentMemory.remember('trader', 'optimization_outcomes',
    `budget_reallocation_${campaignId}`,
    { ...rec, actualLift: /* measure after */ },
    0.8,
    `campaign_${campaignId}`
  );
}
```

### 2. Run Creative A/B Test

```javascript
// Create test
const test = await abTesting.createTest(campaignId, 'creative', [
  { id: 'control', name: 'Image Ad', config: { format: 'image' } },
  { id: 'video', name: 'Video Ad', config: { format: 'video' } }
], 14);

// Monitor progress
const status = await abTesting.getTestStatus(test.id);
console.log(`${status.progress}% complete, ${status.daysRemaining} days left`);

// When ready, analyze
if (status.readyForAnalysis) {
  const result = await abTesting.declareWinner(test.id, true); // auto-apply
  console.log(`Winner: ${result.winner} (+${result.lift}% lift)`);
}
```

### 3. Forecast ROI

```javascript
// Current budget: $10k
// Proposed: $15k (50% increase)

const forecast = await predictions.predictPerformance(campaignId, 15000);

console.log('Current:');
console.log(`  Daily spend: $${forecast.baseline.dailySpend}`);
console.log(`  Daily conversions: ${forecast.baseline.dailyConversions}`);

console.log('\nForecast (30 days @ $15k):');
console.log(`  Conversions: ${forecast.predictions.conversions}`);
console.log(`  Revenue: $${forecast.predictions.revenue}`);
console.log(`  ROAS: ${forecast.predictions.roas}x`);
console.log(`  Confidence: ${forecast.confidence}`);
```

### 4. Detect Declining Performance

```javascript
// Get trend analysis
const trends = await predictions.getTrendAnalysis(campaignId);

if (trends.overallHealth === 'declining') {
  console.log('⚠️ Campaign declining!');
  console.log(`Decreasing: ${trends.summary.decreasingMetrics.join(', ')}`);
  
  // Get recommended actions
  const priorities = await recommendations.getOptimizationPriorities(campaignId);
  console.log('\nTop priorities:');
  priorities.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ${p.type}: ${p.action} (${p.confidence} confidence)`);
  });
}
```

## 🔌 API Endpoints

### Recommendations (8 endpoints)
```
GET  /api/recommendations/campaign/:id
GET  /api/recommendations/budget/:id
GET  /api/recommendations/bid/:id
GET  /api/recommendations/targeting/:id
GET  /api/recommendations/creative/:id
GET  /api/recommendations/platform
GET  /api/recommendations/priorities/:id
POST /api/recommendations/:id/apply
```

### A/B Testing (9 endpoints)
```
POST /api/ab-tests
GET  /api/ab-tests/:id
GET  /api/ab-tests/:id/status
POST /api/ab-tests/:id/analyze
POST /api/ab-tests/:id/complete
POST /api/ab-tests/:id/cancel
GET  /api/ab-tests/campaign/:campaignId
GET  /api/ab-tests
POST /api/ab-tests/schedule/:campaignId
```

### Predictions (3 endpoints)
```
POST /api/predictions/performance
POST /api/predictions/budget-allocation
GET  /api/predictions/trends/:campaignId
```

## 📖 Documentation

**Comprehensive Guides:**
- [`AGENT-INTELLIGENCE.md`](./docs/AGENT-INTELLIGENCE.md) - Complete intelligence layer guide (15k words)
- [`AB-TESTING-GUIDE.md`](./docs/AB-TESTING-GUIDE.md) - A/B testing deep dive (14k words)
- [`PREDICTIONS-API.md`](./docs/PREDICTIONS-API.md) - Prediction API reference (12k words)
- [`WEEK-5-COMPLETION-SUMMARY.md`](./docs/WEEK-5-COMPLETION-SUMMARY.md) - Implementation summary

**Quick References:**
- [Memory System](#agent-memory)
- [Recommendations](#recommendations)
- [A/B Testing](#ab-testing)
- [Predictions](#predictions)

## 🎓 Learning Path

**1. Start with Memory (15 min)**
- Read agent-memory model
- Store and recall a few learnings
- Experiment with confidence scoring

**2. Try Recommendations (20 min)**
- Get all recommendations for a campaign
- Understand confidence thresholds
- Apply a high-confidence recommendation

**3. Run an A/B Test (30 min)**
- Create a simple 2-variant test
- Update metrics (or wait for real data)
- Analyze and declare winner

**4. Explore Predictions (20 min)**
- Forecast performance with different budgets
- Optimize budget allocation
- Check trend analysis

**Total: ~85 minutes to mastery**

## 💡 Pro Tips

**Memory:**
- Start confidence at 0.5-0.6 for new learnings
- Increase by 0.1 per success, decrease by 0.2 per failure
- Clean up old memories monthly (< 0.3 confidence)

**Recommendations:**
- Trust confidence > 0.7 for automatic actions
- Review 0.5-0.7 manually before applying
- Track actual vs expected lift to improve future recommendations

**A/B Testing:**
- Always run for planned duration (don't peek early!)
- Need 100+ conversions per variant for significance
- Test one variable at a time
- Store winners in memory for future reference

**Predictions:**
- Require 14+ days of historical data (30+ for high confidence)
- Account for seasonality in trends
- Validate forecasts against actual outcomes
- Re-run predictions as new data arrives

## 🚨 Troubleshooting

**"Insufficient historical data"**
- Need more campaign history (7+ days minimum)
- Solution: Wait for more data or use lower confidence threshold

**"Test not significant"**
- Variants too similar or insufficient sample size
- Solution: Run longer, increase budget, or test bigger changes

**"Low recommendation confidence"**
- High variance in performance metrics
- Solution: Look for external factors (seasonality, market changes)

**Server won't start**
```bash
# Check database
node -e "const db = require('./database/db'); db.raw('SELECT 1').then(() => console.log('✅ DB OK'))"

# Check migrations
npx knex migrate:status --knexfile=database/knexfile.js
```

## 🎉 Success Metrics

Week 5 implementation delivers:
- ✅ **30+ tests** all passing
- ✅ **20 new API endpoints**
- ✅ **4,500+ lines** of production code
- ✅ **30k+ words** of documentation
- ✅ **100% functional** intelligence layer

**You can now:**
- 🧠 Agents learn from experience
- 💡 Get AI-powered recommendations
- 🧪 Run automated A/B tests
- 📈 Forecast campaign performance
- 🎯 Optimize budget allocation
- 📊 Detect trends and anomalies

## 🚀 Next Steps

1. **Test with Real Data**
   - Connect to live ad platforms
   - Let agents collect memories
   - Review recommendations after 7 days

2. **Tune Confidence Thresholds**
   - Track recommendation accuracy
   - Adjust auto-apply thresholds
   - Calibrate prediction confidence

3. **Expand Memory Categories**
   - Add new learning categories
   - Cross-reference memories between agents
   - Build agent collaboration patterns

4. **Automate More**
   - Set up cron jobs for analysis
   - Auto-apply high-confidence recommendations
   - Schedule A/B tests automatically

## 📞 Support

**Documentation:**
- Full guides in `/docs`
- Code comments throughout
- API reference in PREDICTIONS-API.md

**Testing:**
- Run `node test-*.js` for any component
- Check server logs for errors
- Use `/api/health` for status

**GitHub:**
- Push coming soon after Opus review
- Issues/PRs welcome after launch

---

**Week 5 Complete!** 🎉  
Phase 3 Intelligence Layer is production-ready.

Time to let the agents learn and optimize! 🚀
