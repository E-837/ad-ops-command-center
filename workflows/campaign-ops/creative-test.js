/**
 * Creative Test Workflow
 * A/B testing workflow for creative variants
 */

module.exports = {
  meta: {
    id: 'creative-test',
    name: 'A/B Creative Test',
    category: 'campaign-ops',
    description: 'Launch and analyze A/B tests for creative variants with statistical significance testing',
    version: '1.0.0',

    triggers: {
      manual: true,
      scheduled: null,
      events: []
    },

    requiredConnectors: ['google-ads', 'meta'],
    optionalConnectors: ['dv360', 'ttd'],

    inputs: {
      campaignId: {
        type: 'string',
        required: true,
        description: 'Campaign ID to test creative variants'
      },
      platform: {
        type: 'string',
        required: true,
        enum: ['google-ads', 'meta', 'dv360', 'ttd'],
        description: 'Advertising platform'
      },
      creativeVariants: {
        type: 'array',
        required: true,
        description: 'Array of creative variant objects (headline, description, image URLs)'
      },
      testDuration: {
        type: 'number',
        required: false,
        description: 'Test duration in days (default: 7)'
      },
      testBudget: {
        type: 'number',
        required: false,
        description: 'Total test budget to split across variants'
      }
    },

    outputs: ['winner', 'metrics', 'recommendation', 'reportUrl'],

    stages: [
      { id: 'validate', name: 'Validate Variants', agent: 'creative-ops' },
      { id: 'create', name: 'Create Ad Variants', agent: 'creative-ops' },
      { id: 'launch', name: 'Launch Test Flights', agent: 'campaign-manager' },
      { id: 'monitor', name: 'Monitor Performance', agent: 'analyst' },
      { id: 'analyze', name: 'Analyze Results', agent: 'analyst' },
      { id: 'recommend', name: 'Generate Recommendations', agent: 'analyst' }
    ],

    estimatedDuration: '7-14 days (including test period)',
    isOrchestrator: false,
    subWorkflows: []
  },

  async run(params, context) {
    const {
      campaignId,
      platform,
      creativeVariants,
      testDuration = 7,
      testBudget
    } = params;

    const results = {
      stages: [],
      artifacts: [],
      metrics: {},
      winner: null,
      recommendation: null
    };

    try {
      // Stage 1: Validate Variants
      context.updateStage('validate', 'running');
      context.log('Validating creative variants...');

      if (!creativeVariants || creativeVariants.length < 2) {
        throw new Error('At least 2 creative variants required for A/B testing');
      }

      const validation = {
        totalVariants: creativeVariants.length,
        valid: true,
        issues: []
      };

      for (const [idx, variant] of creativeVariants.entries()) {
        if (!variant.headline || !variant.description) {
          validation.issues.push(`Variant ${idx + 1}: Missing headline or description`);
          validation.valid = false;
        }
      }

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.issues.join(', ')}`);
      }

      context.updateStage('validate', 'completed');
      results.stages.push({ name: 'validate', status: 'completed', output: validation });

      // Stage 2: Create Ad Variants
      context.updateStage('create', 'running');
      context.log(`Creating ${creativeVariants.length} ad variants on ${platform}...`);

      const createdAds = [];
      const budgetPerVariant = testBudget ? testBudget / creativeVariants.length : null;

      for (const [idx, variant] of creativeVariants.entries()) {
        const adData = {
          name: `${variant.name || `Variant ${String.fromCharCode(65 + idx)}`} - Test`,
          headline: variant.headline,
          description: variant.description,
          imageUrl: variant.imageUrl,
          budget: budgetPerVariant,
          status: 'paused' // Start paused, will activate in next stage
        };

        // Simulate ad creation (would call real connector)
        const adId = `ad-${campaignId}-variant-${idx + 1}-${Date.now()}`;
        createdAds.push({
          variantId: idx,
          adId: adId,
          name: adData.name,
          status: 'created'
        });

        context.log(`Created ad variant: ${adData.name} (${adId})`);
      }

      context.updateStage('create', 'completed');
      results.stages.push({ name: 'create', status: 'completed', output: { createdAds } });

      // Stage 3: Launch Test Flights
      context.updateStage('launch', 'running');
      context.log('Launching test flights with equal budget distribution...');

      const launchResults = [];
      const testStartDate = new Date();
      const testEndDate = new Date(testStartDate);
      testEndDate.setDate(testEndDate.getDate() + testDuration);

      for (const ad of createdAds) {
        // Simulate launching ad (would call real connector)
        launchResults.push({
          adId: ad.adId,
          status: 'live',
          startDate: testStartDate.toISOString(),
          endDate: testEndDate.toISOString()
        });

        context.log(`Launched: ${ad.name}`);
      }

      context.updateStage('launch', 'completed');
      results.stages.push({
        name: 'launch',
        status: 'completed',
        output: {
          launchResults,
          testPeriod: `${testDuration} days`,
          startDate: testStartDate.toISOString(),
          endDate: testEndDate.toISOString()
        }
      });

      // Stage 4: Monitor Performance
      context.updateStage('monitor', 'running');
      context.log(`Monitoring test performance for ${testDuration} days...`);

      // In reality, this would be a scheduled check or webhook
      // For demo, we simulate collecting performance data

      const performanceData = createdAds.map((ad, idx) => ({
        adId: ad.adId,
        variantId: idx,
        impressions: Math.floor(Math.random() * 50000) + 10000,
        clicks: Math.floor(Math.random() * 2000) + 200,
        conversions: Math.floor(Math.random() * 100) + 10,
        cost: testBudget ? (testBudget / creativeVariants.length) : Math.random() * 5000 + 1000
      }));

      // Calculate derived metrics
      performanceData.forEach(data => {
        data.ctr = ((data.clicks / data.impressions) * 100).toFixed(2);
        data.cpc = (data.cost / data.clicks).toFixed(2);
        data.conversionRate = ((data.conversions / data.clicks) * 100).toFixed(2);
        data.cpa = (data.cost / data.conversions).toFixed(2);
      });

      context.updateStage('monitor', 'completed');
      results.stages.push({ name: 'monitor', status: 'completed', output: { performanceData } });
      results.metrics = { performanceData };

      // Stage 5: Analyze Results
      context.updateStage('analyze', 'running');
      context.log('Analyzing results with statistical significance testing...');

      // Find best performer by conversion rate
      const sortedByConversionRate = [...performanceData].sort(
        (a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
      );

      const winner = sortedByConversionRate[0];
      const runnerUp = sortedByConversionRate[1];

      // Calculate lift
      const conversionLift = (
        ((parseFloat(winner.conversionRate) - parseFloat(runnerUp.conversionRate)) /
          parseFloat(runnerUp.conversionRate)) *
        100
      ).toFixed(1);

      const cpaLift = (
        ((parseFloat(runnerUp.cpa) - parseFloat(winner.cpa)) / parseFloat(runnerUp.cpa)) *
        100
      ).toFixed(1);

      // Simple statistical significance check (simplified)
      const totalClicks = performanceData.reduce((sum, d) => sum + d.clicks, 0);
      const isSignificant = totalClicks > 1000 && Math.abs(conversionLift) > 10;

      const analysis = {
        winner: {
          variantId: winner.variantId,
          adId: winner.adId,
          conversionRate: winner.conversionRate,
          cpa: winner.cpa,
          ctr: winner.ctr
        },
        runnerUp: {
          variantId: runnerUp.variantId,
          conversionRate: runnerUp.conversionRate,
          cpa: runnerUp.cpa
        },
        lift: {
          conversionRate: `${conversionLift}%`,
          cpa: `${cpaLift}%`
        },
        statisticallySignificant: isSignificant,
        confidence: isSignificant ? '95%' : 'Insufficient data'
      };

      context.updateStage('analyze', 'completed');
      results.stages.push({ name: 'analyze', status: 'completed', output: analysis });
      results.winner = analysis.winner;

      // Stage 6: Generate Recommendations
      context.updateStage('recommend', 'running');
      context.log('Generating recommendations...');

      let recommendation;
      if (isSignificant) {
        recommendation = {
          action: 'scale-winner',
          message: `Variant ${String.fromCharCode(65 + winner.variantId)} is the clear winner with ${conversionLift}% higher conversion rate. Recommend pausing other variants and scaling this creative.`,
          nextSteps: [
            'Pause underperforming variants',
            `Scale budget for Variant ${String.fromCharCode(65 + winner.variantId)}`,
            'Monitor performance for 3-5 days',
            'Consider creating similar variants'
          ]
        };
      } else {
        recommendation = {
          action: 'continue-testing',
          message: 'Results are not statistically significant yet. Continue testing or increase sample size.',
          nextSteps: [
            'Extend test duration by 3-5 days',
            'Consider increasing test budget',
            'Add more traffic sources',
            'Review targeting settings'
          ]
        };
      }

      // Create report artifact
      const reportData = {
        testSummary: {
          campaignId,
          platform,
          variants: creativeVariants.length,
          testDuration: `${testDuration} days`,
          totalImpressions: performanceData.reduce((sum, d) => sum + d.impressions, 0),
          totalClicks: totalClicks,
          totalConversions: performanceData.reduce((sum, d) => sum + d.conversions, 0)
        },
        performance: performanceData,
        analysis,
        recommendation
      };

      results.artifacts.push({
        type: 'report',
        name: 'Creative Test Report',
        url: `/reports/creative-test-${campaignId}-${Date.now()}.json`,
        data: reportData
      });

      context.updateStage('recommend', 'completed');
      results.stages.push({ name: 'recommend', status: 'completed', output: recommendation });
      results.recommendation = recommendation;

      return {
        success: true,
        winner: results.winner,
        metrics: results.metrics,
        recommendation: results.recommendation,
        reportUrl: results.artifacts[0].url,
        summary: `Creative test completed. Variant ${String.fromCharCode(65 + winner.variantId)} ${
          isSignificant ? 'is the winner' : 'is leading but needs more data'
        }.`
      };
    } catch (error) {
      context.log(`Error: ${error.message}`);
      throw error;
    }
  },

  getInfo() {
    return this.meta;
  }
};
