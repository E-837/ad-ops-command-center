/** Compliance Agent */

const domain = require('../domain');
const BaseAgent = require('./base-agent');

const BLOCKED_CATEGORIES = [
  { id: 'adult', name: 'Adult Content', severity: 'critical' },
  { id: 'gambling', name: 'Gambling', severity: 'high' },
  { id: 'weapons', name: 'Weapons', severity: 'high' },
  { id: 'drugs', name: 'Drugs/Tobacco', severity: 'high' },
  { id: 'hate_speech', name: 'Hate Speech', severity: 'critical' }
];
const QUALITY_VENDORS = { ivt: ['DoubleVerify', 'IAS', 'Moat'], viewability: ['DoubleVerify', 'IAS', 'Moat'], brandSafety: ['DoubleVerify', 'IAS', 'Zefr'] };

class ComplianceAgent extends BaseAgent {
  constructor() {
    super({
      id: 'compliance', name: 'Compliance', role: 'compliance',
      description: 'Compliance agent for brand safety, fraud prevention, and quality assurance',
      model: 'claude-3-5-haiku-20241022',
      capabilities: ['brand_safety', 'fraud_detection', 'viewability_monitoring', 'ivt_analysis', 'quality_assurance'],
      tools: ['domain.rules', 'connectors.ttd', 'connectors.dv360', 'connectors.amazon-dsp']
    });
    this.BLOCKED_CATEGORIES = BLOCKED_CATEGORIES;
    this.QUALITY_VENDORS = QUALITY_VENDORS;
  }

  auditBrandSafety(campaign) {
    const issues = [], warnings = [];
    if (!campaign.preBidFiltering) issues.push({ type: 'missing_filter', severity: 'critical', message: 'Pre-bid filtering not enabled' });
    const missingBlocks = BLOCKED_CATEGORIES.filter((cat) => !campaign.blockedCategories?.includes(cat.id));
    for (const cat of missingBlocks) (cat.severity === 'critical' ? issues : warnings).push({ type: 'missing_block', category: cat.id, severity: cat.severity, message: `${cat.name} not blocked` });
    return { campaignId: campaign.id, campaignName: campaign.name, overallStatus: issues.length ? 'failing' : warnings.length ? 'warning' : 'passing', issues, warnings, score: Math.max(0, 100 - issues.length * 20 - warnings.length * 5) };
  }

  analyzeIVT(metrics) {
    const analysis = Object.entries(metrics).map(([source, data]) => {
      const ivtRate = (data.ivtImpressions / Math.max(1, data.totalImpressions)) * 100;
      const check = domain.checkIVT(ivtRate);
      return { source, ivtRate: `${ivtRate.toFixed(2)}%`, status: check.status, severity: check.severity, action: check.action };
    }).sort((a, b) => parseFloat(b.ivtRate) - parseFloat(a.ivtRate));
    return { bySource: analysis };
  }

  checkViewability(campaigns) {
    const results = campaigns.map((campaign) => {
      const benchmark = domain.VIEWABILITY_RULES.minimums[campaign.channel] || 50;
      const target = domain.VIEWABILITY_RULES.targets[campaign.channel] || 70;
      const status = campaign.viewability < benchmark ? 'failing' : campaign.viewability < target ? 'below_target' : 'passing';
      return { campaignId: campaign.id, campaignName: campaign.name, channel: campaign.channel, viewability: campaign.viewability, benchmark, target, status };
    });
    return { campaigns: results, summary: { total: results.length, failing: results.filter((r) => r.status === 'failing').length } };
  }

  generateComplianceReport(campaigns, ivtData) {
    const brandSafetyResults = campaigns.map((c) => this.auditBrandSafety(c));
    const viewabilityResults = this.checkViewability(campaigns);
    const ivtResults = ivtData ? this.analyzeIVT(ivtData) : null;
    return { timestamp: new Date().toISOString(), brandSafety: brandSafetyResults, viewability: viewabilityResults, ivt: ivtResults };
  }

  async processQuery(query, context = {}) {
    const q = query.toLowerCase();
    if (q.includes('brand safety') || q.includes('safe')) return context.campaign ? this.auditBrandSafety(context.campaign) : { blockedCategories: BLOCKED_CATEGORIES, qualityVendors: QUALITY_VENDORS };
    if (q.includes('ivt') || q.includes('fraud') || q.includes('invalid traffic')) return context.ivtData ? this.analyzeIVT(context.ivtData) : { thresholds: domain.BRAND_SAFETY_RULES.ivt, vendors: QUALITY_VENDORS.ivt };
    if (q.includes('viewability') || q.includes('viewable')) return context.campaigns ? this.checkViewability(context.campaigns) : { benchmarks: domain.VIEWABILITY_RULES };
    if (q.includes('compliance') || q.includes('report') || q.includes('audit')) return context.campaigns ? this.generateComplianceReport(context.campaigns, context.ivtData) : { message: 'Provide campaign data.', action: 'fetch_campaigns' };
    return { message: 'I handle compliance and quality assurance.', capabilities: this.capabilities };
  }
}

const agent = new ComplianceAgent();
agent.BLOCKED_CATEGORIES = BLOCKED_CATEGORIES;
agent.QUALITY_VENDORS = QUALITY_VENDORS;
module.exports = agent;
