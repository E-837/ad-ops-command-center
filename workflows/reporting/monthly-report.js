/**
 * Monthly Report Workflow
 * Generate comprehensive monthly rollup report across all platforms
 */

module.exports = {
  meta: {
    id: 'monthly-report',
    name: 'Monthly Performance Report',
    category: 'reporting',
    description: 'Generate a comprehensive monthly rollup report with insights and recommendations',
    version: '1.0.0',

    triggers: {
      manual: true,
      scheduled: '0 9 1 * *', // First day of month at 9am
      events: []
    },

    requiredConnectors: ['google-ads', 'meta'],
    optionalConnectors: ['dv360', 'ttd', 'google-docs'],

    inputs: {
      month: {
        type: 'string',
        required: true,
        description: 'Month in YYYY-MM format (e.g., 2026-02)'
      },
      platforms: {
        type: 'array',
        required: true,
        description: 'Array of platforms to include (google-ads, meta, dv360, ttd)'
      },
      includeYoY: {
        type: 'boolean',
        required: false,
        description: 'Include year-over-year comparison (default: true)'
      },
      createDocument: {
        type: 'boolean',
        required: false,
        description: 'Create Google Docs report (default: true)'
      }
    },

    outputs: ['reportUrl', 'summary', 'highlights', 'metrics'],

    stages: [
      { id: 'gather', name: 'Gather Platform Data', agent: 'data-collector' },
      { id: 'aggregate', name: 'Aggregate Metrics', agent: 'analyst' },
      { id: 'insights', name: 'Generate Insights', agent: 'analyst' },
      { id: 'document', name: 'Create Report Document', agent: 'report-generator' },
      { id: 'distribute', name: 'Distribute Report', agent: 'report-generator' }
    ],

    estimatedDuration: '10-20 min',
    isOrchestrator: false,
    subWorkflows: []
  },

  async run(params, context) {
    const {
      month,
      platforms = ['google-ads', 'meta'],
      includeYoY = true,
      createDocument = true
    } = params;

    const results = {
      stages: [],
      platformData: {},
      aggregatedMetrics: {},
      insights: [],
      highlights: [],
      artifacts: []
    };

    try {
      // Stage 1: Gather Platform Data
      context.updateStage('gather', 'running');
      context.log(`Gathering data for ${month} from ${platforms.length} platforms...`);

      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Last day of month

      for (const platform of platforms) {
        context.log(`Fetching data from ${platform}...`);

        // Simulate fetching platform data (would use real connectors)
        const platformMetrics = {
          platform,
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          campaigns: Math.floor(Math.random() * 20) + 5,
          impressions: Math.floor(Math.random() * 5000000) + 1000000,
          clicks: Math.floor(Math.random() * 100000) + 20000,
          conversions: Math.floor(Math.random() * 5000) + 500,
          spend: Math.random() * 500000 + 100000,
          revenue: Math.random() * 1000000 + 200000
        };

        // Calculate derived metrics
        platformMetrics.ctr = ((platformMetrics.clicks / platformMetrics.impressions) * 100).toFixed(2);
        platformMetrics.cpc = (platformMetrics.spend / platformMetrics.clicks).toFixed(2);
        platformMetrics.cpa = (platformMetrics.spend / platformMetrics.conversions).toFixed(2);
        platformMetrics.conversionRate = ((platformMetrics.conversions / platformMetrics.clicks) * 100).toFixed(2);
        platformMetrics.roas = (platformMetrics.revenue / platformMetrics.spend).toFixed(2);

        results.platformData[platform] = platformMetrics;
      }

      context.updateStage('gather', 'completed');
      results.stages.push({
        name: 'gather',
        status: 'completed',
        output: { platformsProcessed: platforms.length }
      });

      // Stage 2: Aggregate Metrics
      context.updateStage('aggregate', 'running');
      context.log('Aggregating cross-platform metrics...');

      const totals = {
        campaigns: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      };

      for (const platform in results.platformData) {
        const data = results.platformData[platform];
        totals.campaigns += data.campaigns;
        totals.impressions += data.impressions;
        totals.clicks += data.clicks;
        totals.conversions += data.conversions;
        totals.spend += data.spend;
        totals.revenue += data.revenue;
      }

      // Calculate aggregated derived metrics
      results.aggregatedMetrics = {
        ...totals,
        spend: Math.round(totals.spend),
        revenue: Math.round(totals.revenue),
        ctr: ((totals.clicks / totals.impressions) * 100).toFixed(2),
        cpc: (totals.spend / totals.clicks).toFixed(2),
        cpa: (totals.spend / totals.conversions).toFixed(2),
        conversionRate: ((totals.conversions / totals.clicks) * 100).toFixed(2),
        roas: (totals.revenue / totals.spend).toFixed(2)
      };

      // YoY comparison (simulated)
      if (includeYoY) {
        const yoyGrowth = {
          impressions: (Math.random() * 40 - 10).toFixed(1), // -10% to +30%
          clicks: (Math.random() * 40 - 10).toFixed(1),
          conversions: (Math.random() * 50 - 15).toFixed(1),
          spend: (Math.random() * 30 - 5).toFixed(1),
          revenue: (Math.random() * 50 - 10).toFixed(1)
        };

        results.aggregatedMetrics.yoyGrowth = yoyGrowth;
      }

      context.updateStage('aggregate', 'completed');
      results.stages.push({
        name: 'aggregate',
        status: 'completed',
        output: results.aggregatedMetrics
      });

      // Stage 3: Generate Insights
      context.updateStage('insights', 'running');
      context.log('Analyzing performance and generating insights...');

      const insights = [];
      const highlights = [];

      // ROAS analysis
      if (parseFloat(results.aggregatedMetrics.roas) > 3.0) {
        insights.push({
          type: 'positive',
          category: 'efficiency',
          message: `Excellent ROAS of ${results.aggregatedMetrics.roas}x indicates strong campaign performance`,
          recommendation: 'Consider scaling top-performing campaigns'
        });
        highlights.push(`Strong ${results.aggregatedMetrics.roas}x ROAS`);
      } else if (parseFloat(results.aggregatedMetrics.roas) < 1.5) {
        insights.push({
          type: 'concern',
          category: 'efficiency',
          message: `ROAS of ${results.aggregatedMetrics.roas}x is below target`,
          recommendation: 'Review targeting, creative, and bidding strategy'
        });
      }

      // Conversion rate analysis
      if (parseFloat(results.aggregatedMetrics.conversionRate) < 2.0) {
        insights.push({
          type: 'optimization',
          category: 'conversion',
          message: `Conversion rate of ${results.aggregatedMetrics.conversionRate}% has room for improvement`,
          recommendation: 'A/B test landing pages and creative messaging'
        });
      }

      // Platform comparison
      const platformsByRoas = Object.entries(results.platformData)
        .sort((a, b) => parseFloat(b[1].roas) - parseFloat(a[1].roas));

      const bestPlatform = platformsByRoas[0];
      highlights.push(`${bestPlatform[0]} leading with ${bestPlatform[1].roas}x ROAS`);

      insights.push({
        type: 'insight',
        category: 'platform-performance',
        message: `${bestPlatform[0]} is top performer with ${bestPlatform[1].roas}x ROAS`,
        recommendation: `Consider reallocating budget from lower-performing platforms`
      });

      // YoY trends
      if (includeYoY && results.aggregatedMetrics.yoyGrowth) {
        const revenueGrowth = parseFloat(results.aggregatedMetrics.yoyGrowth.revenue);
        if (revenueGrowth > 20) {
          highlights.push(`${revenueGrowth}% YoY revenue growth`);
        }
      }

      // Spend efficiency
      const spendStr = `$${(results.aggregatedMetrics.spend / 1000).toFixed(0)}K`;
      const revenueStr = `$${(results.aggregatedMetrics.revenue / 1000).toFixed(0)}K`;
      highlights.push(`${spendStr} spend → ${revenueStr} revenue`);

      results.insights = insights;
      results.highlights = highlights;

      context.updateStage('insights', 'completed');
      results.stages.push({
        name: 'insights',
        status: 'completed',
        output: { insightsGenerated: insights.length, highlights: highlights.length }
      });

      // Stage 4: Create Report Document
      if (createDocument) {
        context.updateStage('document', 'running');
        context.log('Creating report document...');

        // Simulate creating Google Docs report
        const reportUrl = `https://docs.google.com/document/d/report-${month}-${Date.now()}`;
        
        results.artifacts.push({
          type: 'doc',
          name: `Monthly Report - ${month}`,
          url: reportUrl
        });

        context.log(`Report document created: ${reportUrl}`);

        context.updateStage('document', 'completed');
        results.stages.push({
          name: 'document',
          status: 'completed',
          output: { reportUrl }
        });
      }

      // Stage 5: Distribute Report
      context.updateStage('distribute', 'running');
      context.log('Preparing report distribution...');

      // In real implementation, would send via email/Slack
      const distribution = {
        recipients: ['team@company.com', 'leadership@company.com'],
        method: 'email',
        subject: `Monthly Performance Report - ${month}`,
        scheduled: true
      };

      context.updateStage('distribute', 'completed');
      results.stages.push({
        name: 'distribute',
        status: 'completed',
        output: distribution
      });

      // Build summary
      const summary = {
        period: month,
        platforms: platforms.length,
        totalSpend: `$${(results.aggregatedMetrics.spend / 1000).toFixed(0)}K`,
        totalRevenue: `$${(results.aggregatedMetrics.revenue / 1000).toFixed(0)}K`,
        roas: `${results.aggregatedMetrics.roas}x`,
        conversions: results.aggregatedMetrics.conversions.toLocaleString(),
        insightCount: insights.length
      };

      return {
        success: true,
        reportUrl: results.artifacts[0]?.url || 'Not generated',
        summary,
        highlights: results.highlights,
        metrics: results.aggregatedMetrics,
        insights: results.insights,
        message: `Monthly report for ${month} completed. Generated ${insights.length} insights across ${platforms.length} platforms.`
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
