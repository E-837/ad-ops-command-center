/** Creative Ops Agent */

const BaseAgent = require('./base-agent');

const CREATIVE_SPECS = {
  display: { standard: [{ size: '300x250', maxKB: 150 }, { size: '728x90', maxKB: 150 }], formats: ['jpg', 'png', 'gif', 'html5'] },
  olv: { durations: [6, 15, 30, 60], formats: ['mp4', 'webm'], maxMB: 100 },
  ctv: { durations: [15, 30], formats: ['mp4'], maxMB: 500 },
  audio: { durations: [15, 30, 60], formats: ['mp3', 'wav'] }
};

class CreativeOpsAgent extends BaseAgent {
  constructor() {
    super({
      id: 'creative-ops', name: 'Creative Ops', role: 'creative-ops',
      description: 'Creative operations agent for asset management, specs, and rotation optimization',
      model: 'claude-3-5-haiku-20241022',
      capabilities: ['asset_management', 'spec_validation', 'creative_rotation', 'format_conversion', 'performance_tracking'],
      tools: ['domain.rules', 'domain.taxonomy', 'connectors.ttd', 'connectors.dv360', 'connectors.amazon-dsp']
    });
    this.CREATIVE_SPECS = CREATIVE_SPECS;
  }

  validateCreative(creative, channel) {
    const issues = [], warnings = [];
    const specs = CREATIVE_SPECS[channel];
    if (!specs) return { valid: false, issues: [`Unknown channel: ${channel}`], warnings };
    if (channel === 'display') {
      const validSize = specs.standard.find((s) => s.size === creative.size);
      if (!validSize) issues.push(`Invalid size ${creative.size}`);
      if (creative.format && !specs.formats.includes(creative.format.toLowerCase())) issues.push(`Invalid format ${creative.format}`);
    }
    if ((channel === 'olv' || channel === 'ctv') && creative.fileSizeMB && creative.fileSizeMB > specs.maxMB) issues.push(`File exceeds ${specs.maxMB}MB`);
    return { valid: issues.length === 0, issues, warnings, specs };
  }

  getSpecs(channel) { return CREATIVE_SPECS[channel] || null; }

  analyzeCreativePerformance(creatives) {
    const analysis = creatives.map((c) => ({
      id: c.id, name: c.name, impressions: c.impressions, clicks: c.clicks,
      ctr: (c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0).toFixed(2),
      status: (c.impressions > 100000 && c.ctr < 0.05) ? 'fatigued' : (c.status || 'active')
    })).sort((a, b) => Number(b.ctr) - Number(a.ctr));
    return { creatives: analysis, summary: { totalCreatives: analysis.length, topPerformer: analysis[0], bottomPerformer: analysis[analysis.length - 1] } };
  }

  getDSPRequirements(dsp, channel) {
    const requirements = {
      ttd: { display: { clickTag: 'required' }, olv: { vastVersion: '4.0' }, ctv: { vastVersion: '4.1' } },
      dv360: { display: { dcmTracking: true }, olv: { vastVersion: '4.0' }, ctv: { vastVersion: '4.1' }, 'demand-gen': { googleApproval: 'required' } },
      'amazon-dsp': { display: { asinLinking: 'for product ads' }, olv: { vastVersion: '3.0+' }, ctv: { primeVideoSpecs: 'for Prime Video' } }
    };
    return requirements[dsp]?.[channel] || null;
  }

  async processQuery(query, context = {}) {
    const q = query.toLowerCase();
    if (q.includes('spec') || q.includes('requirement') || q.includes('size')) {
      const channel = extractChannel(query);
      if (!channel) return { allSpecs: CREATIVE_SPECS };
      return { channel, specs: this.getSpecs(channel), dspRequirements: { ttd: this.getDSPRequirements('ttd', channel), dv360: this.getDSPRequirements('dv360', channel), 'amazon-dsp': this.getDSPRequirements('amazon-dsp', channel) } };
    }
    if (q.includes('validate') || q.includes('check')) return context.creative && context.channel ? this.validateCreative(context.creative, context.channel) : { message: 'Provide creative details and channel.', action: 'provide_creative' };
    if (q.includes('performance') || q.includes('rotation') || q.includes('fatigue')) return context.creatives ? this.analyzeCreativePerformance(context.creatives) : { message: 'Provide creative performance data.', action: 'fetch_creatives' };
    return { message: 'I handle creative operations.', capabilities: this.capabilities };
  }
}

function extractChannel(query) { const q = query.toLowerCase(); if (q.includes('display') || q.includes('banner')) return 'display'; if (q.includes('video') || q.includes('olv')) return 'olv'; if (q.includes('ctv')) return 'ctv'; if (q.includes('audio')) return 'audio'; return null; }

const agent = new CreativeOpsAgent();
agent.CREATIVE_SPECS = CREATIVE_SPECS;
module.exports = agent;
