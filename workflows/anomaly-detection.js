/**
 * Anomaly Detection Workflow
 * Spike/drop alerts for campaign metrics
 */

const connectors = require('../connectors');
const analyst = require('../agents/analyst');
const logger = require('../utils/logger');

const name = 'Anomaly Detection';
const description = 'Detect unusual spikes or drops in campaign performance';

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    schedule: 'Every 4 hours',
    estimatedDuration: '5 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params = {}) {
  const results = {
    workflowId: `anomaly-${Date.now()}`,
    timestamp: new Date().toISOString(),
    anomalies: [],
    summary: {}
  };
  
  // Fetch all live campaigns
  const allCampaigns = await connectors.fetchAllCampaigns({ status: 'live' });
  
  for (const campaign of allCampaigns.campaigns) {
    try {
      // Get current metrics
      const connector = connectors.getConnector(campaign.dsp);
      const metricsResult = await connector.getMetrics(campaign.id);
      const currentMetrics = metricsResult.metrics;
      
      // Generate mock historical data (would be from DB in production)
      const historicalData = generateHistoricalData(currentMetrics);
      
      // Detect anomalies
      const campaignAnomalies = analyst.detectAnomalies(currentMetrics, historicalData);
      
      if (campaignAnomalies.length > 0) {
        results.anomalies.push({
          campaign: {
            id: campaign.id,
            name: campaign.name,
            dsp: campaign.dsp
          },
          detections: campaignAnomalies.map(a => ({
            ...a,
            recommendation: getAnomalyRecommendation(a)
          }))
        });
      }
    } catch (error) {
      logger.error('Anomaly detection error for campaign', { 
        campaignId: campaign.id, 
        campaignName: campaign.name,
        error: error.message,
        stack: error.stack 
      });
    }
  }
  
  // Generate summary
  const allDetections = results.anomalies.flatMap(a => a.detections);
  
  results.summary = {
    campaignsChecked: allCampaigns.campaigns.length,
    campaignsWithAnomalies: results.anomalies.length,
    totalAnomalies: allDetections.length,
    bySeverity: {
      critical: allDetections.filter(d => d.severity === 'critical').length,
      warning: allDetections.filter(d => d.severity === 'warning').length
    },
    byDirection: {
      spikes: allDetections.filter(d => d.direction === 'spike').length,
      drops: allDetections.filter(d => d.direction === 'drop').length
    },
    byMetric: groupByMetric(allDetections)
  };
  
  return results;
}

/**
 * Generate mock historical data for a metric
 */
function generateHistoricalData(currentMetrics) {
  const historical = {};
  
  for (const [metric, value] of Object.entries(currentMetrics)) {
    // Generate 14 days of historical data with some variance
    historical[metric] = [];
    const baseValue = value * 0.95; // Assume current is slightly higher than historical avg
    
    for (let i = 0; i < 14; i++) {
      const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
      historical[metric].push(baseValue * (1 + variance));
    }
  }
  
  return historical;
}

/**
 * Get recommendation for an anomaly
 */
function getAnomalyRecommendation(anomaly) {
  const { metric, direction, severity } = anomaly;
  
  // Metric-specific recommendations
  const metricRecommendations = {
    cpm: {
      spike: 'Review inventory sources and consider adding bid caps',
      drop: 'Monitor for quality issues - low CPM may indicate low-quality inventory'
    },
    ctr: {
      spike: 'Investigate for click fraud, verify traffic quality',
      drop: 'Review creative performance, consider A/B testing new variants'
    },
    viewability: {
      spike: 'Great! Consider maintaining current inventory mix',
      drop: 'Enable pre-bid viewability filtering, review site list'
    },
    impressions: {
      spike: 'Check for budget pacing issues, verify targeting',
      drop: 'Review bid levels, check for inventory constraints'
    },
    conversions: {
      spike: 'Verify conversion tracking, check for attribution issues',
      drop: 'Review landing pages, check pixel implementation'
    },
    vcr: {
      spike: 'Positive trend - consider scaling video investment',
      drop: 'Review video creative length and engagement'
    }
  };
  
  if (metricRecommendations[metric]) {
    return metricRecommendations[metric][direction];
  }
  
  // Generic recommendation
  return direction === 'spike' ?
    `Investigate cause of ${metric} spike` :
    `Review factors affecting ${metric} decline`;
}

/**
 * Group anomalies by metric
 */
function groupByMetric(detections) {
  const byMetric = {};
  
  for (const detection of detections) {
    if (!byMetric[detection.metric]) {
      byMetric[detection.metric] = 0;
    }
    byMetric[detection.metric]++;
  }
  
  return byMetric;
}

/**
 * Get priority alerts (critical only)
 */
function getCriticalAlerts(results) {
  return results.anomalies.flatMap(a => 
    a.detections
      .filter(d => d.severity === 'critical')
      .map(d => ({
        campaign: a.campaign.name,
        dsp: a.campaign.dsp,
        ...d
      }))
  );
}

// Metadata for new registry system
const meta = {
  id: 'anomaly-detection',
  name: 'Anomaly Detection',
  category: 'reporting',
  description: 'Detect unusual spikes or drops in campaign performance metrics',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: '0 */4 * * *',  // Every 4 hours
    events: ['metric.threshold']
  },
  
  requiredConnectors: ['ttd', 'dv360', 'google-ads', 'meta-ads'],
  optionalConnectors: [],
  
  inputs: {
    sensitivity: { type: 'string', required: false, description: 'Detection sensitivity (low, medium, high)', default: 'medium' },
    metrics: { type: 'array', required: false, description: 'Specific metrics to monitor (empty = all)', default: [] }
  },
  
  outputs: ['workflowId', 'timestamp', 'anomalies', 'summary'],
  
  stages: [
    { id: 'fetch', name: 'Fetch Metrics', agent: 'trader' },
    { id: 'analyze', name: 'Detect Anomalies', agent: 'analyst' },
    { id: 'assess', name: 'Assess Severity', agent: 'analyst' }
  ],
  estimatedDuration: '5 minutes',
  
  isOrchestrator: false,
  subWorkflows: []
};

module.exports = {
  name,
  description,
  getInfo,
  run,
  getCriticalAlerts,
  meta  // New metadata export
};
