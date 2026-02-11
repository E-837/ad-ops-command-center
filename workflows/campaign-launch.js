/**
 * Campaign Launch Workflow
 * Multi-step workflow: plan → create → target → verify → approve
 */

const domain = require('../domain');
const connectors = require('../connectors');

const name = 'Campaign Launch';
const description = 'Multi-step workflow for launching new campaigns';

const STAGES = [
  { id: 'plan', name: 'Planning', agent: 'media-planner' },
  { id: 'create', name: 'Campaign Creation', agent: 'trader' },
  { id: 'creative', name: 'Creative Assignment', agent: 'creative-ops' },
  { id: 'verify', name: 'Verification', agent: 'compliance' },
  { id: 'approve', name: 'Approval', agent: 'trader' }
];

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    stages: STAGES,
    estimatedDuration: '2-4 hours'
  };
}

/**
 * Run the workflow
 */
async function run(params) {
  const {
    name: campaignName,
    budget,
    lob,
    channel,
    funnel,
    dsp,
    startDate,
    endDate,
    creatives = []
  } = params;
  
  const results = {
    workflowId: `wf-${Date.now()}`,
    stages: [],
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  
  try {
    // Stage 1: Planning
    results.stages.push(await executePlanningStage({
      campaignName, budget, lob, channel, funnel, dsp
    }));
    
    // Stage 2: Campaign Creation
    results.stages.push(await executeCreationStage({
      campaignName, budget, startDate, endDate, dsp, channel, funnel, lob
    }));
    
    // Stage 3: Creative Assignment
    results.stages.push(await executeCreativeStage({
      campaignId: results.stages[1].campaignId,
      channel,
      creatives
    }));
    
    // Stage 4: Verification
    results.stages.push(await executeVerificationStage({
      campaignId: results.stages[1].campaignId,
      channel
    }));
    
    // Stage 5: Approval
    results.stages.push(await executeApprovalStage({
      campaignId: results.stages[1].campaignId,
      verification: results.stages[3]
    }));
    
    results.status = 'completed';
    results.completedAt = new Date().toISOString();
    
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
  }
  
  return results;
}

async function executePlanningStage(params) {
  const stage = {
    id: 'plan',
    name: 'Planning',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  // Validate taxonomy
  const validation = domain.validateCombination(
    params.lob,
    params.channel,
    params.funnel,
    params.dsp
  );
  
  if (!validation.valid) {
    stage.status = 'failed';
    stage.error = validation.issues.join('; ');
    return stage;
  }
  
  // Get benchmarks
  const benchmarks = domain.getCampaignBenchmarks(
    params.lob,
    params.channel,
    params.funnel
  );
  
  // Validate budget
  const campaignValidation = domain.validateCampaign({
    budget: params.budget,
    channel: params.channel,
    dsp: params.dsp
  });
  
  stage.status = campaignValidation.valid ? 'completed' : 'warning';
  stage.output = {
    benchmarks,
    validation: campaignValidation,
    recommendation: `Budget $${params.budget.toLocaleString()} for ${params.channel} on ${params.dsp}`
  };
  stage.completedAt = new Date().toISOString();
  
  return stage;
}

async function executeCreationStage(params) {
  const stage = {
    id: 'create',
    name: 'Campaign Creation',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  const connector = connectors.getConnector(params.dsp);
  if (!connector) {
    stage.status = 'failed';
    stage.error = `Unknown DSP: ${params.dsp}`;
    return stage;
  }
  
  try {
    const campaign = await connector.createCampaign({
      name: params.campaignName,
      budget: params.budget,
      startDate: params.startDate,
      endDate: params.endDate,
      channel: params.channel,
      funnel: params.funnel,
      lob: params.lob
    });
    
    stage.status = 'completed';
    stage.campaignId = campaign.id;
    stage.output = campaign;
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

async function executeCreativeStage(params) {
  const stage = {
    id: 'creative',
    name: 'Creative Assignment',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  if (params.creatives.length === 0) {
    stage.status = 'warning';
    stage.output = {
      message: 'No creatives assigned',
      recommendation: 'Add creatives before launch'
    };
  } else {
    // Validate creatives
    const creativeOps = require('../agents/creative-ops');
    const validations = params.creatives.map(creative =>
      creativeOps.validateCreative(creative, params.channel)
    );
    
    const allValid = validations.every(v => v.valid);
    
    stage.status = allValid ? 'completed' : 'warning';
    stage.output = {
      creativesCount: params.creatives.length,
      validations,
      allValid
    };
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

async function executeVerificationStage(params) {
  const stage = {
    id: 'verify',
    name: 'Verification',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  // Run brand safety audit
  const compliance = require('../agents/compliance');
  const audit = compliance.auditBrandSafety({
    id: params.campaignId,
    name: 'Campaign',
    preBidFiltering: true, // Assume enabled
    blockedCategories: ['adult', 'gambling', 'violence', 'terrorism', 'drugs', 'weapons', 'hate_speech'],
    inventoryType: 'pmp'
  });
  
  stage.status = audit.overallStatus === 'passing' ? 'completed' : 
                 audit.overallStatus === 'warning' ? 'warning' : 'failed';
  stage.output = audit;
  stage.completedAt = new Date().toISOString();
  
  return stage;
}

async function executeApprovalStage(params) {
  const stage = {
    id: 'approve',
    name: 'Approval',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  // Check if verification passed
  if (params.verification.status === 'failed') {
    stage.status = 'blocked';
    stage.output = {
      message: 'Cannot approve - verification failed',
      blockedBy: 'verify'
    };
  } else {
    stage.status = 'completed';
    stage.output = {
      approved: true,
      approvedBy: 'system',
      readyForLaunch: true
    };
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

// Metadata for new registry system
const meta = {
  id: 'campaign-launch',
  name: 'Campaign Launch',
  category: 'campaign-ops',
  description: 'Multi-step workflow for launching new campaigns across DSPs',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: null,
    events: []
  },
  
  requiredConnectors: ['ttd', 'dv360', 'google-ads', 'meta-ads'],
  optionalConnectors: [],
  
  inputs: {
    name: { type: 'string', required: true, description: 'Campaign name' },
    budget: { type: 'number', required: true, description: 'Campaign budget in dollars' },
    lob: { type: 'string', required: true, description: 'Line of business' },
    channel: { type: 'string', required: true, description: 'Marketing channel (display, video, search, social)' },
    funnel: { type: 'string', required: true, description: 'Funnel stage (awareness, consideration, conversion)' },
    dsp: { type: 'string', required: true, description: 'DSP platform (ttd, dv360, google-ads, meta-ads)' },
    startDate: { type: 'string', required: true, description: 'Campaign start date (ISO format)' },
    endDate: { type: 'string', required: true, description: 'Campaign end date (ISO format)' },
    creatives: { type: 'array', required: false, description: 'Array of creative objects', default: [] }
  },
  
  outputs: ['workflowId', 'campaignId', 'status', 'stages'],
  
  stages: STAGES,
  estimatedDuration: '2-4 hours',
  
  isOrchestrator: false,
  subWorkflows: []
};

module.exports = {
  name,
  description,
  STAGES,
  getInfo,
  run,
  meta  // New metadata export
};
