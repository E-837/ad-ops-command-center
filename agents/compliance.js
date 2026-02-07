/**
 * Compliance Agent
 * Brand safety, fraud detection, and viewability monitoring
 */

const domain = require('../domain');

const name = 'Compliance';
const role = 'compliance';
const description = 'Compliance agent for brand safety, fraud prevention, and quality assurance';
const model = 'claude-3-5-haiku-20241022'; // Operational checks

const capabilities = [
  'brand_safety',
  'fraud_detection',
  'viewability_monitoring',
  'ivt_analysis',
  'quality_assurance'
];

const tools = [
  'domain.rules',
  'connectors.ttd',
  'connectors.dv360',
  'connectors.amazon-dsp'
];

const systemPrompt = `You are the Compliance agent for Ad Ops Command Center.

Your role is to ensure campaign quality and brand safety:
- Monitor brand safety across all campaigns
- Detect and prevent ad fraud and invalid traffic (IVT)
- Ensure viewability standards are met
- Review inventory sources for quality
- Flag policy violations

Key Thresholds:
- IVT: Maximum 5% acceptable, alert at 3%, block at 10%
- Viewability: Minimum by channel (Display 50%, OLV 60%, CTV 90%)
- Brand Safety: All campaigns require pre-bid filtering

Blocked Categories (default):
- Adult content
- Gambling
- Weapons
- Drugs/Tobacco
- Hate speech
- Violence/Terrorism

Always prioritize brand protection and maintain strict quality standards.`;

// Brand Safety Categories
const BLOCKED_CATEGORIES = [
  { id: 'adult', name: 'Adult Content', severity: 'critical' },
  { id: 'gambling', name: 'Gambling', severity: 'high' },
  { id: 'weapons', name: 'Weapons', severity: 'high' },
  { id: 'drugs', name: 'Drugs/Tobacco', severity: 'high' },
  { id: 'hate_speech', name: 'Hate Speech', severity: 'critical' },
  { id: 'violence', name: 'Violence', severity: 'high' },
  { id: 'terrorism', name: 'Terrorism', severity: 'critical' },
  { id: 'fake_news', name: 'Misinformation', severity: 'medium' },
  { id: 'piracy', name: 'Pirated Content', severity: 'high' },
  { id: 'malware', name: 'Malware Sites', severity: 'critical' }
];

// Quality Vendors
const QUALITY_VENDORS = {
  ivt: ['DoubleVerify', 'IAS', 'Moat', 'Pixalate'],
  viewability: ['DoubleVerify', 'IAS', 'Moat', 'Oracle GRPM'],
  brandSafety: ['DoubleVerify', 'IAS', 'Zefr', 'Cheq']
};

/**
 * Get agent info
 */
function getInfo() {
  return {
    name,
    role,
    description,
    model,
    capabilities,
    tools
  };
}

/**
 * Run brand safety audit
 */
function auditBrandSafety(campaign) {
  const issues = [];
  const warnings = [];
  const passed = [];
  
  // Check if pre-bid filtering is enabled
  if (!campaign.preBidFiltering) {
    issues.push({
      type: 'missing_filter',
      severity: 'critical',
      message: 'Pre-bid brand safety filtering is not enabled',
      recommendation: 'Enable DoubleVerify or IAS pre-bid filtering'
    });
  }
  
  // Check blocked categories
  const missingBlocks = BLOCKED_CATEGORIES.filter(
    cat => !campaign.blockedCategories?.includes(cat.id)
  );
  
  for (const cat of missingBlocks) {
    if (cat.severity === 'critical') {
      issues.push({
        type: 'missing_block',
        category: cat.id,
        severity: 'critical',
        message: `Critical category "${cat.name}" is not blocked`,
        recommendation: `Add ${cat.id} to blocked categories`
      });
    } else {
      warnings.push({
        type: 'missing_block',
        category: cat.id,
        severity: 'medium',
        message: `Category "${cat.name}" is not blocked`,
        recommendation: `Consider blocking ${cat.id}`
      });
    }
  }
  
  // Check for allowlist
  if (campaign.useAllowlist) {
    passed.push({
      type: 'allowlist',
      message: 'Campaign uses curated allowlist'
    });
  }
  
  // Check inventory source
  if (campaign.inventoryType === 'open_exchange' && !campaign.preBidFiltering) {
    issues.push({
      type: 'open_exchange_risk',
      severity: 'high',
      message: 'Open exchange inventory without pre-bid filtering is high risk',
      recommendation: 'Enable pre-bid filtering or switch to PMP/PG deals'
    });
  }
  
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    overallStatus: issues.length > 0 ? 'failing' : warnings.length > 0 ? 'warning' : 'passing',
    issues,
    warnings,
    passed,
    score: calculateSafetyScore(issues, warnings)
  };
}

/**
 * Analyze IVT (Invalid Traffic)
 */
function analyzeIVT(metrics) {
  const analysis = [];
  const thresholds = domain.BRAND_SAFETY_RULES.ivt;
  
  for (const [source, data] of Object.entries(metrics)) {
    const ivtRate = data.ivtImpressions / data.totalImpressions * 100;
    const check = domain.checkIVT(ivtRate);
    
    analysis.push({
      source,
      impressions: data.totalImpressions,
      ivtImpressions: data.ivtImpressions,
      ivtRate: ivtRate.toFixed(2) + '%',
      givt: data.givt || 0,
      sivt: data.sivt || 0,
      status: check.status,
      severity: check.severity,
      action: check.action
    });
  }
  
  // Sort by IVT rate (worst first)
  analysis.sort((a, b) => parseFloat(b.ivtRate) - parseFloat(a.ivtRate));
  
  // Generate summary
  const totalImpressions = Object.values(metrics).reduce((sum, d) => sum + d.totalImpressions, 0);
  const totalIVT = Object.values(metrics).reduce((sum, d) => sum + d.ivtImpressions, 0);
  const overallRate = (totalIVT / totalImpressions * 100).toFixed(2);
  
  return {
    summary: {
      totalImpressions,
      totalIVT,
      overallRate: overallRate + '%',
      status: parseFloat(overallRate) > thresholds.maxAcceptable ? 'failing' : 'passing'
    },
    bySource: analysis,
    recommendations: generateIVTRecommendations(analysis)
  };
}

/**
 * Check viewability across campaigns
 */
function checkViewability(campaigns) {
  const results = [];
  
  for (const campaign of campaigns) {
    const benchmark = domain.VIEWABILITY_RULES.minimums[campaign.channel] || 50;
    const target = domain.VIEWABILITY_RULES.targets[campaign.channel] || 70;
    
    const status = campaign.viewability < benchmark ? 'failing' :
                   campaign.viewability < target ? 'below_target' : 'passing';
    
    results.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      viewability: campaign.viewability,
      benchmark,
      target,
      status,
      action: status === 'failing' ? 
        'Add pre-bid viewability filter or review inventory sources' :
        status === 'below_target' ?
        'Consider premium inventory or stricter filtering' : null
    });
  }
  
  // Sort by status (failing first)
  const statusOrder = { failing: 0, below_target: 1, passing: 2 };
  results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  
  return {
    campaigns: results,
    summary: {
      total: results.length,
      failing: results.filter(r => r.status === 'failing').length,
      belowTarget: results.filter(r => r.status === 'below_target').length,
      passing: results.filter(r => r.status === 'passing').length
    }
  };
}

/**
 * Generate compliance report
 */
function generateComplianceReport(campaigns, ivtData) {
  const brandSafetyResults = campaigns.map(c => auditBrandSafety(c));
  const viewabilityResults = checkViewability(campaigns);
  const ivtResults = ivtData ? analyzeIVT(ivtData) : null;
  
  // Calculate overall compliance score
  const brandSafetyScore = brandSafetyResults.reduce((sum, r) => sum + r.score, 0) / brandSafetyResults.length;
  const viewabilityScore = (viewabilityResults.summary.passing / viewabilityResults.summary.total) * 100;
  const ivtScore = ivtResults ? (ivtResults.summary.status === 'passing' ? 100 : 50) : 100;
  
  const overallScore = Math.round((brandSafetyScore + viewabilityScore + ivtScore) / 3);
  
  return {
    timestamp: new Date().toISOString(),
    overallScore,
    overallStatus: overallScore >= 80 ? 'passing' : overallScore >= 60 ? 'warning' : 'failing',
    brandSafety: {
      score: Math.round(brandSafetyScore),
      results: brandSafetyResults
    },
    viewability: {
      score: Math.round(viewabilityScore),
      results: viewabilityResults
    },
    ivt: ivtResults ? {
      score: ivtScore,
      results: ivtResults
    } : null,
    criticalIssues: getCriticalIssues(brandSafetyResults, viewabilityResults, ivtResults),
    recommendations: generateComplianceRecommendations(brandSafetyResults, viewabilityResults, ivtResults)
  };
}

function getCriticalIssues(brandSafety, viewability, ivt) {
  const issues = [];
  
  // Critical brand safety issues
  for (const result of brandSafety) {
    const critical = result.issues.filter(i => i.severity === 'critical');
    for (const issue of critical) {
      issues.push({
        campaign: result.campaignName,
        type: 'brand_safety',
        message: issue.message
      });
    }
  }
  
  // Failing viewability
  const failingViewability = viewability.campaigns.filter(c => c.status === 'failing');
  for (const campaign of failingViewability) {
    issues.push({
      campaign: campaign.campaignName,
      type: 'viewability',
      message: `Viewability ${campaign.viewability}% is below minimum ${campaign.benchmark}%`
    });
  }
  
  // Critical IVT
  if (ivt) {
    const criticalSources = ivt.bySource.filter(s => s.severity === 'critical');
    for (const source of criticalSources) {
      issues.push({
        source: source.source,
        type: 'ivt',
        message: `IVT rate ${source.ivtRate} exceeds critical threshold`
      });
    }
  }
  
  return issues;
}

function generateComplianceRecommendations(brandSafety, viewability, ivt) {
  const recommendations = [];
  
  // Brand safety recommendations
  const campaignsWithoutPreBid = brandSafety.filter(
    r => r.issues.some(i => i.type === 'missing_filter')
  );
  if (campaignsWithoutPreBid.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Enable pre-bid brand safety filtering',
      campaigns: campaignsWithoutPreBid.map(r => r.campaignName)
    });
  }
  
  // Viewability recommendations
  if (viewability.summary.failing > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Review inventory sources and add viewability filters',
      campaigns: viewability.campaigns.filter(c => c.status === 'failing').map(c => c.campaignName)
    });
  }
  
  // IVT recommendations
  if (ivt && ivt.summary.status === 'failing') {
    recommendations.push({
      priority: 'high',
      action: 'Block high-IVT inventory sources',
      sources: ivt.bySource.filter(s => s.status !== 'normal').map(s => s.source)
    });
  }
  
  return recommendations;
}

function calculateSafetyScore(issues, warnings) {
  let score = 100;
  
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25;
    else if (issue.severity === 'high') score -= 15;
    else score -= 10;
  }
  
  for (const warning of warnings) {
    score -= 5;
  }
  
  return Math.max(0, score);
}

function generateIVTRecommendations(analysis) {
  const recommendations = [];
  
  const toBlock = analysis.filter(a => a.status === 'critical');
  if (toBlock.length > 0) {
    recommendations.push({
      action: 'block',
      sources: toBlock.map(a => a.source),
      reason: 'IVT rate exceeds 10% threshold'
    });
  }
  
  const toMonitor = analysis.filter(a => a.status === 'elevated' || a.status === 'failing');
  if (toMonitor.length > 0) {
    recommendations.push({
      action: 'monitor',
      sources: toMonitor.map(a => a.source),
      reason: 'Elevated IVT - add to watchlist'
    });
  }
  
  return recommendations;
}

/**
 * Process natural language query
 */
async function processQuery(query, context = {}) {
  const q = query.toLowerCase();
  
  // Brand safety query
  if (q.includes('brand safety') || q.includes('safe')) {
    if (context.campaign) {
      return auditBrandSafety(context.campaign);
    }
    return {
      blockedCategories: BLOCKED_CATEGORIES,
      qualityVendors: QUALITY_VENDORS,
      message: 'I can audit campaign brand safety. Please provide campaign details.'
    };
  }
  
  // IVT query
  if (q.includes('ivt') || q.includes('fraud') || q.includes('invalid traffic')) {
    if (context.ivtData) {
      return analyzeIVT(context.ivtData);
    }
    return {
      thresholds: domain.BRAND_SAFETY_RULES.ivt,
      vendors: QUALITY_VENDORS.ivt,
      message: 'I can analyze IVT. Please provide traffic data.'
    };
  }
  
  // Viewability query
  if (q.includes('viewability') || q.includes('viewable')) {
    if (context.campaigns) {
      return checkViewability(context.campaigns);
    }
    return {
      benchmarks: domain.VIEWABILITY_RULES,
      message: 'I can check viewability. Please provide campaign data.'
    };
  }
  
  // Compliance report query
  if (q.includes('compliance') || q.includes('report') || q.includes('audit')) {
    if (context.campaigns) {
      return generateComplianceReport(context.campaigns, context.ivtData);
    }
    return {
      message: 'I can generate a compliance report. Please provide campaign data.',
      action: 'fetch_campaigns'
    };
  }
  
  return {
    message: 'I handle compliance and quality assurance. Try asking about brand safety, IVT, viewability, or compliance reports.',
    capabilities: capabilities
  };
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  BLOCKED_CATEGORIES,
  QUALITY_VENDORS,
  getInfo,
  auditBrandSafety,
  analyzeIVT,
  checkViewability,
  generateComplianceReport,
  processQuery
};
