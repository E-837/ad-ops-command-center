/**
 * PRD to Asana Workflow
 * Parse a planning document and create a full Asana project with task hierarchy
 */

const asanaProjectManager = require('../../agents/asana-project-manager');
const projects = require('../../database/projects');

const name = 'PRD → Asana Project';
const description = 'Parse a planning document and create a full Asana project with task hierarchy';

const STAGES = [
  { id: 'parse', name: 'Parse Document', agent: 'asana-project-manager' },
  { id: 'structure', name: 'Structure Project', agent: 'asana-project-manager' },
  { id: 'create', name: 'Create in Asana', agent: 'asana-project-manager' },
  { id: 'verify', name: 'Verify & Link', agent: 'asana-project-manager' }
];

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    stages: STAGES,
    estimatedDuration: '5-15 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params) {
  const {
    documentUrl,
    documentText,
    projectType = 'ad-ops',
    asanaTeamId,
    templateId
  } = params;
  
  const results = {
    workflowId: `prd-asana-${Date.now()}`,
    stages: [],
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  
  try {
    // Stage 1: Parse Document
    results.stages.push(await executeParseStage({ documentUrl, documentText }));
    const parsed = results.stages[0].output;
    
    if (!parsed || results.stages[0].status === 'failed') {
      throw new Error('Document parsing failed');
    }
    
    // Stage 2: Structure Project (validation and enrichment)
    results.stages.push(await executeStructureStage(parsed, projectType));
    
    // Stage 3: Create in Asana
    results.stages.push(await executeCreateStage(parsed, { asanaTeamId, templateId }));
    const asanaResult = results.stages[2].output;
    
    // Stage 4: Verify and Link to Database
    results.stages.push(await executeVerifyStage(parsed, asanaResult, projectType));
    
    results.status = 'completed';
    results.asanaProjectId = asanaResult.asanaProjectId;
    results.asanaProjectUrl = asanaResult.asanaProjectUrl;
    results.projectId = results.stages[3].projectId;
    results.completedAt = new Date().toISOString();
    
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
    results.completedAt = new Date().toISOString();
  }
  
  return results;
}

/**
 * Stage 1: Parse Document
 */
async function executeParseStage(params) {
  const stage = {
    id: 'parse',
    name: 'Parse Document',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    let document = params.documentText;
    
    // If URL provided, would fetch document in production
    if (params.documentUrl && !document) {
      // In production: fetch from Google Docs API, Notion API, etc.
      throw new Error('Document URL fetching not yet implemented - please provide documentText');
    }
    
    if (!document) {
      throw new Error('Either documentUrl or documentText is required');
    }
    
    // Parse the document
    const parsed = await asanaProjectManager.parsePRD(document);
    
    if (!parsed.projectName) {
      stage.status = 'warning';
      stage.output = parsed;
      stage.warnings = ['Could not extract project name - will need manual input'];
    } else {
      stage.status = 'completed';
      stage.output = parsed;
    }
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 2: Structure Project
 */
async function executeStructureStage(parsed, projectType) {
  const stage = {
    id: 'structure',
    name: 'Structure Project',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    // Validate and enrich the parsed structure
    const structured = {
      ...parsed,
      projectType,
      asanaSections: [],
      asanaTasks: []
    };
    
    // Convert sections to Asana sections
    if (parsed.sections && parsed.sections.length > 0) {
      structured.asanaSections = parsed.sections.map(section => ({
        name: section.name,
        tasks: section.tasks || []
      }));
    } else {
      // Create default sections
      structured.asanaSections = [
        { name: 'Planning', tasks: [] },
        { name: 'Execution', tasks: [] },
        { name: 'QA & Review', tasks: [] },
        { name: 'Launch', tasks: [] }
      ];
    }
    
    // Convert deliverables to tasks
    if (parsed.deliverables && parsed.deliverables.length > 0) {
      structured.asanaTasks = parsed.deliverables.map(deliverable => ({
        name: deliverable,
        assignee: parsed.owner || null,
        dueDate: parsed.timeline?.endDate || null
      }));
    }
    
    stage.status = 'completed';
    stage.output = structured;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 3: Create in Asana
 */
async function executeCreateStage(parsed, options) {
  const stage = {
    id: 'create',
    name: 'Create in Asana',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    const createResult = await asanaProjectManager.createProject(parsed);
    
    if (!createResult.success) {
      throw new Error(createResult.error || 'Asana project creation failed');
    }
    
    stage.status = 'completed';
    stage.output = createResult;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 4: Verify and Link
 */
async function executeVerifyStage(parsed, asanaResult, projectType) {
  const stage = {
    id: 'verify',
    name: 'Verify & Link',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    // Create project record in database
    const project = projects.create({
      name: parsed.projectName,
      type: projectType,
      status: 'active',
      owner: parsed.owner || 'system',
      startDate: parsed.timeline?.startDate || null,
      endDate: parsed.timeline?.endDate || null,
      platform: 'asana',
      asanaProjectId: asanaResult.asanaProjectId,
      metadata: {
        sourceDocument: 'PRD',
        sections: parsed.sections?.length || 0,
        deliverables: parsed.deliverables?.length || 0
      },
      milestones: [
        {
          name: 'Project Created',
          status: 'done',
          date: new Date().toISOString().split('T')[0]
        },
        {
          name: 'Planning Complete',
          status: 'pending',
          date: null
        },
        {
          name: 'Launch',
          status: 'pending',
          date: parsed.timeline?.endDate || null
        }
      ]
    });
    
    stage.status = 'completed';
    stage.output = {
      verified: true,
      projectId: project.id,
      asanaProjectId: asanaResult.asanaProjectId,
      linkedSuccessfully: true
    };
    stage.projectId = project.id;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

// Metadata for new registry system
const meta = {
  id: 'prd-to-asana',
  name: 'PRD → Asana Project',
  category: 'projects',
  description: 'Parse a planning document and create a full Asana project with task hierarchy',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: null,
    events: ['document.created', 'document.tagged:prd']
  },
  
  requiredConnectors: ['asana'],
  optionalConnectors: ['google-docs'],
  
  inputs: {
    documentUrl: { type: 'string', required: false, description: 'URL or ID of the planning document' },
    documentText: { type: 'string', required: false, description: 'Raw document text (if URL not provided)' },
    projectType: { type: 'string', required: false, description: 'Project type (campaign/dsp-onboarding/jbp/etc)', default: 'ad-ops' },
    asanaTeamId: { type: 'string', required: false, description: 'Target Asana team ID' },
    templateId: { type: 'string', required: false, description: 'Asana project template ID' }
  },
  
  outputs: ['workflowId', 'asanaProjectId', 'asanaProjectUrl', 'projectId', 'stages'],
  
  stages: STAGES,
  estimatedDuration: '5-15 minutes',
  
  isOrchestrator: false,
  subWorkflows: []
};

module.exports = {
  name,
  description,
  STAGES,
  getInfo,
  run,
  meta
};
