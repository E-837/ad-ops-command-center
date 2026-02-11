/**
 * Project Status Workflow
 * Get comprehensive project status including completion, blockers, and health
 */

const asanaProjectManager = require('../../agents/asana-project-manager');
const projects = require('../../database/projects');
const executions = require('../../database/executions');

const name = 'Project Status Report';
const description = 'Generate comprehensive project status including completion, blockers, and health metrics';

const STAGES = [
  { id: 'fetch', name: 'Fetch Project Data', agent: 'asana-project-manager' },
  { id: 'analyze', name: 'Analyze Health', agent: 'asana-project-manager' },
  { id: 'report', name: 'Generate Report', agent: 'asana-project-manager' }
];

/**
 * Get workflow info
 */
function getInfo() {
  return {
    name,
    description,
    stages: STAGES,
    estimatedDuration: '2-5 minutes'
  };
}

/**
 * Run the workflow
 */
async function run(params) {
  const {
    projectId,
    asanaProjectId,
    includeRiskAssessment = true,
    includeStandup = false,
    includeWeeklySummary = false
  } = params;
  
  const results = {
    workflowId: `proj-status-${Date.now()}`,
    stages: [],
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  
  try {
    // Determine which project to query
    let targetAsanaId = asanaProjectId;
    let targetProjectId = projectId;
    
    if (!targetAsanaId && projectId) {
      // Look up Asana ID from project
      const project = projects.get(projectId);
      if (project) {
        targetAsanaId = project.asanaProjectId;
        targetProjectId = project.id;
      }
    }
    
    if (!targetAsanaId) {
      throw new Error('Either projectId or asanaProjectId is required');
    }
    
    // Stage 1: Fetch Project Data
    results.stages.push(await executeFetchStage(targetAsanaId));
    const statusData = results.stages[0].output;
    
    // Stage 2: Analyze Health
    results.stages.push(await executeAnalyzeStage(statusData, targetAsanaId, includeRiskAssessment));
    const analysis = results.stages[1].output;
    
    // Stage 3: Generate Report
    results.stages.push(await executeReportStage({
      statusData,
      analysis,
      projectId: targetProjectId,
      asanaProjectId: targetAsanaId,
      includeStandup,
      includeWeeklySummary
    }));
    
    results.status = 'completed';
    results.report = results.stages[2].output;
    results.completedAt = new Date().toISOString();
    
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
    results.completedAt = new Date().toISOString();
  }
  
  return results;
}

/**
 * Stage 1: Fetch Project Data
 */
async function executeFetchStage(asanaProjectId) {
  const stage = {
    id: 'fetch',
    name: 'Fetch Project Data',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    const statusData = await asanaProjectManager.getProjectStatus(asanaProjectId);
    
    stage.status = 'completed';
    stage.output = statusData;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 2: Analyze Health
 */
async function executeAnalyzeStage(statusData, asanaProjectId, includeRiskAssessment) {
  const stage = {
    id: 'analyze',
    name: 'Analyze Health',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    const analysis = {
      overallHealth: statusData.health,
      completion: statusData.completion,
      taskBreakdown: statusData.tasks,
      concerns: []
    };
    
    // Analyze concerns
    if (statusData.tasks.overdue > 0) {
      analysis.concerns.push({
        type: 'overdue_tasks',
        severity: 'high',
        message: `${statusData.tasks.overdue} task(s) overdue`
      });
    }
    
    if (statusData.tasks.blocked > 0) {
      analysis.concerns.push({
        type: 'blocked_tasks',
        severity: 'high',
        message: `${statusData.tasks.blocked} task(s) blocked`
      });
    }
    
    if (statusData.completion < 50 && statusData.tasks.total > 20) {
      analysis.concerns.push({
        type: 'low_progress',
        severity: 'medium',
        message: 'Project has less than 50% completion'
      });
    }
    
    // Include risk assessment if requested
    if (includeRiskAssessment) {
      analysis.risks = await asanaProjectManager.identifyRisks(asanaProjectId);
    }
    
    stage.status = 'completed';
    stage.output = analysis;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

/**
 * Stage 3: Generate Report
 */
async function executeReportStage(data) {
  const stage = {
    id: 'report',
    name: 'Generate Report',
    status: 'running',
    startedAt: new Date().toISOString()
  };
  
  try {
    const report = {
      summary: {
        projectId: data.projectId,
        asanaProjectId: data.asanaProjectId,
        health: data.statusData.health,
        completion: data.statusData.completion,
        totalTasks: data.statusData.tasks.total,
        completedTasks: data.statusData.tasks.completed,
        blockedTasks: data.statusData.tasks.blocked,
        overdueTasks: data.statusData.tasks.overdue
      },
      concerns: data.analysis.concerns,
      blockers: data.statusData.blockers || [],
      recommendations: []
    };
    
    // Generate recommendations based on concerns
    if (data.analysis.concerns.length > 0) {
      report.recommendations.push('Schedule team sync to address concerns');
      
      if (data.statusData.tasks.blocked > 0) {
        report.recommendations.push('Prioritize unblocking tasks');
      }
      
      if (data.statusData.tasks.overdue > 0) {
        report.recommendations.push('Review timeline and adjust deadlines');
      }
    }
    
    // Add standup if requested
    if (data.includeStandup) {
      report.standup = await asanaProjectManager.generateStandup(data.asanaProjectId);
    }
    
    // Add weekly summary if requested
    if (data.includeWeeklySummary) {
      report.weeklySummary = await asanaProjectManager.generateWeeklySummary(data.asanaProjectId);
    }
    
    // Include risks if available
    if (data.analysis.risks) {
      report.risks = data.analysis.risks;
    }
    
    // Update project metrics in database if projectId provided
    if (data.projectId) {
      try {
        projects.updateMetrics(data.projectId, {
          completion: data.statusData.completion,
          health: data.statusData.health,
          blockers: data.statusData.blockers || []
        });
      } catch (err) {
        console.warn('Could not update project metrics:', err.message);
      }
    }
    
    stage.status = 'completed';
    stage.output = report;
    
  } catch (error) {
    stage.status = 'failed';
    stage.error = error.message;
  }
  
  stage.completedAt = new Date().toISOString();
  return stage;
}

// Metadata for new registry system
const meta = {
  id: 'project-status',
  name: 'Project Status Report',
  category: 'projects',
  description: 'Generate comprehensive project status including completion, blockers, and health metrics',
  version: '1.0.0',
  
  triggers: {
    manual: true,
    scheduled: '0 9 * * 1',  // Monday mornings for weekly review
    events: ['project.milestone.reached', 'project.risk.detected']
  },
  
  requiredConnectors: ['asana'],
  optionalConnectors: [],
  
  inputs: {
    projectId: { type: 'string', required: false, description: 'Internal project ID (will lookup Asana ID)' },
    asanaProjectId: { type: 'string', required: false, description: 'Asana project ID (provide if no internal projectId)' },
    includeRiskAssessment: { type: 'boolean', required: false, description: 'Include detailed risk assessment', default: true },
    includeStandup: { type: 'boolean', required: false, description: 'Include daily standup format', default: false },
    includeWeeklySummary: { type: 'boolean', required: false, description: 'Include weekly summary', default: false }
  },
  
  outputs: ['workflowId', 'report', 'stages'],
  
  stages: STAGES,
  estimatedDuration: '2-5 minutes',
  
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
