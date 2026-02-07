/**
 * Pacing Check Workflow
 * Daily budget vs spend monitoring
 */

const connectors = require('../connectors');
const domain = require('../domain');

const name = 'Pacing Check';
const description = 'Daily monitoring of campaign pacing across all DSPs';

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    schedule: 'Daily at 9 AM',
    estimatedDuration: '5 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params = {}) {
  const results = {
    workflowId: `pacing-${Date.now()}`,
    timestamp: new Date().toISOString(),
    dsps: {},
    summary: {},
    alerts: []
  };
  
  // Fetch pacing from all DSPs
  const allPacing = await connectors.fetchAllPacing();
  
  // Process by DSP
  for (const pacing of allPacing.pacing) {
    if (!results.dsps[pacing.dsp]) {
      results.dsps[pacing.dsp] = {
        campaigns: [],
        totalBudget: 0,
        totalSpent: 0
      };
    }
    
    results.dsps[pacing.dsp].campaigns.push(pacing);
    results.dsps[pacing.dsp].totalBudget += pacing.budget;
    results.dsps[pacing.dsp].totalSpent += pacing.spent;
    
    // Check for alerts
    if (pacing.status.includes('critical')) {
      results.alerts.push({
        severity: 'critical',
        campaign: pacing.campaignName,
        dsp: pacing.dsp,
        variance: pacing.variance,
        status: pacing.status,
        action: pacing.status.includes('behind') ?
          'Increase bids by 25-30%' :
          'Decrease bids by 20-25%'
      });
    } else if (pacing.status === 'behind' || pacing.status === 'ahead') {
      results.alerts.push({
        severity: 'warning',
        campaign: pacing.campaignName,
        dsp: pacing.dsp,
        variance: pacing.variance,
        status: pacing.status,
        action: pacing.status === 'behind' ?
          'Consider increasing bids by 10-15%' :
          'Monitor for early budget exhaustion'
      });
    }
  }
  
  // Calculate summary
  const allCampaigns = allPacing.pacing;
  results.summary = {
    totalCampaigns: allCampaigns.length,
    onPace: allCampaigns.filter(p => p.status === 'on_pace').length,
    behind: allCampaigns.filter(p => p.status.includes('behind')).length,
    ahead: allCampaigns.filter(p => p.status.includes('ahead')).length,
    totalBudget: allCampaigns.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: allCampaigns.reduce((sum, p) => sum + p.spent, 0),
    criticalAlerts: results.alerts.filter(a => a.severity === 'critical').length
  };
  
  results.summary.overallPacing = 
    (results.summary.totalSpent / results.summary.totalBudget * 100).toFixed(1) + '%';
  
  // Add errors if any
  if (allPacing.errors.length > 0) {
    results.errors = allPacing.errors;
  }
  
  return results;
}

/**
 * Get recommended actions
 */
function getRecommendations(pacingResults) {
  const recommendations = [];
  
  // Priority: Critical behind
  const criticalBehind = pacingResults.alerts.filter(
    a => a.severity === 'critical' && a.status === 'critical_behind'
  );
  
  if (criticalBehind.length > 0) {
    recommendations.push({
      priority: 1,
      action: 'URGENT: Address critical underpacing',
      campaigns: criticalBehind.map(a => a.campaign),
      steps: [
        'Increase bids by 25-30%',
        'Expand targeting criteria',
        'Add additional inventory sources',
        'Review frequency caps'
      ]
    });
  }
  
  // Critical ahead
  const criticalAhead = pacingResults.alerts.filter(
    a => a.severity === 'critical' && a.status === 'critical_ahead'
  );
  
  if (criticalAhead.length > 0) {
    recommendations.push({
      priority: 2,
      action: 'URGENT: Prevent early budget exhaustion',
      campaigns: criticalAhead.map(a => a.campaign),
      steps: [
        'Decrease bids by 20-25%',
        'Tighten frequency caps',
        'Consider pausing until next period'
      ]
    });
  }
  
  return recommendations;
}

module.exports = {
  name,
  description,
  getInfo,
  run,
  getRecommendations
};
